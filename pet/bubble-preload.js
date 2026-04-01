const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('bubbleAPI', {
  onShowBubble: (cb) => ipcRenderer.on('show-bubble', (_, text) => cb(text)),
})
