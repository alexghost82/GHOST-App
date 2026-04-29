import { useEffect, useRef, useState } from 'react'
import App from '../App'
import { LoginPage } from './login-page'
import { SuperAdminPanel } from './super-admin-panel'
import type { AuthProfile } from '../types/admin'
import { ghostAccessRequest, loginRequest, meRequest } from '../services/auth-api'
import { clearAuthSession, readAuthProfile, readAuthSession, writeAuthTokens } from '../utils/auth-session'

type SuperAdminShellView = 'operator' | 'admin'
type SuperAdminOperatorSurface = 'Overview' | 'Live Ops'
type ThemeMode = 'dark' | 'light'

const SUPER_ADMIN_COMBO = new Set(['g', 'a'])
const THEME_STORAGE_KEY = 'ghost_theme_mode'
const DESKTOP_WEB_BREAKPOINT = 900

const LOCAL_SUPER_ADMIN_PROFILE: AuthProfile = {
  userId: 'local-super-admin',
  organizationId: '',
  organizationName: '',
  role: 'super_admin',
  username: 'omeradmin',
  firstName: 'Ghost',
  lastName: 'Admin',
}

function AmbientUiEffects() {
  return (
    <div className="ambient-ui" aria-hidden="true">
      <div className="ambient-ui__noise" />
    </div>
  )
}

/**
 * מעטפת היישום שמנתבת לפי תפקיד משתמש מחובר.
 */
function tryPickupImpersonation(): AuthProfile | null {
  try {
    const hash = window.location.hash
    if (!hash.startsWith('#impersonate=')) return null
    const encoded = hash.slice('#impersonate='.length)
    const binary = atob(encoded)
    const bytes = Uint8Array.from(binary, (ch) => ch.charCodeAt(0))
    const payload = JSON.parse(new TextDecoder().decode(bytes)) as { accessToken: string; refreshToken: string; profile: AuthProfile }
    writeAuthTokens(payload.accessToken, payload.refreshToken, payload.profile)
    window.history.replaceState(null, '', window.location.pathname + window.location.search)
    return payload.profile
  } catch {
    return null
  }
}

function canElementConsumeWheel(element: HTMLElement, deltaY: number): boolean {
  const styles = window.getComputedStyle(element)
  const overflowY = styles.overflowY
  const isScrollable =
    ['auto', 'scroll', 'overlay'].includes(overflowY) &&
    element.scrollHeight > element.clientHeight + 1

  if (!isScrollable) {
    return false
  }

  if (deltaY > 0) {
    return element.scrollTop + element.clientHeight < element.scrollHeight - 1
  }

  if (deltaY < 0) {
    return element.scrollTop > 0
  }

  return false
}

export function RootApp() {
  const [profile, setProfile] = useState<AuthProfile | null>(() => {
    const impersonated = tryPickupImpersonation()
    if (impersonated) return impersonated
    if (!readAuthSession()) {
      return null
    }
    return readAuthProfile()
  })
  const [authError, setAuthError] = useState('')
  const [superAdminShellView, setSuperAdminShellView] = useState<SuperAdminShellView>('admin')
  const [superAdminOperatorSurface, setSuperAdminOperatorSurface] = useState<SuperAdminOperatorSurface>('Overview')
  const [themeMode, setThemeMode] = useState<ThemeMode>(() => {
    if (typeof window === 'undefined') {
      return 'dark'
    }
    try {
      const stored = window.localStorage.getItem(THEME_STORAGE_KEY)
      if (stored === 'dark' || stored === 'light') {
        return stored
      }
    } catch {
      // ignore storage errors
    }
    return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark'
  })
  const pressedKeysRef = useRef(new Set<string>())
  const comboFiredRef = useRef(false)

  useEffect(() => {
    if (typeof document === 'undefined') {
      return
    }
    document.documentElement.dataset.theme = themeMode
    document.documentElement.style.colorScheme = themeMode
    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, themeMode)
    } catch {
      // ignore storage errors
    }
  }, [themeMode])

  useEffect(() => {
    function handleDesktopWheel(event: WheelEvent) {
      if (window.innerWidth < DESKTOP_WEB_BREAKPOINT) {
        return
      }

      if (event.defaultPrevented || event.ctrlKey || event.deltaY === 0) {
        return
      }

      if (
        event.target instanceof HTMLElement &&
        (event.target.closest('input, textarea, select, [contenteditable=\"true\"]') ||
          event.target.closest('.account-dropdown.account-dropdown-floating'))
      ) {
        return
      }

      let current =
        event.target instanceof HTMLElement ? event.target : event.target instanceof Node ? event.target.parentElement : null

      while (current && current !== document.body) {
        if (canElementConsumeWheel(current, event.deltaY)) {
          return
        }
        current = current.parentElement
      }

      const scroller = document.scrollingElement ?? document.documentElement
      const maxScrollTop = Math.max(0, scroller.scrollHeight - window.innerHeight)
      if (maxScrollTop <= 0) {
        return
      }

      const nextScrollTop = Math.max(0, Math.min(maxScrollTop, scroller.scrollTop + event.deltaY))
      if (nextScrollTop === scroller.scrollTop) {
        return
      }

      scroller.scrollTop = nextScrollTop
      event.preventDefault()
    }

    window.addEventListener('wheel', handleDesktopWheel, { passive: false })
    return () => window.removeEventListener('wheel', handleDesktopWheel)
  }, [])

  function toggleTheme() {
    setThemeMode((current) => (current === 'dark' ? 'light' : 'dark'))
  }

  useEffect(() => {
    function checkSuperAdminCombo() {
      if (!import.meta.env.DEV) {
        return
      }
      if (comboFiredRef.current) return
      for (const key of SUPER_ADMIN_COMBO) {
        if (!pressedKeysRef.current.has(key)) return
      }
      comboFiredRef.current = true
      setProfile(LOCAL_SUPER_ADMIN_PROFILE)
      setSuperAdminShellView('admin')
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement || event.target instanceof HTMLSelectElement) {
        return
      }
      const key = event.key.toLowerCase()
      if (!SUPER_ADMIN_COMBO.has(key)) return
      pressedKeysRef.current.add(key)
      checkSuperAdminCombo()
    }

    function handleKeyUp(event: KeyboardEvent) {
      const key = event.key.toLowerCase()
      pressedKeysRef.current.delete(key)
      if (pressedKeysRef.current.size === 0) {
        comboFiredRef.current = false
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [])

  useEffect(() => {
    if (!profile) {
      return
    }
    if (profile.userId === 'local-super-admin') {
      return
    }
    void meRequest().catch(() => {
      clearAuthSession()
      setProfile(null)
      setAuthError('הסשן פג תוקף. יש להתחבר מחדש.')
    })
  }, [profile])

  async function handleAuthenticate(username: string, password: string): Promise<boolean> {
    try {
      const payload = await loginRequest(username, password)
      writeAuthTokens(payload.accessToken, payload.refreshToken, payload.profile)
      setProfile(payload.profile)
      setSuperAdminShellView(payload.profile.role === 'super_admin' ? 'admin' : 'operator')
      setAuthError('')
      return true
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : 'התחברות נכשלה.')
      return false
    }
  }

  async function handleGhostAccess(): Promise<void> {
    try {
      const payload = await ghostAccessRequest()
      writeAuthTokens(payload.accessToken, payload.refreshToken, payload.profile)
      setProfile(payload.profile)
      setSuperAdminShellView(payload.profile.role === 'super_admin' ? 'admin' : 'operator')
      setAuthError('')
    } catch {
      setAuthError('כניסת ghost נכשלה.')
    }
  }

  function handleLogout() {
    clearAuthSession()
    setProfile(null)
    setSuperAdminShellView('admin')
    setSuperAdminOperatorSurface('Overview')
  }

  if (!profile) {
    return (
      <>
        <AmbientUiEffects />
        <LoginPage
          onAuthenticate={handleAuthenticate}
          onGhostAccess={handleGhostAccess}
          onToggleTheme={toggleTheme}
          themeMode={themeMode}
          externalErrorMessage={authError}
        />
      </>
    )
  }

  if (profile.role === 'super_admin') {
    return (
      <>
        <AmbientUiEffects />
        {superAdminShellView === 'admin' ? (
          <SuperAdminPanel
            onLogout={handleLogout}
            onOpenCommandCenter={() => {
              setSuperAdminOperatorSurface('Overview')
              setSuperAdminShellView('operator')
            }}
            onOpenGhostLive={() => {
              setSuperAdminOperatorSurface('Live Ops')
              setSuperAdminShellView('operator')
            }}
            profile={profile}
            onToggleTheme={toggleTheme}
            themeMode={themeMode}
          />
        ) : (
          <App
            currentUserRole={profile.role}
            fullName={[profile.firstName, profile.lastName].filter(Boolean).join(' ') || profile.username}
            initialSurface={superAdminOperatorSurface}
            onLogout={handleLogout}
            onOpenAdmin={() => setSuperAdminShellView('admin')}
            organizationName={profile.organizationName || ''}
            onToggleTheme={toggleTheme}
            themeMode={themeMode}
          />
        )}
      </>
    )
  }

  const fullName = [profile.firstName, profile.lastName].filter(Boolean).join(' ') || profile.username
  return (
    <>
      <AmbientUiEffects />
      <App
        currentUserRole={profile.role}
        fullName={fullName}
        organizationName={profile.organizationName || ''}
        onLogout={handleLogout}
        onToggleTheme={toggleTheme}
        themeMode={themeMode}
      />
    </>
  )
}
