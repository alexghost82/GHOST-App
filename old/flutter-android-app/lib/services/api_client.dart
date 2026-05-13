import 'dart:convert';

import 'package:http/http.dart' as http;

import '../models/auth_models.dart';
import '../models/dashboard_models.dart';

class ApiClient {
  ApiClient({required this.baseUrl});

  final String baseUrl;

  Future<LoginResponse> login({
    required String username,
    required String password,
  }) async {
    final uri = Uri.parse('$baseUrl/api/auth/login');
    final response = await http.post(
      uri,
      headers: const {'Content-Type': 'application/json'},
      body: jsonEncode({'username': username, 'password': password}),
    );
    final payload = _decode(response.body);
    if (response.statusCode < 200 || response.statusCode >= 300) {
      throw Exception(payload['error']?.toString() ?? 'Login failed (${response.statusCode})');
    }
    return LoginResponse.fromJson(payload);
  }

  Future<DashboardOverview> fetchDashboardOverview({
    required String accessToken,
  }) async {
    final payload = await _authedRequest(
      accessToken: accessToken,
      path: '/api/admin/dashboard/overview',
      method: 'GET',
    );
    return DashboardOverview.fromJson(payload);
  }

  Future<OrganizationDetails> fetchOrganizationDetails({
    required String accessToken,
    required String organizationId,
  }) async {
    final payload = await _authedRequest(
      accessToken: accessToken,
      path: '/api/admin/dashboard/org/$organizationId',
      method: 'GET',
    );
    return OrganizationDetails.fromJson(payload);
  }

  Future<List<SuperAdminIssue>> fetchIssues({
    required String accessToken,
  }) async {
    final payload = await _authedRequest(
      accessToken: accessToken,
      path: '/api/admin/issues',
      method: 'GET',
    );
    if (payload['data'] is List<dynamic>) {
      final rows = payload['data'] as List<dynamic>;
      return rows.whereType<Map<String, dynamic>>().map(SuperAdminIssue.fromJson).toList();
    }
    if (payload.isEmpty) return const [];
    if (payload.values.first is List<dynamic>) {
      final rows = payload.values.first as List<dynamic>;
      return rows.whereType<Map<String, dynamic>>().map(SuperAdminIssue.fromJson).toList();
    }
    return const [];
  }

  Future<List<OrganizationUser>> fetchUsers({
    required String accessToken,
  }) async {
    final payload = await _authedRequest(
      accessToken: accessToken,
      path: '/api/admin/users',
      method: 'GET',
    );
    if (payload['data'] is List<dynamic>) {
      final rows = payload['data'] as List<dynamic>;
      return rows.whereType<Map<String, dynamic>>().map(OrganizationUser.fromJson).toList();
    }
    if (payload.values.isNotEmpty && payload.values.first is List<dynamic>) {
      final rows = payload.values.first as List<dynamic>;
      return rows.whereType<Map<String, dynamic>>().map(OrganizationUser.fromJson).toList();
    }
    return const [];
  }

  Future<void> updateIssueStatus({
    required String accessToken,
    required String issueId,
    required String status,
  }) async {
    await _authedRequest(
      accessToken: accessToken,
      path: '/api/admin/issues/$issueId',
      method: 'PATCH',
      body: {'status': status},
    );
  }

  Future<void> createUser({
    required String accessToken,
    required String organizationId,
    required String username,
    required String firstName,
    required String lastName,
    required String password,
    required String role,
  }) async {
    await _authedRequest(
      accessToken: accessToken,
      path: '/api/admin/users',
      method: 'POST',
      body: {
        'organizationId': organizationId,
        'username': username,
        'firstName': firstName,
        'lastName': lastName,
        'password': password,
        'role': role,
      },
    );
  }

  Future<void> updateUser({
    required String accessToken,
    required String userId,
    required String role,
    required bool isActive,
  }) async {
    await _authedRequest(
      accessToken: accessToken,
      path: '/api/admin/users/$userId',
      method: 'PATCH',
      body: {'role': role, 'isActive': isActive},
    );
  }

  Future<DashboardOrganization> createOrganization({
    required String accessToken,
    required String name,
    required OrganizationLimits limits,
  }) async {
    final payload = await _authedRequest(
      accessToken: accessToken,
      path: '/api/admin/organizations',
      method: 'POST',
      body: {'name': name, 'limits': limits.toJson()},
    );
    return DashboardOrganization.fromJson(payload);
  }

  Future<void> updateOrganization({
    required String accessToken,
    required String organizationId,
    required String name,
    required String status,
    required OrganizationLimits limits,
  }) async {
    await _authedRequest(
      accessToken: accessToken,
      path: '/api/admin/organizations/$organizationId',
      method: 'PATCH',
      body: {'name': name, 'status': status, 'limits': limits.toJson()},
    );
  }

  Future<Map<String, dynamic>> _authedRequest({
    required String accessToken,
    required String path,
    required String method,
    Map<String, dynamic>? body,
  }) async {
    final uri = Uri.parse('$baseUrl$path');
    final headers = {
      'Authorization': 'Bearer $accessToken',
      'Content-Type': 'application/json',
    };
    late http.Response response;
    switch (method) {
      case 'GET':
        response = await http.get(uri, headers: headers);
        break;
      case 'POST':
        response = await http.post(uri, headers: headers, body: jsonEncode(body ?? {}));
        break;
      case 'PATCH':
        response = await http.patch(uri, headers: headers, body: jsonEncode(body ?? {}));
        break;
      default:
        throw Exception('Unsupported method: $method');
    }
    final payload = _decode(response.body);
    if (response.statusCode < 200 || response.statusCode >= 300) {
      throw Exception(payload['error']?.toString() ?? 'Request failed (${response.statusCode})');
    }
    return payload;
  }

  Map<String, dynamic> _decode(String body) {
    if (body.trim().isEmpty) return <String, dynamic>{};
    final raw = jsonDecode(body);
    if (raw is Map<String, dynamic>) return raw;
    if (raw is List<dynamic>) return <String, dynamic>{'data': raw};
    return <String, dynamic>{};
  }
}
