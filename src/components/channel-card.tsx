import { LIVE_STATE_META } from '../data/constants'
import type { Channel } from '../types'
import { StatusDot } from './status-dot'

interface ChannelCardProps {
  channel: Channel
  isAlerting?: boolean
  isSelected: boolean
  onSelect: (channelId: string) => void
}

function getCaptureBadge(channel: Channel): string {
  if (channel.captureMode === 'local_agent') {
    switch (channel.localAgentStatus?.state) {
      case 'connected':
        return 'Local Agent'
      case 'degraded':
        return 'Agent Limited'
      default:
        return 'Agent Offline'
    }
  }

  return 'Browser'
}

export function ChannelCard({ channel, isAlerting, isSelected, onSelect }: ChannelCardProps) {
  const lastMessageTime = channel.messages.at(-1)?.time ?? '--:--'
  const lastMessagePreview = channel.messages.at(-1)?.text.trim() || channel.watchScope
  const statusMeta = LIVE_STATE_META[channel.liveState]
  const isGroup = channel.type === 'group'
  const memberCount = channel.members.length
  const enabledOperations = channel.operations.filter((operation) => operation.enabled).length

  return (
    <button
      className={`chat-list-item ${isSelected ? 'selected' : ''} ${isGroup ? 'chat-list-item-group' : ''} ${isAlerting ? 'channel-alerting' : ''}`}
      onClick={() => onSelect(channel.id)}
      type="button"
    >
      {channel.lastFrameDataUrl && !isGroup ? (
        <img
          className="chat-avatar chat-avatar-image"
          src={channel.lastFrameDataUrl}
          alt={`Latest frame from ${channel.name}`}
          loading="lazy"
        />
      ) : (
        <div className={`chat-avatar ${isGroup ? 'chat-avatar-group' : ''}`}>
          {isGroup ? (memberCount > 0 ? memberCount : 'G') : 'C'}
        </div>
      )}

      <div className="chat-list-copy">
        <div className="chat-list-row chat-list-row-primary">
          <div className="chat-list-title-stack">
            <strong>{channel.name}</strong>
            <span className="chat-list-location">{channel.location}</span>
          </div>
          <div className="chat-list-time-stack">
            <span className="timestamp">{lastMessageTime}</span>
            {channel.unread > 0 ? <span className="unread-pill">{channel.unread}</span> : null}
          </div>
        </div>

        <p className="chat-list-preview" title={lastMessagePreview}>
          {lastMessagePreview}
        </p>

        <div className="chat-list-row secondary">
          <span className="chat-pill chat-pill-live">
            <StatusDot liveState={channel.liveState} className="channel-status-dot" />
            {statusMeta?.label ?? 'Unavailable'}
          </span>
          <span className="chat-pill group-type-badge" title={getCaptureBadge(channel)}>
            {getCaptureBadge(channel)}
          </span>
          {enabledOperations > 0 ? <span className="chat-pill">OPS {enabledOperations}</span> : null}
          {isGroup ? (
            <span className="chat-pill group-type-badge" title="Group conversation">
              GROUP · {memberCount}
            </span>
          ) : null}
        </div>
      </div>
    </button>
  )
}
