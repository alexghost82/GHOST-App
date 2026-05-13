package com.ghost.mobile.ui

import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import androidx.lifecycle.viewModelScope
import com.ghost.mobile.data.GhostRepository
import com.ghost.mobile.data.SessionData
import com.ghost.mobile.data.SessionStore
import com.ghost.mobile.network.DashboardOverviewResponse
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch

class MainViewModel(
  private val repository: GhostRepository,
  private val sessionStore: SessionStore,
) : ViewModel() {

  private val _uiState = MutableStateFlow(MainUiState())
  val uiState: StateFlow<MainUiState> = _uiState.asStateFlow()

  init {
    viewModelScope.launch {
      sessionStore.sessionFlow.collect { session ->
        _uiState.update { it.copy(session = session) }
        if (session != null) {
          refreshDashboard()
        }
      }
    }
  }

  fun login(username: String, password: String) {
    viewModelScope.launch {
      _uiState.update { it.copy(isLoading = true, errorMessage = null) }
      val result = repository.login(username, password)
      _uiState.update {
        if (result.isSuccess) {
          it.copy(isLoading = false, errorMessage = null)
        } else {
          it.copy(isLoading = false, errorMessage = result.exceptionOrNull()?.message ?: "Login failed")
        }
      }
    }
  }

  fun refreshDashboard() {
    val token = _uiState.value.session?.accessToken ?: return
    viewModelScope.launch {
      _uiState.update { it.copy(isRefreshing = true) }
      val result = repository.getDashboardOverview(token)
      _uiState.update {
        if (result.isSuccess) {
          it.copy(isRefreshing = false, dashboard = result.getOrNull(), errorMessage = null)
        } else {
          it.copy(isRefreshing = false, errorMessage = result.exceptionOrNull()?.message ?: "Failed to load dashboard")
        }
      }
    }
  }

  fun logout() {
    viewModelScope.launch {
      repository.logout()
      _uiState.update { MainUiState() }
    }
  }
}

data class MainUiState(
  val session: SessionData? = null,
  val dashboard: DashboardOverviewResponse? = null,
  val isLoading: Boolean = false,
  val isRefreshing: Boolean = false,
  val errorMessage: String? = null,
)

class MainViewModelFactory(
  private val repository: GhostRepository,
  private val sessionStore: SessionStore,
) : ViewModelProvider.Factory {
  override fun <T : ViewModel> create(modelClass: Class<T>): T {
    if (modelClass.isAssignableFrom(MainViewModel::class.java)) {
      @Suppress("UNCHECKED_CAST")
      return MainViewModel(repository, sessionStore) as T
    }
    throw IllegalArgumentException("Unknown ViewModel class: ${modelClass.name}")
  }
}
