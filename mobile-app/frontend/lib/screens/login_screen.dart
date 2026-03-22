import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:flutter_animate/flutter_animate.dart';
import '../providers/auth_provider.dart';
import '../widgets/nx_text_field.dart';
import '../widgets/nx_button.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});
  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> with SingleTickerProviderStateMixin {
  late TabController _tab;
  final _loginKey    = GlobalKey<FormState>();
  final _registerKey = GlobalKey<FormState>();

  // ── Login fields ─────────────────────────────────────────────────────
  final _emailCtrl    = TextEditingController();
  final _passwordCtrl = TextEditingController();

  // ── Register fields ───────────────────────────────────────────────────
  final _rNameCtrl     = TextEditingController();
  final _rNicCtrl      = TextEditingController();
  final _rEmailCtrl    = TextEditingController();
  final _rPassCtrl     = TextEditingController();
  final _rPhoneCtrl    = TextEditingController();
  final _rPhone2Ctrl   = TextEditingController();
  final _rAddressCtrl  = TextEditingController();
  final _rContactNameCtrl  = TextEditingController();
  final _rContactPhoneCtrl = TextEditingController();
  final _rBloodGroupCtrl   = TextEditingController();
  final _rAllergiesCtrl    = TextEditingController();
  final _rConditionsCtrl   = TextEditingController();
  String? _rGender;
  DateTime? _rDob;
  bool _rIsPublic = false;

  bool _loginPwdVisible = false;
  bool _regPwdVisible   = false;

  @override
  void initState() {
    super.initState();
    _tab = TabController(length: 2, vsync: this);
  }

  @override
  void dispose() {
    _tab.dispose();
    _emailCtrl.dispose(); _passwordCtrl.dispose();
    _rNameCtrl.dispose(); _rNicCtrl.dispose();
    _rEmailCtrl.dispose(); _rPassCtrl.dispose();
    _rPhoneCtrl.dispose(); _rPhone2Ctrl.dispose();
    _rAddressCtrl.dispose(); _rContactNameCtrl.dispose();
    _rContactPhoneCtrl.dispose(); _rBloodGroupCtrl.dispose();
    _rAllergiesCtrl.dispose(); _rConditionsCtrl.dispose();
    super.dispose();
  }

  // ── Auth listener ─────────────────────────────────────────────────────
  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    final auth = context.read<AuthProvider>();
    auth.addListener(_onAuthChanged);
  }

  void _onAuthChanged() {
    if (!mounted) return;
    final auth = context.read<AuthProvider>();
    if (auth.isLoggedIn) {
      Navigator.pushReplacementNamed(context, '/dashboard');
    }
  }

  // ── Actions ───────────────────────────────────────────────────────────
  Future<void> _handleLogin() async {
    if (!_loginKey.currentState!.validate()) return;
    await context.read<AuthProvider>().signIn(
      _emailCtrl.text.trim(), _passwordCtrl.text.trim());
  }

  Future<void> _handleRegister() async {
    if (!_registerKey.currentState!.validate()) return;
    if (_rGender == null) { _showSnack('Please select your gender'); return; }
    if (_rDob == null)    { _showSnack('Please select your date of birth'); return; }

    final dob = '${_rDob!.year}-${_rDob!.month.toString().padLeft(2,'0')}-${_rDob!.day.toString().padLeft(2,'0')}';

    final error = await context.read<AuthProvider>().registerPatient({
      'email':             _rEmailCtrl.text.trim(),
      'password':          _rPassCtrl.text.trim(),
      'name':              _rNameCtrl.text.trim(),
      'contact_no1':       _rPhoneCtrl.text.trim(),
      'contact_no2':       _rPhone2Ctrl.text.trim(),
      'address':           _rAddressCtrl.text.trim(),
      'nic':               _rNicCtrl.text.trim(),
      'date_of_birth':     dob,
      'gender':            _rGender!,
      'contact_name':      _rContactNameCtrl.text.trim(),
      'contact_phone':     _rContactPhoneCtrl.text.trim(),
      'blood_group':       _rBloodGroupCtrl.text.trim().isEmpty ? 'Unknown' : _rBloodGroupCtrl.text.trim(),
      'allergies':          _rAllergiesCtrl.text.trim(),
      'chronic_conditions': _rConditionsCtrl.text.trim(),
      'is_public_visible':  _rIsPublic,
    });

    if (error == null && mounted) {
      _showSnack('Registration successful! Please sign in.', success: true);
      _tab.animateTo(0);
    }
  }

  Future<void> _pickDob() async {
    final picked = await showDatePicker(
      context: context,
      initialDate: DateTime(2000, 1, 1),
      firstDate: DateTime(1940),
      lastDate: DateTime.now().subtract(const Duration(days: 365 * 5)),
      builder: (ctx, child) => Theme(
        data: Theme.of(ctx).copyWith(
          colorScheme: const ColorScheme.dark(
            primary: Color(0xFF1E6FFF),
            surface: Color(0xFF1F2937),
          ),
        ),
        child: child!,
      ),
    );
    if (picked != null) setState(() => _rDob = picked);
  }

  void _showSnack(String msg, {bool success = false}) {
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(
      content: Text(msg, style: GoogleFonts.inter()),
      backgroundColor: success ? const Color(0xFF10B981) : const Color(0xFFEF4444),
      behavior: SnackBarBehavior.floating,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
      margin: const EdgeInsets.all(16),
    ));
  }

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();
    final isWide = MediaQuery.of(context).size.width > 900;

    return Scaffold(
      backgroundColor: const Color(0xFF0A0D14),
      body: Stack(
        children: [
          // Background glow blobs
          Positioned(top: -120, left: -120,
              child: _glowBlob(400, const Color(0xFF1E6FFF))),
          Positioned(bottom: -80, right: -80,
              child: _glowBlob(300, const Color(0xFF0A3DB0))),

          isWide ? _wideLayout(auth) : _narrowLayout(auth),
        ],
      ),
    );
  }

  Widget _glowBlob(double size, Color color) => Container(
    width: size, height: size,
    decoration: BoxDecoration(
      shape: BoxShape.circle,
      gradient: RadialGradient(colors: [
        color.withOpacity(0.18), Colors.transparent])
    ),
  );

  // ── WIDE Layout ───────────────────────────────────────────────────────
  Widget _wideLayout(AuthProvider auth) {
    return Row(children: [
      Expanded(child: _leftPanel()),
      Container(
        width: 500,
        decoration: const BoxDecoration(
          color: Color(0xFF0A0D14),
          border: Border(left: BorderSide(color: Color(0xFF1F2937))),
        ),
        child: _authPanel(auth),
      ),
    ]);
  }

  Widget _narrowLayout(AuthProvider auth) =>
      SafeArea(child: SingleChildScrollView(child: _authPanel(auth)));

  // ── Left branding panel ───────────────────────────────────────────────
  Widget _leftPanel() {
    return Container(
      decoration: const BoxDecoration(
        gradient: LinearGradient(
          colors: [Color(0xFF060A14), Color(0xFF0D1B3E), Color(0xFF0A0F1C)],
          begin: Alignment.topLeft, end: Alignment.bottomRight,
        ),
      ),
      padding: const EdgeInsets.symmetric(horizontal: 64, vertical: 60),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Row(children: [
            Container(
              width: 48, height: 48,
              decoration: BoxDecoration(
                gradient: const LinearGradient(colors: [Color(0xFF1E6FFF), Color(0xFF0A3DB0)]),
                borderRadius: BorderRadius.circular(14),
              ),
              child: const Icon(Icons.local_hospital_rounded, color: Colors.white, size: 26),
            ),
            const SizedBox(width: 12),
            Text('NexusCare', style: GoogleFonts.inter(
                fontSize: 22, fontWeight: FontWeight.w800, color: Colors.white)),
          ]).animate().fadeIn(duration: 600.ms),

          const SizedBox(height: 56),
          Text('Your Health,', style: GoogleFonts.inter(
              fontSize: 48, fontWeight: FontWeight.w800, color: Colors.white,
              height: 1.1, letterSpacing: -1.5))
              .animate().slideX(begin: -0.2).fadeIn(duration: 700.ms),
          ShaderMask(
            shaderCallback: (b) => const LinearGradient(
                colors: [Color(0xFF1E6FFF), Color(0xFF60A5FA)]).createShader(b),
            child: Text('Our Priority.', style: GoogleFonts.inter(
                fontSize: 48, fontWeight: FontWeight.w800, color: Colors.white,
                height: 1.1, letterSpacing: -1.5)),
          ).animate().slideX(begin: -0.2).fadeIn(delay: 100.ms, duration: 700.ms),

          const SizedBox(height: 24),
          Text(
            'Access your appointments, prescriptions, lab reports\nand emergency health data — all in one place.',
            style: GoogleFonts.inter(fontSize: 16, color: const Color(0xFF9CA3AF), height: 1.7),
          ).animate().fadeIn(delay: 300.ms, duration: 600.ms),

          const SizedBox(height: 40),
          Wrap(spacing: 12, runSpacing: 12, children: [
            _pill(Icons.calendar_today_outlined, 'Appointments'),
            _pill(Icons.medication_outlined, 'Prescriptions'),
            _pill(Icons.science_outlined, 'Lab Reports'),
            _pill(Icons.emergency_outlined, 'Emergency Info'),
            _pill(Icons.local_pharmacy_outlined, 'Medicine Orders'),
            _pill(Icons.qr_code_2_outlined, 'QR Health Card'),
          ]).animate().fadeIn(delay: 500.ms, duration: 600.ms),
        ],
      ),
    );
  }

  Widget _pill(IconData icon, String label) => Container(
    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
    decoration: BoxDecoration(
      color: Colors.white.withOpacity(0.06),
      borderRadius: BorderRadius.circular(99),
      border: Border.all(color: Colors.white.withOpacity(0.1)),
    ),
    child: Row(mainAxisSize: MainAxisSize.min, children: [
      Icon(icon, size: 16, color: const Color(0xFF60A5FA)),
      const SizedBox(width: 8),
      Text(label, style: GoogleFonts.inter(fontSize: 13, color: const Color(0xFFD1D5DB))),
    ]),
  );

  // ── Auth panel (right side) ───────────────────────────────────────────
  Widget _authPanel(AuthProvider auth) {
    return Center(
      child: SingleChildScrollView(
        padding: const EdgeInsets.all(36),
        child: ConstrainedBox(
          constraints: const BoxConstraints(maxWidth: 420),
          child: Column(
            children: [
              // Tab bar
              Container(
                padding: const EdgeInsets.all(4),
                decoration: BoxDecoration(
                  color: const Color(0xFF1F2937),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: TabBar(
                  controller: _tab,
                  indicator: BoxDecoration(
                    gradient: const LinearGradient(
                        colors: [Color(0xFF1E6FFF), Color(0xFF0A3DB0)]),
                    borderRadius: BorderRadius.circular(10),
                  ),
                  indicatorSize: TabBarIndicatorSize.tab,
                  dividerColor: Colors.transparent,
                  labelColor: Colors.white,
                  unselectedLabelColor: const Color(0xFF6B7280),
                  labelStyle: GoogleFonts.inter(fontWeight: FontWeight.w600, fontSize: 14),
                  tabs: const [Tab(text: 'Sign In'), Tab(text: 'Register')],
                ),
              ),
              const SizedBox(height: 28),

              SizedBox(
                height: _tab.index == 0 ? 380 : 620,
                child: TabBarView(
                  controller: _tab,
                  children: [
                    _loginForm(auth),
                    _registerForm(auth),
                  ],
                ),
              ),

              if (auth.status == AuthStatus.error && auth.errorMsg != null)
                Padding(
                  padding: const EdgeInsets.only(top: 12),
                  child: _errorBox(auth.errorMsg!),
                ),
            ].animate(interval: 50.ms).fadeIn(),
          ),
        ),
      ),
    );
  }

  // ── Login Form ────────────────────────────────────────────────────────
  Widget _loginForm(AuthProvider auth) {
    return Form(
      key: _loginKey,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('Welcome Back', style: GoogleFonts.inter(
              fontSize: 22, fontWeight: FontWeight.w700, color: Colors.white)),
          const SizedBox(height: 4),
          Text('Sign in to continue', style: GoogleFonts.inter(
              fontSize: 13, color: const Color(0xFF6B7280))),
          const SizedBox(height: 24),

          NxTextField(
            controller: _emailCtrl, label: 'Email Address',
            hint: 'patient@email.com', keyboardType: TextInputType.emailAddress,
            icon: Icons.email_outlined,
            validator: (v) => (v == null || !v.contains('@')) ? 'Enter a valid email' : null,
          ),
          const SizedBox(height: 16),
          NxTextField(
            controller: _passwordCtrl, label: 'Password',
            hint: '••••••••', obscureText: !_loginPwdVisible,
            icon: Icons.lock_outline,
            suffixIcon: IconButton(
              icon: Icon(
                _loginPwdVisible ? Icons.visibility_off_outlined : Icons.visibility_outlined,
                color: const Color(0xFF6B7280), size: 20,
              ),
              onPressed: () => setState(() => _loginPwdVisible = !_loginPwdVisible),
            ),
            validator: (v) => (v == null || v.length < 6) ? 'Min 6 characters' : null,
          ),
          const SizedBox(height: 8),
          Align(
            alignment: Alignment.centerRight,
            child: TextButton(
              onPressed: () => Navigator.pushNamed(context, '/forgot-password'),
              child: Text(
                'Forgot Password?',
                style: GoogleFonts.inter(
                  fontSize: 13,
                  color: const Color(0xFF60A5FA),
                  fontWeight: FontWeight.w500,
                ),
              ),
            ),
          ),
          const SizedBox(height: 16),

          NxButton(
            label: 'Sign In',
            loading: auth.status == AuthStatus.loading,
            onPressed: _handleLogin,
          ),
        ],
      ),
    );
  }

  // ── Register Form ─────────────────────────────────────────────────────
  Widget _registerForm(AuthProvider auth) {
    return Form(
      key: _registerKey,
      child: SingleChildScrollView(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Create Account', style: GoogleFonts.inter(
                fontSize: 22, fontWeight: FontWeight.w700, color: Colors.white)),
            const SizedBox(height: 4),
            Text('Register as a new patient', style: GoogleFonts.inter(
                fontSize: 13, color: const Color(0xFF6B7280))),
            const SizedBox(height: 20),

            Row(children: [
              Expanded(child: NxTextField(
                controller: _rNameCtrl, label: 'Full Name', hint: 'John Doe',
                icon: Icons.person_outline,
                validator: (v) => (v == null || v.isEmpty) ? 'Required' : null,
              )),
              const SizedBox(width: 12),
              Expanded(child: NxTextField(
                controller: _rNicCtrl, label: 'NIC Number', hint: '123456789V',
                icon: Icons.badge_outlined,
                validator: (v) => (v == null || v.isEmpty) ? 'Required' : null,
              )),
            ]),
            const SizedBox(height: 12),

            NxTextField(
              controller: _rEmailCtrl, label: 'Email Address',
              hint: 'patient@email.com', keyboardType: TextInputType.emailAddress,
              icon: Icons.email_outlined,
              validator: (v) => (v == null || !v.contains('@')) ? 'Enter valid email' : null,
            ),
            const SizedBox(height: 12),
            NxTextField(
              controller: _rPassCtrl, label: 'Password', hint: 'Min 6 characters',
              obscureText: !_regPwdVisible, icon: Icons.lock_outline,
              suffixIcon: IconButton(
                icon: Icon(
                  _regPwdVisible ? Icons.visibility_off_outlined : Icons.visibility_outlined,
                  color: const Color(0xFF6B7280), size: 20,
                ),
                onPressed: () => setState(() => _regPwdVisible = !_regPwdVisible),
              ),
              validator: (v) => (v == null || v.length < 6) ? 'Min 6 characters' : null,
            ),
            const SizedBox(height: 12),

            Row(children: [
              Expanded(child: NxTextField(
                controller: _rPhoneCtrl, label: 'Phone 1', hint: '+94 77 123 4567',
                icon: Icons.phone_outlined, keyboardType: TextInputType.phone,
                validator: (v) => (v == null || v.isEmpty) ? 'Required' : null,
              )),
              const SizedBox(width: 12),
              Expanded(child: NxTextField(
                controller: _rPhone2Ctrl, label: 'Phone 2 (optional)', hint: '+94 71 000 0000',
                icon: Icons.phone_outlined, keyboardType: TextInputType.phone,
              )),
            ]),
            const SizedBox(height: 12),

            NxTextField(
              controller: _rAddressCtrl, label: 'Address',
              hint: '123 Main St, Colombo',
              icon: Icons.location_on_outlined,
              validator: (v) => (v == null || v.isEmpty) ? 'Required' : null,
            ),
            const SizedBox(height: 12),

            Row(children: [
              // Date of birth
              Expanded(
                child: GestureDetector(
                  onTap: _pickDob,
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 14),
                    decoration: BoxDecoration(
                      color: const Color(0xFF1F2937),
                      borderRadius: BorderRadius.circular(10),
                      border: Border.all(color: const Color(0xFF374151)),
                    ),
                    child: Row(children: [
                      const Icon(Icons.cake_outlined, color: Color(0xFF6B7280), size: 18),
                      const SizedBox(width: 8),
                      Text(
                        _rDob == null ? 'Date of Birth'
                            : '${_rDob!.day}/${_rDob!.month}/${_rDob!.year}',
                        style: GoogleFonts.inter(
                          fontSize: 14,
                          color: _rDob == null ? const Color(0xFF6B7280) : Colors.white,
                        ),
                      ),
                    ]),
                  ),
                ),
              ),
              const SizedBox(width: 12),
              // Gender
              Expanded(
                child: DropdownButtonFormField<String>(
                  value: _rGender,
                  decoration: InputDecoration(
                    labelText: 'Gender',
                    prefixIcon: const Icon(Icons.wc_outlined, size: 18),
                    contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                    filled: true, fillColor: const Color(0xFF1F2937),
                    border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(10),
                        borderSide: const BorderSide(color: Color(0xFF374151))),
                    enabledBorder: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(10),
                        borderSide: const BorderSide(color: Color(0xFF374151))),
                  ),
                  dropdownColor: const Color(0xFF1F2937),
                  style: GoogleFonts.inter(color: Colors.white, fontSize: 14),
                  items: ['Male', 'Female', 'Other']
                      .map((g) => DropdownMenuItem(value: g, child: Text(g)))
                      .toList(),
                  onChanged: (v) => setState(() => _rGender = v),
                ),
              ),
            ]),
            const SizedBox(height: 12),

            Text('Emergency Contact', style: GoogleFonts.inter(
                fontSize: 13, fontWeight: FontWeight.w600,
                color: const Color(0xFF60A5FA))),
            const SizedBox(height: 8),
            Row(children: [
              Expanded(child: NxTextField(
                controller: _rContactNameCtrl, label: 'Contact Name', hint: 'Jane Doe',
                icon: Icons.emergency_outlined,
              )),
              const SizedBox(width: 12),
              Expanded(child: NxTextField(
                controller: _rContactPhoneCtrl, label: 'Contact Phone', hint: '+94 77 000 0000',
                icon: Icons.phone_outlined, keyboardType: TextInputType.phone,
              )),
            ]),
            const SizedBox(height: 20),

            Text('Medical Details', style: GoogleFonts.inter(
                fontSize: 13, fontWeight: FontWeight.w600,
                color: const Color(0xFF60A5FA))),
            const SizedBox(height: 8),
            NxTextField(
              controller: _rBloodGroupCtrl, label: 'Blood Group', hint: 'e.g. O+',
              icon: Icons.bloodtype_outlined,
            ),
            const SizedBox(height: 12),
            NxTextField(
              controller: _rAllergiesCtrl, label: 'Known Allergies', hint: 'e.g. Penicillin, Peanuts',
              icon: Icons.warning_amber_outlined,
            ),
            const SizedBox(height: 12),
            NxTextField(
              controller: _rConditionsCtrl, label: 'Chronic Conditions', hint: 'e.g. Diabetes, Asthma',
              icon: Icons.medical_information_outlined,
            ),
            const SizedBox(height: 12),

            Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
              decoration: BoxDecoration(
                color: const Color(0xFF1F2937),
                borderRadius: BorderRadius.circular(10),
                border: Border.all(color: const Color(0xFF374151)),
              ),
              child: Row(children: [
                const Icon(Icons.visibility_outlined, color: Color(0xFF6B7280), size: 18),
                const SizedBox(width: 12),
                Expanded(child: Text('Make Profile Public', style: GoogleFonts.inter(fontSize: 14, color: Colors.white))),
                Switch(
                  value: _rIsPublic,
                  onChanged: (v) => setState(() => _rIsPublic = v),
                  activeColor: const Color(0xFF1E6FFF),
                ),
              ]),
            ),
            const SizedBox(height: 20),

            NxButton(
              label: 'Create Account',
              loading: auth.status == AuthStatus.loading,
              onPressed: _handleRegister,
            ),
          ],
        ),
      ),
    );
  }

  Widget _errorBox(String msg) => Container(
    padding: const EdgeInsets.all(12),
    decoration: BoxDecoration(
      color: const Color(0xFFEF4444).withOpacity(0.12),
      borderRadius: BorderRadius.circular(10),
      border: Border.all(color: const Color(0xFFEF4444).withOpacity(0.4)),
      
    ),
    child: Text(msg, style: GoogleFonts.inter(
        fontSize: 13, color: const Color(0xFFFCA5A5))),
  );
}
