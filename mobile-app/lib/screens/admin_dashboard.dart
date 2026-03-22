import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../services/api_service.dart';
import '../services/auth_provider.dart';
import '../theme/nexus_theme.dart';
import '../widgets/shared_widgets.dart';

class AdminDashboard extends StatefulWidget {
  const AdminDashboard({super.key});
  @override
  State<AdminDashboard> createState() => _AdminDashboardState();
}

class _AdminDashboardState extends State<AdminDashboard>
    with SingleTickerProviderStateMixin {
  Map<String, dynamic>? _dashboard;
  List<dynamic>         _pending  = [];
  bool                  _loading  = true;
  late TabController    _tab;

  @override
  void initState() {
    super.initState();
    _tab = TabController(length: 2, vsync: this);
    _load();
  }

  @override
  void dispose() { _tab.dispose(); super.dispose(); }

  Future<void> _load() async {
    setState(() => _loading = true);
    try {
      final results = await Future.wait([
        apiService.getAdminDashboard(),
        apiService.getPendingUsers(),
      ]);
      setState(() {
        _dashboard = results[0];
        _pending   = results[1]['pending_users'] ?? [];
        _loading   = false;
      });
    } catch (_) { setState(() => _loading = false); }
  }

  Future<void> _approve(String userId) async {
    try {
      await apiService.approveUser(userId);
      setState(() => _pending.removeWhere((u) => u['user_id'] == userId));
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('User approved ✓'), backgroundColor: Color(0xFF00897B)),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error: $e'), backgroundColor: NexusTheme.emergency),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();
    return Scaffold(
      backgroundColor: NexusTheme.surface,
      body: NestedScrollView(
        headerSliverBuilder: (_, __) => [
          SliverAppBar(
            expandedHeight: 160,
            pinned: true,
            backgroundColor: NexusTheme.textDark,
            automaticallyImplyLeading: false,
            flexibleSpace: FlexibleSpaceBar(
              background: Container(
                decoration: const BoxDecoration(
                  gradient: LinearGradient(
                    colors: [Color(0xFF1A1A2E), Color(0xFF16213E)],
                    begin: Alignment.topLeft, end: Alignment.bottomRight,
                  ),
                ),
                child: SafeArea(child: Padding(
                  padding: const EdgeInsets.fromLTRB(20, 16, 20, 0),
                  child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                    Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
                      const RoleChip(role: 'ADMIN'),
                      IconButton(
                        icon: const Icon(Icons.logout, color: Colors.white70),
                        onPressed: () { auth.logout(); Navigator.pushReplacementNamed(context, '/'); },
                      ),
                    ]),
                    const SizedBox(height: 8),
                    Text('Welcome, ${auth.name ?? 'Admin'}', style: const TextStyle(color: Colors.white, fontSize: 20, fontWeight: FontWeight.w800)),
                    const Text('NexusCare System Administration', style: TextStyle(color: Colors.white54, fontSize: 12)),
                  ]),
                )),
              ),
            ),
            bottom: TabBar(
              controller: _tab,
              labelColor: Colors.white,
              unselectedLabelColor: Colors.white54,
              indicatorColor: NexusTheme.accent,
              tabs: [
                const Tab(text: 'Dashboard'),
                Tab(text: 'Pending (${_pending.length})'),
              ],
            ),
          ),
        ],
        body: _loading
            ? const Center(child: CircularProgressIndicator(color: NexusTheme.primary))
            : TabBarView(controller: _tab, children: [
                _buildDashboard(),
                _buildPendingUsers(),
              ]),
      ),
    );
  }

  Widget _buildDashboard() {
    final stats = _dashboard?['stats'] ?? {};
    return SingleChildScrollView(
      padding: const EdgeInsets.all(20),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        const SectionHeader(title: 'System Overview'),
        const SizedBox(height: 14),
        GridView.count(
          crossAxisCount: 2, shrinkWrap: true, physics: const NeverScrollableScrollPhysics(),
          mainAxisSpacing: 12, crossAxisSpacing: 12, childAspectRatio: 1.3,
          children: [
            StatCard(label: 'Total Patients', value: '${stats['total_patients'] ?? 0}',
                icon: Icons.people, color: NexusTheme.primary),
            StatCard(label: 'Doctors', value: '${stats['total_doctors'] ?? 0}',
                icon: Icons.medical_services, color: const Color(0xFF7B2D8B)),
            StatCard(label: 'Pending Approvals', value: '${stats['pending_approvals'] ?? 0}',
                icon: Icons.pending_actions, color: NexusTheme.warning),
            StatCard(label: 'Orders Today', value: '${stats['orders_today'] ?? 0}',
                icon: Icons.shopping_bag, color: const Color(0xFF00897B)),
          ],
        ),
        const SizedBox(height: 24),

        // Quick actions
        const SectionHeader(title: 'Admin Actions'),
        const SizedBox(height: 14),
        ...[
          ('Manage User Roles',      Icons.manage_accounts,       NexusTheme.primary),
          ('View Audit Logs',        Icons.history,               const Color(0xFF37474F)),
          ('System Health Check',    Icons.monitor_heart,         NexusTheme.accent),
          ('Export Reports',         Icons.download_for_offline,  NexusTheme.warning),
        ].map<Widget>((item) => Container(
          margin: const EdgeInsets.only(bottom: 10),
          child: ListTile(
            contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14),
                side: const BorderSide(color: NexusTheme.divider)),
            tileColor: Colors.white,
            leading: Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(color: item.$3.withOpacity(0.1), borderRadius: BorderRadius.circular(10)),
              child: Icon(item.$2, color: item.$3, size: 20),
            ),
            title: Text(item.$1, style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w600)),
            trailing: const Icon(Icons.chevron_right, color: NexusTheme.textLight),
            onTap: () async {
              if (item.$1 == 'System Health Check') {
                final h = await apiService.healthCheck();
                if (mounted) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(content: Text('System: ${h['status']} · ${h['service']}'),
                        backgroundColor: NexusTheme.accent),
                  );
                }
              }
            },
          ),
        )),
      ]),
    );
  }

  Widget _buildPendingUsers() {
    if (_pending.isEmpty) return const Center(
      child: Column(mainAxisSize: MainAxisSize.min, children: [
        Icon(Icons.check_circle_outline, size: 56, color: NexusTheme.accent),
        SizedBox(height: 12),
        Text('All users approved', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600, color: NexusTheme.textMed)),
      ]),
    );
    return ListView.separated(
      padding: const EdgeInsets.all(20),
      itemCount: _pending.length,
      separatorBuilder: (_, __) => const SizedBox(height: 10),
      itemBuilder: (_, i) {
        final u = _pending[i];
        return Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(14),
            border: Border.all(color: NexusTheme.divider),
          ),
          child: Row(children: [
            CircleAvatar(
              backgroundColor: NexusTheme.roleColor(u['role']).withOpacity(0.1),
              child: Icon(Icons.person, color: NexusTheme.roleColor(u['role'])),
            ),
            const SizedBox(width: 12),
            Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Text(u['username'] ?? '', style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w700)),
              Text(u['email']    ?? '', style: const TextStyle(fontSize: 12, color: NexusTheme.textMed)),
              const SizedBox(height: 4),
              RoleChip(role: u['role'] ?? 'PATIENT'),
            ])),
            const SizedBox(width: 8),
            ElevatedButton(
              onPressed: () => _approve(u['user_id']),
              style: ElevatedButton.styleFrom(
                backgroundColor: NexusTheme.accent, padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                textStyle: const TextStyle(fontSize: 12, fontWeight: FontWeight.w700),
              ),
              child: const Text('Approve'),
            ),
          ]),
        );
      },
    );
  }
}
