import fs from 'node:fs/promises'
import path from 'node:path'
import { chromium } from 'playwright'

const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'
const outDir = path.resolve('output/playwright/regular-user-live-ops-qa')
await fs.mkdir(outDir, { recursive: true })

const browser = await chromium.launch({ executablePath: EDGE_PATH, headless: true })
const context = await browser.newContext({ viewport: { width: 1440, height: 960 }, locale: 'he-IL' })
const page = await context.newPage()

const report = { url: 'http://127.0.0.1:4173', issues: [], screenshots: {} }

await page.goto('http://127.0.0.1:4173', { waitUntil: 'networkidle' })
await page.locator('#login-user').fill('system_manager')
await page.locator('#login-passkey').fill('system_manager_123')
await page.locator('button[type="submit"]').click()
await page.waitForLoadState('networkidle')
await page.waitForTimeout(600)

await page.screenshot({ path: path.join(outDir, 'after-login.png'), fullPage: true })
report.screenshots.afterLogin = path.join(outDir, 'after-login.png')

report.state = await page.evaluate(() => ({
  activeSurface: document.body.dataset.activeSurface ?? null,
  title: document.title,
  hasChatListItem: Boolean(document.querySelector('.chat-list-item')),
  inboxTitle: document.querySelector('.inbox-appbar h2')?.textContent?.trim() ?? null,
  navItems: Array.from(document.querySelectorAll('.topbar-nav-item')).map((el) => el.textContent?.trim()),
  hasWorkspaceHeader: Boolean(document.querySelector('.workspace-header') && getComputedStyle(document.querySelector('.workspace-header')).display !== 'none'),
  hasContextStrip: Boolean(document.querySelector('.chat-context-strip') && getComputedStyle(document.querySelector('.chat-context-strip')).display !== 'none'),
}))

if (report.state.activeSurface !== 'live-ops') report.issues.push(`expected live-ops, got ${report.state.activeSurface}`)
if (!report.state.hasChatListItem) report.issues.push('chat list item missing after regular-user login')
if (report.state.hasWorkspaceHeader) report.issues.push('workspace-header still visible')
if (report.state.hasContextStrip) report.issues.push('chat-context-strip still visible')

await browser.close()
await fs.writeFile(path.join(outDir, 'report.json'), JSON.stringify(report, null, 2), 'utf8')
console.log(JSON.stringify(report, null, 2))
