import fs from 'node:fs/promises'
import path from 'node:path'
import { chromium } from 'playwright'

const baseUrl = process.env.GHOST_QA_BASE_URL || 'http://localhost:8888'
const artifactDir = path.resolve('output/playwright')
const chromePath = 'C:/Program Files/Google/Chrome/Application/chrome.exe'

const report = {
  baseUrl,
  timestamp: new Date().toISOString(),
  runs: [],
}

function pushRun(name, data) {
  report.runs.push({ name, ...data })
}

async function ensureDir(dir) {
  await fs.mkdir(dir, { recursive: true })
}

async function screenshot(page, name) {
  const filePath = path.join(artifactDir, `${name}.png`)
  await page.screenshot({ path: filePath, fullPage: true })
  return filePath
}

function attachObservers(page, bucket) {
  page.on('console', (msg) => {
    bucket.console.push({ type: msg.type(), text: msg.text() })
  })
  page.on('pageerror', (error) => {
    bucket.pageErrors.push(String(error))
  })
  page.on('requestfailed', (request) => {
    bucket.requestFailures.push({
      url: request.url(),
      method: request.method(),
      failure: request.failure()?.errorText ?? 'unknown',
    })
  })
}

async function login(page, username, password) {
  await page.goto(baseUrl, { waitUntil: 'networkidle' })
  await page.locator('#login-user').fill(username)
  await page.locator('#login-passkey').fill(password)
  await page.locator('button[type="submit"]').click()
  await page.waitForLoadState('networkidle')
}

async function clickNavIfPresent(page, label) {
  const navButton = page.getByRole('button', { name: label, exact: true })
  if ((await navButton.count()) === 0) return false
  try {
    await navButton.first().click({ force: true })
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(350)
  } catch {
    return false
  }
  return true
}

async function runOperatorFlow(browser, creds) {
  const context = await browser.newContext({ viewport: { width: 1440, height: 1024 } })
  const page = await context.newPage()
  const bucket = { console: [], pageErrors: [], requestFailures: [] }
  attachObservers(page, bucket)

  const run = {
    viewport: 'desktop-1440',
    screenshots: {},
    navLabels: [],
    issues: [],
    ...bucket,
  }

  await page.goto(baseUrl, { waitUntil: 'networkidle' })
  run.screenshots.login = await screenshot(page, 'login-desktop')

  await login(page, creds.username, creds.password)
  await page.waitForTimeout(800)

  run.navLabels = await page.locator('.topbar-nav-item').allTextContents()
  run.screenshots.overview = await screenshot(page, 'overview-desktop')

  const openedLive = await clickNavIfPresent(page, 'פעילות חיה')
  if (openedLive) {
    run.screenshots.liveOps = await screenshot(page, 'live-ops-desktop')
  } else {
    run.issues.push('Topbar missing Live Ops navigation button')
  }

  const openedChannels = await clickNavIfPresent(page, 'ערוצים')
  if (openedChannels) {
    run.screenshots.channels = await screenshot(page, 'channels-desktop')
  } else {
    run.issues.push('Topbar missing Channels navigation button')
  }

  const openedAlerts = await clickNavIfPresent(page, 'התראות')
  if (openedAlerts) {
    run.screenshots.alerts = await screenshot(page, 'alerts-desktop')
  } else {
    run.issues.push('Topbar missing Alerts navigation button')
  }

  const commandTrigger = page.getByRole('button', { name: /לוח פקודות/ })
  if ((await commandTrigger.count()) > 0) {
    try {
      await commandTrigger.first().click({ force: true })
      await page.waitForTimeout(300)
      run.screenshots.commandPalette = await screenshot(page, 'command-palette-desktop')
      await page.keyboard.press('Escape')
      await page.waitForTimeout(200)
    } catch {
      run.issues.push('Command palette trigger exists but is not safely clickable')
    }
  } else {
    run.issues.push('Command palette trigger not found')
  }

  const alertButton = page.locator('.topbar-icon-btn').filter({ has: page.locator('.notif-badge, svg') }).nth(1)
  if ((await alertButton.count()) > 0) {
    try {
      await alertButton.click({ force: true })
      await page.waitForTimeout(300)
      run.screenshots.alertOverlay = await screenshot(page, 'alerts-overlay-desktop')
      await page.keyboard.press('Escape')
      await page.waitForTimeout(200)
    } catch {
      run.issues.push('Alerts trigger exists but overlay did not open cleanly')
    }
  }

  pushRun('operator-desktop', run)
  await context.close()
}

async function runOperatorMobile(browser, creds) {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
  })
  const page = await context.newPage()
  const bucket = { console: [], pageErrors: [], requestFailures: [] }
  attachObservers(page, bucket)

  const run = {
    viewport: 'mobile-390',
    screenshots: {},
    bottomNavLabels: [],
    issues: [],
    ...bucket,
  }

  await login(page, creds.username, creds.password)
  await page.waitForTimeout(700)
  run.screenshots.overview = await screenshot(page, 'overview-mobile')

  run.bottomNavLabels = await page.locator('.bottom-nav button').allTextContents()
  const liveBtn = page.getByRole('button', { name: /פעילות חיה/ })
  if ((await liveBtn.count()) > 0) {
    try {
      await liveBtn.first().click({ force: true })
      await page.waitForTimeout(350)
      run.screenshots.liveOps = await screenshot(page, 'live-ops-mobile')
    } catch {
      run.issues.push('Mobile navigation button for Live Ops is blocked or outside viewport')
    }
  }

  pushRun('operator-mobile', run)
  await context.close()
}

async function runAdminFlow(browser, creds) {
  const context = await browser.newContext({ viewport: { width: 1440, height: 1024 } })
  const page = await context.newPage()
  const bucket = { console: [], pageErrors: [], requestFailures: [] }
  attachObservers(page, bucket)

  const run = {
    viewport: 'desktop-1440',
    screenshots: {},
    adminTabs: [],
    issues: [],
    ...bucket,
  }

  await login(page, creds.username, creds.password)
  await page.waitForTimeout(1000)
  run.screenshots.adminOverview = await screenshot(page, 'admin-overview-desktop')
  run.adminTabs = await page.locator('.sa-tabs button').allTextContents()

  const usersTab = page.getByRole('button', { name: 'משתמשים', exact: true })
  if ((await usersTab.count()) > 0) {
    try {
      await usersTab.click({ force: true })
      await page.waitForTimeout(350)
      run.screenshots.adminUsers = await screenshot(page, 'admin-users-desktop')
    } catch {
      run.issues.push('Admin Users tab exists but did not open cleanly')
    }
  }

  pushRun('admin-desktop', run)
  await context.close()
}

async function main() {
  await ensureDir(artifactDir)
  const browser = await chromium.launch({
    headless: true,
    executablePath: chromePath,
  })

  try {
    await runOperatorFlow(browser, {
      username: process.env.GHOST_QA_OPERATOR_USER,
      password: process.env.GHOST_QA_OPERATOR_PASS,
    })
    await runOperatorMobile(browser, {
      username: process.env.GHOST_QA_OPERATOR_USER,
      password: process.env.GHOST_QA_OPERATOR_PASS,
    })
    await runAdminFlow(browser, {
      username: process.env.GHOST_QA_ADMIN_USER,
      password: process.env.GHOST_QA_ADMIN_PASS,
    })
  } finally {
    await browser.close()
  }

  const reportPath = path.join(artifactDir, 'ghost-browser-qa-report.json')
  await fs.writeFile(reportPath, JSON.stringify(report, null, 2), 'utf8')
  console.log(reportPath)
}

await main()
