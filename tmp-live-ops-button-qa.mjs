import fs from 'node:fs/promises'
import path from 'node:path'
import { chromium } from 'playwright'

const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'
const outDir = path.resolve('output/playwright/live-ops-button-qa')
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
  const context = await browser.newContext({
    viewport: { width: 1440, height: 960 },
    locale: 'he-IL',
  })
  await context.addInitScript((payload) => {
    window.sessionStorage.setItem('ghost_auth_session', '1')
    window.sessionStorage.setItem('ghost_access_token', payload.accessToken)
    window.sessionStorage.setItem('ghost_refresh_token', payload.refreshToken)
    window.sessionStorage.setItem('ghost_auth_profile', JSON.stringify(payload.profile))
  }, auth)
  return context
}

async function persistReport(report) {
  const reportPath = path.join(outDir, 'report.json')
  await fs.writeFile(reportPath, JSON.stringify(report, null, 2), 'utf8')
}

async function openLiveOps(page) {
  await page.goto('http://127.0.0.1:4173', { waitUntil: 'networkidle' })
  await page.waitForTimeout(1000)
}

async function ensureGhostLive(page) {
  await closeDialogs(page)
  const liveButton = page.getByRole('button', { name: 'Ghost Live' })
  if (await liveButton.count()) {
    await liveButton.first().click()
    await page.waitForTimeout(500)
  }
  await page.getByRole('button', { name: 'New chat' }).waitFor({ state: 'visible' })
}

async function closeDialogs(page) {
  await page.keyboard.press('Escape').catch(() => undefined)
  await page.waitForTimeout(250)
  const overlay = page.locator('.brand-modal-overlay.command-surface-overlay')
  if (await overlay.count()) {
    await overlay.first().click({ position: { x: 8, y: 8 } }).catch(() => undefined)
    await page.waitForTimeout(250)
  }

  const dialogCloseButton = page.locator('.surface-dialog .ghost-button').first()
  if (await dialogCloseButton.count()) {
    await dialogCloseButton.click().catch(() => undefined)
    await page.waitForTimeout(250)
  }

  const detailsCloseButton = page.locator('.details-panel .ghost-button', { hasText: 'Close' }).first()
  if (await detailsCloseButton.count()) {
    await detailsCloseButton.click().catch(() => undefined)
    await page.waitForTimeout(250)
  }
}

async function recordScreenshot(page, name) {
  const screenshotPath = path.join(outDir, `${name}.png`)
  await page.screenshot({ path: screenshotPath, fullPage: true })
  return screenshotPath
}

async function runAction(report, name, action) {
  try {
    const details = await action()
    report.actions.push({ name, ok: true, details })
  } catch (error) {
    report.actions.push({ name, ok: false, error: error instanceof Error ? error.message : String(error) })
    report.issues.push(`${name}: ${error instanceof Error ? error.message : String(error)}`)
  }
  await persistReport(report)
}

const auth = await getRegularUserSession()
const browser = await chromium.launch({ executablePath: EDGE_PATH, headless: true })
const context = await createAuthedContext(browser, auth)
const page = await context.newPage()
page.setDefaultTimeout(7000)

const report = {
  user: auth.username,
  url: 'http://127.0.0.1:4173',
  actions: [],
  issues: [],
  screenshots: {},
}

await openLiveOps(page)
report.screenshots.initial = await recordScreenshot(page, 'initial')
await persistReport(report)

await runAction(report, 'inbox:new-chat', async () => {
  await ensureGhostLive(page)
  await closeDialogs(page)
  await page.getByRole('button', { name: 'New chat' }).click()
  await page.waitForTimeout(500)
  const activeNav = await page.locator('.topbar-nav-item.active').first().textContent()
  if (!activeNav?.includes('Command Center')) {
    throw new Error(`expected Command Center nav after click, got ${activeNav ?? 'none'}`)
  }
  report.screenshots.newChat = await recordScreenshot(page, 'new-chat')
  return { activeNav }
})

await runAction(report, 'inbox:more-options', async () => {
  await ensureGhostLive(page)
  await closeDialogs(page)
  await page.getByRole('button', { name: 'More options' }).click()
  await page.waitForTimeout(400)
  const dialogTitle = await page.locator('.surface-dialog h3').first().textContent()
  if (!dialogTitle?.includes('Command palette')) {
    throw new Error(`expected Command palette dialog, got ${dialogTitle ?? 'none'}`)
  }
  report.screenshots.moreOptions = await recordScreenshot(page, 'more-options')
  await closeDialogs(page)
  return { dialogTitle }
})

await runAction(report, 'inbox:select-second-chat', async () => {
  await ensureGhostLive(page)
  const chatItems = page.locator('.chat-list-item')
  const count = await chatItems.count()
  if (count < 2) {
    throw new Error(`expected at least 2 chats, got ${count}`)
  }
  const beforeTitle = (await page.locator('.title-cluster h2').first().textContent())?.trim()
  let targetIndex = -1
  let targetTitle = null
  for (let index = 0; index < count; index += 1) {
    const candidateTitle = (await chatItems.nth(index).locator('strong').first().textContent())?.trim() ?? null
    if (candidateTitle && candidateTitle !== beforeTitle) {
      targetIndex = index
      targetTitle = candidateTitle
      break
    }
  }
  if (targetIndex === -1 || !targetTitle) {
    throw new Error('could not find a different chat to select')
  }
  await chatItems.nth(targetIndex).click()
  await page.waitForTimeout(500)
  const afterTitle = (await page.locator('.title-cluster h2').first().textContent())?.trim()
  if (afterTitle !== targetTitle || beforeTitle === afterTitle) {
    throw new Error(`expected chat title to change to ${targetTitle ?? 'unknown'}, got ${afterTitle ?? 'none'}`)
  }
  report.screenshots.selectSecondChat = await recordScreenshot(page, 'select-second-chat')
  return { beforeTitle, afterTitle, targetTitle, targetIndex }
})

await runAction(report, 'chat:open-details-from-title', async () => {
  await ensureGhostLive(page)
  await closeDialogs(page)
  await page.locator('.title-cluster').first().click()
  await page.waitForTimeout(450)
  const header = await page.locator('.messenger-details-header strong').first().textContent()
  const isVisible = await page.locator('.details-panel.drawer-open').count()
  if (!isVisible || !header?.includes('Contact info')) {
    throw new Error(`expected details panel to open, got header ${header ?? 'none'}`)
  }
  report.screenshots.detailsFromTitle = await recordScreenshot(page, 'details-from-title')
  return { header }
})

await runAction(report, 'details:close', async () => {
  const closeButton = page.locator('.details-panel .ghost-button', { hasText: 'Close' })
  if (!(await closeButton.count())) {
    throw new Error('close button not found in details panel')
  }
  await closeButton.first().click()
  await page.waitForTimeout(350)
  const openCount = await page.locator('.details-panel.drawer-open').count()
  if (openCount > 0) {
    throw new Error('details panel stayed open after Close')
  }
  return { openCount }
})

await runAction(report, 'chat:search-button', async () => {
  await ensureGhostLive(page)
  await page.getByRole('button', { name: 'Search in chat' }).click()
  await page.waitForTimeout(350)
  const focusedPlaceholder = await page.evaluate(() => {
    const active = document.activeElement
    return active instanceof HTMLInputElement ? active.placeholder : null
  })
  if (focusedPlaceholder !== 'Search or start new chat') {
    throw new Error(`expected inbox search input focus, got ${focusedPlaceholder ?? 'none'}`)
  }
  return { focusedPlaceholder }
})

await runAction(report, 'chat:details-button', async () => {
  await ensureGhostLive(page)
  await closeDialogs(page)
  await page.locator('.chat-header-utility .messenger-icon-button').nth(1).click()
  await page.waitForTimeout(350)
  const isOpen = await page.locator('.details-panel.drawer-open').count()
  if (!isOpen) {
    throw new Error('details panel did not open from details button')
  }
  return { isOpen }
})

await runAction(report, 'details:manage', async () => {
  const manageButton = page.locator('.details-panel button', { hasText: 'Manage' })
  if (!(await manageButton.count())) {
    throw new Error('Manage button not found')
  }
  await manageButton.first().click()
  await page.waitForTimeout(500)
  const activeNav = await page.locator('.topbar-nav-item.active').first().textContent()
  if (!activeNav?.includes('Command Center')) {
    throw new Error(`expected Command Center after Manage, got ${activeNav ?? 'none'}`)
  }
  report.screenshots.manage = await recordScreenshot(page, 'details-manage')
  return { activeNav }
})

await runAction(report, 'details:operation-toggle', async () => {
  await ensureGhostLive(page)
  const chatItems = page.locator('.chat-list-item')
  const count = await chatItems.count()
  let selectedTitle = null

  for (let index = 0; index < count; index += 1) {
    await chatItems.nth(index).click()
    await page.waitForTimeout(300)
    selectedTitle = (await page.locator('.title-cluster h2').first().textContent())?.trim() ?? null
    await page.locator('.title-cluster').first().click()
    await page.waitForTimeout(300)
    const toggleCount = await page.locator('.details-panel .operation-toggle').count()
    if (toggleCount > 0) {
      const toggle = page.locator('.details-panel .operation-toggle').first()
      const before = await toggle.evaluate((node) => node.className)
      await toggle.click()
      await page.waitForTimeout(500)
      const after = await toggle.evaluate((node) => node.className)
      if (before === after) {
        throw new Error('operation toggle class did not change after click')
      }
      report.screenshots.operationToggle = await recordScreenshot(page, 'operation-toggle')
      return { before, after, selectedTitle, targetIndex: index }
    }
    await closeDialogs(page)
  }

  return { skipped: 'no operation toggle rendered in visible chats', selectedTitle }
})

await runAction(report, 'composer:emoji', async () => {
  await ensureGhostLive(page)
  await closeDialogs(page)
  const textarea = page.locator('#live-ops-composer')
  await textarea.fill('')
  await page.getByRole('button', { name: 'Emoji' }).click()
  await page.waitForTimeout(150)
  const value = await textarea.inputValue()
  if (!value.includes('🙂')) {
    throw new Error(`expected emoji in composer, got "${value}"`)
  }
  return { value }
})

await runAction(report, 'composer:attach', async () => {
  await ensureGhostLive(page)
  await closeDialogs(page)
  const textarea = page.locator('#live-ops-composer')
  await textarea.fill('')
  await page.getByRole('button', { name: 'Attach' }).click()
  await page.waitForTimeout(200)
  const value = await textarea.inputValue()
  if (!value.includes('Analyze the latest camera frame')) {
    throw new Error(`expected attach prompt in composer, got "${value}"`)
  }
  return { value }
})

await runAction(report, 'composer:send', async () => {
  await ensureGhostLive(page)
  await closeDialogs(page)
  const textarea = page.locator('#live-ops-composer')
  const text = `Button QA ${Date.now()}`
  await textarea.fill(text)
  await page.getByRole('button', { name: 'Send message' }).click()
  await page.waitForTimeout(1200)
  const messageExists = await page.locator('.message-row').filter({ hasText: text }).count()
  const draftValue = await textarea.inputValue()
  if (!messageExists) {
    throw new Error('sent message did not appear in message stream')
  }
  if (draftValue.trim()) {
    throw new Error(`composer draft was not cleared after send: "${draftValue}"`)
  }
  report.screenshots.send = await recordScreenshot(page, 'composer-send')
  return { text, messageExists, draftValue }
})

await browser.close()
await persistReport(report)
console.log(JSON.stringify({ reportPath: path.join(outDir, 'report.json'), ...report }, null, 2))
