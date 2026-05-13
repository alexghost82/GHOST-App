import type { FormEvent, RefObject } from 'react'
import type { Channel, TimelineSamplerState } from '../types'
import { resolveChannelAvatarDataUrl } from '../utils/channel-avatar'
import { getVisibleChannelMessages } from '../utils/chat-messages'
import { LockIcon, SendIcon } from './chat-icons'
import { MessageRow } from './message-row'
import { StatusDot } from './status-dot'

const ROUTINE_REALTIME_UPDATE_PHRASE = 'עדכון שגרתי בזמן אמת'

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
  mobileLayout?: boolean
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
  mobileLayout = false,
}: ChatPanelProps) {
  const visibleMessages = getVisibleChannelMessages(selectedChannel).filter(
    (message) => !(message.author === 'system' && message.text.includes(ROUTINE_REALTIME_UPDATE_PHRASE)),
  )
  const isEmpty = visibleMessages.length === 0
  const presenceLabel = selectedChannel.liveState === 'LIVE' ? 'פעיל כעת' : 'במעקב'
  const lastSeenLabel = visibleMessages.at(-1)?.time ?? '--:--'
  const avatarDataUrl = resolveChannelAvatarDataUrl(selectedChannel)

  return (
    <section className={`panel chat-panel${mobileLayout ? ' chat-panel-mobile-design' : ''}${isEmpty ? ' chat-panel-empty' : ''}`}>
      {mobileLayout ? null : (
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
      )}

      <div className="message-stream" onScroll={onMessageStreamScroll} ref={messageStreamRef}>
        {isEmpty ? (
          <div className="chat-empty-state">
            <div className="chat-empty-hero" aria-hidden>
              <span className="chat-empty-hero-ring chat-empty-hero-ring-outer" />
              <span className="chat-empty-hero-ring chat-empty-hero-ring-inner" />
              <span className="chat-empty-hero-bubble">
                <ChatBubbleGlyph />
              </span>
              <span className="chat-empty-hero-spark chat-empty-hero-spark-primary">✦</span>
              <span className="chat-empty-hero-spark chat-empty-hero-spark-secondary">✦</span>
              <span className="chat-empty-hero-spark chat-empty-hero-spark-tertiary">✦</span>
            </div>
            <span className="chat-empty-kicker">
              <span>סיכום מוצפן</span>
              <LockIcon />
            </span>
            <h3>אין עדיין הודעות</h3>
            <p>התחל את השיחה או בקש ניתוח מצלמה חדש מהערוץ הזה.</p>
          </div>
        ) : (
          visibleMessages.map((message) => (
            <MessageRow key={message.id} message={message} onDismissFrame={onDismissFrame} />
          ))
        )}
      </div>

      <form className={`composer${mobileLayout ? ' composer-mobile-shell' : ''}`} onSubmit={onMessageSubmit}>
        <div className="composer-shell">
          {mobileLayout ? (
            <button aria-label="שלח הודעה" className="composer-mobile-accent-button composer-mobile-send-orb" disabled={isSending || !messageDraft.trim()} type="submit">
              {isSending ? <span aria-hidden>…</span> : <SendIcon />}
            </button>
          ) : null}

          <div className="composer-input-shell">
            {mobileLayout ? null : (
              <label className="composer-input-label" htmlFor="live-ops-composer">
                הודעה
              </label>
            )}
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
              placeholder={mobileLayout ? 'הקלד הודעה...' : 'הקלד הודעה'}
            />
          </div>

          {mobileLayout ? null : (
            <button
              aria-label={isSending ? 'שולח הודעה' : 'שלח הודעה'}
              className="composer-send-button"
              disabled={isSending || !messageDraft.trim()}
              type="submit"
            >
              <span aria-hidden>{isSending ? '…' : '➤'}</span>
            </button>
          )}
        </div>
      </form>
    </section>
  )
}

function ChatBubbleGlyph() {
  return (
    <svg aria-hidden="true" fill="none" height="28" viewBox="0 0 24 24" width="28">
      <path
        d="M6 18.7 3.5 21l.9-3.2A8.4 8.4 0 1 1 20.5 12c0 4.6-3.7 8.4-8.4 8.4H6Z"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.9"
      />
      <path d="M8.2 12h.01M12 12h.01M15.8 12h.01" stroke="currentColor" strokeLinecap="round" strokeWidth="2.2" />
    </svg>
  )
}
