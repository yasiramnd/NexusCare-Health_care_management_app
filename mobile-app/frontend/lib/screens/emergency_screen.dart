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
                    colors: [Color(0xFFEF4444), Color(0xFFF87171)],
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                  ),
                  borderRadius: BorderRadius.circular(12),
                  boxShadow: [
                    BoxShadow(
                      color: const Color(0xFFEF4444).withOpacity(0.3),
                      blurRadius: 12,
                      offset: const Offset(0, 4),
                    ),
                  ]),
                child: const Icon(Icons.emergency_rounded, color: Colors.white, size: 24)),
            const SizedBox(width: 16),
            Text('Emergency Profile', style: GoogleFonts.inter(
                fontSize: 26, fontWeight: FontWeight.w900, color: Colors.white, letterSpacing: -0.5)),
          ]).animate().fadeIn(),

          const SizedBox(height: 10),
          Text('This information will be visible to emergency responders when scanning your QR code.',
              style: GoogleFonts.inter(fontSize: 14, color: const Color(0xFF9CA3AF), fontWeight: FontWeight.w500, height: 1.5)),
          const SizedBox(height: 32),

          // Important: Patient ID
          Container(
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
                gradient: const LinearGradient(
                  colors: [Color(0xFF1E6FFF), Color(0xFF3B82F6)],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: const Color(0xFF60A5FA), width: 1.5),
                boxShadow: [
                  BoxShadow(
                    color: const Color(0xFF1E6FFF).withOpacity(0.3),
                    blurRadius: 12,
                    offset: const Offset(0, 4),
                  ),
                ]),
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Row(children: [
                Container(
                  padding: const EdgeInsets.all(6),
                  decoration: BoxDecoration(
                    color: Colors.white.withOpacity(0.2),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: const Icon(Icons.badge_outlined, color: Colors.white, size: 18),
                ),
                const SizedBox(width: 10),
                Text('Your Patient ID', style: GoogleFonts.inter(
                    fontSize: 14, fontWeight: FontWeight.w700, color: Colors.white, letterSpacing: 0.2)),
              ]),
              const SizedBox(height: 12),
              Text(
                auth.patientId ?? 'Not Set — Please Login Again',
                style: GoogleFonts.inter(fontSize: 26, fontWeight: FontWeight.w900, color: Colors.white, letterSpacing: -0.5),
              ),
              const SizedBox(height: 8),
              Text('Your Patient ID is automatically linked to your account.',
                  style: GoogleFonts.inter(fontSize: 12, color: Colors.white.withOpacity(0.8), fontWeight: FontWeight.w500)),
            ]),
          ).animate().fadeIn(delay: 100.ms).slideY(begin: 0.1),

          const SizedBox(height: 28),

          // Emergency info form
          Container(
            padding: const EdgeInsets.all(24),
            decoration: BoxDecoration(
              color: const Color(0xFF0F172A),
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: const Color(0xFF1F2937), width: 1.5),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withOpacity(0.4),
                  blurRadius: 16,
                  offset: const Offset(0, 4),
                ),
              ],
            ),
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Text('Emergency Contact', style: GoogleFonts.inter(
                  fontSize: 16, fontWeight: FontWeight.w800, color: Colors.white, letterSpacing: 0.2)),
              const SizedBox(height: 18),

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
              const SizedBox(height: 22),

              Text('Medical Info', style: GoogleFonts.inter(
                  fontSize: 16, fontWeight: FontWeight.w800, color: Colors.white, letterSpacing: 0.2)),
              const SizedBox(height: 18),

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

          const SizedBox(height: 28),

          // Public visibility toggle
          Container(
            padding: const EdgeInsets.all(18),
            decoration: BoxDecoration(
              color: const Color(0xFF0F172A),
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: const Color(0xFF1F2937), width: 1.5),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withOpacity(0.3),
                  blurRadius: 12,
                  offset: const Offset(0, 4),
                ),
              ],
            ),
            child: Row(children: [
              Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                Text('Make Profile Public', style: GoogleFonts.inter(
                    fontSize: 15, fontWeight: FontWeight.w700, color: Colors.white, letterSpacing: 0.2)),
                const SizedBox(height: 4),
                Text('Allows emergency responders to scan your QR card and view this profile.',
                    style: GoogleFonts.inter(fontSize: 13, color: const Color(0xFF9CA3AF), fontWeight: FontWeight.w500)),
              ])),
              Switch(
                value: _isPublic,
                onChanged: _toggleVisibility,
                activeColor: const Color(0xFF1E6FFF),
              ),
            ]),
          ).animate().fadeIn(delay: 300.ms),

          const SizedBox(height: 28),

          if (_error != null)
            Container(
              padding: const EdgeInsets.all(14),
              margin: const EdgeInsets.only(bottom: 14),
              decoration: BoxDecoration(
                  gradient: LinearGradient(
                    colors: [const Color(0xFFEF4444).withOpacity(0.1), const Color(0xFFFCA5A5).withOpacity(0.05)],
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                  ),
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: const Color(0xFFEF4444).withOpacity(0.5), width: 1.5),
                  boxShadow: [
                    BoxShadow(
                      color: const Color(0xFFEF4444).withOpacity(0.15),
                      blurRadius: 8,
                      offset: const Offset(0, 2),
                    ),
                  ]),
              child: Row(children: [
                const Icon(Icons.error_outline_rounded, color: Color(0xFFEF4444), size: 20),
                const SizedBox(width: 12),
                Expanded(child: Text(_error!, style: GoogleFonts.inter(fontSize: 14, fontWeight: FontWeight.w600, color: const Color(0xFFFCA5A5), height: 1.4))),
              ]),
            ),
          if (_success != null)
            Container(
              padding: const EdgeInsets.all(14),
              margin: const EdgeInsets.only(bottom: 14),
              decoration: BoxDecoration(
                  gradient: LinearGradient(
                    colors: [const Color(0xFF10B981).withOpacity(0.1), const Color(0xFF6EE7B7).withOpacity(0.05)],
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                  ),
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: const Color(0xFF10B981).withOpacity(0.5), width: 1.5),
                  boxShadow: [
                    BoxShadow(
                      color: const Color(0xFF10B981).withOpacity(0.15),
                      blurRadius: 8,
                      offset: const Offset(0, 2),
                    ),
                  ]),
              child: Row(children: [
                const Icon(Icons.check_circle_outline_rounded, color: Color(0xFF10B981), size: 20),
                const SizedBox(width: 12),
                Expanded(child: Text(_success!, style: GoogleFonts.inter(fontSize: 14, fontWeight: FontWeight.w600, color: const Color(0xFF6EE7B7), height: 1.4))),
              ]),
            ),

          NxButton(
            label: 'Save Emergency Profile',
            loading: _saving,
            icon: Icons.save_outlined,
            onPressed: _save,
          ).animate().fadeIn(delay: 400.ms),
        ]),
      ),
    );
  }
}
