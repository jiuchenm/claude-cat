const { contextBridge, ipcRenderer } = require('electron')

function onChannel(channel, callback) {
  ipcRenderer.removeAllListeners(channel)
  ipcRenderer.on(channel, callback)
}

let _wakeAudio = null
let _downAudio = null
function _playVoiceSound(type) {
  try {
    if (type === 'wake') {
      if (!_wakeAudio) _wakeAudio = new Audio('wake.MP3')
      _wakeAudio.currentTime = 0
      _wakeAudio.play().catch(() => {})
    } else {
      if (!_downAudio) _downAudio = new Audio('down.MP3')
      _downAudio.currentTime = 0
      _downAudio.play().catch(() => {})
    }
  } catch (e) {}
}

contextBridge.exposeInMainWorld('electronAPI', {
  // ---- Pet Window ----
  toggleChat: () => ipcRenderer.send('toggle-chat'),
  showContextMenu: () => ipcRenderer.send('show-context-menu'),
  onAnimState: (callback) => {
    onChannel('anim-state', (_event, state) => callback(state))
  },
  animStateChanged: (state) => ipcRenderer.send('anim-state-changed', state),
  onPoseChange: (callback) => {
    onChannel('pose-change', (_event, pose) => callback(pose))
  },
  onCursorPosition: (callback) => {
    onChannel('cursor-position', (_event, data) => callback(data))
  },
  onDirectionChange: (callback) => {
    onChannel('direction-change', (_event, direction) => callback(direction))
  },

  // ---- Mouse Passthrough ----
  setIgnoreMouse: (ignore) => ipcRenderer.send('set-ignore-mouse', !!ignore),

  // ---- Rapid Click ----
  rapidClick: () => ipcRenderer.send('rapid-click'),

  // ---- Drag ----
  startDrag: (screenX, screenY) => ipcRenderer.send('start-drag', Math.round(screenX), Math.round(screenY)),
  dragMove: (screenX, screenY) => ipcRenderer.send('drag-move', Math.round(screenX), Math.round(screenY)),
  stopDrag: () => ipcRenderer.send('stop-drag'),

  // ---- Chat Window (OpenClaw Gateway) ----
  inputFocus: () => ipcRenderer.send('input-focus'),
  inputBlur: () => ipcRenderer.send('input-blur'),
  sendMessage: ({ sessionKey, message, attachments }) => ipcRenderer.invoke('send-message', { sessionKey, message, attachments }),
  saveChatAttachments: ({ sessionKey, attachments }) => ipcRenderer.invoke('save-chat-attachments', { sessionKey, attachments }),
  chatInject: ({ sessionKey, message }) => ipcRenderer.invoke('chat-inject', { sessionKey, message }),
  closeChat: () => ipcRenderer.send('close-chat'),
  clearChat: () => ipcRenderer.send('clear-chat'),
  getChatHistory: (sessionKey) => ipcRenderer.invoke('get-chat-history', sessionKey),
  abortChat: (sessionKey) => ipcRenderer.invoke('abort-chat', sessionKey),
  getSessions: () => ipcRenderer.invoke('get-sessions'),
  deleteSession: (sessionKey) => ipcRenderer.invoke('delete-session', sessionKey),
  renameSession: (sessionKey, newName) => ipcRenderer.invoke('rename-session', sessionKey, newName),
  getGatewayHealth: () => ipcRenderer.invoke('get-gateway-health'),
  getSessionTokenUsage: (sessionKey) => ipcRenderer.invoke('get-session-token-usage', sessionKey),
  onSessionTokenUsage: (callback) => {
    onChannel('session-token-usage', (_event, data) => callback(data))
  },

  // Chat streaming events
  onAIChunk: (callback) => {
    onChannel('ai-chunk', (_event, chunk, sessionKey) => callback(chunk, sessionKey))
  },
  onAIDone: (callback) => {
    onChannel('ai-done', (_event, data) => callback(data))
  },
  onAIError: (callback) => {
    onChannel('ai-error', (_event, error, sessionKey) => callback(error, sessionKey))
  },
  onApiError: (callback) => {
    onChannel('api-error', (_event, data) => callback(data))
  },
  onAITool: (callback) => {
    onChannel('ai-tool', (_event, data) => callback(data))
  },
  onAIRunStart: (callback) => {
    onChannel('ai-run-start', (_event, data) => callback(data))
  },
  onAIFinal: (callback) => {
    onChannel('ai-final', (_event, data) => callback(data))
  },

  // Gateway connection status
  onGatewayStatus: (callback) => {
    onChannel('gateway-status', (_event, status) => callback(status))
  },

  // Brain bootstrap
  onBrainStatus: (callback) => {
    onChannel('brain-status', (_event, msg) => callback(msg))
  },
  onBrainStep: (callback) => {
    onChannel('brain-step', (_event, step) => callback(step))
  },
  onBrainStepDebug: (callback) => {
    onChannel('brain-step-debug', (_event, step) => callback(step))
  },
  onBrainActive: (callback) => {
    onChannel('brain-active', (_event, active) => callback(active))
  },
  onSetupSop: (callback) => {
    onChannel('setup-sop', (_event, steps) => callback(steps))
  },
  onQuickConnectStatus: (callback) => {
    onChannel('quick-connect-status', (_event, data) => callback(data))
  },
  triggerBootstrap: () => ipcRenderer.invoke('trigger-bootstrap'),
  onGatewayPairingUrl: (callback) => {
    onChannel('gateway-pairing-url', (_event, url) => callback(url))
  },
  validateCompute: (testSettings) => ipcRenderer.invoke('validate-compute', testSettings || null),

  // ---- App Info ----
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),

  // ---- Auth ----
  sendCode: (params) => ipcRenderer.invoke('send-code', params),
  login: (params) => ipcRenderer.invoke('login', params),
  getUserInfo: () => ipcRenderer.invoke('get-user-info'),
  getDeviceId: () => ipcRenderer.invoke('get-device-id'),
  getQuotaUsage: () => ipcRenderer.invoke('get-quota-usage'),
  getUsageOverview: (params) => ipcRenderer.invoke('get-usage-overview', params || {}),
  getUsageInvoices: (params) => ipcRenderer.invoke('get-usage-invoices', params || {}),
  getUsageCredit: (params) => ipcRenderer.invoke('get-usage-credit', params || {}),
  authComplete: (data) => ipcRenderer.invoke('auth-complete', data),
  openGoogleAuth: () => ipcRenderer.invoke('open-google-auth'),
  onGoogleAuthCallback: (callback) => {
    onChannel('google-auth-callback', (_event, data) => callback(data))
  },
  onUserInfoRefreshed: (callback) => {
    onChannel('user-info-refreshed', (_event, data) => callback(data))
  },

  // ---- Models ----
  getModels: (params) => ipcRenderer.invoke('get-models', params || {}),

  // ---- Settings ----
  getSettings: () => ipcRenderer.invoke('get-settings'),
  saveSettings: (settings, options) => ipcRenderer.invoke('save-settings', settings, options || {}),
  getAutoLaunch: () => ipcRenderer.invoke('get-auto-launch'),
  setAutoLaunch: (enable) => ipcRenderer.invoke('set-auto-launch', enable),
  getPersonaFiles: () => ipcRenderer.invoke('get-openclaw-persona-files'),
  openOpenclaeDashboard: () => ipcRenderer.invoke('open-openclaw-dashboard'),
  quotaResolved: (source) => ipcRenderer.invoke('quota-resolved', source),
  onLanguageChanged: (callback) => {
    onChannel('settings-language-changed', (_event, lang) => callback(lang))
  },
  onSaveProgress: (callback) => {
    onChannel('save-progress', (_event, data) => callback(data))
  },
  onNavigateTo: (callback) => {
    onChannel('navigate-to', (_event, page) => callback(page))
  },

  // ---- Permissions ----
  checkAccessibility: () => ipcRenderer.invoke('check-accessibility'),
  requestAccessibility: () => ipcRenderer.invoke('request-accessibility'),
  checkMicrophone: () => ipcRenderer.invoke('check-microphone'),
  requestMicrophone: () => ipcRenderer.invoke('request-microphone'),
  restartFnMonitor: () => ipcRenderer.invoke('restart-fn-monitor'),
  updateVoiceShortcut: (keys) => ipcRenderer.invoke('update-voice-shortcut', keys),

  // ---- Voice ----
  transcribeAudio: (arrayBuffer) => ipcRenderer.invoke('transcribe-audio', arrayBuffer),
  voiceStart: () => { _playVoiceSound('wake'); ipcRenderer.send('voice-start') },
  voiceConfirm: () => { _playVoiceSound('down'); ipcRenderer.send('voice-confirm') },
  voiceCancel: () => { _playVoiceSound('down'); ipcRenderer.send('voice-cancel') },
  voiceTranscribing: (active) => ipcRenderer.send('voice-transcribing', active),
  onVoiceTranscribing: (callback) => {
    onChannel('voice-transcribing', (_event, active) => callback(active))
  },
  onVoiceForceCancel: (callback) => {
    onChannel('voice-force-cancel', () => callback())
  },

  // ---- Auth Lifecycle ----
  logout: () => ipcRenderer.invoke('logout'),
  switchModelTier: (tier) => ipcRenderer.invoke('switch-model-tier', tier),
  redeemPromoCode: (params) => ipcRenderer.invoke('redeem-promo-code', params),

  // ---- Pet Lifecycle ----
  petAppear: () => ipcRenderer.invoke('pet-appear'),
  checkWindowShown: () => ipcRenderer.invoke('check-window-shown'),
  onWindowShown: (cb) => {
    ipcRenderer.once('window-shown', () => cb())
  },

  // ---- Auto Update ----
  checkForUpdates: () => ipcRenderer.invoke('check-for-updates'),
  downloadUpdate: () => ipcRenderer.invoke('download-update'),
  installUpdate: () => ipcRenderer.invoke('install-update'),
  dismissUpdate: () => ipcRenderer.invoke('dismiss-update'),
  openDownloadUrl: () => ipcRenderer.invoke('open-download-url'),
  onUpdateStatus: (callback) => {
    onChannel('update-status', (_event, data) => callback(data))
  },

  // ---- Skills ----
  skillsList: () => ipcRenderer.invoke('skills:list'),
  skillsInstall: (id) => ipcRenderer.invoke('skills:install', id),
  skillsUninstall: (id) => ipcRenderer.invoke('skills:uninstall', id),
  skillsWorkspaceExtra: () => ipcRenderer.invoke('skills:workspace-extra'),
  skillsInstallUrl: (id, url, meta) => ipcRenderer.invoke('skills:install-url', id, url, meta),
  skillsInstallContent: (id, content, meta) => ipcRenderer.invoke('skills:install-content', id, content, meta),
  skillsGenerateSkillChat: () => ipcRenderer.invoke('skills:generate-skill-chat'),
  skillsEnable: (id) => ipcRenderer.invoke('skills:enable', id),
  skillsDisable: (id) => ipcRenderer.invoke('skills:disable', id),
  skillsVerify: (id) => ipcRenderer.invoke('skills:verify', id),
  skillsGetConfig: (id) => ipcRenderer.invoke('skills:get-config', id),
  skillsSaveConfig: (id, values) => ipcRenderer.invoke('skills:save-config', id, values),
  skillsReveal: (installPath) => ipcRenderer.invoke('skills:reveal', installPath),
  skillsGetInstallCommands: (id) => ipcRenderer.invoke('skills:get-install-commands', id),
  skillsRunInstallCmd: (id, command) => ipcRenderer.invoke('skills:run-install-cmd', id, command),
  skillsRecheckEligibility: (id) => ipcRenderer.invoke('skills:recheck-eligibility', id),
  skillsCheckBrew: () => ipcRenderer.invoke('skills:check-brew'),
  skillsAiInstall: (id) => ipcRenderer.invoke('skills:ai-install', id),
  skillsBgInstall: (id, steps) => ipcRenderer.invoke('skills:bg-install', id, steps),
  skillsBgQuery: (id) => ipcRenderer.invoke('skills:bg-query', id),
  onSkillsInstallProgress: (callback) => {
    const handler = (_event, data) => callback(data)
    ipcRenderer.on('skills:install-progress', handler)
    return () => ipcRenderer.removeListener('skills:install-progress', handler)
  },
  onSkillsBgProgress: (callback) => {
    const handler = (_event, data) => callback(data)
    ipcRenderer.on('skills:bg-progress', handler)
    return () => ipcRenderer.removeListener('skills:bg-progress', handler)
  },
  onNavigateToChat: (callback) => {
    const handler = (_event, data) => callback(data)
    ipcRenderer.on('navigate-to-chat', handler)
    return () => ipcRenderer.removeListener('navigate-to-chat', handler)
  },
  openExternal: (url) => ipcRenderer.invoke('open-external', url),
  setBubbleVisible: (visible) => ipcRenderer.send('set-bubble-visible', !!visible),

  // ---- Scheduled Tasks (Gateway cron) ----
  tasksList: () => ipcRenderer.invoke('tasks:list'),
  tasksStatus: () => ipcRenderer.invoke('tasks:status'),
  tasksAdd: (params) => ipcRenderer.invoke('tasks:add', params),
  tasksEdit: (id, patch) => ipcRenderer.invoke('tasks:edit', id, patch),
  tasksDelete: (id) => ipcRenderer.invoke('tasks:delete', id),
  tasksToggle: (id, enabled) => ipcRenderer.invoke('tasks:toggle', id, enabled),
  tasksRuns: (id) => ipcRenderer.invoke('tasks:runs', id),

  // ---- Fn Key (native monitor) ----
  onFnKey: (callback) => {
    const handler = () => callback()
    ipcRenderer.on('fn-key-down', handler)
    return () => ipcRenderer.removeListener('fn-key-down', handler)
  },

  // ---- Channels ----
  channelsList: () => ipcRenderer.invoke('channels:list'),
  channelsConnect: (id, config) => ipcRenderer.invoke('channels:connect', id, config),
  channelsDisconnect: (id) => ipcRenderer.invoke('channels:disconnect', id),
  channelsTest: (id, config) => ipcRenderer.invoke('channels:test', id, config),
  onChannelStatus: (callback) => {
    const handler = (_event, data) => callback(data)
    ipcRenderer.on('channel-status', handler)
    return () => ipcRenderer.removeListener('channel-status', handler)
  },
})
