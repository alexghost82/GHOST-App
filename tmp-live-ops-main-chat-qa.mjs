import fs from 'node:fs/promises'
import path from 'node:path'
import { chromium } from 'playwright'

const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'
const outDir = path.resolve('output/playwright/live-ops-main-chat-qa')
await fs.mkdir(outDir, { recursive: true })

async function getRegularUserSession() {
  const superResponse = await fetch('http://127.0.0.1:8787/api/auth/ghost-access', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: '{}',
  })
  if (!superResponse.ok) throw new Error(`ghost-access failed: ${superResponse.status}`)
  const superAuth = await superResponse.json()

  const lookup = await fetch('http://127.0.0.1:8787/api/admin/users', {
    headers: { Authorization: `Bearer ${superAuth.accessToken}` },
  })
  if (!lookup.ok) throw new Error(`admin users failed: ${lookup.status}`)
  const usersPayload = await lookup.json()
  const users = Array.isArray(usersPayload) ? usersPayload : usersPayload.users ?? []

  for (const username of ['slon', 'test_local_flow_user', 'browser_qa_1777360403']) {
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
      const impersonated = await response.json()
      return { ...impersonated, username }
    }
  }

  throw new Error('No regular user could be impersonated')
}

async function createAuthedContext(browser, auth) {
  const context = await browser.newContext({ viewport: { width: 1920, height: 1030 }, locale: 'he-IL' })
  await context.addInitScript((payload) => {
    window.localStorage.setItem('ghost-ui-theme', 'dark')
    window.sessionStorage.setItem('ghost_auth_session', '1')
    window.sessionStorage.setItem('ghost_access_token', payload.accessToken)
    window.sessionStorage.setItem('ghost_refresh_token', payload.refreshToken)
    window.sessionStorage.setItem('ghost_auth_profile', JSON.stringify(payload.profile))
  }, auth)
  return context
}

async function collect(page, label) {
  const screenshot = path.join(outDir, `${label}.png`)
  await page.screenshot({ path: screenshot, fullPage: true })
  const data = await page.evaluate(() => {
    const theme = document.documentElement.dataset.theme ?? 'light'
    const stream = document.querySelector('.message-stream')
    const rows = Array.from(document.querySelectorAll('.message-row')).map((row) => {
      const rect = row.getBoundingClientRect()
      return {
        className: row.className,
        x: Math.round(rect.x),
        y: Math.round(rect.y),
        width: Math.round(rect.width),
        height: Math.round(rect.height),
      }
    })
    const streamRect = stream?.getBoundingClientRect()
    return {
      theme,
      url: location.href,
      bodyText: document.body.innerText.slice(0, 700),
      streamRect: streamRect
        ? {
            x: Math.round(streamRect.x),
            y: Math.round(streamRect.y),
            width: Math.round(streamRect.width),
            height: Math.round(streamRect.height),
          }
        : null,
      rows,
    }
  })
  return { screenshot, ...data }
}

const auth = await getRegularUserSession()
const browser = await chromium.launch({ executablePath: EDGE_PATH, headless: true })
const context = await createAuthedContext(browser, auth)
const page = await context.newPage()
await page.goto('http://127.0.0.1:4173', { waitUntil: 'networkidle' })
await page.waitForTimeout(1200)

const dark = await collect(page, 'dark-main-chat')
await browser.close()

const report = { user: auth.username, dark }
const reportPath = path.join(outDir, 'report.json')
await fs.writeFile(reportPath, JSON.stringify(report, null, 2), 'utf8')
console.log(JSON.stringify({ reportPath, ...report }, null, 2))

