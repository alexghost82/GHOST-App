import fs from 'node:fs/promises'
import path from 'node:path'
import { chromium } from 'playwright'

const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'
const outDir = path.resolve('output/playwright/impersonated-regular-user-qa')
await fs.mkdir(outDir, { recursive: true })

const superResponse = await fetch('http://127.0.0.1:8787/api/auth/ghost-access', {
  method: 'POST',
  headers: { 'content-type': 'application/json' },
  body: '{}',
})
if (!superResponse.ok) throw new Error(`ghost-access failed: ${superResponse.status}`)
const superAuth = await superResponse.json()

const meResponse = await fetch('http://127.0.0.1:8787/api/auth/me', {
  headers: { Authorization: `Bearer ${superAuth.accessToken}` },
})
if (!meResponse.ok) throw new Error(`me failed: ${meResponse.status}`)

const dbUsers = ['slon', 'test_local_flow_user', 'browser_qa_1777360403']
let impersonated = null
const lookup = await fetch('http://127.0.0.1:8787/api/admin/users', {
  headers: { Authorization: `Bearer ${superAuth.accessToken}` },
})
if (!lookup.ok) throw new Error(`admin users failed: ${lookup.status}`)
const usersPayload = await lookup.json()
const users = Array.isArray(usersPayload) ? usersPayload : usersPayload.users ?? []

for (const username of dbUsers) {
  const target = users.find((user) => user.username === username)
  if (!target) continue

  const response = await fetch('http://127.0.0.1:8787/api/auth/impersonate', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      Authorization: `Bearer ${superAuth.accessToken}`,
    },
    body: JSON.stringify({ userId: target.id }),
  })
  if (response.ok) {
    impersonated = await response.json()
    impersonated.username = username
    break
  }
}

if (!impersonated) {
  throw new Error('No regular user could be impersonated')
}

const browser = await chromium.launch({ executablePath: EDGE_PATH, headless: true })
const context = await browser.newContext({ viewport: { width: 1440, height: 960 }, locale: 'he-IL' })
await context.addInitScript((payload) => {
  window.sessionStorage.setItem('ghost_auth_session', '1')
  window.sessionStorage.setItem('ghost_access_token', payload.accessToken)
  window.sessionStorage.setItem('ghost_refresh_token', payload.refreshToken)
  window.sessionStorage.setItem('ghost_auth_profile', JSON.stringify(payload.profile))
}, impersonated)

const page = await context.newPage()
const report = { user: impersonated.username, url: 'http://127.0.0.1:4173', issues: [], screenshots: {} }

await page.goto('http://127.0.0.1:4173', { waitUntil: 'networkidle' })
await page.waitForTimeout(800)
await page.screenshot({ path: path.join(outDir, 'regular-user-home.png'), fullPage: true })
report.screenshots.home = path.join(outDir, 'regular-user-home.png')

report.state = await page.evaluate(() => ({
  activeSurface: document.body.dataset.activeSurface ?? null,
  hasChatListItem: Boolean(document.querySelector('.chat-list-item')),
  inboxTitle: document.querySelector('.inbox-appbar h2')?.textContent?.trim() ?? null,
  navItems: Array.from(document.querySelectorAll('.topbar-nav-item')).map((el) => el.textContent?.trim()),
  bodyText: document.body.innerText.slice(0, 1600),
}))

if (report.state.activeSurface !== 'live-ops') report.issues.push(`expected live-ops, got ${report.state.activeSurface}`)
if (!report.state.hasChatListItem) report.issues.push('chat list item missing for regular user')

await browser.close()
await fs.writeFile(path.join(outDir, 'report.json'), JSON.stringify(report, null, 2), 'utf8')
console.log(JSON.stringify(report, null, 2))
