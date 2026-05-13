package com.ghost.mobile.data

import android.content.Context
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.emptyPreferences
import androidx.datastore.preferences.core.stringPreferencesKey
import androidx.datastore.preferences.preferencesDataStore
import com.ghost.mobile.network.AuthProfile
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.catch
import kotlinx.coroutines.flow.map
import kotlinx.serialization.json.Json
import java.io.IOException

private val Context.sessionDataStore by preferencesDataStore(name = "ghost_session")

class SessionStore(private val context: Context) {
  private val json = Json { ignoreUnknownKeys = true }

  val sessionFlow: Flow<SessionData?> = context.sessionDataStore.data
    .catch { exception ->
      if (exception is IOException) emit(emptyPreferences()) else throw exception
    }
    .map { preferences ->
      val token = preferences[ACCESS_TOKEN] ?: return@map null
      val profileRaw = preferences[PROFILE_JSON] ?: return@map null
      val profile = runCatching { json.decodeFromString<AuthProfile>(profileRaw) }.getOrNull() ?: return@map null
      SessionData(accessToken = token, profile = profile)
    }

  suspend fun saveSession(accessToken: String, profile: AuthProfile) {
    context.sessionDataStore.edit { preferences ->
      preferences[ACCESS_TOKEN] = accessToken
      preferences[PROFILE_JSON] = json.encodeToString(AuthProfile.serializer(), profile)
    }
  }

  suspend fun clearSession() {
    context.sessionDataStore.edit { preferences ->
      preferences.remove(ACCESS_TOKEN)
      preferences.remove(PROFILE_JSON)
    }
  }

  private companion object {
    val ACCESS_TOKEN = stringPreferencesKey("access_token")
    val PROFILE_JSON = stringPreferencesKey("profile_json")
  }
}

data class SessionData(
  val accessToken: String,
  val profile: AuthProfile,
)
