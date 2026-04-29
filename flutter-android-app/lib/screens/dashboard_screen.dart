import 'package:flutter/material.dart';

import '../models/auth_models.dart';
import '../models/dashboard_models.dart';
import '../services/api_client.dart';

class DashboardScreen extends StatefulWidget {
  const DashboardScreen({
    super.key,
    required this.profile,
    required this.accessToken,
    required this.apiClient,
    required this.onLogout,
  });

  final AuthProfile profile;
  final String accessToken;
  final ApiClient apiClient;
  final VoidCallback onLogout;

  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen>
    with SingleTickerProviderStateMixin {
  DashboardOverview? _overview;
  OrganizationDetails? _organizationDetails;
  List<SuperAdminIssue> _issues = const [];
  List<OrganizationUser> _users = const [];
  bool _isRefreshing = false;
  String? _errorMessage;
  String? _successMessage;
  String? _selectedOrganizationId;
  late final TabController _tabController;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 5, vsync: this);
    _reloadAll();
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  Future<void> _reloadAll() async {
    setState(() {
      _isRefreshing = true;
      _errorMessage = null;
    });
    try {
      final overview = await widget.apiClient
          .fetchDashboardOverview(accessToken: widget.accessToken);
      final users =
          await widget.apiClient.fetchUsers(accessToken: widget.accessToken);
      final issues =
          await widget.apiClient.fetchIssues(accessToken: widget.accessToken);
      String? selectedId = _selectedOrganizationId;
      if (selectedId == null ||
          !overview.organizations.any((org) => org.id == selectedId)) {
        selectedId = overview.organizations.isNotEmpty
            ? overview.organizations.first.id
            : null;
      }
      OrganizationDetails? details;
      if (selectedId != null) {
        details = await widget.apiClient.fetchOrganizationDetails(
          accessToken: widget.accessToken,
          organizationId: selectedId,
        );
      }
      if (!mounted) return;
      setState(() {
        _overview = overview;
        _users = users;
        _issues = issues;
        _selectedOrganizationId = selectedId;
        _organizationDetails = details;
      });
    } catch (error) {
      if (!mounted) return;
      setState(() {
        _errorMessage = error.toString().replaceFirst('Exception: ', '');
      });
    } finally {
      if (!mounted) return;
      setState(() {
        _isRefreshing = false;
      });
    }
  }

  Future<void> _loadOrganizationDetails(String organizationId) async {
    setState(() {
      _isRefreshing = true;
      _selectedOrganizationId = organizationId;
      _errorMessage = null;
    });
    try {
      final details = await widget.apiClient.fetchOrganizationDetails(
        accessToken: widget.accessToken,
        organizationId: organizationId,
      );
      if (!mounted) return;
      setState(() {
        _organizationDetails = details;
      });
    } catch (error) {
      if (!mounted) return;
      setState(() {
        _errorMessage = error.toString().replaceFirst('Exception: ', '');
      });
    } finally {
      if (!mounted) return;
      setState(() {
        _isRefreshing = false;
      });
    }
  }

  Future<void> _updateIssueStatus(SuperAdminIssue issue, String status) async {
    setState(() {
      _isRefreshing = true;
      _errorMessage = null;
      _successMessage = null;
    });
    try {
      await widget.apiClient.updateIssueStatus(
        accessToken: widget.accessToken,
        issueId: issue.id,
        status: status,
      );
      if (!mounted) return;
      setState(() {
        _successMessage = 'Issue updated: ${issue.title}';
      });
      await _reloadAll();
    } catch (error) {
      if (!mounted) return;
      setState(() {
        _errorMessage = error.toString().replaceFirst('Exception: ', '');
      });
    }
  }

  Future<void> _showCreateUserDialog() async {
    final orgId = _selectedOrganizationId;
    if (orgId == null) return;
    final usernameController = TextEditingController();
    final firstNameController = TextEditingController();
    final lastNameController = TextEditingController();
    final passwordController = TextEditingController();
    String role = 'regular_user';

    await showDialog<void>(
      context: context,
      builder: (context) {
        return StatefulBuilder(
          builder: (context, setModalState) {
            return AlertDialog(
              title: const Text('Create user'),
              content: SingleChildScrollView(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    TextField(
                        controller: firstNameController,
                        decoration:
                            const InputDecoration(labelText: 'First name')),
                    TextField(
                        controller: lastNameController,
                        decoration:
                            const InputDecoration(labelText: 'Last name')),
                    TextField(
                        controller: usernameController,
                        decoration:
                            const InputDecoration(labelText: 'Username')),
                    TextField(
                        controller: passwordController,
                        decoration: const InputDecoration(
                            labelText: 'Password (min 8)')),
                    DropdownButtonFormField<String>(
                      initialValue: role,
                      decoration: const InputDecoration(labelText: 'Role'),
                      items: const [
                        DropdownMenuItem(
                            value: 'system_manager',
                            child: Text('System manager')),
                        DropdownMenuItem(
                            value: 'regular_user', child: Text('Regular user')),
                      ],
                      onChanged: (value) =>
                          setModalState(() => role = value ?? 'regular_user'),
                    ),
                  ],
                ),
              ),
              actions: [
                TextButton(
                    onPressed: () => Navigator.pop(context),
                    child: const Text('Cancel')),
                FilledButton(
                  onPressed: () async {
                    try {
                      await widget.apiClient.createUser(
                        accessToken: widget.accessToken,
                        organizationId: orgId,
                        username: usernameController.text.trim(),
                        firstName: firstNameController.text.trim(),
                        lastName: lastNameController.text.trim(),
                        password: passwordController.text,
                        role: role,
                      );
                      if (!mounted) return;
                      Navigator.pop(context);
                      setState(
                          () => _successMessage = 'User created successfully');
                      await _reloadAll();
                    } catch (error) {
                      if (!mounted) return;
                      setState(() => _errorMessage =
                          error.toString().replaceFirst('Exception: ', ''));
                    }
                  },
                  child: const Text('Create'),
                ),
              ],
            );
          },
        );
      },
    );
  }

  Future<void> _showEditUserDialog(OrganizationUser user) async {
    String role =
        user.role == 'system_manager' ? 'system_manager' : 'regular_user';
    bool isActive = user.isActive;
    await showDialog<void>(
      context: context,
      builder: (context) {
        return StatefulBuilder(
          builder: (context, setModalState) {
            return AlertDialog(
              title: Text('Edit user: ${user.username}'),
              content: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  DropdownButtonFormField<String>(
                    initialValue: role,
                    decoration: const InputDecoration(labelText: 'Role'),
                    items: const [
                      DropdownMenuItem(
                          value: 'system_manager',
                          child: Text('System manager')),
                      DropdownMenuItem(
                          value: 'regular_user', child: Text('Regular user')),
                    ],
                    onChanged: (value) =>
                        setModalState(() => role = value ?? role),
                  ),
                  SwitchListTile(
                    value: isActive,
                    onChanged: (value) => setModalState(() => isActive = value),
                    title: const Text('Active'),
                  ),
                ],
              ),
              actions: [
                TextButton(
                    onPressed: () => Navigator.pop(context),
                    child: const Text('Cancel')),
                FilledButton(
                  onPressed: () async {
                    try {
                      await widget.apiClient.updateUser(
                        accessToken: widget.accessToken,
                        userId: user.id,
                        role: role,
                        isActive: isActive,
                      );
                      if (!mounted) return;
                      Navigator.pop(context);
                      setState(() => _successMessage = 'User updated');
                      await _reloadAll();
                    } catch (error) {
                      if (!mounted) return;
                      setState(() => _errorMessage =
                          error.toString().replaceFirst('Exception: ', ''));
                    }
                  },
                  child: const Text('Save'),
                ),
              ],
            );
          },
        );
      },
    );
  }

  Future<void> _showCreateOrganizationDialog() async {
    final nameController = TextEditingController();
    await showDialog<void>(
      context: context,
      builder: (context) {
        return AlertDialog(
          title: const Text('Create organization'),
          content: TextField(
            controller: nameController,
            decoration: const InputDecoration(labelText: 'Organization name'),
          ),
          actions: [
            TextButton(
                onPressed: () => Navigator.pop(context),
                child: const Text('Cancel')),
            FilledButton(
              onPressed: () async {
                try {
                  await widget.apiClient.createOrganization(
                    accessToken: widget.accessToken,
                    name: nameController.text.trim(),
                    limits: const OrganizationLimits(
                      maxChannels: 20,
                      maxMessagesPerChannelPerMonth: 10000,
                      monthlyChargeAmount: 499,
                      maxAgentsTotalCost: 2000,
                      maxAiTotalCost: 5000,
                      maxApiTotalCost: 2500,
                    ),
                  );
                  if (!mounted) return;
                  Navigator.pop(context);
                  setState(() => _successMessage = 'Organization created');
                  await _reloadAll();
                } catch (error) {
                  if (!mounted) return;
                  setState(() => _errorMessage =
                      error.toString().replaceFirst('Exception: ', ''));
                }
              },
              child: const Text('Create'),
            ),
          ],
        );
      },
    );
  }

  Future<void> _showEditOrganizationDialog() async {
    final org = _organizationDetails?.organization;
    if (org == null) return;
    final nameController = TextEditingController(text: org.name);
    String status = org.status;
    OrganizationLimits limits = org.limits ??
        const OrganizationLimits(
          maxChannels: 20,
          maxMessagesPerChannelPerMonth: 10000,
          monthlyChargeAmount: 499,
          maxAgentsTotalCost: 2000,
          maxAiTotalCost: 5000,
          maxApiTotalCost: 2500,
        );

    final maxChannelsController =
        TextEditingController(text: limits.maxChannels.toString());
    final maxMessagesController = TextEditingController(
        text: limits.maxMessagesPerChannelPerMonth.toString());

    await showDialog<void>(
      context: context,
      builder: (context) {
        return StatefulBuilder(
          builder: (context, setModalState) {
            return AlertDialog(
              title: const Text('Edit organization'),
              content: SingleChildScrollView(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    TextField(
                        controller: nameController,
                        decoration: const InputDecoration(labelText: 'Name')),
                    DropdownButtonFormField<String>(
                      initialValue: status,
                      decoration: const InputDecoration(labelText: 'Status'),
                      items: const [
                        DropdownMenuItem(
                            value: 'active', child: Text('Active')),
                        DropdownMenuItem(
                            value: 'suspended', child: Text('Suspended')),
                      ],
                      onChanged: (value) =>
                          setModalState(() => status = value ?? status),
                    ),
                    TextField(
                      controller: maxChannelsController,
                      decoration:
                          const InputDecoration(labelText: 'Max channels'),
                      keyboardType: TextInputType.number,
                    ),
                    TextField(
                      controller: maxMessagesController,
                      decoration: const InputDecoration(
                          labelText: 'Max messages per channel / month'),
                      keyboardType: TextInputType.number,
                    ),
                  ],
                ),
              ),
              actions: [
                TextButton(
                    onPressed: () => Navigator.pop(context),
                    child: const Text('Cancel')),
                FilledButton(
                  onPressed: () async {
                    try {
                      limits = limits.copyWith(
                        maxChannels: int.tryParse(maxChannelsController.text) ??
                            limits.maxChannels,
                        maxMessagesPerChannelPerMonth:
                            int.tryParse(maxMessagesController.text) ??
                                limits.maxMessagesPerChannelPerMonth,
                      );
                      await widget.apiClient.updateOrganization(
                        accessToken: widget.accessToken,
                        organizationId: org.id,
                        name: nameController.text.trim(),
                        status: status,
                        limits: limits,
                      );
                      if (!mounted) return;
                      Navigator.pop(context);
                      setState(() => _successMessage = 'Organization updated');
                      await _reloadAll();
                    } catch (error) {
                      if (!mounted) return;
                      setState(() => _errorMessage =
                          error.toString().replaceFirst('Exception: ', ''));
                    }
                  },
                  child: const Text('Save'),
                ),
              ],
            );
          },
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    final totals = _overview?.totals;
    final organizations =
        _overview?.organizations ?? const <DashboardOrganization>[];
    final selectedOrgUsers = _users
        .where((u) => u.organizationId == _selectedOrganizationId)
        .toList();
    final selectedOrgIssues = _issues.where((i) {
      if (_selectedOrganizationId == null) return true;
      return i.organizationId == _selectedOrganizationId;
    }).toList();
    return Scaffold(
      appBar: AppBar(
        title: const Text('Ghost Super Admin'),
        actions: [
          IconButton(onPressed: _reloadAll, icon: const Icon(Icons.refresh)),
          IconButton(
              onPressed: widget.onLogout, icon: const Icon(Icons.logout)),
        ],
        bottom: TabBar(
          controller: _tabController,
          isScrollable: true,
          tabs: const [
            Tab(text: 'Overview'),
            Tab(text: 'Org Details'),
            Tab(text: 'Issues'),
            Tab(text: 'Users'),
            Tab(text: 'Organizations'),
          ],
        ),
      ),
      body: RefreshIndicator(
        onRefresh: _reloadAll,
        child: Column(
          children: [
            if (_isRefreshing) const LinearProgressIndicator(minHeight: 2),
            if (_errorMessage != null && _errorMessage!.isNotEmpty)
              Padding(
                padding: const EdgeInsets.all(8),
                child: Text(_errorMessage!,
                    style:
                        TextStyle(color: Theme.of(context).colorScheme.error)),
              ),
            if (_successMessage != null && _successMessage!.isNotEmpty)
              Padding(
                padding: const EdgeInsets.all(8),
                child: Text(_successMessage!,
                    style: const TextStyle(color: Colors.green)),
              ),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
              child: DropdownButtonFormField<String>(
                initialValue: _selectedOrganizationId,
                decoration:
                    const InputDecoration(labelText: 'Selected organization'),
                items: organizations
                    .map((org) => DropdownMenuItem(
                        value: org.id,
                        child: Text('${org.name} (${org.status})')))
                    .toList(),
                onChanged: (value) {
                  if (value == null) return;
                  _loadOrganizationDetails(value);
                },
              ),
            ),
            Expanded(
              child: TabBarView(
                controller: _tabController,
                children: [
                  ListView(
                    padding: const EdgeInsets.all(12),
                    children: [
                      Card(
                        child: Padding(
                          padding: const EdgeInsets.all(12),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text('${widget.profile.firstName} ${widget.profile.lastName}'
                                      .trim()
                                      .isEmpty
                                  ? widget.profile.username
                                  : '${widget.profile.firstName} ${widget.profile.lastName}'),
                              const SizedBox(height: 6),
                              Text('Role: ${widget.profile.role}'),
                              Text(
                                  'Organization: ${widget.profile.organizationName}'),
                            ],
                          ),
                        ),
                      ),
                      const SizedBox(height: 10),
                      Card(
                        child: Padding(
                          padding: const EdgeInsets.all(12),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              const Text('Totals'),
                              const SizedBox(height: 8),
                              Text(
                                  'Organizations: ${totals?.organizationsCount ?? 0}'),
                              Text('Channels: ${totals?.channelsCount ?? 0}'),
                              Text('Devices: ${totals?.devicesCount ?? 0}'),
                              Text(
                                  'Operations: ${totals?.operationsCount ?? 0}'),
                              Text('AI Cost: ${totals?.aiTotalCost ?? 0}'),
                            ],
                          ),
                        ),
                      ),
                      const SizedBox(height: 12),
                      const Text('Organizations'),
                      const SizedBox(height: 8),
                      ...organizations.map(
                        (org) => Card(
                          child: ListTile(
                            title: Text(org.name),
                            subtitle: Text(org.id),
                            trailing: Text(org.status),
                            onTap: () => _loadOrganizationDetails(org.id),
                          ),
                        ),
                      ),
                    ],
                  ),
                  ListView(
                    padding: const EdgeInsets.all(12),
                    children: [
                      Card(
                        child: ListTile(
                          title: Text(_organizationDetails?.organization.name ??
                              'No organization'),
                          subtitle:
                              Text(_organizationDetails?.organization.id ?? ''),
                          trailing: FilledButton(
                            onPressed: _organizationDetails == null
                                ? null
                                : _showEditOrganizationDialog,
                            child: const Text('Edit'),
                          ),
                        ),
                      ),
                      const SizedBox(height: 10),
                      Card(
                        child: Padding(
                          padding: const EdgeInsets.all(12),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              const Text('Channels'),
                              const SizedBox(height: 6),
                              ...(_organizationDetails?.channels ??
                                      const <OrganizationChannel>[])
                                  .map((channel) => Text(
                                      '- ${channel.name}${channel.isBlocked ? " (blocked)" : ""}')),
                            ],
                          ),
                        ),
                      ),
                    ],
                  ),
                  ListView(
                    padding: const EdgeInsets.all(12),
                    children: selectedOrgIssues
                        .map(
                          (issue) => Card(
                            child: Padding(
                              padding: const EdgeInsets.all(12),
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(issue.title,
                                      style: Theme.of(context)
                                          .textTheme
                                          .titleMedium),
                                  Text(
                                      'Severity: ${issue.severity} | Status: ${issue.status}'),
                                  const SizedBox(height: 6),
                                  Text(issue.description),
                                  const SizedBox(height: 10),
                                  Wrap(
                                    spacing: 8,
                                    children: [
                                      OutlinedButton(
                                        onPressed: () => _updateIssueStatus(
                                            issue, 'in_progress'),
                                        child: const Text('In progress'),
                                      ),
                                      FilledButton(
                                        onPressed: () => _updateIssueStatus(
                                            issue, 'resolved'),
                                        child: const Text('Resolve'),
                                      ),
                                    ],
                                  ),
                                ],
                              ),
                            ),
                          ),
                        )
                        .toList(),
                  ),
                  ListView(
                    padding: const EdgeInsets.all(12),
                    children: [
                      Align(
                        alignment: Alignment.centerLeft,
                        child: FilledButton(
                          onPressed: _showCreateUserDialog,
                          child: const Text('Create user'),
                        ),
                      ),
                      const SizedBox(height: 8),
                      ...selectedOrgUsers.map(
                        (user) => Card(
                          child: ListTile(
                            title: Text(user.username),
                            subtitle: Text(
                                '${user.role} | ${user.isActive ? "active" : "inactive"}'),
                            onTap: () => _showEditUserDialog(user),
                          ),
                        ),
                      ),
                    ],
                  ),
                  ListView(
                    padding: const EdgeInsets.all(12),
                    children: [
                      Align(
                        alignment: Alignment.centerLeft,
                        child: FilledButton(
                          onPressed: _showCreateOrganizationDialog,
                          child: const Text('Create organization'),
                        ),
                      ),
                      const SizedBox(height: 10),
                      ...organizations.map(
                        (org) => Card(
                          child: ListTile(
                            title: Text(org.name),
                            subtitle: Text(org.id),
                            trailing: Text(org.status),
                            onTap: () async {
                              await _loadOrganizationDetails(org.id);
                              await _showEditOrganizationDialog();
                            },
                          ),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
