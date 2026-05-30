'use client'
import { useEffect, useRef, useState } from 'react'
import { Users, ShieldOff, ShieldCheck, Clock, ChevronDown, User, Dumbbell } from 'lucide-react'
import { dbWatchUsers, dbSetUserSuspended, dbSetUserPlan, type UserRecord } from '@/lib/db'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function timeAgo(ms: number): string {
  if (!ms) return 'Never'
  const diff = Date.now() - ms
  const mins  = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days  = Math.floor(diff / 86400000)
  if (mins  < 2)  return 'Just now'
  if (hours < 1)  return `${mins}m ago`
  if (days  < 1)  return `${hours}h ago`
  if (days  < 30) return `${days}d ago`
  return new Date(ms).toLocaleDateString()
}

function formatDate(ms: number): string {
  if (!ms) return '—'
  return new Date(ms).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

const PLANS = [
  { id: 'STARTER',  label: 'Starter',  color: 'bg-white/5 text-cyber-muted'        },
  { id: 'PRO',      label: 'Pro',       color: 'bg-cyber-purple/20 text-cyber-purple' },
  { id: 'BUSINESS', label: 'Business',  color: 'bg-amber-500/20 text-amber-400'      },
]
const planStyle = (plan: string) =>
  plan === 'BUSINESS' ? 'bg-amber-500/20 text-amber-400' :
  plan === 'PRO'      ? 'bg-cyber-purple/20 text-cyber-purple' :
                        'bg-white/5 text-cyber-muted'

// ─── Plan dropdown (coaches only) ─────────────────────────────────────────────

function PlanDropdown({ user, onChanged }: { user: UserRecord; onChanged: () => void }) {
  const [open, setOpen]     = useState(false)
  const [saving, setSaving] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  const current = user.plan || 'STARTER'
  const changePlan = async (plan: string) => {
    if (plan === current) { setOpen(false); return }
    setSaving(true)
    await dbSetUserPlan(user.uid, plan)
    setSaving(false); setOpen(false); onChanged()
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(o => !o)}
        disabled={saving}
        className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold hover:opacity-80 disabled:opacity-40 ${planStyle(current)}`}
      >
        {saving ? <span className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin" />
                : <>{current}<ChevronDown className="w-3 h-3" /></>}
      </button>
      {open && (
        <div className="absolute top-full left-0 mt-1 z-50 min-w-[120px] bg-[#1a1a2e] rounded-xl border border-white/10 shadow-2xl overflow-hidden">
          {PLANS.map(p => (
            <button key={p.id} onClick={() => changePlan(p.id)}
              className={`w-full px-3 py-2 text-left text-xs font-bold hover:bg-white/5 flex items-center gap-2
                ${p.id === current ? 'opacity-40 cursor-default' : ''} ${p.color.split(' ')[1]}`}
            >
              <span className={`w-2 h-2 rounded-full ${
                p.id === 'BUSINESS' ? 'bg-amber-400' : p.id === 'PRO' ? 'bg-cyber-purple' : 'bg-white/30'
              }`} />
              {p.label}
              {p.id === current && <span className="ml-auto text-[10px] opacity-60">current</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Coaches table ────────────────────────────────────────────────────────────

function CoachesTable({ coaches, onToggle, onChanged }: {
  coaches: UserRecord[]
  onToggle: (u: UserRecord) => void
  onChanged: () => void
}) {
  if (coaches.length === 0) return (
    <EmptyState icon={<Dumbbell className="w-6 h-6 text-cyber-muted" />}
      title="No coaches yet"
      sub="Coach records appear when they sign up via the app" />
  )
  return (
    <div className="bg-cyber-card rounded-2xl border border-white/5 overflow-visible">
      <table className="w-full">
        <thead>
          <tr className="border-b border-white/5">
            {['Coach', 'Plan', 'Clients', 'MRR', 'Joined', 'Last Active', ''].map(h => (
              <th key={h} className="text-left px-5 py-4 text-xs font-semibold text-cyber-muted uppercase tracking-wider">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {coaches.map(user => (
            <tr key={user.uid} className={`border-b border-white/5 last:border-0 ${user.suspended ? 'opacity-50' : ''}`}>
              <td className="px-5 py-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-indigo-500/15 flex items-center justify-center text-sm font-black text-indigo-300 flex-shrink-0">
                    {(user.displayName || user.email || '?')[0].toUpperCase()}
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-white">{user.displayName || '—'}</div>
                    <div className="text-xs text-cyber-muted">{user.email}</div>
                  </div>
                </div>
              </td>
              <td className="px-5 py-4"><PlanDropdown user={user} onChanged={onChanged} /></td>
              <td className="px-5 py-4 text-sm text-white font-semibold">{user.clientCount ?? '—'}</td>
              <td className="px-5 py-4 text-sm text-cyber-accent font-bold">
                {user.totalMrr ? `₹${user.totalMrr >= 1000 ? (user.totalMrr / 1000).toFixed(1) + 'K' : user.totalMrr}` : '—'}
              </td>
              <td className="px-5 py-4 text-xs text-cyber-muted">{formatDate(user.joinedAt)}</td>
              <td className="px-5 py-4">
                <div className="flex items-center gap-1.5 text-xs text-cyber-muted">
                  <Clock className="w-3 h-3" />{timeAgo(user.lastActiveAt)}
                </div>
              </td>
              <td className="px-5 py-4 text-right">
                <button onClick={() => onToggle(user)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ml-auto ${
                    user.suspended
                      ? 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20'
                      : 'bg-cyber-danger/10 text-cyber-danger hover:bg-cyber-danger/20'
                  }`}>
                  {user.suspended ? <><ShieldCheck className="w-3 h-3" /> Restore</> : <><ShieldOff className="w-3 h-3" /> Suspend</>}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ─── Clients table ────────────────────────────────────────────────────────────

function ClientsTable({ clients, onToggle }: {
  clients: UserRecord[]
  onToggle: (u: UserRecord) => void
}) {
  if (clients.length === 0) return (
    <EmptyState icon={<User className="w-6 h-6 text-cyber-muted" />}
      title="No clients yet"
      sub="Client records appear when they sign up and complete onboarding in the app" />
  )
  return (
    <div className="bg-cyber-card rounded-2xl border border-white/5 overflow-hidden">
      <table className="w-full">
        <thead>
          <tr className="border-b border-white/5">
            {['Client', 'Goal', 'City', 'Joined', 'Last Active', ''].map(h => (
              <th key={h} className="text-left px-5 py-4 text-xs font-semibold text-cyber-muted uppercase tracking-wider">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {clients.map(user => (
            <tr key={user.uid} className={`border-b border-white/5 last:border-0 ${user.suspended ? 'opacity-50' : ''}`}>
              <td className="px-5 py-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-cyber-accent/15 flex items-center justify-center text-sm font-black text-cyber-accent flex-shrink-0">
                    {(user.displayName || user.email || '?')[0].toUpperCase()}
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-white">{user.displayName || '—'}</div>
                    <div className="text-xs text-cyber-muted">{user.email}</div>
                  </div>
                </div>
              </td>
              <td className="px-5 py-4">
                <span className="text-xs px-2 py-1 rounded-full bg-cyber-accent/10 text-cyber-accent font-semibold">
                  {(user as any).clientGoal?.replace(/_/g, ' ') || 'General Fitness'}
                </span>
              </td>
              <td className="px-5 py-4 text-xs text-cyber-muted">{(user as any).clientCity || '—'}</td>
              <td className="px-5 py-4 text-xs text-cyber-muted">{formatDate(user.joinedAt)}</td>
              <td className="px-5 py-4">
                <div className="flex items-center gap-1.5 text-xs text-cyber-muted">
                  <Clock className="w-3 h-3" />{timeAgo(user.lastActiveAt)}
                </div>
              </td>
              <td className="px-5 py-4 text-right">
                <button onClick={() => onToggle(user)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ml-auto ${
                    user.suspended
                      ? 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20'
                      : 'bg-cyber-danger/10 text-cyber-danger hover:bg-cyber-danger/20'
                  }`}>
                  {user.suspended ? <><ShieldCheck className="w-3 h-3" /> Restore</> : <><ShieldOff className="w-3 h-3" /> Suspend</>}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ─── Empty state ──────────────────────────────────────────────────────────────

function EmptyState({ icon, title, sub }: { icon: React.ReactNode; title: string; sub: string }) {
  return (
    <div className="bg-cyber-card rounded-2xl border border-white/5 flex flex-col items-center justify-center py-16 gap-4">
      <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center">{icon}</div>
      <div className="text-center">
        <div className="text-white font-bold">{title}</div>
        <div className="text-cyber-muted text-sm mt-1">{sub}</div>
      </div>
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function UsersPage() {
  const [users,    setUsers]    = useState<UserRecord[]>([])
  const [loading,  setLoading]  = useState(true)
  const [toggling, setToggling] = useState<string | null>(null)
  const [tab,      setTab]      = useState<'coaches' | 'clients'>('coaches')

  useEffect(() => {
    return dbWatchUsers(u => { setUsers(u); setLoading(false) })
  }, [])

  const coaches = users.filter(u => !u.role || u.role === 'coach')
  const clients = users.filter(u => u.role === 'client')

  const toggleSuspend = async (user: UserRecord) => {
    setToggling(user.uid)
    await dbSetUserSuspended(user.uid, !user.suspended)
    setToggling(null)
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-black text-white flex items-center gap-2">
          <Users className="text-cyber-accent" size={22} /> Users
        </h1>
        <p className="text-sm text-cyber-muted mt-0.5">
          Registered coaches and clients across CoachBase
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total Users',   value: users.length,                                  color: 'text-white'         },
          { label: 'Coaches',       value: coaches.length,                                color: 'text-indigo-400'    },
          { label: 'Clients',       value: clients.length,                                color: 'text-cyber-accent'  },
          { label: 'Suspended',     value: users.filter(u => u.suspended).length,         color: 'text-cyber-danger'  },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-cyber-card rounded-2xl p-5 border border-white/5">
            <div className={`text-3xl font-black ${color}`}>{value}</div>
            <div className="text-xs text-cyber-muted mt-1 font-semibold uppercase tracking-wider">{label}</div>
          </div>
        ))}
      </div>

      {/* Tab switcher */}
      <div className="flex gap-2 mb-5">
        {([
          { key: 'coaches', label: `Coaches (${coaches.length})`, icon: Dumbbell },
          { key: 'clients', label: `Clients (${clients.length})`, icon: User     },
        ] as const).map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${
              tab === key
                ? 'bg-cyber-accent text-black'
                : 'bg-white/5 text-cyber-muted hover:text-white hover:bg-white/10'
            }`}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center h-40">
          <div className="w-6 h-6 border-2 border-cyber-accent border-t-transparent rounded-full animate-spin" />
        </div>
      ) : tab === 'coaches' ? (
        <CoachesTable coaches={coaches} onToggle={toggleSuspend} onChanged={() => {}} />
      ) : (
        <ClientsTable clients={clients} onToggle={toggleSuspend} />
      )}
    </div>
  )
}
