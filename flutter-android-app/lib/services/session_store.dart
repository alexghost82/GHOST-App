import 'dart:convert';

import 'package:shared_preferences/shared_preferences.dart';

import '../models/auth_models.dart';

class SessionStore {
  static const _accessTokenKey = 'access_token';
  static const _refreshTokenKey = 'refresh_token';
  static const _profileKey = 'profile_json';

  Future<void> save(LoginResponse response) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_accessTokenKey, response.accessToken);
    await prefs.setString(_refreshTokenKey, response.refreshToken);
    await prefs.setString(_profileKey, jsonEncode(response.profile.toJson()));
  }

  Future<String?> readAccessToken() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString(_accessTokenKey);
  }

  Future<AuthProfile?> readProfile() async {
    final prefs = await SharedPreferences.getInstance();
    final raw = prefs.getString(_profileKey);
    if (raw == null || raw.trim().isEmpty) {
      return null;
    }
    try {
      return AuthProfile.fromJson(jsonDecode(raw) as Map<String, dynamic>);
    } catch (_) {
      return null;
    }
  }

  Future<void> clear() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_accessTokenKey);
    await prefs.remove(_refreshTokenKey);
    await prefs.remove(_profileKey);
  }
}
