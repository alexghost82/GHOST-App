import fs from 'node:fs/promises'
import path from 'node:path'
import { chromium } from 'playwright'

const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'
const outDir = path.resolve('output/playwright/mobile-theme-scroll-qa')
await fs.mkdir(outDir, { recursive: true })

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

async function getSuperSession() {
  const response = await fetch('http://127.0.0.1:8787/api/auth/ghost-access', {
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
  const lookup = await fetch('http://127.0.0.1:8787/api/admin/users', {
    headers: { Authorization: `Bearer ${superAuth.accessToken}` },
  })
  if (!lookup.ok) {
    throw new Error(`admin users failed: ${lookup.status}`)
  }

  const usersPayload = await lookup.json()
  const users = Array.isArray(usersPayload) ? usersPayload : usersPayload.users ?? []

  for (const username of ['slon', 'test_local_flow_user', 'browser_qa_1777360403']) {
    const target = users.find((user) => user.username === username)
    if (!target) {
      continue
    }

    const response = await fetch('http://127.0.0.1:8787/api/auth/impersonate', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        Authorization: `Bearer ${superAuth.accessToken}`,
      },
      body: JSON.stringify({ userId: target.id }),
    })

    if (response.ok) {
      const auth = await response.json()
      return { ...auth, username }
    }
  }

  throw new Error('No regular user could be impersonated')
}

async function createContext(browser, auth, theme) {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
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

async function clickByText(page, name) {
  await page.getByRole('button', { name }).first().click()
  await page.waitForTimeout(500)
}

async function collectScreen(page, label, selector) {
  const safeName = label.replace(/[^\p{L}\p{N}_-]+/gu, '-')
  const screenshotPath = path.join(outDir, `${safeName}.png`)
  await page.screenshot({ path: screenshotPath, fullPage: true })

  const data = await page.evaluate((targetSelector) => {
    function getNodeInfo(selector) {
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
        top: Math.round(rect.top),
        height: Math.round(rect.height),
      }
    }

    const node = document.querySelector(targetSelector)
    if (!node) {
      return {
        found: false,
        selector: targetSelector,
        textSample: document.body.innerText.slice(0, 600),
      }
    }

    const beforeTop = node.scrollTop
    node.scrollTop = node.scrollHeight
    const afterTop = node.scrollTop

    return {
      found: true,
      selector: targetSelector,
      scrollTopBefore: beforeTop,
      scrollTopAfter: afterTop,
      clientHeight: node.clientHeight,
      scrollHeight: node.scrollHeight,
      canScroll: afterTop > beforeTop || node.scrollHeight > node.clientHeight,
      shell: getNodeInfo('.app-shell'),
      topbar: getNodeInfo('.topbar'),
      mobileNav: getNodeInfo('.operator-mobile-primary-nav, .sa-mobile-primary-nav'),
      alertsCenter: getNodeInfo('.alerts-center'),
      sectionCard: getNodeInfo('.mobile-surface-card, .sa-card'),
      bodyText: document.body.innerText.slice(0, 1200),
    }
  }, selector)

  return {
    screenshotPath,
    ...data,
  }
}

async function runOperatorScenario(browser, clientUrl, theme) {
  const auth = await getRegularUserSession()
  const context = await createContext(browser, auth, theme)
  const page = await context.newPage()
  await page.goto(clientUrl, { waitUntil: 'networkidle' })
  await page.waitForTimeout(900)

  await clickByText(page, 'התראות')
  const alerts = await collectScreen(page, `operator-alerts-${theme}`, '.operator-mobile-screen')

  await clickByText(page, 'ערוצים')
  const channelsList = await collectScreen(page, `operator-channels-list-${theme}`, '.channels-hub-mobile')

  const firstChannel = page.locator('.chub-row').first()
  if (await firstChannel.count()) {
    await firstChannel.click()
    await page.waitForTimeout(500)
  }
  const channelDetails = await collectScreen(page, `operator-channel-details-${theme}`, '.channels-hub-mobile')

  await context.close()
  return { alerts, channelsList, channelDetails }
}

async function runSuperAdminScenario(browser, clientUrl, theme) {
  const auth = await getSuperSession()
  const context = await createContext(browser, auth, theme)
  const page = await context.newPage()
  await page.goto(clientUrl, { waitUntil: 'networkidle' })
  await page.waitForTimeout(900)

  const overview = await collectScreen(page, `super-admin-overview-${theme}`, '.sa-mobile-shell')

  await clickByText(page, 'עוד')
  const more = await collectScreen(page, `super-admin-more-${theme}`, '.sa-mobile-shell')

  await clickByText(page, 'תקלות')
  const issues = await collectScreen(page, `super-admin-issues-${theme}`, '.sa-mobile-shell')

  await context.close()
  return { overview, more, issues }
}

const clientUrl = await resolveClientUrl()
const browser = await chromium.launch({ executablePath: EDGE_PATH, headless: true })

const report = {
  clientUrl,
  operator: {
    light: await runOperatorScenario(browser, clientUrl, 'light'),
    dark: await runOperatorScenario(browser, clientUrl, 'dark'),
  },
  superAdmin: {
    light: await runSuperAdminScenario(browser, clientUrl, 'light'),
    dark: await runSuperAdminScenario(browser, clientUrl, 'dark'),
  },
}

await browser.close()

const reportPath = path.join(outDir, 'report.json')
await fs.writeFile(reportPath, JSON.stringify(report, null, 2), 'utf8')
console.log(JSON.stringify({ reportPath, ...report }, null, 2))
