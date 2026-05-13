import { LIVE_STATE_META } from '../data/constants'
import type { Channel } from '../types'
import type { CriticalAlertItem } from '../utils/critical-alerts'

interface OverviewScreenProps {
  channels: Channel[]
  criticalAlerts: CriticalAlertItem[]
  totalOperations: number
  totalLiveFeeds: number
  onOpenLiveOps: (channelId?: string) => void
  onOpenChannels: () => void
  onOpenAlerts: () => void
  onReportIssue: () => void
}

function MetricCard({
  label,
  value,
  tone = 'neutral',
  detail,
}: {
  label: string
  value: string | number
  tone?: 'neutral' | 'info' | 'success' | 'warning' | 'critical'
  detail: string
}) {
  return (
    <article className={`overview-metric-card tone-${tone}`}>
      <p className="overview-metric-label">{label}</p>
      <strong className="overview-metric-value">{value}</strong>
      <span className="overview-metric-detail">{detail}</span>
    </article>
  )
}

export function OverviewScreen({
  channels,
  criticalAlerts,
  totalOperations,
  totalLiveFeeds,
  onOpenLiveOps,
  onOpenChannels,
  onOpenAlerts,
  onReportIssue,
}: OverviewScreenProps) {
  const pendingAlerts = criticalAlerts.filter((alert) => alert.status === 'pending')
  const offlineChannels = channels.filter((channel) => channel.liveState === 'OFFLINE')
  const degradedChannels = channels.filter((channel) => channel.liveState === 'DEGRADED')
  const channelsNeedingAttention = [...offlineChannels, ...degradedChannels]
  const localAgentConnected = channels.filter((channel) => channel.captureMode === 'local_agent' && channel.localAgentStatus?.state === 'connected').length
  const recentlyActiveChannels = [...channels].sort((a, b) => b.unread - a.unread).slice(0, 5)
  const topPriorityAlert = pendingAlerts[0] ?? null
  const highlightedRules = channels.flatMap((channel) =>
    channel.operations
      .filter((operation) => operation.enabled)
      .slice(0, 2)
      .map((operation) => ({
        id: `${channel.id}_${operation.id}`,
        channelName: channel.name,
        operationName: operation.name,
        schedule: operation.schedule || 'Manual trigger',
      })),
  ).slice(0, 6)

  return (
    <main className="surface-screen overview-screen">
      <header className="surface-screen-header">
        <div>
          <p className="eyebrow">סקירה</p>
          <h2>מה דורש תשומת לב עכשיו</h2>
          <p className="surface-screen-copy">
            השתמש במסך הזה כדי למיין התראות דחופות, לבדוק כשירות חיה ולהבין מה השתנה לפני הכניסה לפעילות החיה.
          </p>
        </div>
        <div className="surface-screen-actions">
          <button className="primary-button" onClick={() => onOpenLiveOps()} type="button">
            פתח פעילות חיה
          </button>
          <button className="ghost-button" onClick={onReportIssue} type="button">
            דווח על תקלה
          </button>
        </div>
      </header>

      <section className="overview-metric-strip" aria-label="סיכום מצב מערכת">
        <MetricCard
          detail={`${channels.length} ערוצים בסך הכול`}
          label="ערוצים חיים"
          tone={totalLiveFeeds === channels.length ? 'success' : 'info'}
          value={totalLiveFeeds}
        />
        <MetricCard detail="אוטומציות וחוקים מתוזמנים פעילים" label="חוקים פעילים" tone="info" value={totalOperations} />
        <MetricCard
          detail={pendingAlerts.length > 0 ? 'דורש טריאז׳' : 'אין אירועים דחופים'}
          label="התראות קריטיות"
          tone={pendingAlerts.length > 0 ? 'critical' : 'success'}
          value={pendingAlerts.length}
        />
        <MetricCard
          detail={`${localAgentConnected} סוכנים מקומיים מחוברים`}
          label="כשירות לקוח מקומי"
          tone={offlineChannels.length > 0 ? 'warning' : 'success'}
          value={offlineChannels.length > 0 ? 'דורש תשומת לב' : 'תקין'}
        />
      </section>

      <section className="surface-card overview-priority-panel" aria-label="סיכום עדיפויות">
        <div className="surface-card-header">
          <div>
            <p className="eyebrow">עדיפות כעת</p>
            <h3>{topPriorityAlert ? 'אירוע קריטי דורש טריאז׳' : channelsNeedingAttention.length > 0 ? 'כשירות הערוצים דורשת תשומת לב' : 'אין פעולה דחופה למפעיל'}</h3>
          </div>
          {topPriorityAlert ? (
            <button className="primary-button" onClick={onOpenAlerts} type="button">
              עבור להתראות
            </button>
          ) : channelsNeedingAttention.length > 0 ? (
            <button className="ghost-button" onClick={onOpenChannels} type="button">
              עבור לערוצים
            </button>
          ) : (
            <button className="ghost-button" onClick={() => onOpenLiveOps()} type="button">
              פתח פעילות חיה
            </button>
          )}
        </div>

        {topPriorityAlert ? (
          <button className="overview-priority-callout" onClick={() => onOpenLiveOps(topPriorityAlert.channelId)} type="button">
            <span className="overview-alert-badge">קריטי</span>
            <div>
              <strong>{topPriorityAlert.channelName}</strong>
              <p>{topPriorityAlert.summary}</p>
            </div>
            <span>{topPriorityAlert.time}</span>
          </button>
        ) : channelsNeedingAttention.length > 0 ? (
          <div className="overview-priority-list">
            {channelsNeedingAttention.slice(0, 3).map((channel) => (
              <button key={channel.id} className="overview-health-row" onClick={() => onOpenLiveOps(channel.id)} type="button">
                <div>
                  <strong>{channel.name}</strong>
                  <p>{channel.location}</p>
                </div>
                <span>{LIVE_STATE_META[channel.liveState]?.label ?? channel.liveState}</span>
              </button>
            ))}
          </div>
        ) : (
          <p className="surface-empty">כל הערוצים החיים תקינים ואין התראות קריטיות ממתינות.</p>
        )}
      </section>

      <div className="overview-grid">
        <section className="surface-card overview-card">
          <div className="surface-card-header">
            <div>
              <p className="eyebrow">טריאז׳</p>
              <h3>סיכום התראות קריטיות</h3>
            </div>
            <button className="ghost-button" onClick={onOpenAlerts} type="button">
              עבור להתראות
            </button>
          </div>
          {pendingAlerts.length === 0 ? (
            <p className="surface-empty">אין התראות קריטיות ממתינות.</p>
          ) : (
            <div className="overview-alert-list">
              {pendingAlerts.slice(0, 4).map((alert) => (
                <button
                  key={alert.messageId}
                  className="overview-alert-item"
                  onClick={() => onOpenLiveOps(alert.channelId)}
                  type="button"
                >
                  <span className="overview-alert-badge">קריטי</span>
                  <div>
                    <strong>{alert.channelName}</strong>
                    <p>{alert.summary}</p>
                  </div>
                  <span className="overview-alert-time">{alert.time}</span>
                </button>
              ))}
            </div>
          )}
        </section>

        <section className="surface-card overview-card">
          <div className="surface-card-header">
            <div>
              <p className="eyebrow">כשירות</p>
              <h3>לוח כשירות ערוצים</h3>
            </div>
            <button className="ghost-button" onClick={onOpenChannels} type="button">
              פתח ערוצים
            </button>
          </div>
          <div className="overview-health-board">
            {channels.slice(0, 8).map((channel) => (
              <button
                key={channel.id}
                className={`overview-health-row state-${channel.liveState.toLowerCase()}`}
                onClick={() => onOpenLiveOps(channel.id)}
                type="button"
              >
                <div>
                  <strong>{channel.name}</strong>
                  <p>{channel.location}</p>
                </div>
                <span>{LIVE_STATE_META[channel.liveState]?.label ?? channel.liveState}</span>
              </button>
            ))}
          </div>
        </section>

        <section className="surface-card overview-card">
          <div className="surface-card-header">
            <div>
              <p className="eyebrow">אוטומציה</p>
              <h3>תמונת מצב חוקים מתוזמנים</h3>
            </div>
          </div>
          <div className="overview-rule-list">
            {highlightedRules.length === 0 ? (
              <p className="surface-empty">עדיין לא הוגדרו חוקים פעילים.</p>
            ) : (
              highlightedRules.map((rule) => (
                <article key={rule.id} className="overview-rule-item">
                  <strong>{rule.operationName}</strong>
                  <p>{rule.channelName}</p>
                  <span>{rule.schedule}</span>
                </article>
              ))
            )}
          </div>
        </section>

        <section className="surface-card overview-card">
          <div className="surface-card-header">
            <div>
              <p className="eyebrow">פעילות</p>
              <h3>אירועים אחרונים ופעולות מפעיל</h3>
            </div>
          </div>
          <div className="overview-activity-list">
            {recentlyActiveChannels.length === 0 ? (
              <p className="surface-empty">אין פעילות אחרונה.</p>
            ) : (
              recentlyActiveChannels.map((channel) => (
                <button
                  key={channel.id}
                  className="overview-activity-item"
                  onClick={() => onOpenLiveOps(channel.id)}
                  type="button"
                >
                  <div>
                    <strong>{channel.name}</strong>
                    <p>{channel.messages.at(-1)?.text ?? 'עדיין אין היסטוריית הודעות.'}</p>
                  </div>
                  <span>{channel.messages.at(-1)?.time ?? '--:--'}</span>
                </button>
              ))
            )}
          </div>
          {(offlineChannels.length > 0 || degradedChannels.length > 0) ? (
            <div className="overview-risk-banner">
              <strong>{offlineChannels.length + degradedChannels.length} ערוצים דורשים תשומת לב.</strong>
              <span>
                {offlineChannels.length} לא מקוונים, {degradedChannels.length} במצב מוגבל.
              </span>
            </div>
          ) : null}
        </section>
      </div>
    </main>
  )
}
