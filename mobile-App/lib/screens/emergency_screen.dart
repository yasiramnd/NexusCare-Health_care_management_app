import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:flutter_animate/flutter_animate.dart';
import '../providers/auth_provider.dart';
import '../providers/patient_provider.dart';
import '../widgets/nx_text_field.dart';
import '../widgets/nx_button.dart';

class EmergencyScreen extends StatefulWidget {
  const EmergencyScreen({super.key});
  @override
  State<EmergencyScreen> createState() => _EmergencyScreenState();
}

class _EmergencyScreenState extends State<EmergencyScreen> {
  final _contactNameCtrl   = TextEditingController();
  final _contactPhoneCtrl  = TextEditingController();
  final _bloodGroupCtrl    = TextEditingController();
  final _allergiesCtrl     = TextEditingController();
  final _conditionsCtrl    = TextEditingController();
  bool _isPublic = false;
  bool _saving   = false;
  String? _error;
  String? _success;

  @override
  void initState() {
    super.initState();
  }

  @override
  void dispose() {
    _contactNameCtrl.dispose();
    _contactPhoneCtrl.dispose(); _bloodGroupCtrl.dispose();
    _allergiesCtrl.dispose(); _conditionsCtrl.dispose();
    super.dispose();
  }

  Future<void> _save() async {
    final pid = context.read<AuthProvider>().patientId;
    if (pid == null) {
      setState(() => _error = 'Patient ID is missing. Please update your profile/relogin.'); return;
    }
    setState(() { _saving = true; _error = null; _success = null; });

    final err = await context.read<PatientProvider>().updateEmergency(
      pid, {
        'contact_name':       _contactNameCtrl.text.trim(),
        'contact_phone':      _contactPhoneCtrl.text.trim(),
        'blood_group':        _bloodGroupCtrl.text.trim().isEmpty ? 'N/A' : _bloodGroupCtrl.text.trim(),
        'allergies':          _allergiesCtrl.text.trim(),
        'chronic_conditions': _conditionsCtrl.text.trim(),
        'is_public_visible':  _isPublic,
      },
    );
    setState(() {
      _saving = false;
      if (err == null) _success = 'Emergency profile saved successfully! ✅';
      else _error = err;
    });
  }

  Future<void> _toggleVisibility(bool v) async {
    final pid = context.read<AuthProvider>().patientId;
    if (pid == null) {
      setState(() => _error = 'Patient ID is missing.'); return;
    }
    setState(() => _isPublic = v);
    await context.read<PatientProvider>().toggleVisibility(pid, v);
  }

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();
    return SingleChildScrollView(
      padding: const EdgeInsets.all(28),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Row(children: [
          Container(width: 40, height: 40,
              decoration: BoxDecoration(color: const Color(0xFFEF4444).withOpacity(0.15),
                  borderRadius: BorderRadius.circular(10)),
              child: const Icon(Icons.emergency_rounded, color: Color(0xFFF87171), size: 22)),
          const SizedBox(width: 12),
          Text('Emergency Profile', style: GoogleFonts.inter(
              fontSize: 22, fontWeight: FontWeight.w800, color: Colors.white)),
        ]).animate().fadeIn(),

        const SizedBox(height: 8),
        Text('This information will be visible to emergency responders when scanning your QR code.',
            style: GoogleFonts.inter(fontSize: 13, color: const Color(0xFF6B7280))),
        const SizedBox(height: 24),

        // Important: Patient ID
        Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
              color: const Color(0xFF1E6FFF).withOpacity(0.08),
              borderRadius: BorderRadius.circular(14),
              border: Border.all(color: const Color(0xFF1E6FFF).withOpacity(0.3))),
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Row(children: [
              const Icon(Icons.badge_outlined, color: Color(0xFF60A5FA), size: 18),
              const SizedBox(width: 8),
              Text('Your Patient ID', style: GoogleFonts.inter(
                  fontSize: 13, fontWeight: FontWeight.w600, color: const Color(0xFF60A5FA))),
            ]),
            const SizedBox(height: 10),
            Text(
              auth.patientId ?? 'Not Set — Please Login Again',
              style: GoogleFonts.inter(fontSize: 24, fontWeight: FontWeight.bold, color: Colors.white),
            ),
            const SizedBox(height: 6),
            Text('Your Patient ID is automatically linked to your account.',
                style: GoogleFonts.inter(fontSize: 11, color: const Color(0xFF6B7280))),
          ]),
        ).animate().fadeIn(delay: 100.ms).slideY(begin: 0.1),

        const SizedBox(height: 20),

        // Emergency info form
        Container(
          padding: const EdgeInsets.all(20),
          decoration: BoxDecoration(color: const Color(0xFF111827),
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: const Color(0xFF1F2937))),
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Text('Emergency Contact', style: GoogleFonts.inter(
                fontSize: 14, fontWeight: FontWeight.w700, color: Colors.white)),
            const SizedBox(height: 16),

            Row(children: [
              Expanded(child: NxTextField(
                controller: _contactNameCtrl, label: 'Contact Name', hint: 'Jane Doe',
                icon: Icons.person_outline,
              )),
              const SizedBox(width: 12),
              Expanded(child: NxTextField(
                controller: _contactPhoneCtrl, label: 'Contact Phone', hint: '+94 77 000 0000',
                icon: Icons.phone_outlined, keyboardType: TextInputType.phone,
              )),
            ]),
            const SizedBox(height: 20),

            Text('Medical Info', style: GoogleFonts.inter(
                fontSize: 14, fontWeight: FontWeight.w700, color: Colors.white)),
            const SizedBox(height: 16),

            NxTextField(
              controller: _bloodGroupCtrl, label: 'Blood Group', hint: 'e.g. O+',
              icon: Icons.bloodtype_outlined,
            ),
            const SizedBox(height: 12),
            NxTextField(
              controller: _allergiesCtrl, label: 'Known Allergies',
              hint: 'e.g. Penicillin, Peanuts',
              icon: Icons.warning_amber_outlined, maxLines: 2,
            ),
            const SizedBox(height: 12),
            NxTextField(
              controller: _conditionsCtrl, label: 'Chronic Conditions',
              hint: 'e.g. Diabetes Type 2, Hypertension',
              icon: Icons.medical_information_outlined, maxLines: 2,
            ),
          ]),
        ).animate().fadeIn(delay: 200.ms).slideY(begin: 0.1),

        const SizedBox(height: 20),

        // Public visibility toggle
        Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(color: const Color(0xFF111827),
              borderRadius: BorderRadius.circular(14),
              border: Border.all(color: const Color(0xFF1F2937))),
          child: Row(children: [
            Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Text('Make Profile Public', style: GoogleFonts.inter(
                  fontSize: 14, fontWeight: FontWeight.w600, color: Colors.white)),
              const SizedBox(height: 2),
              Text('Allows emergency responders to scan your QR card and view this profile.',
                  style: GoogleFonts.inter(fontSize: 12, color: const Color(0xFF6B7280))),
            ])),
            Switch(
              value: _isPublic,
              onChanged: _toggleVisibility,
              activeColor: const Color(0xFF1E6FFF),
            ),
          ]),
        ).animate().fadeIn(delay: 300.ms),

        const SizedBox(height: 20),

        if (_error != null)
          Container(
            padding: const EdgeInsets.all(12),
            margin: const EdgeInsets.only(bottom: 12),
            decoration: BoxDecoration(
                color: const Color(0xFFEF4444).withOpacity(0.12),
                borderRadius: BorderRadius.circular(10),
                border: Border.all(color: const Color(0xFFEF4444).withOpacity(0.4))),
            child: Text(_error!, style: GoogleFonts.inter(fontSize: 13, color: const Color(0xFFFCA5A5))),
          ),
        if (_success != null)
          Container(
            padding: const EdgeInsets.all(12),
            margin: const EdgeInsets.only(bottom: 12),
            decoration: BoxDecoration(
                color: const Color(0xFF10B981).withOpacity(0.12),
                borderRadius: BorderRadius.circular(10),
                border: Border.all(color: const Color(0xFF10B981).withOpacity(0.4))),
            child: Text(_success!, style: GoogleFonts.inter(fontSize: 13, color: const Color(0xFF6EE7B7))),
          ),

        NxButton(
          label: 'Save Emergency Profile',
          loading: _saving,
          icon: Icons.save_outlined,
          onPressed: _save,
        ).animate().fadeIn(delay: 400.ms),
      ]),
    );
  }
}
