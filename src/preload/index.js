import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('api', {
  getInfo: async (callback) => {
    const info = await ipcRenderer.invoke('getInfo')
    callback(info)
  },
  quitApp: () => {
    ipcRenderer.send('quitApp')
  },
  minimizeApp: () => {
    ipcRenderer.send('minimizeApp')
  }
})
