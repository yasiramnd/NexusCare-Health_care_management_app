import 'package:flutter/foundation.dart';
import '../services/api_service.dart';

class PatientProvider extends ChangeNotifier {
  final ApiService _api = ApiService();

  // ── State ─────────────────────────────────────────────────────────────
  List<Map<String, dynamic>> _medicalRecords  = [];
  List<Map<String, dynamic>> _prescriptions   = [];
  List<Map<String, dynamic>> _labReports      = [];
  Map<String, dynamic>?      _emergencyProfile;
  List<String>               _availableTimes  = [];
  String?                    _doctorName;
  String?                    _doctorSpec;
  bool                       _loading         = false;
  String?                    _error;

  List<Map<String, dynamic>> get medicalRecords  => _medicalRecords;
  List<Map<String, dynamic>> get prescriptions   => _prescriptions;
  List<Map<String, dynamic>> get labReports      => _labReports;
  Map<String, dynamic>?      get emergencyProfile => _emergencyProfile;
  List<String>               get availableTimes  => _availableTimes;
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
      _error = null;
    } catch (e) {
      _error = e.toString().replaceFirst('Exception: ', '');
      _availableTimes = [];
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
