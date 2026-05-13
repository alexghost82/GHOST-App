import { useEffect, useRef } from 'react'
import { LIVE_STATE_META, OPERATION_MODE_META } from '../data/constants'
import type { Channel } from '../types'
import { resolveChannelAvatarDataUrl } from '../utils/channel-avatar'
import { StatusDot } from './status-dot'

interface DetailsPanelProps {
  selectedChannel: Channel
  isDetailsCollapsed: boolean
  onSetMobilePanelChat: () => void
  onExpandDetails: () => void
  onCollapseDetails: () => void
  onToggleOperation: (operationId: string) => void
  onOpenChannelsHub: () => void
  onOpenChannelOperationsHub: () => void
}

function formatCaptureRoute(channel: Channel): string {
  return channel.captureMode === 'local_agent' ? 'Installed local client' : 'Browser camera'
}

function formatAgentHeartbeat(lastHeartbeatAtIso?: string): string {
  if (!lastHeartbeatAtIso) {
    return 'No heartbeat yet'
  }
  const parsed = new Date(lastHeartbeatAtIso)
  return Number.isNaN(parsed.getTime()) ? lastHeartbeatAtIso : parsed.toLocaleString('he-IL')
}

export function DetailsPanel({
  selectedChannel,
  isDetailsCollapsed,
  onSetMobilePanelChat,
  onCollapseDetails,
  onToggleOperation,
  onOpenChannelsHub,
  onOpenChannelOperationsHub,
}: DetailsPanelProps) {
  const shellRef = useRef<HTMLElement>(null)
  const statusMeta = LIVE_STATE_META[selectedChannel.liveState]
  const enabledOpsCount = selectedChannel.operations.filter((operation) => operation.enabled).length
  const avatarDataUrl = resolveChannelAvatarDataUrl(selectedChannel)

  useEffect(() => {
    if (isDetailsCollapsed) {
      return undefined
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape' && shellRef.current?.contains(document.activeElement)) {
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
      <div className="messenger-details-header">
        <button className="ghost-button mobile-only" onClick={onSetMobilePanelChat} type="button">
          חזרה
        </button>
        <strong>פרטי ערוץ</strong>
        <button className="ghost-button desktop-only close-label-button" onClick={onCollapseDetails} type="button">
          סגור
        </button>
      </div>

      <div className="details-content">
        <div className="dp-header">
          {avatarDataUrl ? (
            <img className="messenger-profile-avatar" src={avatarDataUrl} alt={selectedChannel.name} />
          ) : (
            <div className="messenger-profile-avatar">{selectedChannel.name.slice(0, 1).toUpperCase()}</div>
          )}
          <h2 className="dp-channel-name">{selectedChannel.name}</h2>
          <p className="messenger-profile-subtitle">{selectedChannel.location || selectedChannel.watchScope || 'ערוץ חי'}</p>
          <div className={`dp-status-badge dp-status-badge-${selectedChannel.liveState.toLowerCase()}`}>
            <StatusDot className="channel-status-dot" liveState={selectedChannel.liveState} />
            <span>{statusMeta?.label ?? 'לא זמין'}</span>
          </div>
        </div>

        <section className="dp-section">
          <div className="dp-section-header">
            <h3 className="dp-section-title">פרטי הערוץ</h3>
            <button className="ghost-button" onClick={onOpenChannelsHub} type="button">
              נהל
            </button>
          </div>
          <dl className="dp-fields">
            <div className="dp-field">
              <dt>סוג</dt>
              <dd>{selectedChannel.type === 'group' ? 'קבוצתי' : 'אישי'}</dd>
            </div>
            <div className="dp-field">
              <dt>מיקום</dt>
              <dd>{selectedChannel.location || 'לא הוגדר'}</dd>
            </div>
            <div className="dp-field">
              <dt>היקף ניטור</dt>
              <dd>{selectedChannel.watchScope || 'לא הוגדר'}</dd>
            </div>
            <div className="dp-field">
              <dt>RTSP</dt>
              <dd className="dp-field-mono">{selectedChannel.rtspFeed || 'לא הוגדר'}</dd>
            </div>
            <div className="dp-field">
              <dt>Capture route</dt>
              <dd>{formatCaptureRoute(selectedChannel)}</dd>
            </div>
            <div className="dp-field">
              <dt>Snapshot interval</dt>
              <dd>Every {selectedChannel.memoryInterval} sec</dd>
            </div>
            <div className="dp-field">
              <dt>חברים</dt>
              <dd>
                <div className="dp-tags">
                  {selectedChannel.members.length > 0 ? (
                    selectedChannel.members.map((member) => <span key={member} className="dp-tag">{member}</span>)
                  ) : (
                    <span className="dp-empty-hint">אין חברים</span>
                  )}
                </div>
              </dd>
            </div>
          </dl>
        </section>

        <section className="dp-section">
          <div className="dp-section-header">
            <h3 className="dp-section-title">Local client</h3>
          </div>
          <dl className="dp-fields">
            <div className="dp-field">
              <dt>Client</dt>
              <dd>{selectedChannel.localAgentBinding?.deviceName || 'Not bound'}</dd>
            </div>
            <div className="dp-field">
              <dt>Camera</dt>
              <dd>{selectedChannel.localAgentBinding?.cameraLabel || 'Not assigned'}</dd>
            </div>
            <div className="dp-field">
              <dt>Source</dt>
              <dd>{selectedChannel.localAgentBinding?.cameraSourceType || 'Not assigned'}</dd>
            </div>
            <div className="dp-field">
              <dt>Agent status</dt>
              <dd>{selectedChannel.localAgentStatus?.state || 'offline'}</dd>
            </div>
            <div className="dp-field">
              <dt>Heartbeat</dt>
              <dd>{formatAgentHeartbeat(selectedChannel.localAgentStatus?.lastHeartbeatAtIso)}</dd>
            </div>
            <div className="dp-field">
              <dt>Last error</dt>
              <dd>{selectedChannel.localAgentStatus?.lastError || 'None'}</dd>
            </div>
          </dl>
        </section>

        <section className="dp-section">
          <div className="dp-section-header">
            <h3 className="dp-section-title">אוטומציות</h3>
            <span className="dp-section-badge">{enabledOpsCount}/{selectedChannel.operations.length}</span>
            <button className="ghost-button mobile-only" onClick={onOpenChannelOperationsHub} type="button">
              נהל מבצעים
            </button>
          </div>

          {selectedChannel.operations.length === 0 ? (
            <p className="dp-empty-hint">לא הוגדרו אוטומציות לערוץ הזה.</p>
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

                    <button
                      className={`operation-toggle ${operation.enabled ? 'enabled' : ''}`}
                      onClick={() => onToggleOperation(operation.id)}
                      type="button"
                    >
                      <span className="operation-toggle-thumb" />
                    </button>
                  </div>

                  <dl className="dp-op-meta">
                    <div className="dp-op-meta-row">
                      <dt>מצב</dt>
                      <dd>{OPERATION_MODE_META[operation.mode].label}</dd>
                    </div>
                    <div className="dp-op-meta-row">
                      <dt>לו״ז</dt>
                      <dd>{operation.schedule || 'לא הוגדר'}</dd>
                    </div>
                    <div className="dp-op-meta-row">
                      <dt>טריגר</dt>
                      <dd>{operation.trigger || 'לא הוגדר'}</dd>
                    </div>
                  </dl>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </aside>
  )
}
