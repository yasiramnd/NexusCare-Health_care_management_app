import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:qr_flutter/qr_flutter.dart';
import '../providers/auth_provider.dart';

class QrScreen extends StatelessWidget {
  const QrScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();
    final pid  = auth.patientId;

    return SingleChildScrollView(
      padding: const EdgeInsets.all(28),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Row(children: [
          Container(width: 40, height: 40,
              decoration: BoxDecoration(color: const Color(0xFF0891B2).withOpacity(0.15),
                  borderRadius: BorderRadius.circular(10)),
              child: const Icon(Icons.qr_code_2_rounded, color: Color(0xFF38BDF8), size: 22)),
          const SizedBox(width: 12),
          Text('QR Health Card', style: GoogleFonts.inter(
              fontSize: 22, fontWeight: FontWeight.w800, color: Colors.white)),
        ]).animate().fadeIn(),

        const SizedBox(height: 8),
        Text('Emergency responders can scan this QR code to view your health information.',
            style: GoogleFonts.inter(fontSize: 13, color: const Color(0xFF6B7280))),
        const SizedBox(height: 32),

        if (pid == null)
          Container(
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(color: const Color(0xFFD97706).withOpacity(0.1),
                borderRadius: BorderRadius.circular(14),
                border: Border.all(color: const Color(0xFFD97706).withOpacity(0.3))),
            child: Column(children: [
              const Icon(Icons.warning_amber_rounded, color: Color(0xFFD97706), size: 36),
              const SizedBox(height: 12),
              Text('Patient ID Not Set', style: GoogleFonts.inter(
                  fontSize: 15, fontWeight: FontWeight.w700, color: const Color(0xFFFCD34D))),
              const SizedBox(height: 4),
              Text('Please login again or contact support to resolve this issue.',
                  textAlign: TextAlign.center,
                  style: GoogleFonts.inter(fontSize: 13, color: const Color(0xFFFCD34D))),
            ]),
          )
        else
          Center(
            child: Column(children: [
              // QR Card
              Container(
                padding: const EdgeInsets.all(28),
                decoration: BoxDecoration(
                  gradient: const LinearGradient(
                      colors: [Color(0xFF0C1829), Color(0xFF0D2242)],
                      begin: Alignment.topLeft, end: Alignment.bottomRight),
                  borderRadius: BorderRadius.circular(24),
                  border: Border.all(color: const Color(0xFF1D4ED8).withOpacity(0.4)),
                  boxShadow: [BoxShadow(
                      color: const Color(0xFF1E6FFF).withOpacity(0.2),
                      blurRadius: 32, spreadRadius: 0)],
                ),
                child: Column(children: [
                  Row(mainAxisAlignment: MainAxisAlignment.center, children: [
                    const Icon(Icons.local_hospital_rounded, color: Color(0xFF60A5FA), size: 20),
                    const SizedBox(width: 8),
                    Text('NexusCare Emergency Card', style: GoogleFonts.inter(
                        fontWeight: FontWeight.w700, color: Colors.white, fontSize: 14)),
                  ]),
                  const SizedBox(height: 20),

                  Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(16)),
                    child: QrImageView(
                      data: 'http://localhost:5000/emergency/public/$pid',
                      version: QrVersions.auto,
                      size: 200.0,
                      backgroundColor: Colors.white,
                      foregroundColor: Colors.black,
                    ),
                  ),

                  const SizedBox(height: 20),
                  Text('Patient ID: $pid', style: GoogleFonts.inter(
                      fontSize: 13, color: const Color(0xFF93C5FD),
                      fontWeight: FontWeight.w600)),
                  const SizedBox(height: 4),
                  Text(auth.firebaseUser?.email ?? '',
                      style: GoogleFonts.inter(fontSize: 12, color: const Color(0xFF6B7280))),
                  const SizedBox(height: 12),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                    decoration: BoxDecoration(
                        color: const Color(0xFF10B981).withOpacity(0.15),
                        borderRadius: BorderRadius.circular(99),
                        border: Border.all(color: const Color(0xFF10B981).withOpacity(0.4))),
                    child: Row(mainAxisSize: MainAxisSize.min, children: [
                      const Icon(Icons.shield_outlined, size: 14, color: Color(0xFF10B981)),
                      const SizedBox(width: 6),
                      Text('Secure Health Card', style: GoogleFonts.inter(
                          fontSize: 11, color: const Color(0xFF6EE7B7),
                          fontWeight: FontWeight.w500)),
                    ]),
                  ),
                ]),
              ).animate().scale(duration: 500.ms, curve: Curves.easeOutBack).fadeIn(),

              const SizedBox(height: 28),

              // Info boxes
              _infoRow(Icons.emergency_outlined, const Color(0xFFEF4444),
                  'Emergency Access',
                  'Scan this QR to access your emergency health information without login.'),
              const SizedBox(height: 12),
              _infoRow(Icons.lock_outline_rounded, const Color(0xFF1E6FFF),
                  'Privacy Controlled',
                  'Only visible when you enable public visibility in the Emergency screen.'),
              const SizedBox(height: 12),
              _infoRow(Icons.wifi_tethering_rounded, const Color(0xFF10B981),
                  'URL Encoded',
                  'Scans to: http://localhost:5000/emergency/public/$pid'),
            ]),
          ),
      ]),
    );
  }

  Widget _infoRow(IconData icon, Color color, String title, String subtitle) =>
      Container(
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
            color: const Color(0xFF111827), borderRadius: BorderRadius.circular(12),
            border: Border.all(color: const Color(0xFF1F2937))),
        child: Row(children: [
          Container(width: 38, height: 38,
              decoration: BoxDecoration(color: color.withOpacity(0.12),
                  borderRadius: BorderRadius.circular(10)),
              child: Icon(icon, color: color, size: 20)),
          const SizedBox(width: 12),
          Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Text(title, style: GoogleFonts.inter(
                fontSize: 13, fontWeight: FontWeight.w600, color: Colors.white)),
            const SizedBox(height: 2),
            Text(subtitle, style: GoogleFonts.inter(fontSize: 12, color: const Color(0xFF6B7280))),
          ])),
        ]),
      );
}
