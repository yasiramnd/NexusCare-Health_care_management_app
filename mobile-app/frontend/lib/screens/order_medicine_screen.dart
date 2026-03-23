import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:flutter_animate/flutter_animate.dart';
import '../providers/auth_provider.dart';
import '../providers/patient_provider.dart';
import '../widgets/nx_text_field.dart';
import '../widgets/nx_button.dart';

class OrderMedicineScreen extends StatefulWidget {
  const OrderMedicineScreen({super.key});
  @override
  State<OrderMedicineScreen> createState() => _OrderMedicineScreenState();
}

class _OrderMedicineScreenState extends State<OrderMedicineScreen> {
  final _rxIdCtrl     = TextEditingController();
  final _pharmCtrl    = TextEditingController();
  final _colTimeCtrl  = TextEditingController();
  String _orderType   = 'normal';
  bool   _loading     = false;
  String? _error;
  String? _success;

  @override
  void dispose() {
    _rxIdCtrl.dispose(); _pharmCtrl.dispose(); _colTimeCtrl.dispose();
    super.dispose();
  }

  Future<void> _order() async {
    final auth = context.read<AuthProvider>();
    if (_rxIdCtrl.text.isEmpty || _pharmCtrl.text.isEmpty) {
      setState(() => _error = 'Prescription ID and Pharmacy ID are required'); return;
    }
    if (_orderType == 'priority' && _colTimeCtrl.text.isEmpty) {
      setState(() => _error = 'Collecting time is required for priority orders'); return;
    }
    setState(() { _loading = true; _error = null; _success = null; });

    final body = {
      'order_type':      _orderType,
      'patient_id':      auth.patientId ?? '',
      'prescription_id': _rxIdCtrl.text.trim(),
      'pharmacy_id':     _pharmCtrl.text.trim(),
      if (_orderType == 'priority') 'collecting_time': _colTimeCtrl.text.trim(),
    };

    final err = await context.read<PatientProvider>().orderMedicine(body);
    setState(() {
      _loading = false;
      if (err == null) {
        _success = '${_orderType == 'priority' ? 'Priority' : 'Normal'} order placed successfully! 🎉';
        _rxIdCtrl.clear(); _pharmCtrl.clear(); _colTimeCtrl.clear();
      } else {
        _error = err;
      }
    });
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
                    colors: [Color(0xFFDB2777), Color(0xFFF472B6)],
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                  ),
                  borderRadius: BorderRadius.circular(12),
                  boxShadow: [
                    BoxShadow(
                      color: const Color(0xFFF472B6).withOpacity(0.3),
                      blurRadius: 12,
                      offset: const Offset(0, 4),
                    ),
                  ]),
                child: const Icon(Icons.local_pharmacy_rounded, color: Colors.white, size: 24)),
            const SizedBox(width: 16),
            Text('Order Medicine', style: GoogleFonts.inter(
                fontSize: 26, fontWeight: FontWeight.w900, color: Colors.white, letterSpacing: -0.5)),
          ]).animate().fadeIn(),

          const SizedBox(height: 10),
          Text('Place a normal or priority medicine order from your prescription.',
              style: GoogleFonts.inter(fontSize: 14, color: const Color(0xFF9CA3AF), fontWeight: FontWeight.w500, height: 1.5)),
          const SizedBox(height: 28),

        if (auth.patientId == null)
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(color: const Color(0xFFD97706).withOpacity(0.1),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: const Color(0xFFD97706).withOpacity(0.3))),
            child: Text('Please set your Patient ID in the Emergency screen first.',
                style: GoogleFonts.inter(fontSize: 13, color: const Color(0xFFFCD34D))),
          )
        else ...[
          // Order type selector
          Container(
            padding: const EdgeInsets.all(4),
            decoration: BoxDecoration(color: const Color(0xFF1F2937),
                borderRadius: BorderRadius.circular(12)),
            child: Row(children: ['normal', 'priority'].map((t) {
              final sel = _orderType == t;
              return Expanded(child: GestureDetector(
                onTap: () => setState(() => _orderType = t),
                child: AnimatedContainer(
                  duration: const Duration(milliseconds: 200),
                  padding: const EdgeInsets.symmetric(vertical: 12),
                  margin: const EdgeInsets.all(2),
                  decoration: BoxDecoration(
                    color: sel ? const Color(0xFFDB2777) : Colors.transparent,
                    borderRadius: BorderRadius.circular(10),
                    boxShadow: sel ? [BoxShadow(
                        color: const Color(0xFFDB2777).withOpacity(0.3),
                        blurRadius: 12)] : null,
                  ),
                  child: Center(child: Row(mainAxisSize: MainAxisSize.min, children: [
                    Icon(t == 'normal' ? Icons.shopping_cart_outlined : Icons.priority_high_rounded,
                        size: 16,
                        color: sel ? Colors.white : const Color(0xFF6B7280)),
                    const SizedBox(width: 6),
                    Text(t[0].toUpperCase() + t.substring(1) + ' Order',
                        style: GoogleFonts.inter(
                            fontSize: 13, fontWeight: FontWeight.w600,
                            color: sel ? Colors.white : const Color(0xFF6B7280))),
                  ])),
                ),
              ));
            }).toList()),
          ).animate().fadeIn(delay: 100.ms),

          const SizedBox(height: 20),

          if (_orderType == 'priority')
            Container(
              padding: const EdgeInsets.all(12),
              margin: const EdgeInsets.only(bottom: 16),
              decoration: BoxDecoration(
                  color: const Color(0xFFDB2777).withOpacity(0.1),
                  borderRadius: BorderRadius.circular(10),
                  border: Border.all(color: const Color(0xFFDB2777).withOpacity(0.3))),
              child: Row(children: [
                const Icon(Icons.priority_high_rounded, color: Color(0xFFF472B6), size: 18),
                const SizedBox(width: 8),
                Expanded(child: Text('Priority orders are prepared faster and collected at a specific time.',
                    style: GoogleFonts.inter(fontSize: 12, color: const Color(0xFFF9A8D4)))),
              ]),
            ),

          Container(
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(color: const Color(0xFF111827),
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: const Color(0xFF1F2937))),
            child: Column(children: [
              NxTextField(
                controller: _rxIdCtrl, label: 'Prescription ID',
                hint: 'From your Prescriptions list', icon: Icons.receipt_long_outlined,
                keyboardType: TextInputType.number,
              ),
              const SizedBox(height: 14),
              NxTextField(
                controller: _pharmCtrl, label: 'Pharmacy ID',
                hint: 'e.g. 1', icon: Icons.local_pharmacy_outlined,
                keyboardType: TextInputType.number,
              ),
              if (_orderType == 'priority') ...[
                const SizedBox(height: 14),
                NxTextField(
                  controller: _colTimeCtrl, label: 'Collection Time',
                  hint: 'e.g. 14:30', icon: Icons.access_time_outlined,
                ),
              ],
            ]),
          ).animate().fadeIn(delay: 200.ms).slideY(begin: 0.1),

          const SizedBox(height: 20),

          if (_error != null)
            Container(
              padding: const EdgeInsets.all(12),
              margin: const EdgeInsets.only(bottom: 12),
              decoration: BoxDecoration(color: const Color(0xFFEF4444).withOpacity(0.12),
                  borderRadius: BorderRadius.circular(10),
                  border: Border.all(color: const Color(0xFFEF4444).withOpacity(0.4))),
              child: Text(_error!, style: GoogleFonts.inter(fontSize: 13, color: const Color(0xFFFCA5A5))),
            ),
          if (_success != null)
            Container(
              padding: const EdgeInsets.all(12),
              margin: const EdgeInsets.only(bottom: 12),
              decoration: BoxDecoration(color: const Color(0xFF10B981).withOpacity(0.12),
                  borderRadius: BorderRadius.circular(10),
                  border: Border.all(color: const Color(0xFF10B981).withOpacity(0.4))),
              child: Text(_success!, style: GoogleFonts.inter(fontSize: 13, color: const Color(0xFF6EE7B7))),
            ),

          NxButton(
            label: 'Place Order',
            loading: _loading,
            icon: Icons.shopping_cart_checkout_rounded,
            onPressed: _order,
          ).animate().fadeIn(delay: 300.ms),
        ],
      ]),
    );
  }
}
