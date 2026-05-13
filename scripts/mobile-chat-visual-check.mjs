import fs from 'node:fs/promises'
import path from 'node:path'
import { createRequire } from 'node:module'

const OUT_DIR = path.resolve('output/playwright/mobile-chat-visual-check')
const CLIENT_URL = process.env.CLIENT_URL?.trim() || 'http://127.0.0.1:4173/'
const API_BASE = process.env.API_BASE?.trim() || 'http://127.0.0.1:7722'
const CHROME_PATH =
  process.env.CHROME_PATH?.trim() || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
const FALLBACK_PLAYWRIGHT_PATH =
  process.env.PLAYWRIGHT_MODULE_PATH?.trim() || '/private/tmp/ghost-playwright-qa/node_modules/playwright'
const QA_EMPTY_CHANNEL_NAME = 'Browser QA Empty Channel'

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

async function setupContext(browser, auth, theme) {
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

async function ensureEmptyChannel(auth) {
  const headers = { Authorization: `Bearer ${auth.accessToken}` }

  const lookup = await fetch(`${API_BASE}/api/channels`, { headers })
  if (lookup.ok) {
    const channels = await lookup.json()
    const existing = Array.isArray(channels) ? channels.find((channel) => channel?.name === QA_EMPTY_CHANNEL_NAME) : null
    if (existing?.id) {
      return existing
    }
  }

  const response = await fetch(`${API_BASE}/api/channels`, {
    method: 'POST',
    headers: {
      ...headers,
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      name: QA_EMPTY_CHANNEL_NAME,
      type: 'personal',
      subtitle: 'ערוץ בדיקת דפדפן',
      location: 'QA',
      watchScope: 'QA',
      description: 'ערוץ ריק לבדיקת עיצוב מובייל',
      memoryInterval: 30,
      rtspFeed: 'rtsp://',
      liveState: 'LIVE',
      cameraEnabled: false,
      linkedChannelIds: [],
      members: [QA_EMPTY_CHANNEL_NAME],
    }),
  })

  if (!response.ok) {
    return null
  }

  return response.json()
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

async function preferEmptyChat(page) {
  const chatItems = page.locator('.chat-list-item, .channel-card, .chat-list-entry')
  const total = await chatItems.count().catch(() => 0)
  for (let index = 0; index < total; index += 1) {
    const item = chatItems.nth(index)
    await item.click().catch(() => undefined)
    await page.waitForTimeout(250)
    const hasEmptyState = await page.locator('.chat-empty-state').count().catch(() => 0)
    if (hasEmptyState > 0) {
      return true
    }
  }
  return false
}

async function openChannelByName(page, channelName) {
  if (!channelName) return false

  const inboxTab = page.getByRole('button', { name: /שיחות/ }).first()
  if (await inboxTab.count()) {
    await inboxTab.click().catch(() => undefined)
    await page.waitForTimeout(350)
  }

  const channelButton = page.getByRole('button', { name: new RegExp(channelName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')) }).first()
  if ((await channelButton.count()) === 0) {
    return false
  }

  await channelButton.click().catch(() => undefined)
  await page.waitForTimeout(350)

  const chatTab = page.getByRole('button', { name: /צ׳אט|צ'אט/ }).first()
  if (await chatTab.count()) {
    await chatTab.click().catch(() => undefined)
    await page.waitForTimeout(350)
  }

  return (await page.locator('.chat-empty-state').count().catch(() => 0)) > 0
}

async function collectMetrics(page) {
  return page.evaluate(() => {
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
        scrollWidth: node.scrollWidth,
        clientWidth: node.clientWidth,
        scrollHeight: node.scrollHeight,
        clientHeight: node.clientHeight,
      }
    }

    return {
      body: {
        clientWidth: document.body.clientWidth,
        scrollWidth: document.body.scrollWidth,
        clientHeight: document.body.clientHeight,
        scrollHeight: document.body.scrollHeight,
      },
      shell: rectFor('.operator-mobile-app-shell'),
      surface: rectFor('.app-surface'),
      topbar: rectFor('.topbar'),
      tabs: rectFor('.live-ops-mobile-tabs'),
      chatPanel: rectFor('.chat-panel'),
      emptyState: rectFor('.chat-empty-state'),
      composer: rectFor('.composer-mobile-shell .composer-shell'),
      nav: rectFor('.operator-mobile-primary-nav'),
      footer: rectFor('.app-footer.app-footer-compact-mobile'),
      activePanel: document.querySelector('.app-shell')?.getAttribute('data-mobile-panel') ?? null,
      activeSection: document.querySelector('.app-shell')?.getAttribute('data-mobile-section') ?? null,
      hasHorizontalOverflow: document.documentElement.scrollWidth > window.innerWidth,
      footerFitsViewport: (() => {
        const footer = document.querySelector('.app-footer.app-footer-compact-mobile')
        if (!footer) return null
        return footer.scrollWidth <= footer.clientWidth
      })(),
      bodyText: document.body.innerText.slice(0, 1200),
    }
  })
}

async function main() {
  await fs.mkdir(OUT_DIR, { recursive: true })
  const auth = await getRegularUserSession()
  const qaEmptyChannel = await ensureEmptyChannel(auth)
  const browser = await chromium.launch({
    executablePath: CHROME_PATH,
    headless: true,
  })

  const report = {}

  for (const theme of ['light', 'dark']) {
    const context = await setupContext(browser, auth, theme)
    const page = await context.newPage()
    await page.goto(CLIENT_URL, { waitUntil: 'domcontentloaded' })
    await page.waitForTimeout(1800)
    await ensureChatView(page)
    let emptyStateFound = await preferEmptyChat(page)
    if (!emptyStateFound && qaEmptyChannel?.name) {
      emptyStateFound = await openChannelByName(page, qaEmptyChannel.name)
    }

    const screenshot = path.join(OUT_DIR, `chat-${theme}.png`)
    await page.screenshot({ path: screenshot, fullPage: true })

    report[theme] = {
      screenshot,
      emptyStateFound,
      metrics: await collectMetrics(page),
    }

    await context.close()
  }

  await browser.close()

  const reportPath = path.join(OUT_DIR, 'report.json')
  await fs.writeFile(reportPath, JSON.stringify(report, null, 2), 'utf8')
  console.log(JSON.stringify({ reportPath, ...report }, null, 2))
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
