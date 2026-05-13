const fs = require('node:fs')
const path = require('node:path')

const requiredDlls = ['HCNetSDK.dll']
const configuredDir = process.env.GHOST_HIKVISION_SDK_DIR
const configuredSourceDir = process.env.GHOST_HIKVISION_SDK_SOURCE

function hasRequiredDlls(dir) {
  return requiredDlls.every((dll) => fs.existsSync(path.join(dir, dll)))
}

function resolveSdkDir() {
  const candidates = [
    configuredDir,
    configuredSourceDir,
    path.join(process.cwd(), 'hikvision-sdk'),
    path.join(process.cwd(), 'sdk', 'hikvision'),
    path.join(process.cwd(), 'vendor', 'hikvision-sdk'),
    path.join(process.cwd(), 'release-assets', 'hikvision-sdk'),
  ].filter(Boolean)

  for (const candidate of candidates) {
    if (hasRequiredDlls(candidate)) return candidate
    const libDir = path.join(candidate, 'lib')
    if (hasRequiredDlls(libDir)) return libDir
  }
  return null
}

const sdkDir = resolveSdkDir()
if (!sdkDir) {
  console.error('Hikvision SDK is required for packaging.')
  console.error('Set GHOST_HIKVISION_SDK_DIR to a folder containing HCNetSDK.dll.')
  process.exit(1)
}

console.log(`Hikvision SDK found: ${sdkDir}`)
