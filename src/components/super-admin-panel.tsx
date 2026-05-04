import { useEffect, useMemo, useState } from 'react'
import type { AccountMenuItem } from './account-menu'
import type {
  AdminOperationRecord,
  AdminOperationRunRecord,
  AuthProfile,
  ChannelUsageMonthly,
  OrganizationDetailsResponse,
  OrganizationLimits,
  OrganizationUser,
  SuperAdminIssue,
  SuperAdminOverviewResponse,
} from '../types/admin'
import {
  createOrganization,
  createUser,
  getOrganizationDetails,
  getIssues,
  getSuperAdminOverview,
  listUsers,
  revealPaymentCard,
  saveOrganizationAiKey,
  savePaymentCard,
  updateOrganization,
  updateIssue,
  updateUser,
} from '../services/admin-api'
import { impersonateUser } from '../services/auth-api'
import { connectAdminRealtime, type RealtimeEvent, type RealtimeMode } from '../services/realtime-socket'
import { AppFooter } from './app-footer'
import { SurfaceDialog } from './surface-dialog'
import { Topbar } from './topbar'
import type { TopbarNavItem } from './topbar'
import './super-admin-panel.css'

interface SuperAdminPanelProps {
  profile: AuthProfile
  onLogout: () => void
  onToggleTheme: () => void
  themeMode: 'light' | 'dark'
}

type SuperAdminTab = 'overview' | 'ghostLive' | 'users' | 'billing' | 'usage' | 'issues' | 'events' | 'suspendedOrganizations'
type SuperAdminAccountDialog = 'profile' | 'api' | null
type SuperAdminNavScreen = 'Ghost Live' | 'Command Center' | 'Super Admin'

interface QuickAction {
  id: string
  title: string
  description: string
  keywords: string
  run: () => void
}

const ORGANIZATION_STATUS_LABELS: Record<'active' | 'suspended', string> = {
  active: 'פעיל',
  suspended: 'מושהה',
}

const USER_STATUS_LABELS: Record<'active' | 'inactive', string> = {
  active: 'פעיל',
  inactive: 'לא פעיל',
}

const USER_ROLE_LABELS: Record<'system_manager' | 'regular_user', string> = {
  system_manager: 'מנהל מערכת',
  regular_user: 'משתמש רגיל',
}

const ISSUE_STATUS_LABELS: Record<'open' | 'in_progress' | 'resolved', string> = {
  open: 'פתוח',
  in_progress: 'בטיפול',
  resolved: 'נפתר',
}

const ISSUE_SEVERITY_LABELS: Record<'low' | 'medium' | 'high' | 'critical', string> = {
  low: 'נמוכה',
  medium: 'בינונית',
  high: 'גבוהה',
  critical: 'קריטית',
}

const OP_MODE_LABELS: Record<string, string> = {
  alert: 'התרעה',
  report: 'דוח',
  rating: 'דירוג',
  assessment: 'הערכה',
}

const RUN_STATUS_LABELS: Record<string, string> = {
  queued: 'בתור',
  running: 'רץ',
  success: 'הצלחה',
  failed: 'נכשל',
}

const DEFAULT_LIMITS: OrganizationLimits = {
  maxChannels: 20,
  maxMessagesPerChannelPerMonth: 10_000,
  monthlyChargeAmount: 499,
  maxAgentsTotalCost: 2_000,
  maxAiTotalCost: 5_000,
  maxApiTotalCost: 2_500,
}

/**
 * מסך ניהול־על מרכזי לסופר־אדמין עם מדדים חיים ופעולות תפעוליות.
 */
export function SuperAdminPanel({ onLogout, onToggleTheme, profile, themeMode }: SuperAdminPanelProps) {
  const [overview, setOverview] = useState<SuperAdminOverviewResponse | null>(null)
  const [allUsers, setAllUsers] = useState<OrganizationUser[]>([])
  const [issues, setIssues] = useState<SuperAdminIssue[]>([])
  const [organizationDetails, setOrganizationDetails] = useState<OrganizationDetailsResponse | null>(null)
  const [events, setEvents] = useState<RealtimeEvent[]>([])
  const [selectedOrganizationId, setSelectedOrganizationId] = useState('')
  const [selectedTab, setSelectedTab] = useState<SuperAdminTab>('overview')
  const [activeTopbarNav, setActiveTopbarNav] = useState<SuperAdminNavScreen>('Super Admin')
  const [isInitialLoad, setIsInitialLoad] = useState(true)
  const [realtimeMode, setRealtimeMode] = useState<RealtimeMode>('disconnected')
  const [errorMessage, setErrorMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [isBusy, setIsBusy] = useState(false)
  const [organizationSearch, setOrganizationSearch] = useState('')
  const [organizationName, setOrganizationName] = useState('')
  const [organizationStatusDraft, setOrganizationStatusDraft] = useState<'active' | 'suspended'>('active')
  const [organizationLimitsDraft, setOrganizationLimitsDraft] = useState<OrganizationLimits>(DEFAULT_LIMITS)
  const [newUserOrgId, setNewUserOrgId] = useState('')
  const [newUsername, setNewUsername] = useState('')
  const [newUserFirstName, setNewUserFirstName] = useState('')
  const [newUserLastName, setNewUserLastName] = useState('')
  const [newUserPassword, setNewUserPassword] = useState('')
  const [newUserRole, setNewUserRole] = useState<'system_manager' | 'regular_user'>('regular_user')
  const [selectedUserId, setSelectedUserId] = useState('')
  const [selectedUserRoleDraft, setSelectedUserRoleDraft] = useState<'system_manager' | 'regular_user'>('regular_user')
  const [selectedUserActiveDraft, setSelectedUserActiveDraft] = useState(true)
  const [billingOrgId, setBillingOrgId] = useState('')
  const [cardPan, setCardPan] = useState('')
  const [cardholderName, setCardholderName] = useState('')
  const [expiryMonth, setExpiryMonth] = useState('')
  const [expiryYear, setExpiryYear] = useState('')
  const [billingEmail, setBillingEmail] = useState('')
  const [managerCode, setManagerCode] = useState('')
  const [revealedPan, setRevealedPan] = useState('')
  const [savedCardPreview, setSavedCardPreview] = useState<{ maskedPan: string; last4: string; expiryMonth: string; expiryYear: string } | null>(null)
  const [aiKeyOrgId, setAiKeyOrgId] = useState('')
  const [aiApiKey, setAiApiKey] = useState('')
  const [issueFilterOrgId, setIssueFilterOrgId] = useState('')
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false)
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false)
  const [isSupportOpen, setIsSupportOpen] = useState(false)
  const [commandQuery, setCommandQuery] = useState('')
  const [activeAccountDialog, setActiveAccountDialog] = useState<SuperAdminAccountDialog>(null)

  async function reloadData() {
    const [nextOverview, nextIssues, nextUsers] = await Promise.all([getSuperAdminOverview(), getIssues(), listUsers()])
    setOverview(nextOverview)
    setIssues(nextIssues)
    setAllUsers(nextUsers)
    setIsInitialLoad(false)
    setSelectedOrganizationId((currentOrganizationId) => {
      if (currentOrganizationId && nextOverview.organizations.some((organization) => organization.id === currentOrganizationId)) {
        return currentOrganizationId
      }
      return nextOverview.organizations[0]?.id ?? ''
    })
  }

  async function reloadOrganizationDetails(organizationId: string) {
    if (!organizationId) {
      setOrganizationDetails(null)
      return
    }
    const details = await getOrganizationDetails(organizationId)
    setOrganizationDetails(details)
    setOrganizationName(details.organization.name)
    setOrganizationStatusDraft(details.organization.status)
    setOrganizationLimitsDraft(details.organization.limits)
    setNewUserOrgId(organizationId)
    setBillingOrgId(organizationId)
    setAiKeyOrgId(organizationId)
    setIssueFilterOrgId(organizationId)
    setManagerCode('')
    setRevealedPan('')
  }

  useEffect(() => {
    void reloadData().catch((error) => {
      setErrorMessage(error instanceof Error ? error.message : 'טעינת נתונים נכשלה.')
    })
    const subscription = connectAdminRealtime(
      (event) => {
        setEvents((currentEvents) => [event, ...currentEvents].slice(0, 40))
        if (event.eventType === 'usage.updated' || event.eventType === 'issue.created' || event.eventType === 'issue.updated') {
          void reloadData().catch(() => undefined)
        }
      },
      (mode) => setRealtimeMode(mode),
    )
    return () => subscription.close()
  }, [])

  useEffect(() => {
    if (!selectedOrganizationId) {
      return
    }
    void reloadOrganizationDetails(selectedOrganizationId).catch((error) => {
      setErrorMessage(error instanceof Error ? error.message : 'טעינת ארגון נכשלה.')
    })
  }, [selectedOrganizationId])

  useEffect(() => {
    if (managerCode !== '1553' || !billingOrgId) {
      setRevealedPan('')
      return
    }
    void (async () => {
      try {
        const result = await revealPaymentCard(billingOrgId, managerCode)
        setRevealedPan(result.pan)
      } catch {
        setRevealedPan('')
      }
    })()
  }, [billingOrgId, managerCode])

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

  const organizations = useMemo(() => overview?.organizations ?? [], [overview])
  const activeOrganizations = useMemo(
    () => organizations.filter((organization) => organization.status === 'active'),
    [organizations],
  )
  const suspendedOrganizations = useMemo(
    () => organizations.filter((organization) => organization.status === 'suspended'),
    [organizations],
  )
  const filteredOrganizations = useMemo(() => {
    const normalizedSearch = organizationSearch.trim().toLowerCase()
    if (!normalizedSearch) {
      return activeOrganizations
    }
    return activeOrganizations.filter((organization) => {
      return `${organization.name} ${organization.status}`.toLowerCase().includes(normalizedSearch)
    })
  }, [activeOrganizations, organizationSearch])
  const selectedOrganization = useMemo(
    () => organizations.find((organization) => organization.id === selectedOrganizationId) ?? null,
    [selectedOrganizationId, organizations],
  )
  const selectedOrganizationUsers = useMemo(
    () => allUsers.filter((user) => user.organizationId === selectedOrganizationId),
    [allUsers, selectedOrganizationId],
  )
  const filteredIssues = useMemo(() => {
    if (!issueFilterOrgId) {
      return issues
    }
    return issues.filter((issue) => issue.organizationId === issueFilterOrgId)
  }, [issueFilterOrgId, issues])
  const unresolvedIssuesCount = useMemo(() => issues.filter((issue) => issue.status !== 'resolved').length, [issues])
  const superAdminAccountMenuItems = useMemo<AccountMenuItem[]>(
    () => [
      { id: 'profile', label: 'פרופיל אישי', icon: '◈', section: 'main' },
      { id: 'overview', label: 'סקירה', icon: '◫', section: 'main' },
      { id: 'suspendedOrganizations', label: 'ארגון מבוטל', icon: '⛶', section: 'main' },
      { id: 'users', label: 'משתמשים', icon: '⊞', section: 'main' },
      { id: 'billing', label: 'תשלומים', icon: '⬡', section: 'main' },
      { id: 'usage', label: 'שימוש', icon: '◌', section: 'main' },
      { id: 'issues', label: 'תקלות', icon: '◉', section: 'main' },
      { id: 'events', label: 'אירועים חיים', icon: '⌁', section: 'main' },
      { id: 'api', label: 'מפתחות API', icon: '⌘', section: 'dev' },
      { id: 'logout', label: 'יציאה מהמערכת', icon: '⏻', section: 'danger', tone: 'danger' },
    ],
    [],
  )

  function closeTopbarOverlays() {
    setIsCommandPaletteOpen(false)
    setIsShortcutsOpen(false)
    setIsSupportOpen(false)
  }

  function navForTab(tab: SuperAdminTab): SuperAdminNavScreen {
    if (tab === 'overview' || tab === 'suspendedOrganizations') {
      return 'Super Admin'
    }
    if (tab === 'users' || tab === 'billing' || tab === 'usage') {
      return 'Command Center'
    }
    return 'Ghost Live'
  }

  function openAdminTab(tab: SuperAdminTab, nav: SuperAdminNavScreen = navForTab(tab)) {
    closeTopbarOverlays()
    setActiveAccountDialog(null)
    setSelectedTab(tab)
    setActiveTopbarNav(nav)
  }

  function handleSuperAdminNavChange(item: TopbarNavItem) {
    closeTopbarOverlays()
    setActiveAccountDialog(null)
    if (item === 'Ghost Live') {
      setSelectedTab((currentTab) => (currentTab === 'ghostLive' || currentTab === 'issues' || currentTab === 'events' ? currentTab : 'ghostLive'))
      setActiveTopbarNav('Ghost Live')
      return
    }
    if (item === 'Command Center') {
      setSelectedTab((currentTab) => (currentTab === 'users' || currentTab === 'billing' || currentTab === 'usage' ? currentTab : 'users'))
      setActiveTopbarNav('Command Center')
      return
    }
    setSelectedTab('overview')
    setActiveTopbarNav('Super Admin')
  }

  function handleAccountAction(itemId: string) {
    if (itemId === 'logout') {
      onLogout()
      return
    }
    if (itemId === 'profile') {
      closeTopbarOverlays()
      setActiveAccountDialog('profile')
      return
    }
    if (itemId === 'api') {
      closeTopbarOverlays()
      setActiveAccountDialog('api')
      return
    }
    if (itemId === 'overview') {
      openAdminTab('overview', 'Super Admin')
      return
    }
    if (itemId === 'suspendedOrganizations') {
      openAdminTab('suspendedOrganizations', 'Super Admin')
      return
    }
    if (itemId === 'users') {
      openAdminTab('users', 'Command Center')
      return
    }
    if (itemId === 'billing') {
      openAdminTab('billing', 'Command Center')
      return
    }
    if (itemId === 'usage') {
      openAdminTab('usage', 'Command Center')
      return
    }
    if (itemId === 'issues') {
      openAdminTab('issues', 'Ghost Live')
      return
    }
    if (itemId === 'events') {
      openAdminTab('events', 'Ghost Live')
    }
  }

  const superAdminQuickActions = useMemo<QuickAction[]>(
    () => [
      {
        id: 'ghost-live',
        title: 'Ghost Live',
        description: 'Open channel management, operations, runs, and live activity.',
        keywords: 'ghost live channels operations runs live workspace',
        run: () => openAdminTab('ghostLive', 'Ghost Live'),
      },
      {
        id: 'overview',
        title: 'Super Admin overview',
        description: 'Return to the main organization overview tab.',
        keywords: 'overview dashboard super admin organizations',
        run: () => openAdminTab('overview', 'Super Admin'),
      },
      {
        id: 'users',
        title: 'Users',
        description: 'Open user management for the selected organization.',
        keywords: 'users team members management',
        run: () => openAdminTab('users', 'Command Center'),
      },
      {
        id: 'billing',
        title: 'Billing',
        description: 'Open payment card and organization billing controls.',
        keywords: 'billing plan payment card',
        run: () => openAdminTab('billing', 'Command Center'),
      },
      {
        id: 'usage',
        title: 'Usage',
        description: 'Inspect usage ledgers, channels, operations, and runs.',
        keywords: 'usage costs ledger channels operations',
        run: () => openAdminTab('usage', 'Command Center'),
      },
      {
        id: 'suspended-organizations',
        title: 'Cancelled organizations',
        description: 'Review suspended organizations, history, and reactivation controls.',
        keywords: 'cancelled organizations suspended deleted archived history',
        run: () => openAdminTab('suspendedOrganizations', 'Super Admin'),
      },
      {
        id: 'issues',
        title: 'Issues',
        description: 'Review open and in-progress issues across organizations.',
        keywords: 'issues alerts bugs notifications',
        run: () => openAdminTab('issues', 'Ghost Live'),
      },
      {
        id: 'events',
        title: 'Live events',
        description: 'Open the realtime event stream.',
        keywords: 'events live realtime websocket audit',
        run: () => openAdminTab('events', 'Ghost Live'),
      },
      {
        id: 'create-org',
        title: 'Create organization',
        description: 'Jump to the admin overview and use the create organization form.',
        keywords: 'create organization onboarding',
        run: () => openAdminTab('overview', 'Super Admin'),
      },
    ],
    [],
  )

  const filteredSuperAdminQuickActions = useMemo(() => {
    const normalizedQuery = commandQuery.trim().toLowerCase()
    if (!normalizedQuery) {
      return superAdminQuickActions
    }
    return superAdminQuickActions.filter((action) =>
      `${action.title} ${action.description} ${action.keywords}`.toLowerCase().includes(normalizedQuery),
    )
  }, [commandQuery, superAdminQuickActions])

  async function handleCreateOrganization() {
    if (!organizationName.trim()) {
      setErrorMessage('נדרש שם ארגון.')
      return
    }
    setIsBusy(true)
    setErrorMessage('')
    setSuccessMessage('')
    try {
      const createdOrganization = await createOrganization(organizationName.trim(), DEFAULT_LIMITS)
      setOrganizationName('')
      setSuccessMessage('הארגון נוצר בהצלחה.')
      await reloadData()
      setSelectedOrganizationId(createdOrganization.id)
      await reloadOrganizationDetails(createdOrganization.id)
      setSelectedTab('overview')
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'יצירת ארגון נכשלה.')
    } finally {
      setIsBusy(false)
    }
  }

  async function handleUpdateOrganization() {
    if (!selectedOrganizationId) {
      setErrorMessage('יש לבחור ארגון לעריכה.')
      return
    }
    setIsBusy(true)
    setErrorMessage('')
    setSuccessMessage('')
    try {
      await updateOrganization(selectedOrganizationId, {
        name: organizationName.trim(),
        status: organizationStatusDraft,
        limits: organizationLimitsDraft,
      })
      setSuccessMessage('פרטי הארגון עודכנו בהצלחה.')
      await reloadData()
      await reloadOrganizationDetails(selectedOrganizationId)
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'עדכון ארגון נכשל.')
    } finally {
      setIsBusy(false)
    }
  }

  async function handleSoftDeleteOrganization() {
    if (!selectedOrganizationId) {
      setErrorMessage('יש לבחור ארגון למחיקה.')
      return
    }
    setIsBusy(true)
    setErrorMessage('')
    setSuccessMessage('')
    try {
      await updateOrganization(selectedOrganizationId, { status: 'suspended' })
      setSuccessMessage('בוצעה מחיקה לוגית: הארגון הושעה.')
      await reloadData()
      await reloadOrganizationDetails(selectedOrganizationId)
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'מחיקה לוגית לארגון נכשלה.')
    } finally {
      setIsBusy(false)
    }
  }

  async function handleReactivateOrganization() {
    if (!selectedOrganizationId) {
      setErrorMessage('יש לבחור ארגון להפעלה מחדש.')
      return
    }

    setIsBusy(true)
    setErrorMessage('')
    setSuccessMessage('')
    try {
      await updateOrganization(selectedOrganizationId, { status: 'active' })
      await reloadData()
      await reloadOrganizationDetails(selectedOrganizationId)
      setOrganizationStatusDraft('active')
      setSuccessMessage('הארגון הופעל מחדש בהצלחה.')
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'הפעלת הארגון מחדש נכשלה.')
    } finally {
      setIsBusy(false)
    }
  }

  async function handleCreateUser() {
    if (!newUserOrgId || !newUsername.trim() || !newUserFirstName.trim() || !newUserLastName.trim() || !newUserPassword.trim()) {
      setErrorMessage('נדרש למלא ארגון, שם פרטי, שם משפחה, שם משתמש וסיסמה.')
      return
    }
    setIsBusy(true)
    setErrorMessage('')
    setSuccessMessage('')
    try {
      await createUser({
        organizationId: newUserOrgId,
        username: newUsername.trim(),
        firstName: newUserFirstName.trim(),
        lastName: newUserLastName.trim(),
        password: newUserPassword,
        role: newUserRole,
      })
      setNewUsername('')
      setNewUserFirstName('')
      setNewUserLastName('')
      setNewUserPassword('')
      setSuccessMessage('המשתמש נוצר בהצלחה.')
      await reloadData()
      if (newUserOrgId) {
        await reloadOrganizationDetails(newUserOrgId)
      }
      setSelectedTab('users')
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'יצירת משתמש נכשלה.')
    } finally {
      setIsBusy(false)
    }
  }

  async function handleUpdateUser() {
    if (!selectedUserId) {
      setErrorMessage('יש לבחור משתמש לעריכה.')
      return
    }
    setIsBusy(true)
    setErrorMessage('')
    setSuccessMessage('')
    try {
      await updateUser(selectedUserId, {
        role: selectedUserRoleDraft,
        isActive: selectedUserActiveDraft,
      })
      setSuccessMessage('פרטי המשתמש עודכנו בהצלחה.')
      await reloadData()
      if (selectedOrganizationId) {
        await reloadOrganizationDetails(selectedOrganizationId)
      }
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'עדכון משתמש נכשל.')
    } finally {
      setIsBusy(false)
    }
  }

  async function handleSoftDeleteUser() {
    if (!selectedUserId) {
      setErrorMessage('יש לבחור משתמש למחיקה.')
      return
    }
    setIsBusy(true)
    setErrorMessage('')
    setSuccessMessage('')
    try {
      await updateUser(selectedUserId, { isActive: false })
      setSuccessMessage('בוצעה מחיקה לוגית: המשתמש הושבת.')
      await reloadData()
      if (selectedOrganizationId) {
        await reloadOrganizationDetails(selectedOrganizationId)
      }
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'מחיקה לוגית למשתמש נכשלה.')
    } finally {
      setIsBusy(false)
    }
  }

  async function handleImpersonateUser(userId: string) {
    setIsBusy(true)
    setErrorMessage('')
    try {
      const payload = await impersonateUser(userId)
      const jsonBytes = new TextEncoder().encode(JSON.stringify(payload))
      const encoded = btoa(String.fromCharCode(...jsonBytes))
      window.open(`${window.location.origin}#impersonate=${encoded}`, '_blank', 'noopener')
      setSuccessMessage('נפתח חלון חדש כמשתמש המבוקש.')
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'התחזות למשתמש נכשלה.')
    } finally {
      setIsBusy(false)
    }
  }

  async function handleSavePaymentCard() {
    if (!billingOrgId || !cardPan || !cardholderName || !expiryMonth || !expiryYear || !billingEmail || !managerCode) {
      setErrorMessage('נדרש למלא את כל פרטי הכרטיס.')
      return
    }
    setIsBusy(true)
    setErrorMessage('')
    setSuccessMessage('')
    try {
      const result = await savePaymentCard({
        organizationId: billingOrgId,
        pan: cardPan,
        cardholderName,
        expiryMonth,
        expiryYear,
        billingEmail,
        managerCode,
      })
      setSavedCardPreview({
        maskedPan: result.maskedPan,
        last4: result.last4,
        expiryMonth,
        expiryYear,
      })
      setCardPan('')
      setRevealedPan('')
      setSuccessMessage('אמצעי התשלום נשמר בהצלחה.')
      if (billingOrgId) {
        await reloadOrganizationDetails(billingOrgId)
      }
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'שמירת הכרטיס נכשלה.')
    } finally {
      setIsBusy(false)
    }
  }

  async function handleSaveAiKey() {
    if (!aiKeyOrgId || !aiApiKey.trim()) {
      setErrorMessage('יש לבחור ארגון ולהזין מפתח AI.')
      return
    }
    setIsBusy(true)
    setErrorMessage('')
    setSuccessMessage('')
    try {
      await saveOrganizationAiKey(aiKeyOrgId, aiApiKey.trim())
      setAiApiKey('')
      setSuccessMessage('מפתח AI נשמר בהצלחה.')
      await reloadData()
      await reloadOrganizationDetails(aiKeyOrgId)
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'שמירת מפתח AI נכשלה.')
    } finally {
      setIsBusy(false)
    }
  }

  async function handleIssueStatusChange(issueId: string, status: 'open' | 'in_progress' | 'resolved') {
    setIsBusy(true)
    setErrorMessage('')
    setSuccessMessage('')
    try {
      await updateIssue(issueId, status)
      setSuccessMessage('סטטוס התקלה עודכן.')
      await reloadData()
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'עדכון תקלה נכשל.')
    } finally {
      setIsBusy(false)
    }
  }

  function handleSelectUserForEdit(user: OrganizationUser) {
    setSelectedUserId(user.id)
    setSelectedUserRoleDraft(user.role === 'regular_user' ? 'regular_user' : 'system_manager')
    setSelectedUserActiveDraft(user.isActive)
  }

  function renderTabContent() {
    if (selectedTab === 'suspendedOrganizations') {
      return (
        <div className="sa-tab-grid">
          <section className="sa-card">
            <h3>ארגונים מבוטלים / מושהים ({suspendedOrganizations.length})</h3>
            {suspendedOrganizations.length === 0 ? (
              <p className="sa-subtle">אין כרגע ארגונים במצב מושהה.</p>
            ) : (
              <ul className="sa-list">
                {suspendedOrganizations.map((organization) => (
                  <li key={organization.id} className={selectedOrganizationId === organization.id ? 'active' : ''}>
                    <button type="button" className="sa-user-select-btn" onClick={() => setSelectedOrganizationId(organization.id)}>
                      <strong>{organization.name}</strong>
                      <span>{ORGANIZATION_STATUS_LABELS[organization.status]}</span>
                      <span>ערוצים: {organization.usage.channelsCount} | מבצעים: {organization.usage.operationsCount ?? 0}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {selectedOrganization?.status === 'suspended' ? (
            <>
              <section className="sa-card">
                <h3>פרטי ארגון מבוטל</h3>
                <div className="sa-kpi-grid">
                  <div><span>שם</span><strong>{selectedOrganization.name}</strong></div>
                  <div><span>סטטוס</span><strong>{ORGANIZATION_STATUS_LABELS[selectedOrganization.status]}</strong></div>
                  <div><span>ערוצים</span><strong>{selectedOrganization.usage.channelsCount}</strong></div>
                  <div><span>מבצעים</span><strong>{selectedOrganization.usage.operationsCount ?? 0}</strong></div>
                  <div><span>הודעות יוצאות</span><strong>{selectedOrganization.usage.sentMessages}</strong></div>
                  <div><span>הודעות נכנסות</span><strong>{selectedOrganization.usage.receivedMessages}</strong></div>
                </div>
                <div className="sa-inline-actions">
                  <button
                    className="primary-button"
                    type="button"
                    disabled={isBusy}
                    onClick={() => void handleReactivateOrganization()}
                  >
                    הפעל מחדש ארגון
                  </button>
                </div>
              </section>

              <section className="sa-card">
                <h3>היסטוריית שימוש ועלויות</h3>
                {(organizationDetails?.usageLedger ?? []).length === 0 ? (
                  <p className="sa-subtle">אין נתוני היסטוריה עבור ארגון זה.</p>
                ) : (
                  <ul className="sa-list">
                    {(organizationDetails?.usageLedger ?? []).map((ledger) => (
                      <li key={ledger.id}>
                        <div className="sa-ledger-row">
                          <strong>{ledger.metricType}</strong>
                          <span>${ledger.amount.toFixed(2)}</span>
                          <span>{new Date(ledger.createdAtIso).toLocaleString('he-IL')}</span>
                        </div>
                        <p>{ledger.details}</p>
                      </li>
                    ))}
                  </ul>
                )}
              </section>

              <section className="sa-card">
                <h3>היסטוריית הרצות אחרונות</h3>
                {(organizationDetails?.recentRuns ?? []).length === 0 ? (
                  <p className="sa-subtle">אין הרצות שמורות עבור ארגון זה.</p>
                ) : (
                  <div className="sa-table-wrap">
                    <table className="sa-stats-table">
                      <thead>
                        <tr>
                          <th>מבצע</th>
                          <th>סטטוס</th>
                          <th>התחלה</th>
                          <th>סיום</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(organizationDetails?.recentRuns ?? []).map((run: AdminOperationRunRecord) => (
                          <tr key={run.id}>
                            <td><strong>{run.operationId.slice(0, 8)}</strong></td>
                            <td><span className={`sa-run-status ${run.status}`}>{RUN_STATUS_LABELS[run.status]}</span></td>
                            <td>{new Date(run.startedAtIso).toLocaleString('he-IL')}</td>
                            <td>{run.endedAtIso ? new Date(run.endedAtIso).toLocaleString('he-IL') : '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>
            </>
          ) : null}
        </div>
      )
    }

    if (!selectedOrganization) {
      return (
        <div className="sa-empty-state">
          <h3>לא נבחר ארגון</h3>
          <p>בחר ארגון מהרשימה כדי לצפות בפרטים, לערוך ולנהל את כל ההגדרות שלו.</p>
        </div>
      )
    }

    if (selectedTab === 'ghostLive') {
      return (
        <div className="sa-tab-grid">
          <section className="sa-card">
            <h3>ניהול ערוצים</h3>
            {(organizationDetails?.channels ?? []).length === 0 ? (
              <p className="sa-subtle">אין ערוצים בארגון זה.</p>
            ) : (
              <div className="sa-table-wrap">
                <table className="sa-stats-table">
                  <thead>
                    <tr>
                      <th>ערוץ</th>
                      <th>מצב</th>
                      <th>יוצאות</th>
                      <th>נכנסות</th>
                      <th>מבצעים פעילים</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(organizationDetails?.channels ?? []).map((channel) => {
                      const stats = (organizationDetails?.channelStats ?? []).find(
                        (stat: ChannelUsageMonthly) => stat.channelId === channel.id,
                      )
                      const totalMessages =
                        (stats?.outgoingUser ?? 0) +
                        (stats?.incomingGhost ?? 0) +
                        (stats?.incomingSystem ?? 0) +
                        (stats?.incomingOperations ?? 0)
                      return (
                        <tr key={channel.id}>
                          <td><strong>{channel.name}</strong></td>
                          <td>
                            <span className={`sa-channel-status ${channel.isBlocked ? 'unavailable' : 'active'}`}>
                              {channel.isBlocked ? 'לא זמין' : 'פעיל'}
                            </span>
                          </td>
                          <td>{stats?.outgoingUser ?? 0}</td>
                          <td>{totalMessages}</td>
                          <td>{stats?.operationsCountActive ?? 0}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <section className="sa-card">
            <h3>מבצעים בארגון ({(organizationDetails?.operations ?? []).length})</h3>
            {(organizationDetails?.operations ?? []).length === 0 ? (
              <p className="sa-subtle">אין מבצעים בארגון זה.</p>
            ) : (
              <div className="sa-table-wrap">
                <table className="sa-stats-table">
                  <thead>
                    <tr>
                      <th>שם</th>
                      <th>ערוץ</th>
                      <th>מוד</th>
                      <th>תזמון</th>
                      <th>סטטוס</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(organizationDetails?.operations ?? []).map((op: AdminOperationRecord) => {
                      const channelName = (organizationDetails?.channels ?? []).find((c) => c.id === op.channelId)?.name ?? '—'
                      return (
                        <tr key={op.id}>
                          <td><strong>{op.name}</strong></td>
                          <td>{channelName}</td>
                          <td>{OP_MODE_LABELS[op.mode] ?? op.mode}</td>
                          <td>{op.schedule || '—'}</td>
                          <td>
                            <span className={`sa-org-status ${op.enabled ? 'active' : 'suspended'}`}>
                              {op.enabled ? 'פעיל' : 'מושבת'}
                            </span>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <section className="sa-card">
            <h3>הרצות אחרונות</h3>
            {(organizationDetails?.recentRuns ?? []).length === 0 ? (
              <p className="sa-subtle">אין הרצות אחרונות להצגה.</p>
            ) : (
              <div className="sa-table-wrap">
                <table className="sa-stats-table">
                  <thead>
                    <tr>
                      <th>מבצע</th>
                      <th>סטטוס</th>
                      <th>התחלה</th>
                      <th>סיום</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(organizationDetails?.recentRuns ?? []).map((run: AdminOperationRunRecord) => {
                      const opName = (organizationDetails?.operations ?? []).find((o) => o.id === run.operationId)?.name ?? run.operationId.slice(0, 8)
                      return (
                        <tr key={run.id}>
                          <td><strong>{opName}</strong></td>
                          <td><span className={`sa-run-status ${run.status}`}>{RUN_STATUS_LABELS[run.status]}</span></td>
                          <td>{new Date(run.startedAtIso).toLocaleString('he-IL')}</td>
                          <td>{run.endedAtIso ? new Date(run.endedAtIso).toLocaleString('he-IL') : '—'}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <section className="sa-card">
            <h3>אירועי Ghost Live</h3>
            {events.length === 0 ? (
              <p className="sa-subtle">אין כרגע אירועים חיים להצגה.</p>
            ) : (
              <ul className="sa-list">
                {events.slice(0, 10).map((event, index) => (
                  <li key={`${event.timestampIso}_${index}`}>
                    <div className="sa-ledger-row">
                      <strong>{event.eventType}</strong>
                      <span>{event.severity}</span>
                      <span>{new Date(event.timestampIso).toLocaleString('he-IL')}</span>
                    </div>
                    <p>מזהה ארגון: {event.organizationId}</p>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      )
    }

    if (selectedTab === 'overview') {
      return (
        <div className="sa-tab-grid">
          <section className="sa-card">
            <h3>פרטי ארגון</h3>
            <div className="sa-form-grid">
              <label>
                שם ארגון
                <input value={organizationName} onChange={(event) => setOrganizationName(event.target.value)} />
              </label>
              <label>
                סטטוס
                <select
                  value={organizationStatusDraft}
                  onChange={(event) => setOrganizationStatusDraft(event.target.value as 'active' | 'suspended')}
                >
                  <option value="active">פעיל</option>
                  <option value="suspended">מושהה</option>
                </select>
              </label>
            </div>
          </section>

          <section className="sa-card">
            <h3>מגבלות ותקרות</h3>
            <div className="sa-form-grid">
              <label>
                מספר ערוצים
                <input
                  type="number"
                  value={organizationLimitsDraft.maxChannels}
                  onChange={(event) =>
                    setOrganizationLimitsDraft((currentLimits) => ({ ...currentLimits, maxChannels: Number(event.target.value) || 0 }))
                  }
                />
              </label>
              <label>
                הודעות לערוץ בחודש
                <input
                  type="number"
                  value={organizationLimitsDraft.maxMessagesPerChannelPerMonth}
                  onChange={(event) =>
                    setOrganizationLimitsDraft((currentLimits) => ({
                      ...currentLimits,
                      maxMessagesPerChannelPerMonth: Number(event.target.value) || 0,
                    }))
                  }
                />
              </label>
              <label>
                חיוב חודשי
                <input
                  type="number"
                  value={organizationLimitsDraft.monthlyChargeAmount}
                  onChange={(event) =>
                    setOrganizationLimitsDraft((currentLimits) => ({
                      ...currentLimits,
                      monthlyChargeAmount: Number(event.target.value) || 0,
                    }))
                  }
                />
              </label>
              <label>
                תקרת עלות Agents
                <input
                  type="number"
                  value={organizationLimitsDraft.maxAgentsTotalCost}
                  onChange={(event) =>
                    setOrganizationLimitsDraft((currentLimits) => ({
                      ...currentLimits,
                      maxAgentsTotalCost: Number(event.target.value) || 0,
                    }))
                  }
                />
              </label>
              <label>
                תקרת עלות AI
                <input
                  type="number"
                  value={organizationLimitsDraft.maxAiTotalCost}
                  onChange={(event) =>
                    setOrganizationLimitsDraft((currentLimits) => ({
                      ...currentLimits,
                      maxAiTotalCost: Number(event.target.value) || 0,
                    }))
                  }
                />
              </label>
              <label>
                תקרת עלות API
                <input
                  type="number"
                  value={organizationLimitsDraft.maxApiTotalCost}
                  onChange={(event) =>
                    setOrganizationLimitsDraft((currentLimits) => ({
                      ...currentLimits,
                      maxApiTotalCost: Number(event.target.value) || 0,
                    }))
                  }
                />
              </label>
            </div>
          </section>

          <section className="sa-card">
            <h3>נתוני שימוש חיים</h3>
            <div className="sa-kpi-grid">
              <div><span>ערוצים</span><strong>{selectedOrganization.usage.channelsCount}</strong></div>
              <div><span>מבצעים</span><strong>{selectedOrganization.usage.operationsCount ?? 0}</strong></div>
              <div><span>הודעות יוצאות</span><strong>{selectedOrganization.usage.sentMessages}</strong></div>
              <div><span>הודעות נכנסות</span><strong>{selectedOrganization.usage.receivedMessages}</strong></div>
              <div><span>עלות AI</span><strong>${`${selectedOrganization.usage.aiTotalCost.toFixed(2)}`}</strong></div>
              <div><span>עלות API</span><strong>${`${selectedOrganization.usage.apiTotalCost.toFixed(2)}`}</strong></div>
            </div>
          </section>

          <section className="sa-card sa-card-actions">
            <button className="primary-button" type="button" disabled={isBusy} onClick={() => void handleUpdateOrganization()}>
              שמור שינויים בארגון
            </button>
            <button className="danger-button" type="button" disabled={isBusy} onClick={() => void handleSoftDeleteOrganization()}>
              מחיקה לוגית לארגון
            </button>
          </section>
        </div>
      )
    }

    if (selectedTab === 'users') {
      return (
        <div className="sa-tab-grid">
          <section className="sa-card">
            <h3>רשימת משתמשים מלאה בארגון</h3>
            <ul className="sa-list">
              {selectedOrganizationUsers.map((user) => (
                <li key={user.id} className={selectedUserId === user.id ? 'active' : ''}>
                  <button type="button" className="sa-user-select-btn" onClick={() => handleSelectUserForEdit(user)}>
                    <strong>{user.username}</strong>
                    <span>{USER_ROLE_LABELS[user.role === 'regular_user' ? 'regular_user' : 'system_manager']}</span>
                    <span>{user.isActive ? USER_STATUS_LABELS.active : USER_STATUS_LABELS.inactive}</span>
                  </button>
                  {user.isActive && user.role !== 'super_admin' && (
                    <button
                      type="button"
                      className="ghost-button sa-impersonate-btn"
                      disabled={isBusy}
                      onClick={() => void handleImpersonateUser(user.id)}
                    >
                      פתח כ
                    </button>
                  )}
                </li>
              ))}
            </ul>
          </section>

          <section className="sa-card">
            <h3>עריכת משתמש</h3>
            <div className="sa-form-grid">
              <label>
                תפקיד
                <select
                  value={selectedUserRoleDraft}
                  onChange={(event) => setSelectedUserRoleDraft(event.target.value as 'system_manager' | 'regular_user')}
                >
                  <option value="system_manager">מנהל מערכת</option>
                  <option value="regular_user">משתמש רגיל</option>
                </select>
              </label>
              <label>
                מצב משתמש
                <select
                  value={selectedUserActiveDraft ? 'active' : 'inactive'}
                  onChange={(event) => setSelectedUserActiveDraft(event.target.value === 'active')}
                >
                  <option value="active">פעיל</option>
                  <option value="inactive">לא פעיל</option>
                </select>
              </label>
            </div>
            <div className="sa-inline-actions">
              <button className="primary-button" type="button" disabled={isBusy || !selectedUserId} onClick={() => void handleUpdateUser()}>
                שמור משתמש
              </button>
              <button className="danger-button" type="button" disabled={isBusy || !selectedUserId} onClick={() => void handleSoftDeleteUser()}>
                מחיקה לוגית למשתמש
              </button>
            </div>
          </section>

          <section className="sa-card">
            <h3>יצירת משתמש חדש</h3>
            <div className="sa-form-grid">
              <label>
                שם פרטי
                <input value={newUserFirstName} onChange={(event) => setNewUserFirstName(event.target.value)} />
              </label>
              <label>
                שם משפחה
                <input value={newUserLastName} onChange={(event) => setNewUserLastName(event.target.value)} />
              </label>
              <label>
                שם משתמש (להתחברות)
                <input value={newUsername} onChange={(event) => setNewUsername(event.target.value)} />
              </label>
              <label>
                סיסמה
                <input type="password" value={newUserPassword} onChange={(event) => setNewUserPassword(event.target.value)} />
              </label>
              <label>
                תפקיד
                <select value={newUserRole} onChange={(event) => setNewUserRole(event.target.value as 'system_manager' | 'regular_user')}>
                  <option value="system_manager">מנהל מערכת</option>
                  <option value="regular_user">משתמש רגיל</option>
                </select>
              </label>
            </div>
            <div className="sa-inline-actions">
              <button className="primary-button" type="button" disabled={isBusy} onClick={() => void handleCreateUser()}>
                צור משתמש
              </button>
            </div>
          </section>
        </div>
      )
    }

    if (selectedTab === 'billing') {
      return (
        <div className="sa-tab-grid">
          <section className="sa-card">
            <h3>אמצעי תשלום וגבייה</h3>
            <div className="sa-form-grid">
              <label>מספר כרטיס מלא<input value={cardPan} onChange={(event) => setCardPan(event.target.value)} /></label>
              <label>שם בעל הכרטיס<input value={cardholderName} onChange={(event) => setCardholderName(event.target.value)} /></label>
              <label>חודש MM<input value={expiryMonth} onChange={(event) => setExpiryMonth(event.target.value)} /></label>
              <label>שנה YY/YYYY<input value={expiryYear} onChange={(event) => setExpiryYear(event.target.value)} /></label>
              <label>מייל חיוב<input value={billingEmail} onChange={(event) => setBillingEmail(event.target.value)} /></label>
              <label>
                קוד מנהל
                <input
                  className={managerCode === '1553' ? 'sa-manager-code-authorized' : ''}
                  value={managerCode}
                  onChange={(event) => setManagerCode(event.target.value)}
                />
              </label>
            </div>
            <div className="sa-inline-actions">
              <button className="primary-button" type="button" disabled={isBusy} onClick={() => void handleSavePaymentCard()}>
                שמור כרטיס
              </button>
            </div>
            {savedCardPreview ? (
              <p className="sa-subtle">
                כרטיס שמור: {savedCardPreview.maskedPan} | תוקף: {savedCardPreview.expiryMonth}/{savedCardPreview.expiryYear} | 4 ספרות אחרונות: {savedCardPreview.last4}
              </p>
            ) : null}
            {managerCode === '1553' && revealedPan ? <p className="sa-mono">כרטיס מלא: {revealedPan}</p> : null}
          </section>

          <section className="sa-card">
            <h3>מפתח AI לארגון</h3>
            <div className="sa-form-grid">
              <label>
                מפתח AI ארגוני
                <input value={aiApiKey} onChange={(event) => setAiApiKey(event.target.value)} placeholder="sk-..." />
              </label>
            </div>
            <div className="sa-inline-actions">
              <button className="primary-button" type="button" disabled={isBusy} onClick={() => void handleSaveAiKey()}>
                שמור מפתח
              </button>
            </div>
            <p className="sa-subtle">סנכרון אחרון: {selectedOrganization.openAiLastSyncIso ? new Date(selectedOrganization.openAiLastSyncIso).toLocaleString() : 'לא עודכן'}</p>
          </section>
        </div>
      )
    }

    if (selectedTab === 'usage') {
      return (
        <div className="sa-tab-grid">
          <section className="sa-card">
            <h3>יומן שימוש ועלויות</h3>
            <ul className="sa-list">
              {(organizationDetails?.usageLedger ?? []).map((ledger) => (
                <li key={ledger.id}>
                  <div className="sa-ledger-row">
                    <strong>{{ openai: 'ניתוח תמונה', api: 'API', agent: 'סוכן', message: 'הודעה' }[ledger.metricType] ?? ledger.metricType}</strong>
                    <span>${ledger.amount.toFixed(2)}</span>
                    <span>{new Date(ledger.createdAtIso).toLocaleString()}</span>
                  </div>
                  <p>{ledger.details}</p>
                </li>
              ))}
            </ul>
          </section>

          <section className="sa-card">
            <h3>ערוצים — מוני שימוש חודשיים מפורטים</h3>
            {(organizationDetails?.channels ?? []).length === 0 ? (
              <p className="sa-subtle">אין ערוצים בארגון זה.</p>
            ) : (
              <div className="sa-table-wrap">
                <table className="sa-stats-table">
                  <thead>
                    <tr>
                      <th>ערוץ</th>
                      <th>יוצאות (user)</th>
                      <th>נכנסות (ghost)</th>
                      <th>נכנסות (system)</th>
                      <th>נכנסות (מבצעים)</th>
                      <th>סה"כ הודעות</th>
                      <th>מבצעים פעילים</th>
                      <th>סה"כ מבצעים</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(organizationDetails?.channels ?? []).map((channel) => {
                      const stats = (organizationDetails?.channelStats ?? []).find(
                        (stat: ChannelUsageMonthly) => stat.channelId === channel.id,
                      )
                      const totalMessages = (stats?.outgoingUser ?? 0) + (stats?.incomingGhost ?? 0) + (stats?.incomingSystem ?? 0) + (stats?.incomingOperations ?? 0)
                      return (
                        <tr key={channel.id}>
                          <td><strong>{channel.name}</strong>{channel.isBlocked ? ' (חסום)' : ''}</td>
                          <td>{stats?.outgoingUser ?? 0}</td>
                          <td>{stats?.incomingGhost ?? 0}</td>
                          <td>{stats?.incomingSystem ?? 0}</td>
                          <td>{stats?.incomingOperations ?? 0}</td>
                          <td><strong>{totalMessages}</strong></td>
                          <td>{stats?.operationsCountActive ?? 0}</td>
                          <td>{stats?.operationsCountTotal ?? 0}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <section className="sa-card">
            <h3>מבצעים בארגון ({(organizationDetails?.operations ?? []).length})</h3>
            {(organizationDetails?.operations ?? []).length === 0 ? (
              <p className="sa-subtle">אין מבצעים בארגון זה.</p>
            ) : (
              <div className="sa-table-wrap">
                <table className="sa-stats-table">
                  <thead>
                    <tr>
                      <th>שם</th>
                      <th>ערוץ</th>
                      <th>מצב</th>
                      <th>תזמון</th>
                      <th>סטטוס</th>
                      <th>הרצה אחרונה</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(organizationDetails?.operations ?? []).map((op: AdminOperationRecord) => {
                      const channelName = (organizationDetails?.channels ?? []).find((c) => c.id === op.channelId)?.name ?? '—'
                      const lastRun = (organizationDetails?.recentRuns ?? []).find(
                        (r: AdminOperationRunRecord) => r.operationId === op.id,
                      )
                      return (
                        <tr key={op.id}>
                          <td><strong>{op.name}</strong></td>
                          <td>{channelName}</td>
                          <td>{OP_MODE_LABELS[op.mode] ?? op.mode}</td>
                          <td>{op.schedule || '—'}</td>
                          <td>
                            <span className={`sa-org-status ${op.enabled ? 'active' : 'suspended'}`}>
                              {op.enabled ? 'פעיל' : 'מושבת'}
                            </span>
                          </td>
                          <td>
                            {lastRun ? (
                              <span className={`sa-run-status ${lastRun.status}`}>
                                {RUN_STATUS_LABELS[lastRun.status]}
                                {lastRun.endedAtIso ? ` (${new Date(lastRun.endedAtIso).toLocaleString('he-IL')})` : ''}
                              </span>
                            ) : '—'}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          {(organizationDetails?.recentRuns ?? []).length > 0 && (
            <section className="sa-card">
              <h3>היסטוריית הרצות אחרונות ({(organizationDetails?.recentRuns ?? []).length})</h3>
              <div className="sa-table-wrap">
                <table className="sa-stats-table">
                  <thead>
                    <tr>
                      <th>מבצע</th>
                      <th>סטטוס</th>
                      <th>התחלה</th>
                      <th>סיום</th>
                      <th>שגיאה</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(organizationDetails?.recentRuns ?? []).map((run: AdminOperationRunRecord) => {
                      const opName = (organizationDetails?.operations ?? []).find((o) => o.id === run.operationId)?.name ?? run.operationId.slice(0, 8)
                      return (
                        <tr key={run.id}>
                          <td><strong>{opName}</strong></td>
                          <td><span className={`sa-run-status ${run.status}`}>{RUN_STATUS_LABELS[run.status]}</span></td>
                          <td>{new Date(run.startedAtIso).toLocaleString('he-IL')}</td>
                          <td>{run.endedAtIso ? new Date(run.endedAtIso).toLocaleString('he-IL') : '—'}</td>
                          <td>{run.errorMessage ?? '—'}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </section>
          )}
        </div>
      )
    }

    if (selectedTab === 'issues') {
      return (
        <section className="sa-card">
          <h3>תקלות ובאגים בארגון</h3>
          <ul className="sa-list">
            {filteredIssues.map((issue) => (
              <li key={issue.id}>
                <div className="sa-ledger-row">
                  <strong>{issue.title}</strong>
                  <span>{ISSUE_SEVERITY_LABELS[issue.severity]}</span>
                  <span>{ISSUE_STATUS_LABELS[issue.status]}</span>
                </div>
                <p>{issue.description}</p>
                <div className="sa-inline-actions">
                  <button className="ghost-button" type="button" onClick={() => void handleIssueStatusChange(issue.id, 'in_progress')}>
                    העבר לטיפול
                  </button>
                  <button className="primary-button" type="button" onClick={() => void handleIssueStatusChange(issue.id, 'resolved')}>
                    סמן כנפתר
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )
    }

    return (
      <section className="sa-card">
        <h3>אירועים חיים (WebSocket)</h3>
        <ul className="sa-list">
          {events.map((event, index) => (
            <li key={`${event.timestampIso}_${index}`}>
              <div className="sa-ledger-row">
                <strong>{event.eventType}</strong>
                <span>{event.severity}</span>
                <span>{new Date(event.timestampIso).toLocaleString()}</span>
              </div>
              <p>מזהה ארגון: {event.organizationId}</p>
            </li>
          ))}
        </ul>
      </section>
    )
  }

  function getSectionMeta(tab: SuperAdminTab): { title: string; description: string } {
    if (tab === 'overview') {
      return {
        title: 'סקירה',
        description: 'עריכת הארגון, מגבלות ותקרות, ויצירת ארגון חדש.',
      }
    }
    if (tab === 'suspendedOrganizations') {
      return {
        title: 'ארגון מבוטל',
        description: 'ניהול ארגונים מושהים, היסטוריית פעילות, ושחזור ארגון לפעילות מלאה.',
      }
    }
    if (tab === 'ghostLive') {
      return {
        title: 'Ghost Live',
        description: 'ניהול ערוצים, מבצעים, הרצות אחרונות ואירועי live של הארגון הנבחר.',
      }
    }
    if (tab === 'users') {
      return {
        title: 'משתמשים',
        description: 'ניהול משתמשים, הרשאות, יצירה, עדכון והתחזות.',
      }
    }
    if (tab === 'billing') {
      return {
        title: 'תשלומים',
        description: 'אמצעי תשלום, קוד מנהל ומפתחות AI ארגוניים.',
      }
    }
    if (tab === 'usage') {
      return {
        title: 'שימוש',
        description: 'יומני שימוש, ערוצים, מבצעים והרצות אחרונות.',
      }
    }
    if (tab === 'issues') {
      return {
        title: 'תקלות',
        description: 'מעקב אחרי תקלות פתוחות, בטיפול ופתורות.',
      }
    }
    return {
      title: 'אירועים חיים',
      description: 'זרם אירועים בזמן אמת מ-WebSocket הניהולי.',
    }
  }

  return (
    <div className="app-shell" data-mobile-panel="chat">
      <div className="app-surface">
        <Topbar
          accountMenuItems={superAdminAccountMenuItems}
          fullName={[profile.firstName, profile.lastName].filter(Boolean).join(' ') || profile.username}
          organizationName="Ghost HQ"
          role={profile.role}
          channelsCount={organizations.length}
          totalOperations={overview?.organizations.reduce((sum, organization) => sum + (organization.usage.operationsCount ?? 0), 0) ?? 0}
          totalLiveFeeds={overview?.organizations.reduce((sum, organization) => sum + organization.usage.channelsCount, 0) ?? 0}
          totalUnreadAlerts={unresolvedIssuesCount}
          activeNav={activeTopbarNav}
          canAccessCommandCenter
          navItems={['Ghost Live', 'Command Center', 'Super Admin']}
          onAccountAction={handleAccountAction}
          onBrandClick={() => openAdminTab('overview', 'Super Admin')}
          onCommandTrigger={() => {
            setCommandQuery('')
            setIsShortcutsOpen(false)
            setIsSupportOpen(false)
            setActiveAccountDialog(null)
            setIsCommandPaletteOpen(true)
          }}
          onNavChange={handleSuperAdminNavChange}
          onOpenNotificationsCenter={() => openAdminTab('issues', 'Ghost Live')}
          onOpenShortcuts={() => {
            setIsCommandPaletteOpen(false)
            setIsSupportOpen(false)
            setActiveAccountDialog(null)
            setIsShortcutsOpen(true)
          }}
          onOpenSupport={() => {
            setIsCommandPaletteOpen(false)
            setIsShortcutsOpen(false)
            setActiveAccountDialog(null)
            setIsSupportOpen(true)
          }}
          onToggleTheme={onToggleTheme}
          themeMode={themeMode}
        />

        <main className="sa-shell">
          <aside className="sa-sidebar">
        <header className="sa-sidebar-header">
          <p className="eyebrow">סופר אדמין</p>
          <h2>חדר בקרה Ghost</h2>
          <p className="sa-subtle">מחובר כ־{[profile.firstName, profile.lastName].filter(Boolean).join(' ') || profile.username}</p>
          <div className="sa-sidebar-header-actions">
            <button className="ghost-button" type="button" onClick={onLogout}>
              התנתקות
            </button>
          </div>
        </header>

        <section className="sa-sidebar-create">
          <input
            value={organizationName}
            onChange={(event) => setOrganizationName(event.target.value)}
            placeholder="שם ארגון חדש"
          />
          <button className="primary-button" type="button" disabled={isBusy} onClick={() => void handleCreateOrganization()}>
            צור ארגון
          </button>
        </section>

        <section className="sa-sidebar-search">
          <input
            value={organizationSearch}
            onChange={(event) => setOrganizationSearch(event.target.value)}
            placeholder="חיפוש ארגון..."
          />
        </section>

        <section className="sa-org-list-wrap">
          <h3>ארגונים פעילים ({filteredOrganizations.length})</h3>
          <ul className="sa-org-list">
            {filteredOrganizations.map((organization) => (
              <li key={organization.id} className={selectedOrganizationId === organization.id ? 'active' : ''}>
                <button type="button" onClick={() => setSelectedOrganizationId(organization.id)}>
                  <div className="sa-org-list-title">
                    <strong>{organization.name}</strong>
                    <span className={`sa-org-status ${organization.status}`}>{ORGANIZATION_STATUS_LABELS[organization.status]}</span>
                  </div>
                  <div className="sa-org-list-meta">
                    <span>ערוצים: {isInitialLoad ? '--' : organization.usage.channelsCount}</span>
                    <span>מבצעים: {isInitialLoad ? '--' : (organization.usage.operationsCount ?? 0)}</span>
                    <span>הודעות: {isInitialLoad ? '--' : organization.usage.sentMessages + organization.usage.receivedMessages}</span>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        </section>

        <section className="sa-sidebar-kpis">
          <h3>מדדי מערכת כלליים</h3>
          <div className="sa-kpi-grid">
            <div><span>ארגונים</span><strong>{isInitialLoad ? '--' : (overview?.totals.organizationsCount ?? 0)}</strong></div>
            <div><span>משתמשים</span><strong>{isInitialLoad ? '--' : allUsers.length}</strong></div>
            <div><span>הודעות יוצאות</span><strong>{isInitialLoad ? '--' : (overview?.totals.sentMessages ?? 0)}</strong></div>
            <div><span>עלות AI</span><strong>{isInitialLoad ? '--' : `$${overview?.totals.aiTotalCost.toFixed(2) ?? '0.00'}`}</strong></div>
          </div>
          <div className="sa-realtime-indicator">
            <span className={`sa-realtime-dot ${realtimeMode}`} />
            <span>{realtimeMode === 'live' ? 'חי' : realtimeMode === 'polling' ? 'סנכרון אוטומטי' : 'מנותק'}</span>
          </div>
        </section>
          </aside>

          <section className="sa-content">
        <header className="sa-content-header">
          <div>
            <p className="eyebrow">{activeTopbarNav}</p>
            <h2>{getSectionMeta(selectedTab).title}</h2>
            <p className="sa-subtle">{getSectionMeta(selectedTab).description}</p>
          </div>
        </header>

        {errorMessage ? <p className="sa-feedback error">{errorMessage}</p> : null}
        {successMessage ? <p className="sa-feedback success">{successMessage}</p> : null}

            <div className="sa-content-scroll">{renderTabContent()}</div>
          </section>
        </main>

        {isCommandPaletteOpen ? (
          <SurfaceDialog
            eyebrow="Quick command"
            title="Super Admin command palette"
            description="Search admin workflows and jump directly into a real management tab."
            onClose={() => setIsCommandPaletteOpen(false)}
            width="medium"
          >
            <div className="topbar-dialog-stack">
              <input
                autoFocus
                className="topbar-search-input"
                onChange={(event) => setCommandQuery(event.target.value)}
                placeholder="Search Ghost Live, cancelled orgs, users, billing, usage..."
                value={commandQuery}
              />
              <div className="topbar-action-list">
                {filteredSuperAdminQuickActions.map((action) => (
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
            eyebrow="Shortcuts"
            title="Super Admin shortcuts"
            description="Fast access to active organization management workflows."
            onClose={() => setIsShortcutsOpen(false)}
            width="medium"
          >
            <div className="topbar-shortcuts-grid">
              {superAdminQuickActions.map((action) => (
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
            eyebrow="Support"
            title="Admin support actions"
            description="Every destination below is a real management flow."
            onClose={() => setIsSupportOpen(false)}
            width="medium"
          >
            <div className="topbar-action-list">
              <button className="topbar-action-card" onClick={() => openAdminTab('ghostLive', 'Ghost Live')} type="button">
                <strong>Open Ghost Live</strong>
                <span>Jump into channel management, operations, recent runs, and live activity.</span>
              </button>
              <button className="topbar-action-card" onClick={() => openAdminTab('billing', 'Command Center')} type="button">
                <strong>Open billing</strong>
                <span>Manage payment cards, manager code access, and AI key sync.</span>
              </button>
              <button className="topbar-action-card" onClick={() => openAdminTab('usage', 'Command Center')} type="button">
                <strong>Inspect usage</strong>
                <span>Check ledgers, operations, channels, and recent run history.</span>
              </button>
              <button className="topbar-action-card" onClick={() => openAdminTab('overview', 'Super Admin')} type="button">
                <strong>Create organization</strong>
                <span>Jump to the overview and use the organization creation form in the sidebar.</span>
              </button>
            </div>
          </SurfaceDialog>
        ) : null}

        {activeAccountDialog === 'profile' ? (
          <SurfaceDialog
            eyebrow="Profile"
            title={[profile.firstName, profile.lastName].filter(Boolean).join(' ') || profile.username}
            description="Active authenticated Super Admin session."
            onClose={() => setActiveAccountDialog(null)}
            width="narrow"
          >
            <div className="topbar-dialog-stack">
              <div className="topbar-info-row"><span>Role</span><strong>{profile.role}</strong></div>
              <div className="topbar-info-row"><span>Organizations</span><strong>{overview?.totals.organizationsCount ?? 0}</strong></div>
              <div className="topbar-info-row"><span>Users</span><strong>{allUsers.length}</strong></div>
              <div className="topbar-info-row"><span>Open issues</span><strong>{unresolvedIssuesCount}</strong></div>
            </div>
          </SurfaceDialog>
        ) : null}

        {activeAccountDialog === 'api' ? (
          <SurfaceDialog
            eyebrow="API"
            title="Organization AI and integration status"
            description="Live admin data from the selected organization."
            onClose={() => setActiveAccountDialog(null)}
            width="medium"
          >
            <div className="topbar-dialog-stack">
              <div className="topbar-info-row"><span>Selected organization</span><strong>{selectedOrganization?.name ?? 'None selected'}</strong></div>
              <div className="topbar-info-row"><span>AI key target</span><strong>{aiKeyOrgId || selectedOrganizationId || 'Unavailable'}</strong></div>
              <div className="topbar-info-row"><span>Last AI sync</span><strong>{selectedOrganization?.openAiLastSyncIso ? new Date(selectedOrganization.openAiLastSyncIso).toLocaleString() : 'Not synced'}</strong></div>
              <div className="topbar-info-row"><span>Channels</span><strong>{organizationDetails?.channels.length ?? 0}</strong></div>
            </div>
          </SurfaceDialog>
        ) : null}

        <AppFooter />
      </div>
    </div>
  )
}
