import fs from 'node:fs/promises'
import path from 'node:path'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)

function loadPlaywright() {
  try {
    return require('playwright')
  } catch {
    return require('/private/tmp/ghost-playwright-qa/node_modules/playwright')
  }
}

const { chromium } = loadPlaywright()

const OUT_DIR = path.resolve('output/playwright/manual-mobile-qa-pass')
const CLIENT_URL = 'http://127.0.0.1:4173/'
const API_BASE = 'http://127.0.0.1:7722'
const CHROME_PATH = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'

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

async function setupContext(browser, auth, theme) {
  const context = await browser.newContext({
    viewport: { width: 402, height: 873 },
    locale: 'he-IL',
  })

  await context.addInitScript(({ payload, nextTheme }) => {
    window.localStorage.setItem('ghost-ui-theme', nextTheme)
    if (payload) {
      window.sessionStorage.setItem('ghost_auth_session', '1')
      window.sessionStorage.setItem('ghost_access_token', payload.accessToken)
      window.sessionStorage.setItem('ghost_refresh_token', payload.refreshToken)
      window.sessionStorage.setItem('ghost_auth_profile', JSON.stringify(payload.profile))
    }
  }, { payload: auth, nextTheme: theme })

  return context
}

async function clickButton(page, namePattern) {
  const button = page.getByRole('button', { name: namePattern }).first()
  if (await button.count()) {
    await button.click().catch(() => undefined)
    await page.waitForTimeout(500)
    return true
  }
  return false
}

async function capture(page, name, selector) {
  const screenshot = path.join(OUT_DIR, `${name}.png`)
  await page.screenshot({ path: screenshot, fullPage: true })

  const metrics = await page.evaluate((targetSelector) => {
    function inspect(selector) {
      const node = document.querySelector(selector)
      if (!node) return null
      const rect = node.getBoundingClientRect()
      const style = getComputedStyle(node)
      return {
        selector,
        width: Math.round(rect.width),
        height: Math.round(rect.height),
        top: Math.round(rect.top),
        left: Math.round(rect.left),
        backgroundImage: style.backgroundImage,
        backgroundColor: style.backgroundColor,
        borderColor: style.borderColor,
        color: style.color,
      }
    }

    return {
      target: inspect(targetSelector),
      topbar: inspect('.topbar'),
      nav: inspect('.operator-mobile-primary-nav, .sa-mobile-primary-nav'),
      prominentCard: inspect('.login-card, .chat-empty-state, .mobile-surface-card, .sa-card'),
      bodyText: document.body.innerText.slice(0, 1000),
    }
  }, selector)

  return { screenshot, metrics }
}

async function runLogin(browser, theme) {
  const context = await setupContext(browser, null, theme)
  const page = await context.newPage()
  await page.goto(CLIENT_URL, { waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(1400)
  const result = await capture(page, `login-${theme}`, '.login-card')
  await context.close()
  return result
}

async function runOperator(browser, theme) {
  const auth = await getRegularUserSession()
  const context = await setupContext(browser, auth, theme)
  const page = await context.newPage()
  await page.goto(CLIENT_URL, { waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(1800)

  await clickButton(page, /גוסט\s*לייב/)
  const live = await capture(page, `operator-live-${theme}`, '.operator-mobile-app-shell')

  await clickButton(page, /התראות/)
  const alerts = await capture(page, `operator-alerts-${theme}`, '.operator-mobile-screen')

  await clickButton(page, /חשבון/)
  const account = await capture(page, `operator-account-${theme}`, '.operator-mobile-screen')

  await context.close()
  return { live, alerts, account }
}

async function runSuperAdmin(browser, theme) {
  const auth = await getSuperSession()
  const context = await setupContext(browser, auth, theme)
  const page = await context.newPage()
  await page.goto(CLIENT_URL, { waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(1800)

  const overview = await capture(page, `super-admin-overview-${theme}`, '.sa-mobile-shell')
  await clickButton(page, /עוד/)
  const more = await capture(page, `super-admin-more-${theme}`, '.sa-mobile-shell')

  await context.close()
  return { overview, more }
}

async function main() {
  await fs.mkdir(OUT_DIR, { recursive: true })

  const browser = await chromium.launch({
    executablePath: CHROME_PATH,
    headless: true,
  })

  try {
    const report = {
      clientUrl: CLIENT_URL,
      apiBase: API_BASE,
      light: {
        login: await runLogin(browser, 'light'),
        operator: await runOperator(browser, 'light'),
        superAdmin: await runSuperAdmin(browser, 'light'),
      },
      dark: {
        login: await runLogin(browser, 'dark'),
        operator: await runOperator(browser, 'dark'),
        superAdmin: await runSuperAdmin(browser, 'dark'),
      },
    }

    const reportPath = path.join(OUT_DIR, 'report.json')
    await fs.writeFile(reportPath, JSON.stringify(report, null, 2), 'utf8')
    console.log(JSON.stringify({ reportPath, report }, null, 2))
  } finally {
    await browser.close().catch(() => undefined)
  }
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
