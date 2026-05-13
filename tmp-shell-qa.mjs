import fs from 'node:fs/promises'
import path from 'node:path'
import { chromium } from 'playwright'

const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'
const outDir = path.resolve('output/playwright/shell-qa')
await fs.mkdir(outDir, { recursive: true })

const browser = await chromium.launch({ executablePath: EDGE_PATH, headless: true })

async function captureLogin() {
  const context = await browser.newContext({ viewport: { width: 1440, height: 960 }, locale: 'he-IL' })
  const page = await context.newPage()
  await page.goto('http://127.0.0.1:4173', { waitUntil: 'networkidle' })
  await page.screenshot({ path: path.join(outDir, 'login.png'), fullPage: true })
  const state = await page.evaluate(() => ({
    hasTopbar: Boolean(document.querySelector('.topbar')),
    hasFooter: Boolean(document.querySelector('.app-footer')),
    bodyText: document.body.innerText.slice(0, 600),
  }))
  await context.close()
  return state
}

async function captureSuperAdmin() {
  const authResponse = await fetch('http://127.0.0.1:8787/api/auth/ghost-access', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: '{}',
  })
  if (!authResponse.ok) {
    throw new Error(`ghost-access failed: ${authResponse.status}`)
  }
  const auth = await authResponse.json()
  const context = await browser.newContext({ viewport: { width: 1440, height: 960 }, locale: 'he-IL' })
  await context.addInitScript((payload) => {
    window.sessionStorage.setItem('ghost_auth_session', '1')
    window.sessionStorage.setItem('ghost_access_token', payload.accessToken)
    window.sessionStorage.setItem('ghost_refresh_token', payload.refreshToken)
    window.sessionStorage.setItem('ghost_auth_profile', JSON.stringify(payload.profile))
  }, auth)
  const page = await context.newPage()
  await page.goto('http://127.0.0.1:4173', { waitUntil: 'networkidle' })
  await page.screenshot({ path: path.join(outDir, 'super-admin.png'), fullPage: true })
  const state = await page.evaluate(() => ({
    hasTopbar: Boolean(document.querySelector('.topbar')),
    hasFooter: Boolean(document.querySelector('.app-footer')),
    navItems: Array.from(document.querySelectorAll('.topbar-nav-item')).map((el) => el.textContent?.trim()),
    bodyText: document.body.innerText.slice(0, 800),
  }))
  await context.close()
  return state
}

const report = {
  login: await captureLogin(),
  superAdmin: await captureSuperAdmin(),
  screenshots: {
    login: path.join(outDir, 'login.png'),
    superAdmin: path.join(outDir, 'super-admin.png'),
  },
}

await browser.close()
await fs.writeFile(path.join(outDir, 'report.json'), JSON.stringify(report, null, 2), 'utf8')
console.log(JSON.stringify(report, null, 2))
