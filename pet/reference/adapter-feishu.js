/**
 * Feishu (Lark) Adapter
 *
 * Uses Feishu WebSocket Event API v2 — no public URL / webhook required.
 * Configuration: appId + appSecret
 *
 * Flow:
 *   1. POST /open-apis/auth/v3/app_access_token/internal → app_access_token
 *   2. POST /open-apis/event/v1/app_ticket/resend (if needed)
 *   3. POST /open-apis/event/v1/websocket → get endpoint URL + ticket
 *   4. Connect WebSocket with endpoint URL
 *   5. Listen for im.message.receive_v1 events
 *   6. Reply via POST /open-apis/im/v1/messages/:messageId/reply
 */

const { EventEmitter } = require('events')
const WebSocket = require('ws')

const FEISHU_BASE  = 'https://open.feishu.cn'
const TOKEN_TTL_MS = 100 * 60 * 1000  // refresh before 110-min expiry

class FeishuAdapter extends EventEmitter {
  constructor() {
    super()
    this.appId     = ''
    this.appSecret = ''
    this.running   = false
    this._ws       = null
    this._token    = null
    this._tokenExpireAt = 0
    this._tokenTimer    = null
    this._reconnectTimer = null
    this._reconnectAttempts = 0
    this.stats = { messageCount: 0, lastActivityAt: null }
  }

  async start(config) {
    this.appId     = config.appId?.trim() || ''
    this.appSecret = config.appSecret?.trim() || ''
    if (!this.appId || !this.appSecret)
      throw new Error('appId and appSecret are required')

    this.running = true
    this._reconnectAttempts = 0
    await this._connect()
    return { appId: this.appId }
  }

  stop() {
    this.running = false
    if (this._reconnectTimer) { clearTimeout(this._reconnectTimer); this._reconnectTimer = null }
    if (this._tokenTimer)     { clearTimeout(this._tokenTimer);     this._tokenTimer = null }
    if (this._ws) { try { this._ws.terminate() } catch {}; this._ws = null }
  }

  async sendReply(messageId, text) {
    if (!this.running) return
    try {
      const token = await this._getToken()
      await fetch(`${FEISHU_BASE}/open-apis/im/v1/messages/${messageId}/reply`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json; charset=utf-8',
        },
        body: JSON.stringify({
          content: JSON.stringify({ text }),
          msg_type: 'text',
        }),
        signal: AbortSignal.timeout(15000),
      })
    } catch (e) {
      console.warn('[FeishuAdapter] sendReply error:', e.message)
    }
  }

  // The channel manager calls this to reply. chatId here = messageId for reply.
  async sendMessage(messageId, text) {
    await this.sendReply(messageId, text)
  }

  // ─── Internal ──────────────────────────────────────

  async _getToken() {
    if (this._token && Date.now() < this._tokenExpireAt) return this._token

    const res = await fetch(`${FEISHU_BASE}/open-apis/auth/v3/app_access_token/internal`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      body: JSON.stringify({ app_id: this.appId, app_secret: this.appSecret }),
      signal: AbortSignal.timeout(15000),
    })
    const data = await res.json()
    if (data.code !== 0) throw new Error(data.msg || `Token error code ${data.code}`)

    this._token = data.app_access_token
    const ttlSec = data.expire || 7200
    this._tokenExpireAt = Date.now() + (ttlSec - 300) * 1000

    // Schedule proactive refresh
    if (this._tokenTimer) clearTimeout(this._tokenTimer)
    this._tokenTimer = setTimeout(() => {
      this._tokenTimer = null
      this._getToken().catch(() => {})
    }, TOKEN_TTL_MS)

    return this._token
  }

  async _connect() {
    if (!this.running) return
    try {
      const token    = await this._getToken()
      const endpoint = await this._getWsEndpoint(token)
      this._openWs(endpoint)
    } catch (e) {
      console.warn('[FeishuAdapter] connect error:', e.message)
      this._scheduleReconnect()
    }
  }

  async _getWsEndpoint(token) {
    const res = await fetch(`${FEISHU_BASE}/open-apis/event/v1/websocket`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json; charset=utf-8',
      },
      body: JSON.stringify({ client: 'petclaw' }),
      signal: AbortSignal.timeout(15000),
    })
    const data = await res.json()
    if (data.code !== 0) throw new Error(data.msg || `WS endpoint error ${data.code}`)
    return data.data.url || data.data.endpoint_url
  }

  _openWs(url) {
    if (!this.running) return
    try { if (this._ws) { this._ws.removeAllListeners(); this._ws.terminate() } } catch {}

    this._ws = new WebSocket(url)

    this._ws.on('open', () => {
      console.log('[FeishuAdapter] WebSocket connected')
      this._reconnectAttempts = 0
    })

    this._ws.on('message', (raw) => {
      try {
        const frame = JSON.parse(raw.toString())
        this._handleFrame(frame)
      } catch {}
    })

    this._ws.on('close', () => {
      if (!this.running) return
      console.warn('[FeishuAdapter] WebSocket closed, reconnecting...')
      this._scheduleReconnect()
    })

    this._ws.on('error', (err) => {
      console.warn('[FeishuAdapter] WebSocket error:', err.message)
    })
  }

  _handleFrame(frame) {
    // Feishu WS frames: { type, data, header }
    const { type, data } = frame

    // Heartbeat / handshake
    if (type === 'handshake' || type === 'heartbeat') return

    if (type === 'event') {
      try {
        const event = typeof data === 'string' ? JSON.parse(data) : data
        const header = event.header || {}
        if (header.event_type === 'im.message.receive_v1') {
          this._handleMessageEvent(event)
        }
      } catch {}
    }
  }

  _handleMessageEvent(event) {
    const body = event.event || {}
    const msg  = body.message || {}

    if (msg.message_type !== 'text') return  // only handle text messages

    let text = ''
    try {
      const content = JSON.parse(msg.content || '{}')
      text = content.text || ''
    } catch { return }

    text = text.trim()
    if (!text) return

    const messageId = msg.message_id
    const chatId    = msg.chat_id
    const senderId  = body.sender?.sender_id?.open_id || chatId

    this.stats.messageCount++
    this.stats.lastActivityAt = Date.now()

    this.emit('message', {
      channelId:  'feishu',
      sessionKey: `feishu-${chatId || senderId}`,
      chatId:     messageId,   // used for reply
      text,
      from:       senderId,
      raw:        event,
    })
  }

  _scheduleReconnect() {
    if (!this.running || this._reconnectTimer) return
    const delay = Math.min(2000 * Math.pow(2, this._reconnectAttempts), 30000)
    this._reconnectAttempts++
    this._reconnectTimer = setTimeout(() => {
      this._reconnectTimer = null
      this._connect()
    }, delay)
  }
}

module.exports = FeishuAdapter
