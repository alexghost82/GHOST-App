import fs from 'node:fs/promises'
import path from 'node:path'
import { createRequire } from 'node:module'

const OUT_DIR = path.resolve('output/playwright/mobile-chat-clickability-check')
const CLIENT_URL = process.env.CLIENT_URL?.trim() || 'http://127.0.0.1:4173/'
const API_BASE = process.env.API_BASE?.trim() || 'http://127.0.0.1:7722'
const CHROME_PATH =
  process.env.CHROME_PATH?.trim() || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
const FALLBACK_PLAYWRIGHT_PATH =
  process.env.PLAYWRIGHT_MODULE_PATH?.trim() || '/private/tmp/ghost-playwright-qa/node_modules/playwright'

function loadPlaywright() {
  const require = createRequire(import.meta.url)
  try {
    return require('playwright')
  } catch {
    return require(FALLBACK_PLAYWRIGHT_PATH)
  }
}

const { chromium } = loadPlaywright()

async function getSuperSession() {
  const response = await fetch(`${API_BASE}/api/auth/ghost-access`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: '{}',
  })
  if (!response.ok) {
    throw new Error(`ghost-access failed: ${response.status}`)
  }
  return response.json()
}

async function getRegularUserSession() {
  const superAuth = await getSuperSession()
  const lookup = await fetch(`${API_BASE}/api/admin/users`, {
    headers: { Authorization: `Bearer ${superAuth.accessToken}` },
  })

  if (!lookup.ok) {
    return superAuth
  }

  const usersPayload = await lookup.json()
  const users = Array.isArray(usersPayload) ? usersPayload : usersPayload.users ?? []

  for (const username of ['slon', 'test_local_flow_user', 'browser_qa_1777360403']) {
    const target = users.find((user) => user.username === username)
    if (!target) continue

    const response = await fetch(`${API_BASE}/api/auth/impersonate`, {
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

  return superAuth
}

async function setupContext(browser, auth, theme = 'dark') {
  const context = await browser.newContext({
    viewport: { width: 402, height: 873 },
    locale: 'he-IL',
  })

  await context.addInitScript(({ payload, nextTheme }) => {
    window.sessionStorage.setItem('ghost_auth_session', '1')
    window.sessionStorage.setItem('ghost_access_token', payload.accessToken)
    window.sessionStorage.setItem('ghost_refresh_token', payload.refreshToken)
    window.sessionStorage.setItem('ghost_auth_profile', JSON.stringify(payload.profile))
    window.localStorage.setItem('ghost-ui-theme', nextTheme)
  }, { payload: auth, nextTheme: theme })

  return context
}

async function ensureChatView(page) {
  const liveButton = page.getByRole('button', { name: /גוסט\s*לייב/ }).first()
  if (await liveButton.count()) {
    await liveButton.click().catch(() => undefined)
    await page.waitForTimeout(250)
  }

  const chatTab = page.getByRole('button', { name: /צ׳אט|צ'אט/ }).first()
  if (await chatTab.count()) {
    await chatTab.click().catch(() => undefined)
    await page.waitForTimeout(350)
  }
}

async function runCheck() {
  await fs.mkdir(OUT_DIR, { recursive: true })
  const auth = await getRegularUserSession()
  const browser = await chromium.launch({
    executablePath: CHROME_PATH,
    headless: true,
  })
  const context = await setupContext(browser, auth)
  const page = await context.newPage()
  await page.goto(CLIENT_URL, { waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(1800)
  await ensureChatView(page)

  const results = {}

  async function check(name, callback) {
    try {
      results[name] = { ok: true, ...(await callback()) }
    } catch (error) {
      results[name] = { ok: false, error: error instanceof Error ? error.message : String(error) }
    }
  }

  await check('theme_toggle', async () => {
    const button = page.locator('.topbar-theme-toggle-btn').first()
    const before = await page.evaluate(() => document.documentElement.dataset.theme || 'light')
    await button.click()
    await page.waitForTimeout(350)
    const after = await page.evaluate(() => document.documentElement.dataset.theme || 'light')
    return { before, after, changed: before !== after }
  })

  await check('live_tabs', async () => {
    const tabs = page.locator('.live-ops-mobile-tabs .mobile-tab-bar-button')
    const before = await page.locator('.live-ops-mobile-tabs .mobile-tab-bar-button.active').first().innerText()
    await tabs.nth(0).click()
    await page.waitForTimeout(350)
    const after = await page.locator('.live-ops-mobile-tabs .mobile-tab-bar-button.active').first().innerText()
    return { before, after, changed: before !== after }
  })

  await check('bottom_nav', async () => {
    const navButtons = page.locator('.operator-mobile-primary-nav .mobile-tab-bar-button')
    const before = await page.locator('.operator-mobile-primary-nav .mobile-tab-bar-button.active').first().innerText()
    await navButtons.nth(1).click()
    await page.waitForTimeout(350)
    const after = await page.locator('.operator-mobile-primary-nav .mobile-tab-bar-button.active').first().innerText()
    return { before, after, changed: before !== after }
  })

  await check('account_menu', async () => {
    const trigger = page.locator('.account-trigger').first()
    await trigger.click()
    await page.waitForTimeout(350)
    const dropdownVisible = (await page.locator('.account-dropdown').count()) > 0
    return { dropdownVisible }
  })

  await check('composer_buttons', async () => {
    await ensureChatView(page)
    const send = page.locator('.composer-mobile-send-orb').first()
    const emoji = page.locator('.composer-mobile-emoji-orb').first()
    return {
      sendBox: await send.boundingBox(),
      emojiBox: await emoji.boundingBox(),
      sendVisible: await send.isVisible(),
      emojiVisible: await emoji.isVisible(),
    }
  })

  const screenshotPath = path.join(OUT_DIR, 'mobile-clickability-dark.png')
  await page.screenshot({ path: screenshotPath, fullPage: true })

  const report = { screenshotPath, results }
  const reportPath = path.join(OUT_DIR, 'report.json')
  await fs.writeFile(reportPath, JSON.stringify(report, null, 2), 'utf8')
  console.log(JSON.stringify({ reportPath, ...report }, null, 2))

  await browser.close()
}

await runCheck()
