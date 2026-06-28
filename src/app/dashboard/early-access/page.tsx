'use client'
import { useEffect, useState } from 'react'
import { Rocket, Trash2, Users, UserCheck, RefreshCw, Download } from 'lucide-react'
import { dbWatchEarlyAccess, dbDeleteEarlyAccess, type EarlyAccessRecord } from '@/lib/db'

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

export default function EarlyAccessPage() {
  const [records,    setRecords]   = useState<EarlyAccessRecord[]>([])
  const [loading,    setLoading]   = useState(true)
  const [filter,     setFilter]    = useState<'all' | 'coach' | 'member'>('all')
  const [deleting,   setDeleting]  = useState<string | null>(null)
  const [lastSync,   setLastSync]  = useState(Date.now())

  useEffect(() => {
    const unsub = dbWatchEarlyAccess(list => {
      setRecords(list)
      setLoading(false)
      setLastSync(Date.now())
    })
    return unsub
  }, [])

  const filtered = filter === 'all' ? records : records.filter(r => r.role === filter)

  const coaches = records.filter(r => r.role === 'coach').length
  const members = records.filter(r => r.role === 'member').length

  async function handleDelete(id: string) {
    if (!confirm('Remove this sign-up?')) return
    setDeleting(id)
    try { await dbDeleteEarlyAccess(id) }
    finally { setDeleting(null) }
  }

  function exportCsv() {
    const rows = [
      ['Name', 'Email', 'Role', 'Signed Up', 'Source'],
      ...filtered.map(r => [
        r.name, r.email, r.role,
        formatDate(r.signedUpAt),
        r.source ?? 'website',
      ]),
    ]
    const csv  = rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href = url; a.download = 'early-access.csv'; a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="p-8 max-w-5xl">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2">
            <Rocket className="w-6 h-6 text-cyber-accent" />
            Early Access
          </h1>
          <p className="text-cyber-muted text-sm mt-1">Users who signed up for early access on the marketing site</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-xs text-cyber-muted">
            <RefreshCw className="w-3 h-3" />
            <span>Live · {timeAgo(lastSync)}</span>
          </div>
          <button
            onClick={exportCsv}
            disabled={filtered.length === 0}
            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-semibold text-white transition-all disabled:opacity-40"
          >
            <Download className="w-3.5 h-3.5" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: 'Total Sign-ups', value: records.length, icon: Users,     color: 'text-cyber-purple', bg: 'bg-cyber-purple/10' },
          { label: 'Coaches',        value: coaches,        icon: UserCheck,  color: 'text-cyber-accent', bg: 'bg-cyber-accent/10' },
          { label: 'Members',        value: members,        icon: Users,      color: 'text-emerald-400',  bg: 'bg-emerald-400/10'  },
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="bg-cyber-card rounded-2xl p-5 border border-white/5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-cyber-muted uppercase tracking-wider">{label}</span>
              <div className={`w-7 h-7 rounded-lg ${bg} flex items-center justify-center`}>
                <Icon className={`w-3.5 h-3.5 ${color}`} />
              </div>
            </div>
            <div className="text-2xl font-black text-white">{loading ? '—' : value}</div>
          </div>
        ))}
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-4">
        {(['all', 'coach', 'member'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold capitalize transition-all ${
              filter === f
                ? 'bg-cyber-purple text-white'
                : 'bg-white/5 text-cyber-muted hover:text-white hover:bg-white/8'
            }`}
          >
            {f === 'all' ? `All (${records.length})` : f === 'coach' ? `Coaches (${coaches})` : `Members (${members})`}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-cyber-card rounded-2xl border border-white/5 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-40">
            <div className="w-6 h-6 border-2 border-cyber-purple border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center text-cyber-muted py-16">
            <Rocket className="w-10 h-10 mx-auto mb-3 opacity-20" />
            <p className="text-sm">No sign-ups yet{filter !== 'all' ? ` for ${filter}s` : ''}</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/5 text-left">
                <th className="px-5 py-3.5 text-xs font-semibold text-cyber-muted uppercase tracking-wider">Name</th>
                <th className="px-5 py-3.5 text-xs font-semibold text-cyber-muted uppercase tracking-wider">Email</th>
                <th className="px-5 py-3.5 text-xs font-semibold text-cyber-muted uppercase tracking-wider">Role</th>
                <th className="px-5 py-3.5 text-xs font-semibold text-cyber-muted uppercase tracking-wider">Signed Up</th>
                <th className="px-5 py-3.5 text-xs font-semibold text-cyber-muted uppercase tracking-wider">Source</th>
                <th className="px-5 py-3.5" />
              </tr>
            </thead>
            <tbody>
              {filtered.map((r, i) => (
                <tr
                  key={r.id}
                  className={`border-b border-white/4 hover:bg-white/3 transition-colors ${i === filtered.length - 1 ? 'border-b-0' : ''}`}
                >
                  <td className="px-5 py-3.5 font-semibold text-white">{r.name}</td>
                  <td className="px-5 py-3.5 text-cyber-muted font-mono text-xs">{r.email}</td>
                  <td className="px-5 py-3.5">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                      r.role === 'coach'
                        ? 'bg-cyber-purple/20 text-cyber-purple'
                        : 'bg-emerald-400/15 text-emerald-400'
                    }`}>
                      {r.role === 'coach' ? 'Coach' : 'Member'}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-cyber-muted text-xs whitespace-nowrap" title={formatDate(r.signedUpAt)}>
                    {timeAgo(r.signedUpAt)}
                    <span className="block text-[10px] opacity-50">{formatDate(r.signedUpAt)}</span>
                  </td>
                  <td className="px-5 py-3.5 text-cyber-muted text-xs">{r.source ?? 'website'}</td>
                  <td className="px-5 py-3.5 text-right">
                    <button
                      onClick={() => handleDelete(r.id)}
                      disabled={deleting === r.id}
                      className="p-1.5 rounded-lg text-cyber-muted hover:text-cyber-danger hover:bg-cyber-danger/10 transition-all disabled:opacity-40"
                      title="Remove"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
