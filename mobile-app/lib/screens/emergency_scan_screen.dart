import 'package:flutter/material.dart';
import '../services/api_service.dart';
import '../theme/nexus_theme.dart';
import '../widgets/shared_widgets.dart';

class EmergencyScanScreen extends StatefulWidget {
  const EmergencyScanScreen({super.key});
  @override
  State<EmergencyScanScreen> createState() => _EmergencyScanScreenState();
}

class _EmergencyScanScreenState extends State<EmergencyScanScreen> {
  final _idCtrl = TextEditingController();
  Map<String, dynamic>? _data;
  bool   _loading = false;
  String? _error;

  @override
  void dispose() { _idCtrl.dispose(); super.dispose(); }

  Future<void> _fetch(String patientId) async {
    setState(() { _loading = true; _error = null; _data = null; });
    try {
      final result = await apiService.getPublicEmergencyProfile(patientId.trim());
      setState(() { _data = result['emergency_data']; _loading = false; });
    } catch (e) {
      setState(() {
        _error = 'Emergency profile not available or not enabled by the patient.';
        _loading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) => Scaffold(
    backgroundColor: NexusTheme.surface,
    appBar: AppBar(
      title: const Text('Emergency Patient Access'),
      backgroundColor: NexusTheme.emergency,
      foregroundColor: Colors.white,
    ),
    body: SingleChildScrollView(
      padding: const EdgeInsets.all(20),
      child: Column(children: [
        // Warning banner
        Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: NexusTheme.emergency.withOpacity(0.08),
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: NexusTheme.emergency.withOpacity(0.3)),
          ),
          child: const Row(children: [
            Icon(Icons.emergency, color: NexusTheme.emergency, size: 28),
            SizedBox(width: 14),
            Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Text('Emergency Access Mode', style: TextStyle(fontSize: 15, fontWeight: FontWeight.w800, color: NexusTheme.emergency)),
              Text('This screen shows critical patient data for emergency responders only. All access is audit-logged.', style: TextStyle(fontSize: 12, color: NexusTheme.textMed, height: 1.4)),
            ])),
          ]),
        ),
        const SizedBox(height: 24),

        // QR scan simulation / manual entry
        Container(
          padding: const EdgeInsets.all(20),
          decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(16), border: Border.all(color: NexusTheme.divider)),
          child: Column(children: [
            Container(
              height: 160,
              decoration: BoxDecoration(
                color: NexusTheme.surface,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: NexusTheme.divider, style: BorderStyle.solid),
              ),
              child: Stack(alignment: Alignment.center, children: [
                const Icon(Icons.qr_code_scanner, size: 64, color: NexusTheme.textLight),
                Positioned(
                  bottom: 12,
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                    decoration: BoxDecoration(color: NexusTheme.emergency.withOpacity(0.1), borderRadius: BorderRadius.circular(20)),
                    child: const Text('Camera QR Scanning', style: TextStyle(fontSize: 12, color: NexusTheme.emergency, fontWeight: FontWeight.w600)),
                  ),
                ),
              ]),
            ),
            const SizedBox(height: 16),
            const Row(children: [
              Expanded(child: Divider(color: NexusTheme.divider)),
              Padding(padding: EdgeInsets.symmetric(horizontal: 12), child: Text('or enter manually', style: TextStyle(fontSize: 12, color: NexusTheme.textLight))),
              Expanded(child: Divider(color: NexusTheme.divider)),
            ]),
            const SizedBox(height: 16),
            Row(children: [
              Expanded(
                child: TextField(
                  controller: _idCtrl,
                  decoration: const InputDecoration(
                    hintText: 'Patient ID (e.g. NEX000001)',
                    prefixIcon: Icon(Icons.badge_outlined),
                  ),
                  onSubmitted: (v) => _fetch(v),
                ),
              ),
              const SizedBox(width: 10),
              ElevatedButton(
                onPressed: _loading ? null : () => _fetch(_idCtrl.text),
                style: ElevatedButton.styleFrom(backgroundColor: NexusTheme.emergency, padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14)),
                child: _loading
                    ? const SizedBox(width: 18, height: 18, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                    : const Text('Fetch'),
              ),
            ]),
            // Quick demo button
            const SizedBox(height: 10),
            GestureDetector(
              onTap: () { _idCtrl.text = 'NEX000001'; _fetch('NEX000001'); },
              child: const Text('Demo: Load sample patient', style: TextStyle(fontSize: 12, color: NexusTheme.primary)),
            ),
          ]),
        ),

        if (_error != null) ...[
          const SizedBox(height: 20),
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(color: NexusTheme.emergency.withOpacity(0.06), borderRadius: BorderRadius.circular(12), border: Border.all(color: NexusTheme.emergency.withOpacity(0.2))),
            child: Row(children: [
              const Icon(Icons.block, color: NexusTheme.emergency),
              const SizedBox(width: 12),
              Expanded(child: Text(_error!, style: const TextStyle(color: NexusTheme.emergency, fontSize: 13))),
            ]),
          ),
        ],

        if (_data != null) ...[
          const SizedBox(height: 24),
          _buildEmergencyData(_data!),
        ],
      ]),
    ),
  );

  Widget _buildEmergencyData(Map<String, dynamic> d) {
    final allergies   = (d['allergies']          as List? ?? []);
    final conditions  = (d['chronic_conditions'] as List? ?? []);
    final medications = (d['current_medications']as List? ?? []);
    final contacts    = (d['emergency_contacts'] as List? ?? []);

    return Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      Row(children: [
        const Icon(Icons.check_circle, color: Color(0xFF00897B)),
        const SizedBox(width: 8),
        const Text('Emergency Data Retrieved', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w800, color: Color(0xFF00897B))),
      ]),
      const SizedBox(height: 16),

      // Identity & blood type - most critical
      Container(
        padding: const EdgeInsets.all(18),
        decoration: BoxDecoration(
          gradient: const LinearGradient(colors: [Color(0xFFE53935), Color(0xFFEF5350)]),
          borderRadius: BorderRadius.circular(16),
        ),
        child: Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
          Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            const Text('PATIENT', style: TextStyle(color: Colors.white70, fontSize: 11, fontWeight: FontWeight.w700)),
            Text(d['patient_name'] ?? 'Unknown', style: const TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.w800)),
          ]),
          Column(crossAxisAlignment: CrossAxisAlignment.end, children: [
            const Text('BLOOD TYPE', style: TextStyle(color: Colors.white70, fontSize: 11, fontWeight: FontWeight.w700)),
            Text(d['blood_type'] ?? '?', style: const TextStyle(color: Colors.white, fontSize: 32, fontWeight: FontWeight.w900)),
          ]),
        ]),
      ),
      const SizedBox(height: 12),

      if ((d['critical_notes'] ?? '').isNotEmpty)
        Container(
          padding: const EdgeInsets.all(14),
          decoration: BoxDecoration(color: NexusTheme.warning.withOpacity(0.1), borderRadius: BorderRadius.circular(12), border: Border.all(color: NexusTheme.warning.withOpacity(0.4))),
          child: Row(children: [
            const Icon(Icons.warning_amber_rounded, color: NexusTheme.warning, size: 20),
            const SizedBox(width: 10),
            Expanded(child: Text(d['critical_notes'], style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: NexusTheme.textDark))),
          ]),
        ),
      const SizedBox(height: 12),

      _emergencySection('⚠️ Known Allergies', allergies, NexusTheme.emergency),
      const SizedBox(height: 10),
      _emergencySection('🏥 Chronic Conditions', conditions, NexusTheme.warning),
      const SizedBox(height: 10),
      _emergencySection('💊 Current Medications', medications, NexusTheme.primary),
      const SizedBox(height: 10),

      // Emergency contacts
      Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(14), border: Border.all(color: NexusTheme.divider)),
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          const Text('📞 Emergency Contacts', style: TextStyle(fontSize: 13, fontWeight: FontWeight.w800, color: NexusTheme.textDark)),
          const SizedBox(height: 10),
          ...contacts.map<Widget>((c) => Padding(
            padding: const EdgeInsets.only(bottom: 8),
            child: Row(children: [
              const Icon(Icons.phone, color: NexusTheme.accent, size: 16),
              const SizedBox(width: 8),
              Expanded(child: Text('${c['name']} (${c['relation']})', style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600))),
              Text(c['phone'] ?? '', style: const TextStyle(fontSize: 13, color: NexusTheme.primary, fontWeight: FontWeight.w700)),
            ]),
          )),
        ]),
      ),
      const SizedBox(height: 20),

      Container(
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(color: NexusTheme.surface, borderRadius: BorderRadius.circular(10)),
        child: const Row(children: [
          Icon(Icons.info_outline, size: 14, color: NexusTheme.textLight),
          SizedBox(width: 8),
          Expanded(child: Text('This access has been audit-logged per patient consent. Data is limited to emergency-critical fields only.', style: TextStyle(fontSize: 11, color: NexusTheme.textLight))),
        ]),
      ),
    ]);
  }

  Widget _emergencySection(String title, List items, Color color) => Container(
    padding: const EdgeInsets.all(14),
    decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(12), border: Border.all(color: NexusTheme.divider)),
    child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      Text(title, style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w800)),
      const SizedBox(height: 8),
      items.isEmpty
          ? const Text('None recorded', style: TextStyle(fontSize: 13, color: NexusTheme.textLight))
          : Wrap(spacing: 6, runSpacing: 6, children: items.map<Widget>((i) => Container(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
              decoration: BoxDecoration(color: color.withOpacity(0.1), borderRadius: BorderRadius.circular(20), border: Border.all(color: color.withOpacity(0.3))),
              child: Text(i.toString(), style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: color)),
            )).toList()),
    ]),
  );
}
