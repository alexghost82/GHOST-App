class DashboardTotals {
  final int organizationsCount;
  final int sentMessages;
  final int receivedMessages;
  final int devicesCount;
  final int channelsCount;
  final int operationsCount;
  final double aiTotalCost;
  final double apiTotalCost;
  final double agentsTotalCost;

  const DashboardTotals({
    required this.organizationsCount,
    required this.sentMessages,
    required this.receivedMessages,
    required this.devicesCount,
    required this.channelsCount,
    required this.operationsCount,
    required this.aiTotalCost,
    required this.apiTotalCost,
    required this.agentsTotalCost,
  });

  factory DashboardTotals.fromJson(Map<String, dynamic> json) {
    return DashboardTotals(
      organizationsCount: json['organizationsCount'] as int? ?? 0,
      sentMessages: json['sentMessages'] as int? ?? 0,
      receivedMessages: json['receivedMessages'] as int? ?? 0,
      devicesCount: json['devicesCount'] as int? ?? 0,
      channelsCount: json['channelsCount'] as int? ?? 0,
      operationsCount: json['operationsCount'] as int? ?? 0,
      aiTotalCost: (json['aiTotalCost'] as num? ?? 0).toDouble(),
      apiTotalCost: (json['apiTotalCost'] as num? ?? 0).toDouble(),
      agentsTotalCost: (json['agentsTotalCost'] as num? ?? 0).toDouble(),
    );
  }
}

class DashboardOrganization {
  final String id;
  final String name;
  final String status;
  final OrganizationLimits? limits;
  final OrganizationUsage? usage;

  const DashboardOrganization({
    required this.id,
    required this.name,
    required this.status,
    this.limits,
    this.usage,
  });

  factory DashboardOrganization.fromJson(Map<String, dynamic> json) {
    return DashboardOrganization(
      id: json['id'] as String? ?? '',
      name: json['name'] as String? ?? '',
      status: json['status'] as String? ?? '',
      limits: json['limits'] is Map<String, dynamic>
          ? OrganizationLimits.fromJson(json['limits'] as Map<String, dynamic>)
          : null,
      usage: json['usage'] is Map<String, dynamic>
          ? OrganizationUsage.fromJson(json['usage'] as Map<String, dynamic>)
          : null,
    );
  }
}

class DashboardOverview {
  final DashboardTotals totals;
  final List<DashboardOrganization> organizations;

  const DashboardOverview({
    required this.totals,
    required this.organizations,
  });

  factory DashboardOverview.fromJson(Map<String, dynamic> json) {
    final rawOrgs = json['organizations'] as List<dynamic>? ?? const [];
    return DashboardOverview(
      totals: DashboardTotals.fromJson(json['totals'] as Map<String, dynamic>? ?? <String, dynamic>{}),
      organizations: rawOrgs
          .whereType<Map<String, dynamic>>()
          .map(DashboardOrganization.fromJson)
          .toList(),
    );
  }
}

class OrganizationLimits {
  final int maxChannels;
  final int maxMessagesPerChannelPerMonth;
  final double monthlyChargeAmount;
  final double maxAgentsTotalCost;
  final double maxAiTotalCost;
  final double maxApiTotalCost;

  const OrganizationLimits({
    required this.maxChannels,
    required this.maxMessagesPerChannelPerMonth,
    required this.monthlyChargeAmount,
    required this.maxAgentsTotalCost,
    required this.maxAiTotalCost,
    required this.maxApiTotalCost,
  });

  factory OrganizationLimits.fromJson(Map<String, dynamic> json) {
    return OrganizationLimits(
      maxChannels: json['maxChannels'] as int? ?? 20,
      maxMessagesPerChannelPerMonth: json['maxMessagesPerChannelPerMonth'] as int? ?? 10000,
      monthlyChargeAmount: (json['monthlyChargeAmount'] as num? ?? 499).toDouble(),
      maxAgentsTotalCost: (json['maxAgentsTotalCost'] as num? ?? 2000).toDouble(),
      maxAiTotalCost: (json['maxAiTotalCost'] as num? ?? 5000).toDouble(),
      maxApiTotalCost: (json['maxApiTotalCost'] as num? ?? 2500).toDouble(),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'maxChannels': maxChannels,
      'maxMessagesPerChannelPerMonth': maxMessagesPerChannelPerMonth,
      'monthlyChargeAmount': monthlyChargeAmount,
      'maxAgentsTotalCost': maxAgentsTotalCost,
      'maxAiTotalCost': maxAiTotalCost,
      'maxApiTotalCost': maxApiTotalCost,
    };
  }

  OrganizationLimits copyWith({
    int? maxChannels,
    int? maxMessagesPerChannelPerMonth,
    double? monthlyChargeAmount,
    double? maxAgentsTotalCost,
    double? maxAiTotalCost,
    double? maxApiTotalCost,
  }) {
    return OrganizationLimits(
      maxChannels: maxChannels ?? this.maxChannels,
      maxMessagesPerChannelPerMonth: maxMessagesPerChannelPerMonth ?? this.maxMessagesPerChannelPerMonth,
      monthlyChargeAmount: monthlyChargeAmount ?? this.monthlyChargeAmount,
      maxAgentsTotalCost: maxAgentsTotalCost ?? this.maxAgentsTotalCost,
      maxAiTotalCost: maxAiTotalCost ?? this.maxAiTotalCost,
      maxApiTotalCost: maxApiTotalCost ?? this.maxApiTotalCost,
    );
  }
}

class OrganizationUsage {
  final int sentMessages;
  final int receivedMessages;
  final int devicesCount;
  final int channelsCount;
  final int operationsCount;
  final double aiTotalCost;
  final double apiTotalCost;
  final double agentsTotalCost;

  const OrganizationUsage({
    required this.sentMessages,
    required this.receivedMessages,
    required this.devicesCount,
    required this.channelsCount,
    required this.operationsCount,
    required this.aiTotalCost,
    required this.apiTotalCost,
    required this.agentsTotalCost,
  });

  factory OrganizationUsage.fromJson(Map<String, dynamic> json) {
    return OrganizationUsage(
      sentMessages: json['sentMessages'] as int? ?? 0,
      receivedMessages: json['receivedMessages'] as int? ?? 0,
      devicesCount: json['devicesCount'] as int? ?? 0,
      channelsCount: json['channelsCount'] as int? ?? 0,
      operationsCount: json['operationsCount'] as int? ?? 0,
      aiTotalCost: (json['aiTotalCost'] as num? ?? 0).toDouble(),
      apiTotalCost: (json['apiTotalCost'] as num? ?? 0).toDouble(),
      agentsTotalCost: (json['agentsTotalCost'] as num? ?? 0).toDouble(),
    );
  }
}

class OrganizationUser {
  final String id;
  final String organizationId;
  final String username;
  final String role;
  final bool isActive;

  const OrganizationUser({
    required this.id,
    required this.organizationId,
    required this.username,
    required this.role,
    required this.isActive,
  });

  factory OrganizationUser.fromJson(Map<String, dynamic> json) {
    return OrganizationUser(
      id: json['id'] as String? ?? '',
      organizationId: json['organizationId'] as String? ?? '',
      username: json['username'] as String? ?? '',
      role: json['role'] as String? ?? '',
      isActive: json['isActive'] as bool? ?? false,
    );
  }
}

class SuperAdminIssue {
  final String id;
  final String organizationId;
  final String title;
  final String description;
  final String status;
  final String severity;

  const SuperAdminIssue({
    required this.id,
    required this.organizationId,
    required this.title,
    required this.description,
    required this.status,
    required this.severity,
  });

  factory SuperAdminIssue.fromJson(Map<String, dynamic> json) {
    return SuperAdminIssue(
      id: json['id'] as String? ?? '',
      organizationId: json['organizationId'] as String? ?? '',
      title: json['title'] as String? ?? '',
      description: json['description'] as String? ?? '',
      status: json['status'] as String? ?? '',
      severity: json['severity'] as String? ?? '',
    );
  }
}

class OrganizationChannel {
  final String id;
  final String name;
  final bool isBlocked;

  const OrganizationChannel({
    required this.id,
    required this.name,
    required this.isBlocked,
  });

  factory OrganizationChannel.fromJson(Map<String, dynamic> json) {
    return OrganizationChannel(
      id: json['id'] as String? ?? '',
      name: json['name'] as String? ?? '',
      isBlocked: json['isBlocked'] as bool? ?? false,
    );
  }
}

class OrganizationDetails {
  final DashboardOrganization organization;
  final List<OrganizationUser> users;
  final List<OrganizationChannel> channels;

  const OrganizationDetails({
    required this.organization,
    required this.users,
    required this.channels,
  });

  factory OrganizationDetails.fromJson(Map<String, dynamic> json) {
    final rawUsers = json['users'] as List<dynamic>? ?? const [];
    final rawChannels = json['channels'] as List<dynamic>? ?? const [];
    return OrganizationDetails(
      organization: DashboardOrganization.fromJson(
        json['organization'] as Map<String, dynamic>? ?? <String, dynamic>{},
      ),
      users: rawUsers.whereType<Map<String, dynamic>>().map(OrganizationUser.fromJson).toList(),
      channels: rawChannels.whereType<Map<String, dynamic>>().map(OrganizationChannel.fromJson).toList(),
    );
  }
}
