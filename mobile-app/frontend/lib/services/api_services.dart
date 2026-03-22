import 'dart:convert';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:http/http.dart' as http;
import '../constants/api_constants.dart';

/// Wraps all HTTP calls to the NexusCare Flask backend.
/// Automatically attaches the Firebase ID token for protected routes.
class ApiService {
  // ── Token helper ───────────────────────────────────────────────────────
  Future<String?> _getToken() async {
    final user = FirebaseAuth.instance.currentUser;
    return user?.getIdToken();
  }

  Map<String, String> _headers(String? token) => {
    'Content-Type': 'application/json',
    if (token != null) 'Authorization': 'Bearer $token',
  };

  // ── Auth: /auth/me ─────────────────────────────────────────────────────
  Future<Map<String, dynamic>> getMe() async {
    final token = await _getToken();
    final res = await http.get(
      Uri.parse(ApiConstants.authMe),
      headers: _headers(token),
    );
    return _parse(res);
  }

  // ── Patient: register ──────────────────────────────────────────────────
  Future<Map<String, dynamic>> registerPatient(Map<String, dynamic> body) async {
    final res = await http.post(
      Uri.parse(ApiConstants.patientRegister),
      headers: _headers(null),
      body: jsonEncode(body),
    );
    return _parse(res);
  }

  // ── Auth: reset password ──────────────────────────────────────────────
  Future<Map<String, dynamic>> resetPassword(String email, String newPassword) async {
    final res = await http.post(
      Uri.parse(ApiConstants.authResetPassword),
      headers: _headers(null),
      body: jsonEncode({
        'email': email,
        'new_password': newPassword,
      }),
    );
    return _parse(res);
  }

  // ── Doctor available times ─────────────────────────────────────────────
  Future<Map<String, dynamic>> getAvailableTimes(String doctorId, String date) async {
    final token = await _getToken();
    final res = await http.get(
      Uri.parse(ApiConstants.doctorAvailableTimes(doctorId, date)),
      headers: _headers(token),
    );
    return _parse(res);
  }

  Future<Map<String, dynamic>> getDoctorAvailability(String doctorId) async {
    final token = await _getToken();
    final res = await http.get(
      Uri.parse(ApiConstants.doctorAllAvailability(doctorId)),
      headers: _headers(token),
    );
    return _parse(res);
  }

  // ── Book appointment ───────────────────────────────────────────────────
  Future<Map<String, dynamic>> bookAppointment(Map<String, dynamic> body) async {
    final token = await _getToken();
    final res = await http.post(
      Uri.parse(ApiConstants.appointmentBook),
      headers: _headers(token),
      body: jsonEncode(body),
    );
    return _parse(res);
  }

  // ── Upcoming Appointments ───────────────────────────────────────────
  Future<Map<String, dynamic>> getPatientAppointments(String patientId) async {
    final token = await _getToken();
    final res = await http.get(
      Uri.parse('${ApiConstants.patientAppointments}/$patientId'),
      headers: _headers(token),
    );
    return _parse(res);
  }

  // ── Medical records ────────────────────────────────────────────────────
  Future<Map<String, dynamic>> getMedicalRecords(String patientId) async {
    final token = await _getToken();
    final res = await http.get(
      Uri.parse(ApiConstants.medicalRecords(patientId)),
      headers: _headers(token),
    );
    return _parse(res);
  }

  // ── Prescriptions ──────────────────────────────────────────────────────
  Future<Map<String, dynamic>> getPrescriptions(String patientId) async {
    final token = await _getToken();
    final res = await http.get(
      Uri.parse(ApiConstants.prescriptions(patientId)),
      headers: _headers(token),
    );
    return _parse(res);
  }

  // ── Lab reports ────────────────────────────────────────────────────────
  Future<Map<String, dynamic>> getLabReports(String patientId) async {
    final token = await _getToken();
    final res = await http.get(
      Uri.parse(ApiConstants.labReports(patientId)),
      headers: _headers(token),
    );
    return _parse(res);
  }

  // ── Emergency profile update ───────────────────────────────────────────
  Future<Map<String, dynamic>> updateEmergencyProfile(
      String patientId, Map<String, dynamic> body) async {
    final token = await _getToken();
    final res = await http.put(
      Uri.parse(ApiConstants.emergencyProfileUpdate(patientId)),
      headers: _headers(token),
      body: jsonEncode(body),
    );
    return _parse(res);
  }

  // ── Emergency visibility toggle ────────────────────────────────────────
  Future<Map<String, dynamic>> updateEmergencyVisibility(
      String patientId, bool isPublic) async {
    final token = await _getToken();
    final res = await http.put(
      Uri.parse(ApiConstants.emergencyVisibility(patientId)),
      headers: _headers(token),
      body: jsonEncode({'is_public_visible': isPublic}),
    );
    return _parse(res);
  }

  // ── Public emergency (no auth) ─────────────────────────────────────────
  Future<Map<String, dynamic>> getPublicEmergency(String patientId) async {
    final res = await http.get(
      Uri.parse(ApiConstants.emergencyPublic(patientId)),
      headers: _headers(null),
    );
    return _parse(res);
  }

  // ── Order medicine ─────────────────────────────────────────────────────
  Future<Map<String, dynamic>> orderMedicine(Map<String, dynamic> body) async {
    final token = await _getToken();
    final res = await http.post(
      Uri.parse(ApiConstants.orderMedicine),
      headers: _headers(token),
      body: jsonEncode(body),
    );
    return _parse(res);
  }

  // ── Get patient profile ────────────────────────────────────────────────
  Future<Map<String, dynamic>> getProfile(String patientId) async {
    final token = await _getToken();
    final res = await http.get(
      Uri.parse(ApiConstants.patientProfile(patientId)),
      headers: _headers(token),
    );
    return _parse(res);
  }

  // ── Update patient profile ─────────────────────────────────────────────
  Future<Map<String, dynamic>> updateProfile(
      String patientId, Map<String, dynamic> body) async {
    final token = await _getToken();
    final res = await http.put(
      Uri.parse(ApiConstants.patientProfile(patientId)),
      headers: _headers(token),
      body: jsonEncode(body),
    );
    return _parse(res);
  }

  // ── Change password ────────────────────────────────────────────────────
  Future<Map<String, dynamic>> changePassword(String newPassword) async {
    final token = await _getToken();
    final res = await http.post(
      Uri.parse(ApiConstants.changePassword),
      headers: _headers(token),
      body: jsonEncode({'new_password': newPassword}),
    );
    return _parse(res);
  }

  // ── Internal parser ────────────────────────────────────────────────────
  Map<String, dynamic> _parse(http.Response res) {
    final body = jsonDecode(res.body) as Map<String, dynamic>;
    if (res.statusCode >= 200 && res.statusCode < 300) return body;
    throw Exception(body['error'] ?? 'Unknown server error (${res.statusCode})');
  }
}
