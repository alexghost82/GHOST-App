import fs from 'node:fs/promises'
import path from 'node:path'
import { chromium } from 'playwright'

const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'
const outDir = path.resolve('output/playwright/dashboard-login-pass')
await fs.mkdir(outDir, { recursive: true })

async function createContext(browser, { auth = null, theme = 'dark', viewport = { width: 1440, height: 960 } } = {}) {
  const context = await browser.newContext({ viewport, locale: 'he-IL' })
  await context.addInitScript(
    ({ authPayload, themeMode }) => {
      window.localStorage.setItem('ghost-ui-theme', themeMode)
      document.documentElement.dataset.theme = themeMode
      document.documentElement.style.colorScheme = themeMode
      if (authPayload) {
        window.sessionStorage.setItem('ghost_auth_session', '1')
        window.sessionStorage.setItem('ghost_access_token', authPayload.accessToken)
        window.sessionStorage.setItem('ghost_refresh_token', authPayload.refreshToken)
        window.sessionStorage.setItem('ghost_auth_profile', JSON.stringify(authPayload.profile))
      } else {
        window.sessionStorage.clear()
      }
    },
    { authPayload: auth, themeMode: theme },
  )
  return context
}

async function screenshot(page, name) {
  const target = path.join(outDir, `${name}.png`)
  await page.screenshot({ path: target, fullPage: true })
  return target
}

async function collectButtonStyles(page, selector) {
  return page.evaluate((sel) => {
    const node = document.querySelector(sel)
    if (!node) return null
    const style = getComputedStyle(node)
    return {
      color: style.color,
      background: style.backgroundColor,
      boxShadow: style.boxShadow,
      borderColor: style.borderColor,
    }
  }, selector)
}

const browser = await chromium.launch({ executablePath: EDGE_PATH, headless: true })
const report = {}

{
  const context = await createContext(browser, { auth: null, theme: 'dark' })
  const page = await context.newPage()
  await page.goto('http://127.0.0.1:4173', { waitUntil: 'networkidle' })
  await page.keyboard.down('g')
  await page.keyboard.down('a')
  await page.keyboard.down('p')
  await page.waitForTimeout(300)
  await page.keyboard.up('p')
  await page.keyboard.up('a')
  await page.keyboard.up('g')
  await page.waitForTimeout(1800)
  report.superAdminDark = { screenshot: await screenshot(page, 'super-admin-dark') }
  const nav = page.locator('.topbar-nav-item', { hasText: 'Command Center' }).first()
  if (await nav.count()) {
    await nav.click()
    await page.waitForTimeout(1200)
  }
  report.commandCenterDark = { screenshot: await screenshot(page, 'command-center-dark') }
  await context.close()
}

{
  const context = await createContext(browser, { auth: null, theme: 'dark' })
  const page = await context.newPage()
  await page.goto('http://127.0.0.1:4173', { waitUntil: 'networkidle' })
  await page.waitForTimeout(900)
  report.loginDesktop = {
    screenshot: await screenshot(page, 'login-desktop'),
    beforeHover: await collectButtonStyles(page, '.login-submit'),
  }
  await page.locator('.login-submit').hover()
  await page.waitForTimeout(250)
  report.loginDesktopHover = {
    screenshot: await screenshot(page, 'login-desktop-hover'),
    afterHover: await collectButtonStyles(page, '.login-submit'),
  }
  await context.close()
}

{
  const context = await createContext(browser, { auth: null, theme: 'dark', viewport: { width: 390, height: 844 } })
  const page = await context.newPage()
  await page.goto('http://127.0.0.1:4173', { waitUntil: 'networkidle' })
  await page.waitForTimeout(900)
  report.loginMobile = { screenshot: await screenshot(page, 'login-mobile') }
  await context.close()
}

await browser.close()
const reportPath = path.join(outDir, 'report.json')
await fs.writeFile(reportPath, JSON.stringify(report, null, 2), 'utf8')
console.log(JSON.stringify({ reportPath, report }, null, 2))
