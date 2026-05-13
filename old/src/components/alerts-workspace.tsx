import { useEffect, useMemo, useState } from 'react'
import type { CriticalAlertItem } from '../utils/critical-alerts'

interface AlertsWorkspaceProps {
  alerts: CriticalAlertItem[]
  onApprove: (alert: CriticalAlertItem) => void
  onIgnore: (alert: CriticalAlertItem) => void
  onDelete: (alert: CriticalAlertItem) => void
  onSelectChannel: (channelId: string) => void
}

type AlertStatusFilter = 'all' | 'pending' | 'approved' | 'ignored'

const ALERT_STATUS_LABELS: Record<AlertStatusFilter, string> = {
  all: 'הכול',
  pending: 'ממתין',
  approved: 'אושר',
  ignored: 'הוזנח',
}

export function AlertsWorkspace({
  alerts,
  onApprove,
  onIgnore,
  onDelete,
  onSelectChannel,
}: AlertsWorkspaceProps) {
  const [statusFilter, setStatusFilter] = useState<AlertStatusFilter>('all')
  const [channelFilter, setChannelFilter] = useState('all')
  const [selectedAlertId, setSelectedAlertId] = useState<string | null>(alerts[0]?.messageId ?? null)

  const channelOptions = useMemo(
    () => ['all', ...new Set(alerts.map((alert) => alert.channelName))],
    [alerts],
  )

  const filteredAlerts = useMemo(() => {
    return alerts.filter((alert) => {
      if (statusFilter !== 'all' && alert.status !== statusFilter) {
        return false
      }
      if (channelFilter !== 'all' && alert.channelName !== channelFilter) {
        return false
      }
      return true
    })
  }, [alerts, channelFilter, statusFilter])

  useEffect(() => {
    if (filteredAlerts.length === 0) {
      setSelectedAlertId(null)
      return
    }
    if (!selectedAlertId || !filteredAlerts.some((alert) => alert.messageId === selectedAlertId)) {
      setSelectedAlertId(filteredAlerts[0].messageId)
    }
  }, [filteredAlerts, selectedAlertId])

  const activeAlert = filteredAlerts.find((alert) => alert.messageId === selectedAlertId) ?? null
  const pendingCount = alerts.filter((alert) => alert.status === 'pending').length
  const approvedCount = alerts.filter((alert) => alert.status === 'approved').length
  const ignoredCount = alerts.filter((alert) => alert.status === 'ignored').length
  const impactedChannelsCount = new Set(alerts.map((alert) => alert.channelId)).size

  return (
    <main className="surface-screen alerts-workspace">
      <header className="surface-screen-header">
        <div>
          <p className="eyebrow">התראות</p>
          <h2>טריאז׳ אירועים</h2>
          <p className="surface-screen-copy">
            התחילו כאן כשמשהו דורש תשומת לב מפעיל: סננו את התור, בדקו ראיות, פעלו על האירוע ואז חזרו לפעילות החיה.
          </p>
        </div>
      </header>

      <section className="overview-metric-strip alerts-summary-strip" aria-label="סיכום מצב התראות">
        <article className="overview-metric-card tone-critical">
          <p className="overview-metric-label">התראות קריטיות ממתינות</p>
          <strong className="overview-metric-value">{pendingCount}</strong>
          <span className="overview-metric-detail">אירועים פתוחים הממתינים לפעולת מפעיל</span>
        </article>
        <article className="overview-metric-card tone-success">
          <p className="overview-metric-label">אושרו</p>
          <strong className="overview-metric-value">{approvedCount}</strong>
          <span className="overview-metric-detail">אירועים שאומתו</span>
        </article>
        <article className="overview-metric-card tone-warning">
          <p className="overview-metric-label">הוזנחו</p>
          <strong className="overview-metric-value">{ignoredCount}</strong>
          <span className="overview-metric-detail">אירועים שנסגרו ללא טיפול</span>
        </article>
        <article className="overview-metric-card tone-info">
          <p className="overview-metric-label">ערוצים מושפעים</p>
          <strong className="overview-metric-value">{impactedChannelsCount}</strong>
          <span className="overview-metric-detail">ערוצים המופיעים כעת בתור הזה</span>
        </article>
      </section>

      <div className="alerts-layout">
        <section className="surface-card alerts-list-card">
          <div className="surface-card-header">
            <div>
              <p className="eyebrow">תור</p>
              <h3>תור התראות</h3>
            </div>
            <span className="dp-section-badge">{filteredAlerts.length}</span>
          </div>

          <div className="alerts-filter-bar">
            <label className="alerts-filter-field">
              <span>סטטוס</span>
              <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as AlertStatusFilter)}>
                <option value="all">הכול</option>
                <option value="pending">ממתין</option>
                <option value="approved">אושר</option>
                <option value="ignored">הוזנח</option>
              </select>
            </label>
            <label className="alerts-filter-field">
              <span>ערוץ</span>
              <select value={channelFilter} onChange={(event) => setChannelFilter(event.target.value)}>
                {channelOptions.map((channelName) => (
                  <option key={channelName} value={channelName}>
                    {channelName === 'all' ? 'כל הערוצים' : channelName}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {filteredAlerts.length === 0 ? (
            <p className="surface-empty">אין התראות התואמות למסננים הנוכחיים.</p>
          ) : (
            <div className="alerts-workspace-list">
              {filteredAlerts.map((alert) => (
                <button
                  key={alert.messageId}
                  className={`alerts-workspace-row status-${alert.status}${selectedAlertId === alert.messageId ? ' active' : ''}`}
                  onClick={() => setSelectedAlertId(alert.messageId)}
                  type="button"
                >
                  <div>
                    <strong>{alert.channelName}</strong>
                    <p>{alert.operationName}</p>
                    <p>{alert.summary}</p>
                  </div>
                  <div className="alerts-detail-meta">
                    <span className={`alerts-status-chip status-${alert.status}`}>{ALERT_STATUS_LABELS[alert.status]}</span>
                    <span>{alert.time}</span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </section>

        <section className="surface-card alerts-detail-card">
          <div className="surface-card-header">
            <div>
              <p className="eyebrow">ראיות</p>
              <h3>{activeAlert ? activeAlert.operationName : 'לא נבחרה התראה'}</h3>
            </div>
          </div>

          {activeAlert ? (
            <div className="alerts-detail-body">
              <div className="alerts-detail-meta">
                <span>{activeAlert.channelName}</span>
                <span>{activeAlert.time}</span>
                <span className={`alerts-status-chip status-${activeAlert.status}`}>{ALERT_STATUS_LABELS[activeAlert.status]}</span>
              </div>

              <p className="alerts-detail-summary">{activeAlert.summary}</p>

              {activeAlert.frameDataUrl ? (
                <img
                  alt={`ראיית התראה קריטית עבור ${activeAlert.channelName}`}
                  className="alerts-detail-frame"
                  src={activeAlert.frameDataUrl}
                />
              ) : (
                <div className="alerts-detail-frame alerts-detail-frame-empty">לא צורפה ראיית פריים להתראה הזו.</div>
              )}

              <div className="alerts-detail-actions">
                <button className="ghost-button" onClick={() => onSelectChannel(activeAlert.channelId)} type="button">
                  פתח בפעילות חיה
                </button>
                <button className="primary-button" disabled={activeAlert.status === 'approved'} onClick={() => onApprove(activeAlert)} type="button">
                  אשר אירוע
                </button>
                <button className="ghost-button" disabled={activeAlert.status === 'ignored'} onClick={() => onIgnore(activeAlert)} type="button">
                  התעלם מהתראה
                </button>
                <button className="danger-button" onClick={() => onDelete(activeAlert)} type="button">
                  מחק התראה
                </button>
              </div>
            </div>
          ) : (
            <p className="surface-empty">בחר התראה מהתור כדי לבדוק את הראיות שלה.</p>
          )}
        </section>
      </div>
    </main>
  )
}
