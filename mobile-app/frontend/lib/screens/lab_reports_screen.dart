import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:url_launcher/url_launcher.dart';
import '../providers/auth_provider.dart';
import '../providers/patient_provider.dart';

class LabReportsScreen extends StatefulWidget {
  const LabReportsScreen({super.key});
  @override
  State<LabReportsScreen> createState() => _LabReportsScreenState();
}

class _LabReportsScreenState extends State<LabReportsScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) => _load());
  }

  Future<void> _load() async {
    final pid = context.read<AuthProvider>().patientId;
    if (pid == null) return;
    await context.read<PatientProvider>().loadLabReports(pid);
  }

  @override
  Widget build(BuildContext context) {
    final provider = context.watch<PatientProvider>();
    final auth     = context.watch<AuthProvider>();

    return Container(
      decoration: const BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topCenter,
          end: Alignment.bottomCenter,
          colors: [Color(0xFF0F172A), Color(0xFF111827)],
        ),
      ),
      child: SingleChildScrollView(
        padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 32),
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Row(children: [
            Container(width: 48, height: 48,
                decoration: BoxDecoration(
                  gradient: const LinearGradient(
                    colors: [Color(0xFFD97706), Color(0xFFFCD34D)],
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                  ),
                  borderRadius: BorderRadius.circular(12),
                  boxShadow: [
                    BoxShadow(
                      color: const Color(0xFFFCD34D).withOpacity(0.3),
                      blurRadius: 12,
                      offset: const Offset(0, 4),
                    ),
                  ]),
                child: const Icon(Icons.science_rounded, color: Colors.white, size: 24)),
            const SizedBox(width: 16),
            Expanded(child: Text('Lab Reports', style: GoogleFonts.inter(
                fontSize: 26, fontWeight: FontWeight.w900, color: Colors.white, letterSpacing: -0.5))),
            Container(
              decoration: BoxDecoration(
                color: const Color(0xFF1F2937),
                borderRadius: BorderRadius.circular(10),
              ),
              child: IconButton(
                icon: const Icon(Icons.refresh_rounded, color: Color(0xFF9CA3AF), size: 22),
                onPressed: _load,
              ),
            ),
          ]).animate().fadeIn(),

          const SizedBox(height: 28),

          if (auth.patientId == null)
            Container(
              padding: const EdgeInsets.all(18),
              decoration: BoxDecoration(
                color: const Color(0xFFD97706).withOpacity(0.08),
                borderRadius: BorderRadius.circular(14),
                border: Border.all(color: const Color(0xFFD97706).withOpacity(0.4), width: 1.5),
                boxShadow: [
                  BoxShadow(
                    color: const Color(0xFFD97706).withOpacity(0.15),
                    blurRadius: 12,
                    offset: const Offset(0, 4),
                  ),
                ],
              ),
              child: Row(children: [
                Container(
                  padding: const EdgeInsets.all(6),
                  decoration: BoxDecoration(
                    color: const Color(0xFFD97706).withOpacity(0.2),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: const Icon(Icons.warning_amber_rounded, color: Color(0xFFD97706), size: 22),
                ),
                const SizedBox(width: 12),
                Expanded(child: Text('Patient ID is missing. Please login again or contact support.',
                    style: GoogleFonts.inter(fontSize: 14, color: const Color(0xFFFCD34D), fontWeight: FontWeight.w600, height: 1.4))),
              ]),
            )
          else if (provider.loading)
            const Center(child: Padding(padding: EdgeInsets.only(top: 60),
                child: CircularProgressIndicator(color: Color(0xFF1E6FFF))))
          else if (provider.labReports.isEmpty)
            Center(child: Padding(
              padding: const EdgeInsets.only(top: 60),
              child: Column(children: [
                const Icon(Icons.science_outlined, size: 52, color: Color(0xFF374151)),
                const SizedBox(height: 12),
                Text('No lab reports found.',
                    style: GoogleFonts.inter(fontSize: 15, color: const Color(0xFF9CA3AF), fontWeight: FontWeight.w600)),
              ]),
            ))
          else
            ...provider.labReports.asMap().entries.map((e) =>
                _LabCard(report: e.value)
                    .animate().fadeIn(delay: Duration(milliseconds: 80 * e.key))
                    .slideY(begin: 0.1)),
        ]),
      ),
    );
  }
}

class _LabCard extends StatelessWidget {
  final Map<String, dynamic> report;
  const _LabCard({required this.report});

  @override
  Widget build(BuildContext context) {
    final fileUrl = report['file_url']?.toString();
    return Container(
      margin: const EdgeInsets.only(bottom: 14),
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
          color: const Color(0xFF111827), borderRadius: BorderRadius.circular(16),
          border: Border.all(color: const Color(0xFF1F2937))),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Row(children: [
          Container(
            width: 40, height: 40,
            decoration: BoxDecoration(
                color: const Color(0xFFD97706).withOpacity(0.12),
                borderRadius: BorderRadius.circular(10)),
            child: const Icon(Icons.science_outlined, color: Color(0xFFFCD34D), size: 22),
          ),
          const SizedBox(width: 12),
          Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Text(report['test_name']?.toString() ?? '—',
                style: GoogleFonts.inter(fontSize: 15, fontWeight: FontWeight.w700, color: Colors.white)),
            Text('Lab: ${report['lab_name'] ?? '—'}',
                style: GoogleFonts.inter(fontSize: 12, color: const Color(0xFF6B7280))),
          ])),
          Text(report['report_date']?.toString().split('T').first ?? '',
              style: GoogleFonts.inter(fontSize: 12, color: const Color(0xFF6B7280))),
        ]),
        const SizedBox(height: 10),
        Row(children: [
          const Icon(Icons.person_outline, size: 14, color: Color(0xFF6B7280)),
          const SizedBox(width: 4),
          Text('Dr. ${report['doctor_name'] ?? '—'}',
              style: GoogleFonts.inter(fontSize: 12, color: const Color(0xFF6B7280))),
        ]),
        if (fileUrl != null && fileUrl.isNotEmpty) ...[
          const SizedBox(height: 14),
          OutlinedButton.icon(
            icon: const Icon(Icons.open_in_new_rounded, size: 16),
            label: Text('View Report', style: GoogleFonts.inter(fontSize: 13)),
            style: OutlinedButton.styleFrom(
                foregroundColor: const Color(0xFFFCD34D),
                side: const BorderSide(color: Color(0xFFD97706)),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8))),
            onPressed: () async {
              final uri = Uri.parse(fileUrl);
              if (await canLaunchUrl(uri)) await launchUrl(uri);
            },
          ),
        ],
      ]),
    );
  }
}
