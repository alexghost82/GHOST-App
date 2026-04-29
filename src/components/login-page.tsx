import { useEffect, useRef, useState } from 'react'
import type { FormEvent, SyntheticEvent } from 'react'
import whiteIconUrl from '../../whiteicon.png'
import './login-page.css'

const GHOST_ACCESS_COMBO = new Set(['g', 'a', 'p'])
const DEFAULT_GHOST_MARK = '/ghost-icon-128.png'

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
        <span className="login-terminal-orb login-terminal-orb-primary" />
        <span className="login-terminal-orb login-terminal-orb-secondary" />
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
