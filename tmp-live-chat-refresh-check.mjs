import fs from 'node:fs/promises'
import path from 'node:path'
import { chromium } from 'playwright'

const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'
const BASE_URL = 'https://ghost-test-app-b906c.web.app'
const API_URL = `${BASE_URL}/api`
const outDir = path.resolve('output/playwright/live-chat-refresh-check')
await fs.mkdir(outDir, { recursive: true })

async function getRegularUserSession() {
  const superResponse = await fetch(`${API_URL}/auth/ghost-access`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: '{}',
  })
  if (!superResponse.ok) throw new Error(`ghost-access failed: ${superResponse.status}`)
  const superAuth = await superResponse.json()

  const lookup = await fetch(`${API_URL}/admin/users`, {
    headers: { Authorization: `Bearer ${superAuth.accessToken}` },
  })
  if (!lookup.ok) throw new Error(`admin users failed: ${lookup.status}`)
  const usersPayload = await lookup.json()
  const users = Array.isArray(usersPayload) ? usersPayload : usersPayload.users ?? []

  for (const username of ['slon', 'test_local_flow_user', 'browser_qa_1777360403']) {
    const target = users.find((user) => user.username === username)
    if (!target) continue

    const response = await fetch(`${API_URL}/auth/impersonate`, {
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
  const context = await browser.newContext({
    viewport: { width: 1600, height: 950 },
    locale: 'he-IL',
  })
  await context.addInitScript((payload) => {
    window.localStorage.setItem('ghost-ui-theme', 'dark')
    window.sessionStorage.setItem('ghost_auth_session', '1')
    window.sessionStorage.setItem('ghost_access_token', payload.accessToken)
    window.sessionStorage.setItem('ghost_refresh_token', payload.refreshToken)
    window.sessionStorage.setItem('ghost_auth_profile', JSON.stringify(payload.profile))
  }, auth)
  return context
}

function stamp(prefix) {
  return `${prefix}-${Date.now()}`
}

async function collectRows(page, text) {
  return page.evaluate((draft) => {
    const rows = Array.from(document.querySelectorAll('.message-row')).map((row) => ({
      text: row.textContent?.trim() ?? '',
      className: row.className,
    }))
    return {
      bodyText: document.body.innerText,
      matchingRows: rows.filter((row) => row.text.includes(draft)),
      allRows: rows,
    }
  }, text)
}

const auth = await getRegularUserSession()
const browser = await chromium.launch({ executablePath: EDGE_PATH, headless: true })
const context = await createAuthedContext(browser, auth)
const page = await context.newPage()

const consoleErrors = []
page.on('console', (msg) => {
  if (msg.type() === 'error') {
    consoleErrors.push(msg.text())
  }
})
page.on('pageerror', (error) => {
  consoleErrors.push(`pageerror: ${error.message}`)
})

await page.goto(BASE_URL, { waitUntil: 'networkidle' })
await page.waitForSelector('.message-stream')
await page.waitForTimeout(1500)

const draft = stamp('refresh-check')
await page.fill('#live-ops-composer', draft)
await page.click('.composer-send-button')
await page.waitForTimeout(30000)

const afterSend = await collectRows(page, draft)
const afterSendShot = path.join(outDir, 'after-send.png')
await page.screenshot({ path: afterSendShot, fullPage: true })

await page.reload({ waitUntil: 'networkidle' })
await page.waitForSelector('.message-stream')
await page.waitForTimeout(3000)

const afterReload = await collectRows(page, draft)
const afterReloadShot = path.join(outDir, 'after-reload.png')
await page.screenshot({ path: afterReloadShot, fullPage: true })

await browser.close()

const report = {
  user: auth.username,
  baseUrl: BASE_URL,
  draft,
  afterSend,
  afterReload,
  consoleErrors,
  screenshots: {
    afterSend: afterSendShot,
    afterReload: afterReloadShot,
  },
}

const reportPath = path.join(outDir, 'report.json')
await fs.writeFile(reportPath, JSON.stringify(report, null, 2), 'utf8')
console.log(JSON.stringify({ reportPath, ...report }, null, 2))
