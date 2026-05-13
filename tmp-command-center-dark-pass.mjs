import fs from 'node:fs/promises'
import path from 'node:path'
import { chromium } from 'playwright'

const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'
const outDir = path.resolve('output/playwright/command-center-dark-pass')
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
      return response.json()
    }
  }

  throw new Error('No regular user available')
}

const auth = await getRegularUserSession()
const browser = await chromium.launch({ executablePath: EDGE_PATH, headless: true })
const context = await browser.newContext({ viewport: { width: 1440, height: 960 }, locale: 'he-IL' })
await context.addInitScript(() => {
  window.localStorage.setItem('ghost-ui-theme', 'dark')
  document.documentElement.dataset.theme = 'dark'
  document.documentElement.style.colorScheme = 'dark'
})

const page = await context.newPage()
const encoded = Buffer.from(JSON.stringify(auth), 'utf8').toString('base64')
await page.goto(`http://127.0.0.1:4173/#impersonate=${encoded}`, { waitUntil: 'networkidle' })
await page.waitForTimeout(1000)
const nav = page.locator('.topbar-nav-item', { hasText: 'מרכז פיקוד' }).first()
if (await nav.count()) {
  await nav.click()
  await page.waitForTimeout(1200)
}

const screenshot = path.join(outDir, 'command-center-dark-regular.png')
await page.screenshot({ path: screenshot, fullPage: true })
const report = { screenshot }
const reportPath = path.join(outDir, 'report.json')
await fs.writeFile(reportPath, JSON.stringify(report, null, 2), 'utf8')
await browser.close()
console.log(JSON.stringify({ reportPath, report }, null, 2))
