package com.ghost.mobile

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.lifecycle.viewmodel.compose.viewModel
import com.ghost.mobile.data.GhostRepository
import com.ghost.mobile.data.SessionStore
import com.ghost.mobile.network.GhostApi
import com.ghost.mobile.ui.GhostAppScreen
import com.ghost.mobile.ui.MainViewModel
import com.ghost.mobile.ui.MainViewModelFactory

class MainActivity : ComponentActivity() {
  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)
    enableEdgeToEdge()

    val baseUrl = BuildConfig.API_BASE_URL
    val sessionStore = SessionStore(applicationContext)
    val repository = GhostRepository(
      api = GhostApi(baseUrl = baseUrl),
      sessionStore = sessionStore,
    )

    setContent {
      val viewModel: MainViewModel = viewModel(
        factory = MainViewModelFactory(repository, sessionStore),
      )
      val state by viewModel.uiState.collectAsState()

      MaterialTheme {
        Surface {
          GhostAppScreen(
            uiState = state,
            onLogin = viewModel::login,
            onRefreshDashboard = viewModel::refreshDashboard,
            onLogout = viewModel::logout,
          )
        }
      }
    }
  }
}
