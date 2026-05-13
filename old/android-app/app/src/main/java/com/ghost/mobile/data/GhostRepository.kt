package com.ghost.mobile.data

import com.ghost.mobile.network.DashboardOverviewResponse
import com.ghost.mobile.network.GhostApi
import com.ghost.mobile.network.LoginResponse

class GhostRepository(
  private val api: GhostApi,
  private val sessionStore: SessionStore,
) {
  suspend fun login(username: String, password: String): Result<LoginResponse> {
    val result = api.login(username, password)
    result.getOrNull()?.let { response ->
      sessionStore.saveSession(response.accessToken, response.profile)
    }
    return result
  }

  fun getDashboardOverview(accessToken: String): Result<DashboardOverviewResponse> {
    return api.getDashboardOverview(accessToken)
  }

  suspend fun logout() {
    sessionStore.clearSession()
  }
}
