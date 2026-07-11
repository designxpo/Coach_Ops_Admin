'use client'
import { useEffect, useState } from 'react'
import { BadgeCheck, Check, XCircle, Clock, Bot, RefreshCw } from 'lucide-react'
import { dbWatchCertReviews, dbSetCertStatus, type CertReview, type CertStatus } from '@/lib/db'

function timeAgo(ms: number): string {
  if (!ms) return '—'
  const diff = Date.now() - ms
  const mins = Math.floor(diff / 60000), hours = Math.floor(diff / 3600000), days = Math.floor(diff / 86400000)
  if (mins < 2) return 'Just now'
  if (hours < 1) return `${mins}m ago`
  if (days < 1) return `${hours}h ago`
  return `${days}d ago`
}

const STATUS_META: Record<CertStatus, { label: string; cls: string }> = {
  pending:       { label: 'Needs Review',  cls: 'bg-amber-500/15 text-amber-400' },
  verified_auto: { label: 'Auto-Verified', cls: 'bg-cyber-purple/15 text-cyber-purple' },
  verified:      { label: 'Verified',      cls: 'bg-emerald-500/15 text-emerald-400' },
  rejected:      { label: 'Rejected',      cls: 'bg-cyber-danger/15 text-cyber-danger' },
}

export default function CertReviewsPage() {
  const [reviews, setReviews] = useState<CertReview[]>([])
  const [loading, setLoading] = useState(true)
  const [filter,  setFilter]  = useState<'all' | CertStatus>('all')
  const [busy,    setBusy]    = useState<string | null>(null)
  const [lastSync, setLastSync] = useState(Date.now())

  useEffect(() => {
    const unsub = dbWatchCertReviews(list => {
      setReviews(list); setLoading(false); setLastSync(Date.now())
    })
    return unsub
  }, [])

  const needsReview = reviews.filter(r => r.status === 'pending').length
  const autoOk      = reviews.filter(r => r.status === 'verified_auto').length
  const filtered    = filter === 'all' ? reviews : reviews.filter(r => r.status === filter)

  async function decide(r: CertReview, status: 'verified' | 'rejected') {
    const verb = status === 'verified' ? 'Approve' : 'Reject'
    if (!confirm(`${verb} ${r.name}'s certificate? The badge on their live profile updates immediately.`)) return
    setBusy(r.uid)
    try { await dbSetCertStatus(r.uid, status) } finally { setBusy(null) }
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <BadgeCheck className="w-6 h-6 text-cyber-lime" /> Certificate Reviews
          </h1>
          <p className="text-cyber-muted text-sm mt-1">
            Trainer certification documents — approve to grant the ✓ Verified badge on their marketplace profile.
          </p>
        </div>
        <div className="text-xs text-cyber-muted flex items-center gap-1">
          <RefreshCw className="w-3 h-3" /> live · {timeAgo(lastSync)}
        </div>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-cyber-card rounded-2xl p-4 border border-white/5">
          <div className="flex items-center gap-2 text-amber-400"><Clock className="w-4 h-4" /><span className="text-xs font-semibold">Needs manual review</span></div>
          <div className="text-2xl font-bold mt-1">{needsReview}</div>
        </div>
        <div className="bg-cyber-card rounded-2xl p-4 border border-white/5">
          <div className="flex items-center gap-2 text-cyber-purple"><Bot className="w-4 h-4" /><span className="text-xs font-semibold">Auto-verified (audit)</span></div>
          <div className="text-2xl font-bold mt-1">{autoOk}</div>
        </div>
        <div className="bg-cyber-card rounded-2xl p-4 border border-white/5">
          <div className="flex items-center gap-2 text-emerald-400"><Check className="w-4 h-4" /><span className="text-xs font-semibold">Total submissions</span></div>
          <div className="text-2xl font-bold mt-1">{reviews.length}</div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-4">
        {(['all', 'pending', 'verified_auto', 'verified', 'rejected'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold transition ${
              filter === f ? 'bg-cyber-lime text-black' : 'bg-white/5 text-cyber-muted hover:bg-white/10'
            }`}
          >
            {f === 'all' ? 'All' : STATUS_META[f].label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-cyber-muted text-sm">Loading…</div>
      ) : filtered.length === 0 ? (
        <div className="bg-cyber-card rounded-2xl p-10 border border-white/5 text-center text-cyber-muted text-sm">
          No certificate submissions here yet.
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {filtered.map(r => (
            <div key={r.uid} className="bg-cyber-card rounded-2xl border border-white/5 overflow-hidden">
              <a href={r.certDocUrl} target="_blank" rel="noreferrer" title="Open full document">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={r.certDocUrl} alt={`${r.name} certificate`} className="w-full h-44 object-cover bg-black/40 hover:opacity-90 transition" />
              </a>
              <div className="p-4">
                <div className="flex items-center justify-between gap-2">
                  <div className="font-bold truncate">{r.name || r.uid}</div>
                  <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold shrink-0 ${STATUS_META[r.status]?.cls ?? ''}`}>
                    {STATUS_META[r.status]?.label ?? r.status}
                  </span>
                </div>
                <div className="text-xs text-cyber-muted mt-1 line-clamp-2">
                  Claims: {r.certifications || '—'}
                </div>
                <div className="text-[11px] text-cyber-muted mt-1">Submitted {timeAgo(r.submittedAt)}</div>
                <div className="flex gap-2 mt-3">
                  <button
                    disabled={busy === r.uid || r.status === 'verified'}
                    onClick={() => decide(r, 'verified')}
                    className="flex-1 flex items-center justify-center gap-1 bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25 disabled:opacity-40 rounded-xl py-2 text-xs font-bold transition"
                  >
                    <Check className="w-3.5 h-3.5" /> Approve
                  </button>
                  <button
                    disabled={busy === r.uid || r.status === 'rejected'}
                    onClick={() => decide(r, 'rejected')}
                    className="flex-1 flex items-center justify-center gap-1 bg-cyber-danger/15 text-cyber-danger hover:bg-cyber-danger/25 disabled:opacity-40 rounded-xl py-2 text-xs font-bold transition"
                  >
                    <XCircle className="w-3.5 h-3.5" /> Reject
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
