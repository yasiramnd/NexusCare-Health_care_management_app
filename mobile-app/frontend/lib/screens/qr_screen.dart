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
                    colors: [Color(0xFF0891B2), Color(0xFF06B6D4)],
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                  ),
                  borderRadius: BorderRadius.circular(12),
                  boxShadow: [
                    BoxShadow(
                      color: const Color(0xFF06B6D4).withOpacity(0.3),
                      blurRadius: 12,
                      offset: const Offset(0, 4),
                    ),
                  ],
                ),
                child: const Icon(Icons.qr_code_2_rounded, color: Colors.white, size: 24)),
            const SizedBox(width: 16),
            Text('QR Health Card', style: GoogleFonts.inter(
                fontSize: 26, fontWeight: FontWeight.w900, color: Colors.white, letterSpacing: -0.5)),
          ]).animate().fadeIn(),

          const SizedBox(height: 10),
          Text('Emergency responders can scan this QR code to view your health information.',
              style: GoogleFonts.inter(fontSize: 14, color: const Color(0xFF9CA3AF), fontWeight: FontWeight.w500, height: 1.5)),
          const SizedBox(height: 36),

          if (pid == null)
            Container(
              padding: const EdgeInsets.all(24),
              decoration: BoxDecoration(
                color: const Color(0xFFD97706).withOpacity(0.08),
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: const Color(0xFFD97706).withOpacity(0.4), width: 1.5),
                boxShadow: [
                  BoxShadow(
                    color: const Color(0xFFD97706).withOpacity(0.15),
                    blurRadius: 12,
                    offset: const Offset(0, 4),
                  ),
                ],
              ),
              child: Column(children: [
                const Icon(Icons.warning_amber_rounded, color: Color(0xFFD97706), size: 40),
                const SizedBox(height: 14),
                Text('Patient ID Not Set', style: GoogleFonts.inter(
                    fontSize: 16, fontWeight: FontWeight.w700, color: const Color(0xFFFCD34D), letterSpacing: 0.3)),
                const SizedBox(height: 6),
                Text('Please login again or contact support to resolve this issue.',
                    textAlign: TextAlign.center,
                    style: GoogleFonts.inter(fontSize: 14, color: const Color(0xFFFCD34D), fontWeight: FontWeight.w500, height: 1.5)),
              ]),
            )
        else
          Center(
            child: Column(children: [
              // QR Card
              Container(
                padding: const EdgeInsets.all(32),
                decoration: BoxDecoration(
                  gradient: const LinearGradient(
                      colors: [Color(0xFF0C1829), Color(0xFF0D2242)],
                      begin: Alignment.topLeft, end: Alignment.bottomRight),
                  borderRadius: BorderRadius.circular(24),
                  border: Border.all(color: const Color(0xFF1D4ED8), width: 2),
                  boxShadow: [
                    BoxShadow(
                        color: const Color(0xFF1E6FFF).withOpacity(0.3),
                        blurRadius: 32,
                        spreadRadius: 2,
                        offset: const Offset(0, 8)),
                    BoxShadow(
                        color: const Color(0xFF0891B2).withOpacity(0.15),
                        blurRadius: 20,
                        spreadRadius: 0),
                  ],
                ),
                child: Column(children: [
                  Row(mainAxisAlignment: MainAxisAlignment.center, children: [
                    Container(
                      padding: const EdgeInsets.all(6),
                      decoration: BoxDecoration(
                        color: const Color(0xFF06B6D4).withOpacity(0.15),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: const Icon(Icons.local_hospital_rounded, color: Color(0xFF38BDF8), size: 22),
                    ),
                    const SizedBox(width: 10),
                    Text('NexusCare Emergency Card', style: GoogleFonts.inter(
                        fontWeight: FontWeight.w800, color: Colors.white, fontSize: 16, letterSpacing: 0.3)),
                  ]),
                  const SizedBox(height: 24),

                  Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(18),
                        boxShadow: [
                          BoxShadow(
                            color: Colors.black.withOpacity(0.3),
                            blurRadius: 16,
                            offset: const Offset(0, 4),
                          ),
                        ]),
                    child: QrImageView(
                      data: 'http://localhost:5000/emergency/public/$pid',
                      version: QrVersions.auto,
                      size: 220.0,
                      backgroundColor: Colors.white,
                      foregroundColor: Colors.black,
                    ),
                  ),

                  const SizedBox(height: 24),
                  Text('Patient ID: $pid', style: GoogleFonts.inter(
                      fontSize: 15, color: const Color(0xFF93C5FD),
                      fontWeight: FontWeight.w700, letterSpacing: 0.2)),
                  const SizedBox(height: 6),
                  Text(auth.firebaseUser?.email ?? '',
                      style: GoogleFonts.inter(fontSize: 13, color: const Color(0xFF9CA3AF), fontWeight: FontWeight.w500)),
                  const SizedBox(height: 14),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                    decoration: BoxDecoration(
                        gradient: const LinearGradient(
                          colors: [Color(0xFF10B981), Color(0xFF059669)],
                          begin: Alignment.topLeft,
                          end: Alignment.bottomRight,
                        ),
                        borderRadius: BorderRadius.circular(99),
                        border: Border.all(color: const Color(0xFF10B981), width: 1.5),
                        boxShadow: [
                          BoxShadow(
                            color: const Color(0xFF10B981).withOpacity(0.3),
                            blurRadius: 8,
                            offset: const Offset(0, 2),
                          ),
                        ]),
                    child: Row(mainAxisSize: MainAxisSize.min, children: [
                      const Icon(Icons.shield_outlined, size: 16, color: Colors.white),
                      const SizedBox(width: 8),
                      Text('Secure Health Card', style: GoogleFonts.inter(
                          fontSize: 12, color: Colors.white,
                          fontWeight: FontWeight.w700, letterSpacing: 0.3)),
                    ]),
                  ),
                ]),
              ).animate().scale(duration: 500.ms, curve: Curves.easeOutBack).fadeIn(),

              const SizedBox(height: 32),

              // Info boxes
              _infoRow(Icons.emergency_outlined, const Color(0xFFEF4444),
                  'Emergency Access',
                  'Scan this QR to access your emergency health information without login.'),
              const SizedBox(height: 14),
              _infoRow(Icons.lock_outline_rounded, const Color(0xFF1E6FFF),
                  'Privacy Controlled',
                  'Only visible when you enable public visibility in the Emergency screen.'),
              const SizedBox(height: 14),
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
        padding: const EdgeInsets.all(18),
        decoration: BoxDecoration(
            gradient: LinearGradient(
              colors: [
                const Color(0xFF1F2937),
                const Color(0xFF111827),
              ],
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
            ),
            borderRadius: BorderRadius.circular(14),
            border: Border.all(color: const Color(0xFF2D3748), width: 1.5),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withOpacity(0.3),
                blurRadius: 12,
                offset: const Offset(0, 4),
              ),
            ]),
        child: Row(children: [
          Container(width: 44, height: 44,
              decoration: BoxDecoration(
                color: color.withOpacity(0.15),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: color.withOpacity(0.3), width: 1),
              ),
              child: Icon(icon, color: color, size: 22)),
          const SizedBox(width: 14),
          Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Text(title, style: GoogleFonts.inter(
                fontSize: 15, fontWeight: FontWeight.w700, color: Colors.white, letterSpacing: 0.2)),
            const SizedBox(height: 4),
            Text(subtitle, style: GoogleFonts.inter(
                fontSize: 13, color: const Color(0xFF9CA3AF), fontWeight: FontWeight.w500, height: 1.4)),
          ])),
        ]),
      );
}
