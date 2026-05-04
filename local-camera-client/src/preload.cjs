const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('ghostAPI', {
  loadConfig: () => ipcRenderer.invoke('load-config'),
  connectAgent: (payload) => ipcRenderer.invoke('connect-agent', payload),
  getCameras: () => ipcRenderer.invoke('get-cameras'),
  getSavedCameras: () => ipcRenderer.invoke('get-saved-cameras'),
  discoverCameras: () => ipcRenderer.invoke('discover-cameras'),
  saveCamera: (payload) => ipcRenderer.invoke('save-camera', payload),
  deleteCamera: (cameraId) => ipcRenderer.invoke('delete-camera', cameraId),
  testCamera: (payload) => ipcRenderer.invoke('test-camera', payload),
  saveBinding: (payload) => ipcRenderer.invoke('save-binding', payload),
  unbindAgent: () => ipcRenderer.invoke('unbind-agent'),
  getRuntimeStatus: () => ipcRenderer.invoke('get-runtime-status'),
  getDashboardData: () => ipcRenderer.invoke('get-dashboard-data'),
  onTrayAction: (handler) => {
    const listener = (_event, action) => handler(action)
    ipcRenderer.on('tray-action', listener)
    return () => ipcRenderer.removeListener('tray-action', listener)
  },
})
