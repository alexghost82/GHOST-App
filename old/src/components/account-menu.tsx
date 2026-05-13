import { createPortal } from 'react-dom'
import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { readAuthProfile } from '../utils/auth-session'

export interface AccountMenuItem {
  id: string
  label: string
  icon: string
  danger?: boolean
}

const DEFAULT_ITEMS: AccountMenuItem[] = [
  { id: 'notifications', label: 'Notifications', icon: 'O' },
  { id: 'logout', label: 'Log out', icon: 'X', danger: true },
]

const ROLE_LABELS: Record<string, string> = {
  super_admin: 'Super Admin',
  system_manager: 'System Manager',
  regular_user: 'Operator',
}

interface AccountMenuProps {
  fullName: string
  organizationName: string
  role: string
  themeMode?: 'dark' | 'light'
  onToggleTheme?: () => void
  items?: AccountMenuItem[]
  onAction?: (actionId: string) => void
  onLogout?: () => void
}

function getInitials(fullName: string): string {
  const parts = fullName.trim().split(/\s+/)
  if (parts.length === 0 || !parts[0]) return '??'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

function getDisplayName(fullName: string): string {
  const firstName = fullName.trim().split(/\s+/)[0]
  return firstName || fullName
}

function ChevronIcon() {
  return (
    <svg aria-hidden="true" fill="none" viewBox="0 0 16 16">
      <path d="M9.5 3.5 5 8l4.5 4.5" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
    </svg>
  )
}

function SunIcon() {
  return (
    <svg aria-hidden="true" fill="none" viewBox="0 0 20 20">
      <circle cx="10" cy="10" r="3.4" stroke="currentColor" strokeWidth="1.5" />
      <path d="M10 2.5v2M10 15.5v2M17.5 10h-2M4.5 10h-2M15.3 4.7l-1.4 1.4M6.1 13.9l-1.4 1.4M15.3 15.3l-1.4-1.4M6.1 6.1 4.7 4.7" stroke="currentColor" strokeLinecap="round" strokeWidth="1.5" />
    </svg>
  )
}

function MoonIcon() {
  return (
    <svg aria-hidden="true" fill="none" viewBox="0 0 20 20">
      <path d="M12.9 2.9a6.75 6.75 0 1 0 4.2 11.9A7.2 7.2 0 0 1 12.9 2.9Z" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
    </svg>
  )
}

export function AccountMenu({
  fullName,
  organizationName,
  role,
  themeMode = 'dark',
  onToggleTheme,
  items = DEFAULT_ITEMS,
  onAction,
  onLogout,
}: AccountMenuProps) {
  const [isOpen, setIsOpen] = useState(false)
  const wrapRef = useRef<HTMLDivElement>(null)
  const triggerGroupRef = useRef<HTMLDivElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const [dropdownStyle, setDropdownStyle] = useState<Record<string, number>>({})
  const sessionProfile = readAuthProfile()

  useLayoutEffect(() => {
    if (!isOpen) return undefined

    function updateDropdownPosition() {
      const triggerGroup = triggerGroupRef.current
      if (!triggerGroup) return

      const rect = triggerGroup.getBoundingClientRect()
      const gutter = 12
      const preferredWidth = 320
      const width = Math.min(preferredWidth, Math.max(280, window.innerWidth - gutter * 2))
      const left = Math.min(Math.max(rect.left, gutter), window.innerWidth - width - gutter)
      const top = rect.bottom + 12
      const maxHeight = Math.max(220, window.innerHeight - top - gutter)

      setDropdownStyle({ top, left, width, maxHeight })
    }

    updateDropdownPosition()
    window.addEventListener('resize', updateDropdownPosition)
    window.addEventListener('scroll', updateDropdownPosition, true)
    return () => {
      window.removeEventListener('resize', updateDropdownPosition)
      window.removeEventListener('scroll', updateDropdownPosition, true)
    }
  }, [isOpen])

  useEffect(() => {
    if (!isOpen) return undefined

    function closeOnOutside(event: MouseEvent) {
      const target = event.target as Node
      if (!wrapRef.current?.contains(target) && !panelRef.current?.contains(target)) {
        setIsOpen(false)
      }
    }

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', closeOnOutside)
    document.addEventListener('keydown', closeOnEscape)
    return () => {
      document.removeEventListener('mousedown', closeOnOutside)
      document.removeEventListener('keydown', closeOnEscape)
    }
  }, [isOpen])

  function handleItemClick(id: string) {
    setIsOpen(false)
    if (id === 'logout') {
      onLogout?.()
      return
    }
    onAction?.(id)
  }

  const resolvedFullName = sessionProfile
    ? [sessionProfile.firstName, sessionProfile.lastName].filter(Boolean).join(' ') || sessionProfile.username
    : fullName
  const resolvedOrganizationName = sessionProfile?.organizationName || organizationName
  const resolvedRole = sessionProfile?.role || role
  const initials = getInitials(resolvedFullName)
  const displayName = getDisplayName(resolvedFullName)
  const roleLabel = ROLE_LABELS[resolvedRole] ?? resolvedRole
  const dropdown = (
    <div
      className="account-dropdown account-dropdown-floating"
      ref={panelRef}
      role="menu"
      style={dropdownStyle}
    >
      <div className="account-dropdown-profile">
        <span className="account-dropdown-avatar" aria-hidden>{initials}</span>
        <div className="account-dropdown-identity">
          <strong>{resolvedFullName}</strong>
          <span>{roleLabel}</span>
          <span className="account-plan-badge">{resolvedOrganizationName}</span>
        </div>
      </div>

      <div className="account-dropdown-section" role="group" aria-label="Account">
        {items.map((item) => (
          <button
            key={item.id}
            className={`account-dropdown-item${item.danger ? ' danger' : ''}`}
            onClick={() => handleItemClick(item.id)}
            role="menuitem"
            type="button"
          >
            <span className="account-item-icon" aria-hidden>{item.icon}</span>
            {item.label}
          </button>
        ))}
      </div>
    </div>
  )

  return (
    <div className="account-menu-wrap account-menu-ref" ref={wrapRef}>
      <div className="account-trigger-group" ref={triggerGroupRef}>
        <button
          aria-expanded={isOpen}
          aria-haspopup="menu"
          aria-label="User menu"
          className={`account-name-trigger ${isOpen ? 'open' : ''}`}
          onClick={() => setIsOpen((prev) => !prev)}
          type="button"
        >
          <span className="account-name-trigger-leading" aria-hidden>
            <ChevronIcon />
          </span>
          <span className="account-name-trigger-text">
            <strong>{displayName}</strong>
            <span>{resolvedOrganizationName}</span>
          </span>
        </button>

        <button
          aria-label={themeMode === 'light' ? 'Switch to dark theme' : 'Switch to light theme'}
          className="account-theme-trigger"
          onClick={onToggleTheme}
          title={themeMode === 'light' ? 'Dark theme' : 'Light theme'}
          type="button"
        >
          <span className="account-theme-trigger-icon" aria-hidden>
            {themeMode === 'light' ? <MoonIcon /> : <SunIcon />}
          </span>
        </button>
      </div>

      {isOpen ? createPortal(dropdown, document.body) : null}
    </div>
  )
}
