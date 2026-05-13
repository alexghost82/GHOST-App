# GHOST Camera Agent

Windows local client for GHOST personal channels. The user creates the channel in the web app first, then binds one local USB camera to that channel through the Electron GUI. After binding, the client keeps the channel online, runs scheduled operations locally, and serves remote frame requests from web chat and timeline tools.

## Requirements

- Windows machine with a USB camera connected.
- Node.js 20+ for local development builds.
- Running GHOST server or deployed GHOST environment.

## Development Run

```powershell
npm install
npm run build
npm start
```

GUI flow:

1. Enter the `ארגון` name.
2. Click `Connect`.
3. Choose one personal channel.
4. Choose one local USB camera.
5. Click `Save binding`.

On the next launch, the saved binding is restored automatically and the worker resumes for that channel.

## Tray Behavior

- Closing the window hides the app to the Windows system tray.
- The worker keeps running in the background.
- Use the tray menu to open the dashboard, rebind the channel, toggle autostart, or exit the client completely.

## Windows Installer

Primary build artifact:

```powershell
npm run build:exe
```

This produces an NSIS Setup EXE with:

- `ghost.ico` branding
- Start Menu shortcut
- optional Desktop shortcut
- autostart registration after install
- launch-after-install behavior

Optional developer artifact:

```powershell
npm run build:portable
```

## Autostart On Windows

The installed client is configured to start with Windows at user logon and launch hidden to tray.

Manual recovery from this folder:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\install-startup-task.ps1 -AppPath "C:\Path\To\GHOST Camera Agent.exe"
```

Remove:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\uninstall-startup-task.ps1
```

The runtime binding is stored in `ghost-agent.runtime.json`, which is ignored by Git. No plaintext GHOST password is stored by the client.
