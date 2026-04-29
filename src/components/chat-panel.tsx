import type { RefObject } from 'react'
import { LIVE_STATE_META, QUICK_PROMPTS } from '../data/constants'
import type { Channel } from '../types'
import { MessageRow } from './message-row'
import { StatusDot } from './status-dot'

interface ChatPanelProps {
  selectedChannel: Channel
  isSending: boolean
  messageDraft: string
  messageStreamRef: RefObject<HTMLDivElement | null>
  onDismissFrame: (messageId: string) => void
  onMessageDraftChange: (value: string) => void
  onMessageSubmit: (event: React.FormEvent<HTMLFormElement>) => void
  onShowInbox: () => void
  onShowDetails: () => void
  onShowOps: () => void
  onSuggestionClick: (prompt: string) => void
}

function getCaptureLabel(channel: Channel): string {
  if (channel.captureMode === 'local_agent') {
    switch (channel.localAgentStatus?.state) {
      case 'connected':
        return 'Local Agent Connected'
      case 'degraded':
        return 'Local Agent Limited'
      default:
        return 'Waiting For Local Agent'
    }
  }

  return 'Browser Camera Active'
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
  onShowOps,
  onSuggestionClick,
}: ChatPanelProps) {
  const statusLabel = LIVE_STATE_META[selectedChannel.liveState]?.label ?? 'Unavailable'
  const captureLabel = getCaptureLabel(selectedChannel)
  const enabledOperationsCount = selectedChannel.operations.filter((operation) => operation.enabled).length
  const latestMessage = selectedChannel.messages.at(-1)

  return (
    <section className="panel chat-panel chat-panel-wa">
      <div className="chat-header">
        <div className="chat-header-actions mobile-only">
          <button className="ghost-button" onClick={onShowInbox} type="button">
            Chats
          </button>
        </div>

        <div className="chat-title-block">
          <button
            aria-label="×¤×ª×™×—×ª ×¤×¨×˜×™ ×”×¢×¨×•×¥"
            className="title-cluster"
            onClick={onShowDetails}
            type="button"
          >
            {selectedChannel.lastFrameDataUrl ? (
              <img
                className="channel-badge channel-badge-image"
                src={selectedChannel.lastFrameDataUrl}
                alt={`Latest frame from ${selectedChannel.name}`}
              />
            ) : (
              <div className="channel-badge">{selectedChannel.type === 'group' ? 'Group' : 'Channel'}</div>
            )}
            <div className="title-cluster-text">
              <h2>{selectedChannel.name}</h2>
              <p className="route">{selectedChannel.location}</p>
            </div>
          </button>

          <div className="live-status-band">
            <div className="live-status">
              <StatusDot liveState={selectedChannel.liveState} className="live-dot" />
              <span>
                {statusLabel} / {captureLabel}
              </span>
            </div>
            <div className="chat-header-pills" aria-label="channel context">
              <span className="chat-header-pill">OPS {enabledOperationsCount}</span>
              <span className="chat-header-pill">MEM {selectedChannel.memoryInterval}s</span>
              <span className="chat-header-pill">TEAM {selectedChannel.members.length}</span>
            </div>
          </div>
        </div>

        <div className="chat-header-utility">
          <button className="ghost-button chat-ops-trigger" onClick={onShowOps} type="button">
            Ops
          </button>
          <div className="chat-header-actions desktop-only">
            <button className="ghost-button" onClick={onShowDetails} type="button">
              Details
            </button>
          </div>
        </div>
      </div>

      <div className="chat-context-strip" aria-label="chat summary">
        <article className="chat-context-card">
          <span className="chat-context-label">WATCH</span>
          <strong>{selectedChannel.watchScope}</strong>
        </article>
        <article className="chat-context-card">
          <span className="chat-context-label">LAST UPDATE</span>
          <strong>{latestMessage?.time ?? '--:--'}</strong>
        </article>
        <article className="chat-context-card">
          <span className="chat-context-label">MODE</span>
          <strong>{selectedChannel.type === 'group' ? 'GROUP' : 'DIRECT'}</strong>
        </article>
      </div>

      <div className="message-stream" ref={messageStreamRef}>
        {selectedChannel.messages.length > 0 ? (
          selectedChannel.messages.map((message) => (
            <MessageRow key={message.id} message={message} onDismissFrame={onDismissFrame} />
          ))
        ) : (
          <div className="chat-empty-state">
            <span className="chat-empty-kicker">READY</span>
            <h3>{selectedChannel.name}</h3>
            <p>{selectedChannel.description || selectedChannel.watchScope}</p>
          </div>
        )}
      </div>

      <form className="composer" onSubmit={onMessageSubmit}>
        <div className="composer-suggestions">
          {QUICK_PROMPTS.map((prompt) => (
            <button key={prompt} className="chip-button" onClick={() => onSuggestionClick(prompt)} type="button">
              {prompt}
            </button>
          ))}
        </div>

        <div className="composer-shell">
          <button className="ghost-button composer-utility mobile-only" onClick={onShowDetails} type="button">
            Channel
          </button>
          <div className="composer-input-shell">
            <span className="composer-input-label">PROMPT</span>
            <textarea
              rows={1}
              value={messageDraft}
              onChange={(event) => onMessageDraftChange(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' && !event.shiftKey) {
                  event.preventDefault()
                  event.currentTarget.form?.requestSubmit()
                }
              }}
              placeholder="Ask a question or request an operational scan..."
            />
          </div>
          <button className="primary-button composer-send-button" disabled={isSending || !messageDraft.trim()} type="submit">
            {isSending ? 'Sending...' : 'Send'}
          </button>
        </div>

        <div className="composer-actions">
          <span className="composer-hint">Enter to send · Shift+Enter for a new line</span>
          <button className="ghost-button" onClick={onShowOps} type="button">
            Live Ops
          </button>
        </div>
      </form>
    </section>
  )
}
