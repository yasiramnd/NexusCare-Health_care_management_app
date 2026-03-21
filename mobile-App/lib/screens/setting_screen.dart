import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:flutter_animate/flutter_animate.dart';
import '../providers/auth_provider.dart';
import '../providers/settings_provider.dart';

class SettingsScreen extends StatefulWidget {
  const SettingsScreen({super.key});

  @override
  State<SettingsScreen> createState() => _SettingsScreenState();
}

class _SettingsScreenState extends State<SettingsScreen> {
  bool _profileLoaded = false;

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    if (!_profileLoaded) {
      _profileLoaded = true;
      final auth = context.read<AuthProvider>();
      if (auth.patientId != null) {
        context.read<SettingsProvider>().loadProfile(auth.patientId!);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();
    final settings = context.watch<SettingsProvider>();
    final isDark = settings.isDarkMode;

    return Scaffold(
      backgroundColor: isDark ? const Color(0xFF0A0D14) : const Color(0xFFF3F4F6),
      body: SingleChildScrollView(
        padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 28),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // ── Header ──────────────────────────────────────────────
            Text(
              'Settings',
              style: GoogleFonts.inter(
                fontSize: 26,
                fontWeight: FontWeight.w800,
                color: isDark ? Colors.white : const Color(0xFF111827),
              ),
            ),
            const SizedBox(height: 4),
            Text(
              'Manage your account and preferences',
              style: GoogleFonts.inter(
                fontSize: 14,
                color: isDark ? const Color(0xFF6B7280) : const Color(0xFF9CA3AF),
              ),
            ),
            const SizedBox(height: 28),

            // ── Profile Card ────────────────────────────────────────
            _buildProfileCard(auth, settings, isDark),
            const SizedBox(height: 20),

            // ── Account Section ─────────────────────────────────────
            _sectionLabel('Account', isDark),
            const SizedBox(height: 10),
            _buildSettingsTile(
              icon: Icons.person_outline_rounded,
              iconColor: const Color(0xFF1E6FFF),
              title: 'Edit Profile',
              subtitle: 'Name, phone, address',
              isDark: isDark,
              onTap: () => _showEditProfileDialog(context, settings, auth),
            ),
            const SizedBox(height: 8),
            _buildSettingsTile(
              icon: Icons.lock_outline_rounded,
              iconColor: const Color(0xFF7C3AED),
              title: 'Change Password',
              subtitle: 'Update your login password',
              isDark: isDark,
              onTap: () => _showChangePasswordDialog(context, settings),
            ),
            const SizedBox(height: 24),

            // ── Preferences Section ─────────────────────────────────
            _sectionLabel('Preferences', isDark),
            const SizedBox(height: 10),
            _buildToggleTile(
              icon: isDark
                  ? Icons.dark_mode_rounded
                  : Icons.light_mode_rounded,
              iconColor: const Color(0xFFD97706),
              title: 'Dark Mode',
              subtitle: isDark ? 'Currently using dark theme' : 'Currently using light theme',
              value: isDark,
              isDark: isDark,
              onChanged: (_) => settings.toggleTheme(),
            ),
            const SizedBox(height: 8),
            _buildToggleTile(
              icon: Icons.notifications_outlined,
              iconColor: const Color(0xFF059669),
              title: 'Notifications',
              subtitle: settings.notificationsEnabled
                  ? 'Receiving notifications'
                  : 'Notifications muted',
              value: settings.notificationsEnabled,
              isDark: isDark,
              onChanged: (_) => settings.toggleNotifications(),
            ),
            const SizedBox(height: 24),

            // ── About Section ───────────────────────────────────────
            _sectionLabel('About', isDark),
            const SizedBox(height: 10),
            _buildSettingsTile(
              icon: Icons.info_outline_rounded,
              iconColor: const Color(0xFF0891B2),
              title: 'App Version',
              subtitle: 'NexusCare v1.0.0',
              isDark: isDark,
              trailing: Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                decoration: BoxDecoration(
                  color: const Color(0xFF1E6FFF).withOpacity(0.12),
                  borderRadius: BorderRadius.circular(99),
                ),
                child: Text(
                  'v1.0.0',
                  style: GoogleFonts.inter(
                    fontSize: 11,
                    fontWeight: FontWeight.w600,
                    color: const Color(0xFF60A5FA),
                  ),
                ),
              ),
            ),
            const SizedBox(height: 8),
            _buildSettingsTile(
              icon: Icons.description_outlined,
              iconColor: const Color(0xFF6B7280),
              title: 'Terms of Service',
              subtitle: 'Read our terms and conditions',
              isDark: isDark,
              onTap: () {},
            ),
            const SizedBox(height: 8),
            _buildSettingsTile(
              icon: Icons.privacy_tip_outlined,
              iconColor: const Color(0xFF6B7280),
              title: 'Privacy Policy',
              subtitle: 'How we handle your data',
              isDark: isDark,
              onTap: () {},
            ),
            const SizedBox(height: 32),

            // ── Sign Out Button ─────────────────────────────────────
            SizedBox(
              width: double.infinity,
              child: ElevatedButton.icon(
                onPressed: () => _confirmSignOut(context, auth),
                icon: const Icon(Icons.logout_rounded, size: 20),
                label: Text('Sign Out', style: GoogleFonts.inter(fontWeight: FontWeight.w600)),
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFFEF4444).withOpacity(0.12),
                  foregroundColor: const Color(0xFFEF4444),
                  elevation: 0,
                  minimumSize: const Size(double.infinity, 52),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(14),
                    side: BorderSide(color: const Color(0xFFEF4444).withOpacity(0.3)),
                  ),
                ),
              ),
            ).animate().fadeIn(delay: 300.ms),
            const SizedBox(height: 40),
          ],
        ),
      ),
    );
  }

  // ══════════════════════════════════════════════════════════════════════════════
  // WIDGETS
  // ══════════════════════════════════════════════════════════════════════════════

  Widget _buildProfileCard(AuthProvider auth, SettingsProvider settings, bool isDark) {
    final profile = settings.profile;
    final name = profile?['name'] ?? auth.name ?? 'Patient';
    final email = profile?['email'] ?? auth.firebaseUser?.email ?? '';
    final patientId = auth.patientId ?? '—';

    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [Color(0xFF1E3A8A), Color(0xFF1E40AF)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: const Color(0xFF2563EB).withOpacity(0.4)),
      ),
      child: Row(
        children: [
          // Avatar
          Container(
            width: 60,
            height: 60,
            decoration: BoxDecoration(
              color: Colors.white.withOpacity(0.15),
              borderRadius: BorderRadius.circular(16),
            ),
            child: Center(
              child: Text(
                name.isNotEmpty ? name[0].toUpperCase() : 'P',
                style: GoogleFonts.inter(
                  fontSize: 26,
                  fontWeight: FontWeight.w800,
                  color: Colors.white,
                ),
              ),
            ),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  name,
                  style: GoogleFonts.inter(
                    fontSize: 18,
                    fontWeight: FontWeight.w700,
                    color: Colors.white,
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  email,
                  style: GoogleFonts.inter(fontSize: 13, color: Colors.white70),
                ),
                const SizedBox(height: 4),
                Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 3),
                      decoration: BoxDecoration(
                        color: Colors.white.withOpacity(0.15),
                        borderRadius: BorderRadius.circular(99),
                      ),
                      child: Text(
                        'Patient ID: $patientId',
                        style: GoogleFonts.inter(
                          fontSize: 11,
                          fontWeight: FontWeight.w600,
                          color: Colors.white,
                        ),
                      ),
                    ),
                    const SizedBox(width: 8),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 3),
                      decoration: BoxDecoration(
                        color: const Color(0xFF10B981).withOpacity(0.2),
                        borderRadius: BorderRadius.circular(99),
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          const Icon(Icons.circle, color: Color(0xFF10B981), size: 6),
                          const SizedBox(width: 4),
                          Text(
                            'Active',
                            style: GoogleFonts.inter(
                              fontSize: 11,
                              fontWeight: FontWeight.w600,
                              color: const Color(0xFF6EE7B7),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    ).animate().fadeIn(duration: 400.ms).slideY(begin: 0.08);
  }

  Widget _sectionLabel(String label, bool isDark) {
    return Text(
      label,
      style: GoogleFonts.inter(
        fontSize: 13,
        fontWeight: FontWeight.w700,
        color: isDark ? const Color(0xFF6B7280) : const Color(0xFF9CA3AF),
        letterSpacing: 0.8,
      ),
    ).animate().fadeIn(delay: 100.ms);
  }

  Widget _buildSettingsTile({
    required IconData icon,
    required Color iconColor,
    required String title,
    required String subtitle,
    required bool isDark,
    VoidCallback? onTap,
    Widget? trailing,
  }) {
    return Material(
      color: Colors.transparent,
      child: InkWell(
        borderRadius: BorderRadius.circular(14),
        onTap: onTap,
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
          decoration: BoxDecoration(
            color: isDark ? const Color(0xFF111827) : Colors.white,
            borderRadius: BorderRadius.circular(14),
            border: Border.all(
              color: isDark ? const Color(0xFF1F2937) : const Color(0xFFE5E7EB),
            ),
          ),
          child: Row(
            children: [
              Container(
                width: 40,
                height: 40,
                decoration: BoxDecoration(
                  color: iconColor.withOpacity(0.12),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Icon(icon, color: iconColor, size: 20),
              ),
              const SizedBox(width: 14),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(title,
                        style: GoogleFonts.inter(
                          fontSize: 14,
                          fontWeight: FontWeight.w600,
                          color: isDark ? Colors.white : const Color(0xFF111827),
                        )),
                    const SizedBox(height: 1),
                    Text(subtitle,
                        style: GoogleFonts.inter(
                          fontSize: 12,
                          color: isDark ? const Color(0xFF6B7280) : const Color(0xFF9CA3AF),
                        )),
                  ],
                ),
              ),
              trailing ??
                  Icon(Icons.chevron_right_rounded,
                      color: isDark ? const Color(0xFF4B5563) : const Color(0xFF9CA3AF),
                      size: 20),
            ],
          ),
        ),
      ),
    ).animate().fadeIn(delay: 150.ms);
  }

  Widget _buildToggleTile({
    required IconData icon,
    required Color iconColor,
    required String title,
    required String subtitle,
    required bool value,
    required bool isDark,
    required ValueChanged<bool> onChanged,
  }) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF111827) : Colors.white,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(
          color: isDark ? const Color(0xFF1F2937) : const Color(0xFFE5E7EB),
        ),
      ),
      child: Row(
        children: [
          Container(
            width: 40,
            height: 40,
            decoration: BoxDecoration(
              color: iconColor.withOpacity(0.12),
              borderRadius: BorderRadius.circular(10),
            ),
            child: Icon(icon, color: iconColor, size: 20),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(title,
                    style: GoogleFonts.inter(
                      fontSize: 14,
                      fontWeight: FontWeight.w600,
                      color: isDark ? Colors.white : const Color(0xFF111827),
                    )),
                const SizedBox(height: 1),
                Text(subtitle,
                    style: GoogleFonts.inter(
                      fontSize: 12,
                      color: isDark ? const Color(0xFF6B7280) : const Color(0xFF9CA3AF),
                    )),
              ],
            ),
          ),
          Switch.adaptive(
            value: value,
            onChanged: onChanged,
            activeColor: const Color(0xFF1E6FFF),
          ),
        ],
      ),
    ).animate().fadeIn(delay: 200.ms);
  }

  // ══════════════════════════════════════════════════════════════════════════════
  // DIALOGS
  // ══════════════════════════════════════════════════════════════════════════════

  void _showEditProfileDialog(
      BuildContext context, SettingsProvider settings, AuthProvider auth) {
    final isDark = settings.isDarkMode;
    final profile = settings.profile ?? {};
    final nameCtrl = TextEditingController(text: profile['name'] ?? '');
    final phone1Ctrl = TextEditingController(text: profile['contact_no1'] ?? '');
    final phone2Ctrl = TextEditingController(text: profile['contact_no2'] ?? '');
    final addressCtrl = TextEditingController(text: profile['address'] ?? '');

    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: isDark ? const Color(0xFF111827) : Colors.white,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: Row(
          children: [
            Container(
              width: 36,
              height: 36,
              decoration: BoxDecoration(
                color: const Color(0xFF1E6FFF).withOpacity(0.12),
                borderRadius: BorderRadius.circular(10),
              ),
              child: const Icon(Icons.edit_rounded, color: Color(0xFF1E6FFF), size: 18),
            ),
            const SizedBox(width: 12),
            Text('Edit Profile',
                style: GoogleFonts.inter(
                  fontWeight: FontWeight.w700,
                  fontSize: 18,
                  color: isDark ? Colors.white : const Color(0xFF111827),
                )),
          ],
        ),
        content: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              _dialogField('Full Name', nameCtrl, Icons.person_outline, isDark),
              const SizedBox(height: 12),
              _dialogField('Phone Number', phone1Ctrl, Icons.phone_outlined, isDark),
              const SizedBox(height: 12),
              _dialogField('Alternate Phone', phone2Ctrl, Icons.phone_outlined, isDark),
              const SizedBox(height: 12),
              _dialogField('Address', addressCtrl, Icons.location_on_outlined, isDark,
                  maxLines: 2),
            ],
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: Text('Cancel',
                style: GoogleFonts.inter(color: const Color(0xFF6B7280))),
          ),
          ElevatedButton(
            onPressed: () async {
              final patientId = auth.patientId;
              if (patientId == null) return;

              final err = await settings.updateProfile(patientId, {
                'name': nameCtrl.text.trim(),
                'contact_no1': phone1Ctrl.text.trim(),
                'contact_no2': phone2Ctrl.text.trim(),
                'address': addressCtrl.text.trim(),
              });

              if (ctx.mounted) Navigator.pop(ctx);

              if (err != null && mounted) {
                ScaffoldMessenger.of(context).showSnackBar(
                  SnackBar(
                    content: Text(err),
                    backgroundColor: const Color(0xFFEF4444),
                  ),
                );
              } else if (mounted) {
                ScaffoldMessenger.of(context).showSnackBar(
                  SnackBar(
                    content: Text('Profile updated successfully',
                        style: GoogleFonts.inter()),
                    backgroundColor: const Color(0xFF059669),
                  ),
                );
              }
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFF1E6FFF),
              foregroundColor: Colors.white,
              shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(10)),
            ),
            child: Text('Save', style: GoogleFonts.inter(fontWeight: FontWeight.w600)),
          ),
        ],
      ),
    );
  }

  void _showChangePasswordDialog(BuildContext context, SettingsProvider settings) {
    final isDark = settings.isDarkMode;
    final newPassCtrl = TextEditingController();
    final confirmCtrl = TextEditingController();
    bool obscureNew = true;
    bool obscureConfirm = true;

    showDialog(
      context: context,
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setDialogState) => AlertDialog(
          backgroundColor: isDark ? const Color(0xFF111827) : Colors.white,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
          title: Row(
            children: [
              Container(
                width: 36,
                height: 36,
                decoration: BoxDecoration(
                  color: const Color(0xFF7C3AED).withOpacity(0.12),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: const Icon(Icons.lock_outline_rounded,
                    color: Color(0xFF7C3AED), size: 18),
              ),
              const SizedBox(width: 12),
              Text('Change Password',
                  style: GoogleFonts.inter(
                    fontWeight: FontWeight.w700,
                    fontSize: 18,
                    color: isDark ? Colors.white : const Color(0xFF111827),
                  )),
            ],
          ),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              TextField(
                controller: newPassCtrl,
                obscureText: obscureNew,
                style: GoogleFonts.inter(
                  color: isDark ? Colors.white : const Color(0xFF111827),
                ),
                decoration: InputDecoration(
                  labelText: 'New Password',
                  prefixIcon: Icon(Icons.lock_outlined,
                      color: isDark ? const Color(0xFF6B7280) : const Color(0xFF9CA3AF),
                      size: 20),
                  suffixIcon: IconButton(
                    icon: Icon(
                      obscureNew ? Icons.visibility_off_outlined : Icons.visibility_outlined,
                      color: const Color(0xFF6B7280),
                      size: 20,
                    ),
                    onPressed: () => setDialogState(() => obscureNew = !obscureNew),
                  ),
                ),
              ),
              const SizedBox(height: 14),
              TextField(
                controller: confirmCtrl,
                obscureText: obscureConfirm,
                style: GoogleFonts.inter(
                  color: isDark ? Colors.white : const Color(0xFF111827),
                ),
                decoration: InputDecoration(
                  labelText: 'Confirm Password',
                  prefixIcon: Icon(Icons.lock_outlined,
                      color: isDark ? const Color(0xFF6B7280) : const Color(0xFF9CA3AF),
                      size: 20),
                  suffixIcon: IconButton(
                    icon: Icon(
                      obscureConfirm
                          ? Icons.visibility_off_outlined
                          : Icons.visibility_outlined,
                      color: const Color(0xFF6B7280),
                      size: 20,
                    ),
                    onPressed: () =>
                        setDialogState(() => obscureConfirm = !obscureConfirm),
                  ),
                ),
              ),
              const SizedBox(height: 8),
              Align(
                alignment: Alignment.centerLeft,
                child: Text(
                  'Password must be at least 6 characters',
                  style: GoogleFonts.inter(
                    fontSize: 11,
                    color: const Color(0xFF6B7280),
                  ),
                ),
              ),
            ],
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(ctx),
              child: Text('Cancel',
                  style: GoogleFonts.inter(color: const Color(0xFF6B7280))),
            ),
            ElevatedButton(
              onPressed: () async {
                final newPass = newPassCtrl.text.trim();
                final confirm = confirmCtrl.text.trim();

                if (newPass.length < 6) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(
                      content: Text('Password must be at least 6 characters'),
                      backgroundColor: Color(0xFFEF4444),
                    ),
                  );
                  return;
                }
                if (newPass != confirm) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(
                      content: Text('Passwords do not match'),
                      backgroundColor: Color(0xFFEF4444),
                    ),
                  );
                  return;
                }

                final err = await settings.changePassword(newPass);
                if (ctx.mounted) Navigator.pop(ctx);

                if (err != null && mounted) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(
                      content: Text(err),
                      backgroundColor: const Color(0xFFEF4444),
                    ),
                  );
                } else if (mounted) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(
                      content: Text('Password changed successfully',
                          style: GoogleFonts.inter()),
                      backgroundColor: const Color(0xFF059669),
                    ),
                  );
                }
              },
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFF7C3AED),
                foregroundColor: Colors.white,
                shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(10)),
              ),
              child: Text('Update', style: GoogleFonts.inter(fontWeight: FontWeight.w600)),
            ),
          ],
        ),
      ),
    );
  }

  Widget _dialogField(String label, TextEditingController ctrl, IconData icon,
      bool isDark, {int maxLines = 1}) {
    return TextField(
      controller: ctrl,
      maxLines: maxLines,
      style: GoogleFonts.inter(
        color: isDark ? Colors.white : const Color(0xFF111827),
      ),
      decoration: InputDecoration(
        labelText: label,
        prefixIcon: Icon(icon,
            color: isDark ? const Color(0xFF6B7280) : const Color(0xFF9CA3AF),
            size: 20),
      ),
    );
  }

  Future<void> _confirmSignOut(BuildContext ctx, AuthProvider auth) async {
    final isDark = context.read<SettingsProvider>().isDarkMode;
    final ok = await showDialog<bool>(
      context: ctx,
      builder: (_) => AlertDialog(
        backgroundColor: isDark ? const Color(0xFF111827) : Colors.white,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: Text('Sign Out',
            style: GoogleFonts.inter(
              color: isDark ? Colors.white : const Color(0xFF111827),
              fontWeight: FontWeight.w700,
            )),
        content: Text('Are you sure you want to sign out?',
            style: GoogleFonts.inter(
              color: isDark ? const Color(0xFF9CA3AF) : const Color(0xFF6B7280),
            )),
        actions: [
          TextButton(
            child: Text('Cancel',
                style: GoogleFonts.inter(color: const Color(0xFF6B7280))),
            onPressed: () => Navigator.pop(ctx, false),
          ),
          TextButton(
            child: Text('Sign Out',
                style: GoogleFonts.inter(color: const Color(0xFFEF4444))),
            onPressed: () => Navigator.pop(ctx, true),
          ),
        ],
      ),
    );
    if (ok == true && mounted) {
      await auth.signOut();
      if (mounted) Navigator.pushReplacementNamed(ctx, '/login');
    }
  }
}
