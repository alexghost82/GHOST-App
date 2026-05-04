import { existsSync, readFileSync, unlinkSync, writeFileSync } from 'node:fs'
import { randomUUID } from 'node:crypto'
import { resolve } from 'node:path'
import { execFile } from 'node:child_process'

const POWERSHELL_PATH = 'C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe'
const SECRET_STORE_FILENAME = 'ghost-camera-secrets.runtime.json'

interface SecretStoreFile {
  version: number
  entries: Record<string, string>
}

function secretStorePath(): string {
  return resolve(process.cwd(), SECRET_STORE_FILENAME)
}

function loadSecretStoreFile(): SecretStoreFile {
  const path = secretStorePath()
  if (!existsSync(path)) {
    return { version: 1, entries: {} }
  }

  try {
    const parsed = JSON.parse(readFileSync(path, 'utf8')) as SecretStoreFile
    return {
      version: 1,
      entries: parsed?.entries && typeof parsed.entries === 'object' ? parsed.entries : {},
    }
  } catch {
    return { version: 1, entries: {} }
  }
}

function saveSecretStoreFile(store: SecretStoreFile): void {
  writeFileSync(secretStorePath(), JSON.stringify(store, null, 2), 'utf8')
}

export async function saveSecret(secretRef: string, plainText: string): Promise<string> {
  const store = loadSecretStoreFile()
  store.entries[secretRef] = await protectForCurrentUser(plainText)
  saveSecretStoreFile(store)
  return secretRef
}

export async function createSecretRef(prefix = 'secret'): Promise<string> {
  return `${prefix}-${randomUUID()}`
}

export async function loadSecret(secretRef: string | undefined): Promise<string | undefined> {
  if (!secretRef) {
    return undefined
  }
  const store = loadSecretStoreFile()
  const encrypted = store.entries[secretRef]
  if (!encrypted) {
    return undefined
  }
  return unprotectForCurrentUser(encrypted)
}

export function deleteSecrets(secretRefs: Array<string | undefined>): void {
  const refs = secretRefs.filter((value): value is string => Boolean(value))
  if (refs.length === 0) {
    return
  }
  const store = loadSecretStoreFile()
  for (const ref of refs) {
    delete store.entries[ref]
  }
  saveSecretStoreFile(store)
}

export function clearSecretStore(): void {
  const path = secretStorePath()
  if (existsSync(path)) {
    unlinkSync(path)
  }
}

function protectForCurrentUser(plainText: string): Promise<string> {
  return runProtectedDataScript('protect', plainText)
}

function unprotectForCurrentUser(protectedText: string): Promise<string> {
  return runProtectedDataScript('unprotect', protectedText)
}

function runProtectedDataScript(mode: 'protect' | 'unprotect', payload: string): Promise<string> {
  const payloadBase64 = Buffer.from(payload, 'utf8').toString('base64')
  const script = mode === 'protect'
    ? [
        `$payloadBytes = [Convert]::FromBase64String('${payloadBase64}')`,
        '$plain = [Text.Encoding]::UTF8.GetString($payloadBytes)',
        '$secure = ConvertTo-SecureString -String $plain -AsPlainText -Force',
        'ConvertFrom-SecureString -SecureString $secure',
      ].join('; ')
    : [
        `$payloadBytes = [Convert]::FromBase64String('${payloadBase64}')`,
        '$cipher = [Text.Encoding]::UTF8.GetString($payloadBytes)',
        '$secure = ConvertTo-SecureString -String $cipher',
        '[System.Net.NetworkCredential]::new("", $secure).Password',
      ].join('; ')

  return new Promise((resolvePromise, reject) => {
    execFile(
      POWERSHELL_PATH,
      ['-NoProfile', '-NonInteractive', '-Command', script],
      { windowsHide: true, maxBuffer: 1024 * 1024 },
      (error, stdout, stderr) => {
        if (error) {
          reject(new Error(stderr?.trim() || error.message))
          return
        }
        resolvePromise(stdout.trim())
      },
    )
  })
}
