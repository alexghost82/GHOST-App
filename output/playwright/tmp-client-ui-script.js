
    const API_BASE_URL = 'https://ghost-test-app-b906c.web.app'
    const LANGUAGE_STORAGE_KEY = 'ghost-local-client-language'
    const POLL_INTERVAL_MS = 5000
    const HEARTBEAT_BUDGET_SECONDS = 45

    const i18n = {
      en: {
        dir: 'ltr',
        appSubtitle: 'Local USB camera bridge for GHOST channels',
        statusInfo: 'Client status',
        statusSuccess: 'Ready',
        statusError: 'Error',
        viewConnect: 'Step 1 / Connect',
        viewChannel: 'Step 2 / Channel',
        viewCamera: 'Step 3 / Camera',
        viewDashboard: 'Dashboard',
        connectKicker: 'Setup',
        connectTitle: 'Connect the client',
        connectText: 'Enter the organization name and bring this desktop client online for channel binding.',
        orgLabel: 'Organization',
        orgPlaceholder: 'Enter organization name',
        deviceLabel: 'Device name',
        backendNote: 'Server is fixed in this production client: ' + API_BASE_URL,
        connectBtn: 'Connect',
        connectBusy: 'Connecting...',
        connectHintTitle: 'Connection',
        connectHintBody: 'The client uses the live GHOST backend, restores the device identity, and loads the personal channels for this organization.',
        connectStepTitle: 'What happens next',
        connectStepOne: 'Connect this client to the organization.',
        connectStepTwo: 'Choose which personal channel this computer will serve.',
        connectStepThree: 'Bind one local USB, RTSP, or Hikvision SDK camera and keep the worker online.',
        channelKicker: 'Binding',
        channelTitle: 'Choose a channel',
        channelText: 'Select the personal channel that should use this local camera client.',
        channelLabel: 'Channel',
        channelNote: 'Only personal channels are shown here.',
        channelHintTitle: 'Channel routing',
        channelHintBody: 'Once a local client is bound, remote chat and capture requests route through this machine instead of the dashboard camera.',
        channelMetaTitle: 'Selection',
        channelMetaBody: 'Choose one channel and continue to camera selection.',
        cameraKicker: 'Binding',
        cameraTitle: 'Choose a camera',
        cameraText: 'Choose USB or RTSP. Hikvision RTSP cameras are saved and captured through Hikvision SDK.',
        sourceLabel: 'Camera source',
        sourceUsbTitle: 'USB',
        sourceUsbNote: 'Use a DirectShow camera connected to this computer.',
        sourceRtspTitle: 'RTSP',
        sourceRtspNote: 'Enter IP, user, and password. Hikvision cameras use SDK automatically.',
        cameraLabel: 'USB camera',
        rtspHostLabel: 'Camera IP',
        rtspUserLabel: 'User',
        rtspPasswordLabel: 'Password',
        cameraNoteReady: 'Choose a camera and save the binding.',
        cameraNoteLoading: 'Refreshing local USB cameras...',
        cameraNoteRtsp: 'RTSP URL is generated automatically as rtsp://user:password@ip:554/Streaming/Channels/101.',
        cameraNoteHikvision: 'Selected camera is Hikvision. Hikvision SDK is required for testing, saving, and capture.',
        cameraHintTitle: 'Camera access',
        cameraHintBody: 'The worker captures the single bound camera. USB uses DirectShow; RTSP/Hikvision uses the saved camera profile.',
        cameraSafetyTitle: 'Binding rule',
        cameraSafetyBody: 'One running client serves exactly one channel and one camera.',
        backBtn: 'Back',
        nextBtn: 'Continue',
        refreshBtn: 'Refresh cameras',
        discoverBtn: 'Search cameras on network',
        testCameraBtn: 'Test camera',
        saveBtn: 'Save binding',
        saveBusy: 'Saving...',
        dashboardKicker: 'Operations',
        dashboardTitle: 'Local client dashboard',
        dashboardSubtitle: 'Live operational view of this workstation, its bound channel, and the configured rules.',
        scanChartTitle: 'Scan activity',
        scanChartNote: 'Current session scan volume',
        healthChartTitle: 'Health timeline',
        healthChartNote: 'Recent worker and agent states',
        rulesTitle: 'Rules',
        rulesNote: 'Rules shown here come directly from the bound channel record.',
        bindingTitle: 'Binding',
        bindingNote: 'Saved client identity and channel binding',
        activityTitle: 'Activity',
        activityNote: 'Runtime and refresh timestamps from this session',
        actionsTitle: 'Actions',
        actionsNote: 'Keep the worker online, rebind safely, or disconnect the client.',
        rebindBtn: 'Rebind channel',
        unbindBtn: 'Disconnect client',
        gaugeHeartbeat: 'Heartbeat',
        gaugeRuntime: 'Runtime',
        gaugeRules: 'Rules',
        gaugeHeartbeatNote: 'Freshness within 45-second online window',
        gaugeRuntimeNote: 'Worker state and current uptime',
        gaugeRulesNote: 'Enabled rules vs total configured rules',
        chartEmpty: 'Waiting for live session data.',
        rulesEmpty: 'No rules are configured for this channel yet.',
        noChannels: 'No personal channels available',
        noCameras: 'No USB cameras detected',
        discoveryTitle: 'Network camera search',
        discoveryText: 'SADP-style discovery prefers Hikvision SDK results and supplements them with RTSP/network probes.',
        discoveryEmpty: 'No network cameras found.',
        discoveryLoading: 'Searching the local network...',
        useCameraBtn: 'Use camera',
        closeBtn: 'Close',
        testCameraLoading: 'Testing camera capture...',
        testCameraReady: 'Camera test succeeded.',
        rtspNeedFields: 'Enter camera IP, user, and password first.',
        connectNeedOrg: 'Enter the organization name first.',
        chooseChannel: 'Choose a channel first.',
        chooseCamera: 'Choose a camera first.',
        connectLoading: 'Connecting to GHOST and loading channels...',
        connectReady: 'Connected. Continue to channel selection.',
        refreshLoading: 'Refreshing local USB cameras...',
        refreshReady: 'Camera list updated.',
        saveLoading: 'Saving binding and starting the worker...',
        saveReady: 'Binding saved. The dashboard is now live.',
        disconnectLoading: 'Disconnecting client...',
        disconnectReady: 'Client disconnected. The setup flow is ready again.',
        rebindLoading: 'Loading channels for rebind...',
        rebindReady: 'Choose a new channel for this client.',
        state_starting: 'Starting',
        state_online: 'Online',
        state_scanning: 'Scanning',
        state_degraded: 'Degraded',
        state_offline: 'Offline',
        state_connected: 'Connected',
        state_live: 'Live',
        state_sync: 'Sync',
        source_browser: 'Browser camera',
        source_local_agent: 'Local client',
        notAvailable: 'Not available',
        none: 'None',
        enabled: 'Enabled',
        disabled: 'Disabled',
        mode_alert: 'Alert',
        mode_report: 'Report',
        mode_rating: 'Rating',
        mode_assessment: 'Assessment',
        labelClient: 'Client',
        labelAgent: 'Agent',
        labelChannel: 'Channel',
        labelSource: 'Source',
        labelCamera: 'Camera',
        labelDevice: 'Device',
        labelHeartbeatFreshness: 'Freshness',
        labelRuntimeUptime: 'Uptime',
        labelRuleCoverage: 'Coverage',
        bindingOrg: 'Organization',
        bindingChannel: 'Channel',
        bindingCamera: 'Camera',
        bindingDevice: 'Device',
        bindingDeviceId: 'Device ID',
        bindingBoundAt: 'Bound at',
        activityHeartbeat: 'Last heartbeat',
        activityScan: 'Last scan',
        activityRuntime: 'Runtime',
        activityRefresh: 'Dashboard refresh',
        activityError: 'Last error',
        activityScans: 'Scans this session',
        schedule: 'Schedule',
        ruleName: 'Rule',
        ruleMode: 'Mode',
        ruleSchedule: 'Schedule',
        ruleState: 'State',
        noteFresh: 'Live data refreshed at {time}.',
        noteError: 'Partial dashboard data: {error}',
        legendOnline: 'online',
        legendScanning: 'scanning',
        legendDegraded: 'degraded',
        legendOffline: 'offline',
        metricSeconds: '{value}s',
        metricHours: '{value}h',
      },
      ru: {
        dir: 'ltr',
        appSubtitle: 'Локальный мост USB-камеры для каналов GHOST',
        statusInfo: 'Состояние клиента',
        statusSuccess: 'Готово',
        statusError: 'Ошибка',
        viewConnect: 'Шаг 1 / Подключение',
        viewChannel: 'Шаг 2 / Канал',
        viewCamera: 'Шаг 3 / Камера',
        viewDashboard: 'Панель',
        connectKicker: 'Настройка',
        connectTitle: 'Подключить клиент',
        connectText: 'Введите имя организации и выведите этот настольный клиент в онлайн для привязки канала.',
        orgLabel: 'Организация',
        orgPlaceholder: 'Введите имя организации',
        deviceLabel: 'Имя устройства',
        backendNote: 'Сервер жёстко зафиксирован в production-клиенте: ' + API_BASE_URL,
        connectBtn: 'Подключить',
        connectBusy: 'Подключение...',
        connectHintTitle: 'Подключение',
        connectHintBody: 'Клиент использует live GHOST backend, восстанавливает идентичность устройства и загружает персональные каналы организации.',
        connectStepTitle: 'Что будет дальше',
        connectStepOne: 'Подключите этот клиент к организации.',
        connectStepTwo: 'Выберите персональный канал для этого компьютера.',
        connectStepThree: 'Привяжите одну локальную USB-камеру и держите worker онлайн.',
        channelKicker: 'Привязка',
        channelTitle: 'Выбор канала',
        channelText: 'Выберите персональный канал, который должен обслуживаться этим локальным клиентом.',
        channelLabel: 'Канал',
        channelNote: 'Здесь показываются только персональные каналы.',
        channelHintTitle: 'Маршрутизация',
        channelHintBody: 'После привязки локального клиента удалённый чат и захват кадров идут через этот компьютер, а не через камеру дашборда.',
        channelMetaTitle: 'Выбор',
        channelMetaBody: 'Выберите один канал и перейдите к выбору камеры.',
        cameraKicker: 'Привязка',
        cameraTitle: 'Выбор камеры',
        cameraText: 'Выберите одну локальную USB-камеру и сохраните привязку для этого канала.',
        cameraLabel: 'USB-камера',
        cameraNoteReady: 'Выберите камеру и сохраните привязку.',
        cameraNoteLoading: 'Обновляется список локальных USB-камер...',
        cameraHintTitle: 'Доступ к камере',
        cameraHintBody: 'Worker может захватывать только одну камеру за раз. Если устройство занято, закройте другие приложения.',
        cameraSafetyTitle: 'Правило привязки',
        cameraSafetyBody: 'Один запущенный клиент обслуживает ровно один канал и одну USB-камеру.',
        backBtn: 'Назад',
        nextBtn: 'Дальше',
        refreshBtn: 'Обновить камеры',
        saveBtn: 'Сохранить привязку',
        saveBusy: 'Сохранение...',
        dashboardKicker: 'Операции',
        dashboardTitle: 'Приборная панель клиента',
        dashboardSubtitle: 'Живая оперативная картина рабочего места, привязанного канала и настроенных правил.',
        scanChartTitle: 'Активность сканов',
        scanChartNote: 'Объём сканирования в текущей сессии',
        healthChartTitle: 'Лента здоровья',
        healthChartNote: 'Недавние состояния worker и agent',
        rulesTitle: 'Правила',
        rulesNote: 'Правила здесь берутся напрямую из записи привязанного канала.',
        bindingTitle: 'Привязка',
        bindingNote: 'Сохранённая идентичность клиента и привязка канала',
        activityTitle: 'Активность',
        activityNote: 'Runtime и временные метки обновления в текущей сессии',
        actionsTitle: 'Действия',
        actionsNote: 'Держите worker онлайн, безопасно перепривязывайте канал или отключайте клиент.',
        rebindBtn: 'Перепривязать канал',
        unbindBtn: 'Отключить клиент',
        gaugeHeartbeat: 'Heartbeat',
        gaugeRuntime: 'Runtime',
        gaugeRules: 'Правила',
        gaugeHeartbeatNote: 'Свежесть в пределах 45 секунд',
        gaugeRuntimeNote: 'Состояние worker и текущее время работы',
        gaugeRulesNote: 'Активные правила против общего количества',
        chartEmpty: 'Ожидание живых данных сессии.',
        rulesEmpty: 'Для этого канала правила пока не настроены.',
        noChannels: 'Персональные каналы недоступны',
        noCameras: 'USB-камеры не найдены',
        connectNeedOrg: 'Сначала введите имя организации.',
        chooseChannel: 'Сначала выберите канал.',
        chooseCamera: 'Сначала выберите камеру.',
        connectLoading: 'Подключение к GHOST и загрузка каналов...',
        connectReady: 'Подключено. Переходите к выбору канала.',
        refreshLoading: 'Обновляется список локальных USB-камер...',
        refreshReady: 'Список камер обновлён.',
        saveLoading: 'Сохраняется привязка и запускается worker...',
        saveReady: 'Привязка сохранена. Панель уже живая.',
        disconnectLoading: 'Отключение клиента...',
        disconnectReady: 'Клиент отключён. Мастер настройки снова готов.',
        rebindLoading: 'Загружаются каналы для перепривязки...',
        rebindReady: 'Выберите новый канал для этого клиента.',
        state_starting: 'Запуск',
        state_online: 'Онлайн',
        state_scanning: 'Сканирование',
        state_degraded: 'Деградация',
        state_offline: 'Оффлайн',
        state_connected: 'Подключён',
        state_live: 'Live',
        state_sync: 'Sync',
        source_browser: 'Камера браузера',
        source_local_agent: 'Локальный клиент',
        notAvailable: 'Недоступно',
        none: 'Нет',
        enabled: 'Активно',
        disabled: 'Выключено',
        mode_alert: 'Оповещение',
        mode_report: 'Отчёт',
        mode_rating: 'Оценка',
        mode_assessment: 'Анализ',
        labelClient: 'Клиент',
        labelAgent: 'Агент',
        labelChannel: 'Канал',
        labelSource: 'Источник',
        labelCamera: 'Камера',
        labelDevice: 'Устройство',
        labelHeartbeatFreshness: 'Свежесть',
        labelRuntimeUptime: 'Аптайм',
        labelRuleCoverage: 'Покрытие',
        bindingOrg: 'Организация',
        bindingChannel: 'Канал',
        bindingCamera: 'Камера',
        bindingDevice: 'Устройство',
        bindingDeviceId: 'ID устройства',
        bindingBoundAt: 'Привязано',
        activityHeartbeat: 'Последний heartbeat',
        activityScan: 'Последний скан',
        activityRuntime: 'Runtime',
        activityRefresh: 'Обновление панели',
        activityError: 'Последняя ошибка',
        activityScans: 'Сканов за сессию',
        schedule: 'Расписание',
        ruleName: 'Правило',
        ruleMode: 'Режим',
        ruleSchedule: 'Расписание',
        ruleState: 'Состояние',
        noteFresh: 'Live-данные обновлены в {time}.',
        noteError: 'Панель загружена частично: {error}',
        legendOnline: 'онлайн',
        legendScanning: 'сканирование',
        legendDegraded: 'деградация',
        legendOffline: 'оффлайн',
        metricSeconds: '{value}с',
        metricHours: '{value}ч',
      },
      he: {
        dir: 'rtl',
        appSubtitle: 'גשר מצלמת USB מקומית לערוצי GHOST',
        statusInfo: 'סטטוס לקוח',
        statusSuccess: 'מוכן',
        statusError: 'שגיאה',
        viewConnect: 'שלב 1 / חיבור',
        viewChannel: 'שלב 2 / ערוץ',
        viewCamera: 'שלב 3 / מצלמה',
        viewDashboard: 'לוח בקרה',
        connectKicker: 'הגדרה',
        connectTitle: 'חבר את הלקוח',
        connectText: 'הזן את שם הארגון והעלה את לקוח הדסקטופ הזה לאונליין לצורך קישור ערוץ.',
        orgLabel: 'ארגון',
        orgPlaceholder: 'הזן שם ארגון',
        deviceLabel: 'שם התקן',
        backendNote: 'השרת מקובע בלקוח הייצור הזה: ' + API_BASE_URL,
        connectBtn: 'התחבר',
        connectBusy: 'מתחבר...',
        connectHintTitle: 'חיבור',
        connectHintBody: 'הלקוח משתמש ב-backend החי של GHOST, משחזר את זהות ההתקן וטוען את הערוצים האישיים של הארגון.',
        connectStepTitle: 'מה קורה בהמשך',
        connectStepOne: 'חבר את הלקוח הזה לארגון.',
        connectStepTwo: 'בחר איזה ערוץ אישי המחשב הזה ישרת.',
        connectStepThree: 'קשר מצלמת USB מקומית אחת והשאר את ה-worker אונליין.',
        channelKicker: 'קישור',
        channelTitle: 'בחר ערוץ',
        channelText: 'בחר את הערוץ האישי שצריך לקבל שירות מלקוח המצלמה המקומי הזה.',
        channelLabel: 'ערוץ',
        channelNote: 'כאן מוצגים רק ערוצים אישיים.',
        channelHintTitle: 'ניתוב',
        channelHintBody: 'אחרי קישור לקוח מקומי, צ׳אט מרוחק ובקשות צילום ינותבו דרך המחשב הזה ולא דרך מצלמת הדשבורד.',
        channelMetaTitle: 'בחירה',
        channelMetaBody: 'בחר ערוץ אחד והמשך לבחירת מצלמה.',
        cameraKicker: 'קישור',
        cameraTitle: 'בחר מצלמה',
        cameraText: 'בחר מצלמת USB מקומית אחת ושמור את הקישור עבור הערוץ הזה.',
        cameraLabel: 'מצלמת USB',
        cameraNoteReady: 'בחר מצלמה ושמור את הקישור.',
        cameraNoteLoading: 'מרענן את רשימת מצלמות ה-USB המקומיות...',
        cameraHintTitle: 'גישה למצלמה',
        cameraHintBody: 'ה-worker יכול לצלם ממצלמה אחת בלבד בכל רגע. אם ההתקן תפוס, סגור אפליקציות אחרות.',
        cameraSafetyTitle: 'כלל קישור',
        cameraSafetyBody: 'לקוח רץ אחד משרת בדיוק ערוץ אחד ומצלמת USB אחת.',
        backBtn: 'חזרה',
        nextBtn: 'המשך',
        refreshBtn: 'רענן מצלמות',
        saveBtn: 'שמור קישור',
        saveBusy: 'שומר...',
        dashboardKicker: 'תפעול',
        dashboardTitle: 'לוח הבקרה של הלקוח',
        dashboardSubtitle: 'תצוגת תפעול חיה של תחנת העבודה, הערוץ המקושר והחוקים המוגדרים.',
        scanChartTitle: 'פעילות סריקות',
        scanChartNote: 'נפח סריקות בסשן הנוכחי',
        healthChartTitle: 'ציר בריאות',
        healthChartNote: 'מצבים אחרונים של ה-worker וה-agent',
        rulesTitle: 'חוקים',
        rulesNote: 'החוקים כאן מגיעים ישירות מרשומת הערוץ המקושר.',
        bindingTitle: 'קישור',
        bindingNote: 'זהות הלקוח השמורה וקישור הערוץ',
        activityTitle: 'פעילות',
        activityNote: 'נתוני runtime וזמני רענון מתוך הסשן הנוכחי',
        actionsTitle: 'פעולות',
        actionsNote: 'השאר את ה-worker אונליין, בצע קישור מחדש בבטחה או נתק את הלקוח.',
        rebindBtn: 'קשר ערוץ מחדש',
        unbindBtn: 'נתק לקוח',
        gaugeHeartbeat: 'Heartbeat',
        gaugeRuntime: 'Runtime',
        gaugeRules: 'חוקים',
        gaugeHeartbeatNote: 'טריות במסגרת חלון אונליין של 45 שניות',
        gaugeRuntimeNote: 'סטטוס worker וזמן ריצה נוכחי',
        gaugeRulesNote: 'חוקים פעילים מתוך כלל החוקים',
        chartEmpty: 'ממתין לנתוני סשן חיים.',
        rulesEmpty: 'עדיין לא הוגדרו חוקים לערוץ הזה.',
        noChannels: 'אין ערוצים אישיים זמינים',
        noCameras: 'לא זוהו מצלמות USB',
        connectNeedOrg: 'יש להזין תחילה את שם הארגון.',
        chooseChannel: 'יש לבחור תחילה ערוץ.',
        chooseCamera: 'יש לבחור תחילה מצלמה.',
        connectLoading: 'מתחבר ל-GHOST וטוען ערוצים...',
        connectReady: 'החיבור הצליח. המשך לבחירת ערוץ.',
        refreshLoading: 'מרענן את מצלמות ה-USB המקומיות...',
        refreshReady: 'רשימת המצלמות עודכנה.',
        saveLoading: 'שומר את הקישור ומפעיל את ה-worker...',
        saveReady: 'הקישור נשמר. לוח הבקרה כבר חי.',
        disconnectLoading: 'מנתק את הלקוח...',
        disconnectReady: 'הלקוח נותק. תהליך ההגדרה מוכן מחדש.',
        rebindLoading: 'טוען ערוצים לקישור מחדש...',
        rebindReady: 'בחר ערוץ חדש עבור הלקוח הזה.',
        state_starting: 'מתחיל',
        state_online: 'אונליין',
        state_scanning: 'סורק',
        state_degraded: 'מוחלש',
        state_offline: 'אופליין',
        state_connected: 'מחובר',
        state_live: 'חי',
        state_sync: 'סנכרון',
        source_browser: 'מצלמת דפדפן',
        source_local_agent: 'לקוח מקומי',
        notAvailable: 'לא זמין',
        none: 'אין',
        enabled: 'פעיל',
        disabled: 'מושבת',
        mode_alert: 'התראה',
        mode_report: 'דוח',
        mode_rating: 'דירוג',
        mode_assessment: 'הערכה',
        labelClient: 'לקוח',
        labelAgent: 'Agent',
        labelChannel: 'ערוץ',
        labelSource: 'מקור',
        labelCamera: 'מצלמה',
        labelDevice: 'התקן',
        labelHeartbeatFreshness: 'טריות',
        labelRuntimeUptime: 'זמן ריצה',
        labelRuleCoverage: 'כיסוי',
        bindingOrg: 'ארגון',
        bindingChannel: 'ערוץ',
        bindingCamera: 'מצלמה',
        bindingDevice: 'התקן',
        bindingDeviceId: 'מזהה התקן',
        bindingBoundAt: 'נקשר ב',
        activityHeartbeat: 'Heartbeat אחרון',
        activityScan: 'סריקה אחרונה',
        activityRuntime: 'Runtime',
        activityRefresh: 'רענון לוח',
        activityError: 'שגיאה אחרונה',
        activityScans: 'סריקות בסשן',
        schedule: 'תזמון',
        ruleName: 'חוק',
        ruleMode: 'מצב',
        ruleSchedule: 'תזמון',
        ruleState: 'סטטוס',
        noteFresh: 'הנתונים החיים רועננו ב-{time}.',
        noteError: 'הלוח נטען חלקית: {error}',
        legendOnline: 'אונליין',
        legendScanning: 'סריקה',
        legendDegraded: 'מוחלש',
        legendOffline: 'אופליין',
        metricSeconds: '{value}ש׳',
        metricHours: '{value}ש׳',
      },
    }

    const state = {
      language: localStorage.getItem(LANGUAGE_STORAGE_KEY) || 'ru',
      view: 'connect',
      connectSession: null,
      channels: [],
      cameras: [],
      savedCameras: [],
      discoveredCameras: [],
      selectedDiscovery: null,
      cameraSource: 'usb',
      busy: { connect: false, cameras: false, save: false, rebind: false, discovery: false, test: false },
      pollId: null,
      requestSeq: 0,
      dashboardRequestSeq: 0,
    }

    const refs = {
      statusCard: document.getElementById('statusCard'),
      statusTitle: document.getElementById('statusTitle'),
      statusText: document.getElementById('statusText'),
      stepPill: document.getElementById('stepPill'),
      orgName: document.getElementById('orgName'),
      deviceName: document.getElementById('deviceName'),
      channelSelect: document.getElementById('channelSelect'),
      cameraSelect: document.getElementById('cameraSelect'),
      sourceToggle: document.getElementById('sourceToggle'),
      usbCameraPanel: document.getElementById('usbCameraPanel'),
      rtspCameraPanel: document.getElementById('rtspCameraPanel'),
      rtspHost: document.getElementById('rtspHost'),
      rtspUsername: document.getElementById('rtspUsername'),
      rtspPassword: document.getElementById('rtspPassword'),
      discoverCamerasBtn: document.getElementById('discoverCamerasBtn'),
      testRtspBtn: document.getElementById('testRtspBtn'),
      discoveryModal: document.getElementById('discoveryModal'),
      discoveryList: document.getElementById('discoveryList'),
      closeDiscoveryBtn: document.getElementById('closeDiscoveryBtn'),
      channelNote: document.getElementById('channelNote'),
      cameraNote: document.getElementById('cameraNote'),
      connectBtn: document.getElementById('connectBtn'),
      backToConnectBtn: document.getElementById('backToConnectBtn'),
      toCameraBtn: document.getElementById('toCameraBtn'),
      backToChannelBtn: document.getElementById('backToChannelBtn'),
      refreshCamerasBtn: document.getElementById('refreshCamerasBtn'),
      saveBtn: document.getElementById('saveBtn'),
      identityTags: document.getElementById('identityTags'),
      statusTags: document.getElementById('statusTags'),
      gaugesGrid: document.getElementById('gaugesGrid'),
      scanBars: document.getElementById('scanBars'),
      healthTimeline: document.getElementById('healthTimeline'),
      healthLegend: document.getElementById('healthLegend'),
      rulesTable: document.getElementById('rulesTable'),
      bindingRows: document.getElementById('bindingRows'),
      activityRows: document.getElementById('activityRows'),
      dashboardNote: document.getElementById('dashboardNote'),
      rebindBtn: document.getElementById('rebindBtn'),
      unbindBtn: document.getElementById('unbindBtn'),
      viewConnect: document.getElementById('viewConnect'),
      viewChannel: document.getElementById('viewChannel'),
      viewCamera: document.getElementById('viewCamera'),
      viewDashboard: document.getElementById('viewDashboard'),
    }

    function tr(key, vars = {}) {
      let value = (i18n[state.language] && i18n[state.language][key]) || i18n.en[key] || key
      for (const [name, replacement] of Object.entries(vars)) {
        value = value.replaceAll(`{${name}}`, replacement)
      }
      return value
    }

    function escapeHtml(value) {
      return String(value ?? '')
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#39;')
    }

    function formatDateTime(value) {
      if (!value) return tr('notAvailable')
      const date = new Date(value)
      if (Number.isNaN(date.getTime())) return String(value)
      const locale = state.language === 'he' ? 'he-IL' : state.language === 'ru' ? 'ru-RU' : 'en-US'
      return date.toLocaleString(locale, {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      })
    }

    function formatDuration(startedAtIso) {
      if (!startedAtIso) return tr('notAvailable')
      const diffMs = Date.now() - Date.parse(startedAtIso)
      if (!Number.isFinite(diffMs) || diffMs < 0) return tr('notAvailable')
      const totalSeconds = Math.floor(diffMs / 1000)
      const hours = Math.floor(totalSeconds / 3600)
      const minutes = Math.floor((totalSeconds % 3600) / 60)
      if (hours > 0) return `${hours}h ${minutes}m`
      return `${minutes}m ${totalSeconds % 60}s`
    }

    function clamp(value, min, max) {
      return Math.min(max, Math.max(min, value))
    }

    function labelState(value) {
      const normalized = String(value || '').toLowerCase()
      if (!normalized) return tr('notAvailable')
      return i18n[state.language][`state_${normalized}`] || i18n.en[`state_${normalized}`] || String(value)
    }

    function labelMode(value) {
      const normalized = String(value || '').toLowerCase()
      return i18n[state.language][`mode_${normalized}`] || i18n.en[`mode_${normalized}`] || String(value || tr('notAvailable'))
    }

    function labelSource(value) {
      const normalized = String(value || '').toLowerCase()
      if (normalized === 'usb-dshow') return 'USB'
      if (normalized === 'rtsp') return 'RTSP'
      if (normalized === 'hikvision-sdk') return 'Hikvision SDK'
      return i18n[state.language][`source_${normalized}`] || i18n.en[`source_${normalized}`] || String(value || tr('notAvailable'))
    }

    function normalizeHost(value) {
      const trimmed = String(value || '').trim()
      if (!trimmed) return ''
      if (/^rtsp:\/\//i.test(trimmed)) {
        try {
          return new URL(trimmed).hostname
        } catch {
          return trimmed
        }
      }
      return trimmed.replace(/^https?:\/\//i, '').split('/')[0].split(':')[0]
    }

    function isSelectedDiscoveryHikvision() {
      const camera = state.selectedDiscovery
      if (!camera) return false
      return camera.sourceType === 'hikvision-sdk'
        || camera.discoveryType === 'hikvision-sdk'
        || /hikvision/i.test(camera.manufacturer || '')
    }

    function setCameraSource(source) {
      state.cameraSource = source === 'rtsp' ? 'rtsp' : 'usb'
      refs.usbCameraPanel.hidden = state.cameraSource !== 'usb'
      refs.rtspCameraPanel.hidden = state.cameraSource !== 'rtsp'
      document.querySelectorAll('[data-source-card]').forEach((card) => {
        card.classList.toggle('active', card.dataset.sourceCard === state.cameraSource)
      })
      document.querySelectorAll('input[name="cameraSource"]').forEach((input) => {
        input.checked = input.value === state.cameraSource
      })
      applyCameraNote()
    }

    function applyCameraNote() {
      if (state.busy.cameras) {
        refs.cameraNote.textContent = tr('cameraNoteLoading')
        return
      }
      if (state.cameraSource === 'rtsp') {
        refs.cameraNote.textContent = isSelectedDiscoveryHikvision() ? tr('cameraNoteHikvision') : tr('cameraNoteRtsp')
        return
      }
      refs.cameraNote.textContent = tr('cameraNoteReady')
    }

    function buildRtspSourcePayload() {
      const host = normalizeHost(refs.rtspHost.value)
      const username = refs.rtspUsername.value.trim()
      const password = refs.rtspPassword.value
      if (!host || !username || !password) {
        throw new Error(tr('rtspNeedFields'))
      }
      return {
        type: 'rtsp',
        host,
        username,
        password,
        discoveryType: state.selectedDiscovery?.discoveryType,
        sourceType: state.selectedDiscovery?.sourceType,
        manufacturer: state.selectedDiscovery?.manufacturer,
        suggestedSource: state.selectedDiscovery?.suggestedSource,
      }
    }

    function toneForState(value) {
      const normalized = String(value || '').toLowerCase()
      if (normalized === 'online' || normalized === 'connected' || normalized === 'live') return 'success'
      if (normalized === 'scanning' || normalized === 'sync') return 'info'
      if (normalized === 'degraded') return 'warning'
      return 'danger'
    }

    function showStatus(message, tone = 'info') {
      refs.statusCard.className = `status-card status-${tone}`
      refs.statusTitle.textContent = tone === 'error' ? tr('statusError') : tone === 'success' ? tr('statusSuccess') : tr('statusInfo')
      refs.statusText.textContent = message
    }

    function nextRequestId() {
      state.requestSeq += 1
      return state.requestSeq
    }

    function clearStatus() {
      refs.statusCard.className = 'status-card hidden'
      refs.statusTitle.textContent = ''
      refs.statusText.textContent = ''
    }

    function setView(view) {
      state.view = view
      refs.viewConnect.hidden = view !== 'connect'
      refs.viewChannel.hidden = view !== 'channel'
      refs.viewCamera.hidden = view !== 'camera'
      refs.viewDashboard.hidden = view !== 'dashboard'
      refs.stepPill.textContent = tr(`view${view.charAt(0).toUpperCase()}${view.slice(1)}`)
    }

    function renderSelect(select, items, emptyLabel) {
      select.innerHTML = ''
      if (!items.length) {
        const option = document.createElement('option')
        option.value = ''
        option.textContent = emptyLabel
        select.appendChild(option)
        return
      }

      items.forEach((item) => {
        const option = document.createElement('option')
        option.value = item.value
        option.textContent = item.label
        if (item.selected) option.selected = true
        if (item.channelName) option.dataset.channelName = item.channelName
        if (item.dataset) {
          Object.entries(item.dataset).forEach(([key, value]) => {
            if (value != null) option.dataset[key] = value
          })
        }
        select.appendChild(option)
      })
    }

    function applyLanguage() {
      const locale = i18n[state.language] || i18n.en
      document.documentElement.lang = state.language
      document.body.dir = locale.dir
      localStorage.setItem(LANGUAGE_STORAGE_KEY, state.language)

      document.getElementById('brandSubtitle').textContent = tr('appSubtitle')
      document.getElementById('connectKicker').textContent = tr('connectKicker')
      document.getElementById('connectTitle').textContent = tr('connectTitle')
      document.getElementById('connectText').textContent = tr('connectText')
      document.getElementById('orgLabel').textContent = tr('orgLabel')
      refs.orgName.placeholder = tr('orgPlaceholder')
      document.getElementById('deviceLabel').textContent = tr('deviceLabel')
      document.getElementById('backendNote').textContent = tr('backendNote')
      document.getElementById('connectHintTitle').textContent = tr('connectHintTitle')
      document.getElementById('connectHintBody').textContent = tr('connectHintBody')
      document.getElementById('connectStepTitle').textContent = tr('connectStepTitle')
      document.getElementById('connectStepOne').textContent = tr('connectStepOne')
      document.getElementById('connectStepTwo').textContent = tr('connectStepTwo')
      document.getElementById('connectStepThree').textContent = tr('connectStepThree')

      document.getElementById('channelKicker').textContent = tr('channelKicker')
      document.getElementById('channelTitle').textContent = tr('channelTitle')
      document.getElementById('channelText').textContent = tr('channelText')
      document.getElementById('channelLabel').textContent = tr('channelLabel')
      document.getElementById('channelHintTitle').textContent = tr('channelHintTitle')
      document.getElementById('channelHintBody').textContent = tr('channelHintBody')
      document.getElementById('channelMetaTitle').textContent = tr('channelMetaTitle')
      document.getElementById('channelMetaBody').textContent = tr('channelMetaBody')

      document.getElementById('cameraKicker').textContent = tr('cameraKicker')
      document.getElementById('cameraTitle').textContent = tr('cameraTitle')
      document.getElementById('cameraText').textContent = tr('cameraText')
      document.getElementById('sourceLabel').textContent = tr('sourceLabel')
      document.getElementById('sourceUsbTitle').textContent = tr('sourceUsbTitle')
      document.getElementById('sourceUsbNote').textContent = tr('sourceUsbNote')
      document.getElementById('sourceRtspTitle').textContent = tr('sourceRtspTitle')
      document.getElementById('sourceRtspNote').textContent = tr('sourceRtspNote')
      document.getElementById('cameraLabel').textContent = tr('cameraLabel')
      document.getElementById('rtspHostLabel').textContent = tr('rtspHostLabel')
      document.getElementById('rtspUserLabel').textContent = tr('rtspUserLabel')
      document.getElementById('rtspPasswordLabel').textContent = tr('rtspPasswordLabel')
      document.getElementById('cameraHintTitle').textContent = tr('cameraHintTitle')
      document.getElementById('cameraHintBody').textContent = tr('cameraHintBody')
      document.getElementById('cameraSafetyTitle').textContent = tr('cameraSafetyTitle')
      document.getElementById('cameraSafetyBody').textContent = tr('cameraSafetyBody')
      document.getElementById('discoveryTitle').textContent = tr('discoveryTitle')
      document.getElementById('discoveryText').textContent = tr('discoveryText')

      document.getElementById('dashboardKicker').textContent = tr('dashboardKicker')
      document.getElementById('dashboardTitle').textContent = tr('dashboardTitle')
      document.getElementById('dashboardSubtitle').textContent = tr('dashboardSubtitle')
      document.getElementById('scanChartTitle').textContent = tr('scanChartTitle')
      document.getElementById('scanChartNote').textContent = tr('scanChartNote')
      document.getElementById('healthChartTitle').textContent = tr('healthChartTitle')
      document.getElementById('healthChartNote').textContent = tr('healthChartNote')
      document.getElementById('rulesTitle').textContent = tr('rulesTitle')
      document.getElementById('rulesNote').textContent = tr('rulesNote')
      document.getElementById('bindingTitle').textContent = tr('bindingTitle')
      document.getElementById('bindingNote').textContent = tr('bindingNote')
      document.getElementById('activityTitle').textContent = tr('activityTitle')
      document.getElementById('activityNote').textContent = tr('activityNote')
      document.getElementById('actionsTitle').textContent = tr('actionsTitle')
      document.getElementById('actionsNote').textContent = tr('actionsNote')

      refs.connectBtn.textContent = state.busy.connect ? tr('connectBusy') : tr('connectBtn')
      refs.backToConnectBtn.textContent = tr('backBtn')
      refs.toCameraBtn.textContent = tr('nextBtn')
      refs.backToChannelBtn.textContent = tr('backBtn')
      refs.refreshCamerasBtn.textContent = tr('refreshBtn')
      refs.discoverCamerasBtn.textContent = state.busy.discovery ? tr('discoveryLoading') : tr('discoverBtn')
      refs.testRtspBtn.textContent = state.busy.test ? tr('testCameraLoading') : tr('testCameraBtn')
      refs.closeDiscoveryBtn.textContent = tr('closeBtn')
      refs.saveBtn.textContent = state.busy.save ? tr('saveBusy') : tr('saveBtn')
      refs.rebindBtn.textContent = tr('rebindBtn')
      refs.unbindBtn.textContent = tr('unbindBtn')
      refs.channelNote.textContent = tr('channelNote')
      applyCameraNote()

      document.querySelectorAll('.lang-button').forEach((button) => {
        button.classList.toggle('active', button.dataset.lang === state.language)
      })

      refs.stepPill.textContent = tr(`view${state.view.charAt(0).toUpperCase()}${state.view.slice(1)}`)
    }

    function makeTag(label, tone = 'info') {
      return `<span class="tag ${tone}">${escapeHtml(label)}</span>`
    }

    function makeSidebarRow(label, value) {
      return `
        <div class="sidebar-row">
          <div class="sidebar-label">${escapeHtml(label)}</div>
          <div class="sidebar-value">${escapeHtml(value || tr('notAvailable'))}</div>
        </div>
      `
    }

    function makeGauge(label, value, note, ratio, tone, centerText) {
      const safeRatio = clamp(ratio, 0, 1)
      const radius = 46
      const circumference = 2 * Math.PI * radius
      const dashOffset = circumference * (1 - safeRatio)
      return `
        <article class="gauge-card">
          <div class="gauge-head">
            <div>
              <h3 class="card-title">${escapeHtml(label)}</h3>
              <p class="card-note">${escapeHtml(note)}</p>
            </div>
            ${makeTag(value, tone)}
          </div>
          <div class="gauge-wrap">
            <svg class="gauge-svg" viewBox="0 0 120 120" aria-hidden="true">
              <circle class="gauge-track" cx="60" cy="60" r="${radius}"></circle>
              <circle
                class="gauge-progress ${tone}"
                cx="60"
                cy="60"
                r="${radius}"
                stroke-dasharray="${circumference.toFixed(2)}"
                stroke-dashoffset="${dashOffset.toFixed(2)}"
              ></circle>
              <text class="gauge-center-label" x="60" y="52">${escapeHtml(label)}</text>
              <text class="gauge-center-value" x="60" y="72">${escapeHtml(centerText)}</text>
            </svg>
            <div class="gauge-meta">
              <div class="gauge-value">${escapeHtml(value)}</div>
              <div class="gauge-subvalue">${escapeHtml(note)}</div>
            </div>
          </div>
        </article>
      `
    }

    function makeEmptyState(message) {
      return `<div class="empty-state">${escapeHtml(message)}</div>`
    }

    function extractScanBars(sessionTelemetry) {
      const recent = sessionTelemetry.slice(-24)
      if (!recent.length) return []
      return recent.map((point, index) => {
        const previous = recent[index - 1]
        return Math.max(0, (point.scannedOperations || 0) - (previous?.scannedOperations || 0))
      })
    }

    function renderScanBars(sessionTelemetry) {
      const bars = extractScanBars(sessionTelemetry)
      if (!bars.length) {
        refs.scanBars.innerHTML = makeEmptyState(tr('chartEmpty'))
        return
      }

      const maxValue = Math.max(...bars, 1)
      refs.scanBars.innerHTML = bars.map((value) => {
        const height = value > 0 ? `${Math.max(16, (value / maxValue) * 100)}%` : '10%'
        return `<div class="bar ${value === 0 ? 'zero' : ''}" style="height:${height}" title="${escapeHtml(String(value))}"></div>`
      }).join('')
    }

    function runtimeTone(sample) {
      if (!sample) return 'danger'
      if (sample.runtimeStatus === 'degraded' || sample.hasError) return 'warning'
      if (sample.runtimeStatus === 'scanning') return 'info'
      if (sample.runtimeStatus === 'online' || sample.localAgentState === 'connected') return 'success'
      return 'danger'
    }

    function renderHealthTimeline(sessionTelemetry) {
      const recent = sessionTelemetry.slice(-30)
      if (!recent.length) {
        refs.healthTimeline.innerHTML = makeEmptyState(tr('chartEmpty'))
        refs.healthLegend.innerHTML = ''
        return
      }

      refs.healthTimeline.innerHTML = recent.map((sample) => {
        return `<div class="timeline-segment ${runtimeTone(sample)}" title="${escapeHtml(labelState(sample.runtimeStatus))}"></div>`
      }).join('')

      refs.healthLegend.innerHTML = [
        { key: 'legendOnline', tone: 'success' },
        { key: 'legendScanning', tone: 'info' },
        { key: 'legendDegraded', tone: 'warning' },
        { key: 'legendOffline', tone: 'danger' },
      ].map((item) => `
        <span class="legend-pill">
          <span class="legend-dot timeline-segment ${item.tone}"></span>
          <span>${escapeHtml(tr(item.key))}</span>
        </span>
      `).join('')
    }

    function renderRules(channel) {
      const rules = Array.isArray(channel?.operations) ? channel.operations : []
      if (!rules.length) {
        refs.rulesTable.innerHTML = makeEmptyState(tr('rulesEmpty'))
        return
      }

      refs.rulesTable.innerHTML = `
        <div class="rules-row header">
          <div class="rule-cell">${escapeHtml(tr('ruleName'))}</div>
          <div class="rule-cell">${escapeHtml(tr('ruleMode'))}</div>
          <div class="rule-cell">${escapeHtml(tr('ruleSchedule'))}</div>
          <div class="rule-cell">${escapeHtml(tr('ruleState'))}</div>
        </div>
        ${rules.map((rule) => `
          <div class="rules-row">
            <div class="rule-cell rule-name">${escapeHtml(rule.name)}</div>
            <div class="rule-cell">${escapeHtml(labelMode(rule.mode))}</div>
            <div class="rule-cell">${escapeHtml(rule.schedule || tr('notAvailable'))}</div>
            <div class="rule-cell">${makeTag(rule.enabled ? tr('enabled') : tr('disabled'), rule.enabled ? 'success' : 'danger')}</div>
          </div>
        `).join('')}
      `
    }

    function renderDashboard(data) {
      const saved = data.saved
      const runtime = data.runtime
      const channel = data.channel
      const telemetry = Array.isArray(data.sessionTelemetry) ? data.sessionTelemetry : []
      const agentState = channel?.localAgentStatus?.state || 'offline'
      const channelState = channel?.liveState || 'OFFLINE'
      const runtimeState = runtime?.status || 'offline'
      const freshness = telemetry.length > 0
        ? telemetry[telemetry.length - 1].heartbeatFreshnessSec
        : null

      setView('dashboard')

      refs.identityTags.innerHTML = [
        makeTag(`${tr('bindingChannel')}: ${saved?.channelName || tr('notAvailable')}`, 'info'),
        makeTag(`${tr('labelCamera')}: ${channel?.localAgentBinding?.cameraLabel || saved?.cameraName || tr('notAvailable')}`, 'info'),
        makeTag(`${tr('labelDevice')}: ${saved?.deviceName || tr('notAvailable')}`, 'info'),
        makeTag(`${tr('labelSource')}: ${labelSource(channel?.localAgentBinding?.cameraSourceType || channel?.captureMode || 'local_agent')}`, 'info'),
      ].join('')

      refs.statusTags.innerHTML = [
        makeTag(`${tr('labelClient')}: ${labelState(runtimeState)}`, toneForState(runtimeState)),
        makeTag(`${tr('labelAgent')}: ${labelState(agentState)}`, toneForState(agentState)),
        makeTag(`${tr('labelChannel')}: ${labelState(channelState)}`, toneForState(channelState)),
      ].join('')

      const enabledRules = Array.isArray(channel?.operations)
        ? channel.operations.filter((rule) => rule.enabled).length
        : 0
      const totalRules = Array.isArray(channel?.operations) ? channel.operations.length : 0
      const heartbeatRatio = freshness === null ? 0 : clamp(1 - (freshness / HEARTBEAT_BUDGET_SECONDS), 0, 1)
      const heartbeatTone = freshness === null ? 'danger' : freshness <= 15 ? 'success' : freshness <= HEARTBEAT_BUDGET_SECONDS ? 'warning' : 'danger'
      const uptimeHours = runtime?.startedAtIso ? clamp((Date.now() - Date.parse(runtime.startedAtIso)) / (12 * 60 * 60 * 1000), 0, 1) : 0
      const runtimeToneValue = toneForState(runtimeState)
      const ruleTone = totalRules > 0 && enabledRules === totalRules ? 'success' : enabledRules > 0 ? 'warning' : 'danger'

      refs.gaugesGrid.innerHTML = [
        makeGauge(
          tr('gaugeHeartbeat'),
          freshness === null ? tr('notAvailable') : tr('metricSeconds', { value: String(freshness) }),
          tr('gaugeHeartbeatNote'),
          heartbeatRatio,
          heartbeatTone,
          freshness === null ? '--' : String(freshness),
        ),
        makeGauge(
          tr('gaugeRuntime'),
          labelState(runtimeState),
          `${tr('gaugeRuntimeNote')} · ${formatDuration(runtime?.startedAtIso)}`,
          uptimeHours,
          runtimeToneValue,
          formatDuration(runtime?.startedAtIso).replace(/\s+/g, ''),
        ),
        makeGauge(
          tr('gaugeRules'),
          `${enabledRules}/${totalRules}`,
          tr('gaugeRulesNote'),
          totalRules > 0 ? enabledRules / totalRules : 0,
          ruleTone,
          `${enabledRules}/${totalRules}`,
        ),
      ].join('')

      renderScanBars(telemetry)
      renderHealthTimeline(telemetry)
      renderRules(channel)

      refs.bindingRows.innerHTML = [
        [tr('bindingOrg'), saved?.organizationName],
        [tr('bindingChannel'), saved?.channelName],
        [tr('bindingCamera'), channel?.localAgentBinding?.cameraLabel || saved?.cameraName],
        [tr('bindingDevice'), saved?.deviceName],
        [tr('bindingDeviceId'), saved?.deviceId],
        [tr('bindingBoundAt'), formatDateTime(saved?.boundAtIso)],
      ].map(([label, value]) => makeSidebarRow(label, value)).join('')

      refs.activityRows.innerHTML = [
        [tr('activityHeartbeat'), formatDateTime(runtime?.lastHeartbeatAtIso || channel?.localAgentStatus?.lastHeartbeatAtIso)],
        [tr('activityScan'), formatDateTime(runtime?.lastScanAtIso)],
        [tr('activityRuntime'), formatDuration(runtime?.startedAtIso)],
        [tr('activityScans'), String(runtime?.scannedOperations ?? 0)],
        [tr('activityRefresh'), formatDateTime(data.fetchedAtIso)],
        [tr('activityError'), data.error || runtime?.lastError || channel?.localAgentStatus?.lastError || tr('none')],
      ].map(([label, value]) => makeSidebarRow(label, value)).join('')

      refs.dashboardNote.textContent = data.error
        ? tr('noteError', { error: data.error })
        : tr('noteFresh', { time: formatDateTime(data.fetchedAtIso) })
    }

    function fillChannels(channels, priorBinding) {
      state.channels = channels.filter((channel) => channel.type === 'personal')
      renderSelect(
        refs.channelSelect,
        state.channels.map((channel) => ({
          value: channel.id,
          channelName: channel.name,
          label: `${channel.name} · ${labelSource(channel.captureMode || 'browser')}`,
          selected: priorBinding?.channelId === channel.id,
        })),
        tr('noChannels'),
      )
    }

    async function loadCameras() {
      const requestId = nextRequestId()
      state.busy.cameras = true
      applyLanguage()
      try {
        const [usbCameras, savedCameras] = await Promise.all([
          window.ghostAPI.getCameras(),
          typeof window.ghostAPI.getSavedCameras === 'function' ? window.ghostAPI.getSavedCameras() : [],
        ])
        if (requestId !== state.requestSeq) {
          return
        }
        const usbItems = (Array.isArray(usbCameras) ? usbCameras : []).map((camera, index) => ({
          value: camera.name,
          label: camera.label,
          selected: index === 0,
          dataset: { sourceType: 'usb-dshow' },
        }))
        state.savedCameras = (Array.isArray(savedCameras) ? savedCameras : [])
          .filter((camera) => camera?.cameraId && camera?.source?.type !== 'usb-dshow')
        const savedItems = state.savedCameras.map((camera) => ({
          value: camera.cameraId,
          label: `${camera.label} · ${labelSource(camera.source?.type)}`,
          selected: usbItems.length === 0 && camera.cameraId === state.savedCameras[0]?.cameraId,
          dataset: {
            savedCameraId: camera.cameraId,
            sourceType: camera.source?.type,
            cameraLabel: camera.label,
          },
        }))
        state.cameras = [...usbItems, ...savedItems]
        renderSelect(
          refs.cameraSelect,
          state.cameras,
          tr('noCameras'),
        )
      } finally {
        if (requestId === state.requestSeq) {
          state.busy.cameras = false
          applyLanguage()
        }
      }
    }

    function renderDiscoveryResults(cameras) {
      const networkCameras = (Array.isArray(cameras) ? cameras : [])
        .filter((camera) => camera.sourceType !== 'usb-dshow')
      state.discoveredCameras = networkCameras

      if (!networkCameras.length) {
        refs.discoveryList.innerHTML = `<div class="fixed-note">${escapeHtml(tr('discoveryEmpty'))}</div>`
        return
      }

      refs.discoveryList.innerHTML = networkCameras.map((camera, index) => {
        const meta = [
          camera.host,
          camera.port ? `port ${camera.port}` : '',
          camera.manufacturer || '',
          camera.model || '',
          camera.serial ? `serial ${camera.serial}` : '',
          camera.macAddress ? `mac ${camera.macAddress}` : '',
          labelSource(camera.sourceType),
          camera.status,
        ].filter(Boolean)
        return `
          <div class="discovery-row">
            <div>
              <strong>${escapeHtml(camera.label || camera.host || camera.id)}</strong>
              <div class="discovery-meta">${meta.map((item) => `<span>${escapeHtml(item)}</span>`).join('')}</div>
            </div>
            <button class="button-secondary" type="button" data-use-discovery="${index}">${escapeHtml(tr('useCameraBtn'))}</button>
          </div>
        `
      }).join('')

      refs.discoveryList.querySelectorAll('[data-use-discovery]').forEach((button) => {
        button.addEventListener('click', () => {
          const camera = state.discoveredCameras[Number(button.dataset.useDiscovery)]
          if (!camera) return
          state.selectedDiscovery = camera
          setCameraSource('rtsp')
          refs.rtspHost.value = camera.host || refs.rtspHost.value
          refs.discoveryModal.hidden = true
          applyCameraNote()
          showStatus(
            camera.sourceType === 'hikvision-sdk'
              ? tr('cameraNoteHikvision')
              : tr('cameraNoteRtsp'),
            'info',
          )
        })
      })
    }

    function buildRtspCameraBinding() {
      const source = buildRtspSourcePayload()
      const labelHost = normalizeHost(refs.rtspHost.value)
      return {
        label: state.selectedDiscovery?.label || `Camera ${labelHost}`,
        source,
      }
    }

    async function loadDashboardOrSetup() {
      const requestId = ++state.dashboardRequestSeq
      const data = await window.ghostAPI.getDashboardData()
      if (requestId !== state.dashboardRequestSeq) {
        return
      }
      if (data?.saved) {
        renderDashboard(data)
        return
      }

      if (state.view === 'dashboard' || (!state.connectSession && state.view === 'connect')) {
        setView('connect')
      }
    }

    async function prepareRebindFlow(savedConfig) {
      const requestId = nextRequestId()
      const saved = savedConfig || await window.ghostAPI.loadConfig()
      if (!saved) {
        setView('connect')
        return
      }

      refs.orgName.value = saved.organizationName || refs.orgName.value
      refs.deviceName.value = saved.deviceName || refs.deviceName.value

      state.busy.rebind = true
      showStatus(tr('rebindLoading'), 'info')
      try {
        const connectSession = await window.ghostAPI.connectAgent({
          apiBaseUrl: API_BASE_URL,
          organizationName: saved.organizationName,
          deviceName: saved.deviceName || 'Office Gateway',
          deviceId: saved.deviceId,
        })
        if (requestId !== state.requestSeq) {
          return
        }
        state.connectSession = connectSession
        fillChannels(state.connectSession.channels || [], {
          channelId: saved.channelId,
        })
        setView('channel')
        showStatus(tr('rebindReady'), 'success')
      } catch (error) {
        setView('connect')
        showStatus(error?.message || tr('statusError'), 'error')
      } finally {
        state.busy.rebind = false
      }
    }

    document.querySelectorAll('.lang-button').forEach((button) => {
      button.addEventListener('click', () => {
        state.language = button.dataset.lang
        applyLanguage()
        if (state.view === 'dashboard') {
          void loadDashboardOrSetup()
        }
      })
    })

    refs.connectBtn.addEventListener('click', async () => {
      const requestId = nextRequestId()
      const organizationName = refs.orgName.value.trim()
      if (!organizationName) {
        showStatus(tr('connectNeedOrg'), 'error')
        return
      }

      state.busy.connect = true
      applyLanguage()
      showStatus(tr('connectLoading'), 'info')

      try {
        const connectSession = await window.ghostAPI.connectAgent({
          apiBaseUrl: API_BASE_URL,
          organizationName,
          deviceName: refs.deviceName.value.trim() || 'Office Gateway',
        })
        if (requestId !== state.requestSeq) {
          return
        }
        state.connectSession = connectSession
        fillChannels(state.connectSession.channels || [], state.connectSession.priorBinding)
        setView('channel')
        showStatus(tr('connectReady'), 'success')
      } catch (error) {
        if (requestId === state.requestSeq) {
          showStatus(error?.message || tr('statusError'), 'error')
        }
      } finally {
        if (requestId === state.requestSeq) {
          state.busy.connect = false
          applyLanguage()
        }
      }
    })

    refs.backToConnectBtn.addEventListener('click', () => {
      setView('connect')
      clearStatus()
    })

    refs.toCameraBtn.addEventListener('click', async () => {
      if (!refs.channelSelect.value) {
        showStatus(tr('chooseChannel'), 'error')
        return
      }
      showStatus(tr('refreshLoading'), 'info')
      try {
        await loadCameras()
        setCameraSource('usb')
        setView('camera')
        showStatus(tr('refreshReady'), 'success')
      } catch (error) {
        showStatus(error?.message || tr('statusError'), 'error')
      }
    })

    refs.backToChannelBtn.addEventListener('click', () => {
      setView('channel')
      clearStatus()
    })

    refs.refreshCamerasBtn.addEventListener('click', async () => {
      showStatus(tr('refreshLoading'), 'info')
      try {
        await loadCameras()
        showStatus(tr('refreshReady'), 'success')
      } catch (error) {
        showStatus(error?.message || tr('statusError'), 'error')
      }
    })

    refs.sourceToggle.addEventListener('change', (event) => {
      if (event.target?.name !== 'cameraSource') {
        return
      }
      setCameraSource(event.target.value)
    })

    refs.rtspHost.addEventListener('input', () => {
      state.selectedDiscovery = null
      applyCameraNote()
    })

    refs.discoverCamerasBtn.addEventListener('click', async () => {
      refs.discoveryModal.hidden = false
      refs.discoveryList.innerHTML = `<div class="fixed-note">${escapeHtml(tr('discoveryLoading'))}</div>`
      state.busy.discovery = true
      applyLanguage()
      try {
        const results = await window.ghostAPI.discoverCameras()
        renderDiscoveryResults(results)
      } catch (error) {
        refs.discoveryList.innerHTML = `<div class="fixed-note">${escapeHtml(error?.message || tr('statusError'))}</div>`
      } finally {
        state.busy.discovery = false
        applyLanguage()
      }
    })

    refs.closeDiscoveryBtn.addEventListener('click', () => {
      refs.discoveryModal.hidden = true
    })

    refs.testRtspBtn.addEventListener('click', async () => {
      state.busy.test = true
      applyLanguage()
      showStatus(tr('testCameraLoading'), 'info')
      try {
        const source = buildRtspSourcePayload()
        const labelHost = normalizeHost(refs.rtspHost.value)
        await window.ghostAPI.testCamera({
          label: state.selectedDiscovery?.label || `Camera ${labelHost}`,
          source,
        })
        showStatus(tr('testCameraReady'), 'success')
      } catch (error) {
        showStatus(error?.message || tr('statusError'), 'error')
      } finally {
        state.busy.test = false
        applyLanguage()
      }
    })

    refs.saveBtn.addEventListener('click', async () => {
      if (!state.connectSession) {
        showStatus(tr('connectNeedOrg'), 'error')
        return
      }
      if (!refs.channelSelect.value) {
        showStatus(tr('chooseChannel'), 'error')
        return
      }
      if (state.cameraSource === 'usb' && !refs.cameraSelect.value) {
        showStatus(tr('chooseCamera'), 'error')
        return
      }

      state.busy.save = true
      applyLanguage()
      showStatus(tr('saveLoading'), 'info')

      try {
        const selectedOption = refs.channelSelect.selectedOptions[0]
        let selectedCameraOption = refs.cameraSelect.selectedOptions[0]
        let selectedSavedCameraId = selectedCameraOption?.dataset.savedCameraId
        let cameraName = selectedCameraOption?.dataset.cameraLabel || refs.cameraSelect.value

        if (state.cameraSource === 'rtsp') {
          const rtspCamera = buildRtspCameraBinding()
          selectedSavedCameraId = undefined
          cameraName = rtspCamera.label
          selectedCameraOption = null
          await window.ghostAPI.saveBinding({
            organizationId: state.connectSession.organizationId,
            organizationName: state.connectSession.organizationName,
            apiBaseUrl: API_BASE_URL,
            accessToken: state.connectSession.accessToken,
            refreshToken: state.connectSession.refreshToken,
            username: state.connectSession.profile.username,
            deviceId: state.connectSession.deviceId,
            deviceName: refs.deviceName.value.trim() || 'Office Gateway',
            channelId: selectedOption.value,
            channelName: selectedOption.dataset.channelName,
            cameraName,
            cameraSourcePayload: rtspCamera.source,
            boundAtIso: new Date().toISOString(),
          })
          showStatus(tr('saveReady'), 'success')
          await loadDashboardOrSetup()
          return
        }

        await window.ghostAPI.saveBinding({
          organizationId: state.connectSession.organizationId,
          organizationName: state.connectSession.organizationName,
          apiBaseUrl: API_BASE_URL,
          accessToken: state.connectSession.accessToken,
          refreshToken: state.connectSession.refreshToken,
          username: state.connectSession.profile.username,
          deviceId: state.connectSession.deviceId,
          deviceName: refs.deviceName.value.trim() || 'Office Gateway',
          channelId: selectedOption.value,
          channelName: selectedOption.dataset.channelName,
          cameraName,
          selectedCameraId: selectedSavedCameraId,
          boundAtIso: new Date().toISOString(),
        })
        showStatus(tr('saveReady'), 'success')
        await loadDashboardOrSetup()
      } catch (error) {
        showStatus(error?.message || tr('statusError'), 'error')
      } finally {
        state.busy.save = false
        applyLanguage()
      }
    })

    refs.rebindBtn.addEventListener('click', async () => {
      await prepareRebindFlow()
    })

    refs.unbindBtn.addEventListener('click', async () => {
      showStatus(tr('disconnectLoading'), 'info')
      try {
        await window.ghostAPI.unbindAgent()
        state.connectSession = null
        state.channels = []
        state.cameras = []
        renderSelect(refs.channelSelect, [], tr('noChannels'))
        renderSelect(refs.cameraSelect, [], tr('noCameras'))
        setView('connect')
        showStatus(tr('disconnectReady'), 'success')
      } catch (error) {
        showStatus(error?.message || tr('statusError'), 'error')
      }
    })

    async function bootstrap() {
      applyLanguage()
      renderSelect(refs.channelSelect, [], tr('noChannels'))
      renderSelect(refs.cameraSelect, [], tr('noCameras'))
      setView('connect')

      const saved = await window.ghostAPI.loadConfig()
      if (saved) {
        refs.orgName.value = saved.organizationName || ''
        refs.deviceName.value = saved.deviceName || refs.deviceName.value
      }

      await loadDashboardOrSetup()

      if (state.pollId) {
        clearInterval(state.pollId)
      }
      state.pollId = setInterval(() => {
        if (state.view === 'dashboard') {
          void loadDashboardOrSetup()
        }
      }, POLL_INTERVAL_MS)

      if (typeof window.ghostAPI.onTrayAction === 'function') {
        window.ghostAPI.onTrayAction((action) => {
          if (action === 'rebind') {
            void prepareRebindFlow()
          }
        })
      }
    }

    void bootstrap()
  
