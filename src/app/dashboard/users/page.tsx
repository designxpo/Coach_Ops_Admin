'use client'
import { useEffect, useMemo, useState } from 'react'
import {
  Users as UsersIcon, UserCheck, User, RefreshCw, Download, Search,
  ShieldAlert, ShieldCheck, Ban, Smartphone,
} from 'lucide-react'
import {
  dbWatchUsers, dbSetUserSuspended, dbSetUserPlan, dbSetUserRole, type UserRecord,
} from '@/lib/db'

const PLAN_OPTIONS = ['STARTER', 'PRO', 'BUSINESS']

function timeAgo(ms: number): string {
  if (!ms) return 'Never'
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
  })
}

const PLAN_CLS: Record<string, string> = {
  STARTER:  'bg-white/10 text-cyber-muted',
  PRO:      'bg-cyber-purple/20 text-cyber-purple',
  BUSINESS: 'bg-amber-500/20 text-amber-400',
}

export default function UsersPage() {
  const [users,    setUsers]    = useState<UserRecord[]>([])
  const [loading,  setLoading]  = useState(true)
  const [filter,   setFilter]   = useState<'all' | 'coach' | 'client' | 'suspended'>('all')
  const [search,   setSearch]   = useState('')
  const [busy,     setBusy]     = useState<string | null>(null)
  const [lastSync, setLastSync] = useState(Date.now())

  useEffect(() => {
    const unsub = dbWatchUsers(list => {
      setUsers(list)
      setLoading(false)
      setLastSync(Date.now())
    })
    return unsub
  }, [])

  const coaches   = users.filter(u => (u.role || 'coach') === 'coach').length
  const clients   = users.filter(u => u.role === 'client').length
  const suspended = users.filter(u => u.suspended).length
  const activeToday = users.filter(u => u.lastActiveAt && Date.now() - u.lastActiveAt < 86400000).length

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return users.filter(u => {
      if (filter === 'suspended' && !u.suspended) return false
      if (filter === 'coach' && (u.role || 'coach') !== 'coach') return false
      if (filter === 'client' && u.role !== 'client') return false
      if (q && !(`${u.displayName ?? ''} ${u.email ?? ''} ${u.uid}`.toLowerCase().includes(q))) return false
      return true
    })
  }, [users, filter, search])

  async function toggleSuspend(u: UserRecord) {
    const next = !u.suspended
    if (next && !confirm(`Suspend ${u.displayName || u.email || 'this user'}? They will be blocked from using the app.`)) return
    setBusy(u.uid)
    try { await dbSetUserSuspended(u.uid, next) }
    finally { setBusy(null) }
  }

  async function changePlan(u: UserRecord, plan: string) {
    setBusy(u.uid)
    try { await dbSetUserPlan(u.uid, plan) }
    finally { setBusy(null) }
  }

  async function changeRole(u: UserRecord, role: 'coach' | 'client') {
    if ((u.role || 'coach') === role) return
    if (!confirm(`Change ${u.displayName || u.email || 'this user'} to ${role === 'coach' ? 'Coach' : 'Member'}? This changes which app experience they get.`)) return
    setBusy(u.uid)
    try { await dbSetUserRole(u.uid, role) }
    finally { setBusy(null) }
  }

  function exportCsv() {
    const rows = [
      ['Name', 'Email', 'Role', 'Plan', 'Clients', 'Sessions', 'App Version', 'Joined', 'Last Active', 'Suspended'],
      ...filtered.map(u => [
        u.displayName ?? '', u.email ?? '', u.role || 'coach', u.plan || 'STARTER',
        String(u.clientCount ?? 0), String(u.sessionCount ?? 0), u.appVersion ?? '',
        formatDate(u.joinedAt), formatDate(u.lastActiveAt), u.suspended ? 'yes' : 'no',
      ]),
    ]
    const csv  = rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href = url; a.download = 'users.csv'; a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="p-8 max-w-6xl">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2">
            <UsersIcon className="w-6 h-6 text-cyber-accent" />
            Users
          </h1>
          <p className="text-cyber-muted text-sm mt-1">Everyone using the app — manage plans and suspend abusive accounts</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-xs text-cyber-muted">
            <RefreshCw className="w-3 h-3" />
            <span>Live · {timeAgo(lastSync)}</span>
          </div>
          <button onClick={exportCsv} disabled={filtered.length === 0}
            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-semibold text-white transition-all disabled:opacity-40">
            <Download className="w-3.5 h-3.5" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total Users', value: users.length, sub: `${activeToday} active today`, icon: UsersIcon, color: 'text-cyber-purple', bg: 'bg-cyber-purple/10' },
          { label: 'Coaches',     value: coaches,       sub: 'own client rosters',          icon: UserCheck, color: 'text-cyber-accent', bg: 'bg-cyber-accent/10' },
          { label: 'Clients',     value: clients,       sub: 'trained by coaches',          icon: User,      color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
          { label: 'Suspended',   value: suspended,     sub: 'blocked from app',            icon: ShieldAlert, color: 'text-cyber-danger', bg: 'bg-cyber-danger/10' },
        ].map(({ label, value, sub, icon: Icon, color, bg }) => (
          <div key={label} className="bg-cyber-card rounded-2xl p-5 border border-white/5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-cyber-muted uppercase tracking-wider">{label}</span>
              <div className={`w-7 h-7 rounded-lg ${bg} flex items-center justify-center`}>
                <Icon className={`w-3.5 h-3.5 ${color}`} />
              </div>
            </div>
            <div className="text-2xl font-black text-white mb-1">{loading ? '—' : value}</div>
            <div className="text-xs text-cyber-muted">{sub}</div>
          </div>
        ))}
      </div>

      {/* Controls */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        {(['all', 'coach', 'client', 'suspended'] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold capitalize transition-all ${
              filter === f ? 'bg-cyber-purple text-white' : 'bg-white/5 text-cyber-muted hover:text-white hover:bg-white/8'
            }`}>
            {f === 'all' ? `All (${users.length})` : f}
          </button>
        ))}
        <div className="flex-1" />
        <div className="relative">
          <Search className="w-4 h-4 text-cyber-muted absolute left-3 top-1/2 -translate-y-1/2" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search name, email, UID…"
            className="w-64 bg-cyber-bg border border-white/10 rounded-xl pl-9 pr-4 py-2 text-sm text-white placeholder:text-cyber-muted focus:outline-none focus:border-cyber-purple transition-colors" />
        </div>
      </div>

      {/* Table */}
      <div className="bg-cyber-card rounded-2xl border border-white/5 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-40">
            <div className="w-6 h-6 border-2 border-cyber-purple border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center text-cyber-muted py-16">
            <UsersIcon className="w-10 h-10 mx-auto mb-3 opacity-20" />
            <p className="text-sm">{users.length === 0 ? 'No users yet — they appear here as people sign up in the app' : 'No users match this filter'}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/5 text-left">
                  {['User', 'Role', 'Plan', 'Clients', 'Sessions', 'App', 'Joined', 'Last Active', ''].map((h, i) => (
                    <th key={i} className="px-4 py-3.5 text-xs font-semibold text-cyber-muted uppercase tracking-wider whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((u, i) => (
                  <tr key={u.uid} className={`border-b border-white/4 hover:bg-white/3 transition-colors ${u.suspended ? 'opacity-60' : ''} ${i === filtered.length - 1 ? 'border-b-0' : ''}`}>
                    <td className="px-4 py-3.5 min-w-0">
                      <div className="font-semibold text-white truncate max-w-[180px]">{u.displayName || '—'}</div>
                      <div className="text-[11px] text-cyber-muted truncate max-w-[180px]">{u.email || u.uid.slice(0, 12)}</div>
                    </td>
                    <td className="px-4 py-3.5">
                      <select value={(u.role || 'coach') === 'client' ? 'client' : 'coach'}
                        onChange={e => changeRole(u, e.target.value as 'coach' | 'client')}
                        disabled={busy === u.uid}
                        title="Change role (fixes members wrongly shown as coaches)"
                        className={`px-2 py-1 rounded-full text-[11px] font-bold bg-cyber-bg border border-white/10 focus:outline-none focus:border-cyber-purple cursor-pointer disabled:opacity-40 ${
                          (u.role || 'coach') === 'client' ? 'text-emerald-400' : 'text-cyber-accent'
                        }`}>
                        <option value="coach" className="bg-cyber-bg text-white">Coach</option>
                        <option value="client" className="bg-cyber-bg text-white">Member</option>
                      </select>
                    </td>
                    <td className="px-4 py-3.5">
                      <select value={u.plan || 'STARTER'} onChange={e => changePlan(u, e.target.value)} disabled={busy === u.uid}
                        className={`px-2 py-1 rounded-lg text-[11px] font-bold bg-cyber-bg border border-white/10 focus:outline-none focus:border-cyber-purple cursor-pointer disabled:opacity-40 ${PLAN_CLS[u.plan || 'STARTER'] ?? PLAN_CLS.STARTER}`}>
                        {PLAN_OPTIONS.map(p => <option key={p} value={p} className="bg-cyber-bg text-white">{p}</option>)}
                      </select>
                    </td>
                    <td className="px-4 py-3.5 text-white font-semibold">{u.clientCount ?? 0}</td>
                    <td className="px-4 py-3.5 text-white font-semibold">{u.sessionCount ?? 0}</td>
                    <td className="px-4 py-3.5">
                      <span className="flex items-center gap-1 text-xs text-cyber-muted font-mono">
                        <Smartphone className="w-3 h-3" />{u.appVersion || '—'}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-cyber-muted text-xs whitespace-nowrap">{formatDate(u.joinedAt)}</td>
                    <td className="px-4 py-3.5 text-cyber-muted text-xs whitespace-nowrap">{timeAgo(u.lastActiveAt)}</td>
                    <td className="px-4 py-3.5 text-right whitespace-nowrap">
                      <button onClick={() => toggleSuspend(u)} disabled={busy === u.uid}
                        title={u.suspended ? 'Unsuspend' : 'Suspend'}
                        className={`p-1.5 rounded-lg transition-all disabled:opacity-40 ${
                          u.suspended ? 'text-emerald-400 hover:bg-emerald-400/10' : 'text-cyber-muted hover:text-cyber-danger hover:bg-cyber-danger/10'
                        }`}>
                        {u.suspended ? <ShieldCheck className="w-4 h-4" /> : <Ban className="w-4 h-4" />}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
