const fs = require('node:fs')
const path = require('node:path')

const configuredDir = process.env.GHOST_HIKVISION_SDK_DIR
const configuredSourceDir = process.env.GHOST_HIKVISION_SDK_SOURCE
const destination = path.join(process.cwd(), 'hikvision-sdk')

function hasRequiredDlls(dir) {
  return fs.existsSync(path.join(dir, 'HCNetSDK.dll'))
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

const source = resolveSdkDir()
if (!source) {
  console.error('Hikvision SDK is required for packaging.')
  console.error('Set GHOST_HIKVISION_SDK_DIR to a folder containing HCNetSDK.dll.')
  process.exit(1)
}

if (path.resolve(source) === path.resolve(destination)) {
  console.log(`Hikvision SDK already staged: ${destination}`)
  process.exit(0)
}

fs.rmSync(destination, { recursive: true, force: true })
fs.cpSync(source, destination, { recursive: true })
console.log(`Hikvision SDK staged: ${destination}`)
