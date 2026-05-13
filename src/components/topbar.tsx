import { useRef, useState } from 'react'
import { AccountMenu, type AccountMenuItem } from './account-menu'

export type TopbarNavItem = string

interface TopbarProps {
  fullName: string
  organizationName: string
  role: string
  channelsCount: number
  totalOperations: number
  totalLiveFeeds: number
  totalUnreadAlerts: number
  activeNav: TopbarNavItem
  canAccessCommandCenter: boolean
  navItems?: TopbarNavItem[]
  showAccountMenu?: boolean
  showCommandTrigger?: boolean
  showMetrics?: boolean
  showNotifications?: boolean
  showSupportActions?: boolean
  showThemeToggle?: boolean
  accountMenuItems?: AccountMenuItem[]
  themeMode: 'light' | 'dark'
  onToggleTheme: () => void
  onBrandClick: () => void
  onCommandTrigger: () => void
  onOpenShortcuts: () => void
  onOpenSupport: () => void
  onNavChange: (item: TopbarNavItem) => void
  onOpenNotificationsCenter: () => void
  onAccountAction: (itemId: string) => void
<<<<<<< HEAD
  mobileLiveDesign?: boolean
=======
>>>>>>> bc6fd7897cf748544dfe79db1218b867c9b6c83d
}

const NAV_ITEMS = ['Ghost Live', 'Command Center'] as const
const LONG_PRESS_MS = 4000

function navLabel(item: string): string {
  if (item === 'Ghost Live') {
    return 'גוסט לייב'
  }
  if (item === 'Command Center') {
    return 'מרכז פיקוד'
  }
  if (item === 'Super Admin') {
    return 'סופר אדמין'
  }
  return item
}

function LiveMetricTile({ value }: { value: number }) {
  const [isCharging, setIsCharging] = useState(false)
  const pressStartRef = useRef<number | null>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  function startHold() {
    pressStartRef.current = Date.now()
    setIsCharging(true)
    timerRef.current = setTimeout(() => setIsCharging(false), LONG_PRESS_MS + 50)
  }

  function releaseHold() {
    const elapsed = pressStartRef.current !== null ? Date.now() - pressStartRef.current : 0
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
    setIsCharging(false)
    pressStartRef.current = null
    if (elapsed >= LONG_PRESS_MS) {
      window.open('/terminal.html', '_blank', 'noopener,noreferrer')
    }
  }

  function abortHold() {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
    setIsCharging(false)
    pressStartRef.current = null
  }

  return (
    <button
      aria-label={`ערוצים חיים: ${value}`}
      className={`topbar-metric-tile topbar-metric-live${isCharging ? ' status-pill-charging' : ''}`}
      onMouseDown={startHold}
      onMouseLeave={abortHold}
      onMouseUp={releaseHold}
      onTouchEnd={releaseHold}
      onTouchStart={startHold}
      title="ערוצים חיים"
      type="button"
    >
      <span className="topbar-metric-label">חי</span>
      <span className="topbar-metric-value">{value}</span>
    </button>
  )
}

function BellIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
      <path
        d="M8 1.25a4.75 4.75 0 0 0-4.75 4.75v2.4L1.75 9.9v1.6h12.5V9.9L12.75 7.4V6A4.75 4.75 0 0 0 8 1.25z"
        stroke="currentColor"
        strokeWidth="1.45"
        strokeLinejoin="round"
      />
      <path d="M6.1 11.8a1.9 1.9 0 0 0 3.8 0" stroke="currentColor" strokeWidth="1.45" strokeLinecap="round" />
    </svg>
  )
}

function SearchIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden>
      <circle cx="7" cy="7" r="4.2" stroke="currentColor" strokeWidth="1.3" />
      <path d="M10.4 10.4L14 14" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  )
}

function SparkIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden>
      <path d="M8 1.5L9.4 6.6L14.5 8L9.4 9.4L8 14.5L6.6 9.4L1.5 8L6.6 6.6L8 1.5Z" stroke="currentColor" strokeWidth="1.1" />
    </svg>
  )
}

function HelpIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
      <circle cx="8" cy="8" r="6.2" stroke="currentColor" strokeWidth="1.35" />
      <path
        d="M6.55 6.2A1.65 1.65 0 0 1 8 5.3c1 0 1.75.62 1.75 1.55 0 .67-.39 1.06-1 1.43-.54.33-.84.62-.84 1.24v.18"
        stroke="currentColor"
        strokeWidth="1.35"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="8" cy="11.75" r="0.78" fill="currentColor" />
    </svg>
  )
}

function ThemeIcon({ themeMode }: { themeMode: 'light' | 'dark' }) {
  if (themeMode === 'dark') {
    return (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
<<<<<<< HEAD
        <circle cx="8" cy="8" r="3.1" stroke="currentColor" strokeWidth="1.35" />
        <path d="M8 1.6V3.2" stroke="currentColor" strokeWidth="1.35" strokeLinecap="round" />
        <path d="M8 12.8V14.4" stroke="currentColor" strokeWidth="1.35" strokeLinecap="round" />
        <path d="M1.6 8H3.2" stroke="currentColor" strokeWidth="1.35" strokeLinecap="round" />
        <path d="M12.8 8H14.4" stroke="currentColor" strokeWidth="1.35" strokeLinecap="round" />
        <path d="M3.48 3.48L4.62 4.62" stroke="currentColor" strokeWidth="1.35" strokeLinecap="round" />
        <path d="M11.38 11.38L12.52 12.52" stroke="currentColor" strokeWidth="1.35" strokeLinecap="round" />
        <path d="M11.38 4.62L12.52 3.48" stroke="currentColor" strokeWidth="1.35" strokeLinecap="round" />
        <path d="M3.48 12.52L4.62 11.38" stroke="currentColor" strokeWidth="1.35" strokeLinecap="round" />
=======
        <path
          d="M11.9 10.65A4.9 4.9 0 0 1 5.35 4.1a5.75 5.75 0 1 0 6.55 6.55Z"
          stroke="currentColor"
          strokeWidth="1.35"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
>>>>>>> bc6fd7897cf748544dfe79db1218b867c9b6c83d
      </svg>
    )
  }

  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
<<<<<<< HEAD
      <path
        d="M10.98 2.64A5.85 5.85 0 1 0 13.36 9.9a4.95 4.95 0 1 1-2.38-7.26Z"
        stroke="currentColor"
        strokeWidth="1.35"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
=======
      <circle cx="8" cy="8" r="2.7" stroke="currentColor" strokeWidth="1.35" />
      <path d="M8 1.25V2.8M8 13.2v1.55M1.25 8H2.8M13.2 8h1.55M3.3 3.3l1.1 1.1M11.6 11.6l1.1 1.1M12.7 3.3l-1.1 1.1M4.4 11.6l-1.1 1.1" stroke="currentColor" strokeWidth="1.35" strokeLinecap="round" />
>>>>>>> bc6fd7897cf748544dfe79db1218b867c9b6c83d
    </svg>
  )
}

export function Topbar({
  fullName,
  organizationName,
  role,
  channelsCount,
  totalOperations,
  totalLiveFeeds,
  totalUnreadAlerts,
  activeNav,
  canAccessCommandCenter,
  navItems = [...NAV_ITEMS],
  showAccountMenu = true,
  showCommandTrigger = true,
  showMetrics = true,
  showNotifications = true,
  showSupportActions = true,
  showThemeToggle = true,
  accountMenuItems = [],
  themeMode,
  onToggleTheme,
  onBrandClick,
  onCommandTrigger,
  onOpenShortcuts,
  onOpenSupport,
  onNavChange,
  onOpenNotificationsCenter,
  onAccountAction,
  mobileLiveDesign = false,
}: TopbarProps) {
  const healthPercent = channelsCount > 0 ? Math.round((totalLiveFeeds / channelsCount) * 100) : 0
  const brandSrc = themeMode === 'dark' ? '/whiteicon.png' : '/ghost-icon-128.png'
  const fallbackBrandSrc = themeMode === 'dark' ? '/favicon.svg' : '/favicon-64.png'

  return (
<<<<<<< HEAD
    <header className={`topbar${mobileLiveDesign ? ' topbar-mobile-live-design' : ''}`}>
=======
    <header className="topbar">
>>>>>>> bc6fd7897cf748544dfe79db1218b867c9b6c83d
      <button aria-label="חזרה למרחב הראשי" className="topbar-brand topbar-brand-button" onClick={onBrandClick} type="button">
        <img
          className={`brand-mark brand-mark-${themeMode}`}
          src={brandSrc}
          alt="Ghost"
          onError={(event) => {
            event.currentTarget.onerror = null
            event.currentTarget.src = fallbackBrandSrc
          }}
        />
      </button>

      <div className="topbar-center desktop-only">
        {showCommandTrigger ? (
          <button className="topbar-command-trigger" onClick={onCommandTrigger} type="button">
            <SearchIcon />
            <span>פקודה מהירה</span>
            <kbd>Ctrl+K</kbd>
          </button>
        ) : null}

        <nav className="topbar-nav" aria-label="ניווט ראשי">
          {navItems.map((item) => (
            <button
              key={item}
              className={`topbar-nav-item${activeNav === item ? ' active' : ''}`}
              disabled={item === 'Command Center' && !canAccessCommandCenter}
              onClick={() => onNavChange(item)}
              type="button"
            >
              {(navLabel(item), item)}
            </button>
          ))}
        </nav>
      </div>

      <div className="topbar-actions">
        {showMetrics ? (
          <div className="topbar-metrics desktop-only" aria-label="מצב המערכת">
            <LiveMetricTile value={totalLiveFeeds} />
            <div className="topbar-metric-tile">
              <span className="topbar-metric-label">ערוצים</span>
              <span className="topbar-metric-value">{channelsCount}</span>
            </div>
            <div className="topbar-metric-tile">
              <span className="topbar-metric-label">מבצעים</span>
              <span className="topbar-metric-value">{totalOperations}</span>
            </div>
            <div className="topbar-metric-tile">
              <span className="topbar-metric-label">בריאות</span>
              <span className="topbar-metric-value">{healthPercent}%</span>
            </div>
          </div>
        ) : null}

        {showMetrics ? <div className="topbar-actions-divider desktop-only" /> : null}
<<<<<<< HEAD

        <button
          aria-label="חיפוש"
          className="topbar-icon-btn topbar-search-btn mobile-only"
          onClick={onCommandTrigger}
          title="חיפוש"
          type="button"
        >
          <SearchIcon />
        </button>

=======

        <button aria-label="חיפוש" className="topbar-icon-btn mobile-only" onClick={onCommandTrigger} title="חיפוש" type="button">
          <SearchIcon />
        </button>

>>>>>>> bc6fd7897cf748544dfe79db1218b867c9b6c83d
        {showSupportActions ? (
          <button
            aria-label="קיצורי מערכת"
            className="topbar-icon-btn desktop-only"
            onClick={onOpenShortcuts}
            title="קיצורי מערכת"
            type="button"
          >
            <SparkIcon />
          </button>
        ) : null}

        {showNotifications ? (
          <button
            aria-label={`התראות שלא נקראו: ${totalUnreadAlerts}`}
<<<<<<< HEAD
            className="topbar-icon-btn topbar-notifications-btn topbar-theme-btn"
=======
            className="topbar-icon-btn topbar-theme-btn"
>>>>>>> bc6fd7897cf748544dfe79db1218b867c9b6c83d
            onClick={onOpenNotificationsCenter}
            type="button"
          >
            <BellIcon />
            {totalUnreadAlerts > 0 ? <span className="notif-badge" aria-hidden>{totalUnreadAlerts > 99 ? '99+' : totalUnreadAlerts}</span> : null}
          </button>
        ) : null}

        {showSupportActions ? (
          <button
            aria-label="עזרה ותמיכה"
            className="topbar-icon-btn desktop-only"
            onClick={onOpenSupport}
            title="עזרה ותמיכה"
            type="button"
          >
            <HelpIcon />
          </button>
        ) : null}

        {showThemeToggle ? (
          <button
            aria-label={themeMode === 'light' ? 'מעבר לערכת נושא כהה' : 'מעבר לערכת נושא בהירה'}
<<<<<<< HEAD
            className="topbar-icon-btn topbar-theme-toggle-btn"
=======
            className="topbar-icon-btn"
>>>>>>> bc6fd7897cf748544dfe79db1218b867c9b6c83d
            onClick={onToggleTheme}
            title={themeMode === 'light' ? 'ערכת נושא כהה' : 'ערכת נושא בהירה'}
            type="button"
          >
            <ThemeIcon themeMode={themeMode} />
          </button>
        ) : null}

        {showAccountMenu ? <div className="topbar-actions-divider" /> : null}

        {showAccountMenu ? (
          <AccountMenu
            fullName={fullName}
            items={accountMenuItems}
            onSelect={onAccountAction}
            organizationName={organizationName}
            role={role}
          />
        ) : null}
      </div>
    </header>
  )
}
