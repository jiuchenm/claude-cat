/**
 * Telegram Bot Adapter
 *
 * Uses long-polling (getUpdates) — no server / public URL required.
 * Only configuration needed: botToken.
 */

const { EventEmitter } = require('events')

const POLL_INTERVAL_MS = 2000
const POLL_TIMEOUT_S   = 25   // Telegram server-side long-poll timeout

class TelegramAdapter extends EventEmitter {
  constructor() {
    super()
    this.botToken    = ''
    this.offset      = 0
    this.running     = false
    this._timer      = null
    this._abortCtrl  = null
    this.stats = { messageCount: 0, lastActivityAt: null }
  }

  get baseUrl() {
    return `https://api.telegram.org/bot${this.botToken}`
  }

  async start(config) {
    this.botToken = config.botToken?.trim() || ''
    if (!this.botToken) throw new Error('botToken is required')

    // Validate token by fetching bot info
    const me = await this._request('getMe')
    if (!me.ok) throw new Error(me.description || 'Invalid bot token')

    this.running = true
    this.offset  = 0
    this._poll()
    return { username: me.result.username, firstName: me.result.first_name }
  }

  stop() {
    this.running = false
    if (this._abortCtrl) { this._abortCtrl.abort(); this._abortCtrl = null }
    if (this._timer) { clearTimeout(this._timer); this._timer = null }
  }

  async sendMessage(chatId, text) {
    if (!this.running) return
    try {
      await this._request('sendMessage', {
        chat_id: chatId,
        text,
        parse_mode: 'Markdown',
      })
    } catch (e) {
      // Fallback without Markdown in case of parse error
      try {
        await this._request('sendMessage', { chat_id: chatId, text })
      } catch {}
    }
  }

  async sendTyping(chatId) {
    try { await this._request('sendChatAction', { chat_id: chatId, action: 'typing' }) } catch {}
  }

  // ─── Internal ──────────────────────────────────────

  _poll() {
    if (!this.running) return

    this._abortCtrl = new AbortController()
    const signal = this._abortCtrl.signal

    const url = `${this.baseUrl}/getUpdates?offset=${this.offset}&timeout=${POLL_TIMEOUT_S}&allowed_updates=["message"]`
    const fetchSignal = typeof AbortSignal.any === 'function'
      ? AbortSignal.any([signal, AbortSignal.timeout((POLL_TIMEOUT_S + 5) * 1000)])
      : signal

    fetch(url, { signal: fetchSignal })
      .then(r => r.json())
      .then(data => {
        if (!this.running) return
        if (data.ok && Array.isArray(data.result)) {
          for (const update of data.result) {
            this.offset = update.update_id + 1
            this._handleUpdate(update)
          }
        }
        this._scheduleNextPoll(0)
      })
      .catch(err => {
        if (!this.running) return
        if (err.name !== 'AbortError') {
          console.warn('[TelegramAdapter] poll error:', err.message)
          this._scheduleNextPoll(POLL_INTERVAL_MS)
        }
      })
  }

  _scheduleNextPoll(delayMs) {
    if (!this.running) return
    this._timer = setTimeout(() => { this._timer = null; this._poll() }, delayMs)
  }

  _handleUpdate(update) {
    const msg = update.message
    if (!msg || !msg.text) return

    const chatId  = msg.chat.id
    const text    = msg.text
    const from    = msg.from?.username || msg.from?.first_name || String(chatId)

    this.stats.messageCount++
    this.stats.lastActivityAt = Date.now()

    this.emit('message', {
      channelId:  'telegram',
      sessionKey: `telegram-${chatId}`,
      chatId,
      text,
      from,
      raw: msg,
    })
  }

  async _request(method, params = {}) {
    const url  = `${this.baseUrl}/${method}`
    const body = Object.keys(params).length ? JSON.stringify(params) : undefined
    const res  = await fetch(url, {
      method:  body ? 'POST' : 'GET',
      headers: body ? { 'Content-Type': 'application/json' } : undefined,
      body,
      signal: AbortSignal.timeout(15000),
    })
    return res.json()
  }
}

module.exports = TelegramAdapter
