export type FirebaseRuntimeConfig = {
  projectId?: string
  databaseURL?: string
}

export function readFirebaseRuntimeConfig(): FirebaseRuntimeConfig {
  const rawConfig = process.env.FIREBASE_CONFIG?.trim()
  if (!rawConfig) {
    return {}
  }

  try {
    return JSON.parse(rawConfig) as FirebaseRuntimeConfig
  } catch (error) {
    console.warn('Unable to parse FIREBASE_CONFIG; falling back to explicit Firebase env vars.', error)
    return {}
  }
}

export function resolveFirebaseProjectId(): string | undefined {
  const runtimeConfig = readFirebaseRuntimeConfig()
  return (
    process.env.FIREBASE_PROJECT_ID?.trim() ||
    process.env.GCLOUD_PROJECT?.trim() ||
    process.env.GOOGLE_CLOUD_PROJECT?.trim() ||
    runtimeConfig.projectId
  )
}

export function resolveFirebaseDatabaseUrl(): string | undefined {
  const runtimeConfig = readFirebaseRuntimeConfig()
  return process.env.FIREBASE_DATABASE_URL?.trim() || runtimeConfig.databaseURL
}

export function hasFirebaseProjectConfig(): boolean {
  return Boolean(resolveFirebaseProjectId())
}
