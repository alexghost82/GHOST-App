import type { FormEvent, RefObject } from 'react'
import type { Channel, TimelineSamplerState } from '../types'
import { resolveChannelAvatarDataUrl } from '../utils/channel-avatar'
import { MessageRow } from './message-row'
import { StatusDot } from './status-dot'

interface NextScanInfo {
  deadline: number
  operationName: string
  totalCycleMs: number
}

interface ChatPanelProps {
  selectedChannel: Channel
  isSending: boolean
  messageDraft: string
  messageStreamRef: RefObject<HTMLDivElement | null>
  activeOpsCount: number
  nextScanInfo: NextScanInfo | null
  timelineSamplerState: TimelineSamplerState
  onDismissFrame: (messageId: string) => void
  onMessageDraftChange: (value: string) => void
  onMessageSubmit: (event: FormEvent<HTMLFormElement>) => void
  onStartTimelineSampling: (intervalSeconds: 2 | 4 | 8) => void
  onStopTimelineSampling: () => void
  onShowInbox: () => void
  onShowDetails: () => void
  onSuggestionClick: (prompt: string) => void
  onMessageStreamScroll: () => void
}

export function ChatPanel({
  selectedChannel,
  isSending,
  messageDraft,
  messageStreamRef,
  onDismissFrame,
  onMessageDraftChange,
  onMessageSubmit,
  onShowInbox,
  onShowDetails,
  onMessageStreamScroll,
}: ChatPanelProps) {
  const presenceLabel = selectedChannel.liveState === 'LIVE' ? 'פעיל כעת' : 'במעקב'
  const lastSeenLabel = selectedChannel.messages.at(-1)?.time ?? '--:--'
  const avatarDataUrl = resolveChannelAvatarDataUrl(selectedChannel)

  return (
    <section className="panel chat-panel">
      <header className="chat-header">
        <div className="chat-header-main">
          <button className="ghost-button mobile-only" onClick={onShowInbox} type="button">
            שיחות
          </button>

          <button aria-label="פתח פרטי ערוץ" className="title-cluster" onClick={onShowDetails} type="button">
            {avatarDataUrl ? (
              <img
                className="chat-avatar chat-avatar-image"
                src={avatarDataUrl}
                alt={selectedChannel.name}
              />
            ) : (
              <div className="chat-avatar">
                {selectedChannel.type === 'group' ? 'ק' : selectedChannel.name.slice(0, 1).toUpperCase()}
              </div>
            )}

            <div className="title-cluster-text">
              <h2>{selectedChannel.name}</h2>
              <p className="route">
                <StatusDot liveState={selectedChannel.liveState} className="channel-status-dot" />
                <span>{presenceLabel}</span>
                <span className="header-meta-separator">·</span>
                <span>{lastSeenLabel}</span>
              </p>
            </div>
          </button>
        </div>

        <div className="chat-header-utility">
          <button aria-label="פרטי ערוץ" className="messenger-icon-button" onClick={onShowDetails} type="button">
            <span aria-hidden>⋮</span>
          </button>
        </div>
      </header>

      <div className="message-stream" onScroll={onMessageStreamScroll} ref={messageStreamRef}>
        {selectedChannel.messages.length === 0 ? (
          <div className="chat-empty-state">
            <span className="chat-empty-kicker">סיכום מוצפן</span>
            <h3>אין עדיין הודעות</h3>
            <p>התחל את השיחה או בקש ניתוח מצלמה חדש מהערוץ הזה.</p>
          </div>
        ) : (
          selectedChannel.messages.map((message) => (
            <MessageRow key={message.id} message={message} onDismissFrame={onDismissFrame} />
          ))
        )}
      </div>

      <form className="composer" onSubmit={onMessageSubmit}>
        <div className="composer-shell">
          <div className="composer-input-shell">
            <label className="composer-input-label" htmlFor="live-ops-composer">
              הודעה
            </label>
            <textarea
              id="live-ops-composer"
              rows={1}
              value={messageDraft}
              onChange={(event) => onMessageDraftChange(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' && !event.shiftKey) {
                  event.preventDefault()
                  event.currentTarget.form?.requestSubmit()
                }
              }}
              placeholder="הקלד הודעה"
            />
          </div>

          <button
            aria-label={isSending ? 'שולח הודעה' : 'שלח הודעה'}
            className="composer-send-button"
            disabled={isSending || !messageDraft.trim()}
            type="submit"
          >
            <span aria-hidden>{isSending ? '…' : '➤'}</span>
          </button>
        </div>
      </form>
    </section>
  )
}
