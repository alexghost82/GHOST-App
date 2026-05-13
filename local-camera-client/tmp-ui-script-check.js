
    const STEP_META = [
      { id: 1, title: 'בחירת ארגון', note: 'במסך הראשון בוחרים רק את הארגון. בלי רשימות, בלי לוחות צד ובלי חלונות נוספים.' },
      { id: 2, title: 'בחירת סוג מצלמה', note: 'כאן בוחרים רק את סוג המצלמה שאיתה הלקוח המקומי יעבוד.' },
      { id: 3, title: 'הגדרת פרטי מצלמה', note: 'מזינים את הפרטים שנדרשים רק לסוג המצלמה שנבחר.' },
      { id: 4, title: 'בדיקת צילום', note: 'מפעילים צילום בדיקה ורואים רק את תוצאת הבדיקה במסך הזה.' },
      { id: 5, title: 'שמירת ההגדרה', note: 'שומרים את המצלמה מקומית ומוודאים שההגדרה מוכנה לקשירה.' },
      { id: 6, title: 'קשירה לערוץ', note: 'בוחרים ערוץ יעד יחיד ומחברים אליו את המצלמה הפעילה.' },
    ]

    const state = {
      connectSession: null,
      savedConfig: null,
      savedCameras: [],
      selectedTab: 'usb',
      editingCameraId: null,
      dashboard: null,
      setupStep: 1,
      lastTestResult: null,
      lastSavedCameraId: null,
      lastBoundChannelName: null,
    }

    const refs = {
      setupShell: document.getElementById('setupShell'),
      dashboardShell: document.getElementById('dashboardShell'),
      wizardStepLabel: document.getElementById('wizardStepLabel'),
      wizardTitle: document.getElementById('wizardTitle'),
      wizardNote: document.getElementById('wizardNote'),
      statusCard: document.getElementById('statusCard'),
      statusTitle: document.getElementById('statusTitle'),
      statusText: document.getElementById('statusText'),
      orgName: document.getElementById('orgName'),
      cameraLabel: document.getElementById('cameraLabel'),
      usbSelect: document.getElementById('usbSelect'),
      rtspUrl: document.getElementById('rtspUrl'),
      rtspTransport: document.getElementById('rtspTransport'),
      rtspUsername: document.getElementById('rtspUsername'),
      rtspPassword: document.getElementById('rtspPassword'),
      hikHost: document.getElementById('hikHost'),
      hikPort: document.getElementById('hikPort'),
      hikUsername: document.getElementById('hikUsername'),
      hikPassword: document.getElementById('hikPassword'),
      hikChannel: document.getElementById('hikChannel'),
      previewBlock: document.getElementById('previewBlock'),
      previewImage: document.getElementById('previewImage'),
      previewText: document.getElementById('previewText'),
      previewEmptyState: document.getElementById('previewEmptyState'),
      saveReview: document.getElementById('saveReview'),
      channelSelect: document.getElementById('channelSelect'),
      bindCameraSelect: document.getElementById('bindCameraSelect'),
      bindingHint: document.getElementById('bindingHint'),
      backBtn: document.getElementById('backBtn'),
      nextBtn: document.getElementById('nextBtn'),
      refreshDashboardBtn: document.getElementById('refreshDashboardBtn'),
      testSavedCameraBtn: document.getElementById('testSavedCameraBtn'),
      reconfigureBtn: document.getElementById('reconfigureBtn'),
      unbindBtn: document.getElementById('unbindBtn'),
      agentDot: document.getElementById('agentDot'),
      agentBadge: document.getElementById('agentBadge'),
      metricGrid: document.getElementById('metricGrid'),
      detailGrid: document.getElementById('detailGrid'),
      dashboardPreview: document.getElementById('dashboardPreview'),
      dashboardPreviewImage: document.getElementById('dashboardPreviewImage'),
      dashboardPreviewText: document.getElementById('dashboardPreviewText'),
    }

    refs.backBtn.addEventListener('click', handleBack)
    refs.nextBtn.addEventListener('click', handleNext)
    refs.refreshDashboardBtn.addEventListener('click', bootstrap)
    refs.testSavedCameraBtn.addEventListener('click', testActiveSavedCamera)
    refs.reconfigureBtn.addEventListener('click', startReconfigure)
    refs.unbindBtn.addEventListener('click', unbindAgent)

    function setSourceType(tab) {
      state.selectedTab = tab
      document.querySelectorAll('[data-source-card]').forEach((element) => {
        element.classList.toggle('active', element.dataset.sourceCard === tab)
      })
      document.getElementById('panel-usb').hidden = tab !== 'usb'
      document.getElementById('panel-rtsp').hidden = tab !== 'rtsp'
      document.getElementById('panel-hikvision').hidden = tab !== 'hikvision'
      const helperText = tab === 'usb'
        ? 'מגדירים שם תצוגה ובוחרים מצלמת USB אחת מהמחשב המקומי.'
        : tab === 'rtsp'
          ? 'מזינים כתובת RTSP ופרטי גישה אם צריך.'
          : 'מזינים כתובת, פורט, משתמש, סיסמה וערוץ של מצלמת Hikvision.'
      document.getElementById('detailsHelper').textContent = helperText
      renderSaveReview()
    }

    function showStatus(text, tone = 'info', title = 'סטטוס') {
      refs.statusCard.className = `wizard-status show ${tone}`
      refs.statusTitle.textContent = title
      refs.statusText.textContent = text
    }

    function clearStatus() {
      refs.statusCard.className = 'wizard-status'
      refs.statusTitle.textContent = 'סטטוס'
      refs.statusText.textContent = ''
    }

    function renderSelect(select, options, placeholder) {
      select.innerHTML = ''
      if (!options.length) {
        const option = document.createElement('option')
        option.value = ''
        option.textContent = placeholder
        select.appendChild(option)
        return
      }
      options.forEach((item, index) => {
        const option = document.createElement('option')
        option.value = item.value
        option.textContent = item.label
        if (item.dataset) {
          Object.entries(item.dataset).forEach(([key, value]) => {
            option.dataset[key] = value
          })
        }
        if (index === 0) {
          option.selected = true
        }
        select.appendChild(option)
      })
    }

    function resolveSetupStep() {
      const hasConnection = Boolean(state.connectSession?.organizationName || state.savedConfig?.organizationName)
      if (!hasConnection) return 1
      if (!state.savedCameras.length) return 2
      if (!(state.lastBoundChannelName || state.savedConfig?.channelId)) return 6
      return 7
    }

    function isSetupComplete() {
      return resolveSetupStep() === 7
    }

    function renderSetup() {
      if (isSetupComplete()) {
        refs.setupShell.hidden = true
        refs.dashboardShell.hidden = false
        renderDashboard()
        return
      }

      refs.setupShell.hidden = false
      refs.dashboardShell.hidden = true

      STEP_META.forEach((meta) => {
        const step = document.getElementById(`step-${meta.id}`)
        if (step) {
          step.hidden = meta.id !== state.setupStep
        }
      })

      const meta = STEP_META.find((item) => item.id === state.setupStep) || STEP_META[0]
      refs.wizardStepLabel.textContent = `שלב ${meta.id} מתוך ${STEP_META.length}`
      refs.wizardTitle.textContent = meta.title
      refs.wizardNote.textContent = meta.note
      refs.backBtn.disabled = state.setupStep === 1

      if (state.setupStep === 4) {
        refs.nextBtn.textContent = 'שמור והמשך'
      } else if (state.setupStep === 5) {
        refs.nextBtn.textContent = 'עבור לקשירה'
      } else if (state.setupStep === 6) {
        refs.nextBtn.textContent = 'חבר לערוץ'
      } else {
        refs.nextBtn.textContent = 'הבא'
      }

      renderSaveReview()
    }

    async function handleNext() {
      if (state.setupStep === 1) {
        await connectAgent()
        return
      }
      if (state.setupStep === 2) {
        state.setupStep = 3
        renderSetup()
        return
      }
      if (state.setupStep === 3) {
        try {
          buildCameraPayload()
          state.setupStep = 4
          renderSetup()
        } catch (error) {
          showStatus(error?.message || 'יש להשלים את פרטי המצלמה.', 'error')
        }
        return
      }
      if (state.setupStep === 4) {
        await testCamera()
        if (!state.lastTestResult?.frameDataUrl) {
          return
        }
        await saveCamera()
        return
      }
      if (state.setupStep === 5) {
        state.setupStep = 6
        renderSetup()
        return
      }
      if (state.setupStep === 6) {
        await saveBinding()
      }
    }

    function handleBack() {
      if (state.setupStep > 1) {
        state.setupStep -= 1
        renderSetup()
      }
    }

    async function connectAgent() {
      const organizationName = refs.orgName.value.trim()
      if (!organizationName) {
        showStatus('יש להזין שם ארגון.', 'error')
        return
      }
      try {
        showStatus('מחבר את הלקוח לארגון...', 'info')
        state.connectSession = await window.ghostAPI.connectAgent({
          organizationName,
          deviceName: 'תחנה מקומית',
        })
        renderChannels()
        state.setupStep = 2
        renderSetup()
        showStatus('החיבור הושלם. עכשיו בוחרים סוג מצלמה.', 'success')
      } catch (error) {
        showStatus(error?.message || 'החיבור לארגון נכשל.', 'error')
      }
    }

    async function loadUsbDevices() {
      const devices = await window.ghostAPI.getCameras()
      renderSelect(
        refs.usbSelect,
        (devices || []).map((device) => ({ value: device.name, label: device.label })),
        'לא נמצאו מצלמות USB',
      )
    }

    async function loadSavedState() {
      state.savedConfig = await window.ghostAPI.loadConfig()
      state.savedCameras = await window.ghostAPI.getSavedCameras()
      if (state.savedConfig?.organizationName) {
        refs.orgName.value = state.savedConfig.organizationName
      }
      if (state.savedConfig?.defaultCameraId && !state.lastSavedCameraId) {
        state.lastSavedCameraId = state.savedConfig.defaultCameraId
      }
      if (state.savedConfig?.channelName && !state.lastBoundChannelName) {
        state.lastBoundChannelName = state.savedConfig.channelName
      }
      renderBindCameraSelect()
    }

    function renderChannels() {
      const channels = (state.connectSession?.channels || [])
        .filter((channel) => channel.type === 'personal')
        .map((channel) => ({
          value: channel.id,
          label: `${channel.name} - ${channel.liveState}`,
          dataset: { channelName: channel.name },
        }))
      renderSelect(refs.channelSelect, channels, 'אין ערוצים אישיים זמינים')
    }

    function renderBindCameraSelect() {
      renderSelect(
        refs.bindCameraSelect,
        state.savedCameras.map((camera) => ({
          value: camera.cameraId,
          label: `${camera.label} - ${camera.source.type}`,
        })),
        'יש לשמור מצלמה קודם',
      )
      if (state.lastSavedCameraId) {
        refs.bindCameraSelect.value = state.lastSavedCameraId
      }
      refs.bindingHint.textContent = state.savedCameras.length
        ? 'המצלמה נשמרה. בחרו ערוץ ולחצו על הבא כדי לחבר.'
        : 'יש לשמור מצלמה לפני הקשירה לערוץ.'
    }

    function buildCameraPayload() {
      const label = refs.cameraLabel.value.trim()
      if (!label) {
        throw new Error('יש להזין שם תצוגה למצלמה.')
      }
      if (state.selectedTab === 'usb') {
        if (!refs.usbSelect.value) {
          throw new Error('יש לבחור מצלמת USB.')
        }
        return {
          cameraId: state.editingCameraId || undefined,
          label,
          source: {
            type: 'usb-dshow',
            name: refs.usbSelect.value,
          },
          enabled: true,
        }
      }
      if (state.selectedTab === 'rtsp') {
        const url = refs.rtspUrl.value.trim()
        if (!url) {
          throw new Error('יש להזין כתובת RTSP.')
        }
        return {
          cameraId: state.editingCameraId || undefined,
          label,
          source: {
            type: 'rtsp',
            url,
            transport: refs.rtspTransport.value,
            username: refs.rtspUsername.value.trim() || undefined,
            password: refs.rtspPassword.value || undefined,
          },
          enabled: true,
        }
      }
      const host = refs.hikHost.value.trim()
      const username = refs.hikUsername.value.trim()
      if (!host || !username) {
        throw new Error('יש להזין כתובת ומשתמש של Hikvision.')
      }
      return {
        cameraId: state.editingCameraId || undefined,
        label,
        source: {
          type: 'hikvision-sdk',
          host,
          port: Number(refs.hikPort.value || 8000),
          username,
          password: refs.hikPassword.value,
          channel: Number(refs.hikChannel.value || 1),
          useHttps: false,
        },
        enabled: true,
      }
    }

    async function testCamera() {
      try {
        showStatus('מריץ צילום בדיקה...', 'info')
        const result = await window.ghostAPI.testCamera(buildCameraPayload())
        state.lastTestResult = result
        refs.previewBlock.hidden = false
        refs.previewEmptyState.hidden = true
        refs.previewImage.src = result.frameDataUrl
        refs.previewText.textContent = `הצילום הצליח. זמן תגובה: ${result.latencyMs ?? 0} ms`
        showStatus('צילום הבדיקה הצליח.', 'success')
      } catch (error) {
        state.lastTestResult = null
        refs.previewBlock.hidden = true
        refs.previewEmptyState.hidden = false
        showStatus(error?.message || 'צילום הבדיקה נכשל.', 'error')
      }
    }

    async function saveCamera() {
      try {
        const payload = buildCameraPayload()
        showStatus('שומר את המצלמה מקומית...', 'info')
        await window.ghostAPI.saveCamera(payload)
        await loadSavedState()
        const savedCamera = findSavedCameraCandidate(payload)
        state.lastSavedCameraId = savedCamera?.cameraId || state.lastSavedCameraId
        refs.bindCameraSelect.value = state.lastSavedCameraId || refs.bindCameraSelect.value
        state.setupStep = 5
        renderSetup()
        showStatus('המצלמה נשמרה. אפשר לעבור לקשירה לערוץ.', 'success')
      } catch (error) {
        showStatus(error?.message || 'שמירת המצלמה נכשלה.', 'error')
      }
    }

    function findSavedCameraCandidate(payload) {
      if (payload.cameraId) {
        return state.savedCameras.find((camera) => camera.cameraId === payload.cameraId)
      }
      return state.savedCameras.find((camera) => camera.label === payload.label && camera.source?.type === payload.source?.type)
        || state.savedCameras[0]
    }

    async function saveBinding() {
      if (!state.connectSession) {
        showStatus('יש לחבר קודם את הלקוח לארגון.', 'error')
        return
      }
      const selectedCameraId = refs.bindCameraSelect.value
      const selectedChannel = refs.channelSelect.selectedOptions[0]
      if (!selectedCameraId || !selectedChannel?.value) {
        showStatus('יש לבחור ערוץ יעד ומצלמה שמורה.', 'error')
        return
      }
      try {
        showStatus('מחבר את המצלמה לערוץ...', 'info')
        await window.ghostAPI.saveBinding({
          organizationId: state.connectSession.organizationId,
          organizationName: state.connectSession.organizationName,
          accessToken: state.connectSession.accessToken,
          refreshToken: state.connectSession.refreshToken,
          username: state.connectSession.profile.username,
          deviceId: state.connectSession.deviceId,
          deviceName: 'תחנה מקומית',
          channelId: selectedChannel.value,
          channelName: selectedChannel.dataset.channelName || selectedChannel.textContent,
          selectedCameraId,
          cameras: state.savedCameras,
          bindings: [],
        })
        state.lastSavedCameraId = selectedCameraId
        state.lastBoundChannelName = selectedChannel.dataset.channelName || selectedChannel.textContent
        await bootstrap()
        showStatus('המצלמה חוברה לערוץ בהצלחה.', 'success')
      } catch (error) {
        showStatus(error?.message || 'הקשירה לערוץ נכשלה.', 'error')
      }
    }

    async function loadDashboard() {
      state.dashboard = await window.ghostAPI.getDashboardData()
    }

    function renderSaveReview() {
      if (state.setupStep !== 5) {
        return
      }
      try {
        const payload = buildCameraPayload()
        const items = [
          ['ארגון', state.connectSession?.organizationName || state.savedConfig?.organizationName || 'לא חובר'],
          ['מצלמה', payload.label],
          ['סוג מקור', payload.source.type],
          ['פרטי מקור', formatSource(payload.source)],
        ]
        refs.saveReview.innerHTML = items.map(([title, value]) => `
          <div class="review-item">
            <div class="review-title">${escapeHtml(title)}</div>
            <div class="review-value">${escapeHtml(String(value))}</div>
          </div>
        `).join('')
      } catch (error) {
        refs.saveReview.innerHTML = `<div class="helper">${escapeHtml(error?.message || 'השלימו את פרטי המצלמה לפני השמירה.')}</div>`
      }
    }

    function formatSource(source) {
      if (!source) return 'לא ידוע'
      if (source.type === 'usb-dshow') return source.name
      if (source.type === 'rtsp') return source.url || 'RTSP'
      return `${source.host}:${source.port} / ערוץ ${source.channel}`
    }

    function renderDashboard() {
      const data = state.dashboard
      const runtimeStatus = data?.runtime?.status || 'offline'
      refs.agentDot.className = `dot ${runtimeStatus === 'online' || runtimeStatus === 'scanning' ? 'online' : runtimeStatus === 'degraded' ? 'degraded' : 'offline'}`
      refs.agentBadge.textContent = translateRuntimeStatus(runtimeStatus)

      const metricRows = [
        ['סטטוס חיבור', translateRuntimeStatus(runtimeStatus), 'מצב העבודה הנוכחי של הלקוח המקומי.'],
        ['מצלמות שמורות', String(state.savedCameras.length), 'כמה מצלמות נשמרו מקומית בתחנה הזאת.'],
        ['ערוץ פעיל', state.lastBoundChannelName || state.savedConfig?.channelName || 'לא חובר', 'הערוץ שמקבל עכשיו צילומים מהלקוח.'],
        ['heartbeat אחרון', data?.runtime?.lastHeartbeatAtIso || 'n/a', 'זמן הדיווח האחרון של הלקוח לשרת.'],
      ]

      refs.metricGrid.innerHTML = metricRows.map(([title, value, copy]) => `
        <div class="metric-card">
          <div class="metric-title">${escapeHtml(title)}</div>
          <div class="metric-value">${escapeHtml(String(value))}</div>
          <div class="metric-copy">${escapeHtml(String(copy))}</div>
        </div>
      `).join('')

      const detailRows = [
        ['ארגון', data?.saved?.organizationName || 'לא חובר'],
        ['מזהה תחנה', data?.saved?.deviceId || 'לא זמין'],
        ['מצלמה פעילה', state.lastSavedCameraId || data?.saved?.defaultCameraId || 'לא נשמרה'],
        ['מצב runtime', translateRuntimeStatus(runtimeStatus)],
        ['שגיאה אחרונה', data?.runtime?.lastError || data?.error || 'אין'],
        ['מצב סודות', 'מקומי בלבד'],
      ]

      refs.detailGrid.innerHTML = detailRows.map(([title, value]) => `
        <div class="detail-card">
          <div class="detail-title">${escapeHtml(title)}</div>
          <div class="detail-value">${escapeHtml(String(value))}</div>
        </div>
      `).join('')
    }

    function translateRuntimeStatus(status) {
      if (status === 'online') return 'מחובר'
      if (status === 'scanning') return 'סורק'
      if (status === 'degraded') return 'חלקי'
      return 'לא מחובר'
    }

    async function testActiveSavedCamera() {
      const activeId = state.lastSavedCameraId || state.savedConfig?.defaultCameraId
      const camera = state.savedCameras.find((item) => item.cameraId === activeId)
      if (!camera) {
        showStatus('לא נמצאה מצלמה פעילה לבדיקה.', 'error')
        return
      }
      try {
        showStatus('מריץ בדיקת צילום למצלמה הפעילה...', 'info')
        const result = await window.ghostAPI.testCamera(camera)
        refs.dashboardPreview.hidden = false
        refs.dashboardPreviewImage.src = result.frameDataUrl
        refs.dashboardPreviewText.textContent = `הצילום האחרון הצליח. זמן תגובה: ${result.latencyMs ?? 0} ms`
        showStatus('בדיקת המצלמה הפעילה הצליחה.', 'success')
      } catch (error) {
        refs.dashboardPreview.hidden = true
        showStatus(error?.message || 'בדיקת המצלמה הפעילה נכשלה.', 'error')
      }
    }

    function startReconfigure() {
      state.lastTestResult = null
      state.setupStep = state.savedCameras.length ? 2 : 1
      clearStatus()
      renderSetup()
    }

    async function unbindAgent() {
      try {
        showStatus('מנקה את ההגדרה המקומית...', 'info')
        await window.ghostAPI.unbindAgent()
        state.connectSession = null
        state.savedConfig = null
        state.savedCameras = []
        state.lastSavedCameraId = null
        state.lastBoundChannelName = null
        state.lastTestResult = null
        state.setupStep = 1
        refs.dashboardPreview.hidden = true
        renderSetup()
        showStatus('ההגדרה המקומית נוקתה. האשף חזר לשלב הראשון.', 'success')
      } catch (error) {
        showStatus(error?.message || 'ניקוי ההגדרה נכשל.', 'error')
      }
    }

    function escapeHtml(value) {
      return String(value ?? '')
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
    }

    async function bootstrap() {
      clearStatus()
      await Promise.all([loadSavedState(), loadUsbDevices(), loadDashboard()])
      setSourceType(state.selectedTab)
      renderChannels()
      renderSetup()
      if (typeof window.ghostAPI.onTrayAction === 'function') {
        window.ghostAPI.onTrayAction((action) => {
          if (action === 'rebind') {
            state.setupStep = isSetupComplete() ? 6 : resolveSetupStep()
            renderSetup()
          }
        })
      }
    }

    bootstrap().catch((error) => {
      showStatus(error?.message || 'טעינת הלקוח המקומי נכשלה.', 'error')
    })
  
