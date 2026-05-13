import { useEffect, useRef, useState } from 'react'
import type { CSSProperties, FormEvent, SyntheticEvent } from 'react'
import whiteIconUrl from '../../whiteicon.png'
import './login-page.css'

const GHOST_ACCESS_COMBO = new Set(['g', 'a', 'p'])
const DEFAULT_GHOST_MARK = '/ghost-icon-128.png'

interface LoginIntelLine {
  text: string
  top: string
  left: string
  cycleSec: number
  delaySec: number
  fontSizePx: number
  maxWidth: string
}

const LOGIN_INTEL_LINES: LoginIntelLine[] = [
  { text: 'INIT::secure_bridge uplink=ready', top: '7%', left: '4%', cycleSec: 7.6, delaySec: -1.2, fontSizePx: 11, maxWidth: '28ch' },
  { text: 'AUTH::operator handoff pending', top: '11%', left: '36%', cycleSec: 8.8, delaySec: -3.1, fontSizePx: 11, maxWidth: '30ch' },
  { text: 'SCAN::zone-alpha anomaly_score=0.07', top: '16%', left: '68%', cycleSec: 7.1, delaySec: -2.4, fontSizePx: 10, maxWidth: '34ch' },
  { text: 'TRACE::vision_proxy route=stabilized', top: '24%', left: '10%', cycleSec: 8.4, delaySec: -4.6, fontSizePx: 11, maxWidth: '33ch' },
  { text: 'INTEL::channel-delta heartbeat=ok', top: '30%', left: '58%', cycleSec: 7.9, delaySec: -1.7, fontSizePx: 10, maxWidth: '31ch' },
  { text: 'OPS::queue depth=2 retries=0 timeout=30s', top: '36%', left: '76%', cycleSec: 9.2, delaySec: -5.2, fontSizePx: 10, maxWidth: '39ch' },
  { text: 'MEM::retention window=120m status=active', top: '45%', left: '6%', cycleSec: 8.1, delaySec: -2.8, fontSizePx: 11, maxWidth: '39ch' },
  { text: 'PIPE::critical_alerts unread=0 pending=0', top: '52%', left: '39%', cycleSec: 8.7, delaySec: -6.4, fontSizePx: 10, maxWidth: '39ch' },
  { text: 'MODEL::vision-chat provider=online', top: '61%', left: '71%', cycleSec: 7.3, delaySec: -3.7, fontSizePx: 10, maxWidth: '33ch' },
  { text: 'NET::jitter=2ms packet_loss=0%', top: '70%', left: '18%', cycleSec: 6.8, delaySec: -1.1, fontSizePx: 11, maxWidth: '30ch' },
  { text: 'FORENSICS::archive stream encrypted(AES256)', top: '78%', left: '49%', cycleSec: 9.5, delaySec: -4.3, fontSizePx: 10, maxWidth: '44ch' },
  { text: 'WATCH::pattern_match result=clear', top: '86%', left: '74%', cycleSec: 7.4, delaySec: -2.2, fontSizePx: 10, maxWidth: '32ch' },
]

export interface LoginPageProps {
  onAuthenticate: (user: string, passkey: string) => Promise<boolean> | boolean
  onGhostAccess?: () => void
  themeMode?: 'dark' | 'light'
  onToggleTheme?: () => void
  externalErrorMessage?: string
}

export function LoginPage({ onAuthenticate, onGhostAccess, themeMode = 'dark', onToggleTheme, externalErrorMessage }: LoginPageProps) {
  const [errorMessage, setErrorMessage] = useState('')
  const pressedKeysRef = useRef(new Set<string>())
  const firedRef = useRef(false)
  const brandMarkSrc = themeMode === 'light' ? whiteIconUrl : DEFAULT_GHOST_MARK

  useEffect(() => {
    if (!onGhostAccess || !import.meta.env.DEV) {
      return
    }

    function checkCombo() {
      if (firedRef.current) return
      for (const key of GHOST_ACCESS_COMBO) {
        if (!pressedKeysRef.current.has(key)) return
      }
      firedRef.current = true
      void onGhostAccess?.()
    }

    function handleKeyDown(event: KeyboardEvent) {
      const key = event.key.toLowerCase()
      if (!GHOST_ACCESS_COMBO.has(key)) return
      pressedKeysRef.current.add(key)
      checkCombo()
    }

    function handleKeyUp(event: KeyboardEvent) {
      const key = event.key.toLowerCase()
      pressedKeysRef.current.delete(key)
      if (pressedKeysRef.current.size === 0) {
        firedRef.current = false
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [onGhostAccess])

  function fallbackToFavicon(event: SyntheticEvent<HTMLImageElement>) {
    event.currentTarget.onerror = null
    event.currentTarget.src = DEFAULT_GHOST_MARK
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    const user = String(formData.get('user') ?? '').trim()
    const passkey = String(formData.get('passkey') ?? '')
    const isAuthenticated = await onAuthenticate(user, passkey)

    if (isAuthenticated) {
      setErrorMessage('')
      return
    }

    setErrorMessage(externalErrorMessage || 'פרטי ההתחברות שגויים. נסה שוב.')
  }

  return (
    <main className="login-screen" dir="rtl">
      <button
        aria-label={themeMode === 'light' ? 'מעבר למצב כהה' : 'מעבר למצב בהיר'}
        className="login-theme-toggle"
        onClick={onToggleTheme}
        type="button"
      >
        {themeMode === 'light' ? '☾' : '☼'}
      </button>
      <div aria-hidden className="login-terminal-bg">
        <span className="login-terminal-glow" />
        <span className="login-terminal-scanlines" />
        {LOGIN_INTEL_LINES.map((line) => {
          const style = {
            '--line-top': line.top,
            '--line-left': line.left,
            '--line-cycle': `${line.cycleSec}s`,
            '--line-delay': `${line.delaySec}s`,
            '--line-size': `${line.fontSizePx}px`,
            '--line-chars': line.text.length,
            '--line-max': line.maxWidth,
          } as CSSProperties

          return (
            <span key={`${line.text}_${line.top}_${line.left}`} className="login-code-blip" style={style}>
              <span className="login-code-typed">{line.text}</span>
            </span>
          )
        })}
      </div>
      <section aria-label="כניסה למערכת" className="login-card">
        <header className="login-header">
          <img
            alt="אייקון Ghost"
            className="login-brand-icon"
            decoding="async"
            loading="eager"
            onError={fallbackToFavicon}
            src={brandMarkSrc}
          />
          <p className="login-eyebrow">גישה מאובטחת</p>
          <h1 className="login-title">כניסה למערכת</h1>
          <p className="login-subtitle">הזן שם משתמש וסיסמה כדי להמשיך אל סביבת ההפעלה של Ghost.</p>
        </header>

        <form className="login-form" onSubmit={handleSubmit}>
          <label htmlFor="login-user">
            שם משתמש
            <input autoComplete="username" id="login-user" name="user" required type="text" />
          </label>

          <label htmlFor="login-passkey">
            סיסמה
            <input autoComplete="current-password" id="login-passkey" name="passkey" required type="password" />
          </label>

          {errorMessage ? (
            <p aria-live="assertive" className="login-error" role="alert">
              {errorMessage}
            </p>
          ) : null}

          <button className="primary-button login-submit" type="submit">
            כניסה
          </button>
        </form>
      </section>
    </main>
  )
}
