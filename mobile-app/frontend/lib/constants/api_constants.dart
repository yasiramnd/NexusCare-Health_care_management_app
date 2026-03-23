/// Central place for all backend API endpoints.
/// Change [baseUrl] to match where your Flask backend is running.
class ApiConstants {
  static const String baseUrl = 'http://127.0.0.1:5000';
  static const String chatbotUrl = 'https://13.60.80.212.nip.io';

  // ── Auth ──────────────────────────────────────────────────────────────
  static const String authMe       = '$baseUrl/auth/me';
  static const String authRegister      = '$baseUrl/auth/register';
  static const String authResetPassword = '$baseUrl/auth/reset-password';

  // ── Patient Registration ───────────────────────────────────────────────
  static const String patientRegister = '$baseUrl/patient/register';

  // ── Appointment ───────────────────────────────────────────────────────
  static const String appointmentBook = '$baseUrl/appointment/book';

  // ── Doctor Availability ───────────────────────────────────────────────
  static String doctorAvailableTimes(String doctorId, String date) =>
      '$baseUrl/doctor/available-times/$doctorId/$date';

  static String doctorAllAvailability(String doctorId) =>
      '$baseUrl/doctor/availability/$doctorId';

  static const String patientAppointments = "$baseUrl/appointment/patient";

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

  // ── Patient Profile ─────────────────────────────────────────────────
  static String patientProfile(String patientId) =>
      '$baseUrl/patient/profile/$patientId';

  // ── Change Password ─────────────────────────────────────────────────
  static const String changePassword = '$baseUrl/patient/change-password';
    // ── Chatbot ───────────────────────────────────────────────────────────
    static const String patientChat = '$chatbotUrl/patient/chat/message';
}
