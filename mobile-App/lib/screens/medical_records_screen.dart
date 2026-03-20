import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:flutter_animate/flutter_animate.dart';
import '../providers/auth_provider.dart';
import '../providers/patient_provider.dart';

class MedicalRecordsScreen extends StatefulWidget {
  const MedicalRecordsScreen({super.key});
  @override
  State<MedicalRecordsScreen> createState() => _MedicalRecordsScreenState();
}

class _MedicalRecordsScreenState extends State<MedicalRecordsScreen> {
  

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) => _load());
  }

  Future<void> _load() async {
    final auth = context.read<AuthProvider>();
    final pid  = auth.patientId;
    if (pid == null) return;
    await context.read<PatientProvider>().loadMedicalRecords(pid);
    
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
              decoration: BoxDecoration(
                  color: const Color(0xFF059669).withOpacity(0.15),
                  borderRadius: BorderRadius.circular(10)),
              child: const Icon(Icons.folder_open_rounded, color: Color(0xFF34D399), size: 22)),
          const SizedBox(width: 12),
          Text('Medical Records', style: GoogleFonts.inter(
              fontSize: 22, fontWeight: FontWeight.w800, color: Colors.white)),
          const Spacer(),
          IconButton(
            icon: const Icon(Icons.refresh_rounded, color: Color(0xFF6B7280)),
            onPressed: _load, tooltip: 'Refresh',
          ),
        ]).animate().fadeIn(),

        if (auth.patientId == null) ...[
          const SizedBox(height: 24),
          _noIdBox(),
        ] else if (provider.loading) ...[
          const SizedBox(height: 60),
          const Center(child: CircularProgressIndicator(color: Color(0xFF1E6FFF))),
        ] else if (provider.error != null) ...[
          const SizedBox(height: 24),
          _errorBox(provider.error!),
        ] else if (provider.medicalRecords.isEmpty) ...[
          const SizedBox(height: 60),
          _empty('No medical records found.', Icons.folder_open_outlined),
        ] else ...[
          const SizedBox(height: 24),
          Text('${provider.medicalRecords.length} record(s) found',
              style: GoogleFonts.inter(fontSize: 13, color: const Color(0xFF6B7280))),
          const SizedBox(height: 16),
          ...provider.medicalRecords.asMap().entries.map((e) =>
              _RecordCard(record: e.value)
                  .animate().fadeIn(delay: Duration(milliseconds: 80 * e.key))
                  .slideY(begin: 0.1)),
        ],
      ]),
    );
  }

  Widget _noIdBox() => Container(
    padding: const EdgeInsets.all(20),
    decoration: BoxDecoration(
      color: const Color(0xFFD97706).withOpacity(0.1),
      borderRadius: BorderRadius.circular(14),
      border: Border.all(color: const Color(0xFFD97706).withOpacity(0.3)),
    ),
    child: Row(children: [
      const Icon(Icons.warning_amber_rounded, color: Color(0xFFD97706), size: 24),
      const SizedBox(width: 12),
      Expanded(child: Text(
          'Please set your Patient ID in the Emergency screen first to view medical records.',
          style: GoogleFonts.inter(fontSize: 13, color: const Color(0xFFFCD34D)))),
    ]),
  );
  Widget _errorBox(String e) => Container(
    padding: const EdgeInsets.all(14),
    decoration: BoxDecoration(color: const Color(0xFFEF4444).withOpacity(0.1),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: const Color(0xFFEF4444).withOpacity(0.3))),
    child: Text(e, style: GoogleFonts.inter(fontSize: 13, color: const Color(0xFFFCA5A5))),
  );
  Widget _empty(String msg, IconData icon) => Center(
    child: Column(children: [
      Icon(icon, size: 52, color: const Color(0xFF374151)),
      const SizedBox(height: 12),
      Text(msg, style: GoogleFonts.inter(fontSize: 15, color: const Color(0xFF6B7280))),
    ]),
  );
}

class _RecordCard extends StatelessWidget {
  final Map<String, dynamic> record;
  const _RecordCard({required this.record});

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 14),
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: const Color(0xFF111827),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFF1F2937)),
      ),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Row(children: [
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
            decoration: BoxDecoration(
                color: const Color(0xFF1E6FFF).withOpacity(0.15),
                borderRadius: BorderRadius.circular(99)),
            child: Text(record['diagnosis']?.toString() ?? 'Diagnosis',
                style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.w700,
                    color: const Color(0xFF60A5FA))),
          ),
          const Spacer(),
          Text(record['visit_date']?.toString().split('T').first ?? '',
              style: GoogleFonts.inter(fontSize: 12, color: const Color(0xFF6B7280))),
        ]),
        const SizedBox(height: 12),
        if (record['notes'] != null && record['notes'].toString().isNotEmpty)
          Text(record['notes'].toString(),
              style: GoogleFonts.inter(fontSize: 13, color: const Color(0xFF9CA3AF), height: 1.5)),
        const SizedBox(height: 10),
        Row(children: [
          const Icon(Icons.person_outline, size: 14, color: Color(0xFF6B7280)),
          const SizedBox(width: 4),
          Text('Dr. ${record['doctor_name'] ?? '—'}',
              style: GoogleFonts.inter(fontSize: 12, color: const Color(0xFF6B7280))),
          const SizedBox(width: 12),
          const Icon(Icons.medical_services_outlined, size: 14, color: Color(0xFF6B7280)),
          const SizedBox(width: 4),
          Text(record['specialization']?.toString() ?? '',
              style: GoogleFonts.inter(fontSize: 12, color: const Color(0xFF6B7280))),
        ]),
      ]),
    );
  }
}
