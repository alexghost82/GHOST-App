import fs from 'node:fs/promises'
import path from 'node:path'
import { chromium } from 'playwright'

const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'
const outDir = path.resolve('output/playwright/live-ops-theme-matrix-qa')
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

async function createAuthedContext(browser, viewport, auth) {
  const context = await browser.newContext({ viewport, locale: 'he-IL' })
  await context.addInitScript((payload) => {
    window.sessionStorage.setItem('ghost_auth_session', '1')
    window.sessionStorage.setItem('ghost_access_token', payload.accessToken)
    window.sessionStorage.setItem('ghost_refresh_token', payload.refreshToken)
    window.sessionStorage.setItem('ghost_auth_profile', JSON.stringify(payload.profile))
  }, auth)
  return context
}

function rgbaOf(styleValue) {
  return styleValue?.replace(/\s+/g, ' ').trim() ?? null
}

async function collect(page, label) {
  const screenshot = path.join(outDir, `${label}.png`)
  await page.screenshot({ path: screenshot, fullPage: true })

  const data = await page.evaluate(() => {
    function info(selector) {
      const node = document.querySelector(selector)
      if (!node) return null
      const style = getComputedStyle(node)
      const rect = node.getBoundingClientRect()
      return {
        selector,
        color: style.color,
        backgroundColor: style.backgroundColor,
        backgroundImage: style.backgroundImage,
        borderColor: style.borderColor,
        boxShadow: style.boxShadow,
        top: Math.round(rect.top),
        bottom: Math.round(rect.bottom),
        height: Math.round(rect.height),
      }
    }

    return {
      theme: document.documentElement.dataset.theme ?? 'light',
      viewport: { width: window.innerWidth, height: window.innerHeight },
      shell: info('.app-shell'),
      topbar: info('.topbar'),
      liveTabs: info('.live-ops-mobile-tabs'),
      liveTabsActive: info('.live-ops-mobile-tabs .mobile-tab-bar-button.active'),
      chatHeader: info('.chat-header'),
      chatPanel: info('.chat-panel'),
      composer: info('.composer'),
      composerInput: info('.composer-input-shell'),
      messageBubbleUser: info('.message-row.user .message-bubble'),
      messageBubbleGhost: info('.message-row.ghost .message-bubble, .message-row.system .message-bubble'),
      mobilePrimaryNav: info('.operator-mobile-primary-nav'),
      mobilePrimaryNavActive: info('.operator-mobile-primary-nav .mobile-tab-bar-button.active'),
      footer: info('.app-footer'),
      bodyBg: getComputedStyle(document.body).backgroundColor,
      htmlBg: getComputedStyle(document.documentElement).backgroundColor,
      textSample: document.body.innerText.slice(0, 500),
    }
  })

  return { screenshot, ...data }
}

async function openLiveOps(page, url) {
  await page.goto(url, { waitUntil: 'networkidle' })
  await page.waitForTimeout(900)
}

async function toggleTheme(page) {
  const toggle = page.getByRole('button', { name: /ערכת נושא|נושא/i }).first()
  await toggle.click()
  await page.waitForTimeout(700)
}

async function runScenario(browser, auth, url, name, viewport) {
  const context = await createAuthedContext(browser, viewport, auth)
  const page = await context.newPage()
  await openLiveOps(page, url)
  const light = await collect(page, `${name}-light`)
  await toggleTheme(page)
  const dark = await collect(page, `${name}-dark`)
  await context.close()
  return { light, dark }
}

async function resolveClientUrl() {
  for (const port of [4173, 4174]) {
    try {
      const response = await fetch(`http://127.0.0.1:${port}`, { method: 'GET' })
      if (response.ok) {
        return `http://127.0.0.1:${port}`
      }
    } catch {
      // Try next port.
    }
  }

  throw new Error('No local Vite client responded on ports 4173 or 4174')
}

const auth = await getRegularUserSession()
const clientUrl = await resolveClientUrl()
const browser = await chromium.launch({ executablePath: EDGE_PATH, headless: true })
const report = {
  user: auth.username,
  clientUrl,
  desktop: await runScenario(browser, auth, clientUrl, 'desktop-1440x960', { width: 1440, height: 960 }),
  mobile: await runScenario(browser, auth, clientUrl, 'mobile-390x844', { width: 390, height: 844 }),
}
await browser.close()

const reportPath = path.join(outDir, 'report.json')
await fs.writeFile(reportPath, JSON.stringify(report, null, 2), 'utf8')
console.log(JSON.stringify({ reportPath, ...report }, null, 2))
