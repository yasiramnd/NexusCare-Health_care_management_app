import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:flutter_animate/flutter_animate.dart';
import '../providers/auth_provider.dart';
import '../providers/patient_provider.dart';
import '../widgets/nx_button.dart';

class PrescriptionsScreen extends StatefulWidget {
  const PrescriptionsScreen({super.key});
  @override
  State<PrescriptionsScreen> createState() => _PrescriptionsScreenState();
}

class _PrescriptionsScreenState extends State<PrescriptionsScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) => _load());
  }

  Future<void> _load() async {
    final pid = context.read<AuthProvider>().patientId;
    if (pid == null) return;
    await context.read<PatientProvider>().loadPrescriptions(pid);
  }

  void _openOrder(BuildContext context, Map<String, dynamic> rx) {
    final auth    = context.read<AuthProvider>();
    final pharmId = TextEditingController();
    final colTime = TextEditingController();
    String orderType = 'normal';
    bool loading = false;
    String? err;

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: const Color(0xFF111827),
      shape: const RoundedRectangleBorder(
          borderRadius: BorderRadius.vertical(top: Radius.circular(24))),
      builder: (_) => StatefulBuilder(
        builder: (ctx, setS) => Padding(
          padding: EdgeInsets.only(
              left: 24, right: 24, top: 24,
              bottom: MediaQuery.of(ctx).viewInsets.bottom + 24),
          child: Column(mainAxisSize: MainAxisSize.min, children: [
            Container(width: 40, height: 4,
                decoration: BoxDecoration(color: const Color(0xFF374151),
                    borderRadius: BorderRadius.circular(99))),
            const SizedBox(height: 20),
            Text('Order Medicine', style: GoogleFonts.inter(
                fontSize: 18, fontWeight: FontWeight.w700, color: Colors.white)),
            const SizedBox(height: 4),
            Text('${rx['medicine_name']} • ${rx['dosage']}',
                style: GoogleFonts.inter(fontSize: 13, color: const Color(0xFF6B7280))),
            const SizedBox(height: 20),

            // order type toggle
            Row(children: ['normal', 'priority'].map((t) {
              final sel = orderType == t;
              return Expanded(child: GestureDetector(
                onTap: () => setS(() => orderType = t),
                child: AnimatedContainer(
                  duration: const Duration(milliseconds: 200),
                  margin: const EdgeInsets.symmetric(horizontal: 4),
                  padding: const EdgeInsets.symmetric(vertical: 12),
                  decoration: BoxDecoration(
                    color: sel ? const Color(0xFF1E6FFF) : const Color(0xFF1F2937),
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: Center(child: Text(
                    t[0].toUpperCase() + t.substring(1),
                    style: GoogleFonts.inter(
                        fontWeight: FontWeight.w600, color: sel ? Colors.white : const Color(0xFF6B7280)),
                  )),
                ),
              ));
            }).toList()),

            const SizedBox(height: 16),
            TextField(
              controller: pharmId,
              style: GoogleFonts.inter(color: Colors.white),
              decoration: InputDecoration(
                labelText: 'Pharmacy ID', hintText: 'e.g. 1',
                prefixIcon: const Icon(Icons.local_pharmacy_outlined, size: 18),
                filled: true, fillColor: const Color(0xFF1F2937),
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(10),
                    borderSide: const BorderSide(color: Color(0xFF374151))),
                enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(10),
                    borderSide: const BorderSide(color: Color(0xFF374151))),
              ),
            ),

            if (orderType == 'priority') ...[
              const SizedBox(height: 12),
              TextField(
                controller: colTime,
                style: GoogleFonts.inter(color: Colors.white),
                decoration: InputDecoration(
                  labelText: 'Collecting Time', hintText: 'e.g. 14:30',
                  prefixIcon: const Icon(Icons.access_time_outlined, size: 18),
                  filled: true, fillColor: const Color(0xFF1F2937),
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(10),
                      borderSide: const BorderSide(color: Color(0xFF374151))),
                  enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(10),
                      borderSide: const BorderSide(color: Color(0xFF374151))),
                ),
              ),
            ],

            if (err != null) ...[
              const SizedBox(height: 12),
              Text(err!, style: GoogleFonts.inter(color: const Color(0xFFFCA5A5), fontSize: 13)),
            ],
            const SizedBox(height: 20),

            NxButton(
              label: 'Place Order',
              loading: loading,
              icon: Icons.shopping_cart_outlined,
              onPressed: () async {
                if (pharmId.text.isEmpty) {
                  setS(() => err = 'Pharmacy ID is required'); return;
                }
                setS(() => loading = true);
                final e = await context.read<PatientProvider>().orderMedicine({
                  'order_type':       orderType,
                  'patient_id':       auth.patientId ?? '',
                  'prescription_id':  rx['prescription_id']?.toString() ?? '',
                  'pharmacy_id':      pharmId.text.trim(),
                  if (orderType == 'priority') 'collecting_time': colTime.text.trim(),
                });
                if (e == null) {
                  Navigator.pop(ctx);
                  ScaffoldMessenger.of(context).showSnackBar(SnackBar(
                    content: Text('Order placed! ✅', style: GoogleFonts.inter()),
                    backgroundColor: const Color(0xFF10B981),
                    behavior: SnackBarBehavior.floating,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                    margin: const EdgeInsets.all(16),
                  ));
                } else {
                  setS(() { loading = false; err = e; });
                }
              },
            ),
          ]),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final provider = context.watch<PatientProvider>();
    final auth     = context.watch<AuthProvider>();

    return SingleChildScrollView(
      padding: const EdgeInsets.all(28),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Row(children: [
          Container(width: 40, height: 40,
              decoration: BoxDecoration(color: const Color(0xFF7C3AED).withOpacity(0.15),
                  borderRadius: BorderRadius.circular(10)),
              child: const Icon(Icons.medication_rounded, color: Color(0xFFA78BFA), size: 22)),
          const SizedBox(width: 12),
          Text('Prescriptions', style: GoogleFonts.inter(
              fontSize: 22, fontWeight: FontWeight.w800, color: Colors.white)),
          const Spacer(),
          IconButton(icon: const Icon(Icons.refresh_rounded, color: Color(0xFF6B7280)),
              onPressed: _load, tooltip: 'Refresh'),
        ]),

        const SizedBox(height: 24),

        if (auth.patientId == null)
          _warnBox()
        else if (provider.loading)
          const Center(child: Padding(
            padding: EdgeInsets.only(top: 60),
            child: CircularProgressIndicator(color: Color(0xFF1E6FFF))))
        else if (provider.prescriptions.isEmpty)
          _empty()
        else
          ...provider.prescriptions.asMap().entries.map((e) =>
              _RxCard(rx: e.value, onOrder: () => _openOrder(context, e.value))
                  .animate().fadeIn(delay: Duration(milliseconds: 80 * e.key))
                  .slideY(begin: 0.1)),
      ]),
    );
  }

  Widget _warnBox() => Container(
    padding: const EdgeInsets.all(16),
    decoration: BoxDecoration(
        color: const Color(0xFFD97706).withOpacity(0.1),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: const Color(0xFFD97706).withOpacity(0.3))),
    child: Text('Patient ID is missing. Please login again or contact support.',
        style: GoogleFonts.inter(fontSize: 13, color: const Color(0xFFFCD34D))),
  );
  Widget _empty() => Center(child: Padding(
    padding: const EdgeInsets.only(top: 60),
    child: Column(children: [
      const Icon(Icons.medication_outlined, size: 52, color: Color(0xFF374151)),
      const SizedBox(height: 12),
      Text('No prescriptions found.', style: GoogleFonts.inter(color: const Color(0xFF6B7280))),
    ]),
  ));
}

class _RxCard extends StatelessWidget {
  final Map<String, dynamic> rx;
  final VoidCallback onOrder;
  const _RxCard({required this.rx, required this.onOrder});

  @override
  Widget build(BuildContext context) {
    final status = rx['status']?.toString() ?? '';
    final statusColors = {
      'Active':    const Color(0xFF10B981),
      'Completed': const Color(0xFF6B7280),
      'Cancelled': const Color(0xFFEF4444),
    };
    final sColor = statusColors[status] ?? const Color(0xFF60A5FA);

    return Container(
      margin: const EdgeInsets.only(bottom: 14),
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
          color: const Color(0xFF111827), borderRadius: BorderRadius.circular(16),
          border: Border.all(color: const Color(0xFF1F2937))),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Row(children: [
          Expanded(child: Text(rx['medicine_name']?.toString() ?? '—',
              style: GoogleFonts.inter(fontSize: 16, fontWeight: FontWeight.w700, color: Colors.white))),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
            decoration: BoxDecoration(
                color: sColor.withOpacity(0.15), borderRadius: BorderRadius.circular(99),
                border: Border.all(color: sColor.withOpacity(0.4))),
            child: Text(status, style: GoogleFonts.inter(
                fontSize: 11, fontWeight: FontWeight.w600, color: sColor)),
          ),
        ]),
        const SizedBox(height: 10),
        _row('Dosage', rx['dosage']),
        _row('Frequency', rx['frequency']),
        _row('Duration', '${rx['duration_days'] ?? '—'} days'),
        _row('Prescribed by', 'Dr. ${rx['doctor_name'] ?? '—'}'),
        const SizedBox(height: 14),
        Row(children: [
          OutlinedButton.icon(
            icon: const Icon(Icons.shopping_cart_outlined, size: 16),
            label: Text('Order', style: GoogleFonts.inter(fontSize: 13)),
            style: OutlinedButton.styleFrom(
              foregroundColor: const Color(0xFF60A5FA),
              side: const BorderSide(color: Color(0xFF1D4ED8)),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
            ),
            onPressed: onOrder,
          ),
        ]),
      ]),
    );
  }

  Widget _row(String k, dynamic v) => Padding(
    padding: const EdgeInsets.only(bottom: 4),
    child: Row(children: [
      Text('$k: ', style: GoogleFonts.inter(fontSize: 13, color: const Color(0xFF6B7280))),
      Text(v?.toString() ?? '—', style: GoogleFonts.inter(fontSize: 13, color: const Color(0xFFD1D5DB))),
    ]),
  );
}
