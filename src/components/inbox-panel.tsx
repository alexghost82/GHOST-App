import { useEffect, useRef } from 'react'
import type { Channel } from '../types'
import { ChannelCard } from './channel-card'

interface InboxPanelProps {
  channels: Channel[]
  selectedChannelId: string
  isGroupingMode: boolean
  groupSelectionIds: string[]
  alertingChannelIds: Set<string>
  searchQuery: string
  visibleCount: number
  hasMoreChannels: boolean
  focusSearchToken: number
  onCreateNewChat: () => void
  onSelectChannel: (channelId: string) => void
  onOpenInboxMenu: () => void
  onToggleGroupingMode: () => void
  onToggleGroupSelection: (channelId: string) => void
  onCreateGroupFromSelection: () => void
  onSearchQueryChange: (value: string) => void
  onLoadMoreChannels: () => void
}

export function InboxPanel({
  channels,
  selectedChannelId,
  alertingChannelIds,
  searchQuery,
  visibleCount,
  hasMoreChannels,
  focusSearchToken,
  onCreateNewChat,
  onSelectChannel,
  onOpenInboxMenu,
  onSearchQueryChange,
  onLoadMoreChannels,
}: InboxPanelProps) {
  const searchInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (focusSearchToken === 0) {
      return
    }
    searchInputRef.current?.focus()
    searchInputRef.current?.select()
  }, [focusSearchToken])

  return (
    <aside className="panel inbox-panel">
      <div className="messenger-sidebar-header">
        <div className="inbox-appbar-profile">
          <div className="inbox-appbar-avatar">גל</div>
          <div className="inbox-appbar-copy">
            <strong>גוסט לייב</strong>
            <span>תיבת ניטור מאובטחת</span>
          </div>
        </div>

        <div className="inbox-header-actions">
          <button aria-label="שיחה חדשה" className="messenger-circle-button" onClick={onCreateNewChat} type="button">
            <span aria-hidden>+</span>
          </button>
          <button aria-label="אפשרויות נוספות" className="messenger-circle-button" onClick={onOpenInboxMenu} type="button">
            <span aria-hidden>⋮</span>
          </button>
        </div>
      </div>

      <div className="inbox-search-bar">
        <div className="inbox-search-shell">
          <input
            className="inbox-search-input"
            ref={searchInputRef}
            value={searchQuery}
            onChange={(event) => onSearchQueryChange(event.target.value)}
            placeholder="חפש או פתח שיחה חדשה"
          />
        </div>
      </div>

      <div className="inbox-messages-title">
        <h3>שיחות</h3>
        <span>{channels.length}</span>
      </div>

      <div className="chat-list">
        {channels.slice(0, visibleCount).map((channel) => (
          <div className="chat-list-entry" key={channel.id}>
            <ChannelCard
              channel={channel}
              isAlerting={alertingChannelIds.has(channel.id)}
              isSelected={channel.id === selectedChannelId}
              onSelect={onSelectChannel}
            />
          </div>
        ))}

        {hasMoreChannels ? (
          <button className="load-more-button" onClick={onLoadMoreChannels} type="button">
            טען שיחות נוספות
          </button>
        ) : null}
      </div>
    </aside>
  )
}
