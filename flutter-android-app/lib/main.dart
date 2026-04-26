import 'package:flutter/material.dart';

import 'models/auth_models.dart';
import 'screens/dashboard_screen.dart';
import 'screens/login_screen.dart';
import 'services/api_client.dart';
import 'services/session_store.dart';

void main() {
  runApp(const GhostFlutterApp());
}

class GhostFlutterApp extends StatefulWidget {
  const GhostFlutterApp({super.key});

  @override
  State<GhostFlutterApp> createState() => _GhostFlutterAppState();
}

class _GhostFlutterAppState extends State<GhostFlutterApp> {
  // For Android emulator use 10.0.2.2 instead of localhost.
  final ApiClient _apiClient = ApiClient(baseUrl: 'http://10.0.2.2:8787');
  final SessionStore _sessionStore = SessionStore();

  AuthProfile? _profile;
  String? _accessToken;
  String? _errorMessage;
  bool _isLoading = false;

  @override
  void initState() {
    super.initState();
    _bootstrapSession();
  }

  Future<void> _bootstrapSession() async {
    final token = await _sessionStore.readAccessToken();
    final profile = await _sessionStore.readProfile();
    if (!mounted) return;
    setState(() {
      _accessToken = token;
      _profile = profile;
    });
  }

  Future<void> _login(String username, String password) async {
    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });
    try {
      final response = await _apiClient.login(username: username, password: password);
      await _sessionStore.save(response);
      if (!mounted) return;
      setState(() {
        _accessToken = response.accessToken;
        _profile = response.profile;
      });
    } catch (error) {
      if (!mounted) return;
      setState(() {
        _errorMessage = error.toString().replaceFirst('Exception: ', '');
      });
    } finally {
      if (!mounted) return;
      setState(() {
        _isLoading = false;
      });
    }
  }

  Future<void> _logout() async {
    await _sessionStore.clear();
    if (!mounted) return;
    setState(() {
      _accessToken = null;
      _profile = null;
      _errorMessage = null;
    });
  }

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Ghost Android Flutter',
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(seedColor: const Color(0xFF1E3A8A)),
        useMaterial3: true,
      ),
      home: _profile == null
          ? LoginScreen(
              isLoading: _isLoading,
              errorMessage: _errorMessage,
              onLogin: _login,
            )
          : DashboardScreen(
              profile: _profile!,
              accessToken: _accessToken!,
              apiClient: _apiClient,
              onLogout: _logout,
            ),
    );
  }
}
