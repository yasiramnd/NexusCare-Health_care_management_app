import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:google_fonts/google_fonts.dart';
import '../providers/auth_provider.dart';

class SplashScreen extends StatefulWidget {
  const SplashScreen({super.key});
  @override
  State<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends State<SplashScreen> {
  @override
  void initState() {
    super.initState();
    _navigate();
  }

  Future<void> _navigate() async {
    await Future.delayed(const Duration(seconds: 2));
    if (!mounted) return;
    final auth = context.read<AuthProvider>();
    if (auth.isLoggedIn) {
      Navigator.pushReplacementNamed(context, '/dashboard');
    } else {
      Navigator.pushReplacementNamed(context, '/login');
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF0A0D14),
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              width: 90, height: 90,
              decoration: BoxDecoration(
                gradient: const LinearGradient(
                  colors: [Color(0xFF1E6FFF), Color(0xFF0A3DB0)],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
                borderRadius: BorderRadius.circular(24),
                boxShadow: [
                  BoxShadow(color: const Color(0xFF1E6FFF).withOpacity(0.4),
                      blurRadius: 32, spreadRadius: 0),
                ],
              ),
              child: const Icon(Icons.local_hospital_rounded, color: Colors.white, size: 44),
            )
                .animate()
                .scale(duration: 600.ms, curve: Curves.easeOutBack),

            const SizedBox(height: 20),
            Text(
              'NexusCare',
              style: GoogleFonts.inter(
                  fontSize: 32, fontWeight: FontWeight.w800,
                  color: Colors.white, letterSpacing: -1),
            ).animate().fadeIn(delay: 300.ms),

            const SizedBox(height: 8),
            Text(
              'Patient Portal',
              style: GoogleFonts.inter(
                  fontSize: 14, color: const Color(0xFF6B7280)),
            ).animate().fadeIn(delay: 500.ms),

            const SizedBox(height: 48),
            const SizedBox(
              width: 24, height: 24,
              child: CircularProgressIndicator(
                strokeWidth: 2.5,
                color: Color(0xFF1E6FFF),
              ),
            ).animate().fadeIn(delay: 700.ms),
          ],
        ),
      ),
    );
  }
}
