import fs from 'node:fs/promises'
import path from 'node:path'
import { chromium } from 'playwright'

const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'
const outDir = path.resolve('output/playwright/live-ops-qa-current')
await fs.mkdir(outDir, { recursive: true })

const authResponse = await fetch('http://127.0.0.1:8787/api/auth/ghost-access', {
  method: 'POST',
  headers: { 'content-type': 'application/json' },
  body: '{}',
})

if (!authResponse.ok) {
  throw new Error(`ghost-access failed: ${authResponse.status}`)
}

const auth = await authResponse.json()
const browser = await chromium.launch({ executablePath: EDGE_PATH, headless: true })
const context = await browser.newContext({ viewport: { width: 1440, height: 960 }, locale: 'he-IL' })

await context.addInitScript((payload) => {
  window.sessionStorage.setItem('ghost_auth_session', '1')
  window.sessionStorage.setItem('ghost_access_token', payload.accessToken)
  window.sessionStorage.setItem('ghost_refresh_token', payload.refreshToken)
  window.sessionStorage.setItem('ghost_auth_profile', JSON.stringify(payload.profile))
}, auth)

const page = await context.newPage()
const report = { url: 'http://127.0.0.1:4173?view=live', issues: [], screenshots: {} }

await page.goto('http://127.0.0.1:4173?view=live', { waitUntil: 'networkidle' })
await page.screenshot({ path: path.join(outDir, 'live-ops-precheck.png'), fullPage: true })
report.screenshots.precheck = path.join(outDir, 'live-ops-precheck.png')
report.precheck = await page.evaluate(() => ({
  title: document.title,
  bodyText: document.body.innerText.slice(0, 2000),
  activeSurface: document.body.dataset.activeSurface ?? null,
  hasLoginForm: Boolean(document.querySelector('#login-user')),
  hasTopbar: Boolean(document.querySelector('.topbar')),
  navItems: Array.from(document.querySelectorAll('.topbar-nav-item')).map((el) => el.textContent?.trim()),
}))

const liveNav = page.locator('.topbar-nav-item').filter({ hasText: 'Ghost Live' })
if (await liveNav.count()) {
  await liveNav.first().click()
  await page.waitForLoadState('networkidle')
  await page.waitForTimeout(400)
}

await page.locator('.chat-list-item').first().waitFor({ state: 'visible', timeout: 30000 })
await page.screenshot({ path: path.join(outDir, 'live-ops-initial.png'), fullPage: true })
report.screenshots.initial = path.join(outDir, 'live-ops-initial.png')

report.liveOpsSignals = await page.evaluate(() => ({
  hasWorkspaceHeader: Boolean(document.querySelector('.workspace-header') && getComputedStyle(document.querySelector('.workspace-header')).display !== 'none'),
  hasContextStrip: Boolean(document.querySelector('.chat-context-strip') && getComputedStyle(document.querySelector('.chat-context-strip')).display !== 'none'),
  hasComposerSuggestions: Boolean(document.querySelector('.composer-suggestions') && getComputedStyle(document.querySelector('.composer-suggestions')).display !== 'none'),
  hasRail: Boolean(document.querySelector('.messenger-sidebar-rail') && getComputedStyle(document.querySelector('.messenger-sidebar-rail')).display !== 'none'),
  inboxTitle: document.querySelector('.inbox-appbar h2')?.textContent?.trim() ?? null,
  primaryFilters: Array.from(document.querySelectorAll('.inbox-filter-row-primary .inbox-filter-chip')).map((el) => el.textContent?.trim()),
  secondaryFilters: Array.from(document.querySelectorAll('.inbox-filter-row-secondary .inbox-filter-chip')).map((el) => el.textContent?.trim()),
  opsButtonText: document.querySelector('.chat-header-utility .messenger-icon-button')?.textContent?.trim() ?? null,
}))

if (report.liveOpsSignals.hasWorkspaceHeader) report.issues.push('workspace-header still visible')
if (report.liveOpsSignals.hasContextStrip) report.issues.push('chat-context-strip still visible')
if (report.liveOpsSignals.hasComposerSuggestions) report.issues.push('composer-suggestions still visible')
if (report.liveOpsSignals.hasRail) report.issues.push('sidebar rail still visible')

await page.locator('.chat-list-item').first().click()
await page.waitForTimeout(300)
await page.screenshot({ path: path.join(outDir, 'live-ops-selected-chat.png'), fullPage: true })
report.screenshots.selectedChat = path.join(outDir, 'live-ops-selected-chat.png')

await page.locator('.title-cluster').first().click()
await page.waitForTimeout(300)
await page.screenshot({ path: path.join(outDir, 'live-ops-details-open.png'), fullPage: true })
report.screenshots.detailsOpen = path.join(outDir, 'live-ops-details-open.png')

report.drawerSignals = await page.evaluate(() => ({
  detailsVisible: Boolean(document.querySelector('.details-panel') && getComputedStyle(document.querySelector('.details-panel')).display !== 'none'),
  hasChannelsCta: Boolean(Array.from(document.querySelectorAll('.details-panel button')).some((el) => (el.textContent ?? '').includes('ערוצים'))),
}))

if (report.drawerSignals.hasChannelsCta) report.issues.push('details drawer still has channels CTA')

await browser.close()
await fs.writeFile(path.join(outDir, 'report.json'), JSON.stringify(report, null, 2), 'utf8')
console.log(JSON.stringify(report, null, 2))
