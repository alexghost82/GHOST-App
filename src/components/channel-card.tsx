import { LIVE_STATE_META } from '../data/constants'
import type { Channel } from '../types'
import { resolveChannelAvatarDataUrl } from '../utils/channel-avatar'
import { StatusDot } from './status-dot'

interface ChannelCardProps {
  channel: Channel
  isAlerting?: boolean
  isSelected: boolean
  onSelect: (channelId: string) => void
}

function buildPreview(channel: Channel): string {
  const message = channel.messages.at(-1)
  if (!message) {
    return channel.watchScope || channel.location || 'אין עדיין הודעות'
  }

  if (message.author === 'user') {
    return `אתה: ${message.text}`
  }

  if (message.author === 'system') {
    return `מערכת: ${message.text}`
  }

  return message.text
}

export function ChannelCard({ channel, isAlerting, isSelected, onSelect }: ChannelCardProps) {
  const lastMessageTime = channel.messages.at(-1)?.time ?? '--:--'
  const preview = buildPreview(channel)
  const statusMeta = LIVE_STATE_META[channel.liveState]
  const avatarDataUrl = resolveChannelAvatarDataUrl(channel)
  const avatarText = channel.type === 'group'
    ? `${Math.min(channel.members.length || 2, 99)}`
    : channel.name.slice(0, 1).toUpperCase()

  return (
    <button
      className={`chat-list-item ${isSelected ? 'selected' : ''} ${isAlerting ? 'channel-alerting' : ''}`}
      onClick={() => onSelect(channel.id)}
      type="button"
    >
      {avatarDataUrl ? (
        <img className="chat-avatar chat-avatar-image" src={avatarDataUrl} alt={channel.name} loading="lazy" />
      ) : (
        <div className="chat-avatar">{avatarText}</div>
      )}

      <div className="chat-list-copy">
        <div className="chat-list-row-primary">
          <div className="chat-list-title-stack">
            <strong>{channel.name}</strong>
            <span className={`chat-list-location status-label-${channel.liveState.toLowerCase()}`}>
              <StatusDot liveState={channel.liveState} className="channel-status-dot" />
              {statusMeta?.label ?? 'לא זמין'}
            </span>
          </div>
          <div className="chat-list-time-stack">
            <span className="timestamp">{lastMessageTime}</span>
            {channel.unread > 0 ? <span className="unread-pill">{channel.unread}</span> : null}
          </div>
        </div>

        <p className="chat-list-preview" title={preview}>
          {preview}
        </p>
      </div>
    </button>
  )
}
