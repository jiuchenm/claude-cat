const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('petAPI', {
  startDrag: (screenX, screenY) => ipcRenderer.send('start-drag', screenX, screenY),
  dragMove: (screenX, screenY) => ipcRenderer.send('drag-move', screenX, screenY),
  stopDrag: () => ipcRenderer.send('stop-drag'),
  setIgnoreMouse: (ignore) => ipcRenderer.send('set-ignore-mouse', ignore),
  showBubble: (text, duration) => ipcRenderer.send('show-bubble', text, duration),
  hideBubble: () => ipcRenderer.send('hide-bubble'),
  rightClick: () => ipcRenderer.send('pet-right-click'),
  stateChanged: (state) => ipcRenderer.send('state-changed', state),
  onSetState: (cb) => ipcRenderer.on('set-state', (_, state) => cb(state)),
})
