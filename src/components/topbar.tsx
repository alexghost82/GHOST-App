import whiteIconUrl from '../../whiteicon.png'
import { AccountMenu, type AccountMenuItem } from './account-menu'

export type TopbarPrimaryNav = 'command-center' | 'ghost-live'

interface TopbarProps {
  fullName: string
  organizationName: string
  role: string
  channelsCount: number
  totalOperations: number
  totalLiveFeeds: number
  totalUnreadAlerts: number
  activePrimaryNav?: TopbarPrimaryNav
  activeNav?: string
  title: string
  subtitle?: string
  onPrimaryNavChange?: (item: TopbarPrimaryNav) => void
  onNavChange?: (item: string) => void
  onOpenAlerts?: () => void
  onOpenNotificationsCenter?: () => void
  onOpenQuickCommand?: () => void
  onOpenCommandPalette?: () => void
  onOpenHelp?: () => void
  onOpenQuickActions?: () => void
  onLogoAction?: () => void
  themeMode?: 'dark' | 'light'
  onToggleTheme?: () => void
  onLogout: () => void
  accountItems?: AccountMenuItem[]
  onAccountAction?: (actionId: string) => void
  navItems?: unknown[]
}

const DEFAULT_ACCOUNT_ITEMS: AccountMenuItem[] = [
  { id: 'notifications', label: 'Notifications', icon: 'O' },
  { id: 'help', label: 'Help and support', icon: '?' },
  { id: 'logout', label: 'Log out', icon: 'X', danger: true },
]

const PRIMARY_NAV_ITEMS: Array<{ id: TopbarPrimaryNav; label: string }> = [
  { id: 'command-center', label: 'Command Center' },
  { id: 'ghost-live', label: 'Ghost Live' },
]

const METRIC_LABELS = {
  health: 'HEALTH',
  ops: 'OPS',
  channels: 'CHANNELS',
  live: 'LIVE',
}

const DEFAULT_GHOST_MARK = '/ghost-icon-128.png'

function HelpIcon() {
  return (
    <svg aria-hidden="true" fill="none" viewBox="0 0 20 20">
      <circle cx="10" cy="10" r="7" stroke="currentColor" strokeWidth="1.5" />
      <path d="M8.85 7.9A1.65 1.65 0 1 1 11.7 9c-.63.4-1.2.86-1.2 1.75" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
      <circle cx="10" cy="13.7" r=".8" fill="currentColor" />
    </svg>
  )
}

function BellIcon() {
  return (
    <svg aria-hidden="true" fill="none" viewBox="0 0 20 20">
      <path d="M10 4.25a3.25 3.25 0 0 0-3.25 3.25v1.28c0 .68-.2 1.35-.57 1.92L5 12.5h10l-1.18-1.8a3.5 3.5 0 0 1-.57-1.92V7.5A3.25 3.25 0 0 0 10 4.25Z" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
      <path d="M8.55 14.5a1.6 1.6 0 0 0 2.9 0" stroke="currentColor" strokeLinecap="round" strokeWidth="1.5" />
    </svg>
  )
}

function SparkleIcon() {
  return (
    <svg aria-hidden="true" fill="none" viewBox="0 0 20 20">
      <path d="m10 3 1.6 4.4L16 9l-4.4 1.6L10 15l-1.6-4.4L4 9l4.4-1.6L10 3Z" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.4" />
    </svg>
  )
}

function SearchIcon() {
  return (
    <svg aria-hidden="true" fill="none" viewBox="0 0 20 20">
      <circle cx="9" cy="9" r="4.75" stroke="currentColor" strokeWidth="1.5" />
      <path d="m12.5 12.5 3.25 3.25" stroke="currentColor" strokeLinecap="round" strokeWidth="1.5" />
    </svg>
  )
}

function KeyboardIcon() {
  return (
    <svg aria-hidden="true" fill="none" viewBox="0 0 20 20">
      <rect x="2.75" y="5" width="14.5" height="10" rx="2.5" stroke="currentColor" strokeWidth="1.5" />
      <path d="M5.5 8.5h.01M8.5 8.5h.01M11.5 8.5h.01M14.5 8.5h.01M5.5 11.5h6M13 11.5h1.5" stroke="currentColor" strokeLinecap="round" strokeWidth="1.5" />
    </svg>
  )
}

function getHealthPercent(channelsCount: number, totalLiveFeeds: number) {
  if (channelsCount <= 0) {
    return 0
  }
  return Math.round((totalLiveFeeds / channelsCount) * 100)
}

export function Topbar({
  fullName,
  organizationName,
  role,
  channelsCount,
  totalOperations,
  totalLiveFeeds,
  totalUnreadAlerts,
  activePrimaryNav,
  activeNav,
  title,
  subtitle,
  onPrimaryNavChange,
  onNavChange,
  onOpenAlerts,
  onOpenNotificationsCenter,
  onOpenQuickCommand,
  onOpenCommandPalette,
  onOpenHelp,
  onOpenQuickActions,
  onLogoAction,
  themeMode = 'dark',
  onToggleTheme,
  onLogout,
  accountItems = DEFAULT_ACCOUNT_ITEMS,
  onAccountAction,
}: TopbarProps) {
  const healthPercent = getHealthPercent(channelsCount, totalLiveFeeds)
  const brandMarkSrc = themeMode === 'light' ? whiteIconUrl : DEFAULT_GHOST_MARK
  const resolvedPrimaryNav: TopbarPrimaryNav =
    activePrimaryNav ?? (activeNav === 'Live Ops' || activeNav === 'ghost-live' ? 'ghost-live' : 'command-center')
  const openAlerts = onOpenAlerts ?? onOpenNotificationsCenter ?? (() => undefined)
  const openQuickCommand = onOpenQuickCommand ?? onOpenCommandPalette ?? (() => undefined)
  const openHelp = onOpenHelp ?? (() => undefined)
  const openQuickActions = onOpenQuickActions ?? (() => undefined)
  const handleLogoAction = onLogoAction ?? (() => onNavChange?.('Overview'))

  function handlePrimaryNavChange(item: TopbarPrimaryNav) {
    onPrimaryNavChange?.(item)
    if (!onPrimaryNavChange) {
      onNavChange?.(item)
    }
  }

  function handleAccountAction(actionId: string) {
    if (actionId === 'notifications') {
      openAlerts()
      return
    }
    if (actionId === 'help') {
      openHelp()
      return
    }
    if (actionId === 'logout') {
      onLogout()
      return
    }
    onAccountAction?.(actionId)
  }

  return (
    <header
      aria-label={subtitle ? `${title} - ${subtitle}` : title}
      className="topbar topbar-ref"
      data-primary-nav={resolvedPrimaryNav}
      data-theme-mode={themeMode}
    >
      <div className="topbar-left-cluster">
        <AccountMenu
          fullName={fullName}
          items={accountItems}
          onAction={handleAccountAction}
          onLogout={onLogout}
          organizationName={organizationName}
          themeMode={themeMode}
          onToggleTheme={onToggleTheme}
          role={role}
        />

        <span aria-hidden className="topbar-cluster-divider" />

        <div className="topbar-icon-cluster" aria-label="Global actions">
          <button className="topbar-icon-btn" onClick={openHelp} title="Help and support" type="button">
            <span aria-hidden className="topbar-inline-icon">
              <HelpIcon />
            </span>
          </button>
          <button className="topbar-icon-btn" onClick={openAlerts} title="Notifications" type="button">
            <span aria-hidden className="topbar-inline-icon">
              <BellIcon />
            </span>
          </button>
          <button className="topbar-icon-btn" onClick={openQuickActions} title="Quick actions" type="button">
            <span aria-hidden className="topbar-inline-icon">
              <SparkleIcon />
            </span>
          </button>
        </div>

        <span aria-hidden className="topbar-cluster-divider topbar-cluster-divider-metrics" />

        <div className="topbar-metrics" aria-label="System health metrics">
          <div className="topbar-metric-tile">
            <span className="topbar-metric-value">{healthPercent}%</span>
            <span className="topbar-metric-label">{METRIC_LABELS.health}</span>
          </div>
          <div className="topbar-metric-tile">
            <span className="topbar-metric-value">{totalOperations}</span>
            <span className="topbar-metric-label">{METRIC_LABELS.ops}</span>
          </div>
          <div className="topbar-metric-tile">
            <span className="topbar-metric-value">{channelsCount}</span>
            <span className="topbar-metric-label">{METRIC_LABELS.channels}</span>
          </div>
          <div className="topbar-metric-tile">
            <span className="topbar-metric-value">{Math.max(totalLiveFeeds, totalUnreadAlerts)}</span>
            <span className="topbar-metric-label">{METRIC_LABELS.live}</span>
          </div>
        </div>
      </div>

      <div className="topbar-right-cluster">
        <nav aria-label="Primary navigation" className="topbar-nav">
          {PRIMARY_NAV_ITEMS.map((item) => (
            <button
              key={item.id}
              className={`topbar-nav-item${resolvedPrimaryNav === item.id ? ' active' : ''}`}
              onClick={() => handlePrimaryNavChange(item.id)}
              type="button"
            >
              {item.label}
            </button>
          ))}
        </nav>

        <button className="topbar-command-trigger" onClick={openQuickCommand} type="button">
          <span className="topbar-command-prefix" aria-hidden>
            <KeyboardIcon />
          </span>
          <span>Quick command</span>
          <span className="topbar-command-icon" aria-hidden>
            <SearchIcon />
          </span>
        </button>

        <button
          aria-label={title}
          className="topbar-logo-btn"
          onClick={handleLogoAction}
          title={subtitle ? `${title} - ${subtitle}` : title}
          type="button"
        >
          <span aria-hidden className="topbar-logo-halo" />
          <img
            className="brand-mark"
            src={brandMarkSrc}
            alt="Ghost logo"
            onError={(event) => {
              event.currentTarget.onerror = null
              event.currentTarget.src = DEFAULT_GHOST_MARK
            }}
          />
        </button>
      </div>
    </header>
  )
}
