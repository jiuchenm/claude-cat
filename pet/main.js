const { app, BrowserWindow, ipcMain, screen, Menu, Tray, nativeImage } = require('electron')
const path = require('path')

let petWin = null
let bubbleWin = null
let tray = null
let dragOffset = null

const PET_SIZE = 160
const BUBBLE_W = 220
const BUBBLE_H = 120

function createPetWindow() {
  const { width: screenW, height: screenH } = screen.getPrimaryDisplay().workAreaSize

  petWin = new BrowserWindow({
    width: PET_SIZE,
    height: PET_SIZE,
    x: screenW - PET_SIZE - 40,
    y: screenH - PET_SIZE - 40,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    hasShadow: false,
    resizable: false,
    skipTaskbar: true,
    webPreferences: {
      preload: path.join(__dirname, 'pet-preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  })

  petWin.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true })
  petWin.setIgnoreMouseEvents(false)
  petWin.loadFile(path.join(__dirname, 'pet.html'))

  petWin.on('closed', () => { petWin = null })
}

function createBubbleWindow() {
  if (!petWin) return

  const [petX, petY] = petWin.getPosition()

  bubbleWin = new BrowserWindow({
    width: BUBBLE_W,
    height: BUBBLE_H,
    x: petX - BUBBLE_W + 40,
    y: petY - BUBBLE_H + 10,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    hasShadow: false,
    resizable: false,
    skipTaskbar: true,
    focusable: false,
    webPreferences: {
      preload: path.join(__dirname, 'bubble-preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  })

  bubbleWin.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true })
  bubbleWin.setIgnoreMouseEvents(true, { forward: true })
  bubbleWin.loadFile(path.join(__dirname, 'bubble.html'))

  bubbleWin.on('closed', () => { bubbleWin = null })
}

function updateBubblePosition() {
  if (!petWin || !bubbleWin) return
  const [petX, petY] = petWin.getPosition()
  bubbleWin.setPosition(petX - BUBBLE_W + 40, petY - BUBBLE_H + 10)
}

function showBubble(text, duration = 4000) {
  if (!bubbleWin) createBubbleWindow()
  if (bubbleWin) {
    updateBubblePosition()
    bubbleWin.webContents.send('show-bubble', text)
    bubbleWin.showInactive()
    if (duration > 0) {
      setTimeout(() => {
        if (bubbleWin) bubbleWin.hide()
      }, duration)
    }
  }
}

function createTray() {
  const icon = nativeImage.createFromPath(path.join(__dirname, 'assets', 'logo.png'))
  tray = new Tray(icon.resize({ width: 18, height: 18 }))
  tray.setToolTip('Claude Pet')

  const contextMenu = Menu.buildFromTemplate([
    { label: 'Wake Up', click: () => petWin?.webContents.send('set-state', 'idle') },
    { label: 'Sleep', click: () => petWin?.webContents.send('set-state', 'sleep') },
    { label: 'Do Task', click: () => petWin?.webContents.send('set-state', 'task') },
    { type: 'separator' },
    { label: 'Quit', click: () => app.quit() },
  ])
  tray.setContextMenu(contextMenu)
}

// --- IPC Handlers ---

ipcMain.on('start-drag', (_, screenX, screenY) => {
  if (!petWin) return
  const [winX, winY] = petWin.getPosition()
  dragOffset = { x: screenX - winX, y: screenY - winY }
})

ipcMain.on('drag-move', (_, screenX, screenY) => {
  if (!petWin || !dragOffset) return
  petWin.setPosition(
    Math.round(screenX - dragOffset.x),
    Math.round(screenY - dragOffset.y),
  )
  updateBubblePosition()
})

ipcMain.on('stop-drag', () => {
  dragOffset = null
})

ipcMain.on('set-ignore-mouse', (_, ignore) => {
  if (!petWin) return
  petWin.setIgnoreMouseEvents(ignore, { forward: true })
})

ipcMain.on('show-bubble', (_, text, duration) => {
  showBubble(text, duration)
})

ipcMain.on('hide-bubble', () => {
  if (bubbleWin) bubbleWin.hide()
})

ipcMain.on('pet-right-click', () => {
  if (!petWin) return
  const menu = Menu.buildFromTemplate([
    { label: '😸 Wake Up', click: () => petWin.webContents.send('set-state', 'idle') },
    { label: '😴 Sleep', click: () => petWin.webContents.send('set-state', 'sleep') },
    { label: '⚡ Do Task', click: () => petWin.webContents.send('set-state', 'task') },
    { type: 'separator' },
    { label: '🐾 About Claude Pet', click: () => showBubble('Claude Pet v0.1 🐱', 3000) },
    { label: '👋 Quit', click: () => app.quit() },
  ])
  menu.popup({ window: petWin })
})

// --- App Lifecycle ---

app.whenReady().then(() => {
  createPetWindow()
  createBubbleWindow()
  createTray()

  // Greet on start
  setTimeout(() => showBubble('Hi! I\'m your Claude buddy 🐱', 3500), 800)
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
