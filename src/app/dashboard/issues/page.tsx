'use client'
import { useEffect, useState } from 'react'
import { Bug, Trash2, RefreshCw, AlertCircle, Wrench, CheckCircle2, ChevronDown, ChevronUp, Smartphone } from 'lucide-react'
import { dbWatchIssueReports, dbSetIssueStatus, dbDeleteIssueReport, type IssueReport, type IssueStatus } from '@/lib/db'

function timeAgo(ms: number): string {
  if (!ms) return '—'
  const diff = Date.now() - ms
  const mins  = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days  = Math.floor(diff / 86400000)
  if (mins  < 2)  return 'Just now'
  if (hours < 1)  return `${mins}m ago`
  if (days  < 1)  return `${hours}h ago`
  return `${days}d ago`
}

function formatDate(ms: number): string {
  if (!ms) return '—'
  return new Date(ms).toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

const STATUS_META: Record<IssueStatus, { label: string; cls: string }> = {
  OPEN:        { label: 'Open',        cls: 'bg-cyber-danger/15 text-cyber-danger' },
  IN_PROGRESS: { label: 'In progress', cls: 'bg-yellow-500/15 text-yellow-400' },
  RESOLVED:    { label: 'Resolved',    cls: 'bg-emerald-500/15 text-emerald-400' },
}

export default function IssuesPage() {
  const [reports,  setReports]  = useState<IssueReport[]>([])
  const [loading,  setLoading]  = useState(true)
  const [filter,   setFilter]   = useState<'all' | IssueStatus>('all')
  const [expanded, setExpanded] = useState<string | null>(null)
  const [busy,     setBusy]     = useState<string | null>(null)
  const [lastSync, setLastSync] = useState(Date.now())

  useEffect(() => {
    const unsub = dbWatchIssueReports(list => {
      setReports(list)
      setLoading(false)
      setLastSync(Date.now())
    })
    return unsub
  }, [])

  const filtered = filter === 'all' ? reports : reports.filter(r => r.status === filter)
  const open = reports.filter(r => r.status === 'OPEN').length
  const inProgress = reports.filter(r => r.status === 'IN_PROGRESS').length
  const resolved = reports.filter(r => r.status === 'RESOLVED').length

  async function setStatus(id: string, status: IssueStatus) {
    setBusy(id)
    try { await dbSetIssueStatus(id, status) }
    finally { setBusy(null) }
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this report permanently?')) return
    setBusy(id)
    try { await dbDeleteIssueReport(id) }
    finally { setBusy(null) }
  }

  return (
    <div className="p-8 max-w-6xl">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2">
            <Bug className="w-6 h-6 text-cyber-accent" />
            Issue Reports
          </h1>
          <p className="text-cyber-muted text-sm mt-1">Problems reported by users directly from the app — crash logs attached automatically</p>
        </div>
        <div className="flex items-center gap-2 text-xs text-cyber-muted">
          <RefreshCw className="w-3 h-3" />
          <span>Live · {timeAgo(lastSync)}</span>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: 'Open',        value: open,        icon: AlertCircle,  color: 'text-cyber-danger' },
          { label: 'In progress', value: inProgress,  icon: Wrench,       color: 'text-yellow-400' },
          { label: 'Resolved',    value: resolved,    icon: CheckCircle2, color: 'text-emerald-400' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-cyber-card rounded-2xl p-5 border border-white/5">
            <div className="flex items-center gap-2 mb-2">
              <Icon className={`w-4 h-4 ${color}`} />
              <span className="text-xs font-semibold text-cyber-muted">{label}</span>
            </div>
            <div className="text-2xl font-black text-white">{value}</div>
          </div>
        ))}
      </div>

      {/* Filter */}
      <div className="flex gap-2 mb-4">
        {(['all', 'OPEN', 'IN_PROGRESS', 'RESOLVED'] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              filter === f ? 'bg-cyber-purple text-white' : 'bg-white/5 text-cyber-muted hover:text-white'
            }`}>
            {f === 'all' ? `All (${reports.length})` : STATUS_META[f].label}
          </button>
        ))}
      </div>

      {/* List */}
      {loading ? (
        <div className="text-cyber-muted text-sm py-12 text-center">Loading…</div>
      ) : filtered.length === 0 ? (
        <div className="bg-cyber-card rounded-2xl p-12 border border-white/5 text-center">
          <Bug className="w-8 h-8 text-cyber-muted mx-auto mb-3" />
          <div className="text-white font-bold">No reports here</div>
          <div className="text-cyber-muted text-sm mt-1">
            {filter === 'all' ? 'When users report a problem from the app, it appears here instantly.' : 'Nothing with this status.'}
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(r => {
            const isOpen = expanded === r.id
            return (
              <div key={r.id} className="bg-cyber-card rounded-2xl border border-white/5 overflow-hidden">
                <button
                  onClick={() => setExpanded(isOpen ? null : r.id)}
                  className="w-full flex items-center gap-4 p-4 text-left hover:bg-white/[0.02] transition-all"
                >
                  <span className={`px-2.5 py-1 rounded-lg text-[11px] font-bold flex-shrink-0 ${STATUS_META[r.status]?.cls ?? STATUS_META.OPEN.cls}`}>
                    {STATUS_META[r.status]?.label ?? r.status}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-white truncate">{r.category}</span>
                      {r.lastCrash && (
                        <span className="px-1.5 py-0.5 rounded bg-cyber-danger/15 text-cyber-danger text-[10px] font-bold flex-shrink-0">CRASH LOG</span>
                      )}
                    </div>
                    <div className="text-xs text-cyber-muted truncate mt-0.5">{r.message}</div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="text-xs font-semibold text-white">{r.name || r.email || r.uid.slice(0, 8)}</div>
                    <div className="text-[11px] text-cyber-muted">{r.role || '—'} · {timeAgo(r.createdAt)}</div>
                  </div>
                  {isOpen ? <ChevronUp className="w-4 h-4 text-cyber-muted flex-shrink-0" /> : <ChevronDown className="w-4 h-4 text-cyber-muted flex-shrink-0" />}
                </button>

                {isOpen && (
                  <div className="px-4 pb-4 border-t border-white/5 pt-4 space-y-4">
                    <div className="text-sm text-white whitespace-pre-wrap">{r.message}</div>

                    <div className="flex flex-wrap gap-x-6 gap-y-1 text-xs text-cyber-muted">
                      <span className="flex items-center gap-1.5"><Smartphone className="w-3 h-3" />{r.device} · {r.androidVersion}</span>
                      <span>App v{r.appVersion} (build {r.appVersionCode})</span>
                      <span>{r.email}</span>
                      <span>{formatDate(r.createdAt)}</span>
                      <span className="font-mono">{r.uid}</span>
                    </div>

                    {r.lastCrash && (
                      <details className="bg-black/40 rounded-xl p-3">
                        <summary className="text-xs font-bold text-cyber-danger cursor-pointer">Attached crash log</summary>
                        <pre className="text-[11px] text-cyber-muted mt-2 overflow-x-auto whitespace-pre-wrap max-h-64 overflow-y-auto">{r.lastCrash}</pre>
                      </details>
                    )}

                    <div className="flex items-center gap-2">
                      {r.status !== 'IN_PROGRESS' && (
                        <button onClick={() => setStatus(r.id, 'IN_PROGRESS')} disabled={busy === r.id}
                          className="px-3 py-1.5 rounded-lg bg-yellow-500/15 text-yellow-400 text-xs font-bold hover:bg-yellow-500/25 transition-all disabled:opacity-40">
                          Mark in progress
                        </button>
                      )}
                      {r.status !== 'RESOLVED' && (
                        <button onClick={() => setStatus(r.id, 'RESOLVED')} disabled={busy === r.id}
                          className="px-3 py-1.5 rounded-lg bg-emerald-500/15 text-emerald-400 text-xs font-bold hover:bg-emerald-500/25 transition-all disabled:opacity-40">
                          Mark resolved
                        </button>
                      )}
                      {r.status !== 'OPEN' && (
                        <button onClick={() => setStatus(r.id, 'OPEN')} disabled={busy === r.id}
                          className="px-3 py-1.5 rounded-lg bg-white/5 text-cyber-muted text-xs font-bold hover:text-white transition-all disabled:opacity-40">
                          Reopen
                        </button>
                      )}
                      <div className="flex-1" />
                      <button onClick={() => handleDelete(r.id)} disabled={busy === r.id}
                        className="p-2 rounded-lg text-cyber-muted hover:text-cyber-danger hover:bg-cyber-danger/10 transition-all disabled:opacity-40">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
