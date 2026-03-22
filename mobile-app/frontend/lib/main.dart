import 'package:flutter/material.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:provider/provider.dart';
import 'package:google_fonts/google_fonts.dart';

import 'firebase_options.dart';
import 'providers/auth_provider.dart';
import 'providers/patient_provider.dart';
import 'providers/settings_provider.dart';
import 'screens/login_screen.dart';
import 'screens/dashboard_screen.dart';
import 'screens/splash_screen.dart';
import 'screens/forgot_password_screen.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await Firebase.initializeApp(options: DefaultFirebaseOptions.currentPlatform);
  runApp(const NexusCareApp());
}

class NexusCareApp extends StatelessWidget {
  const NexusCareApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => AuthProvider()),
        ChangeNotifierProvider(create: (_) => PatientProvider()),
        ChangeNotifierProvider(create: (_) => SettingsProvider()),
      ],
      child: Consumer<SettingsProvider>(
        builder: (context, settings, _) {
          return MaterialApp(
            title: 'NexusCare – Patient Portal',
            debugShowCheckedModeBanner: false,
            themeMode: settings.themeMode,

            // ── Dark Theme ─────────────────────────────────────────────
            darkTheme: ThemeData(
              brightness: Brightness.dark,
              scaffoldBackgroundColor: const Color(0xFF0A0D14),
              colorScheme: ColorScheme.dark(
                primary: const Color(0xFF1E6FFF),
                secondary: const Color(0xFF3B82F6),
                surface: const Color(0xFF111827),
                error: const Color(0xFFEF4444),
              ),
              textTheme: GoogleFonts.interTextTheme(
                ThemeData.dark().textTheme,
              ),
              appBarTheme: const AppBarTheme(
                backgroundColor: Color(0xFF0A0D14),
                elevation: 0,
                surfaceTintColor: Colors.transparent,
              ),
              inputDecorationTheme: InputDecorationTheme(
                filled: true,
                fillColor: const Color(0xFF1F2937),
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(10),
                  borderSide: const BorderSide(color: Color(0xFF374151)),
                ),
                enabledBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(10),
                  borderSide: const BorderSide(color: Color(0xFF374151)),
                ),
                focusedBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(10),
                  borderSide: const BorderSide(color: Color(0xFF1E6FFF), width: 2),
                ),
                labelStyle: const TextStyle(color: Color(0xFF9CA3AF)),
                hintStyle: const TextStyle(color: Color(0xFF6B7280)),
              ),
              elevatedButtonTheme: ElevatedButtonThemeData(
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFF1E6FFF),
                  foregroundColor: Colors.white,
                  minimumSize: const Size(double.infinity, 52),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                  textStyle: GoogleFonts.inter(fontSize: 15, fontWeight: FontWeight.w600),
                ),
              ),
              cardTheme: CardThemeData(
                color: const Color(0xFF111827),
                surfaceTintColor: Colors.transparent,
                elevation: 0,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(18),
                  side: const BorderSide(color: Color(0xFF1F2937)),
                ),
              ),
            ),

            // ── Light Theme ────────────────────────────────────────────
            theme: ThemeData(
              brightness: Brightness.light,
              scaffoldBackgroundColor: const Color(0xFFF9FAFB),
              colorScheme: ColorScheme.light(
                primary: const Color(0xFF1E6FFF),
                secondary: const Color(0xFF3B82F6),
                surface: Colors.white,
                error: const Color(0xFFEF4444),
              ),
              textTheme: GoogleFonts.interTextTheme(
                ThemeData.light().textTheme,
              ),
              appBarTheme: const AppBarTheme(
                backgroundColor: Colors.white,
                elevation: 0,
                surfaceTintColor: Colors.transparent,
                iconTheme: IconThemeData(color: Color(0xFF374151)),
                titleTextStyle: TextStyle(
                  color: Color(0xFF111827),
                  fontSize: 18,
                  fontWeight: FontWeight.w700,
                ),
              ),
              inputDecorationTheme: InputDecorationTheme(
                filled: true,
                fillColor: const Color(0xFFF3F4F6),
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(10),
                  borderSide: const BorderSide(color: Color(0xFFD1D5DB)),
                ),
                enabledBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(10),
                  borderSide: const BorderSide(color: Color(0xFFD1D5DB)),
                ),
                focusedBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(10),
                  borderSide: const BorderSide(color: Color(0xFF1E6FFF), width: 2),
                ),
                labelStyle: const TextStyle(color: Color(0xFF6B7280)),
                hintStyle: const TextStyle(color: Color(0xFF9CA3AF)),
              ),
              elevatedButtonTheme: ElevatedButtonThemeData(
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFF1E6FFF),
                  foregroundColor: Colors.white,
                  minimumSize: const Size(double.infinity, 52),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                  textStyle: GoogleFonts.inter(fontSize: 15, fontWeight: FontWeight.w600),
                ),
              ),
              cardTheme: CardThemeData(
                color: Colors.white,
                surfaceTintColor: Colors.transparent,
                elevation: 0,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(18),
                  side: const BorderSide(color: Color(0xFFE5E7EB)),
                ),
              ),
            ),

            home: const SplashScreen(),
            routes: {
              '/login': (_) => const LoginScreen(),
              '/dashboard': (_) => const DashboardScreen(),
              '/forgot-password': (_) => const ForgotPasswordScreen(),
            },
          );
        },
      ),
    );
  }
}
