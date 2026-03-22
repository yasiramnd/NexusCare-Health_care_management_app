import 'package:flutter/foundation.dart';
import '../../services/api_service.dart';

class PatientProvider extends ChangeNotifier {
  final ApiService _api = ApiService();

  // ── Upcoming Appointments ───────────────────────────────────────────
  Future<void> loadUpcomingAppointments(String patientId) async {
    _isLoading = true;
    notifyListeners();
    try {
      final res = await _api.getPatientAppointments(patientId);
      _upcomingAppointments = res['appointments'] ?? [];
    } catch (e) {
      debugPrint('Error loading upcoming appointments: $e');
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  // ── State ─────────────────────────────────────────────────────────────
  List<Map<String, dynamic>> _medicalRecords  = [];
  List<Map<String, dynamic>> _prescriptions   = [];
  List<Map<String, dynamic>> _labReports      = [];
  Map<String, dynamic>?      _emergencyProfile;
  List<String>               _availableTimes  = [];
  Map<String, List<String>>  _availabilityMap = {}; // Grouped by date
  List<dynamic>              _upcomingAppointments = [];
  bool                       _isLoading = false;
  String?                    _doctorName;
  String?                    _doctorSpec;
  bool                       _loading         = false;
  String?                    _error;

  List<Map<String, dynamic>> get medicalRecords  => _medicalRecords;
  List<Map<String, dynamic>> get prescriptions   => _prescriptions;
  List<Map<String, dynamic>> get labReports      => _labReports;
  Map<String, dynamic>?      get emergencyProfile => _emergencyProfile;
  List<String>               get availableTimes  => _availableTimes;
  Map<String, List<String>>  get availabilityMap => _availabilityMap;
  List<dynamic>              get upcomingAppointments => _upcomingAppointments;
  bool                       get isLoading => _isLoading;
  String?                    get doctorName      => _doctorName;
  String?                    get doctorSpec      => _doctorSpec;
  bool                       get loading         => _loading;
  String?                    get error           => _error;

  void _setLoading(bool v) { _loading = v; notifyListeners(); }
  void _setError(String? e) { _error = e; notifyListeners(); }

  // ── Medical Records ───────────────────────────────────────────────────
  Future<void> loadMedicalRecords(String patientId) async {
    _setLoading(true);
    try {
      final data = await _api.getMedicalRecords(patientId);
      _medicalRecords = List<Map<String, dynamic>>.from(
          data['medical_records'] ?? []);
      _error = null;
    } catch (e) {
      _error = e.toString().replaceFirst('Exception: ', '');
    } finally {
      _setLoading(false);
    }
  }

  // ── Prescriptions ─────────────────────────────────────────────────────
  Future<void> loadPrescriptions(String patientId) async {
    _setLoading(true);
    try {
      final data = await _api.getPrescriptions(patientId);
      _prescriptions = List<Map<String, dynamic>>.from(
          data['prescriptions'] ?? []);
      _error = null;
    } catch (e) {
      _error = e.toString().replaceFirst('Exception: ', '');
    } finally {
      _setLoading(false);
    }
  }

  // ── Lab Reports ───────────────────────────────────────────────────────
  Future<void> loadLabReports(String patientId) async {
    _setLoading(true);
    try {
      final data = await _api.getLabReports(patientId);
      _labReports = List<Map<String, dynamic>>.from(
          data['lab_reports'] ?? []);
      _error = null;
    } catch (e) {
      _error = e.toString().replaceFirst('Exception: ', '');
    } finally {
      _setLoading(false);
    }
  }

  // ── Available times ───────────────────────────────────────────────────
  Future<void> loadAvailableTimes(String doctorId, String date) async {
    _setLoading(true);
    try {
      final data = await _api.getAvailableTimes(doctorId, date);
      _availableTimes = List<String>.from(data['available_times'] ?? []);
      _doctorName     = data['doctor_name']?.toString();
      _doctorSpec     = data['specialization']?.toString();
      _availabilityMap = {}; // Clear map when searching by date
      _error = null;
    } catch (e) {
      _error = e.toString().replaceFirst('Exception: ', '');
      _availableTimes = [];
    } finally {
      _setLoading(false);
    }
  }

  Future<void> loadAllAvailability(String doctorId) async {
    _setLoading(true);
    try {
      final data = await _api.getDoctorAvailability(doctorId);
      _doctorName = data['doctor_name']?.toString();
      _doctorSpec = data['specialization']?.toString();
      
      final rawMap = data['availability'] as Map<String, dynamic>?;
      _availabilityMap = {};
      if (rawMap != null) {
        rawMap.forEach((key, value) {
          _availabilityMap[key] = List<String>.from(value);
        });
      }
      
      _availableTimes = []; // Clear list when fetching all
      _error = null;
    } catch (e) {
      _error = e.toString().replaceFirst('Exception: ', '');
      _availabilityMap = {};
    } finally {
      _setLoading(false);
    }
  }

  // ── Book appointment ──────────────────────────────────────────────────
  Future<String?> bookAppointment(Map<String, dynamic> body) async {
    try {
      await _api.bookAppointment(body);
      return null;
    } catch (e) {
      return e.toString().replaceFirst('Exception: ', '');
    }
  }

  // ── Emergency profile ─────────────────────────────────────────────────
  Future<String?> updateEmergency(String patientId, Map<String, dynamic> body) async {
    try {
      await _api.updateEmergencyProfile(patientId, body);
      _emergencyProfile = body;
      notifyListeners();
      return null;
    } catch (e) {
      return e.toString().replaceFirst('Exception: ', '');
    }
  }

  Future<String?> toggleVisibility(String patientId, bool isPublic) async {
    try {
      await _api.updateEmergencyVisibility(patientId, isPublic);
      if (_emergencyProfile != null) {
        _emergencyProfile!['is_public_visible'] = isPublic;
        notifyListeners();
      }
      return null;
    } catch (e) {
      return e.toString().replaceFirst('Exception: ', '');
    }
  }

  // ── Order medicine ────────────────────────────────────────────────────
  Future<String?> orderMedicine(Map<String, dynamic> body) async {
    try {
      await _api.orderMedicine(body);
      return null;
    } catch (e) {
      return e.toString().replaceFirst('Exception: ', '');
    }
  }

  void clearError() { _error = null; notifyListeners(); }
}
