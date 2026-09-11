import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:punjab_test_generator/core/theme/app_theme.dart';
import 'package:punjab_test_generator/features/auth/providers/auth_provider.dart';
import 'package:punjab_test_generator/features/auth/screens/login_screen.dart';
import 'package:punjab_test_generator/features/dashboard/screens/dashboard_screen.dart';
import 'package:punjab_test_generator/features/test_creation/providers/test_creation_provider.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  runApp(const PunjabTestGeneratorApp());
}

class PunjabTestGeneratorApp extends StatelessWidget {
  const PunjabTestGeneratorApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => AuthProvider()..tryRestoreSession()),
        ChangeNotifierProvider(create: (_) => TestCreationProvider()),
      ],
      child: MaterialApp(
        title: 'Punjab Test Generator',
        debugShowCheckedModeBanner: false,
        theme: AppTheme.lightTheme,
        home: const _AuthGate(),
      ),
    );
  }
}

/// Routes to login or dashboard based on auth state.
class _AuthGate extends StatelessWidget {
  const _AuthGate();

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();

    switch (auth.status) {
      case AuthStatus.initial:
      case AuthStatus.loading:
        return const Scaffold(
          body: Center(child: CircularProgressIndicator()),
        );
      case AuthStatus.authenticated:
        return const DashboardScreen();
      case AuthStatus.unauthenticated:
      case AuthStatus.error:
        return const LoginScreen();
    }
  }
}
