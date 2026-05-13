import type { CriticalAlertItem } from '../utils/critical-alerts'

interface CriticalAlertsCenterProps {
  alerts: CriticalAlertItem[]
  onClose: () => void
  onSelectChannel: (channelId: string) => void
  onApprove: (alert: CriticalAlertItem) => void
  onIgnore: (alert: CriticalAlertItem) => void
  onDelete: (alert: CriticalAlertItem) => void
  embedded?: boolean
}

export function CriticalAlertsCenter({
  alerts,
  onClose,
  onSelectChannel,
  onApprove,
  onIgnore,
  onDelete,
  embedded = false,
}: CriticalAlertsCenterProps) {
  const pendingCount = alerts.filter((alert) => alert.status === 'pending').length
  const approvedCount = alerts.filter((alert) => alert.status === 'approved').length
  const ignoredCount = alerts.filter((alert) => alert.status === 'ignored').length

  const content = (
    <section className={`alerts-center${embedded ? ' alerts-center-embedded' : ''}`} aria-label="מרכז התראות קריטיות">
      <header className="alerts-center-header">
        <div>
          <p className="eyebrow">התראות</p>
          <h3>התראות קריטיות</h3>
        </div>
        <div className="alerts-center-stats" aria-label="סטטוס התראות">
          <span>{pendingCount} פתוחות</span>
          <span>{approvedCount} אושרו</span>
          <span>{ignoredCount} הושתקו</span>
        </div>
      </header>

      <div className="alerts-center-list" role="list">
        {alerts.length === 0 ? (
          <div className="alerts-center-empty card">
            <p className="eyebrow">תקין</p>
            <p>כרגע אין התראות קריטיות במערכת.</p>
          </div>
        ) : (
          alerts.map((alert) => (
            <article key={alert.messageId} className={`alerts-center-item alerts-center-item-${alert.status}`} role="listitem">
              <div className="alerts-center-item-head">
                <div className="alerts-center-item-title-wrap">
                  <p className="alerts-center-item-channel">{alert.channelName}</p>
                  <h4>{alert.operationName}</h4>
                </div>
                <span className={`alerts-center-status-badge status-${alert.status}`}>
                  {alert.status === 'pending'
                    ? 'ממתין'
                    : alert.status === 'approved'
                      ? 'אושר'
                      : 'הושתק'}
                </span>
              </div>

              <dl className="alerts-center-meta">
                <div>
                  <dt>שעה</dt>
                  <dd>{alert.time}</dd>
                </div>
                <div>
                  <dt>ערוץ</dt>
                  <dd>{alert.channelName}</dd>
                </div>
              </dl>

              <p className="alerts-center-summary">{alert.summary}</p>
              {alert.frameDataUrl ? (
                <div className="alerts-center-frame-wrap">
                  <img
                    alt={`פריים של התראה קריטית - ${alert.channelName}`}
                    className="alerts-center-frame-preview"
                    src={alert.frameDataUrl}
                  />
                </div>
              ) : null}

              <div className="alerts-center-actions">
                <button className="ghost-button" onClick={() => onSelectChannel(alert.channelId)} type="button">
                  פתח ערוץ
                </button>
                <button
                  className="primary-button"
                  disabled={alert.status === 'approved'}
                  onClick={() => onApprove(alert)}
                  type="button"
                >
                  אשר
                </button>
                <button
                  className="ghost-button"
                  disabled={alert.status === 'ignored'}
                  onClick={() => onIgnore(alert)}
                  type="button"
                >
                  התעלם
                </button>
                <button className="danger-button" onClick={() => onDelete(alert)} type="button">
                  מחק
                </button>
              </div>
            </article>
          ))
        )}
      </div>

      {!embedded ? (
        <footer className="alerts-center-footer">
          <button className="ghost-button" onClick={onClose} type="button">
            סגור
          </button>
        </footer>
      ) : null}
    </section>
  )

  if (embedded) {
    return content
  }

  return (
    <div aria-modal className="brand-modal-overlay alerts-center-overlay" role="dialog">
      {content}
    </div>
  )
}
