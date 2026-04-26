package com.ghost.mobile.network

import kotlinx.serialization.Serializable

@Serializable
data class AuthProfile(
  val userId: String,
  val organizationId: String,
  val organizationName: String = "",
  val role: String,
  val username: String,
  val firstName: String = "",
  val lastName: String = "",
)

@Serializable
data class LoginRequest(
  val username: String,
  val password: String,
)

@Serializable
data class LoginResponse(
  val accessToken: String,
  val refreshToken: String,
  val profile: AuthProfile,
)

@Serializable
data class DashboardTotals(
  val organizationsCount: Int,
  val sentMessages: Int,
  val receivedMessages: Int,
  val devicesCount: Int,
  val channelsCount: Int,
  val operationsCount: Int,
  val aiTotalCost: Double,
  val apiTotalCost: Double,
  val agentsTotalCost: Double,
)

@Serializable
data class DashboardOrganization(
  val id: String,
  val name: String,
  val status: String,
)

@Serializable
data class DashboardOverviewResponse(
  val totals: DashboardTotals,
  val organizations: List<DashboardOrganization>,
)

@Serializable
data class ErrorPayload(
  val error: String? = null,
)
