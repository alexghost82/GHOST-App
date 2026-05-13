"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const node_path_1 = require("node:path");
const { app, BrowserWindow, ipcMain, Menu, Tray, nativeImage } = require('electron');
const preloadPath = (0, node_path_1.join)(__dirname, 'preload.cjs');
const agentIconPath = (0, node_path_1.join)(__dirname, '../ghost.ico');
const AUTOSTART_TASK_NAME = 'GHOST Camera Agent';
const TELEMETRY_SAMPLE_INTERVAL_MS = 5_000;
const TELEMETRY_RETENTION_MS = 60 * 60 * 1000;
const DASHBOARD_CACHE_MAX_AGE_MS = 4_000;
const HEARTBEAT_BUDGET_SECONDS = 45;
let mainWindow = null;
let worker = null;
let runtimeState = null;
let healthServer = null;
let telemetryTimer = null;
let tray = null;
let autostartEnabled = false;
let sessionTelemetry = [];
let latestDashboardSnapshot = {
    channel: null,
    fetchedAtIso: new Date(0).toISOString(),
    error: null,
};
let trayIconCache = {};
let isQuitting = false;
let pendingTrayAction = null;
const rawLaunchArgs = process.argv.slice(1);
const launchFlags = new Set(rawLaunchArgs.filter((value) => value.startsWith('--')));
const registerAutostartMode = launchFlags.has('--register-autostart');
const unregisterAutostartMode = launchFlags.has('--unregister-autostart');
const startHidden = launchFlags.has('--hidden') && !launchFlags.has('--open-dashboard');
const singleInstanceLock = app.requestSingleInstanceLock();
if (!singleInstanceLock) {
    app.quit();
}
app.setAppUserModelId('com.ghost.camera-agent');
async function loadStore() {
    return import('./local-store.js');
}
async function loadApiClient() {
    return import('./api-client.js');
}
async function loadWindowsAutostart() {
    const dynamicImport = new Function('specifier', 'return import(specifier)');
    return dynamicImport('./windows-autostart.js');
}
function clearSessionTelemetry() {
    sessionTelemetry = [];
    latestDashboardSnapshot = {
        channel: null,
        fetchedAtIso: new Date().toISOString(),
        error: null,
    };
    updateTrayPresentation();
}
function stopTelemetryLoop() {
    if (telemetryTimer) {
        clearInterval(telemetryTimer);
        telemetryTimer = null;
    }
}
function heartbeatFreshnessSeconds(runtime, channel) {
    const heartbeatIso = runtime?.lastHeartbeatAtIso ?? channel?.localAgentStatus?.lastHeartbeatAtIso;
    if (!heartbeatIso) {
        return null;
    }
    const heartbeatMs = Date.parse(heartbeatIso);
    if (!Number.isFinite(heartbeatMs)) {
        return null;
    }
    return Math.max(0, Math.round((Date.now() - heartbeatMs) / 1000));
}
function pushTelemetrySample(channel, error) {
    const sample = {
        timestampIso: new Date().toISOString(),
        runtimeStatus: runtimeState?.status ?? 'offline',
        heartbeatFreshnessSec: heartbeatFreshnessSeconds(runtimeState, channel),
        scannedOperations: runtimeState?.scannedOperations ?? 0,
        hasError: Boolean(error || runtimeState?.lastError || channel?.localAgentStatus?.lastError),
        localAgentState: channel?.localAgentStatus?.state ?? null,
        channelLiveState: channel?.liveState ?? null,
    };
    const previous = sessionTelemetry[sessionTelemetry.length - 1];
    if (previous) {
        const previousMs = Date.parse(previous.timestampIso);
        const currentMs = Date.parse(sample.timestampIso);
        if (Number.isFinite(previousMs) && Number.isFinite(currentMs) && currentMs - previousMs < TELEMETRY_SAMPLE_INTERVAL_MS - 500) {
            sessionTelemetry[sessionTelemetry.length - 1] = sample;
        }
        else {
            sessionTelemetry.push(sample);
        }
    }
    else {
        sessionTelemetry.push(sample);
    }
    const cutoffMs = Date.now() - TELEMETRY_RETENTION_MS;
    sessionTelemetry = sessionTelemetry.filter((item) => {
        const itemMs = Date.parse(item.timestampIso);
        return !Number.isFinite(itemMs) || itemMs >= cutoffMs;
    });
    updateTrayPresentation();
}
async function refreshDashboardSnapshot(saved) {
    try {
        const { GhostApiClient } = await loadApiClient();
        const api = new GhostApiClient({
            apiBaseUrl: saved.apiBaseUrl,
            accessToken: saved.accessToken,
            refreshToken: saved.refreshToken,
        });
        const channel = await api.fetchChannel(saved.channelId);
        latestDashboardSnapshot = {
            channel,
            fetchedAtIso: new Date().toISOString(),
            error: null,
        };
    }
    catch (error) {
        latestDashboardSnapshot = {
            channel: null,
            fetchedAtIso: new Date().toISOString(),
            error: error instanceof Error ? error.message : String(error),
        };
    }
    pushTelemetrySample(latestDashboardSnapshot.channel, latestDashboardSnapshot.error);
    return latestDashboardSnapshot;
}
async function sampleTelemetry() {
    const { loadLocalConfig } = await loadStore();
    const saved = loadLocalConfig();
    if (!saved) {
        clearSessionTelemetry();
        return;
    }
    await refreshDashboardSnapshot(saved);
}
function startTelemetryLoop() {
    stopTelemetryLoop();
    telemetryTimer = setInterval(() => {
        void sampleTelemetry().catch(() => undefined);
    }, TELEMETRY_SAMPLE_INTERVAL_MS);
}
async function startWorkerFromSaved(saved) {
    const [{ buildConfigFromSaved }, { startHealthServer }, { LocalCameraWorker }] = await Promise.all([
        import('./config.js'),
        import('./health-server.js'),
        import('./worker.js'),
    ]);
    if (worker) {
        worker.stop();
        worker = null;
    }
    if (healthServer) {
        healthServer.close();
        healthServer = null;
    }
    const config = buildConfigFromSaved(saved);
    runtimeState = {
        startedAtIso: new Date().toISOString(),
        status: 'starting',
        scannedOperations: 0,
    };
    worker = new LocalCameraWorker(config, runtimeState);
    healthServer = startHealthServer(config.healthPort, runtimeState);
    await worker.start();
    await refreshDashboardSnapshot(saved);
    updateTrayPresentation();
}
function createWindow(hidden = false) {
    if (mainWindow) {
        return;
    }
    mainWindow = new BrowserWindow({
        width: 1220,
        height: 860,
        minWidth: 1024,
        minHeight: 740,
        show: !hidden,
        title: 'GHOST Camera Agent',
        icon: agentIconPath,
        backgroundColor: '#d9dbd1',
        autoHideMenuBar: true,
        webPreferences: {
            preload: preloadPath,
            contextIsolation: true,
            nodeIntegration: false,
            sandbox: true,
        },
    });
    mainWindow.removeMenu();
    mainWindow.on('close', (event) => {
        if (!isQuitting) {
            event.preventDefault();
            mainWindow?.hide();
        }
    });
    mainWindow.on('closed', () => {
        mainWindow = null;
    });
    mainWindow.webContents.on('did-finish-load', () => {
        flushPendingTrayAction();
    });
    void mainWindow.loadFile((0, node_path_1.join)(__dirname, '../src/ui/index.html'));
}
function showWindow() {
    if (!mainWindow) {
        createWindow(false);
    }
    if (!mainWindow) {
        return;
    }
    if (mainWindow.isMinimized()) {
        mainWindow.restore();
    }
    mainWindow.show();
    mainWindow.focus();
}
function flushPendingTrayAction() {
    if (!pendingTrayAction || !mainWindow) {
        return;
    }
    mainWindow.webContents.send('tray-action', pendingTrayAction);
    pendingTrayAction = null;
}
function openDashboard(action) {
    if (action) {
        pendingTrayAction = action;
    }
    showWindow();
    if (mainWindow?.webContents && !mainWindow.webContents.isLoadingMainFrame()) {
        flushPendingTrayAction();
    }
}
function getCurrentTrayStatus() {
    const channel = latestDashboardSnapshot.channel;
    const freshness = heartbeatFreshnessSeconds(runtimeState, channel);
    const hasBinding = Boolean(channel?.localAgentBinding);
    const runtimeStatus = runtimeState?.status ?? 'offline';
    const agentState = channel?.localAgentStatus?.state ?? 'offline';
    if (!hasBinding || freshness === null || freshness > HEARTBEAT_BUDGET_SECONDS) {
        return { visual: 'off', label: 'Offline' };
    }
    if (runtimeStatus === 'degraded' || agentState === 'degraded' || latestDashboardSnapshot.error) {
        return { visual: 'degraded', label: 'Degraded' };
    }
    if (runtimeStatus === 'online' || runtimeStatus === 'scanning') {
        return { visual: 'on', label: runtimeStatus === 'scanning' ? 'Scanning' : 'Online' };
    }
    return { visual: 'off', label: 'Offline' };
}
function createTrayVariant(visual) {
    const cached = trayIconCache[visual];
    if (cached) {
        return cached;
    }
    const baseImage = nativeImage.createFromPath(agentIconPath).resize({ width: 20, height: 20 });
    const size = baseImage.getSize();
    const bitmap = Buffer.from(baseImage.toBitmap());
    if (bitmap.length === 0 || size.width === 0 || size.height === 0) {
        trayIconCache[visual] = baseImage;
        return baseImage;
    }
    for (let i = 0; i < bitmap.length; i += 4) {
        const blue = bitmap[i];
        const green = bitmap[i + 1];
        const red = bitmap[i + 2];
        const alpha = bitmap[i + 3];
        if (alpha === 0) {
            continue;
        }
        const luminance = Math.round((red * 0.299) + (green * 0.587) + (blue * 0.114));
        if (visual === 'off') {
            bitmap[i] = luminance;
            bitmap[i + 1] = luminance;
            bitmap[i + 2] = luminance;
            bitmap[i + 3] = Math.max(120, Math.round(alpha * 0.82));
            continue;
        }
        if (visual === 'degraded') {
            bitmap[i] = Math.round((blue * 0.35) + (42 * 0.65));
            bitmap[i + 1] = Math.round((green * 0.45) + (161 * 0.55));
            bitmap[i + 2] = Math.round((red * 0.3) + (255 * 0.7));
            continue;
        }
    }
    const image = nativeImage.createFromBitmap(bitmap, {
        width: size.width,
        height: size.height,
        scaleFactor: 1,
    });
    trayIconCache[visual] = image;
    return image;
}
function updateTrayPresentation() {
    if (!tray) {
        return;
    }
    const trayStatus = getCurrentTrayStatus();
    tray.setImage(createTrayVariant(trayStatus.visual));
    tray.setToolTip(`GHOST Camera Agent - ${trayStatus.label}`);
    const template = [
        {
            label: 'Open GHOST Camera Agent',
            click: () => openDashboard(),
        },
        {
            label: `Status: ${trayStatus.label}`,
            enabled: false,
        },
        { type: 'separator' },
        {
            label: 'Rebind Channel',
            click: () => openDashboard('rebind'),
        },
        {
            label: autostartEnabled ? 'Pause Autostart' : 'Enable Autostart',
            click: () => {
                void toggleAutostart().catch((error) => {
                    latestDashboardSnapshot.error = error instanceof Error ? error.message : String(error);
                    updateTrayPresentation();
                });
            },
        },
        { type: 'separator' },
        {
            label: 'Exit',
            click: () => {
                isQuitting = true;
                app.quit();
            },
        },
    ];
    tray.setContextMenu(Menu.buildFromTemplate(template));
}
async function refreshAutostartState() {
    const { isAutostartEnabled } = await loadWindowsAutostart();
    autostartEnabled = await isAutostartEnabled();
    updateTrayPresentation();
}
function getAutostartLaunchConfig() {
    if (app.isPackaged) {
        return {
            executable: process.execPath,
            args: ['--hidden'],
            workingDirectory: (0, node_path_1.dirname)(process.execPath),
        };
    }
    return {
        executable: process.execPath,
        args: [(0, node_path_1.resolve)(app.getAppPath()), '--hidden'],
        workingDirectory: (0, node_path_1.resolve)(app.getAppPath()),
    };
}
async function enableAutostart() {
    const { registerAutostart } = await loadWindowsAutostart();
    await registerAutostart(getAutostartLaunchConfig(), AUTOSTART_TASK_NAME);
    autostartEnabled = true;
    updateTrayPresentation();
}
async function disableAutostart() {
    const { unregisterAutostart } = await loadWindowsAutostart();
    await unregisterAutostart(AUTOSTART_TASK_NAME);
    autostartEnabled = false;
    updateTrayPresentation();
}
async function toggleAutostart() {
    if (autostartEnabled) {
        await disableAutostart();
        return;
    }
    await enableAutostart();
}
function createTray() {
    if (tray) {
        return;
    }
    tray = new Tray(createTrayVariant('off'));
    tray.on('click', () => openDashboard());
    tray.on('double-click', () => openDashboard());
    updateTrayPresentation();
}
app.whenReady().then(async () => {
    if (registerAutostartMode) {
        await enableAutostart().catch(() => undefined);
        app.quit();
        return;
    }
    if (unregisterAutostartMode) {
        await disableAutostart().catch(() => undefined);
        app.quit();
        return;
    }
    const { loadLocalConfig } = await loadStore();
    const saved = loadLocalConfig();
    if (saved) {
        await startWorkerFromSaved(saved).catch(() => undefined);
    }
    createTray();
    startTelemetryLoop();
    await refreshAutostartState().catch(() => undefined);
    createWindow(startHidden);
    app.on('activate', () => {
        openDashboard();
    });
});
app.on('second-instance', (_event, commandLine) => {
    if (commandLine.includes('--hidden') && !commandLine.includes('--open-dashboard')) {
        return;
    }
    openDashboard();
});
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin' && isQuitting) {
        app.quit();
    }
});
app.on('before-quit', () => {
    isQuitting = true;
    stopTelemetryLoop();
});
ipcMain.handle('load-config', () => {
    return loadStore().then(({ loadLocalConfig }) => loadLocalConfig());
});
ipcMain.handle('connect-agent', async (_event, payload) => {
    const [{ GhostApiClient }, { DEFAULT_API_BASE_URL }] = await Promise.all([
        loadApiClient(),
        loadStore(),
    ]);
    return GhostApiClient.connect(payload.apiBaseUrl?.trim() || DEFAULT_API_BASE_URL, payload.organizationName, payload.deviceName, payload.deviceId);
});
ipcMain.handle('get-cameras', async () => {
    const [{ listDShowCameras }, { resolveFfmpegPath }] = await Promise.all([
        import('./camera-list.js'),
        import('./ffmpeg-resolver.js'),
    ]);
    return listDShowCameras(resolveFfmpegPath());
});
ipcMain.handle('save-binding', async (_event, payload) => {
    const [{ GhostApiClient }, { DEFAULT_API_BASE_URL, saveLocalConfig }] = await Promise.all([
        loadApiClient(),
        loadStore(),
    ]);
    const api = new GhostApiClient({
        apiBaseUrl: DEFAULT_API_BASE_URL,
        accessToken: payload.accessToken,
        refreshToken: payload.refreshToken,
    });
    await api.bindChannel({
        channelId: payload.channelId,
        deviceId: payload.deviceId,
        deviceName: payload.deviceName,
        cameraName: payload.cameraName,
    });
    const normalizedPayload = {
        ...payload,
        apiBaseUrl: DEFAULT_API_BASE_URL,
    };
    saveLocalConfig(normalizedPayload);
    await startWorkerFromSaved(normalizedPayload);
    startTelemetryLoop();
    updateTrayPresentation();
    return { ok: true };
});
ipcMain.handle('unbind-agent', async () => {
    const { loadLocalConfig, clearLocalConfig } = await loadStore();
    const saved = loadLocalConfig();
    if (!saved) {
        return { ok: true };
    }
    const { GhostApiClient } = await loadApiClient();
    const api = new GhostApiClient({
        apiBaseUrl: saved.apiBaseUrl,
        accessToken: saved.accessToken,
        refreshToken: saved.refreshToken,
    });
    await api.unbindChannel(saved.channelId, saved.deviceId);
    worker?.stop();
    worker = null;
    healthServer?.close();
    healthServer = null;
    runtimeState = null;
    clearLocalConfig();
    clearSessionTelemetry();
    updateTrayPresentation();
    return { ok: true };
});
ipcMain.handle('get-runtime-status', () => {
    return runtimeState;
});
ipcMain.handle('get-dashboard-data', async () => {
    const { loadLocalConfig } = await loadStore();
    const saved = loadLocalConfig();
    if (!saved) {
        return {
            saved: null,
            runtime: runtimeState,
            channel: null,
            fetchedAtIso: new Date().toISOString(),
            error: null,
            sessionTelemetry,
        };
    }
    const snapshotAgeMs = Date.now() - Date.parse(latestDashboardSnapshot.fetchedAtIso);
    const snapshot = !Number.isFinite(snapshotAgeMs) || snapshotAgeMs > DASHBOARD_CACHE_MAX_AGE_MS
        ? await refreshDashboardSnapshot(saved)
        : latestDashboardSnapshot;
    return {
        saved,
        runtime: runtimeState,
        channel: snapshot.channel,
        fetchedAtIso: snapshot.fetchedAtIso,
        error: snapshot.error,
        sessionTelemetry,
    };
});
