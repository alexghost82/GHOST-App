import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { CSSProperties, FormEvent, TouchEvent } from 'react'
import './App.css'
import './styles/live-ops-chat.css'
import type { AccountMenuItem } from './components/account-menu'
import { AppFooter } from './components/app-footer'
import { ChatPanel } from './components/chat-panel'
import { CriticalAlertsCenter } from './components/critical-alerts-center'
import { DetailsPanel } from './components/details-panel'
import { FlashAlertOverlay } from './components/flash-alert-overlay'
import { GroupNameModal } from './components/group-name-modal'
import { InboxPanel } from './components/inbox-panel'
import { ChannelsHub } from './components/channels-hub'
import { MobileSectionHeader, MobileSurfaceCard, MobileTabBar } from './components/mobile-shell'
import { SurfaceDialog } from './components/surface-dialog'
import { Topbar } from './components/topbar'
import type { TopbarNavItem } from './components/topbar'
import {
  DEFAULT_NEW_CHANNEL_DRAFT,
  DEFAULT_OPERATION_DRAFT,
  INBOX_PAGE_SIZE,
  LIVE_STATE_META,
  MAX_TIMELINE_HISTORY_ITEMS,
} from './data/constants'
import {
  fetchChannels as fetchChannelsFromServer,
  saveMessage,
  createChannel as createChannelApi,
  updateChannel as updateChannelApi,
  deleteChannelApi,
  createOperationApi,
  updateOperationApi,
  deleteOperationApi,
} from './services/channels-api'
import type {
  Channel,
  Message,
  MobilePanel,
  NewChannelDraft,
  Operation,
  OperationDraft,
  OperationMode,
  OperatorMobileSection,
  TimelineAnalysis,
  TimelineSamplerState,
} from './types'
import { useOperationScheduler } from './hooks/use-operation-scheduler'
import type { OperationFiredPayload } from './hooks/use-operation-scheduler'
import { useTimelineSampler } from './hooks/use-timeline-sampler'
import { captureLatestCameraFrame, releaseCameraResources } from './services/camera-frame'
import { requestOperationScan } from './services/operation-scan'
import { parseSchedule } from './services/schedule-parser'
import { requestVisionReply } from './services/vision-chat'
import { reportIssue } from './services/issues-api'
import { recordChannelMessage } from './services/admin-api'
import { readAuthProfile } from './utils/auth-session'
import type { CriticalAlertStatus } from './utils/critical-alerts'
import { buildCriticalAlerts, hasPendingCriticalAlertsInChannel } from './utils/critical-alerts'
import { consumeChannelAlertPopupSlot } from './utils/alert-popup-rate-limit'
import { memberNamesFromLinkedChannelIds } from './utils/group-channel'
import { getCurrentTime, getMinutesSinceTimeLabel } from './utils/time'

function buildDefaultTimelineState(): TimelineSamplerState {
  return {
    isActive: false,
    intervalSeconds: 4,
    sampledFrames: [],
    analysisHistory: [],
  }
}

function formatTimelineHistoryContext(analysisHistory: TimelineAnalysis[]): string {
  return analysisHistory
    .slice(0, 5)
    .map(
      (analysis, index) =>
        `${index + 1}. טווח: ${analysis.timeRangeStartIso} עד ${analysis.timeRangeEndIso} | קצב: כל ${analysis.intervalSeconds} שנ׳ | סיכום: ${analysis.summary}`,
    )
    .join('\n')
}

const OPERATOR_DISPLAY_NAME = 'עומר'
const CHANNEL_ALERT_POPUP_COOLDOWN_MS = 20_000

interface GhostLiveIntelLine {
  text: string
  top: string
  left: string
  cycleSec: number
  delaySec: number
  fontSizePx: number
  maxWidth: string
}

const GHOSTLIVE_INTEL_LINES: GhostLiveIntelLine[] = [
  { text: 'OPS::queue depth=0 lag=2.4s', top: '8%', left: '3%', cycleSec: 7.6, delaySec: -1.2, fontSizePx: 10, maxWidth: '28ch' },
  { text: 'WATCH::heartbeat sensor=node-7 ok', top: '14%', left: '82%', cycleSec: 8.8, delaySec: -3.1, fontSizePx: 10, maxWidth: '32ch' },
  { text: 'NET::latency p50=42ms p99=180ms', top: '22%', left: '6%', cycleSec: 7.1, delaySec: -2.4, fontSizePx: 11, maxWidth: '31ch' },
  { text: 'FORENSICS::trace span=root sample=1.0', top: '28%', left: '78%', cycleSec: 8.4, delaySec: -4.6, fontSizePx: 10, maxWidth: '36ch' },
  { text: 'HEALTH::api availability=99.97% window=24h', top: '38%', left: '4%', cycleSec: 7.9, delaySec: -1.7, fontSizePx: 10, maxWidth: '42ch' },
  { text: 'WATCH::camera=alpha fps=24 codec=h264', top: '46%', left: '81%', cycleSec: 9.2, delaySec: -5.2, fontSizePx: 10, maxWidth: '36ch' },
  { text: 'SCAN::zone-bravo signature=clean', top: '56%', left: '5%', cycleSec: 8.1, delaySec: -2.8, fontSizePx: 11, maxWidth: '32ch' },
  { text: 'HEALTH::worker pool=8/8 idle=6', top: '64%', left: '79%', cycleSec: 8.7, delaySec: -6.4, fontSizePx: 10, maxWidth: '30ch' },
  { text: 'NET::websocket peers=1 reconnect=0', top: '72%', left: '7%', cycleSec: 7.3, delaySec: -3.7, fontSizePx: 10, maxWidth: '34ch' },
  { text: 'FORENSICS::evidence chain=verified count=12', top: '78%', left: '77%', cycleSec: 6.8, delaySec: -1.1, fontSizePx: 10, maxWidth: '42ch' },
  { text: 'WATCH::pattern_match result=clear', top: '86%', left: '9%', cycleSec: 9.5, delaySec: -4.3, fontSizePx: 11, maxWidth: '32ch' },
  { text: 'HEALTH::clock_drift=12ms ntp=synced', top: '92%', left: '75%', cycleSec: 7.4, delaySec: -2.2, fontSizePx: 10, maxWidth: '34ch' },
]

/**
 * בונה ניסוח אישי ודחוף להתראה קריטית על בסיס תוכן הסריקה בפועל.
 */
function buildPersonalCriticalAlertText(
  operatorName: string,
  operationName: string,
  summary: string,
  detectedAt: string,
  channelName?: string,
  channelLocation?: string,
): string {
  const normalizedSummary = summary.trim().replace(/\s+/g, ' ')
  const summaryParts = normalizedSummary
    .split(/[.!?]\s+|\n+/)
    .map((part) => part.trim())
    .filter(Boolean)
  const primaryObservation =
    summaryParts[0] ?? 'זוהתה אינדיקציה חריגה בפריים העדכני ודורשת אימות מיידי.'
  const environmentObservation = summaryParts.slice(1).join('. ')
  const contextParts = [
    `ערוץ: ${channelName || 'לא זוהה'}`,
    channelLocation ? `מיקום: ${channelLocation}` : null,
    `שעת זיהוי: ${detectedAt}`,
  ].filter(Boolean)

  return [
    `${operatorName}, כאן קצין הביטחון.`,
    `התקבלה התראה קריטית במבצע «${operationName}».`,
    `מה זוהה: ${primaryObservation}.`,
    environmentObservation ? `תיאור סביבה: ${environmentObservation}.` : null,
    `נתוני אירוע: ${contextParts.join(' | ')}.`,
    'נדרש טיפול מיידי ותשומת לב מלאה שלך לאירוע.',
  ]
    .filter(Boolean)
    .join(' ')
}

/** רישום הודעה fire-and-forget לסטטיסטיקות הסופר אדמין */
function trackMessage(
  channelId: string,
  direction: 'outgoing' | 'incoming',
  source: 'user' | 'ghost' | 'system' | 'operation',
  count = 1,
): void {
  const profile = readAuthProfile()
  if (!profile) {
    return
  }
  recordChannelMessage({
    organizationId: profile.organizationId,
    channelId,
    direction,
    source,
    count,
  }).catch(() => undefined)
}

interface AppProps {
  currentUserRole: 'system_manager' | 'regular_user'
  fullName: string
  organizationName: string
  onLogout: () => void
  onToggleTheme: () => void
  themeMode: 'light' | 'dark'
}

type OperatorAccountDialog = 'profile' | 'team' | 'audit' | null

interface QuickAction {
  id: string
  title: string
  description: string
  keywords: string
  run: () => void
}

function formatRoleLabel(role: AppProps['currentUserRole']): string {
  if (role === 'system_manager') {
    return 'מנהל מערכת'
  }
  return 'משתמש רגיל'
}

function formatAuthorLabel(author: Message['author']): string {
  if (author === 'user') {
    return 'אתה'
  }
  if (author === 'system') {
    return 'מערכת'
  }
  return 'Ghost'
}

function App({ currentUserRole, fullName, onLogout, onToggleTheme, organizationName, themeMode }: AppProps) {
  const canAccessCommandCenter =
    currentUserRole === 'system_manager' || currentUserRole === 'regular_user'
  const [channels, setChannels] = useState<Channel[]>([])
  const [selectedChannelId, setSelectedChannelId] = useState<string>('')
  const [isLoadingChannels, setIsLoadingChannels] = useState(true)
  const [isMobileLayout, setIsMobileLayout] = useState(false)
  const [mobilePanel, setMobilePanel] = useState<MobilePanel>('chat')
  const [operatorMobileSection, setOperatorMobileSection] = useState<OperatorMobileSection>('live')
  const [isDetailsCollapsed, setIsDetailsCollapsed] = useState(true)
  const [isSending, setIsSending] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [inboxSearchFocusToken, setInboxSearchFocusToken] = useState(0)
  const [visibleChannelsCount, setVisibleChannelsCount] = useState(INBOX_PAGE_SIZE)
  const [messageDraft, setMessageDraft] = useState('')
  const [operationDraft, setOperationDraft] = useState(DEFAULT_OPERATION_DRAFT)
  const [newChannelDraft, setNewChannelDraft] = useState(DEFAULT_NEW_CHANNEL_DRAFT)
  const [showNewChannelForm, setShowNewChannelForm] = useState(false)
  const [isGroupingMode, setIsGroupingMode] = useState(false)
  const [groupSelectionIds, setGroupSelectionIds] = useState<string[]>([])
  const [isGroupNameModalOpen, setIsGroupNameModalOpen] = useState(false)
  const [pendingGroupChannelIds, setPendingGroupChannelIds] = useState<string[]>([])
  const [groupNameDraft, setGroupNameDraft] = useState('')
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [activeTopbarNav, setActiveTopbarNav] = useState<TopbarNavItem>('Ghost Live')
  const [flashAlert, setFlashAlert] = useState<{ channelName: string; operationName: string; summary: string } | null>(null)
  const [alertingChannelIds, setAlertingChannelIds] = useState<Set<string>>(new Set())
  const [isAlertsCenterOpen, setIsAlertsCenterOpen] = useState(false)
  const [isIssueModalOpen, setIsIssueModalOpen] = useState(false)
  const [issueTitle, setIssueTitle] = useState('')
  const [issueDescription, setIssueDescription] = useState('')
  const [issueSeverity, setIssueSeverity] = useState<'low' | 'medium' | 'high' | 'critical'>('medium')
  const [issueSubmitError, setIssueSubmitError] = useState('')
  const [issueSubmitSuccess, setIssueSubmitSuccess] = useState('')
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false)
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false)
  const [isSupportOpen, setIsSupportOpen] = useState(false)
  const [commandQuery, setCommandQuery] = useState('')
  const [activeAccountDialog, setActiveAccountDialog] = useState<OperatorAccountDialog>(null)
  const [criticalAlertStatusByMessageId, setCriticalAlertStatusByMessageId] = useState<Record<string, CriticalAlertStatus>>({})
  const lastFlashAlertByChannelRef = useRef<Map<string, number>>(new Map())
  const messageStreamRef = useRef<HTMLDivElement>(null)
  const touchStartXRef = useRef<number | null>(null)
  const touchStartYRef = useRef<number | null>(null)
  const touchTargetIsInteractiveRef = useRef(false)

  useEffect(() => {
    let cancelled = false
    setIsLoadingChannels(true)
    fetchChannelsFromServer()
      .then((serverChannels) => {
        if (cancelled) return
        setChannels(serverChannels)
        if (serverChannels.length > 0) {
          setSelectedChannelId(serverChannels[0].id)
        } else {
          setActiveTopbarNav('Command Center')
          setShowNewChannelForm(true)
        }
      })
      .catch(() => undefined)
      .finally(() => { if (!cancelled) setIsLoadingChannels(false) })
    return () => { cancelled = true }
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') {
      return undefined
    }

    const mediaQuery = window.matchMedia('(max-width: 980px)')
    const applyMatch = (matches: boolean) => setIsMobileLayout(matches)
    applyMatch(mediaQuery.matches)

    const handleChange = (event: MediaQueryListEvent) => applyMatch(event.matches)
    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [])

  useEffect(() => {
    const viewParam = new URLSearchParams(window.location.search).get('view')
    if (viewParam === 'channels' && canAccessCommandCenter) {
      setActiveTopbarNav('Command Center')
    }
  }, [canAccessCommandCenter])

  useEffect(() => {
    const url = new URL(window.location.href)
    if (activeTopbarNav === 'Command Center') {
      url.searchParams.set('view', 'channels')
    } else {
      url.searchParams.delete('view')
    }
    window.history.replaceState({}, '', `${url.pathname}${url.search}${url.hash}`)
  }, [activeTopbarNav])

  useEffect(() => {
    if (canAccessCommandCenter) {
      return
    }
    if (activeTopbarNav === 'Command Center') {
      setActiveTopbarNav('Ghost Live')
    }
  }, [activeTopbarNav, canAccessCommandCenter])

  useEffect(() => {
    function handleQuickCommandShortcut(event: KeyboardEvent) {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        setCommandQuery('')
        setIsShortcutsOpen(false)
        setIsSupportOpen(false)
        setActiveAccountDialog(null)
        setIsCommandPaletteOpen(true)
      }
    }

    window.addEventListener('keydown', handleQuickCommandShortcut)
    return () => window.removeEventListener('keydown', handleQuickCommandShortcut)
  }, [])

  /**
   * סט מזהי ערוצים שצורפו לקבוצה כלשהי — אסור שיופיעו ברשימה הראשית.
   * מחושב מ-linkedChannelIds של כל ערוצי הקבוצה.
   */
  const linkedChannelIdSet = useMemo(() => {
    const ids = new Set<string>()
    channels.forEach((ch) => ch.linkedChannelIds?.forEach((id) => ids.add(id)))
    return ids
  }, [channels])

  const sortedFilteredChannels = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()
    return [...channels]
      .filter((channel) => {
        /* ערוצים שנכנסו לקבוצה — מוסתרים מהרשימה הראשית */
        if (linkedChannelIdSet.has(channel.id)) {
          return false
        }

        if (!query) {
          return true
        }

        const messagesText = channel.messages.map((m) => m.text).join(' ')
        const haystack = `${channel.name} ${channel.location} ${channel.watchScope} ${channel.members.join(' ')} ${messagesText}`.toLowerCase()
        return haystack.includes(query)
      })
      .sort((a, b) => {
        if (b.unread !== a.unread) {
          return b.unread - a.unread
        }
        const aPriority = LIVE_STATE_META[a.liveState]?.priority ?? 99
        const bPriority = LIVE_STATE_META[b.liveState]?.priority ?? 99
        if (aPriority !== bPriority) {
          return aPriority - bPriority
        }
        const aLast = getMinutesSinceTimeLabel(a.messages.at(-1)?.time ?? '00:00')
        const bLast = getMinutesSinceTimeLabel(b.messages.at(-1)?.time ?? '00:00')
        return aLast - bLast
      })
  }, [channels, searchQuery, linkedChannelIdSet])

  /**
   * ערוצים זמינים לצירוף בטופס קבוצה — רק personal שעדיין לא שייכים לקבוצה.
   */
  const availableForGrouping = useMemo(
    () => channels.filter((ch) => ch.type === 'personal' && !linkedChannelIdSet.has(ch.id)),
    [channels, linkedChannelIdSet],
  )

  const EMPTY_CHANNEL: Channel = useMemo(() => ({
    id: '', name: '', type: 'personal', subtitle: '', location: '',
    watchScope: '', description: '', memoryInterval: 30, rtspFeed: '',
    unread: 0, liveState: 'OFFLINE', members: [], messages: [], operations: [],
  }), [])

  const selectedChannel: Channel = useMemo(
    () => channels.find((channel) => channel.id === selectedChannelId) ?? channels[0] ?? EMPTY_CHANNEL,
    [channels, selectedChannelId, EMPTY_CHANNEL],
  )

  useEffect(() => () => releaseCameraResources(), [])

  useEffect(() => {
    const stream = messageStreamRef.current
    if (stream) {
      stream.scrollTo({ top: stream.scrollHeight, behavior: 'smooth' })
    }
  }, [selectedChannel.messages.length, selectedChannelId])

  const totalOperations = useMemo(
    () => channels.reduce((count, channel) => count + channel.operations.filter((operation) => operation.enabled).length, 0),
    [channels],
  )
  const totalLiveFeeds = useMemo(
    () => channels.filter((channel) => channel.liveState !== 'OFFLINE').length,
    [channels],
  )
  const totalUnreadAlerts = useMemo(() => channels.reduce((sum, channel) => sum + channel.unread, 0), [channels])
  const hasMoreChannels = visibleChannelsCount < sortedFilteredChannels.length
  const criticalAlerts = useMemo(
    () => buildCriticalAlerts(channels, criticalAlertStatusByMessageId),
    [channels, criticalAlertStatusByMessageId],
  )
  const operatorMembers = useMemo(() => {
    const members = new Set<string>()
    channels.forEach((channel) => {
      channel.members.forEach((member) => {
        const normalized = member.trim()
        if (normalized) {
          members.add(normalized)
        }
      })
    })
    return Array.from(members).sort((left, right) => left.localeCompare(right))
  }, [channels])
  const operatorRecentActivity = useMemo(() => {
    return [...channels]
      .flatMap((channel) =>
        channel.messages.slice(-3).map((message) => ({
          id: `${channel.id}_${message.id}`,
          channelName: channel.name,
          author: message.author,
          text: message.text,
          time: message.time,
        })),
      )
      .slice(-8)
      .reverse()
  }, [channels])

  function closeTopbarOverlays() {
    setIsCommandPaletteOpen(false)
    setIsShortcutsOpen(false)
    setIsSupportOpen(false)
  }

  function openCommandPalette() {
    setCommandQuery('')
    setIsShortcutsOpen(false)
    setIsSupportOpen(false)
    setActiveAccountDialog(null)
    setIsCommandPaletteOpen(true)
  }

  function openIssueReport() {
    closeTopbarOverlays()
    setActiveAccountDialog(null)
    setIsIssueModalOpen(true)
  }

  const operatorAccountMenuItems = useMemo<AccountMenuItem[]>(
    () => [
      { id: 'profile', label: 'פרופיל אישי', icon: '◈', section: 'main' },
      { id: 'team', label: 'צוות וחברים', icon: '⊞', section: 'main' },
      { id: 'notifications', label: 'התראות', icon: '◉', section: 'main' },
      { id: 'audit', label: 'יומן פעילות', icon: '≡', section: 'dev' },
      { id: 'logout', label: 'יציאה מהמערכת', icon: '⏻', section: 'danger', tone: 'danger' },
    ],
    [],
  )

  function handleAccountAction(itemId: string) {
    closeTopbarOverlays()
    if (itemId === 'notifications') {
      setIsAlertsCenterOpen(true)
      return
    }
    if (itemId === 'logout') {
      onLogout()
      return
    }
    if (itemId === 'profile' || itemId === 'team' || itemId === 'audit') {
      setActiveAccountDialog(itemId)
    }
  }

  const operatorQuickActions = useMemo<QuickAction[]>(
    () => [
      {
        id: 'ghost-live',
        title: 'גוסט לייב',
        description: 'פתח את סביבת הניטור החיה.',
        keywords: 'ghost live workspace chat monitor',
        run: () => {
          closeTopbarOverlays()
          setActiveTopbarNav('Ghost Live')
        },
      },
      {
        id: 'command-center',
        title: 'מרכז פיקוד',
        description: 'פתח ניהול ערוצים ומבצעים.',
        keywords: 'command center channels operations settings',
        run: () => {
          closeTopbarOverlays()
          setActiveTopbarNav('Command Center')
        },
      },
      {
        id: 'alerts',
        title: 'התראות קריטיות',
        description: 'סקור התראות קריטיות שלא טופלו.',
        keywords: 'alerts notifications critical',
        run: () => {
          closeTopbarOverlays()
          setIsAlertsCenterOpen(true)
        },
      },
      {
        id: 'issue-report',
        title: 'דווח על תקלה',
        description: 'שלח דיווח תקלה להנהלת Ghost.',
        keywords: 'support help issue bug report',
        run: () => {
          openIssueReport()
        },
      },
      {
        id: 'channel-details',
        title: 'פתח פרטי ערוץ',
        description: `בדוק את ההגדרות והמבצעים של ${selectedChannel.name || 'הערוץ הנבחר'}.`,
        keywords: 'details selected channel sidebar settings',
        run: () => {
          closeTopbarOverlays()
          setIsDetailsCollapsed(false)
          setMobilePanel('details')
        },
      },
    ],
    [selectedChannel.name],
  )

  const filteredOperatorQuickActions = useMemo(() => {
    const normalizedQuery = commandQuery.trim().toLowerCase()
    if (!normalizedQuery) {
      return operatorQuickActions
    }
    return operatorQuickActions.filter((action) =>
      `${action.title} ${action.description} ${action.keywords}`.toLowerCase().includes(normalizedQuery),
    )
  }, [commandQuery, operatorQuickActions])

  function updateSelectedChannel<K extends keyof Channel>(field: K, value: Channel[K]) {
    setChannels((currentChannels) =>
      currentChannels.map((channel) =>
        channel.id === selectedChannel.id ? { ...channel, [field]: value } : channel,
      ),
    )
    const persistableFields = ['name', 'subtitle', 'location', 'watchScope', 'description', 'memoryInterval', 'rtspFeed', 'liveState', 'cameraEnabled', 'isBlocked', 'members', 'linkedChannelIds', 'type']
    if (persistableFields.includes(field as string)) {
      updateChannelApi(selectedChannel.id, { [field]: value }).catch(() => undefined)
    }
  }

  function selectChannel(channelId: string) {
    setSelectedChannelId(channelId)
    setMobilePanel('chat')
    setAlertingChannelIds((prev) => {
      if (!prev.has(channelId)) {
        return prev
      }
      const next = new Set(prev)
      next.delete(channelId)
      return next
    })
  }

  function focusInboxSearch() {
    setActiveTopbarNav('Ghost Live')
    setMobilePanel('inbox')
    setInboxSearchFocusToken((currentValue) => currentValue + 1)
  }

  function openSelectedChannelDetails() {
    setActiveTopbarNav('Ghost Live')
    setIsDetailsCollapsed(false)
    setMobilePanel('details')
  }

  function handleInboxCreateChat() {
    if (canAccessCommandCenter) {
      setActiveTopbarNav('Command Center')
      return
    }
    focusInboxSearch()
  }

  function handleInboxMoreOptions() {
    openCommandPalette()
  }

  function clearChannelAlertingIfResolved(
    channelId: string,
    statusByMessageId: Record<string, CriticalAlertStatus>,
  ) {
    const channel = channels.find((currentChannel) => currentChannel.id === channelId)
    if (!channel) {
      return
    }
    if (hasPendingCriticalAlertsInChannel(channel, statusByMessageId)) {
      return
    }
    setAlertingChannelIds((currentAlerting) => {
      if (!currentAlerting.has(channelId)) {
        return currentAlerting
      }
      const next = new Set(currentAlerting)
      next.delete(channelId)
      return next
    })
  }

  /**
   * מעדכן ערוץ בודד לפי מזהה, תוך שמירה על immutability של הרשימה.
   */
  function updateChannelById(channelId: string, updater: (channel: Channel) => Channel) {
    setChannels((currentChannels) =>
      currentChannels.map((channel) => (channel.id === channelId ? updater(channel) : channel)),
    )
  }

  function buildScanMessage(
    mode: OperationMode,
    operationName: string,
    summary: string,
    critical?: boolean,
    score?: number,
    frameDataUrl?: string,
    channelName?: string,
    channelLocation?: string,
  ): Message {
    const time = getCurrentTime()
    const base = { id: crypto.randomUUID(), author: 'system' as const, time }
    const shouldAttachFrameToMessage = mode === 'alert' && Boolean(critical) && Boolean(frameDataUrl)

    switch (mode) {
      case 'alert':
        return {
          ...base,
          text: critical
            ? buildPersonalCriticalAlertText(OPERATOR_DISPLAY_NAME, operationName, summary, time, channelName, channelLocation)
            : `${OPERATOR_DISPLAY_NAME}, עדכון שגרתי בזמן אמת. מבצע «${operationName}»: ${summary || 'הסריקה הושלמה ללא חריגה.'} פרטי סביבה: הסריקה בוצעה בפריים העדכני של הערוץ ולא זוהתה אינדיקציה חריגה בסביבה הנצפית.`,
          frameDataUrl: shouldAttachFrameToMessage ? frameDataUrl : undefined,
          alertLevel: critical ? 'critical' : 'routine',
        }
      case 'report':
        return {
          ...base,
          text: `דו"ח מבצעי | מבצע «${operationName}»: ${summary || 'לא התקבל תוכן דו"ח מפורט.'}`,
          alertLevel: 'report',
        }
      case 'rating':
        return {
          ...base,
          text: `דירוג איכות | מבצע «${operationName}»: ציון ${score != null ? `${score}/10` : 'לא זמין'} · ${summary || 'לא התקבל נימוק לדירוג.'}`,
          alertLevel: 'rating',
          score: score ?? undefined,
        }
      case 'assessment':
        return {
          ...base,
          text: `הערכת מצב | מבצע «${operationName}»: ${summary || 'לא התקבלו ממצאים משמעותיים.'}`,
          alertLevel: 'assessment',
        }
    }
  }

  const handleOperationFired = useCallback((payload: OperationFiredPayload) => {
    const channelLocation = channels.find((channel) => channel.id === payload.channelId)?.location
    const scanMessage = buildScanMessage(
      payload.mode,
      payload.operationName,
      payload.summary,
      payload.critical,
      payload.score,
      payload.frameDataUrl,
      payload.channelName,
      channelLocation,
    )

    setChannels((currentChannels) =>
      currentChannels.map((channel) =>
        channel.id === payload.channelId
          ? {
              ...channel,
              lastFrameDataUrl: payload.frameDataUrl || channel.lastFrameDataUrl,
              messages: [...channel.messages, scanMessage],
            }
          : channel,
      ),
    )
    saveMessage(payload.channelId, scanMessage).catch(() => undefined)

    trackMessage(payload.channelId, 'incoming', 'operation')

    if (payload.mode === 'alert' && payload.critical) {
      const shouldShowFlashAlert = consumeChannelAlertPopupSlot(
        lastFlashAlertByChannelRef.current,
        payload.channelId,
        Date.now(),
        CHANNEL_ALERT_POPUP_COOLDOWN_MS,
      )
      if (shouldShowFlashAlert) {
        setFlashAlert({
          channelName: payload.channelName,
          operationName: payload.operationName,
          summary: payload.summary,
        })
      }
      setAlertingChannelIds((prev) => {
        const next = new Set(prev)
        next.add(payload.channelId)
        return next
      })
    }
  }, [channels])

  const { nextRunAt } = useOperationScheduler({ channels, onOperationFired: handleOperationFired })
  const { samplerStates, startSampling, stopSampling, getSamplerState } = useTimelineSampler({
    channels,
    onFrameCaptured: ({ channelId, frameDataUrl }) => {
      updateChannelById(channelId, (channel) => ({
        ...channel,
        lastFrameDataUrl: frameDataUrl,
      }))
    },
    onAnalysisComplete: ({ channelId, analysis }) => {
      updateChannelById(channelId, (channel) => {
        const timelineState = channel.timelineState ?? buildDefaultTimelineState()
        return {
          ...channel,
          timelineState: {
            ...timelineState,
            analysisHistory: [analysis, ...timelineState.analysisHistory].slice(0, MAX_TIMELINE_HISTORY_ITEMS),
          },
          messages: [
            ...channel.messages,
            {
              id: crypto.randomUUID(),
              author: 'system',
              text: `ניתוח ציר-זמן הושלם (${analysis.frameCount} פריימים): ${analysis.summary}`,
              time: getCurrentTime(),
              alertLevel: 'routine',
            },
          ],
        }
      })
    },
  })

  const selectedChannelActiveOps = useMemo(
    () => selectedChannel.operations.filter((op) => op.enabled && op.parsedSchedule).length,
    [selectedChannel.operations],
  )

  const nextScanInfo = useMemo(() => {
    let closestDeadline: number | null = null
    let closestOpName = ''
    let closestTotalMs = 0
    for (const op of selectedChannel.operations) {
      if (!op.enabled || !op.parsedSchedule) {
        continue
      }
      const key = `${selectedChannel.id}_${op.id}`
      const ts = nextRunAt.get(key)
      if (ts !== undefined) {
        const ms = ts - Date.now()
        if (ms > 0 && (closestDeadline === null || ts < closestDeadline)) {
          closestDeadline = ts
          closestOpName = op.name
          closestTotalMs = op.parsedSchedule.type === 'interval' ? op.parsedSchedule.intervalMs : ms
        }
      }
    }
    return closestDeadline !== null
      ? { deadline: closestDeadline, operationName: closestOpName, totalCycleMs: closestTotalMs }
      : null
  }, [selectedChannel, nextRunAt])

  /**
   * שולח בקשות ניתוח נפרדות לכל מצלמה מקושרת בקבוצה, ומחזיר הודעה נפרדת מכל אחת.
   */
  async function handleGroupMessageReplies(
    groupChannel: Channel,
    userPrompt: string,
    frameDataUrl: string,
    analysisContext?: string,
  ) {
    const linkedIds = groupChannel.linkedChannelIds || []
    const linkedChannels = linkedIds
      .map((id) => channels.find((ch) => ch.id === id))
      .filter((ch): ch is Channel => ch !== undefined)

    if (linkedChannels.length === 0) {
      const reply = await requestVisionReply(groupChannel, userPrompt, frameDataUrl, analysisContext)
      const ghostMessage: Message = {
        id: crypto.randomUUID(),
        author: 'ghost',
        text: reply.text,
        time: getCurrentTime(),
        sources: reply.sources,
      }
      updateChannelById(groupChannel.id, (channel) => ({
        ...channel,
        messages: [...channel.messages, ghostMessage],
      }))
      saveMessage(groupChannel.id, ghostMessage).catch(() => undefined)
      trackMessage(groupChannel.id, 'incoming', 'ghost')
      return
    }

    const replyPromises = linkedChannels.map(async (linkedChannel) => {
      try {
        const reply = await requestVisionReply(
          linkedChannel,
          userPrompt,
          frameDataUrl,
          analysisContext,
        )
        return {
          channelName: linkedChannel.name,
          text: reply.text,
          success: true,
        }
      } catch (error) {
        return {
          channelName: linkedChannel.name,
          text: `שגיאה בקבלת תשובה: ${error instanceof Error ? error.message : 'שגיאה לא ידועה'}`,
          success: false,
        }
      }
    })

    const replies = await Promise.all(replyPromises)

    const ghostMessages: Message[] = replies.map((reply) => ({
      id: crypto.randomUUID(),
      author: 'ghost' as const,
      text: reply.text,
      time: getCurrentTime(),
      sources: [reply.channelName],
    }))

    updateChannelById(groupChannel.id, (channel) => ({
      ...channel,
      messages: [...channel.messages, ...ghostMessages],
    }))

    for (const msg of ghostMessages) {
      saveMessage(groupChannel.id, msg).catch(() => undefined)
      trackMessage(groupChannel.id, 'incoming', 'ghost')
    }
  }

  /**
   * שולח הודעה בערוץ, לוכד פריים עדכני, שולח לשרת לניתוח ומחזיר תשובה לצ׳אט.
   * בקבוצה — כל מצלמה מקושרת עונה בנפרד.
   */
  async function handleMessageSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (isSending) {
      return
    }

    const trimmedMessage = messageDraft.trim()
    if (!trimmedMessage) {
      return
    }
    setIsSending(true)

    const timestamp = getCurrentTime()
    const userMessage: Message = {
      id: crypto.randomUUID(),
      author: 'user',
      text: trimmedMessage,
      time: timestamp,
    }

    setMessageDraft('')
    setMobilePanel('chat')
    updateChannelById(selectedChannel.id, (channel) => ({
      ...channel,
      unread: 0,
      messages: [...channel.messages, userMessage],
    }))
    saveMessage(selectedChannel.id, userMessage).catch(() => undefined)
    trackMessage(selectedChannel.id, 'outgoing', 'user')

    try {
      const latestFrameDataUrl = await captureLatestCameraFrame('chat-high')
      updateChannelById(selectedChannel.id, (channel) => ({
        ...channel,
        cameraEnabled: true,
        lastFrameDataUrl: latestFrameDataUrl,
      }))

      const analysisHistory = selectedChannel.timelineState?.analysisHistory ?? []
      const analysisContext = analysisHistory.length > 0 ? formatTimelineHistoryContext(analysisHistory) : undefined

      const isGroup =
        selectedChannel.type === 'group' &&
        selectedChannel.linkedChannelIds &&
        selectedChannel.linkedChannelIds.length > 0

      if (isGroup) {
        await handleGroupMessageReplies(selectedChannel, trimmedMessage, latestFrameDataUrl, analysisContext)
      } else {
        const reply = await requestVisionReply(selectedChannel, trimmedMessage, latestFrameDataUrl, analysisContext)
        const ghostMessage: Message = {
          id: crypto.randomUUID(),
          author: 'ghost',
          text: reply.text,
          time: getCurrentTime(),
          sources: reply.sources,
        }

        updateChannelById(selectedChannel.id, (channel) => ({
          ...channel,
          unread: 0,
          messages: [...channel.messages, ghostMessage],
        }))
        saveMessage(selectedChannel.id, ghostMessage).catch(() => undefined)
        trackMessage(selectedChannel.id, 'incoming', 'ghost')
      }

      const enabledOperations = selectedChannel.operations.filter((operation) => operation.enabled)
      if (enabledOperations.length > 0) {
        try {
          const scanResults = await requestOperationScan(selectedChannel, latestFrameDataUrl, enabledOperations)
          const resultById = new Map(scanResults.map((row) => [row.operationId, row]))
          const scanMessages: Message[] = []
          for (const operation of enabledOperations) {
            const row = resultById.get(operation.id)
            if (!row) {
              continue
            }
            scanMessages.push(
              buildScanMessage(
                operation.mode,
                operation.name,
                row.summary,
                row.critical,
                row.score,
                latestFrameDataUrl,
                selectedChannel.name,
                selectedChannel.location,
              ),
            )
          }
          if (scanMessages.length > 0) {
            updateChannelById(selectedChannel.id, (channel) => ({
              ...channel,
              messages: [...channel.messages, ...scanMessages],
            }))
            for (const msg of scanMessages) {
              saveMessage(selectedChannel.id, msg).catch(() => undefined)
            }
            trackMessage(selectedChannel.id, 'incoming', 'operation', scanMessages.length)
          }
        } catch (scanError) {
          const scanErrText =
            scanError instanceof Error ? scanError.message : 'שגיאה לא צפויה בסריקת מבצעים.'
          updateChannelById(selectedChannel.id, (channel) => ({
            ...channel,
            messages: [
              ...channel.messages,
              {
                id: crypto.randomUUID(),
                author: 'system',
                text: `לא הושלמה סריקת המבצעים המופעלים: ${scanErrText}`,
                time: getCurrentTime(),
              },
            ],
          }))
        }
      }
    } catch (error) {
      const errorText =
        error instanceof Error
          ? error.message
          : 'אירעה שגיאה לא צפויה בתהליך ניתוח הפריים.'
      const systemMessage: Message = {
        id: crypto.randomUUID(),
        author: 'system',
        text: `שגיאה בניתוח תמונה: ${errorText}`,
        time: getCurrentTime(),
      }

      updateChannelById(selectedChannel.id, (channel) => ({
        ...channel,
        cameraEnabled: false,
        messages: [...channel.messages, systemMessage],
      }))
      trackMessage(selectedChannel.id, 'incoming', 'system')
    } finally {
      setIsSending(false)
    }
  }

  function handleOperationSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const trimmedAction = operationDraft.action.trim()
    if (!trimmedAction) {
      return
    }

    const scheduleText = operationDraft.schedule.trim() || '24/7'
    const nextOperation: Operation = {
      id: crypto.randomUUID(),
      name: operationDraft.name.trim() || 'מבצע חדש',
      mode: operationDraft.mode,
      schedule: scheduleText,
      trigger: operationDraft.trigger.trim() || 'ללא טריגר מוגדר',
      action: trimmedAction,
      enabled: true,
      parsedSchedule: parseSchedule(scheduleText) ?? undefined,
    }

    setOperationDraft(DEFAULT_OPERATION_DRAFT)

    const channelId = selectedChannel.id
    setChannels((currentChannels) =>
      currentChannels.map((channel) =>
        channel.id === channelId
          ? { ...channel, operations: [nextOperation, ...channel.operations] }
          : channel,
      ),
    )

    createOperationApi(channelId, nextOperation)
      .then((serverOp) => {
        setChannels((currentChannels) =>
          currentChannels.map((channel) =>
            channel.id === channelId
              ? {
                  ...channel,
                  operations: channel.operations.map((op) =>
                    op.id === nextOperation.id ? { ...op, id: serverOp.id } : op,
                  ),
                }
              : channel,
          ),
        )
      })
      .catch(() => undefined)
  }

  /**
   * יוצר ערוץ חדש ומנסה ללכוד עבורו פריים התחלתי מהמצלמה.
   */
  async function handleNewChannelSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!newChannelDraft.name.trim()) {
      return
    }

    const linkedIds =
      newChannelDraft.type === 'group' ? [...new Set(newChannelDraft.linkedChannelIds)] : []

    const membersFromLinks =
      newChannelDraft.type === 'group'
        ? memberNamesFromLinkedChannelIds(channels, linkedIds)
        : []

    const members =
      newChannelDraft.type === 'group'
        ? membersFromLinks.length > 0
          ? membersFromLinks
          : [newChannelDraft.name.trim()]
        : [newChannelDraft.name.trim()]

    const memoryInterval = Math.min(300, Math.max(5, newChannelDraft.memoryInterval))

    const systemIntro =
      newChannelDraft.type === 'group' && membersFromLinks.length > 0
        ? `קבוצה חדשה נוצרה עם ${membersFromLinks.length} צ׳אטים מצורפים: ${membersFromLinks.join(' · ')}. אפשר לעדכן RTSP, זיכרון ומבצעים בפאנל הימני.`
        : 'ערוץ חדש נוצר ומוכן לשיחה. אפשר לעדכן RTSP, זיכרון ומבצעים בפאנל הימני.'

    const nextChannel: Channel = {
      id: crypto.randomUUID(),
      name: newChannelDraft.name.trim(),
      type: newChannelDraft.type,
      subtitle:
        newChannelDraft.type === 'group' ? 'צ׳אט קבוצתי' : 'מצלמה אישית',
      location: newChannelDraft.location.trim() || 'מיקום חדש',
      watchScope: newChannelDraft.watchScope.trim() || 'ניטור מותאם אישית',
      description:
        newChannelDraft.description.trim() || 'ערוץ חדש להגדרה מהירה דרך השיחה.',
      memoryInterval,
      rtspFeed: newChannelDraft.rtspFeed.trim() || 'rtsp://',
      unread: 0,
      liveState: newChannelDraft.type === 'group' ? 'SYNC' : 'LIVE',
      linkedChannelIds:
        newChannelDraft.type === 'group' && linkedIds.length > 0 ? linkedIds : undefined,
      members,
      messages: [
        {
          id: crypto.randomUUID(),
          author: 'system',
          text: systemIntro,
          time: getCurrentTime(),
        },
      ],
      operations: [],
      timelineState: buildDefaultTimelineState(),
    }

    let initialFrameDataUrl: string | undefined
    let cameraEnabled = false
    try {
      initialFrameDataUrl = await captureLatestCameraFrame('scan-standard')
      cameraEnabled = true
    } catch {
      cameraEnabled = false
    }

    setShowNewChannelForm(false)
    setNewChannelDraft(DEFAULT_NEW_CHANNEL_DRAFT)
    setSearchQuery('')
    setVisibleChannelsCount(INBOX_PAGE_SIZE)
    setMobilePanel('chat')

    try {
      const serverChannel = await createChannelApi({
        ...nextChannel,
        cameraEnabled,
      })
      const withLocalData: Channel = {
        ...serverChannel,
        cameraEnabled,
        lastFrameDataUrl: initialFrameDataUrl,
        messages: nextChannel.messages,
        operations: [],
        timelineState: buildDefaultTimelineState(),
      }
      setChannels((currentChannels) => [withLocalData, ...currentChannels])
      setSelectedChannelId(serverChannel.id)
      for (const msg of nextChannel.messages) {
        saveMessage(serverChannel.id, msg).catch(() => undefined)
      }
    } catch {
      const fallback: Channel = { ...nextChannel, cameraEnabled, lastFrameDataUrl: initialFrameDataUrl }
      setChannels((currentChannels) => [fallback, ...currentChannels])
      setSelectedChannelId(nextChannel.id)
    }
  }

  function toggleOperation(operationId: string) {
    const op = selectedChannel.operations.find((o) => o.id === operationId)
    setChannels((currentChannels) =>
      currentChannels.map((channel) =>
        channel.id === selectedChannel.id
          ? {
              ...channel,
              operations: channel.operations.map((operation) =>
                operation.id === operationId ? { ...operation, enabled: !operation.enabled } : operation,
              ),
            }
          : channel,
      ),
    )
    if (op) {
      updateOperationApi(selectedChannel.id, operationId, { enabled: !op.enabled }).catch(() => undefined)
    }
  }

  function updateOperationInChannelField(
    channelId: string,
    operationId: string,
    field: keyof Pick<Operation, 'name' | 'mode' | 'schedule' | 'trigger' | 'action'>,
    value: string,
  ) {
    const updatePayload: Record<string, unknown> = { [field]: value }
    if (field === 'schedule') {
      updatePayload.parsedSchedule = parseSchedule(value) ?? null
    }
    setChannels((currentChannels) =>
      currentChannels.map((channel) =>
        channel.id === channelId
          ? {
              ...channel,
              operations: channel.operations.map((operation) => {
                if (operation.id !== operationId) {
                  return operation
                }
                const updated = { ...operation, [field]: value }
                if (field === 'schedule') {
                  updated.parsedSchedule = parseSchedule(value) ?? undefined
                }
                return updated
              }),
            }
          : channel,
      ),
    )
    updateOperationApi(channelId, operationId, updatePayload).catch(() => undefined)
  }

  /**
   * מחיקת מבצע בודד מתוך ערוץ ספציפי.
   */
  function deleteOperationFromChannel(channelId: string, operationId: string) {
    setChannels((currentChannels) =>
      currentChannels.map((channel) =>
        channel.id === channelId
          ? {
              ...channel,
              operations: channel.operations.filter((operation) => operation.id !== operationId),
            }
          : channel,
      ),
    )
    deleteOperationApi(channelId, operationId).catch(() => undefined)
  }

  /**
   * מעדכן שדה במבצע בערוץ הנבחר (מרכז ערוצים).
   */
  function updateOperationFieldForSelectedChannel(
    operationId: string,
    field: keyof Pick<Operation, 'name' | 'mode' | 'schedule' | 'trigger' | 'action'>,
    value: string,
  ) {
    updateOperationInChannelField(selectedChannel.id, operationId, field, value)
  }

  /**
   * מוחק מבצע בערוץ הנבחר (מרכז ערוצים).
   */
  function deleteOperationFromSelectedChannel(operationId: string) {
    deleteOperationFromChannel(selectedChannel.id, operationId)
  }

  function updateNewChannelDraftField<K extends keyof NewChannelDraft>(
    field: K,
    value: NewChannelDraft[K],
  ) {
    setNewChannelDraft((currentDraft) => {
      const next = { ...currentDraft, [field]: value } as NewChannelDraft
      if (field === 'type' && value === 'personal') {
        next.linkedChannelIds = []
      }
      return next
    })
  }

  function toggleNewChannelDraftLinkedId(channelId: string) {
    setNewChannelDraft((currentDraft) => {
      const next = new Set(currentDraft.linkedChannelIds)
      if (next.has(channelId)) {
        next.delete(channelId)
      } else {
        next.add(channelId)
      }
      return { ...currentDraft, linkedChannelIds: [...next] }
    })
  }

  function updateOperationDraftField<K extends keyof OperationDraft>(field: K, value: OperationDraft[K]) {
    setOperationDraft((currentDraft) => ({
      ...currentDraft,
      [field]: value,
    }))
  }

  /**
   * מוחק ערוץ בודד מהרשימה.
   * אם זה הערוץ האחרון - לא תתבצע מחיקה כדי למנוע מצב ללא ערוצים פעילים.
   */
  function deleteChannel(channelId: string) {
    deleteChannelApi(channelId).catch(() => undefined)
    let nextSelectedId: string | null = null
    setChannels((currentChannels) => {
      if (currentChannels.length <= 1) {
        return currentChannels
      }
      const channelsWithoutDeleted = currentChannels.filter((channel) => channel.id !== channelId)
      const namesById = new Map(channelsWithoutDeleted.map((channel) => [channel.id, channel.name]))
      const nextChannels = channelsWithoutDeleted.map((channel) => {
        if (!channel.linkedChannelIds?.includes(channelId)) {
          return channel
        }
        const nextLinkedIds = channel.linkedChannelIds.filter((id) => id !== channelId)
        const nextMembers = nextLinkedIds
          .map((id) => namesById.get(id))
          .filter((name): name is string => Boolean(name))
        return {
          ...channel,
          linkedChannelIds: nextLinkedIds.length > 0 ? nextLinkedIds : undefined,
          members: nextMembers.length > 0 ? nextMembers : [channel.name],
        }
      })
      const isSelectedDeleted = selectedChannelId === channelId
      if (isSelectedDeleted && nextChannels.length > 0) {
        nextSelectedId = nextChannels[0].id
      }
      return nextChannels
    })

    setGroupSelectionIds((currentSelection) => currentSelection.filter((id) => id !== channelId))
    if (nextSelectedId) {
      setSelectedChannelId(nextSelectedId)
      setMobilePanel('chat')
    }
  }

  /**
   * פותח מודאל אישור למחיקת הערוץ הנבחר.
   */
  function requestDeleteSelectedChannel() {
    setIsDeleteModalOpen(true)
  }

  /**
   * מחיקה קשיחה עם אישור מפורש של המשתמש במודאל.
   */
  function confirmDeleteSelectedChannel() {
    deleteChannel(selectedChannel.id)
    setIsDeleteModalOpen(false)
  }

  /**
   * מסמן/מבטל סימון ערוץ עבור קיבוץ מהיר.
   */
  function toggleGroupSelection(channelId: string) {
    setGroupSelectionIds((currentSelection) => {
      const nextSelection = new Set(currentSelection)
      if (nextSelection.has(channelId)) {
        nextSelection.delete(channelId)
      } else {
        nextSelection.add(channelId)
      }
      return [...nextSelection]
    })
  }

  /**
   * מסנן ערוצים שנבחרו ופותח מודל למתן שם לקבוצה החדשה.
   */
  function createGroupFromSelection() {
    const linkedIds = [...new Set(groupSelectionIds)].filter((id) =>
      channels.some((channel) => channel.id === id && channel.type === 'personal' && !linkedChannelIdSet.has(id)),
    )

    if (linkedIds.length < 2) {
      return
    }

    setPendingGroupChannelIds(linkedIds)
    setGroupNameDraft('')
    setIsGroupNameModalOpen(true)
    setIsGroupingMode(false)
  }

  /**
   * יוצר ערוץ קבוצתי חדש אחרי שהמשתמש אישר שם בפופאפ.
   */
  function confirmGroupCreation(groupName: string) {
    const linkedIds = pendingGroupChannelIds
    if (!groupName.trim() || linkedIds.length < 2) {
      return
    }

    const members = memberNamesFromLinkedChannelIds(channels, linkedIds)
    const selectedChannels = channels.filter((channel) => linkedIds.includes(channel.id))
    const combinedLocation =
      selectedChannels.length > 0 ? selectedChannels.map((channel) => channel.location).join(' · ') : 'מיקום קבוצתי'

    const nextGroupChannel: Channel = {
      id: crypto.randomUUID(),
      name: groupName.trim(),
      type: 'group',
      subtitle: 'צ׳אט קבוצתי',
      location: combinedLocation,
      watchScope: members.join(' · ') || 'ניטור קבוצתי',
      description: `קבוצה: ${groupName.trim()}`,
      memoryInterval: 30,
      rtspFeed: 'rtsp://',
      unread: 0,
      liveState: 'SYNC',
      linkedChannelIds: linkedIds,
      members,
      messages: [
        {
          id: crypto.randomUUID(),
          author: 'system',
          text: `נוצרה קבוצה «${groupName.trim()}» עם ${members.length} ערוצים: ${members.join(' · ')}.`,
          time: getCurrentTime(),
        },
      ],
      operations: [],
      timelineState: buildDefaultTimelineState(),
    }

    setChannels((currentChannels) => [nextGroupChannel, ...currentChannels])
    setSelectedChannelId(nextGroupChannel.id)
    setGroupSelectionIds([])
    setIsGroupNameModalOpen(false)
    setPendingGroupChannelIds([])
    setMobilePanel('chat')
  }

  function handleDismissFrame(messageId: string) {
    updateChannelById(selectedChannel.id, (channel) => ({
      ...channel,
      messages: channel.messages.map((msg) =>
        msg.id === messageId ? { ...msg, frameDataUrl: undefined } : msg,
      ),
    }))
  }

  function handleApproveCriticalAlert(alertMessageId: string, channelId: string) {
    setCriticalAlertStatusByMessageId((currentMap) => {
      const nextMap: Record<string, CriticalAlertStatus> = {
        ...currentMap,
        [alertMessageId]: 'approved',
      }
      clearChannelAlertingIfResolved(channelId, nextMap)
      return nextMap
    })
  }

  function handleIgnoreCriticalAlert(alertMessageId: string, channelId: string) {
    setCriticalAlertStatusByMessageId((currentMap) => {
      const nextMap: Record<string, CriticalAlertStatus> = {
        ...currentMap,
        [alertMessageId]: 'ignored',
      }
      clearChannelAlertingIfResolved(channelId, nextMap)
      return nextMap
    })
  }

  function handleDeleteCriticalAlert(alertMessageId: string, channelId: string) {
    setChannels((currentChannels) =>
      currentChannels.map((channel) =>
        channel.id === channelId
          ? {
              ...channel,
              messages: channel.messages.filter((message) => message.id !== alertMessageId),
            }
          : channel,
      ),
    )
    setCriticalAlertStatusByMessageId((currentMap) => {
      const nextMap = { ...currentMap }
      delete nextMap[alertMessageId]
      clearChannelAlertingIfResolved(channelId, nextMap)
      return nextMap
    })
  }

  function handleMessageStreamScroll() {
    return undefined
  }

  function isMobileViewport(): boolean {
    return typeof window !== 'undefined' && window.matchMedia('(max-width: 980px)').matches
  }

  function isInteractiveTouchTarget(target: EventTarget | null): boolean {
    if (!(target instanceof HTMLElement)) {
      return false
    }
    return Boolean(
      target.closest(
        'input, textarea, select, button, a, [role="button"], [data-no-swipe], .composer, .message-stream, .chat-list, .details-content',
      ),
    )
  }

  function handleWorkspaceTouchStart(event: TouchEvent<HTMLElement>) {
    if (!isMobileViewport()) {
      return
    }
    const touch = event.changedTouches[0]
    touchStartXRef.current = touch.clientX
    touchStartYRef.current = touch.clientY
    touchTargetIsInteractiveRef.current = isInteractiveTouchTarget(event.target)
  }

  function handleWorkspaceTouchEnd(event: TouchEvent<HTMLElement>) {
    if (!isMobileViewport() || touchTargetIsInteractiveRef.current) {
      touchStartXRef.current = null
      touchStartYRef.current = null
      touchTargetIsInteractiveRef.current = false
      return
    }

    const startX = touchStartXRef.current
    const startY = touchStartYRef.current
    const touch = event.changedTouches[0]
    touchStartXRef.current = null
    touchStartYRef.current = null
    touchTargetIsInteractiveRef.current = false

    if (startX === null || startY === null) {
      return
    }

    const deltaX = touch.clientX - startX
    const deltaY = touch.clientY - startY
    const horizontalDistance = Math.abs(deltaX)
    const verticalDistance = Math.abs(deltaY)
    const SWIPE_THRESHOLD_PX = 56

    if (horizontalDistance < SWIPE_THRESHOLD_PX || horizontalDistance <= verticalDistance * 1.2) {
      return
    }

    if (deltaX < 0) {
      if (mobilePanel === 'inbox') {
        setMobilePanel('chat')
      } else if (mobilePanel === 'chat') {
        setMobilePanel('details')
      }
      return
    }

    if (mobilePanel === 'details') {
      setMobilePanel('chat')
    } else if (mobilePanel === 'chat') {
      setMobilePanel('inbox')
    }
  }

  const selectedTimelineSamplerState = useMemo(() => {
    const liveSamplerState = samplerStates.get(selectedChannel.id)
    if (liveSamplerState) {
      const persistedHistory = selectedChannel.timelineState?.analysisHistory ?? []
      return {
        ...liveSamplerState,
        analysisHistory:
          liveSamplerState.analysisHistory.length > 0
            ? liveSamplerState.analysisHistory
            : persistedHistory,
      }
    }
    return selectedChannel.timelineState ?? getSamplerState(selectedChannel.id)
  }, [getSamplerState, samplerStates, selectedChannel])

  function handleStartTimelineSampling(intervalSeconds: 2 | 4 | 8) {
    startSampling(selectedChannel.id, intervalSeconds)
    updateChannelById(selectedChannel.id, (channel) => {
      const timelineState = channel.timelineState ?? buildDefaultTimelineState()
      return {
        ...channel,
        timelineState: {
          ...timelineState,
          isActive: true,
          intervalSeconds,
        },
      }
    })
  }

  function handleStopTimelineSampling() {
    stopSampling(selectedChannel.id)
    updateChannelById(selectedChannel.id, (channel) => {
      const timelineState = channel.timelineState ?? buildDefaultTimelineState()
      return {
        ...channel,
        timelineState: {
          ...timelineState,
          isActive: false,
          sampledFrames: [],
        },
      }
    })
  }

  function handleLiveOpsPanelChange(panel: MobilePanel) {
    setOperatorMobileSection('live')
    if (activeTopbarNav !== 'Ghost Live') {
      setActiveTopbarNav('Ghost Live')
    }
    setMobilePanel(panel)
  }

  function handleBottomNavChange(panel: MobilePanel) {
    handleLiveOpsPanelChange(panel)
  }

  function handleOperatorMobileSectionChange(section: OperatorMobileSection) {
    closeTopbarOverlays()
    setOperatorMobileSection(section)

    if (section === 'live' && activeTopbarNav !== 'Ghost Live') {
      setActiveTopbarNav('Ghost Live')
    }

    if (section === 'channels' && canAccessCommandCenter) {
      setActiveTopbarNav('Command Center')
    }
  }

  function handleTopbarNavChange(nextNav: TopbarNavItem) {
    if (nextNav === 'Command Center' && !canAccessCommandCenter) {
      return
    }
    if (nextNav === 'Ghost Live') {
      setOperatorMobileSection('live')
    }
    if (nextNav === 'Command Center') {
      setOperatorMobileSection('channels')
    }
    setActiveTopbarNav(nextNav)
  }

  async function handleIssueSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!issueTitle.trim() || !issueDescription.trim()) {
      setIssueSubmitError('יש למלא כותרת ותיאור תקלה.')
      return
    }
    try {
      setIssueSubmitError('')
      setIssueSubmitSuccess('')
      await reportIssue({
        title: issueTitle.trim(),
        description: issueDescription.trim(),
        severity: issueSeverity,
      })
      setIssueSubmitSuccess('התקלה נשלחה בהצלחה לצוות הניהול.')
      setIssueTitle('')
      setIssueDescription('')
      setIssueSeverity('medium')
    } catch (error) {
      setIssueSubmitError(error instanceof Error ? error.message : 'שליחת תקלה נכשלה.')
    }
  }

  const operatorMobileNavItems = [
    { id: 'live', label: 'גוסט לייב' },
    { id: 'channels', label: 'ערוצים' },
    { id: 'alerts', label: 'התראות', badge: totalUnreadAlerts > 0 ? totalUnreadAlerts : undefined },
    { id: 'account', label: 'חשבון' },
  ] satisfies Array<{ id: OperatorMobileSection; label: string; badge?: number }>

  const liveOpsMobilePanelItems = [
    { id: 'inbox', label: 'שיחות' },
    { id: 'chat', label: 'צ׳אט' },
    { id: 'details', label: 'ערוץ' },
  ] satisfies Array<{ id: MobilePanel; label: string }>

  function renderOperatorMobileAlertsScreen() {
    return (
      <main className="operator-mobile-screen">
        <MobileSectionHeader
          eyebrow="התראות"
          title="התראות קריטיות"
          description="סקור, אשר או עבור ישירות לערוץ שנפגע."
        />
        <CriticalAlertsCenter
          alerts={criticalAlerts}
          embedded
          onApprove={(alert) => handleApproveCriticalAlert(alert.messageId, alert.channelId)}
          onClose={() => undefined}
          onDelete={(alert) => handleDeleteCriticalAlert(alert.messageId, alert.channelId)}
          onIgnore={(alert) => handleIgnoreCriticalAlert(alert.messageId, alert.channelId)}
          onSelectChannel={(channelId) => {
            selectChannel(channelId)
            setOperatorMobileSection('live')
            setMobilePanel('chat')
          }}
        />
      </main>
    )
  }

  function renderOperatorMobileAccountScreen() {
    return (
      <main className="operator-mobile-screen operator-mobile-account">
        <MobileSectionHeader
          eyebrow="חשבון"
          title={fullName}
          description="פרטי סשן, פעולות מהירות ותמונת מצב של הצוות."
        />

        <div className="operator-mobile-stack">
          <MobileSurfaceCard title="סשן" eyebrow="מחובר">
            <div className="operator-mobile-kpis">
              <div><span>ארגון</span><strong>{organizationName || 'גוסט'}</strong></div>
              <div><span>תפקיד</span><strong>{formatRoleLabel(currentUserRole)}</strong></div>
              <div><span>ערוצים</span><strong>{channels.length}</strong></div>
              <div><span>פידים חיים</span><strong>{totalLiveFeeds}</strong></div>
            </div>
          </MobileSurfaceCard>

          <MobileSurfaceCard title="פעולות מהירות" description="הפעולות החשובות שנשארות נגישות גם בנייד.">
            <div className="operator-mobile-action-list">
              {operatorQuickActions.slice(0, 6).map((action) => (
                <button key={action.id} className="topbar-action-card" onClick={action.run} type="button">
                  <strong>{action.title}</strong>
                  <span>{action.description}</span>
                </button>
              ))}
            </div>
          </MobileSurfaceCard>

          <MobileSurfaceCard title="מפעילים וחברים">
            <div className="topbar-chip-list">
              {operatorMembers.length > 0
                ? operatorMembers.map((member) => <span key={member} className="topbar-chip">{member}</span>)
                : <p>כרגע אין חברים פעילים להצגה.</p>}
            </div>
          </MobileSurfaceCard>

          <MobileSurfaceCard title="פעילות אחרונה">
            <div className="topbar-audit-list">
              {operatorRecentActivity.slice(0, 8).map((entry) => (
                <article key={entry.id} className="topbar-audit-item">
                  <div className="topbar-audit-head">
                    <strong>{entry.channelName}</strong>
                    <span>{entry.time}</span>
                  </div>
                  <p>{formatAuthorLabel(entry.author)}: {entry.text}</p>
                </article>
              ))}
            </div>
          </MobileSurfaceCard>
        </div>
      </main>
    )
  }

  function renderLiveOpsWorkspace() {
    return (
      <main
        className={`workspace ${isDetailsCollapsed ? 'details-collapsed' : ''}`}
        onTouchEnd={handleWorkspaceTouchEnd}
        onTouchStart={handleWorkspaceTouchStart}
      >
        <div aria-hidden className="ghostlive-terminal-bg">
          <span className="ghostlive-terminal-glow" />
          <span className="ghostlive-terminal-scanlines" />
          {GHOSTLIVE_INTEL_LINES.map((line) => {
            const style = {
              '--line-top': line.top,
              '--line-left': line.left,
              '--line-cycle': `${line.cycleSec}s`,
              '--line-delay': `${line.delaySec}s`,
              '--line-size': `${line.fontSizePx}px`,
              '--line-chars': line.text.length,
              '--line-max': line.maxWidth,
            } as CSSProperties
            return (
              <span key={`${line.text}_${line.top}_${line.left}`} className="ghostlive-code-blip" style={style}>
                <span className="ghostlive-code-typed">{line.text}</span>
              </span>
            )
          })}
        </div>
        <header className="workspace-header">
          <div>
            <p className="eyebrow">גוסט לייב</p>
            <h2>ניטור חי</h2>
          </div>
          <div className="workspace-stats">
            <span>{totalLiveFeeds} LIVE</span>
            <span>{channels.length} ערוצים</span>
            <span>{totalOperations} מבצעים</span>
            <span>{totalUnreadAlerts > 0 ? `${totalUnreadAlerts} התראות` : 'תקין'}</span>
            <button className="ghost-button" type="button" onClick={() => setIsIssueModalOpen(true)}>
              דווח תקלה
            </button>
          </div>
        </header>

        {isMobileLayout ? (
          <MobileTabBar
            activeId={mobilePanel}
            ariaLabel="לשוניות מובייל גוסט לייב"
            className="live-ops-mobile-tabs mobile-only"
            items={liveOpsMobilePanelItems}
            onChange={(id) => handleLiveOpsPanelChange(id as MobilePanel)}
          />
        ) : null}

        <div className="workspace-panels">
          <InboxPanel
            channels={sortedFilteredChannels}
            focusSearchToken={inboxSearchFocusToken}
            groupSelectionIds={groupSelectionIds}
            hasMoreChannels={hasMoreChannels}
            isGroupingMode={isGroupingMode}
            onCreateNewChat={handleInboxCreateChat}
            onCreateGroupFromSelection={createGroupFromSelection}
            onLoadMoreChannels={() => setVisibleChannelsCount((currentCount) => currentCount + INBOX_PAGE_SIZE)}
            onOpenInboxMenu={handleInboxMoreOptions}
            onSearchQueryChange={(value) => { setSearchQuery(value); setVisibleChannelsCount(INBOX_PAGE_SIZE) }}
            onSelectChannel={selectChannel}
            onToggleGroupSelection={toggleGroupSelection}
            onToggleGroupingMode={() => {
              setIsGroupingMode((currentState) => {
                const nextState = !currentState
                if (!nextState) {
                  setGroupSelectionIds([])
                }
                return nextState
              })
            }}
            alertingChannelIds={alertingChannelIds}
            searchQuery={searchQuery}
            selectedChannelId={selectedChannel.id}
            visibleCount={visibleChannelsCount}
          />

          <ChatPanel
            activeOpsCount={selectedChannelActiveOps}
            isSending={isSending}
            messageDraft={messageDraft}
            messageStreamRef={messageStreamRef}
            nextScanInfo={nextScanInfo}
            onDismissFrame={handleDismissFrame}
            onMessageDraftChange={setMessageDraft}
            onMessageStreamScroll={handleMessageStreamScroll}
            onMessageSubmit={handleMessageSubmit}
            onShowDetails={openSelectedChannelDetails}
            onShowInbox={() => setMobilePanel('inbox')}
            onStartTimelineSampling={handleStartTimelineSampling}
            onStopTimelineSampling={handleStopTimelineSampling}
            onSuggestionClick={setMessageDraft}
            selectedChannel={selectedChannel}
            timelineSamplerState={selectedTimelineSamplerState}
          />

          {!isDetailsCollapsed ? (
            <div
              aria-hidden
              className="details-drawer-backdrop desktop-only"
              onClick={() => setIsDetailsCollapsed(true)}
            />
          ) : null}

          <DetailsPanel
            key={selectedChannel.id}
            isDetailsCollapsed={isDetailsCollapsed}
            onCollapseDetails={() => setIsDetailsCollapsed(true)}
            onExpandDetails={() => setIsDetailsCollapsed(false)}
            onOpenChannelsHub={() => {
              if (canAccessCommandCenter) {
                setOperatorMobileSection('channels')
                setActiveTopbarNav('Command Center')
              }
            }}
            onSetMobilePanelChat={() => setMobilePanel('chat')}
            onToggleOperation={toggleOperation}
            selectedChannel={selectedChannel}
          />
        </div>
      </main>
    )
  }

  function renderOperatorSurface() {
    if (isMobileLayout) {
      if (operatorMobileSection === 'alerts') {
        return renderOperatorMobileAlertsScreen()
      }

      if (operatorMobileSection === 'account') {
        return renderOperatorMobileAccountScreen()
      }
    }

    if (activeTopbarNav === 'Command Center') {
      return (
        <ChannelsHub
          availableChannelsForLink={availableForGrouping}
          channels={channels}
          linkedChannelIdSet={linkedChannelIdSet}
          mobileMode={isMobileLayout}
          newChannelDraft={newChannelDraft}
          onDeleteOperation={deleteOperationFromSelectedChannel}
          onNewChannelDraftChange={updateNewChannelDraftField}
          onNewChannelSubmit={handleNewChannelSubmit}
          onOperationDraftChange={updateOperationDraftField}
          onOperationSubmit={handleOperationSubmit}
          onRequestDeleteSelectedChannel={requestDeleteSelectedChannel}
          onSelectChannel={selectChannel}
          onToggleLinkedChannelId={toggleNewChannelDraftLinkedId}
          onToggleNewChannelForm={() => setShowNewChannelForm((currentState) => !currentState)}
          onToggleOperation={toggleOperation}
          onUpdateOperationField={updateOperationFieldForSelectedChannel}
          onUpdateSelectedChannel={updateSelectedChannel}
          operationDraft={operationDraft}
          selectedChannel={selectedChannel}
          selectedChannelId={selectedChannel.id}
          showNewChannelForm={showNewChannelForm}
        />
      )
    }

    return renderLiveOpsWorkspace()
  }

  if (isLoadingChannels) {
    return (
      <div className="app-shell surface-live-ops" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <p style={{ color: '#9ca3af', fontSize: 14 }}>טוען ערוצים...</p>
      </div>
    )
  }
  if (isMobileLayout) {
    return (
      <div
        className={`app-shell operator-mobile-app-shell ${operatorMobileSection === 'live' ? 'surface-live-ops operator-mobile-live-shell' : ''}`}
        data-mobile-panel={mobilePanel}
      >
        <div className="app-surface">
          <Topbar
            accountMenuItems={operatorAccountMenuItems}
            fullName={fullName}
            organizationName={organizationName}
            role={currentUserRole}
            activeNav={activeTopbarNav}
            canAccessCommandCenter={canAccessCommandCenter}
            channelsCount={channels.length}
            onAccountAction={handleAccountAction}
            onBrandClick={() => {
              setOperatorMobileSection('live')
              setActiveTopbarNav('Ghost Live')
            }}
            onCommandTrigger={openCommandPalette}
            onOpenNotificationsCenter={() => handleOperatorMobileSectionChange('alerts')}
            onOpenShortcuts={() => {
              setIsCommandPaletteOpen(false)
              setIsSupportOpen(false)
              setActiveAccountDialog(null)
              setIsShortcutsOpen(true)
            }}
            onOpenSupport={() => handleOperatorMobileSectionChange('account')}
            onNavChange={handleTopbarNavChange}
            onToggleTheme={onToggleTheme}
            totalLiveFeeds={totalLiveFeeds}
            totalOperations={totalOperations}
            totalUnreadAlerts={totalUnreadAlerts}
            themeMode={themeMode}
          />

          {renderOperatorSurface()}
        </div>

        <MobileTabBar
          activeId={operatorMobileSection}
          ariaLabel="Operator mobile navigation"
          className="operator-mobile-primary-nav mobile-only"
          items={operatorMobileNavItems}
          onChange={(id) => handleOperatorMobileSectionChange(id as OperatorMobileSection)}
        />

        {isCommandPaletteOpen ? (
          <SurfaceDialog
            eyebrow="פקודה מהירה"
            title="קיצורי מפעיל"
            description="מעבר ישיר לזרימת עבודה אמיתית במובייל."
            onClose={() => setIsCommandPaletteOpen(false)}
            width="medium"
          >
            <div className="topbar-dialog-stack">
              <input
                autoFocus
                className="topbar-search-input"
                onChange={(event) => setCommandQuery(event.target.value)}
                placeholder="חפש פעולות, התראות, ערוצים, תמיכה..."
                value={commandQuery}
              />
              <div className="topbar-action-list">
                {filteredOperatorQuickActions.map((action) => (
                  <button key={action.id} className="topbar-action-card" onClick={action.run} type="button">
                    <strong>{action.title}</strong>
                    <span>{action.description}</span>
                  </button>
                ))}
              </div>
            </div>
          </SurfaceDialog>
        ) : null}

        {isShortcutsOpen ? (
          <SurfaceDialog
            eyebrow="קיצורים"
            title="קיצורי מפעיל"
            description="כניסות מהירות לפעולות קיימות במערכת."
            onClose={() => setIsShortcutsOpen(false)}
            width="medium"
          >
            <div className="topbar-shortcuts-grid">
              {operatorQuickActions.map((action) => (
                <button key={action.id} className="topbar-shortcut-tile" onClick={action.run} type="button">
                  <strong>{action.title}</strong>
                  <span>{action.description}</span>
                </button>
              ))}
            </div>
          </SurfaceDialog>
        ) : null}

        {isDeleteModalOpen ? (
          <div aria-modal className="brand-modal-overlay" role="dialog">
            <div className="brand-modal">
              <p className="eyebrow">מחיקה</p>
              <h3>למחוק את הערוץ הזה לצמיתות?</h3>
              <p className="brand-modal-copy">
                הערוץ <strong>{selectedChannel.name}</strong> יימחק יחד עם היסטוריית ההודעות שלו.
                לא ניתן לשחזר פעולה זו.
              </p>
              <div className="brand-modal-actions">
                <button className="ghost-button" onClick={() => setIsDeleteModalOpen(false)} type="button">
                  ביטול
                </button>
                <button className="danger-button" onClick={confirmDeleteSelectedChannel} type="button">
                  מחק לצמיתות
                </button>
              </div>
            </div>
          </div>
        ) : null}

        {isIssueModalOpen ? (
          <div aria-modal className="brand-modal-overlay" role="dialog">
            <div className="brand-modal">
              <p className="eyebrow">דיווח תקלה</p>
              <h3>שלח דיווח תקלה לצוות הניהול</h3>
              <form onSubmit={handleIssueSubmit} style={{ display: 'grid', gap: 8 }}>
                <input value={issueTitle} onChange={(event) => setIssueTitle(event.target.value)} placeholder="כותרת התקלה" />
                <textarea
                  value={issueDescription}
                  onChange={(event) => setIssueDescription(event.target.value)}
                  placeholder="תיאור מפורט"
                  rows={5}
                />
                <select value={issueSeverity} onChange={(event) => setIssueSeverity(event.target.value as 'low' | 'medium' | 'high' | 'critical')}>
                  <option value="low">נמוכה</option>
                  <option value="medium">בינונית</option>
                  <option value="high">גבוהה</option>
                  <option value="critical">קריטית</option>
                </select>
                {issueSubmitError ? <p style={{ color: '#ef4444' }}>{issueSubmitError}</p> : null}
                {issueSubmitSuccess ? <p style={{ color: '#22c55e' }}>{issueSubmitSuccess}</p> : null}
                <div className="brand-modal-actions">
                  <button className="ghost-button" type="button" onClick={() => setIsIssueModalOpen(false)}>
                    סגור
                  </button>
                  <button className="primary-button" type="submit">
                    שלח דיווח
                  </button>
                </div>
              </form>
            </div>
          </div>
        ) : null}

        {flashAlert ? (
          <FlashAlertOverlay alert={flashAlert} onDismiss={() => setFlashAlert(null)} />
        ) : null}
      </div>
    )
  }

  return (
    <div className={`app-shell ${activeTopbarNav === 'Ghost Live' && operatorMobileSection === 'live' ? 'surface-live-ops' : ''}`} data-mobile-panel={mobilePanel}>
      <div className="app-surface">
      <Topbar
        accountMenuItems={operatorAccountMenuItems}
        fullName={fullName}
        organizationName={organizationName}
        role={currentUserRole}
        activeNav={activeTopbarNav}
        canAccessCommandCenter={canAccessCommandCenter}
        channelsCount={channels.length}
        onAccountAction={handleAccountAction}
        onBrandClick={() => {
          setOperatorMobileSection('live')
          setActiveTopbarNav('Ghost Live')
        }}
        onCommandTrigger={openCommandPalette}
        onOpenNotificationsCenter={() => {
          if (isMobileLayout) {
            handleOperatorMobileSectionChange('alerts')
            return
          }
          setIsAlertsCenterOpen(true)
        }}
        onOpenShortcuts={() => {
          setIsCommandPaletteOpen(false)
          setIsSupportOpen(false)
          setActiveAccountDialog(null)
          setIsShortcutsOpen(true)
        }}
        onOpenSupport={() => {
          if (isMobileLayout) {
            handleOperatorMobileSectionChange('account')
            return
          }
          setIsCommandPaletteOpen(false)
          setIsShortcutsOpen(false)
          setActiveAccountDialog(null)
          setIsSupportOpen(true)
        }}
        onNavChange={handleTopbarNavChange}
        onToggleTheme={onToggleTheme}
        totalLiveFeeds={totalLiveFeeds}
        totalOperations={totalOperations}
        totalUnreadAlerts={totalUnreadAlerts}
        themeMode={themeMode}
      />

      {activeTopbarNav === 'Command Center' ? (
        <ChannelsHub
          availableChannelsForLink={availableForGrouping}
          channels={channels}
          linkedChannelIdSet={linkedChannelIdSet}
          newChannelDraft={newChannelDraft}
          onDeleteOperation={deleteOperationFromSelectedChannel}
          onNewChannelDraftChange={updateNewChannelDraftField}
          onNewChannelSubmit={handleNewChannelSubmit}
          onOperationDraftChange={updateOperationDraftField}
          onOperationSubmit={handleOperationSubmit}
          onRequestDeleteSelectedChannel={requestDeleteSelectedChannel}
          onSelectChannel={selectChannel}
          onToggleLinkedChannelId={toggleNewChannelDraftLinkedId}
          onToggleNewChannelForm={() => setShowNewChannelForm((currentState) => !currentState)}
          onToggleOperation={toggleOperation}
          onUpdateOperationField={updateOperationFieldForSelectedChannel}
          onUpdateSelectedChannel={updateSelectedChannel}
          operationDraft={operationDraft}
          selectedChannel={selectedChannel}
          selectedChannelId={selectedChannel.id}
          showNewChannelForm={showNewChannelForm}
        />
      ) : (
        <main
          className={`workspace ${isDetailsCollapsed ? 'details-collapsed' : ''}`}
          onTouchEnd={handleWorkspaceTouchEnd}
          onTouchStart={handleWorkspaceTouchStart}
        >
          <div aria-hidden className="ghostlive-terminal-bg">
            <span className="ghostlive-terminal-glow" />
            <span className="ghostlive-terminal-scanlines" />
            {GHOSTLIVE_INTEL_LINES.map((line) => {
              const style = {
                '--line-top': line.top,
                '--line-left': line.left,
                '--line-cycle': `${line.cycleSec}s`,
                '--line-delay': `${line.delaySec}s`,
                '--line-size': `${line.fontSizePx}px`,
                '--line-chars': line.text.length,
                '--line-max': line.maxWidth,
              } as CSSProperties
              return (
                <span key={`${line.text}_${line.top}_${line.left}`} className="ghostlive-code-blip" style={style}>
                  <span className="ghostlive-code-typed">{line.text}</span>
                </span>
              )
            })}
          </div>
          <header className="workspace-header">
            <div>
              <p className="eyebrow">גוסט לייב</p>
              <h2>ניטור חי</h2>
            </div>
            <div className="workspace-stats">
              <span>{totalLiveFeeds} LIVE</span>
              <span>{channels.length} ערוצים</span>
              <span>{totalOperations} מבצעים</span>
              <span>{totalUnreadAlerts > 0 ? `${totalUnreadAlerts} התראות` : 'תקין'}</span>
              <button className="ghost-button" type="button" onClick={() => setIsIssueModalOpen(true)}>
                דווח תקלה
              </button>
            </div>
          </header>

          <div className="workspace-panels">
            <InboxPanel
              channels={sortedFilteredChannels}
              focusSearchToken={inboxSearchFocusToken}
              groupSelectionIds={groupSelectionIds}
              hasMoreChannels={hasMoreChannels}
              isGroupingMode={isGroupingMode}
              onCreateNewChat={handleInboxCreateChat}
              onCreateGroupFromSelection={createGroupFromSelection}
              onLoadMoreChannels={() => setVisibleChannelsCount((currentCount) => currentCount + INBOX_PAGE_SIZE)}
              onOpenInboxMenu={handleInboxMoreOptions}
              onSearchQueryChange={(value) => { setSearchQuery(value); setVisibleChannelsCount(INBOX_PAGE_SIZE) }}
              onSelectChannel={selectChannel}
              onToggleGroupSelection={toggleGroupSelection}
              onToggleGroupingMode={() => {
                setIsGroupingMode((currentState) => {
                  const nextState = !currentState
                  if (!nextState) {
                    setGroupSelectionIds([])
                  }
                  return nextState
                })
              }}
              alertingChannelIds={alertingChannelIds}
              searchQuery={searchQuery}
              selectedChannelId={selectedChannel.id}
              visibleCount={visibleChannelsCount}
            />

            <ChatPanel
              activeOpsCount={selectedChannelActiveOps}
              isSending={isSending}
              messageDraft={messageDraft}
              messageStreamRef={messageStreamRef}
              nextScanInfo={nextScanInfo}
              onDismissFrame={handleDismissFrame}
              onMessageDraftChange={setMessageDraft}
              onMessageStreamScroll={handleMessageStreamScroll}
              onMessageSubmit={handleMessageSubmit}
              onStartTimelineSampling={handleStartTimelineSampling}
              onStopTimelineSampling={handleStopTimelineSampling}
              onShowDetails={openSelectedChannelDetails}
              onShowInbox={() => setMobilePanel('inbox')}
              onSuggestionClick={setMessageDraft}
              selectedChannel={selectedChannel}
              timelineSamplerState={selectedTimelineSamplerState}
            />

            {!isDetailsCollapsed ? (
              <div
                aria-hidden
                className="details-drawer-backdrop desktop-only"
                onClick={() => setIsDetailsCollapsed(true)}
              />
            ) : null}

            <DetailsPanel
              key={selectedChannel.id}
              isDetailsCollapsed={isDetailsCollapsed}
              onCollapseDetails={() => setIsDetailsCollapsed(true)}
              onExpandDetails={() => setIsDetailsCollapsed(false)}
              onOpenChannelsHub={() => {
                if (canAccessCommandCenter) {
                  setActiveTopbarNav('Command Center')
                }
              }}
              onSetMobilePanelChat={() => setMobilePanel('chat')}
              onToggleOperation={toggleOperation}
              selectedChannel={selectedChannel}
            />
          </div>
        </main>
      )}

      <AppFooter />
      </div>

      <nav className="bottom-nav mobile-only">
        <button
          className={mobilePanel === 'inbox' ? 'active' : ''}
          onClick={() => handleBottomNavChange('inbox')}
          type="button"
        >
          שיחות
        </button>
        <button
          className={mobilePanel === 'chat' ? 'active' : ''}
          onClick={() => handleBottomNavChange('chat')}
          type="button"
        >
          שיחה
        </button>
        <button
          className={mobilePanel === 'details' ? 'active' : ''}
          onClick={() => handleBottomNavChange('details')}
          type="button"
        >
          ערוץ
        </button>
      </nav>

      {isCommandPaletteOpen ? (
        <SurfaceDialog
          eyebrow="פקודה מהירה"
          title="לוח פקודות"
          description="חפש פעולות זמינות ועבור ישירות לזרימת העבודה המתאימה."
          onClose={() => setIsCommandPaletteOpen(false)}
          width="medium"
        >
          <div className="topbar-dialog-stack">
            <input
              autoFocus
              className="topbar-search-input"
              onChange={(event) => setCommandQuery(event.target.value)}
              placeholder="חפש פעולות, התראות, מרכז פיקוד, תמיכה..."
              value={commandQuery}
            />
            <div className="topbar-action-list">
              {filteredOperatorQuickActions.map((action) => (
                <button key={action.id} className="topbar-action-card" onClick={action.run} type="button">
                  <strong>{action.title}</strong>
                  <span>{action.description}</span>
                </button>
              ))}
            </div>
          </div>
        </SurfaceDialog>
      ) : null}

      {isShortcutsOpen ? (
        <SurfaceDialog
          eyebrow="קיצורים"
          title="קיצורי מפעיל"
          description="כניסה מהירה לפעולות שכבר קיימות במרחב הזה."
          onClose={() => setIsShortcutsOpen(false)}
          width="medium"
        >
          <div className="topbar-shortcuts-grid">
            {operatorQuickActions.map((action) => (
              <button key={action.id} className="topbar-shortcut-tile" onClick={action.run} type="button">
                <strong>{action.title}</strong>
                <span>{action.description}</span>
              </button>
            ))}
          </div>
        </SurfaceDialog>
      ) : null}

      {isSupportOpen ? (
        <SurfaceDialog
          eyebrow="תמיכה"
          title="פעולות תמיכה למפעיל"
          description="כל פעולה למטה פותחת זרימה אמיתית בתוך המערכת."
          onClose={() => setIsSupportOpen(false)}
          width="medium"
        >
          <div className="topbar-action-list">
            <button className="topbar-action-card" onClick={openIssueReport} type="button">
              <strong>דווח על תקלה</strong>
              <span>פתח את חלון הדיווח ושלח תקלה חיה להנהלת Ghost.</span>
            </button>
            <button
              className="topbar-action-card"
              onClick={() => {
                closeTopbarOverlays()
                setIsAlertsCenterOpen(true)
              }}
              type="button"
            >
              <strong>התראות קריטיות</strong>
              <span>סקור, אשר, התעלם או עבור ישירות לערוץ שנפגע.</span>
            </button>
            <button
              className="topbar-action-card"
              onClick={() => {
                closeTopbarOverlays()
                setActiveTopbarNav('Command Center')
              }}
              type="button"
            >
              <strong>פתח מרכז פיקוד</strong>
              <span>עבור לערוצים, מבצעים והגדרות סביבת העבודה.</span>
            </button>
          </div>
        </SurfaceDialog>
      ) : null}

      {activeAccountDialog === 'profile' ? (
        <SurfaceDialog
          eyebrow="פרופיל"
          title={fullName}
          description="סשן מפעיל מאומת פעיל."
          onClose={() => setActiveAccountDialog(null)}
          width="narrow"
        >
          <div className="topbar-dialog-stack">
            <div className="topbar-info-row"><span>ארגון</span><strong>{organizationName || 'גוסט'}</strong></div>
            <div className="topbar-info-row"><span>תפקיד</span><strong>{formatRoleLabel(currentUserRole)}</strong></div>
            <div className="topbar-info-row"><span>ערוצים</span><strong>{channels.length}</strong></div>
            <div className="topbar-info-row"><span>ערוצים חיים</span><strong>{totalLiveFeeds}</strong></div>
          </div>
        </SurfaceDialog>
      ) : null}

      {activeAccountDialog === 'team' ? (
        <SurfaceDialog
          eyebrow="צוות"
          title="מפעילים וחברים זמינים"
          description="נתוני חברים חיים שנאספו מרשימת הערוצים הנוכחית."
          onClose={() => setActiveAccountDialog(null)}
          width="medium"
        >
          <div className="topbar-chip-list">
            {operatorMembers.length > 0 ? operatorMembers.map((member) => <span key={member} className="topbar-chip">{member}</span>) : <p>אין חברים זמינים.</p>}
          </div>
        </SurfaceDialog>
      ) : null}

      {activeAccountDialog === 'audit' ? (
        <SurfaceDialog
          eyebrow="בקרה"
          title="פעילות אחרונה במרחב"
          description="תעבורת ההודעות האחרונה שזמינה למפעיל המאומת הנוכחי."
          onClose={() => setActiveAccountDialog(null)}
          width="medium"
        >
          <div className="topbar-audit-list">
            {operatorRecentActivity.map((entry) => (
              <article key={entry.id} className="topbar-audit-item">
                <div className="topbar-audit-head">
                  <strong>{entry.channelName}</strong>
                  <span>{entry.time}</span>
                </div>
                <p>{formatAuthorLabel(entry.author)}: {entry.text}</p>
              </article>
            ))}
          </div>
        </SurfaceDialog>
      ) : null}

      {flashAlert ? (
        <FlashAlertOverlay alert={flashAlert} onDismiss={() => setFlashAlert(null)} />
      ) : null}

      {isAlertsCenterOpen ? (
        <CriticalAlertsCenter
          alerts={criticalAlerts}
          onApprove={(alert) => handleApproveCriticalAlert(alert.messageId, alert.channelId)}
          onClose={() => setIsAlertsCenterOpen(false)}
          onDelete={(alert) => handleDeleteCriticalAlert(alert.messageId, alert.channelId)}
          onIgnore={(alert) => handleIgnoreCriticalAlert(alert.messageId, alert.channelId)}
          onSelectChannel={(channelId) => {
            selectChannel(channelId)
            setIsAlertsCenterOpen(false)
          }}
        />
      ) : null}

      {isDeleteModalOpen ? (
        <div aria-modal className="brand-modal-overlay" role="dialog">
          <div className="brand-modal">
            <p className="eyebrow">מחיקה קשיחה</p>
            <h3>האם אתה בטוח שברצונך למחוק את הערוץ?</h3>
            <p className="brand-modal-copy">
              הערוץ <strong>{selectedChannel.name}</strong> יימחק לצמיתות יחד עם היסטוריית השיחה שלו.
              פעולה זו אינה ניתנת לשחזור.
            </p>
            <div className="brand-modal-actions">
              <button className="ghost-button" onClick={() => setIsDeleteModalOpen(false)} type="button">
                ביטול
              </button>
              <button className="danger-button" onClick={confirmDeleteSelectedChannel} type="button">
                כן, מחק סופית
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {isIssueModalOpen ? (
        <div aria-modal className="brand-modal-overlay" role="dialog">
          <div className="brand-modal">
            <p className="eyebrow">דיווח תקלה</p>
            <h3>שליחת באג לצוות הניהול</h3>
            <form onSubmit={handleIssueSubmit} style={{ display: 'grid', gap: 8 }}>
              <input value={issueTitle} onChange={(event) => setIssueTitle(event.target.value)} placeholder="כותרת תקלה" />
              <textarea
                value={issueDescription}
                onChange={(event) => setIssueDescription(event.target.value)}
                placeholder="תיאור מפורט"
                rows={5}
              />
              <select value={issueSeverity} onChange={(event) => setIssueSeverity(event.target.value as 'low' | 'medium' | 'high' | 'critical')}>
                <option value="low">low</option>
                <option value="medium">medium</option>
                <option value="high">high</option>
                <option value="critical">critical</option>
              </select>
              {issueSubmitError ? <p style={{ color: '#ef4444' }}>{issueSubmitError}</p> : null}
              {issueSubmitSuccess ? <p style={{ color: '#22c55e' }}>{issueSubmitSuccess}</p> : null}
              <div className="brand-modal-actions">
                <button className="ghost-button" type="button" onClick={() => setIsIssueModalOpen(false)}>
                  סגור
                </button>
                <button className="primary-button" type="submit">
                  שלח דיווח
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {isGroupNameModalOpen ? (
        <GroupNameModal
          channelNames={pendingGroupChannelIds
            .map((id) => channels.find((ch) => ch.id === id)?.name || '')
            .filter(Boolean)}
          value={groupNameDraft}
          onChange={setGroupNameDraft}
          onConfirm={() => confirmGroupCreation(groupNameDraft)}
          onCancel={() => {
            setIsGroupNameModalOpen(false)
            setPendingGroupChannelIds([])
            setGroupNameDraft('')
          }}
        />
      ) : null}
    </div>
  )
}

export default App
