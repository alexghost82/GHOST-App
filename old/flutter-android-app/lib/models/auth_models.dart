class AuthProfile {
  final String userId;
  final String organizationId;
  final String organizationName;
  final String role;
  final String username;
  final String firstName;
  final String lastName;

  const AuthProfile({
    required this.userId,
    required this.organizationId,
    required this.organizationName,
    required this.role,
    required this.username,
    required this.firstName,
    required this.lastName,
  });

  factory AuthProfile.fromJson(Map<String, dynamic> json) {
    return AuthProfile(
      userId: json['userId'] as String? ?? '',
      organizationId: json['organizationId'] as String? ?? '',
      organizationName: json['organizationName'] as String? ?? '',
      role: json['role'] as String? ?? '',
      username: json['username'] as String? ?? '',
      firstName: json['firstName'] as String? ?? '',
      lastName: json['lastName'] as String? ?? '',
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'userId': userId,
      'organizationId': organizationId,
      'organizationName': organizationName,
      'role': role,
      'username': username,
      'firstName': firstName,
      'lastName': lastName,
    };
  }
}

class LoginResponse {
  final String accessToken;
  final String refreshToken;
  final AuthProfile profile;

  const LoginResponse({
    required this.accessToken,
    required this.refreshToken,
    required this.profile,
  });

  factory LoginResponse.fromJson(Map<String, dynamic> json) {
    return LoginResponse(
      accessToken: json['accessToken'] as String? ?? '',
      refreshToken: json['refreshToken'] as String? ?? '',
      profile: AuthProfile.fromJson(json['profile'] as Map<String, dynamic>? ?? <String, dynamic>{}),
    );
  }
}
