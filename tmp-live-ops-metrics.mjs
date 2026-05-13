import { chromium } from 'playwright'

const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'
const auth = await fetch('http://127.0.0.1:8787/api/auth/ghost-access', {
  method: 'POST',
  headers: { 'content-type': 'application/json' },
  body: '{}',
}).then((response) => response.json())

const browser = await chromium.launch({ executablePath: EDGE_PATH, headless: true })
const context = await browser.newContext({ viewport: { width: 1600, height: 1000 }, locale: 'he-IL' })

await context.addInitScript((payload) => {
  window.sessionStorage.setItem('ghost_auth_session', '1')
  window.sessionStorage.setItem('ghost_access_token', payload.accessToken)
  window.sessionStorage.setItem('ghost_refresh_token', payload.refreshToken)
  window.sessionStorage.setItem('ghost_auth_profile', JSON.stringify(payload.profile))
}, auth)

const page = await context.newPage()
await page.goto('http://127.0.0.1:4173', { waitUntil: 'networkidle' })
const live = page.getByText('Ghost Live', { exact: true })
if (await live.count()) {
  await live.click()
  await page.waitForLoadState('networkidle')
}
await page.locator('.chat-list-item').first().waitFor({ state: 'visible', timeout: 30000 })
await page.locator('.chat-list-item').first().click()
await page.waitForLoadState('networkidle')

const metrics = await page.locator('body').evaluate(() => {
  const select = (selector) => document.querySelector(selector)
  const box = (selector) => {
    const element = select(selector)
    if (!element) return null
    const rect = element.getBoundingClientRect()
    return {
      selector,
      x: rect.x,
      y: rect.y,
      width: rect.width,
      height: rect.height,
      scrollTop: element.scrollTop,
      scrollHeight: element.scrollHeight,
      clientHeight: element.clientHeight,
      overflowY: getComputedStyle(element).overflowY,
      display: getComputedStyle(element).display,
    }
  }

  return {
    viewport: {
      innerWidth: window.innerWidth,
      innerHeight: window.innerHeight,
      scrollWidth: document.documentElement.scrollWidth,
      scrollHeight: document.documentElement.scrollHeight,
      bodyScrollHeight: document.body.scrollHeight,
    },
    boxes: [
      box('.workspace-panels'),
      box('.inbox-panel'),
      box('.chat-panel'),
      box('.details-panel'),
      box('.message-stream'),
      box('.composer'),
      box('.details-content'),
      box('.chat-list'),
    ],
  }
})

console.log(JSON.stringify(metrics, null, 2))
await browser.close()
