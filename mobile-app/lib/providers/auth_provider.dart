import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/foundation.dart';
import '../services/api_service.dart';

enum AuthStatus { initial, loading, authenticated, unauthenticated, error }

class AuthProvider extends ChangeNotifier {
  final FirebaseAuth _auth = FirebaseAuth.instance;
  final ApiService _api = ApiService();

  AuthStatus _status = AuthStatus.initial;
  User? _firebaseUser;
  String? _userId;      // NEX000001 from backend
  String? _role;        // PATIENT, DOCTOR, etc.
  String? _name;        // Full name from DB
  String? _patientId;   // numeric patient_id from hospital DB
  String? _errorMsg;

  AuthStatus get status      => _status;
  User?      get firebaseUser => _firebaseUser;
  String?    get userId      => _userId;
  String?    get role        => _role;
  String?    get name        => _name;
  String?    get patientId   => _patientId;
  String?    get errorMsg    => _errorMsg;
  bool       get isLoggedIn  => _status == AuthStatus.authenticated;

  AuthProvider() {
    _auth.authStateChanges().listen(_onAuthChanged);
  }

  Future<void> _onAuthChanged(User? user) async {
    if (user == null) {
      _status = AuthStatus.unauthenticated;
      _firebaseUser = null;
      _userId = null;
      _role = null;
      _name = null;
      _patientId = null;
      notifyListeners();
      return;
    }
    _firebaseUser = user;
    await _fetchBackendUser();
  }

  Future<void> _fetchBackendUser() async {
    try {
      final data = await _api.getMe();
      _userId    = data['user_id']?.toString();
      _role      = data['role']?.toString();
      _name      = data['name']?.toString();
      _patientId = data['patient_id']?.toString();
      _status    = AuthStatus.authenticated;
    } catch (e) {
      _status   = AuthStatus.error;
      _errorMsg = e.toString();
    }
    notifyListeners();
  }

  // ── Sign In ──────────────────────────────────────────────────────────
  Future<void> signIn(String email, String password) async {
    _status = AuthStatus.loading;
    _errorMsg = null;
    notifyListeners();
    try {
      await _auth.signInWithEmailAndPassword(email: email, password: password);
      // _onAuthChanged fires automatically
    } on FirebaseAuthException catch (e) {
      _status   = AuthStatus.error;
      _errorMsg = _mapFirebaseError(e.code);
      notifyListeners();
    } catch (e) {
      _status   = AuthStatus.error;
      _errorMsg = e.toString();
      notifyListeners();
    }
  }

  // ── Register (full patient registration) ────────────────────────────
  Future<String?> registerPatient(Map<String, dynamic> formData) async {
    _status = AuthStatus.loading;
    _errorMsg = null;
    notifyListeners();
    try {
      final result = await _api.registerPatient(formData);
      _status = AuthStatus.unauthenticated;
      notifyListeners();
      return null; // success
    } catch (e) {
      _status   = AuthStatus.error;
      _errorMsg = e.toString().replaceFirst('Exception: ', '');
      notifyListeners();
      return _errorMsg;
    }
  }

  // ── Sign Out ─────────────────────────────────────────────────────────
  Future<void> signOut() async {
    await _auth.signOut();
  }

  void setPatientId(String id) {
    _patientId = id;
    notifyListeners();
  }

  String _mapFirebaseError(String code) {
    switch (code) {
      case 'user-not-found':      return 'No account found with this email.';
      case 'wrong-password':      return 'Incorrect password. Please try again.';
      case 'invalid-credential':  return 'Invalid credentials. Please check your email and password.';
      case 'too-many-requests':   return 'Too many attempts. Please try later.';
      case 'email-already-in-use':return 'This email is already registered.';
      default: return 'Authentication failed. Please try again.';
    }
  }
}
