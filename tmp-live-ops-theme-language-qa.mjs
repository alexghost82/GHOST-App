import fs from 'node:fs/promises'
import path from 'node:path'
import { chromium } from 'playwright'

const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'
const outDir = path.resolve('output/playwright/live-ops-theme-language-qa')
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

async function createAuthedContext(browser, auth) {
  const context = await browser.newContext({ viewport: { width: 1440, height: 960 }, locale: 'he-IL' })
  await context.addInitScript((payload) => {
    window.sessionStorage.setItem('ghost_auth_session', '1')
    window.sessionStorage.setItem('ghost_access_token', payload.accessToken)
    window.sessionStorage.setItem('ghost_refresh_token', payload.refreshToken)
    window.sessionStorage.setItem('ghost_auth_profile', JSON.stringify(payload.profile))
  }, auth)
  return context
}

async function collect(page, label) {
  const screenshot = path.join(outDir, `${label}.png`)
  await page.screenshot({ path: screenshot, fullPage: true })
  const data = await page.evaluate(() => {
    function colorInfo(selector, node) {
      const style = getComputedStyle(node)
      return {
        selector,
        color: style.color,
        background: style.backgroundColor,
      }
    }

    function rectInfo(selector, node) {
      const rect = node.getBoundingClientRect()
      return {
        selector,
        x: Math.round(rect.x),
        y: Math.round(rect.y),
        width: Math.round(rect.width),
        height: Math.round(rect.height),
      }
    }

    const topbar = document.querySelector('.topbar')
    const inboxTitle = document.querySelector('.inbox-appbar-copy strong')
    const searchInput = document.querySelector('.inbox-search-input')
    const chatTitle = document.querySelector('.title-cluster-text h2')
    const composerTextarea = document.querySelector('.composer textarea')
    const composerShell = document.querySelector('.composer-shell')
    const composerInputShell = document.querySelector('.composer-input-shell')
    const footer = document.querySelector('.app-footer')
    const detailsHeader = document.querySelector('.details-panel .dp-channel-name')
    const detailsMuted = document.querySelector('.details-panel .dp-field dt')
    const detailsValue = document.querySelector('.details-panel .dp-field dd')
    const detailsTag = document.querySelector('.details-panel .dp-tag')
    const detailsEmpty = document.querySelector('.details-panel .dp-empty-hint')
    return {
      theme: document.documentElement.dataset.theme ?? 'light',
      textSample: document.body.innerText.slice(0, 800),
      topbar: topbar ? colorInfo('.topbar', topbar) : null,
      inboxTitle: inboxTitle ? colorInfo('.inbox-appbar-copy strong', inboxTitle) : null,
      searchInput: searchInput ? colorInfo('.inbox-search-input', searchInput) : null,
      chatTitle: chatTitle ? colorInfo('.title-cluster-text h2', chatTitle) : null,
      composer: composerTextarea ? colorInfo('.composer textarea', composerTextarea) : null,
      composerShell: composerShell ? rectInfo('.composer-shell', composerShell) : null,
      composerInputShell: composerInputShell ? rectInfo('.composer-input-shell', composerInputShell) : null,
      composerTextarea: composerTextarea ? rectInfo('.composer textarea', composerTextarea) : null,
      detailsHeader: detailsHeader ? colorInfo('.details-panel .dp-channel-name', detailsHeader) : null,
      detailsMuted: detailsMuted ? colorInfo('.details-panel .dp-field dt', detailsMuted) : null,
      detailsValue: detailsValue ? colorInfo('.details-panel .dp-field dd', detailsValue) : null,
      detailsTag: detailsTag ? colorInfo('.details-panel .dp-tag', detailsTag) : null,
      detailsEmpty: detailsEmpty ? colorInfo('.details-panel .dp-empty-hint', detailsEmpty) : null,
      footer: footer ? colorInfo('.app-footer', footer) : null,
    }
  })
  return { screenshot, ...data }
}

const auth = await getRegularUserSession()
const browser = await chromium.launch({ executablePath: EDGE_PATH, headless: true })
const context = await createAuthedContext(browser, auth)
const page = await context.newPage()
await page.goto('http://127.0.0.1:4173', { waitUntil: 'networkidle' })
await page.waitForTimeout(900)
await page.locator('.title-cluster').first().click()
await page.waitForTimeout(500)

const light = await collect(page, 'light')
await page.getByRole('button', { name: 'מעבר לערכת נושא כהה' }).click()
await page.waitForTimeout(700)
const dark = await collect(page, 'dark')

await browser.close()

const report = { user: auth.username, light, dark }
const reportPath = path.join(outDir, 'report.json')
await fs.writeFile(reportPath, JSON.stringify(report, null, 2), 'utf8')
console.log(JSON.stringify({ reportPath, ...report }, null, 2))
