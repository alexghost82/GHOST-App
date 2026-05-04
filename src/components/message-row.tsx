import type { Message } from '../types'

interface MessageRowProps {
  message: Message
  onDismissFrame?: (messageId: string) => void
}

const ALERT_LABEL_MAP: Record<string, string> = {
  critical: 'Critical alert',
  routine: 'Routine scan',
  report: 'Report',
  rating: 'Rating',
  assessment: 'Assessment',
}

export function MessageRow({ message, onDismissFrame }: MessageRowProps) {
  const hasFrame = Boolean(message.frameDataUrl)
  const levelClass = message.alertLevel ? `alert-${message.alertLevel}` : ''
  const isOutgoing = message.author === 'user'
  const isSystem = message.author === 'system'
  const label = message.alertLevel ? ALERT_LABEL_MAP[message.alertLevel] : null

  return (
    <article className={`message-row ${message.author} ${levelClass}`.trim()}>
      <div className="message-body">
        {label ? <span className="message-scan-label">{label}</span> : null}

        <div className="message-bubble">
          {isSystem ? <span className="message-author-tag">System</span> : null}
          {!isOutgoing && !isSystem ? <span className="message-author-tag">Ghost</span> : null}
          <p>{message.text}</p>

          {message.sources && message.sources.length > 0 ? (
            <div className="source-tags">
              {message.sources.map((source) => (
                <span key={source}>{source}</span>
              ))}
            </div>
          ) : null}

          <span className="timestamp">
            {message.time}
            {message.alertLevel === 'rating' && message.score != null ? ` · ${message.score}/10` : ''}
          </span>
        </div>

        {hasFrame ? (
          <div className="message-frame-wrap">
            <img alt="Frame preview" className="message-frame-preview" src={message.frameDataUrl} />
            {onDismissFrame ? (
              <button
                className="message-frame-dismiss"
                onClick={() => onDismissFrame(message.id)}
                title="Dismiss frame"
                type="button"
              >
                ×
              </button>
            ) : null}
          </div>
        ) : null}
      </div>
    </article>
  )
}
