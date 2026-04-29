import type { Channel } from '../types'
import { ChannelCard } from './channel-card'

interface InboxPanelProps {
  channels: Channel[]
  selectedChannelId: string
  isGroupingMode: boolean
  groupSelectionIds: string[]
  alertingChannelIds: Set<string>
  searchQuery: string
  activeFilter: 'all' | 'live' | 'attention' | 'groups' | 'offline'
  visibleCount: number
  hasMoreChannels: boolean
  onSelectChannel: (channelId: string) => void
  onToggleGroupingMode: () => void
  onToggleGroupSelection: (channelId: string) => void
  onCreateGroupFromSelection: () => void
  onSearchQueryChange: (value: string) => void
  onFilterChange: (value: 'all' | 'live' | 'attention' | 'groups' | 'offline') => void
  onLoadMoreChannels: () => void
}

export function InboxPanel({
  channels,
  selectedChannelId,
  isGroupingMode,
  groupSelectionIds,
  alertingChannelIds,
  searchQuery,
  activeFilter,
  visibleCount,
  hasMoreChannels,
  onSelectChannel,
  onToggleGroupingMode,
  onToggleGroupSelection,
  onCreateGroupFromSelection,
  onSearchQueryChange,
  onFilterChange,
  onLoadMoreChannels,
}: InboxPanelProps) {
  const unreadConversationCount = channels.filter((channel) => channel.unread > 0).length
  const liveConversationCount = channels.filter((channel) => channel.liveState === 'LIVE').length
  const attentionCount = channels.filter((channel) => alertingChannelIds.has(channel.id) || channel.liveState === 'DEGRADED').length

  return (
    <aside className="panel inbox-panel">
      <div className="panel-header inbox-appbar">
        <div className="inbox-appbar-copy">
          <p className="eyebrow">GHOST LIVE</p>
          <h2>Active Conversations</h2>
        </div>
        <div className="inbox-header-actions inbox-appbar-actions">
          <button className="ghost-button" onClick={onToggleGroupingMode} type="button">
            {isGroupingMode ? 'Done Selecting' : 'Select Channels'}
          </button>
        </div>
      </div>

      <div className="inbox-appbar-status">
        <article className="inbox-stat-card">
          <span className="inbox-stat-label">TOTAL</span>
          <strong>{channels.length}</strong>
          <small>tracked chats</small>
        </article>
        <article className="inbox-stat-card">
          <span className="inbox-stat-label">LIVE</span>
          <strong>{liveConversationCount}</strong>
          <small>online channels</small>
        </article>
        <article className="inbox-stat-card">
          <span className="inbox-stat-label">FOCUS</span>
          <strong>{attentionCount || unreadConversationCount}</strong>
          <small>need review</small>
        </article>
      </div>

      {isGroupingMode ? (
        <div className="card inbox-grouping-card">
          <p className="inbox-grouping-hint">Select at least two direct channels, then create one operational group in a single step.</p>
          <button
            className="primary-button"
            disabled={groupSelectionIds.length < 2}
            onClick={onCreateGroupFromSelection}
            type="button"
          >
            Create Group ({groupSelectionIds.length})
          </button>
        </div>
      ) : null}

      <div className="inbox-search-bar">
        <div className="inbox-search-shell">
          <span className="inbox-search-kicker">SEARCH</span>
          <input
            className="inbox-search-input"
            value={searchQuery}
            onChange={(event) => onSearchQueryChange(event.target.value)}
            placeholder="Search channel, group, or message..."
          />
        </div>
      </div>

      <div className="inbox-filter-row" role="group" aria-label="conversation filters">
        {[
          { id: 'all', label: 'All' },
          { id: 'live', label: 'Live' },
          { id: 'attention', label: 'Attention' },
          { id: 'groups', label: 'Groups' },
          { id: 'offline', label: 'Offline' },
        ].map((filter) => (
          <button
            key={filter.id}
            className={`inbox-filter-chip${activeFilter === filter.id ? ' active' : ''}`}
            onClick={() => onFilterChange(filter.id as 'all' | 'live' | 'attention' | 'groups' | 'offline')}
            type="button"
          >
            {filter.label}
          </button>
        ))}
      </div>

      <div className="chat-list">
        {channels.slice(0, visibleCount).map((channel) => {
          const isGroupCandidate = channel.type === 'personal'
          const isChecked = groupSelectionIds.includes(channel.id)

          return (
            <div className="chat-list-entry" key={channel.id}>
              {isGroupingMode ? (
                <label className="chat-list-group-toggle" title={isGroupCandidate ? 'Select for grouping' : 'Only direct channels can be grouped'}>
                  <input
                    checked={isChecked}
                    disabled={!isGroupCandidate}
                    onChange={() => onToggleGroupSelection(channel.id)}
                    type="checkbox"
                  />
                </label>
              ) : null}

              <ChannelCard
                channel={channel}
                isAlerting={alertingChannelIds.has(channel.id)}
                isSelected={channel.id === selectedChannelId}
                onSelect={onSelectChannel}
              />
            </div>
          )
        })}

        {hasMoreChannels ? (
          <button className="ghost-button load-more-button" onClick={onLoadMoreChannels} type="button">
            Load More
          </button>
        ) : null}
      </div>
    </aside>
  )
}
