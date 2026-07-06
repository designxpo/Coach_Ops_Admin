'use client'
import { useState, useEffect } from 'react'
import {
  Send, Bell, Trash2, CheckCircle, XCircle, Clock, BookOpen, Loader2,
} from 'lucide-react'
import {
  dbWatchNotifications, dbWatchTemplates,
  dbSaveTemplate, dbDeleteTemplate,
  type NotifTemplate,
} from '@/lib/db'
import { auth } from '@/lib/firebase'
import type { NotifRecord } from '@/lib/store'

const TARGETS = [
  { value: 'all',     label: 'All Users',   desc: 'Every app user',    emoji: '📢' },
  { value: 'coaches', label: 'Coaches',     desc: 'Coaches only',      emoji: '🏋️' },
  { value: 'clients', label: 'Clients',     desc: 'Clients only',      emoji: '👤' },
]

function timeAgo(ms: number) {
  const diff = Date.now() - ms
  const m = Math.floor(diff / 60000)
  const h = Math.floor(diff / 3600000)
  const d = Math.floor(diff / 86400000)
  if (m < 2)  return 'Just now'
  if (h < 1)  return `${m}m ago`
  if (d < 1)  return `${h}h ago`
  return `${d}d ago`
}

export default function NotificationsPage() {
  const [title,     setTitle]     = useState('')
  const [body,      setBody]      = useState('')
  const [target,    setTarget]    = useState('all')
  const [sending,   setSending]   = useState(false)
  const [savingTpl, setSavingTpl] = useState(false)
  const [result,    setResult]    = useState<{ ok: boolean; msg: string } | null>(null)
  const [history,   setHistory]   = useState<NotifRecord[]>([])
  const [templates, setTemplates] = useState<NotifTemplate[]>([])

  useEffect(() => {
    const u1 = dbWatchNotifications(setHistory)
    const u2 = dbWatchTemplates(setTemplates)
    return () => { u1(); u2() }
  }, [])

  const canSend = title.trim().length > 0 && body.trim().length > 0

  const send = async () => {
    if (!canSend) return
    setSending(true)
    setResult(null)
    try {
      const idToken = await auth.currentUser?.getIdToken()
      if (!idToken) throw new Error('Not signed in — please log in again')
      const res  = await fetch('/api/send-notification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`,
        },
        body: JSON.stringify({ title: title.trim(), body: body.trim(), target }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Request failed')
      setResult({ ok: true, msg: `Accepted by FCM for ${data.delivered} of ${data.total} device${data.total !== 1 ? 's' : ''}` })
      setTitle('')
      setBody('')
    } catch (e: any) {
      setResult({ ok: false, msg: e.message ?? 'Something went wrong' })
    } finally {
      setSending(false)
    }
  }

  const saveAsTemplate = async () => {
    if (!canSend) return
    setSavingTpl(true)
    await dbSaveTemplate({ title: title.trim(), body: body.trim(), createdAt: Date.now() })
    setSavingTpl(false)
  }

  const loadTemplate = (t: NotifTemplate) => {
    setTitle(t.title)
    setBody(t.body)
    setResult(null)
  }

  return (
    <div className="p-8 max-w-5xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-black text-white">Push Notifications</h1>
        <p className="text-cyber-muted text-sm mt-1">
          Send real-time push notifications to app users via Firebase Cloud Messaging
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

        {/* ── Compose ── */}
        <div className="xl:col-span-2 space-y-4">
          <div className="bg-cyber-card rounded-2xl border border-white/5 p-6 space-y-5">
            <h2 className="text-xs font-black text-cyber-muted uppercase tracking-widest">Compose</h2>

            {/* Target */}
            <div>
              <p className="text-xs text-cyber-muted mb-2">Audience</p>
              <div className="grid grid-cols-3 gap-2">
                {TARGETS.map(t => (
                  <button
                    key={t.value}
                    onClick={() => setTarget(t.value)}
                    className={`flex flex-col items-center gap-1 p-3 rounded-xl border text-center transition-all ${
                      target === t.value
                        ? 'bg-cyber-purple/20 border-cyber-purple text-white'
                        : 'border-white/10 text-cyber-muted hover:border-white/20 hover:text-white'
                    }`}
                  >
                    <span className="text-2xl">{t.emoji}</span>
                    <span className="text-xs font-bold">{t.label}</span>
                    <span className="text-[10px] opacity-60 leading-tight">{t.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Title */}
            <div>
              <div className="flex justify-between mb-1">
                <label className="text-xs text-cyber-muted">Title</label>
                <span className="text-[10px] text-cyber-muted">{title.length}/100</span>
              </div>
              <input
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="e.g. New workout plan ready! 🏋️"
                maxLength={100}
                className="w-full bg-cyber-bg border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-cyber-muted focus:outline-none focus:border-cyber-purple transition-colors"
              />
            </div>

            {/* Body */}
            <div>
              <div className="flex justify-between mb-1">
                <label className="text-xs text-cyber-muted">Message</label>
                <span className="text-[10px] text-cyber-muted">{body.length}/500</span>
              </div>
              <textarea
                value={body}
                onChange={e => setBody(e.target.value)}
                placeholder="e.g. Your coach has added a new HIIT circuit. Check it out in the Fitness Hub!"
                maxLength={500}
                rows={4}
                className="w-full bg-cyber-bg border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-cyber-muted focus:outline-none focus:border-cyber-purple resize-none transition-colors"
              />
            </div>

            {/* Result banner */}
            {result && (
              <div className={`flex items-center gap-2.5 px-4 py-3 rounded-xl text-sm font-medium border ${
                result.ok
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                  : 'bg-red-500/10 border-red-500/30 text-red-400'
              }`}>
                {result.ok
                  ? <CheckCircle className="w-4 h-4 flex-shrink-0" />
                  : <XCircle     className="w-4 h-4 flex-shrink-0" />}
                {result.msg}
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={saveAsTemplate}
                disabled={savingTpl || !canSend}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-semibold border border-white/10 text-cyber-muted hover:text-white hover:border-white/20 disabled:opacity-40 transition-all"
              >
                {savingTpl ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <BookOpen className="w-3.5 h-3.5" />}
                Save Template
              </button>
              <button
                onClick={send}
                disabled={sending || !canSend}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-black bg-cyber-purple text-white hover:bg-cyber-purple/80 disabled:opacity-40 transition-all"
              >
                {sending
                  ? <><Loader2 className="w-4 h-4 animate-spin" /> Sending…</>
                  : <><Send    className="w-4 h-4" />               Send Notification</>}
              </button>
            </div>
          </div>
        </div>

        {/* ── Templates ── */}
        <div>
          <div className="bg-cyber-card rounded-2xl border border-white/5 p-5">
            <h2 className="text-xs font-black text-cyber-muted uppercase tracking-widest mb-4">Templates</h2>
            {templates.length === 0 ? (
              <div className="text-center py-8">
                <BookOpen className="w-8 h-8 text-cyber-muted mx-auto mb-2 opacity-50" />
                <p className="text-xs text-cyber-muted leading-relaxed">
                  No templates saved yet.<br />Write a message and click<br />
                  <span className="text-white font-semibold">Save Template</span>.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {templates.map(t => (
                  <div
                    key={t.id}
                    onClick={() => loadTemplate(t)}
                    className="group flex items-start gap-2 p-3 rounded-xl bg-cyber-bg hover:bg-white/5 cursor-pointer transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-bold text-white truncate">{t.title}</div>
                      <div className="text-[10px] text-cyber-muted mt-0.5 line-clamp-2">{t.body}</div>
                    </div>
                    <button
                      onClick={e => { e.stopPropagation(); dbDeleteTemplate(t.id) }}
                      className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-300 flex-shrink-0 transition-all mt-0.5"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Sent History ── */}
      <div className="mt-6 bg-cyber-card rounded-2xl border border-white/5 p-6">
        <h2 className="text-xs font-black text-cyber-muted uppercase tracking-widest mb-5">Sent History</h2>
        {history.length === 0 ? (
          <div className="text-center py-10">
            <Clock className="w-10 h-10 text-cyber-muted mx-auto mb-3 opacity-40" />
            <p className="text-sm text-cyber-muted">No notifications sent yet</p>
          </div>
        ) : (
          <div className="space-y-2">
            {history.map(n => (
              <div key={n.id} className="flex items-start gap-3 px-4 py-3.5 rounded-xl bg-cyber-bg">
                <Bell className="w-4 h-4 text-cyber-purple flex-shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-bold text-white">{n.title}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyber-purple/20 text-cyber-purple font-semibold capitalize">
                      {n.target}
                    </span>
                  </div>
                  <p className="text-xs text-cyber-muted mt-0.5 truncate">{n.body}</p>
                </div>
                <div className="text-right flex-shrink-0 space-y-0.5">
                  <div className="text-xs font-bold text-emerald-400">
                    {n.delivered ?? '?'}/{n.total ?? '?'} delivered
                  </div>
                  <div className="text-[10px] text-cyber-muted">{timeAgo(n.sentAt)}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
