import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:flutter_animate/flutter_animate.dart';
import '../providers/auth_provider.dart';
import '../providers/patient_provider.dart';
import '../widgets/nx_text_field.dart';
import '../widgets/nx_button.dart';

class AppointmentsScreen extends StatefulWidget {
  const AppointmentsScreen({super.key});
  @override
  State<AppointmentsScreen> createState() => _AppointmentsScreenState();
}

class _AppointmentsScreenState extends State<AppointmentsScreen> {
  final _doctorIdCtrl = TextEditingController();
  DateTime? _selectedDate;
  String? _selectedTime;
  bool _loadingSlots = false;
  bool _booking      = false;
  String? _error;
  String? _success;

  @override
  void dispose() {
    _doctorIdCtrl.dispose();
    super.dispose();
  }

  Future<void> _pickDate() async {
    final picked = await showDatePicker(
      context: context,
      initialDate: DateTime.now().add(const Duration(days: 1)),
      firstDate: DateTime.now(),
      lastDate: DateTime.now().add(const Duration(days: 90)),
      builder: (ctx, child) => Theme(
        data: Theme.of(ctx).copyWith(
          colorScheme: const ColorScheme.dark(
            primary: Color(0xFF1E6FFF), surface: Color(0xFF1F2937))),
        child: child!),
    );
    if (picked != null) {
      setState(() { _selectedDate = picked; _selectedTime = null; });
    }
  }

  Future<void> _loadSlots() async {
    if (_doctorIdCtrl.text.isEmpty) {
      setState(() => _error = 'Please enter a Doctor ID');
      return;
    }
    setState(() { _loadingSlots = true; _error = null; _selectedTime = null; });
    
    if (_selectedDate != null) {
      // If date is selected, fetch for that specific date
      final date = '${_selectedDate!.year}-${_selectedDate!.month.toString().padLeft(2,'0')}-${_selectedDate!.day.toString().padLeft(2,'0')}';
      await context.read<PatientProvider>().loadAvailableTimes(
          _doctorIdCtrl.text.trim(), date);
    } else {
      // Fetch all future availability
      await context.read<PatientProvider>().loadAllAvailability(
          _doctorIdCtrl.text.trim());
    }
    setState(() => _loadingSlots = false);
  }

  Future<void> _book() async {
    final auth = context.read<AuthProvider>();
    final provider = context.read<PatientProvider>();
    if (_selectedTime == null) {
      setState(() => _error = 'Please select a time slot'); return;
    }
    if (auth.patientId == null) {
      setState(() => _error = 'Patient ID not set. Please login again or update your profile.'); return;
    }
    setState(() { _booking = true; _error = null; _success = null; });
    final date = '${_selectedDate!.year}-${_selectedDate!.month.toString().padLeft(2,'0')}-${_selectedDate!.day.toString().padLeft(2,'0')}';
    final err = await provider.bookAppointment({
      'patient_id':    auth.patientId,
      'doctor_id':     _doctorIdCtrl.text.trim(),
      'available_date':date,
      'available_time':_selectedTime,
    });
    setState(() {
      _booking = false;
      if (err == null) {
        _success = 'Appointment booked successfully! 🎉';
        _selectedTime = null;
      } else {
        _error = err;
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    final provider = context.watch<PatientProvider>();
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
        _header('Book Appointment', Icons.calendar_month_rounded),
        const SizedBox(height: 28),

        // Patient ID notice
        if (auth.patientId == null) ...[
          _infoBox(Icons.info_outline, 'Patient ID is missing. Please login again or contact support.',
              const Color(0xFFD97706)),
          const SizedBox(height: 20),
        ],

        // Form card
        Container(
          padding: const EdgeInsets.all(28),
          decoration: _cardDecor(),
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Text('Find Available Slots', style: GoogleFonts.inter(
                fontSize: 18, fontWeight: FontWeight.w700, color: Colors.white, letterSpacing: 0.3)),
            const SizedBox(height: 24),

             NxTextField(
              controller: _doctorIdCtrl, label: 'Doctor ID',
              hint: 'e.g. DOC0008', icon: Icons.person_search_outlined,
              onChanged: (v) {
                if (v.length >= 3) _loadSlots(); // Auto-fetch as user types
              },
            ),
            const SizedBox(height: 20),

            // Optional: You can still keep the date picker if they want to filter, 
            // but the user says "just type doctor id", so I'll make it secondary or remove it.
            // I'll keep it but make it clear it's optional.
            Text('Optionally filter by date', style: GoogleFonts.inter(
                fontSize: 13, color: const Color(0xFF9CA3AF), fontWeight: FontWeight.w500)),
            const SizedBox(height: 10),
            GestureDetector(
              onTap: _pickDate,
              child: Container(
                width: double.infinity,
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                decoration: BoxDecoration(
                  color: const Color(0xFF1F2937),
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: const Color(0xFF2D3748), width: 1.5),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withOpacity(0.2),
                      blurRadius: 8,
                      offset: const Offset(0, 2),
                    ),
                  ],
                ),
                child: Row(children: [
                  const Icon(Icons.calendar_today_outlined, color: Color(0xFF9CA3AF), size: 18),
                  const SizedBox(width: 12),
                  Text(
                    _selectedDate == null ? 'All Dates'
                        : '${_selectedDate!.day}/${_selectedDate!.month}/${_selectedDate!.year}',
                    style: GoogleFonts.inter(fontSize: 14, fontWeight: FontWeight.w500,
                        color: _selectedDate == null ? const Color(0xFF9CA3AF) : Colors.white),
                  ),
                  if (_selectedDate != null) ...[
                    const Spacer(),
                    GestureDetector(
                      onTap: () {
                        setState(() { _selectedDate = null; });
                        _loadSlots();
                      },
                      child: const Icon(Icons.close_rounded, color: Color(0xFFEF4444), size: 20),
                    ),
                  ],
                ]),
              ),
            ),
            const SizedBox(height: 20),

            NxButton(
              label: 'Check Available Times',
              loading: _loadingSlots,
              icon: Icons.search_rounded,
              onPressed: _loadSlots,
            ),
          ]),
        ).animate().fadeIn(duration: 400.ms).slideY(begin: 0.1),

        const SizedBox(height: 28),         // Available times (Date-specific list)
        if (provider.availableTimes.isNotEmpty) ...[
          if (provider.doctorName != null)
            _doctorInfoCard(provider.doctorName!, provider.doctorSpec ?? ''),
          const SizedBox(height: 20),

          Text('Select a Time Slot', style: GoogleFonts.inter(
              fontSize: 15, fontWeight: FontWeight.w700, color: Colors.white, letterSpacing: 0.2)),
          const SizedBox(height: 14),

          _timeSlotsGrid(provider.availableTimes),

          const SizedBox(height: 24),
          NxButton(label: 'Confirm Booking', loading: _booking, onPressed: _book,
              icon: Icons.check_circle_outline_rounded),
        ],

        // Available times (Grouped by Date map)
        if (provider.availabilityMap.isNotEmpty) ...[
          if (provider.doctorName != null)
            _doctorInfoCard(provider.doctorName!, provider.doctorSpec ?? ''),
          const SizedBox(height: 20),
          
          Text('Available Dates and Times', style: GoogleFonts.inter(
              fontSize: 16, fontWeight: FontWeight.w700, color: Colors.white)),
          const SizedBox(height: 12),

          ...provider.availabilityMap.entries.map((entry) {
            final dateKey = entry.key;
            final times = entry.value;
            return Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Padding(
                  padding: const EdgeInsets.symmetric(vertical: 8.0),
                  child: Row(
                    children: [
                      const Icon(Icons.calendar_today, size: 16, color: Color(0xFF60A5FA)),
                      const SizedBox(width: 8),
                      Text(
                        dateKey, 
                        style: GoogleFonts.inter(
                          fontWeight: FontWeight.w700, 
                          color: const Color(0xFF60A5FA),
                          fontSize: 15
                        )
                      ),
                    ],
                  ),
                ),
                _timeSlotsGrid(times, onSelect: (t) {
                  setState(() {
                    _selectedTime = t;
                    // Auto-parse the date from the key
                    final parts = dateKey.split('-');
                    _selectedDate = DateTime(
                      int.parse(parts[0]), 
                      int.parse(parts[1]), 
                      int.parse(parts[2])
                    );
                  });
                }, activeDate: dateKey),
                const SizedBox(height: 12),
              ],
            );
          }).toList(),

          const SizedBox(height: 20),
          if (_selectedTime != null && _selectedDate != null)
            NxButton(
              label: 'Confirm Booking for ${_selectedDate!.day}/${_selectedDate!.month} at $_selectedTime', 
              loading: _booking, 
              onPressed: _book,
              icon: Icons.check_circle_outline_rounded
            ),
        ],

        if (provider.availableTimes.isEmpty && provider.availabilityMap.isEmpty && !_loadingSlots && provider.doctorName != null)
          _infoBox(Icons.event_busy_rounded, 'No available slots on selected date. Try another date.',
              const Color(0xFFD97706)),

        if (_error != null) ...[
          const SizedBox(height: 16),
          _msgBox(_error!, isError: true),
        ],
        if (_success != null) ...[
          const SizedBox(height: 16),
          _msgBox(_success!, isError: false),
        ],
      ]),
    );
  }

  Widget _header(String title, IconData icon) => Row(children: [
    Container(width: 40, height: 40,
        decoration: BoxDecoration(
            color: const Color(0xFF1E6FFF).withOpacity(0.15),
            borderRadius: BorderRadius.circular(10)),
        child: Icon(icon, color: const Color(0xFF60A5FA), size: 22)),
    const SizedBox(width: 12),
    Text(title, style: GoogleFonts.inter(
        fontSize: 22, fontWeight: FontWeight.w800, color: Colors.white)),
  ]);

  BoxDecoration _cardDecor({Color? border}) => BoxDecoration(
    color: const Color(0xFF111827), borderRadius: BorderRadius.circular(16),
    border: Border.all(color: border ?? const Color(0xFF1F2937)),
  );

  Widget _infoBox(IconData icon, String msg, Color color) => Container(
    padding: const EdgeInsets.all(14),
    decoration: BoxDecoration(
      color: color.withOpacity(0.1), borderRadius: BorderRadius.circular(10),
      border: Border.all(color: color.withOpacity(0.3)),
    ),
    child: Row(children: [
      Icon(icon, color: color, size: 20),
      const SizedBox(width: 10),
      Expanded(child: Text(msg, style: GoogleFonts.inter(fontSize: 13, color: color))),
    ]),
  );

  Widget _msgBox(String msg, {required bool isError}) => Container(
    padding: const EdgeInsets.all(12),
    decoration: BoxDecoration(
      color: (isError ? const Color(0xFFEF4444) : const Color(0xFF10B981)).withOpacity(0.12),
      borderRadius: BorderRadius.circular(10),
      border: Border.all(color: (isError ? const Color(0xFFEF4444) : const Color(0xFF10B981)).withOpacity(0.4)),
    ),
    child: Text(msg, style: GoogleFonts.inter(
        fontSize: 13,
        color: isError ? const Color(0xFFFCA5A5) : const Color(0xFF6EE7B7))),
  );

  Widget _doctorInfoCard(String name, String spec) => Container(
    padding: const EdgeInsets.all(16),
    decoration: _cardDecor(border: const Color(0xFF1D4ED8)),
    child: Row(children: [
      Container(width: 42, height: 42,
          decoration: BoxDecoration(
              color: const Color(0xFF1E6FFF).withOpacity(0.15),
              borderRadius: BorderRadius.circular(10)),
          child: const Icon(Icons.person_rounded, color: Color(0xFF60A5FA), size: 22)),
      const SizedBox(width: 12),
      Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Text(name, style: GoogleFonts.inter(
            fontWeight: FontWeight.w700, color: Colors.white)),
        Text(spec, style: GoogleFonts.inter(
            fontSize: 12, color: const Color(0xFF6B7280))),
      ]),
    ]),
  );

  Widget _timeSlotsGrid(List<String> times, {Function(String)? onSelect, String? activeDate}) => Wrap(
    spacing: 10, runSpacing: 10,
    children: times.map((t) {
      final isDateMatch = activeDate == null || 
          (_selectedDate != null && 
           '${_selectedDate!.year}-${_selectedDate!.month.toString().padLeft(2,'0')}-${_selectedDate!.day.toString().padLeft(2,'0')}' == activeDate);
      final sel = _selectedTime == t && isDateMatch;
      
      return GestureDetector(
        onTap: () {
          if (onSelect != null) {
            onSelect(t);
          } else {
            setState(() => _selectedTime = t);
          }
        },
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 200),
          padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 10),
          decoration: BoxDecoration(
            color: sel ? const Color(0xFF1E6FFF) : const Color(0xFF1F2937),
            borderRadius: BorderRadius.circular(10),
            border: Border.all(color: sel ? const Color(0xFF1E6FFF) : const Color(0xFF374151)),
          ),
          child: Text(t, style: GoogleFonts.inter(
              fontWeight: FontWeight.w600, fontSize: 13,
              color: sel ? Colors.white : const Color(0xFF9CA3AF))),
        ),
      );
    }).toList(),
  ).animate().fadeIn(delay: 200.ms);
}
