interface MobileSectionHeaderProps {
  eyebrow?: string
  title: string
  description?: string
  backLabel?: string
  onBack?: () => void
  action?: React.ReactNode
}

interface MobileTabItem {
  id: string
  label: string
  badge?: string | number
}

interface MobileTabBarProps {
  ariaLabel: string
  items: MobileTabItem[]
  activeId: string
  onChange: (id: string) => void
  className?: string
}

interface MobileSurfaceCardProps {
  title?: string
  eyebrow?: string
  description?: string
  children: React.ReactNode
  className?: string
}

interface StickyPrimaryActionProps {
  label: string
  onClick: () => void
  disabled?: boolean
}

export function MobileSectionHeader({
  eyebrow,
  title,
  description,
  backLabel = 'חזרה',
  onBack,
  action,
}: MobileSectionHeaderProps) {
  return (
    <header className="mobile-section-header">
      <div className="mobile-section-header-top">
        {onBack ? (
          <button className="ghost-button mobile-back-button" onClick={onBack} type="button">
            {backLabel}
          </button>
        ) : null}
        {action ? <div className="mobile-section-header-action">{action}</div> : null}
      </div>

      {eyebrow ? <p className="eyebrow mobile-section-eyebrow">{eyebrow}</p> : null}
      <h2 className="mobile-section-title">{title}</h2>
      {description ? <p className="mobile-section-description">{description}</p> : null}
    </header>
  )
}

export function MobileTabBar({
  ariaLabel,
  items,
  activeId,
  onChange,
  className = '',
}: MobileTabBarProps) {
  return (
    <nav aria-label={ariaLabel} className={`mobile-tab-bar ${className}`.trim()}>
      {items.map((item) => (
        <button
          key={item.id}
          className={`mobile-tab-bar-button${item.id === activeId ? ' active' : ''}`}
          onClick={() => onChange(item.id)}
          type="button"
        >
          <span>{item.label}</span>
          {item.badge !== undefined ? <span className="mobile-tab-bar-badge">{item.badge}</span> : null}
        </button>
      ))}
    </nav>
  )
}

export function MobileSurfaceCard({
  title,
  eyebrow,
  description,
  children,
  className = '',
}: MobileSurfaceCardProps) {
  return (
    <section className={`mobile-surface-card ${className}`.trim()}>
      {title || eyebrow || description ? (
        <div className="mobile-surface-card-head">
          {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
          {title ? <h3>{title}</h3> : null}
          {description ? <p>{description}</p> : null}
        </div>
      ) : null}
      {children}
    </section>
  )
}

export function StickyPrimaryAction({ label, onClick, disabled = false }: StickyPrimaryActionProps) {
  return (
    <div className="mobile-sticky-action">
      <button className="primary-button" disabled={disabled} onClick={onClick} type="button">
        {label}
      </button>
    </div>
  )
}
