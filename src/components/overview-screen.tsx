import { LIVE_STATE_META } from '../data/constants'
import type { Channel } from '../types'
import type { CriticalAlertItem } from '../utils/critical-alerts'
import { getLastVisibleChannelMessage } from '../utils/chat-messages'

interface OverviewScreenProps {
  channels: Channel[]
  criticalAlerts: CriticalAlertItem[]
  totalOperations: number
  totalLiveFeeds: number
  isLoading?: boolean
  loadError?: string
  onOpenLiveOps: (channelId?: string) => void
  onOpenChannels: () => void
  onOpenAlerts: () => void
  onReportIssue: () => void
  onRetry?: () => void
}

function clampPercent(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)))
}

function buildSparklinePath(values: number[]) {
  const safeValues = values.length > 0 ? values : [0, 0, 0, 0]
  const maxValue = Math.max(...safeValues, 1)
  const lastIndex = Math.max(safeValues.length - 1, 1)

  return safeValues
    .map((value, index) => {
      const x = (index / lastIndex) * 100
      const y = 100 - (value / maxValue) * 100
      return `${index === 0 ? 'M' : 'L'} ${x} ${y}`
    })
    .join(' ')
}

function formatTelemetryTime(date: Date) {
  return new Intl.DateTimeFormat('he-IL', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).format(date)
}

function MetricCard({
  label,
  value,
  tone = 'neutral',
  progress = 0,
  detail,
}: {
  label: string
  value: string | number
  tone?: 'neutral' | 'info' | 'success' | 'warning' | 'critical'
  progress?: number
  detail: string
}) {
  return (
    <article className={`overview-metric-card tone-${tone}`}>
      <div className="overview-metric-head">
        <p className="overview-metric-label">{label}</p>
        <span className={`overview-metric-chip tone-${tone}`}>{tone}</span>
      </div>
      <strong className="overview-metric-value">{value}</strong>
      <div className="overview-metric-rail" aria-hidden="true">
        <span style={{ width: `${clampPercent(progress)}%` }} />
      </div>
      <span className="overview-metric-detail">{detail}</span>
    </article>
  )
}

function SignalChart({
  title,
  subtitle,
  values,
}: {
  title: string
  subtitle: string
  values: number[]
}) {
  const linePath = buildSparklinePath(values)
  const areaPath = `${linePath} L 100 100 L 0 100 Z`

  return (
    <section className="surface-card overview-chart-card">
      <div className="surface-card-header">
        <div>
          <p className="eyebrow">זרימת אותות</p>
          <h3>{title}</h3>
        </div>
        <span className="overview-inline-meta">{subtitle}</span>
      </div>
      <div className="overview-chart-shell" aria-hidden="true">
        <div className="overview-chart-grid" />
        <svg className="overview-chart-svg" viewBox="0 0 100 100" preserveAspectRatio="none">
          <defs>
            <linearGradient id="overview-signal-fill" x1="0%" x2="100%" y1="0%" y2="0%">
              <stop offset="0%" stopColor="rgba(0, 209, 255, 0.35)" />
              <stop offset="100%" stopColor="rgba(124, 255, 178, 0.05)" />
            </linearGradient>
            <linearGradient id="overview-signal-line" x1="0%" x2="100%" y1="0%" y2="0%">
              <stop offset="0%" stopColor="#00d1ff" />
              <stop offset="100%" stopColor="#7cffb2" />
            </linearGradient>
          </defs>
          <path d={areaPath} fill="url(#overview-signal-fill)" opacity="0.95" />
          <path className="overview-chart-line" d={linePath} fill="none" stroke="url(#overview-signal-line)" strokeWidth="2.2" />
        </svg>
      </div>
      <div className="overview-chart-footer">
        <span>מיזוג זרמים עם השהיה נמוכה</span>
        <span>פולס ניתוח בזמן אמת</span>
      </div>
    </section>
  )
}

function HeroOrb() {
  return (
    <div className="overview-orb" aria-hidden="true">
      <span className="overview-orb-ring ring-a" />
      <span className="overview-orb-ring ring-b" />
      <span className="overview-orb-ring ring-c" />
      <span className="overview-orb-core" />
      <svg className="overview-orb-network" viewBox="0 0 240 240">
        <path d="M38 118 C74 48, 165 44, 210 118 C176 194, 78 202, 38 118Z" />
        <path d="M62 72 L178 164" />
        <path d="M64 162 L176 78" />
        <path d="M118 30 L118 210" />
        <path d="M36 118 L208 118" />
        <circle cx="62" cy="72" r="5" />
        <circle cx="178" cy="164" r="5" />
        <circle cx="64" cy="162" r="4.5" />
        <circle cx="176" cy="78" r="4.5" />
        <circle cx="118" cy="30" r="4.5" />
        <circle cx="118" cy="210" r="4.5" />
        <circle cx="36" cy="118" r="4" />
        <circle cx="208" cy="118" r="4" />
        <circle cx="118" cy="118" r="8" />
      </svg>
    </div>
  )
}

function LoadingSkeleton() {
  return (
    <div className="overview-loading-shell" aria-hidden="true">
      <div className="overview-loading-hero shimmer-block" />
      <div className="overview-loading-grid">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="overview-loading-card shimmer-block" />
        ))}
      </div>
    </div>
  )
}

export function OverviewScreen({
  channels,
  criticalAlerts,
  totalOperations,
  totalLiveFeeds,
  isLoading = false,
  loadError,
  onOpenLiveOps,
  onOpenChannels,
  onOpenAlerts,
  onReportIssue,
  onRetry,
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

  const totalChannels = channels.length
  const liveCoverage = totalChannels > 0 ? clampPercent((totalLiveFeeds / totalChannels) * 100) : 0
  const riskIndex = totalChannels > 0 ? clampPercent(((pendingAlerts.length * 18) + (channelsNeedingAttention.length * 12)) / totalChannels) : 0
  const localMeshCoverage = totalChannels > 0 ? clampPercent((localAgentConnected / totalChannels) * 100) : 0
  const systemState =
    pendingAlerts.length > 0 ? 'קריטי' : channelsNeedingAttention.length > 0 ? 'מוגבל' : 'תקין'
  const systemStateTone =
    pendingAlerts.length > 0 ? 'critical' : channelsNeedingAttention.length > 0 ? 'warning' : 'success'
  const heroTitle =
    topPriorityAlert
      ? 'אשכול חריגות דורש בדיקת מפעיל מיידית'
      : channelsNeedingAttention.length > 0
        ? 'זוהתה סטייה טלמטרית במספר משטחי ניטור'
        : 'רשת המערכת יציבה ומוכנה לפעילות חיה'
  const heroCopy =
    topPriorityAlert
      ? 'מומלץ להתמקד קודם באשכול ההתראות החם ביותר, ואז להיכנס לערוץ החי שנפגע לצורך טריאז׳ ובדיקת הראיות.'
      : channelsNeedingAttention.length > 0
        ? 'חלק מהערוצים נמצאים במצב מוגבל או לא מקוונים. השתמשו במבט מרכז הבקרה כדי לבודד חוליות חלשות לפני שהן הופכות לקריטיות.'
        : 'כל השידורים החיים תקינים, האוטומציות דרוכות, ואין כרגע אירוע דחוף שחוסם את תמונת המצב המבצעית.'
  const telemetrySeries = channels.slice(0, 8).map((channel) => {
    const enabledOps = channel.operations.filter((operation) => operation.enabled).length
    return Math.max(channel.messages.length, 1) + channel.unread * 2 + enabledOps * 3
  })
  const distributionRows = channels.slice(0, 6).map((channel) => {
    const intensity = clampPercent((channel.unread * 16) + (channel.operations.filter((operation) => operation.enabled).length * 14) + (channel.liveState === 'LIVE' ? 22 : 8))
    return {
      id: channel.id,
      name: channel.name,
      value: intensity,
      stateLabel: LIVE_STATE_META[channel.liveState]?.label ?? channel.liveState,
    }
  })
  const lastRefreshLabel = formatTelemetryTime(new Date())
  const hasNoData = !isLoading && channels.length === 0

  return (
    <main className="surface-screen overview-screen overview-screen-cyber">
      <header className="surface-screen-header">
        <div className="overview-hero-copy">
          <div className="overview-status-bar" aria-label="סטטוס כללי">
            <span className={`overview-status-pill tone-${systemStateTone}`}>{systemState}</span>
            <span className="overview-status-pill">סנכרון חי</span>
            <span className="overview-status-pill">רענון אחרון {lastRefreshLabel}</span>
          </div>
          <div>
            <p className="eyebrow">מרכז בקרה</p>
            <h2>{heroTitle}</h2>
            <p className="surface-screen-copy">{heroCopy}</p>
          </div>
          <div className="overview-hero-meta">
            <article className="overview-hero-stat">
              <span>כיסוי אות</span>
              <strong>{liveCoverage}%</strong>
              <p>{totalLiveFeeds} שידורים פעילים ברחבי הרשת</p>
            </article>
            <article className="overview-hero-stat">
              <span>שמירת AI</span>
              <strong>{totalOperations}</strong>
              <p>אוטומציות דרוכות לבדיקה בזמן אמת</p>
            </article>
            <article className="overview-hero-stat">
              <span>סוכנים מקומיים</span>
              <strong>{localMeshCoverage}%</strong>
              <p>{localAgentConnected} נקודות לכידה מחוברות</p>
            </article>
          </div>
        </div>
        <div className="surface-screen-actions overview-hero-actions">
          <button className="primary-button" onClick={() => onOpenLiveOps()} type="button">
            פתח פעילות חיה
          </button>
          <button className="ghost-button" onClick={onReportIssue} type="button">
            דווח על תקלה
          </button>
          <HeroOrb />
        </div>
      </header>

      {loadError ? (
        <section className="overview-banner overview-banner-error" role="alert">
          <div>
            <strong>סנכרון הערוצים דורש תשומת לב</strong>
            <p>{loadError}</p>
          </div>
          {onRetry ? (
            <button className="ghost-button" onClick={onRetry} type="button">
              נסה שוב
            </button>
          ) : null}
        </section>
      ) : null}

      {isLoading && channels.length === 0 ? <LoadingSkeleton /> : null}

      {hasNoData ? (
        <section className="surface-card overview-empty-state">
          <div>
            <p className="eyebrow">עדיין אין טלמטריה</p>
            <h3>חברו את הערוץ הראשון כדי להפעיל את לוח הבקרה.</h3>
            <p className="surface-screen-copy">
              לאחר חיבור שידור חי, המסך יתמלא במדדים בזמן אמת, דירוג כשירות, טריאז׳ התראות ותובנות אוטומציה.
            </p>
          </div>
          <div className="surface-screen-actions">
            <button className="primary-button" onClick={onOpenChannels} type="button">
              פתח ערוצים
            </button>
            <button className="ghost-button" onClick={onReportIssue} type="button">
              דווח על תקלה
            </button>
          </div>
        </section>
      ) : null}

      <section className="overview-metric-strip" aria-label="מדדי מערכת">
        <MetricCard
          detail={`${channels.length} ערוצים בסך הכל ברשת הניטור`}
          label="כיסוי חי"
          progress={liveCoverage}
          tone={totalLiveFeeds === channels.length ? 'success' : 'info'}
          value={`${liveCoverage}%`}
        />
        <MetricCard
          detail="חוקי זיהוי ואוטומציות מתוזמנות פעילים כעת"
          label="עומס אוטומציה"
          progress={clampPercent(totalOperations * 8)}
          tone="info"
          value={totalOperations}
        />
        <MetricCard
          detail={pendingAlerts.length > 0 ? 'תור ההסלמה דורש טריאז׳' : 'אין אירועים דחופים בתור'}
          label="מדד סיכון"
          progress={riskIndex}
          tone={pendingAlerts.length > 0 ? 'critical' : 'success'}
          value={`${riskIndex}%`}
        />
        <MetricCard
          detail={`${localAgentConnected} נקודות לכידה מקומיות מחוברות`}
          label="רשת סוכנים"
          progress={localMeshCoverage}
          tone={offlineChannels.length > 0 ? 'warning' : 'success'}
          value={offlineChannels.length > 0 ? 'דורש מעקב' : 'יציב'}
        />
      </section>

      <div className="overview-command-grid">
        <SignalChart
          subtitle="מודל פסאודו-זמן-אמת המבוסס על ערוצים פעילים"
          title="לחץ אותות ברשת"
          values={telemetrySeries}
        />

        <section className="surface-card overview-priority-panel" aria-label="סיכום עדיפויות">
          <div className="surface-card-header">
            <div>
              <p className="eyebrow">עדיפות כעת</p>
              <h3>{topPriorityAlert ? 'חריגה קריטית בתור המפעיל' : channelsNeedingAttention.length > 0 ? 'איכות השירות דורשת התערבות' : 'לא זוהה חסם מיידי'}</h3>
            </div>
            {topPriorityAlert ? (
              <button className="primary-button" onClick={onOpenAlerts} type="button">
                פתח התראות
              </button>
            ) : channelsNeedingAttention.length > 0 ? (
              <button className="ghost-button" onClick={onOpenChannels} type="button">
                בדוק ערוצים
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
            <p className="surface-empty">כל הערוצים הפעילים יציבים ואין התראות קריטיות ממתינות.</p>
          )}

          <div className="overview-distribution-list">
            {distributionRows.length === 0 ? (
              <p className="surface-empty">עדיין אין ערוצים חיים שתורמים אות למערכת.</p>
            ) : (
              distributionRows.map((row) => (
                <div key={row.id} className="overview-distribution-row">
                  <div>
                    <strong>{row.name}</strong>
                    <p>{row.stateLabel}</p>
                  </div>
                  <div className="overview-distribution-bar" aria-hidden="true">
                    <span style={{ width: `${row.value}%` }} />
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </div>

      <div className="overview-grid">
        <section className="surface-card overview-card">
          <div className="surface-card-header">
            <div>
              <p className="eyebrow">טריאז׳</p>
              <h3>זרם התראות קריטיות</h3>
            </div>
            <button className="ghost-button" onClick={onOpenAlerts} type="button">
              פתח התראות
            </button>
          </div>
          {pendingAlerts.length === 0 ? (
            <p className="surface-empty">אין התראות קריטיות הממתינות לאישור.</p>
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
              <h3>מטריצת מוכנות ערוצים</h3>
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
              <h3>מטריצת חוקים פעילים</h3>
            </div>
          </div>
          <div className="overview-rule-list">
            {highlightedRules.length === 0 ? (
              <p className="surface-empty">עדיין אין אוטומציות פעילות שמשדרות.</p>
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
              <h3>אירועי מפעיל ומודל אחרונים</h3>
            </div>
          </div>
          <div className="overview-activity-list">
            {recentlyActiveChannels.length === 0 ? (
              <p className="surface-empty">לא נרשמה פעילות אחרונה.</p>
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
                    <p>{getLastVisibleChannelMessage(channel)?.text ?? 'עדיין לא נלכדה היסטוריית הודעות.'}</p>
                  </div>
                  <span>{getLastVisibleChannelMessage(channel)?.time ?? '--:--'}</span>
                </button>
              ))
            )}
          </div>
          {(offlineChannels.length > 0 || degradedChannels.length > 0) ? (
            <div className="overview-risk-banner">
              <strong>{offlineChannels.length + degradedChannels.length} ערוצים דורשים התערבות.</strong>
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
