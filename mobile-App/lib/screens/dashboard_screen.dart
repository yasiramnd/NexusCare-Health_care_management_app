import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:flutter_animate/flutter_animate.dart';
import '../providers/auth_provider.dart';
import '../providers/patient_provider.dart';
import 'medical_records_screen.dart';
import 'prescriptions_screen.dart';
import 'lab_reports_screen.dart';
import 'appointments_screen.dart';
import 'emergency_screen.dart';
import 'order_medicine_screen.dart';
import 'qr_screen.dart';

class DashboardScreen extends StatefulWidget {
  const DashboardScreen({super.key});
  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> {
  int _selectedIndex = 0;

  static const _navItems = [
    NavItem(Icons.dashboard_outlined,    Icons.dashboard_rounded,    'Overview'),
    NavItem(Icons.calendar_month_outlined, Icons.calendar_month_rounded, 'Appointments'),
    NavItem(Icons.folder_open_outlined,  Icons.folder_rounded,        'Records'),
    NavItem(Icons.medication_outlined,   Icons.medication_rounded,    'Prescriptions'),
    NavItem(Icons.science_outlined,      Icons.science_rounded,       'Lab Reports'),
    NavItem(Icons.local_pharmacy_outlined, Icons.local_pharmacy_rounded, 'Medicines'),
    NavItem(Icons.emergency_outlined,    Icons.emergency_rounded,     'Emergency'),
    NavItem(Icons.qr_code_2_outlined,    Icons.qr_code_2_rounded,    'QR Card'),
  ];

  @override
  Widget build(BuildContext context) {
    final auth    = context.watch<AuthProvider>();
    final isWide  = MediaQuery.of(context).size.width > 780;

    final screens = [
      _OverviewPage(onNav: (i) => setState(() => _selectedIndex = i)),
      const AppointmentsScreen(),
      const MedicalRecordsScreen(),
      const PrescriptionsScreen(),
      const LabReportsScreen(),
      const OrderMedicineScreen(),
      const EmergencyScreen(),
      const QrScreen(),
    ];

    if (isWide) {
      return Scaffold(
        backgroundColor: const Color(0xFF0A0D14),
        body: Row(children: [
          _SideNav(
            items: _navItems,
            selected: _selectedIndex,
            onSelect: (i) => setState(() => _selectedIndex = i),
            auth: auth,
          ),
          Expanded(
            child: AnimatedSwitcher(
              duration: const Duration(milliseconds: 300),
              child: KeyedSubtree(
                key: ValueKey(_selectedIndex),
                child: screens[_selectedIndex],
              ),
            ),
          ),
        ]),
      );
    }

    // Mobile: bottom nav
    return Scaffold(
      backgroundColor: const Color(0xFF0A0D14),
      appBar: AppBar(
        title: Row(children: [
          const Icon(Icons.local_hospital_rounded, color: Color(0xFF1E6FFF), size: 22),
          const SizedBox(width: 8),
          Text('NexusCare', style: GoogleFonts.inter(
              fontWeight: FontWeight.w700, fontSize: 18, color: Colors.white)),
        ]),
        actions: [
          IconButton(
            icon: const Icon(Icons.logout_rounded, color: Color(0xFF6B7280)),
            onPressed: () => _confirmSignOut(context, auth),
          ),
        ],
      ),
      body: AnimatedSwitcher(
        duration: const Duration(milliseconds: 300),
        child: KeyedSubtree(key: ValueKey(_selectedIndex), child: screens[_selectedIndex]),
      ),
      bottomNavigationBar: _buildBottomNav(),
    );
  }

  Widget _buildBottomNav() {
    const short = [
      NavItem(Icons.dashboard_outlined, Icons.dashboard_rounded, 'Home'),
      NavItem(Icons.calendar_month_outlined, Icons.calendar_month_rounded, 'Appt.'),
      NavItem(Icons.folder_open_outlined, Icons.folder_rounded, 'Records'),
      NavItem(Icons.medication_outlined, Icons.medication_rounded, 'Rx'),
      NavItem(Icons.emergency_outlined, Icons.emergency_rounded, 'SOS'),
    ];
    final mappedIndex = [0, 1, 2, 3, 6][_selectedIndex.clamp(0, 4)];
    return Container(
      decoration: const BoxDecoration(
        border: Border(top: BorderSide(color: Color(0xFF1F2937))),
        color: Color(0xFF0A0D14),
      ),
      child: BottomNavigationBar(
        backgroundColor: Colors.transparent,
        selectedItemColor: const Color(0xFF3B82F6),
        unselectedItemColor: const Color(0xFF4B5563),
        currentIndex: _selectedIndex > 4 ? 0 : _selectedIndex,
        type: BottomNavigationBarType.fixed,
        selectedLabelStyle: GoogleFonts.inter(fontSize: 10, fontWeight: FontWeight.w600),
        unselectedLabelStyle: GoogleFonts.inter(fontSize: 10),
        elevation: 0,
        onTap: (i) => setState(() => _selectedIndex = i == 0 ? 0 : i == 1 ? 1 : i == 2 ? 2 : i == 3 ? 3 : 6),
        items: short.map((n) => BottomNavigationBarItem(
          icon: Icon(n.outlinedIcon), activeIcon: Icon(n.filledIcon), label: n.label)).toList(),
      ),
    );
  }

  Future<void> _confirmSignOut(BuildContext ctx, AuthProvider auth) async {
    final ok = await showDialog<bool>(
      context: ctx,
      builder: (_) => AlertDialog(
        backgroundColor: const Color(0xFF111827),
        title: Text('Sign Out', style: GoogleFonts.inter(color: Colors.white)),
        content: Text('Are you sure you want to sign out?',
            style: GoogleFonts.inter(color: const Color(0xFF9CA3AF))),
        actions: [
          TextButton(child: const Text('Cancel'), onPressed: () => Navigator.pop(ctx, false)),
          TextButton(
            child: const Text('Sign Out', style: TextStyle(color: Color(0xFFEF4444))),
            onPressed: () => Navigator.pop(ctx, true),
          ),
        ],
      ),
    );
    if (ok == true && mounted) {
      await auth.signOut();
      Navigator.pushReplacementNamed(ctx, '/login');
    }
  }
}

// ── Side Navigation ───────────────────────────────────────────────────────────
class _SideNav extends StatelessWidget {
  final List<NavItem> items;
  final int selected;
  final void Function(int) onSelect;
  final AuthProvider auth;

  const _SideNav({required this.items, required this.selected,
    required this.onSelect, required this.auth});

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 240,
      color: const Color(0xFF060911),
      child: Column(children: [
        // Logo
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 28),
          child: Row(children: [
            Container(
              width: 38, height: 38,
              decoration: BoxDecoration(
                  gradient: const LinearGradient(
                      colors: [Color(0xFF1E6FFF), Color(0xFF0A3DB0)]),
                  borderRadius: BorderRadius.circular(10)),
              child: const Icon(Icons.local_hospital_rounded, color: Colors.white, size: 20),
            ),
            const SizedBox(width: 10),
            Text('NexusCare', style: GoogleFonts.inter(
                fontWeight: FontWeight.w800, fontSize: 16, color: Colors.white)),
          ]),
        ),
        Container(height: 1, color: const Color(0xFF1F2937)),
        const SizedBox(height: 12),

        // Nav items
        Expanded(
          child: ListView.builder(
            padding: const EdgeInsets.symmetric(horizontal: 12),
            itemCount: items.length,
            itemBuilder: (_, i) => _NavTile(
              item: items[i], isSelected: selected == i,
              onTap: () => onSelect(i),
            ),
          ),
        ),

        // User info + logout
        Container(
          padding: const EdgeInsets.all(16),
          decoration: const BoxDecoration(
            border: Border(top: BorderSide(color: Color(0xFF1F2937)))),
          child: Row(children: [
            Container(
              width: 36, height: 36,
              decoration: BoxDecoration(
                gradient: const LinearGradient(colors: [Color(0xFF1E6FFF), Color(0xFF0A3DB0)]),
                borderRadius: BorderRadius.circular(99),
              ),
              child: const Icon(Icons.person, color: Colors.white, size: 18),
            ),
            const SizedBox(width: 10),
            Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Text(auth.name ?? auth.firebaseUser?.email?.split('@').first ?? 'Patient',
                  style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.w600, color: Colors.white),
                  overflow: TextOverflow.ellipsis),
              Text(auth.userId ?? '', style: GoogleFonts.inter(fontSize: 11, color: const Color(0xFF6B7280))),
            ])),
            IconButton(
              icon: const Icon(Icons.logout_rounded, size: 18, color: Color(0xFF6B7280)),
              onPressed: () async {
                await auth.signOut();
                Navigator.pushReplacementNamed(context, '/login');
              },
              tooltip: 'Sign Out',
            ),
          ]),
        ),
      ]),
    );
  }
}

class _NavTile extends StatelessWidget {
  final NavItem item;
  final bool isSelected;
  final VoidCallback onTap;

  const _NavTile({required this.item, required this.isSelected, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        margin: const EdgeInsets.only(bottom: 4),
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 11),
        decoration: BoxDecoration(
          color: isSelected ? const Color(0xFF1E6FFF).withOpacity(0.15) : Colors.transparent,
          borderRadius: BorderRadius.circular(10),
          border: isSelected ? Border.all(color: const Color(0xFF1E6FFF).withOpacity(0.3)) : null,
        ),
        child: Row(children: [
          Icon(isSelected ? item.filledIcon : item.outlinedIcon,
              size: 20,
              color: isSelected ? const Color(0xFF60A5FA) : const Color(0xFF6B7280)),
          const SizedBox(width: 12),
          Text(item.label, style: GoogleFonts.inter(
              fontSize: 14,
              fontWeight: isSelected ? FontWeight.w600 : FontWeight.w400,
              color: isSelected ? Colors.white : const Color(0xFF9CA3AF))),
          if (isSelected) ...[
            const Spacer(),
            Container(width: 5, height: 5,
                decoration: const BoxDecoration(
                    color: Color(0xFF1E6FFF), shape: BoxShape.circle)),
          ],
        ]),
      ),
    );
  }
}

// ── Overview Page (home) ─────────────────────────────────────────────────────
class _OverviewPage extends StatelessWidget {
  final void Function(int) onNav;
  const _OverviewPage({required this.onNav});

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();

    final tiles = [
      _QuickTile('Book Appointment', Icons.calendar_month_rounded,
          const Color(0xFF1E6FFF), 1, onNav),
      _QuickTile('Medical Records', Icons.folder_rounded,
          const Color(0xFF059669), 2, onNav),
      _QuickTile('Prescriptions', Icons.medication_rounded,
          const Color(0xFF7C3AED), 3, onNav),
      _QuickTile('Lab Reports', Icons.science_rounded,
          const Color(0xFFD97706), 4, onNav),
      _QuickTile('Order Medicine', Icons.local_pharmacy_rounded,
          const Color(0xFFDB2777), 5, onNav),
      _QuickTile('Emergency Info', Icons.emergency_rounded,
          const Color(0xFFEF4444), 6, onNav),
      _QuickTile('My QR Card', Icons.qr_code_2_rounded,
          const Color(0xFF0891B2), 7, onNav),
    ];

    return SingleChildScrollView(
      padding: const EdgeInsets.all(28),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        // Header
        Row(children: [
          Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Text('Good day, ${auth.name ?? auth.firebaseUser?.email?.split('@').first ?? 'Patient'} 👋',
                style: GoogleFonts.inter(fontSize: 24, fontWeight: FontWeight.w800, color: Colors.white)),
            const SizedBox(height: 4),
            Text('How are you feeling today?',
                style: GoogleFonts.inter(fontSize: 14, color: const Color(0xFF6B7280))),
          ])),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
            decoration: BoxDecoration(
              color: const Color(0xFF1E6FFF).withOpacity(0.12),
              borderRadius: BorderRadius.circular(99),
              border: Border.all(color: const Color(0xFF1E6FFF).withOpacity(0.3)),
            ),
            child: Row(mainAxisSize: MainAxisSize.min, children: [
              const Icon(Icons.circle, color: Color(0xFF10B981), size: 8),
              const SizedBox(width: 6),
              Text('Patient Portal', style: GoogleFonts.inter(
                  fontSize: 12, color: const Color(0xFF60A5FA), fontWeight: FontWeight.w500)),
            ]),
          ),
        ]).animate().fadeIn(duration: 500.ms),

        const SizedBox(height: 28),

        // User info card
        Container(
          padding: const EdgeInsets.all(20),
          decoration: BoxDecoration(
            gradient: const LinearGradient(
                colors: [Color(0xFF1E3A8A), Color(0xFF1E40AF)],
                begin: Alignment.topLeft, end: Alignment.bottomRight),
            borderRadius: BorderRadius.circular(18),
            border: Border.all(color: const Color(0xFF2563EB).withOpacity(0.4)),
          ),
          child: Row(children: [
            Container(
              width: 52, height: 52,
              decoration: BoxDecoration(
                color: Colors.white.withOpacity(0.15),
                borderRadius: BorderRadius.circular(14),
              ),
              child: const Icon(Icons.person_rounded, color: Colors.white, size: 28),
            ),
            const SizedBox(width: 16),
            Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Text(auth.name ?? auth.firebaseUser?.email ?? 'Patient',
                  style: GoogleFonts.inter(fontSize: 15, fontWeight: FontWeight.w700, color: Colors.white)),
              const SizedBox(height: 2),
              Text('User ID: ${auth.userId ?? '—'}',
                  style: GoogleFonts.inter(fontSize: 12, color: Colors.white70)),
              Text('Patient ID: ${auth.patientId ?? '—'}',
                  style: GoogleFonts.inter(fontSize: 12, color: Colors.white70)),
              const SizedBox(height: 4),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 3),
                decoration: BoxDecoration(
                  color: Colors.white.withOpacity(0.15),
                  borderRadius: BorderRadius.circular(99),
                ),
                child: Text(auth.role ?? 'PATIENT',
                    style: GoogleFonts.inter(fontSize: 11, fontWeight: FontWeight.w600, color: Colors.white)),
              ),
            ]),
          ]),
        ).animate().fadeIn(delay: 100.ms).slideY(begin: 0.1),

        const SizedBox(height: 28),

        Text('Quick Access', style: GoogleFonts.inter(
            fontSize: 16, fontWeight: FontWeight.w700, color: Colors.white)),
        const SizedBox(height: 16),

        GridView.count(
          crossAxisCount: MediaQuery.of(context).size.width > 600 ? 4 : 2,
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          crossAxisSpacing: 12, mainAxisSpacing: 12,
          childAspectRatio: 1.2,
          children: tiles.asMap().entries
              .map((e) => e.value.animate()
                  .fadeIn(delay: Duration(milliseconds: 100 * e.key))
                  .slideY(begin: 0.15))
              .toList(),
        ),

        const SizedBox(height: 24),

        // Health tip
        Container(
          padding: const EdgeInsets.all(18),
          decoration: BoxDecoration(
            color: const Color(0xFF111827),
            borderRadius: BorderRadius.circular(14),
            border: Border.all(color: const Color(0xFF1F2937)),
          ),
          child: Row(children: [
            Container(
              width: 42, height: 42,
              decoration: BoxDecoration(
                  color: const Color(0xFF10B981).withOpacity(0.15),
                  borderRadius: BorderRadius.circular(10)),
              child: const Icon(Icons.tips_and_updates_outlined, color: Color(0xFF10B981), size: 22),
            ),
            const SizedBox(width: 14),
            Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Text('Health Tip', style: GoogleFonts.inter(
                  fontSize: 13, fontWeight: FontWeight.w600, color: Color(0xFF6EE7B7))),
              const SizedBox(height: 2),
              Text('Stay hydrated and take your medications on time. Your health is our priority.',
                  style: GoogleFonts.inter(fontSize: 13, color: const Color(0xFF9CA3AF))),
            ])),
          ]),
        ).animate().fadeIn(delay: 400.ms),
      ]),
    );
  }
}

class _QuickTile extends StatelessWidget {
  final String label;
  final IconData icon;
  final Color color;
  final int navIndex;
  final void Function(int) onNav;

  const _QuickTile(this.label, this.icon, this.color, this.navIndex, this.onNav);

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: () => onNav(navIndex),
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: const Color(0xFF111827),
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: color.withOpacity(0.2)),
        ),
        child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [
          Container(
            width: 44, height: 44,
            decoration: BoxDecoration(
              color: color.withOpacity(0.15),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Icon(icon, color: color, size: 24),
          ),
          const SizedBox(height: 10),
          Text(label, textAlign: TextAlign.center,
              style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.w600, color: Colors.white)),
        ]),
      ),
    );
  }
}

class NavItem {
  final IconData outlinedIcon;
  final IconData filledIcon;
  final String label;
  const NavItem(this.outlinedIcon, this.filledIcon, this.label);
}
