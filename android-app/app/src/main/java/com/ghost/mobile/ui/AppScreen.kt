package com.ghost.mobile.ui

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.Button
import androidx.compose.material3.Card
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.unit.dp

@Composable
fun GhostAppScreen(
  uiState: MainUiState,
  onLogin: (String, String) -> Unit,
  onRefreshDashboard: () -> Unit,
  onLogout: () -> Unit,
) {
  if (uiState.session == null) {
    LoginScreen(
      isLoading = uiState.isLoading,
      errorMessage = uiState.errorMessage,
      onLogin = onLogin,
    )
    return
  }

  DashboardScreen(
    uiState = uiState,
    onRefreshDashboard = onRefreshDashboard,
    onLogout = onLogout,
  )
}

@Composable
private fun LoginScreen(
  isLoading: Boolean,
  errorMessage: String?,
  onLogin: (String, String) -> Unit,
) {
  var username by remember { mutableStateOf("Alex") }
  var password by remember { mutableStateOf("05010108!!") }

  Column(
    modifier = Modifier
      .fillMaxSize()
      .padding(20.dp),
    verticalArrangement = Arrangement.Center,
  ) {
    Text("Ghost Android", style = MaterialTheme.typography.headlineSmall)
    Text("Sign in to existing backend session", style = MaterialTheme.typography.bodyMedium, modifier = Modifier.padding(top = 4.dp, bottom = 20.dp))

    OutlinedTextField(
      value = username,
      onValueChange = { username = it },
      label = { Text("Username") },
      modifier = Modifier.fillMaxWidth(),
      singleLine = true,
    )
    OutlinedTextField(
      value = password,
      onValueChange = { password = it },
      label = { Text("Password") },
      modifier = Modifier
        .fillMaxWidth()
        .padding(top = 12.dp),
      singleLine = true,
      visualTransformation = PasswordVisualTransformation(),
    )

    if (!errorMessage.isNullOrBlank()) {
      Text(
        text = errorMessage,
        color = MaterialTheme.colorScheme.error,
        modifier = Modifier.padding(top = 12.dp),
      )
    }

    Button(
      onClick = { onLogin(username.trim(), password) },
      enabled = !isLoading,
      modifier = Modifier
        .fillMaxWidth()
        .padding(top = 16.dp),
    ) {
      if (isLoading) {
        CircularProgressIndicator(strokeWidth = 2.dp, modifier = Modifier.padding(end = 8.dp))
      }
      Text("Sign in")
    }
  }
}

@Composable
private fun DashboardScreen(
  uiState: MainUiState,
  onRefreshDashboard: () -> Unit,
  onLogout: () -> Unit,
) {
  Scaffold(
    topBar = {
      Row(
        modifier = Modifier
          .fillMaxWidth()
          .padding(12.dp),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically,
      ) {
        Text("Ghost Super Admin", style = MaterialTheme.typography.titleLarge)
        Row {
          TextButton(onClick = onRefreshDashboard) { Text("Refresh") }
          TextButton(onClick = onLogout) { Text("Logout") }
        }
      }
    },
  ) { padding ->
    LazyColumn(
      modifier = Modifier
        .fillMaxSize()
        .padding(padding),
      contentPadding = PaddingValues(12.dp),
      verticalArrangement = Arrangement.spacedBy(10.dp),
    ) {
      val totals = uiState.dashboard?.totals
      item {
        Card(modifier = Modifier.fillMaxWidth()) {
          Column(modifier = Modifier.padding(14.dp)) {
            Text("Totals", style = MaterialTheme.typography.titleMedium)
            Text("Organizations: ${totals?.organizationsCount ?: 0}")
            Text("Channels: ${totals?.channelsCount ?: 0}")
            Text("Devices: ${totals?.devicesCount ?: 0}")
            Text("Operations: ${totals?.operationsCount ?: 0}")
            Text("AI Cost: ${totals?.aiTotalCost ?: 0.0}")
          }
        }
      }

      if (uiState.isRefreshing) {
        item { CircularProgressIndicator(modifier = Modifier.padding(12.dp)) }
      }

      val organizations = uiState.dashboard?.organizations.orEmpty()
      items(organizations) { organization ->
        Card(modifier = Modifier.fillMaxWidth()) {
          Column(modifier = Modifier.padding(12.dp)) {
            Text(organization.name, style = MaterialTheme.typography.titleMedium)
            Text("ID: ${organization.id}", style = MaterialTheme.typography.bodySmall)
            Text("Status: ${organization.status}", style = MaterialTheme.typography.bodySmall)
          }
        }
      }
    }
  }
}
