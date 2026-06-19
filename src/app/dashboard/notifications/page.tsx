'use client'
import { useEffect, useState } from 'react'
import { Send, Check, Clock, Bookmark, Trash2, AlertCircle, Users } from 'lucide-react'
import {
  dbAddNotification, dbWatchNotifications,
  dbSaveTemplate, dbDeleteTemplate, dbWatchTemplates,
  type NotifTemplate,
} from '@/lib/db'
import type { NotifRecord } from '@/lib/store'

const TARGETS = ['All Coaches', 'Pro+ Only', 'Business Only']

type DeliveryResult = { delivered: number; failed: number; total: number }

export default function NotificationsPage() {
  const [title,     setTitle]     = useState('')
  const [body,      setBody]      = useState('')
  const [target,    setTarget]    = useState('All Coaches')
  const [sending,   setSending]   = useState(false)
  const [result,    setResult]    = useState<DeliveryResult | null>(null)
  const [sendError, setSendError] = useState('')
  const [log,       setLog]       = useState<NotifRecord[]>([])
  const [templates, setTemplates] = useState<NotifTemplate[]>([])
  const [saving,    setSaving]    = useState(false)
  const [deleting,  setDeleting]  = useState<string | null>(null)

  useEffect(() => {
    const u1 = dbWatchNotifications(n => setLog(n))
    const u2 = dbWatchTemplates(t => setTemplates(t))
    return () => { u1(); u2() }
  }, [])

  const send = async () => {
    if (!title.trim() || !body.trim()) return
    setSending(true)
    setSendError('')
    setResult(null)

    try {
      // 1. Actually fire FCM via server API route
      const res = await fetch('/api/send-notification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: title.trim(), body: body.trim(), target }),
      })
      const data = await res.json()

      if (!res.ok) throw new Error(data.error ?? 'Send failed')

      setResult(data as DeliveryResult)

      // 2. Record in Firestore history with delivery stats
      await dbAddNotification({
        title: title.trim(),
        body: body.trim(),
        target,
        sentAt: Date.now(),
        delivered: data.delivered ?? 0,
        total: data.total ?? 0,
      })

      setTitle('')
      setBody('')
      setTimeout(() => setResult(null), 6000)
    } catch (err) {
      setSendError(err instanceof Error ? err.message : String(err))
    } finally {
      setSending(false)
    }
  }

  const saveTemplate = async () => {
    if (!title.trim() || !body.trim()) return
    setSaving(true)
    await dbSaveTemplate({ title: title.trim(), body: body.trim(), createdAt: Date.now() })
    setSaving(false)
  }

  const deleteTemplate = async (id: string) => {
    setDeleting(id)
    await dbDeleteTemplate(id)
    setDeleting(null)
  }

  const loadTemplate = (t: NotifTemplate) => {
    setTitle(t.title)
    setBody(t.body)
    setResult(null)
    setSendError('')
  }

  return (
    <div className="p-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-2xl font-black text-white">Push Notifications</h1>
        <p className="text-cyber-muted text-sm mt-1">
          Send real-time push notifications to all coaches — even when the app is closed.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ── Compose ── */}
        <div className="bg-cyber-card rounded-2xl p-6 border border-white/5 space-y-4">
          <h2 className="font-bold text-white">Compose</h2>

          {/* Target audience */}
          <div>
            <label className="text-xs font-semibold text-cyber-muted uppercase tracking-wider mb-2 block">Target Audience</label>
            <div className="flex gap-2 flex-wrap">
              {TARGETS.map(t => (
                <button key={t} onClick={() => setTarget(t)}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                    target === t ? 'bg-cyber-purple text-white' : 'bg-cyber-elevated text-cyber-muted hover:text-white'
                  }`}>{t}</button>
              ))}
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="text-xs font-semibold text-cyber-muted uppercase tracking-wider mb-2 block">Title</label>
            <input value={title} onChange={e => { setTitle(e.target.value); setResult(null); setSendError('') }}
              placeholder="Notification title"
              maxLength={65}
              className="w-full bg-cyber-elevated border border-white/10 rounded-xl px-4 py-3 text-white placeholder-cyber-muted focus:outline-none focus:border-cyber-purple/50 text-sm"
            />
            <div className="text-right text-xs text-cyber-muted mt-1">{title.length}/65</div>
          </div>

          {/* Body */}
          <div>
            <label className="text-xs font-semibold text-cyber-muted uppercase tracking-wider mb-2 block">Message</label>
            <textarea value={body} onChange={e => { setBody(e.target.value); setResult(null); setSendError('') }}
              placeholder="Notification message…" rows={4} maxLength={200}
              className="w-full bg-cyber-elevated border border-white/10 rounded-xl px-4 py-3 text-white placeholder-cyber-muted focus:outline-none focus:border-cyber-purple/50 text-sm resize-none"
            />
            <div className="text-right text-xs text-cyber-muted -mt-1">{body.length}/200</div>
          </div>

          {/* Buttons */}
          <div className="flex gap-2">
            <button onClick={send} disabled={!title.trim() || !body.trim() || sending}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed ${
                result ? 'bg-emerald-500 text-black' : 'bg-cyber-purple hover:bg-cyber-purple/90 text-white'
              }`}
            >
              {sending
                ? <><span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" /> Sending…</>
                : result
                ? <><Check className="w-4 h-4" /> Sent!</>
                : <><Send className="w-4 h-4" /> Send Push</>}
            </button>
            <button onClick={saveTemplate} disabled={!title.trim() || !body.trim() || saving}
              title="Save as template"
              className="px-4 py-3 rounded-xl font-bold text-sm bg-cyber-elevated hover:bg-white/10 text-cyber-muted hover:text-white transition-all disabled:opacity-40"
            >
              {saving
                ? <span className="w-4 h-4 border border-current border-t-transparent rounded-full animate-spin block" />
                : <Bookmark className="w-4 h-4" />}
            </button>
          </div>

          {/* Delivery result */}
          {result && (
            <div className="flex items-center gap-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl px-4 py-3">
              <Users className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <div>
                <div className="text-sm font-bold text-emerald-400">
                  Delivered to {result.delivered} / {result.total} devices
                </div>
                {result.failed > 0 && (
                  <div className="text-xs text-cyber-muted mt-0.5">{result.failed} failed (stale tokens)</div>
                )}
              </div>
            </div>
          )}

          {/* Error state */}
          {sendError && (
            <div className="flex items-start gap-3 bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3">
              <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
              <div>
                <div className="text-sm font-bold text-red-400">Send failed</div>
                <div className="text-xs text-cyber-muted mt-0.5">{sendError}</div>
                {sendError.includes('credentials') && (
                  <div className="text-xs text-cyber-muted mt-1">
                    Add FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY to .env.local
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* ── Templates + Recent Log ── */}
        <div className="space-y-4">
          {/* Preview card */}
          {(title || body) && (
            <div className="bg-cyber-elevated rounded-2xl p-4 border border-white/5">
              <div className="text-xs text-cyber-muted uppercase tracking-wider mb-2 font-semibold">Preview</div>
              <div className="bg-[#1c1c1e] rounded-xl p-3 border border-white/10">
                <div className="flex items-start gap-2">
                  <div className="w-8 h-8 rounded-xl bg-cyber-purple/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-sm">🏋️</span>
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-bold text-white">{title || 'Title'}</div>
                    <div className="text-xs text-[#aeaeb2] mt-0.5 line-clamp-2">{body || 'Message'}</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Templates */}
          <div className="bg-cyber-card rounded-2xl p-5 border border-white/5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-bold text-white text-sm">My Templates</h2>
              {templates.length > 0 && (
                <span className="text-xs text-cyber-muted">{templates.length} saved</span>
              )}
            </div>
            {templates.length === 0 ? (
              <div className="text-center py-6">
                <div className="text-cyber-muted text-xs">No templates yet</div>
                <div className="text-cyber-muted text-xs mt-1">
                  Compose a message and click <Bookmark className="w-3 h-3 inline" /> to save
                </div>
              </div>
            ) : (
              <div className="space-y-2 max-h-56 overflow-y-auto">
                {templates.map(t => (
                  <div key={t.id}
                    className="flex items-start gap-2 bg-cyber-elevated hover:bg-white/5 rounded-xl px-3 py-2.5 transition-all group">
                    <button onClick={() => loadTemplate(t)} className="flex-1 text-left min-w-0">
                      <div className="text-sm font-semibold text-white truncate">{t.title}</div>
                      <div className="text-xs text-cyber-muted mt-0.5 line-clamp-1">{t.body}</div>
                    </button>
                    <button onClick={() => deleteTemplate(t.id)} disabled={deleting === t.id}
                      className="opacity-0 group-hover:opacity-100 p-1 hover:text-cyber-danger text-cyber-muted transition-all flex-shrink-0">
                      {deleting === t.id
                        ? <span className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin block" />
                        : <Trash2 className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent log */}
          {log.length > 0 && (
            <div className="bg-cyber-card rounded-2xl p-5 border border-white/5">
              <h2 className="font-bold text-white mb-3 text-sm">Recently Sent</h2>
              <div className="space-y-2.5">
                {log.slice(0, 6).map(n => (
                  <div key={n.id} className="flex items-start gap-3">
                    <Clock className="w-3.5 h-3.5 text-cyber-muted mt-0.5 flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-semibold text-white truncate">{n.title}</div>
                      <div className="text-xs text-cyber-muted">{n.target} · {new Date(n.sentAt).toLocaleString()}</div>
                    </div>
                    {(n as any).delivered != null && (
                      <div className="text-xs text-emerald-400 font-bold flex-shrink-0">
                        {(n as any).delivered}/{(n as any).total ?? '?'}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Setup banner — shown if credentials look missing */}
      <div className="mt-6 bg-amber-500/10 border border-amber-500/20 rounded-2xl p-5">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
          <div>
            <div className="text-sm font-bold text-amber-400">One-time setup required</div>
            <div className="text-xs text-cyber-muted mt-1 space-y-1">
              <p>Push notifications require a Firebase service account key in <code className="text-amber-300">.env.local</code>:</p>
              <ol className="list-decimal list-inside space-y-0.5 text-cyber-muted mt-1">
                <li>Firebase Console → Project Settings → Service Accounts</li>
                <li>Click <strong className="text-white">Generate new private key</strong></li>
                <li>Copy the three values into <code className="text-amber-300">.env.local</code> (see .env.local.example)</li>
                <li>Restart the dev server</li>
              </ol>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
