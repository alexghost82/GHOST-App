package com.ghost.mobile.network

import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import okhttp3.logging.HttpLoggingInterceptor
import kotlinx.serialization.json.Json

class GhostApi(
  private val baseUrl: String,
) {
  private val json = Json { ignoreUnknownKeys = true }
  private val client = OkHttpClient.Builder()
    .addInterceptor(HttpLoggingInterceptor().apply { level = HttpLoggingInterceptor.Level.BASIC })
    .build()

  fun login(username: String, password: String): Result<LoginResponse> {
    val requestBody = json.encodeToString(LoginRequest.serializer(), LoginRequest(username, password))
      .toRequestBody("application/json".toMediaType())
    val request = Request.Builder()
      .url("$baseUrl/api/auth/login")
      .post(requestBody)
      .build()

    return execute(request) { payload -> json.decodeFromString(LoginResponse.serializer(), payload) }
  }

  fun getDashboardOverview(accessToken: String): Result<DashboardOverviewResponse> {
    val request = Request.Builder()
      .url("$baseUrl/api/admin/dashboard/overview")
      .header("Authorization", "Bearer $accessToken")
      .get()
      .build()
    return execute(request) { payload -> json.decodeFromString(DashboardOverviewResponse.serializer(), payload) }
  }

  private fun <T> execute(request: Request, decoder: (String) -> T): Result<T> {
    return runCatching {
      client.newCall(request).execute().use { response ->
        val raw = response.body?.string().orEmpty()
        if (!response.isSuccessful) {
          val backendError = runCatching { json.decodeFromString(ErrorPayload.serializer(), raw).error }.getOrNull()
          error(backendError ?: "Request failed: HTTP ${response.code}")
        }
        decoder(raw)
      }
    }
  }
}
