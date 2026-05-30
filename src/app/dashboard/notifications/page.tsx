'use client'
import { useEffect, useState } from 'react'
import { Send, Check, Clock, Bookmark, Trash2, Plus } from 'lucide-react'
import {
  dbAddNotification, dbWatchNotifications,
  dbSaveTemplate, dbDeleteTemplate, dbWatchTemplates,
  type NotifTemplate,
} from '@/lib/db'
import type { NotifRecord } from '@/lib/store'

const TARGETS = ['All Coaches', 'Pro+ Only', 'Business Only']

export default function NotificationsPage() {
  const [title,     setTitle]     = useState('')
  const [body,      setBody]      = useState('')
  const [target,    setTarget]    = useState('All Coaches')
  const [sending,   setSending]   = useState(false)
  const [sent,      setSent]      = useState(false)
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
    await dbAddNotification({ title, body, target, sentAt: Date.now() })
    setSending(false); setSent(true)
    setTimeout(() => setSent(false), 2500)
    setTitle(''); setBody('')
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
    setTitle(t.title); setBody(t.body); setSent(false)
  }

  return (
    <div className="p-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-2xl font-black text-white">Push Notifications</h1>
        <p className="text-cyber-muted text-sm mt-1">
          Compose and send notifications. Save as templates for quick reuse.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Compose */}
        <div className="bg-cyber-card rounded-2xl p-6 border border-white/5 space-y-4">
          <h2 className="font-bold text-white">Compose</h2>
          <div>
            <label className="text-xs font-semibold text-cyber-muted uppercase tracking-wider mb-2 block">Target</label>
            <div className="flex gap-2 flex-wrap">
              {TARGETS.map(t => (
                <button key={t} onClick={() => setTarget(t)}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                    target === t ? 'bg-cyber-purple text-white' : 'bg-cyber-elevated text-cyber-muted hover:text-white'
                  }`}>{t}</button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-cyber-muted uppercase tracking-wider mb-2 block">Title</label>
            <input value={title} onChange={e => { setTitle(e.target.value); setSent(false) }}
              placeholder="Notification title"
              className="w-full bg-cyber-elevated border border-white/10 rounded-xl px-4 py-3 text-white placeholder-cyber-muted focus:outline-none focus:border-cyber-purple/50 text-sm"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-cyber-muted uppercase tracking-wider mb-2 block">Message</label>
            <textarea value={body} onChange={e => { setBody(e.target.value); setSent(false) }}
              placeholder="Notification message…" rows={4}
              className="w-full bg-cyber-elevated border border-white/10 rounded-xl px-4 py-3 text-white placeholder-cyber-muted focus:outline-none focus:border-cyber-purple/50 text-sm resize-none"
            />
          </div>
          <div className="flex gap-2">
            <button onClick={send} disabled={!title.trim() || !body.trim() || sending}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed ${
                sent ? 'bg-emerald-500 text-black' : 'bg-cyber-purple hover:bg-cyber-purple/90 text-white'
              }`}
            >
              {sent ? <><Check className="w-4 h-4" /> Queued!</>
                : sending ? 'Sending…'
                : <><Send className="w-4 h-4" /> Send</>}
            </button>
            <button onClick={saveTemplate} disabled={!title.trim() || !body.trim() || saving}
              title="Save as template"
              className="px-4 py-3 rounded-xl font-bold text-sm bg-cyber-elevated hover:bg-white/10 text-cyber-muted hover:text-white transition-all disabled:opacity-40"
            >
              {saving ? <span className="w-4 h-4 border border-current border-t-transparent rounded-full animate-spin block" />
                      : <Bookmark className="w-4 h-4" />}
            </button>
          </div>
          {!sent && title.trim() && body.trim() && (
            <p className="text-xs text-cyber-muted">
              Click <Bookmark className="w-3 h-3 inline" /> to save as a reusable template
            </p>
          )}
        </div>

        {/* Templates + Recent Log */}
        <div className="space-y-4">
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
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {templates.map(t => (
                  <div key={t.id}
                    className="flex items-start gap-2 bg-cyber-elevated hover:bg-white/5 rounded-xl px-3 py-2.5 transition-all group">
                    <button onClick={() => loadTemplate(t)} className="flex-1 text-left min-w-0">
                      <div className="text-sm font-semibold text-white truncate">{t.title}</div>
                      <div className="text-xs text-cyber-muted mt-0.5 line-clamp-1">{t.body}</div>
                    </button>
                    <button onClick={() => deleteTemplate(t.id)}
                      disabled={deleting === t.id}
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
              <div className="space-y-2">
                {log.slice(0, 5).map(n => (
                  <div key={n.id} className="flex items-start gap-3">
                    <Clock className="w-3.5 h-3.5 text-cyber-muted mt-0.5 flex-shrink-0" />
                    <div className="min-w-0">
                      <div className="text-xs font-semibold text-white truncate">{n.title}</div>
                      <div className="text-xs text-cyber-muted">{n.target} · {new Date(n.sentAt).toLocaleString()}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
