import fs from 'node:fs/promises'
import path from 'node:path'
import { chromium } from 'playwright'

const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'
const API_URL = 'http://127.0.0.1:7722'
const outDir = path.resolve('output/playwright/local-chat-send-check')
await fs.mkdir(outDir, { recursive: true })

async function resolveBaseUrl() {
  for (const port of [4173, 4174, 4175, 4176, 4177, 4178]) {
    try {
      const response = await fetch(`http://127.0.0.1:${port}/`, { redirect: 'manual' })
      if (response.ok) {
        return `http://127.0.0.1:${port}`
      }
    } catch {
      // Try next port.
    }
  }

  throw new Error('No local frontend URL is reachable on ports 4173-4178')
}

async function getRegularUserSession() {
  const superResponse = await fetch(`${API_URL}/api/auth/ghost-access`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: '{}',
  })
  if (!superResponse.ok) throw new Error(`ghost-access failed: ${superResponse.status}`)
  const superAuth = await superResponse.json()

  const lookup = await fetch(`${API_URL}/api/admin/users`, {
    headers: { Authorization: `Bearer ${superAuth.accessToken}` },
  })
  if (!lookup.ok) throw new Error(`admin users failed: ${lookup.status}`)
  const usersPayload = await lookup.json()
  const users = Array.isArray(usersPayload) ? usersPayload : usersPayload.users ?? []

  for (const username of ['slon', 'test_local_flow_user', 'browser_qa_1777360403']) {
    const target = users.find((user) => user.username === username)
    if (!target) continue

    const response = await fetch(`${API_URL}/api/auth/impersonate`, {
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
    permissions: ['camera'],
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

const auth = await getRegularUserSession()
const browser = await chromium.launch({ executablePath: EDGE_PATH, headless: true })
const context = await createAuthedContext(browser, auth)
const page = await context.newPage()
const baseUrl = await resolveBaseUrl()

const consoleErrors = []
const networkEvents = []
page.on('console', (msg) => {
  if (msg.type() === 'error') {
    consoleErrors.push(msg.text())
  }
})
page.on('pageerror', (error) => {
  consoleErrors.push(`pageerror: ${error.message}`)
})
page.on('requestfailed', (request) => {
  if (request.url().includes('/api/')) {
    networkEvents.push({
      type: 'requestfailed',
      url: request.url(),
      method: request.method(),
      failure: request.failure()?.errorText ?? 'unknown',
    })
  }
})
page.on('response', async (response) => {
  if (response.url().includes('/api/')) {
    networkEvents.push({
      type: 'response',
      url: response.url(),
      status: response.status(),
      method: response.request().method(),
    })
  }
})

await page.goto(baseUrl, { waitUntil: 'networkidle' })
await page.waitForSelector('.message-stream')
await page.waitForTimeout(1000)

const draft = stamp('local-send-check')
await page.fill('#live-ops-composer', draft)
await page.click('.composer-send-button')
await page.waitForTimeout(30000)

const afterSend = await page.evaluate((text) => {
  const bodyText = document.body.innerText
  const rows = Array.from(document.querySelectorAll('.message-row')).map((row) => row.textContent?.trim() ?? '')
  return {
    hasInBody: bodyText.includes(text),
    matchingRows: rows.filter((row) => row.includes(text)),
    ghostRows: rows.filter((row) => row.includes('GHOST')),
    rowCount: rows.length,
  }
}, draft)

await page.reload({ waitUntil: 'networkidle' })
await page.waitForSelector('.message-stream')
await page.waitForTimeout(2000)

const afterReload = await page.evaluate((text) => {
  const bodyText = document.body.innerText
  const rows = Array.from(document.querySelectorAll('.message-row')).map((row) => row.textContent?.trim() ?? '')
  return {
    hasInBody: bodyText.includes(text),
    matchingRows: rows.filter((row) => row.includes(text)),
    ghostRows: rows.filter((row) => row.includes('GHOST')),
    rowCount: rows.length,
  }
}, draft)

const screenshotPath = path.join(outDir, 'after-reload.png')
await page.screenshot({ path: screenshotPath, fullPage: true })
await browser.close()

const report = {
  user: auth.username,
  baseUrl,
  draft,
  afterSend,
  afterReload,
  consoleErrors,
  networkEvents,
  screenshotPath,
}
const reportPath = path.join(outDir, 'report.json')
await fs.writeFile(reportPath, JSON.stringify(report, null, 2), 'utf8')
console.log(JSON.stringify({ reportPath, ...report }, null, 2))
