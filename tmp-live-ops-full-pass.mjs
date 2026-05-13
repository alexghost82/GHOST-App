import fs from 'node:fs/promises'
import path from 'node:path'
import { chromium } from 'playwright'

const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'
const outDir = path.resolve('output/playwright/live-ops-full-pass')
await fs.mkdir(outDir, { recursive: true })

async function ghostAccess() {
  const response = await fetch('http://127.0.0.1:8787/api/auth/ghost-access', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({}),
  })
  if (!response.ok) throw new Error(`ghost-access failed: ${response.status}`)
  return response.json()
}

async function regularUserSession() {
  const superAuth = await ghostAccess()
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
    if (!response.ok) continue
    return response.json()
  }

  throw new Error('No regular user available for impersonation')
}

async function createContext(browser, { auth = null, theme = 'light', viewport = { width: 1440, height: 960 } } = {}) {
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

async function saveScreenshot(page, name) {
  const target = path.join(outDir, `${name}.png`)
  await page.screenshot({ path: target, fullPage: true })
  return target
}

async function collectChatMetrics(page) {
  return page.evaluate(() => {
    const stream = document.querySelector('.message-stream')
    const live = document.querySelector('.chat-list-location.status-label-live')
    const offline = document.querySelector('.chat-list-location.status-label-offline')
    const userBubble = document.querySelector('.message-row.user .message-bubble')
    const systemBubble = document.querySelector('.message-row.system .message-bubble')
    const searchBar = document.querySelector('.inbox-search-bar')
    const searchShell = document.querySelector('.inbox-search-shell')
    const inboxPanel = document.querySelector('.inbox-panel')
    const closeButton = document.querySelector('.details-panel .close-label-button')

    function rect(node) {
      if (!node) return null
      const r = node.getBoundingClientRect()
      return { x: Math.round(r.x), y: Math.round(r.y), width: Math.round(r.width), height: Math.round(r.height), right: Math.round(r.right) }
    }

    function color(node) {
      if (!node) return null
      const style = getComputedStyle(node)
      return {
        color: style.color,
        background: style.backgroundColor,
        textAlign: style.textAlign,
        display: style.display,
        justifyContent: style.justifyContent,
        alignItems: style.alignItems,
      }
    }

    const streamRect = rect(stream)
    const userRect = rect(userBubble)
    const systemRect = rect(systemBubble)
    const searchBarRect = rect(searchBar)
    const searchShellRect = rect(searchShell)
    const inboxRect = rect(inboxPanel)

    return {
      theme: document.documentElement.dataset.theme,
      liveStatusColor: color(live),
      offlineStatusColor: color(offline),
      userBubble: color(userBubble),
      systemBubble: color(systemBubble),
      userTail: userBubble ? getComputedStyle(userBubble, '::before').content : null,
      systemTail: systemBubble ? getComputedStyle(systemBubble, '::before').content : null,
      userGapRight: streamRect && userRect ? Math.round(streamRect.right - userRect.right) : null,
      systemGapLeft: streamRect && systemRect ? Math.round(systemRect.x - streamRect.x) : null,
      searchBarRect,
      searchShellRect,
      inboxRect,
      searchInsetLeft: inboxRect && searchShellRect ? Math.round(searchShellRect.x - inboxRect.x) : null,
      searchInsetRight: inboxRect && searchShellRect ? Math.round(inboxRect.right - searchShellRect.right) : null,
      closeButton: color(closeButton),
      closeButtonRect: rect(closeButton),
    }
  })
}

async function collectLoginMetrics(page) {
  return page.evaluate(() => {
    const card = document.querySelector('.login-card')
    const submit = document.querySelector('.login-submit')
    const style = card ? getComputedStyle(card) : null
    const submitStyle = submit ? getComputedStyle(submit) : null
    return {
      cardBackground: style?.backgroundColor ?? null,
      cardBorder: style?.borderColor ?? null,
      submitBackground: submitStyle?.backgroundColor ?? null,
      submitColor: submitStyle?.color ?? null,
      submitShadow: submitStyle?.boxShadow ?? null,
    }
  })
}

const browser = await chromium.launch({ executablePath: EDGE_PATH, headless: true })
const superAuth = await ghostAccess()
const regularAuth = await regularUserSession()

const report = {}

// Dashboard dark: Super Admin + Command Center
{
  const context = await createContext(browser, { auth: superAuth, theme: 'dark' })
  const page = await context.newPage()
  await page.goto('http://127.0.0.1:4173', { waitUntil: 'networkidle' })
  await page.waitForTimeout(1200)
  report.superAdminDark = {
    screenshot: await saveScreenshot(page, 'dashboard-super-admin-dark'),
  }

  const ccNav = page.locator('.topbar-nav-item', { hasText: 'Command Center' }).first()
  if (await ccNav.count()) {
    await ccNav.click()
    await page.waitForTimeout(1200)
  }
  report.commandCenterDark = {
    screenshot: await saveScreenshot(page, 'dashboard-command-center-dark'),
  }
  await context.close()
}

// Chat light
{
  const context = await createContext(browser, { auth: regularAuth, theme: 'light' })
  const page = await context.newPage()
  await page.goto('http://127.0.0.1:4173', { waitUntil: 'networkidle' })
  await page.waitForTimeout(1200)
  await page.locator('.title-cluster').first().click()
  await page.waitForTimeout(500)
  report.chatLight = {
    screenshot: await saveScreenshot(page, 'chat-light'),
    metrics: await collectChatMetrics(page),
  }
  await context.close()
}

// Chat dark
{
  const context = await createContext(browser, { auth: regularAuth, theme: 'dark' })
  const page = await context.newPage()
  await page.goto('http://127.0.0.1:4173', { waitUntil: 'networkidle' })
  await page.waitForTimeout(1200)
  await page.locator('.title-cluster').first().click()
  await page.waitForTimeout(500)
  report.chatDark = {
    screenshot: await saveScreenshot(page, 'chat-dark'),
    metrics: await collectChatMetrics(page),
  }
  await context.close()
}

// Login desktop + hover
{
  const context = await createContext(browser, { auth: null, theme: 'dark' })
  const page = await context.newPage()
  await page.goto('http://127.0.0.1:4173', { waitUntil: 'networkidle' })
  await page.waitForTimeout(800)
  report.loginDesktop = {
    screenshot: await saveScreenshot(page, 'login-desktop'),
    metrics: await collectLoginMetrics(page),
  }
  await page.locator('.login-submit').hover()
  await page.waitForTimeout(250)
  report.loginDesktopHover = {
    screenshot: await saveScreenshot(page, 'login-desktop-hover'),
    metrics: await collectLoginMetrics(page),
  }
  await context.close()
}

// Login mobile
{
  const context = await createContext(browser, { auth: null, theme: 'dark', viewport: { width: 390, height: 844 } })
  const page = await context.newPage()
  await page.goto('http://127.0.0.1:4173', { waitUntil: 'networkidle' })
  await page.waitForTimeout(800)
  report.loginMobile = {
    screenshot: await saveScreenshot(page, 'login-mobile'),
    metrics: await collectLoginMetrics(page),
  }
  await context.close()
}

await browser.close()

const reportPath = path.join(outDir, 'report.json')
await fs.writeFile(reportPath, JSON.stringify(report, null, 2), 'utf8')
console.log(JSON.stringify({ reportPath, report }, null, 2))
