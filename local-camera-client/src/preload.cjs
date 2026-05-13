const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('ghostAPI', {
  loadConfig: () => ipcRenderer.invoke('load-config'),
  getDeviceContext: () => ipcRenderer.invoke('get-device-context'),
  getPendingProvisioningToken: () => ipcRenderer.invoke('get-pending-provisioning-token'),
  clearPendingProvisioningToken: () => ipcRenderer.invoke('clear-pending-provisioning-token'),
  consumeProvisioningSession: (payload) => ipcRenderer.invoke('consume-provisioning-session', payload),
  connectAgent: (payload) => ipcRenderer.invoke('connect-agent', payload),
  getCameras: () => ipcRenderer.invoke('get-cameras'),
  getSavedCameras: () => ipcRenderer.invoke('get-saved-cameras'),
  discoverCameras: () => ipcRenderer.invoke('discover-cameras'),
  getHikvisionSdkStatus: () => ipcRenderer.invoke('get-hikvision-sdk-status'),
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
  onProvisioningToken: (handler) => {
    const listener = (_event, token) => handler(token)
    ipcRenderer.on('provisioning-token', listener)
    return () => ipcRenderer.removeListener('provisioning-token', listener)
  },
})
