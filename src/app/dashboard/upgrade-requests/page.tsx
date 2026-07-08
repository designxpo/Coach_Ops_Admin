'use client'
import { useEffect, useState } from 'react'
import {
  ArrowUpCircle, Check, Phone, Trash2, RefreshCw, Clock, CheckCircle2, XCircle, PhoneCall,
} from 'lucide-react'
import {
  dbWatchUpgradeRequests, dbApproveUpgrade, dbSetUpgradeStatus, dbDeleteUpgradeRequest,
  type UpgradeRequest, type UpgradeStatus,
} from '@/lib/db'

function timeAgo(ms: number): string {
  if (!ms) return '—'
  const diff = Date.now() - ms
  const mins = Math.floor(diff / 60000), hours = Math.floor(diff / 3600000), days = Math.floor(diff / 86400000)
  if (mins < 2) return 'Just now'
  if (hours < 1) return `${mins}m ago`
  if (days < 1) return `${hours}h ago`
  return `${days}d ago`
}

const TIER_LABEL: Record<string, string> = {
  STARTER: 'Starter', PRO: 'Pro', BUSINESS: 'Business', MEMBER_PREMIUM: 'Member Premium',
}
const TIER_CLS: Record<string, string> = {
  STARTER: 'bg-white/10 text-cyber-muted',
  PRO: 'bg-cyber-purple/20 text-cyber-purple',
  BUSINESS: 'bg-amber-500/20 text-amber-400',
  MEMBER_PREMIUM: 'bg-emerald-400/15 text-emerald-400',
}
const STATUS_META: Record<UpgradeStatus, { label: string; cls: string }> = {
  PENDING:   { label: 'Pending',   cls: 'bg-amber-500/15 text-amber-400' },
  CONTACTED: { label: 'Contacted', cls: 'bg-cyber-purple/15 text-cyber-purple' },
  ACTIVATED: { label: 'Activated', cls: 'bg-emerald-500/15 text-emerald-400' },
  DECLINED:  { label: 'Declined',  cls: 'bg-cyber-danger/15 text-cyber-danger' },
}

export default function UpgradeRequestsPage() {
  const [reqs,     setReqs]     = useState<UpgradeRequest[]>([])
  const [loading,  setLoading]  = useState(true)
  const [filter,   setFilter]   = useState<'all' | UpgradeStatus>('all')
  const [busy,     setBusy]     = useState<string | null>(null)
  const [lastSync, setLastSync] = useState(Date.now())

  useEffect(() => {
    const unsub = dbWatchUpgradeRequests(list => {
      setReqs(list); setLoading(false); setLastSync(Date.now())
    })
    return unsub
  }, [])

  const pending   = reqs.filter(r => r.status === 'PENDING').length
  const activated = reqs.filter(r => r.status === 'ACTIVATED').length
  const filtered  = filter === 'all' ? reqs : reqs.filter(r => r.status === filter)

  async function approve(r: UpgradeRequest) {
    if (!confirm(`Activate ${TIER_LABEL[r.requestedTier] ?? r.requestedTier} for ${r.name || r.email}? Their app unlocks within seconds.`)) return
    setBusy(r.id)
    try { await dbApproveUpgrade(r) } finally { setBusy(null) }
  }
  async function setStatus(id: string, status: UpgradeStatus) {
    setBusy(id); try { await dbSetUpgradeStatus(id, status) } finally { setBusy(null) }
  }
  async function remove(id: string) {
    if (!confirm('Delete this request permanently?')) return
    setBusy(id); try { await dbDeleteUpgradeRequest(id) } finally { setBusy(null) }
  }

  return (
    <div className="p-8 max-w-5xl">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2">
            <ArrowUpCircle className="w-6 h-6 text-cyber-accent" />
            Upgrade Requests
          </h1>
          <p className="text-cyber-muted text-sm mt-1">Coaches &amp; members asking to upgrade — approve to unlock their plan in the app instantly</p>
        </div>
        <div className="flex items-center gap-2 text-xs text-cyber-muted">
          <RefreshCw className="w-3 h-3" /><span>Live · {timeAgo(lastSync)}</span>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: 'Pending',   value: pending,     icon: Clock,        color: 'text-amber-400' },
          { label: 'Activated', value: activated,   icon: CheckCircle2, color: 'text-emerald-400' },
          { label: 'Total',     value: reqs.length, icon: ArrowUpCircle, color: 'text-cyber-purple' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-cyber-card rounded-2xl p-5 border border-white/5">
            <div className="flex items-center gap-2 mb-2">
              <Icon className={`w-4 h-4 ${color}`} />
              <span className="text-xs font-semibold text-cyber-muted">{label}</span>
            </div>
            <div className="text-2xl font-black text-white">{loading ? '—' : value}</div>
          </div>
        ))}
      </div>

      {/* Filter */}
      <div className="flex gap-2 mb-4">
        {(['all', 'PENDING', 'CONTACTED', 'ACTIVATED', 'DECLINED'] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              filter === f ? 'bg-cyber-purple text-white' : 'bg-white/5 text-cyber-muted hover:text-white'
            }`}>
            {f === 'all' ? `All (${reqs.length})` : STATUS_META[f].label}
          </button>
        ))}
      </div>

      {/* List */}
      {loading ? (
        <div className="flex items-center justify-center h-40">
          <div className="w-6 h-6 border-2 border-cyber-purple border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-cyber-card rounded-2xl p-12 border border-white/5 text-center">
          <ArrowUpCircle className="w-8 h-8 text-cyber-muted mx-auto mb-3 opacity-30" />
          <div className="text-white font-bold">No requests here</div>
          <div className="text-cyber-muted text-sm mt-1">
            {filter === 'all' ? 'When a user taps “Request Upgrade” in the app, it appears here instantly.' : 'Nothing with this status.'}
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(r => (
            <div key={r.id} className="bg-cyber-card rounded-2xl border border-white/5 p-5">
              <div className="flex items-start gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="text-sm font-bold text-white truncate">{r.name || r.email || r.uid.slice(0, 8)}</span>
                    <span className={`px-2 py-0.5 rounded-lg text-[11px] font-bold ${STATUS_META[r.status]?.cls ?? STATUS_META.PENDING.cls}`}>
                      {STATUS_META[r.status]?.label ?? r.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs mb-2">
                    <span className={`px-2 py-0.5 rounded-full font-bold ${TIER_CLS[r.currentPlan] ?? 'bg-white/10 text-cyber-muted'}`}>
                      {TIER_LABEL[r.currentPlan] ?? r.currentPlan}
                    </span>
                    <span className="text-cyber-muted">→</span>
                    <span className={`px-2 py-0.5 rounded-full font-bold ${TIER_CLS[r.requestedTier] ?? 'bg-white/10 text-cyber-muted'}`}>
                      {TIER_LABEL[r.requestedTier] ?? r.requestedTier}
                    </span>
                    <span className="text-cyber-muted">· {timeAgo(r.requestedAt)}</span>
                  </div>
                  <div className="flex flex-wrap gap-x-5 gap-y-1 text-xs text-cyber-muted">
                    {r.email && <span>{r.email}</span>}
                    {r.phone && <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{r.phone}</span>}
                    <span className="font-mono opacity-60">{r.uid.slice(0, 10)}…</span>
                  </div>
                  {r.note && <div className="text-xs text-cyber-muted mt-2 bg-white/3 rounded-lg px-3 py-2 border border-white/5">“{r.note}”</div>}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 mt-4 pt-4 border-t border-white/5">
                {r.status !== 'ACTIVATED' && (
                  <button onClick={() => approve(r)} disabled={busy === r.id}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/15 text-emerald-400 text-xs font-bold hover:bg-emerald-500/25 transition-all disabled:opacity-40">
                    <Check className="w-3.5 h-3.5" /> Approve &amp; activate
                  </button>
                )}
                {r.phone && (
                  <a href={`https://wa.me/${r.phone.replace(/[^0-9]/g, '')}`} target="_blank" rel="noreferrer"
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 text-cyber-muted text-xs font-bold hover:text-white transition-all">
                    <PhoneCall className="w-3.5 h-3.5" /> WhatsApp
                  </a>
                )}
                {r.status === 'PENDING' && (
                  <button onClick={() => setStatus(r.id, 'CONTACTED')} disabled={busy === r.id}
                    className="px-3 py-1.5 rounded-lg bg-white/5 text-cyber-muted text-xs font-bold hover:text-white transition-all disabled:opacity-40">
                    Mark contacted
                  </button>
                )}
                {r.status !== 'DECLINED' && r.status !== 'ACTIVATED' && (
                  <button onClick={() => setStatus(r.id, 'DECLINED')} disabled={busy === r.id}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 text-cyber-muted text-xs font-bold hover:text-cyber-danger transition-all disabled:opacity-40">
                    <XCircle className="w-3.5 h-3.5" /> Decline
                  </button>
                )}
                <div className="flex-1" />
                <button onClick={() => remove(r.id)} disabled={busy === r.id}
                  className="p-2 rounded-lg text-cyber-muted hover:text-cyber-danger hover:bg-cyber-danger/10 transition-all disabled:opacity-40">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
