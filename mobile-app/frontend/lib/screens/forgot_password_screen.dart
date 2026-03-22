import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:flutter_animate/flutter_animate.dart';
import '../providers/auth_provider.dart';
import '../widgets/nx_text_field.dart';
import '../widgets/nx_button.dart';

class ForgotPasswordScreen extends StatefulWidget {
  const ForgotPasswordScreen({super.key});

  @override
  State<ForgotPasswordScreen> createState() => _ForgotPasswordScreenState();
}

class _ForgotPasswordScreenState extends State<ForgotPasswordScreen> {
  final _formKey = GlobalKey<FormState>();
  final _emailCtrl = TextEditingController();
  final _passCtrl = TextEditingController();
  final _confirmPassCtrl = TextEditingController();

  bool _passVisible = false;
  bool _confirmPassVisible = false;

  @override
  void dispose() {
    _emailCtrl.dispose();
    _passCtrl.dispose();
    _confirmPassCtrl.dispose();
    super.dispose();
  }

  String? _validatePassword(String? v) {
    if (v == null || v.isEmpty) return 'Password is required';
    if (v.length < 8) return 'Minimum 8 characters';
    if (!RegExp(r'[A-Z]').hasMatch(v)) return 'Must contain uppercase letter';
    if (!RegExp(r'[a-z]').hasMatch(v)) return 'Must contain lowercase letter';
    if (!RegExp(r'\d').hasMatch(v)) return 'Must contain a digit';
    if (!RegExp(r'[!@#$%^&*(),.?":{}|<>]').hasMatch(v)) return 'Must contain special char';
    return null;
  }

  Future<void> _handleReset() async {
    if (!_formKey.currentState!.validate()) return;
    
    final auth = context.read<AuthProvider>();
    final error = await auth.resetPassword(
      _emailCtrl.text.trim(),
      _passCtrl.text.trim(),
    );

    if (error == null && mounted) {
      _showSuccessDialog();
    } else if (mounted) {
      _showSnack(error ?? 'Failed to reset password');
    }
  }

  void _showSuccessDialog() {
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (ctx) => AlertDialog(
        backgroundColor: const Color(0xFF1F2937),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: Text('Success', style: GoogleFonts.inter(color: Colors.white, fontWeight: FontWeight.bold)),
        content: Text(
          'Your password has been reset successfully. You can now log in with your new password.',
          style: GoogleFonts.inter(color: const Color(0xFFD1D5DB)),
        ),
        actions: [
          TextButton(
            onPressed: () {
              Navigator.pop(ctx); // pop dialog
              Navigator.pop(context); // go back to login
            },
            child: Text('Go to Login', style: GoogleFonts.inter(color: const Color(0xFF60A5FA))),
          ),
        ],
      ),
    );
  }

  void _showSnack(String msg) {
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(
      content: Text(msg, style: GoogleFonts.inter()),
      backgroundColor: const Color(0xFFEF4444),
      behavior: SnackBarBehavior.floating,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
      margin: const EdgeInsets.all(16),
    ));
  }

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();

    return Scaffold(
      backgroundColor: const Color(0xFF0A0D14),
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: Colors.white),
          onPressed: () => Navigator.pop(context),
        ),
      ),
      body: Stack(
        children: [
          _glowBlob(400, const Color(0xFF1E6FFF), top: -120, left: -120),
          _glowBlob(300, const Color(0xFF0A3DB0), bottom: -80, right: -80),
          Center(
            child: SingleChildScrollView(
              padding: const EdgeInsets.all(36),
              child: ConstrainedBox(
                constraints: const BoxConstraints(maxWidth: 420),
                child: Form(
                  key: _formKey,
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text('Reset Password', style: GoogleFonts.inter(
                          fontSize: 28, fontWeight: FontWeight.w800, color: Colors.white)),
                      const SizedBox(height: 8),
                      Text('Enter your email and a strong new password.', style: GoogleFonts.inter(
                          fontSize: 14, color: const Color(0xFF9CA3AF))),
                      const SizedBox(height: 32),

                      NxTextField(
                        controller: _emailCtrl,
                        label: 'Email Address',
                        hint: 'patient@email.com',
                        icon: Icons.email_outlined,
                        validator: (v) => (v == null || !v.contains('@')) ? 'Enter valid email' : null,
                      ),
                      const SizedBox(height: 16),

                      NxTextField(
                        controller: _passCtrl,
                        label: 'New Password',
                        hint: '••••••••',
                        obscureText: !_passVisible,
                        icon: Icons.lock_outline,
                        suffixIcon: IconButton(
                          icon: Icon(
                            _passVisible ? Icons.visibility_off_outlined : Icons.visibility_outlined,
                            color: const Color(0xFF6B7280), size: 20,
                          ),
                          onPressed: () => setState(() => _passVisible = !_passVisible),
                        ),
                        validator: _validatePassword,
                      ),
                      const SizedBox(height: 16),

                      NxTextField(
                        controller: _confirmPassCtrl,
                        label: 'Confirm New Password',
                        hint: '••••••••',
                        obscureText: !_confirmPassVisible,
                        icon: Icons.lock_clock_outlined,
                        suffixIcon: IconButton(
                          icon: Icon(
                            _confirmPassVisible ? Icons.visibility_off_outlined : Icons.visibility_outlined,
                            color: const Color(0xFF6B7280), size: 20,
                          ),
                          onPressed: () => setState(() => _confirmPassVisible = !_confirmPassVisible),
                        ),
                        validator: (v) => v != _passCtrl.text ? 'Passwords do not match' : null,
                      ),
                      
                      const SizedBox(height: 32),

                      NxButton(
                        label: 'Reset Password',
                        loading: auth.status == AuthStatus.loading,
                        onPressed: _handleReset,
                      ),
                    ].animate(interval: 50.ms).fadeIn(duration: 400.ms).slideY(begin: 0.1, end: 0),
                  ),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _glowBlob(double size, Color color, {double? top, double? left, double? bottom, double? right}) => Positioned(
    top: top, left: left, bottom: bottom, right: right,
    child: Container(
      width: size, height: size,
      decoration: BoxDecoration(
        shape: BoxShape.circle,
        gradient: RadialGradient(colors: [
          color.withOpacity(0.12), Colors.transparent])
      ),
    ),
  );
}
