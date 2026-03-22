/// Central place for all backend API endpoints.
/// Change [baseUrl] to match where your Flask backend is running.
class ApiConstants {
  static const String baseUrl = 'http://127.0.0.1:5000';

  // ── Auth ──────────────────────────────────────────────────────────────
  static const String authMe       = '$baseUrl/auth/me';
  static const String authRegister = '$baseUrl/auth/register';

  // ── Patient Registration ───────────────────────────────────────────────
  static const String patientRegister = '$baseUrl/patient/register';

  // ── Appointment ───────────────────────────────────────────────────────
  static const String appointmentBook = '$baseUrl/appointment/book';

  // ── Doctor Availability ───────────────────────────────────────────────
  static String doctorAvailableTimes(String doctorId, String date) =>
      '$baseUrl/doctor/available-times/$doctorId/$date';

  // ── Medical Records ───────────────────────────────────────────────────
  static String medicalRecords(String patientId) =>
      '$baseUrl/patient/medical-records/$patientId';

  // ── Prescriptions ─────────────────────────────────────────────────────
  static String prescriptions(String patientId) =>
      '$baseUrl/patient/prescriptions/$patientId';

  // ── Lab Reports ───────────────────────────────────────────────────────
  static String labReports(String patientId) =>
      '$baseUrl/patient/lab-reports/$patientId';

  // ── Emergency Profile ─────────────────────────────────────────────────
  static String emergencyProfileUpdate(String patientId) =>
      '$baseUrl/patient/emergency-profile/update/$patientId';

  static String emergencyVisibility(String patientId) =>
      '$baseUrl/patient/emergency-profile/visibility/$patientId';

  static String emergencyPublic(String patientId) =>
      '$baseUrl/emergency/public/$patientId';

  // ── Medicine Order ────────────────────────────────────────────────────
  static const String orderMedicine = '$baseUrl/prescription/order';
}
