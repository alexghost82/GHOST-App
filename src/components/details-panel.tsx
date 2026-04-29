import { useEffect, useRef } from 'react'
import { LIVE_STATE_META, OPERATION_MODE_META } from '../data/constants'
import type { Channel } from '../types'
import { StatusDot } from './status-dot'

interface DetailsPanelProps {
  selectedChannel: Channel
  isDetailsCollapsed: boolean
  onSetMobilePanelChat: () => void
  onCollapseDetails: () => void
  onOpenChannelsHub: () => void
}

export function DetailsPanel({
  selectedChannel,
  isDetailsCollapsed,
  onSetMobilePanelChat,
  onCollapseDetails,
  onOpenChannelsHub,
}: DetailsPanelProps) {
  const shellRef = useRef<HTMLElement>(null)
  const statusMeta = LIVE_STATE_META[selectedChannel.liveState]
  const statusLabel = statusMeta?.label ?? 'לא זמין'
  const enabledOps = selectedChannel.operations.filter((operation) => operation.enabled)
  const linkedCount = selectedChannel.linkedChannelIds?.length ?? 0
  const captureModeLabel = selectedChannel.captureMode === 'local_agent' ? 'סוכן מקומי' : 'דפדפן'
  const localAgentStateLabel =
    selectedChannel.localAgentStatus?.state === 'connected'
      ? 'מחובר'
      : selectedChannel.localAgentStatus?.state === 'degraded'
        ? 'מוגבל'
        : 'לא מחובר'

  useEffect(() => {
    if (isDetailsCollapsed) {
      return undefined
    }
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') {
        return
      }
      const shell = shellRef.current
      if (shell?.contains(document.activeElement)) {
        onCollapseDetails()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isDetailsCollapsed, onCollapseDetails])

  return (
    <aside
      ref={shellRef}
      aria-hidden={isDetailsCollapsed}
      className={`panel details-panel ${isDetailsCollapsed ? 'drawer-closed' : 'drawer-open'}`}
    >
      <div className="details-content">
        <div className="dp-header">
          <div className="dp-header-top">
            <p className="dp-eyebrow">מבט ערוץ</p>
            <div className="dp-header-actions">
              <button aria-label="צמצום חלון הפרטים" className="ghost-button desktop-only" onClick={onCollapseDetails} type="button">
                צמצם
              </button>
              <button className="ghost-button mobile-only" onClick={onSetMobilePanelChat} type="button">
                חזרה
              </button>
            </div>
          </div>
          <h2 className="dp-channel-name">{selectedChannel.name}</h2>
          <div className="dp-status-badge">
            <StatusDot className="channel-status-dot" liveState={selectedChannel.liveState} />
            <span className="dp-status-label">{statusLabel}</span>
          </div>
        </div>

        <div className="dp-section dp-hub-cta">
          <div className="dp-hub-cta-inner">
            <p className="dp-hub-cta-text">
              השתמש ב<strong>ערוצים</strong> כדי לערוך מקורות, חוקים, חברים וקישורים. השאר את פעילות חיה ממוקדת בניטור ובטריאז'.
            </p>
            <button className="primary-button dp-hub-cta-btn" onClick={onOpenChannelsHub} type="button">
              פתח ניהול ערוצים
            </button>
          </div>
        </div>

        <div className="dp-section">
          <div className="dp-section-header">
            <h3 className="dp-section-title">תמונת מצב ערוץ</h3>
            <span className="dp-section-badge">לקריאה בלבד</span>
          </div>
          <dl className="dp-fields">
            <div className="dp-field">
              <dt>שם</dt>
              <dd>{selectedChannel.name}</dd>
            </div>
            <div className="dp-field">
              <dt>מיקום</dt>
              <dd>{selectedChannel.location || 'לא הוגדר'}</dd>
            </div>
            <div className="dp-field">
              <dt>טווח צפייה</dt>
              <dd>{selectedChannel.watchScope || 'לא הוגדר'}</dd>
            </div>
            <div className="dp-field">
              <dt>סוג</dt>
              <dd>{selectedChannel.type === 'group' ? 'ערוץ קבוצה' : 'ערוץ אישי'}</dd>
            </div>
          </dl>
        </div>

        <div className="dp-section">
          <div className="dp-section-header">
            <h3 className="dp-section-title">מצב מקור</h3>
            <span className="dp-section-badge">{captureModeLabel}</span>
          </div>
          <dl className="dp-fields">
            <div className="dp-field">
              <dt>RTSP</dt>
              <dd className="dp-field-mono">{selectedChannel.rtspFeed || 'לא הוגדר'}</dd>
            </div>
            <div className="dp-field">
              <dt>מרווח זיכרון</dt>
              <dd>{selectedChannel.memoryInterval} שנ'</dd>
            </div>
            <div className="dp-field">
              <dt>צינור מצלמה</dt>
              <dd>{selectedChannel.captureMode === 'local_agent' ? 'סוכן מקומי' : 'לכידה מהדפדפן'}</dd>
            </div>
            <div className="dp-field">
              <dt>סוכן מקומי</dt>
              <dd>{localAgentStateLabel}</dd>
            </div>
          </dl>
        </div>

        <div className="dp-section">
          <div className="dp-section-header">
            <h3 className="dp-section-title">תמונת מצב חוקים</h3>
            <span className="dp-section-badge">{enabledOps.length}/{selectedChannel.operations.length}</span>
          </div>

          {selectedChannel.operations.length === 0 ? (
            <p className="dp-empty-hint">לא מוגדרים חוקים לערוץ הזה.</p>
          ) : (
            <div className="dp-ops-list">
              {selectedChannel.operations.map((operation) => (
                <article key={operation.id} className={`dp-op-card ${operation.enabled ? 'dp-op-active' : 'dp-op-paused'}`}>
                  <div className="dp-op-top">
                    <div className="dp-op-identity">
                      <span className={`dp-op-indicator ${operation.enabled ? 'on' : 'off'}`} />
                      <div className="dp-op-name-wrap">
                        <strong className="dp-op-name">{operation.name}</strong>
                        <span className="dp-op-state-label">{operation.enabled ? 'פעיל' : 'מושהה'}</span>
                      </div>
                    </div>
                  </div>

                  <dl className="dp-op-meta">
                    <div className="dp-op-meta-row">
                      <dt>מצב</dt>
                      <dd>{OPERATION_MODE_META[operation.mode].label}</dd>
                    </div>
                    <div className="dp-op-meta-row">
                      <dt>תזמון</dt>
                      <dd>{operation.schedule || '—'}</dd>
                    </div>
                    <div className="dp-op-meta-row">
                      <dt>טריגר</dt>
                      <dd>{operation.trigger || '—'}</dd>
                    </div>
                  </dl>
                </article>
              ))}
            </div>
          )}
        </div>

        <div className="dp-section">
          <div className="dp-section-header">
            <h3 className="dp-section-title">חברים וקישורים</h3>
            <span className="dp-section-badge">{selectedChannel.members.length + linkedCount}</span>
          </div>
          <dl className="dp-fields">
            <div className="dp-field">
              <dt>חברים</dt>
              <dd>{selectedChannel.members.length > 0 ? selectedChannel.members.join(', ') : 'אין חברים'}</dd>
            </div>
            <div className="dp-field">
              <dt>ערוצים מקושרים</dt>
              <dd>{linkedCount > 0 ? `${linkedCount} ערוצים מקושרים` : 'אין ערוצים מקושרים'}</dd>
            </div>
          </dl>
        </div>
      </div>
    </aside>
  )
}
