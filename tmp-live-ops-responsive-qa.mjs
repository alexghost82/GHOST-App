import fs from 'node:fs/promises'
import path from 'node:path'
import { chromium } from 'playwright'

const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'
const outDir = path.resolve('output/playwright/live-ops-responsive-qa')
await fs.mkdir(outDir, { recursive: true })

async function getRegularUserSession() {
  const superResponse = await fetch('http://127.0.0.1:8787/api/auth/ghost-access', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: '{}',
  })
  if (!superResponse.ok) throw new Error(`ghost-access failed: ${superResponse.status}`)
  const superAuth = await superResponse.json()

  const dbUsers = ['slon', 'test_local_flow_user', 'browser_qa_1777360403']
  const lookup = await fetch('http://127.0.0.1:8787/api/admin/users', {
    headers: { Authorization: `Bearer ${superAuth.accessToken}` },
  })
  if (!lookup.ok) throw new Error(`admin users failed: ${lookup.status}`)
  const usersPayload = await lookup.json()
  const users = Array.isArray(usersPayload) ? usersPayload : usersPayload.users ?? []

  for (const username of dbUsers) {
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

async function captureScenario(browser, auth, name, viewport) {
  const context = await createAuthedContext(browser, viewport, auth)
  const page = await context.newPage()
  await page.goto('http://127.0.0.1:4173', { waitUntil: 'networkidle' })
  await page.waitForTimeout(900)

  const screenshot = path.join(outDir, `${name}.png`)
  await page.screenshot({ path: screenshot, fullPage: true })

  const metrics = await page.evaluate(() => {
    function rectFor(selector) {
      const node = document.querySelector(selector)
      if (!node) return null
      const rect = node.getBoundingClientRect()
      const style = getComputedStyle(node)
      return {
        selector,
        display: style.display,
        width: Math.round(rect.width),
        height: Math.round(rect.height),
        top: Math.round(rect.top),
        left: Math.round(rect.left),
        right: Math.round(rect.right),
        bottom: Math.round(rect.bottom),
      }
    }

    return {
      viewport: { width: window.innerWidth, height: window.innerHeight },
      activeSurface: document.body.dataset.activeSurface ?? null,
      topbar: rectFor('.topbar'),
      workspace: rectFor('.workspace'),
      footer: rectFor('.app-footer'),
      inbox: rectFor('.inbox-panel'),
      chat: rectFor('.chat-panel'),
      details: rectFor('.details-panel'),
      bottomNav: rectFor('.bottom-nav'),
      shell: rectFor('.app-surface'),
      bodyScrollWidth: document.body.scrollWidth,
      bodyClientWidth: document.body.clientWidth,
      bodyScrollHeight: document.body.scrollHeight,
      bodyClientHeight: document.body.clientHeight,
      activePanel: document.querySelector('.app-shell')?.getAttribute('data-mobile-panel') ?? null,
      textSample: document.body.innerText.slice(0, 700),
    }
  })

  await context.close()
  return { screenshot, metrics }
}

const auth = await getRegularUserSession()
const browser = await chromium.launch({ executablePath: EDGE_PATH, headless: true })
const report = {
  user: auth.username,
  desktop: await captureScenario(browser, auth, 'desktop-1440x960', { width: 1440, height: 960 }),
  mobile: await captureScenario(browser, auth, 'mobile-390x844', { width: 390, height: 844 }),
}
await browser.close()

const reportPath = path.join(outDir, 'report.json')
await fs.writeFile(reportPath, JSON.stringify(report, null, 2), 'utf8')
console.log(JSON.stringify({ reportPath, ...report }, null, 2))
