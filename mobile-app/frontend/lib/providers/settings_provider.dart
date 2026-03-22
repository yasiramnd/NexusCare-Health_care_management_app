import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../../services/api_service.dart';

class SettingsProvider extends ChangeNotifier {
  final ApiService _api = ApiService();

  // ── Theme ──────────────────────────────────────────────────────────────
  ThemeMode _themeMode = ThemeMode.dark;
  ThemeMode get themeMode => _themeMode;

  bool get isDarkMode => _themeMode == ThemeMode.dark;

  // ── Notifications ──────────────────────────────────────────────────────
  bool _notificationsEnabled = true;
  bool get notificationsEnabled => _notificationsEnabled;

  // ── Profile ────────────────────────────────────────────────────────────
  Map<String, dynamic>? _profile;
  Map<String, dynamic>? get profile => _profile;
  bool _profileLoading = false;
  bool get profileLoading => _profileLoading;
  String? _profileError;
  String? get profileError => _profileError;

  // ── Initialise from SharedPreferences ──────────────────────────────────
  SettingsProvider() {
    _loadPrefs();
  }

  Future<void> _loadPrefs() async {
    final prefs = await SharedPreferences.getInstance();
    final isDark = prefs.getBool('isDarkMode') ?? true;
    _themeMode = isDark ? ThemeMode.dark : ThemeMode.light;
    _notificationsEnabled = prefs.getBool('notificationsEnabled') ?? true;
    notifyListeners();
  }

  // ── Toggle theme ───────────────────────────────────────────────────────
  Future<void> toggleTheme() async {
    _themeMode =
        _themeMode == ThemeMode.dark ? ThemeMode.light : ThemeMode.dark;
    notifyListeners();
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool('isDarkMode', _themeMode == ThemeMode.dark);
  }

  // ── Toggle notifications ───────────────────────────────────────────────
  Future<void> toggleNotifications() async {
    _notificationsEnabled = !_notificationsEnabled;
    notifyListeners();
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool('notificationsEnabled', _notificationsEnabled);
  }

  // ── Load profile from API ──────────────────────────────────────────────
  Future<void> loadProfile(String patientId) async {
    _profileLoading = true;
    _profileError = null;
    notifyListeners();
    try {
      _profile = await _api.getProfile(patientId);
      _profileError = null;
    } catch (e) {
      _profileError = e.toString().replaceFirst('Exception: ', '');
    } finally {
      _profileLoading = false;
      notifyListeners();
    }
  }

  // ── Update profile ─────────────────────────────────────────────────────
  Future<String?> updateProfile(
      String patientId, Map<String, dynamic> data) async {
    try {
      await _api.updateProfile(patientId, data);
      // Refresh local copy
      if (_profile != null) {
        _profile = {..._profile!, ...data};
        notifyListeners();
      }
      return null; // success
    } catch (e) {
      return e.toString().replaceFirst('Exception: ', '');
    }
  }

  // ── Change password ────────────────────────────────────────────────────
  Future<String?> changePassword(String newPassword) async {
    try {
      await _api.changePassword(newPassword);
      return null; // success
    } catch (e) {
      return e.toString().replaceFirst('Exception: ', '');
    }
  }
}
