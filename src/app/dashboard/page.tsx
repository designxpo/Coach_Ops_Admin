'use client'
import { useEffect, useState } from 'react'
import { Users, TrendingUp, Zap, Activity, AlertCircle, Crown, RefreshCw, Clock, Smartphone } from 'lucide-react'
import { dbWatchUsers, dbGetFlags, dbWatchPlans, type UserRecord } from '@/lib/db'
import type { Plan } from '@/lib/store'

function timeAgo(ms: number): string {
  if (!ms) return 'Never'
  const diff = Date.now() - ms
  const mins = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)
  if (mins < 2) return 'Just now'
  if (hours < 1) return `${mins}m ago`
  if (days < 1) return `${hours}h ago`
  return `${days}d ago`
}

function formatRevenue(amount: number): string {
  if (amount >= 100000) return `₹${(amount / 100000).toFixed(1)}L`
  if (amount >= 1000)   return `₹${Math.round(amount / 1000)}K`
  return `₹${amount}`
}

// Semver-ish sort: "1.10.0" > "1.9.0" > "1.0" > "unknown"
function compareVersions(a: string, b: string): number {
  if (a === 'unknown') return -1
  if (b === 'unknown') return 1
  const pa = a.split('.').map(n => parseInt(n, 10) || 0)
  const pb = b.split('.').map(n => parseInt(n, 10) || 0)
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const d = (pa[i] ?? 0) - (pb[i] ?? 0)
    if (d !== 0) return d
  }
  return 0
}

export default function OverviewPage() {
  const [users,       setUsers]      = useState<UserRecord[]>([])
  const [flags,       setFlags]      = useState<Record<string, boolean>>({})
  const [prices,      setPrices]     = useState<Record<Plan, number>>({ STARTER: 0, PRO: 999, BUSINESS: 2499 })
  const [loading,     setLoading]    = useState(true)
  const [lastRefresh, setLastRefresh] = useState(Date.now())

  useEffect(() => {
    dbGetFlags().then(setFlags)
    const unsubUsers = dbWatchUsers(u => {
      setUsers(u)
      setLoading(false)
      setLastRefresh(Date.now())
    })
    const unsubPlans = dbWatchPlans(({ prices: p }) => setPrices(p))
    return () => { unsubUsers(); unsubPlans() }
  }, [])

  // ── Stats from coaches ─────────────────────────────────────────────────────
  // Members (role 'client') get their own app experience — don't count them as coaches
  const coachUsers    = users.filter(u => u.role !== 'client')
  const totalCoaches  = coachUsers.length
  const totalClients  = users.reduce((s, u) => s + (u.clientCount  ?? 0), 0)
  const totalSessions = users.reduce((s, u) => s + (u.sessionCount ?? 0), 0)
  const activeToday   = users.filter(u => u.lastActiveAt && Date.now() - u.lastActiveAt < 86400000).length

  const planCounts = coachUsers.reduce<Record<string, number>>((acc, u) => {
    const p = u.plan || 'STARTER'
    acc[p] = (acc[p] ?? 0) + 1
    return acc
  }, {})

  // ── Owner's subscription revenue (coaches paying you, not coaches' client MRR) ──
  const ownerRevenue =
    (planCounts['PRO']      ?? 0) * prices.PRO +
    (planCounts['BUSINESS'] ?? 0) * prices.BUSINESS

  const maintenanceOn = flags['maintenance']

  // ── App version adoption (which build each user is running) ────────────────
  const versionCounts = users.reduce<Record<string, number>>((acc, u) => {
    const v = u.appVersion || 'unknown'
    acc[v] = (acc[v] ?? 0) + 1
    return acc
  }, {})
  const versionsSorted = Object.entries(versionCounts)
    .sort((a, b) => compareVersions(b[0], a[0]))
  const latestVersion = versionsSorted.find(([v]) => v !== 'unknown')?.[0]
  const outdatedCount = latestVersion
    ? users.filter(u => (u.appVersion || 'unknown') !== latestVersion).length
    : 0

  return (
    <div className="p-8 max-w-5xl">
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl font-black text-white">Overview</h1>
          <p className="text-cyber-muted text-sm mt-1">Live platform stats — updates automatically as coaches use the app</p>
        </div>
        <div className="flex items-center gap-2 text-xs text-cyber-muted">
          <RefreshCw className="w-3 h-3" />
          <span>Live · synced {timeAgo(lastRefresh)}</span>
        </div>
      </div>

      {maintenanceOn && (
        <div className="mb-6 flex items-center gap-3 bg-cyber-danger/10 border border-cyber-danger/30 rounded-2xl px-5 py-4">
          <AlertCircle className="w-5 h-5 text-cyber-danger flex-shrink-0" />
          <div>
            <div className="text-sm font-bold text-cyber-danger">Maintenance Mode Active</div>
            <div className="text-xs text-cyber-muted">The app is currently locked for all users.</div>
          </div>
        </div>
      )}

      {/* Main stats grid */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        {[
          {
            label: 'Total Coaches',
            value: loading ? '—' : String(totalCoaches),
            sub: `${activeToday} active today`,
            icon: Users,
            color: 'text-cyber-purple',
            bg: 'bg-cyber-purple/10',
          },
          {
            label: 'Total Clients',
            value: loading ? '—' : String(totalClients),
            sub: totalCoaches > 0 ? `avg ${Math.round(totalClients / totalCoaches)} per coach` : 'no coaches yet',
            icon: Activity,
            color: 'text-cyber-accent',
            bg: 'bg-cyber-accent/10',
          },
          {
            label: 'Your Revenue',
            value: loading ? '—' : formatRevenue(ownerRevenue),
            sub: ownerRevenue === 0
              ? 'no paid coaches yet'
              : `${planCounts['PRO'] ?? 0} Pro · ${planCounts['BUSINESS'] ?? 0} Business`,
            icon: TrendingUp,
            color: 'text-emerald-400',
            bg: 'bg-emerald-400/10',
          },
          {
            label: 'Sessions Logged',
            value: loading ? '—' : String(totalSessions),
            sub: totalCoaches > 0 ? `avg ${Math.round(totalSessions / totalCoaches)} per coach` : 'no coaches yet',
            icon: Zap,
            color: 'text-yellow-400',
            bg: 'bg-yellow-400/10',
          },
        ].map(({ label, value, sub, icon: Icon, color, bg }) => (
          <div key={label} className="bg-cyber-card rounded-2xl p-5 border border-white/5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-cyber-muted uppercase tracking-wider">{label}</span>
              <div className={`w-7 h-7 rounded-lg ${bg} flex items-center justify-center`}>
                <Icon className={`w-3.5 h-3.5 ${color}`} />
              </div>
            </div>
            <div className="text-2xl font-black text-white mb-1">{value}</div>
            <div className="text-xs text-cyber-muted">{sub}</div>
          </div>
        ))}
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

        {/* Owner badge */}
        <div className="bg-cyber-card rounded-2xl p-6 border border-[#d7fa00]/20">
          <div className="text-xs font-semibold text-cyber-muted uppercase tracking-wider mb-4">Account</div>
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-black flex items-center justify-center flex-shrink-0 p-0.5">
              <img src="/procoachindia.svg" alt="ProCoach India" className="w-full h-full object-contain" />
            </div>
            <div>
              <div className="text-sm font-black text-white flex items-center gap-2">
                Owner
                <Crown className="w-3.5 h-3.5 text-[#d7fa00]" />
              </div>
              <div className="text-xs text-cyber-muted">Full platform access</div>
            </div>
          </div>
          <div className="text-xs text-cyber-muted bg-[#d7fa00]/5 border border-[#d7fa00]/10 rounded-xl px-3 py-2">
            You own this platform — no subscription needed.
          </div>
        </div>

        {/* Coaches by plan */}
        <div className="bg-cyber-card rounded-2xl p-6 border border-white/5">
          <div className="text-xs font-semibold text-cyber-muted uppercase tracking-wider mb-4">Coaches by Plan</div>
          {loading ? (
            <div className="flex items-center justify-center h-16">
              <div className="w-5 h-5 border-2 border-cyber-purple border-t-transparent rounded-full animate-spin" />
            </div>
          ) : totalCoaches === 0 ? (
            <div className="text-sm text-cyber-muted py-4 text-center">No coaches yet</div>
          ) : (
            <div className="space-y-2">
              {[
                { key: 'STARTER',  label: 'Starter',  color: 'bg-white/10 text-cyber-muted',      price: prices.STARTER },
                { key: 'PRO',      label: 'Pro',       color: 'bg-cyber-purple/20 text-cyber-purple', price: prices.PRO },
                { key: 'BUSINESS', label: 'Business',  color: 'bg-amber-500/20 text-amber-400',    price: prices.BUSINESS },
              ].map(({ key, label, color, price }) => {
                const count = planCounts[key] ?? 0
                const pct = totalCoaches > 0 ? Math.round((count / totalCoaches) * 100) : 0
                return (
                  <div key={key} className="flex items-center gap-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${color} w-20 text-center`}>{label}</span>
                    <div className="flex-1 h-1.5 rounded-full bg-white/5 overflow-hidden">
                      <div className="h-full rounded-full bg-current opacity-60" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="text-xs font-semibold text-white w-4 text-right">{count}</span>
                    {price > 0 && <span className="text-[10px] text-cyber-muted w-14 text-right">₹{price}/mo</span>}
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Firebase / platform status */}
        <div className="bg-cyber-card rounded-2xl p-6 border border-white/5">
          <div className="text-xs font-semibold text-cyber-muted uppercase tracking-wider mb-4">Platform</div>
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-400" />
              <span className="text-sm font-semibold text-emerald-400">Firebase Connected</span>
            </div>
            <div className="text-xs text-cyber-muted font-mono bg-white/3 rounded-lg px-3 py-2 border border-white/5">
              coachops-27a73
            </div>
            <div className="flex items-center gap-2 text-xs text-cyber-muted">
              <Clock className="w-3 h-3" />
              <span>Last data sync: {timeAgo(lastRefresh)}</span>
            </div>
          </div>
        </div>

      </div>

      {/* ── App Version Adoption ─────────────────────────────────────────── */}
      <div className="mt-4 bg-cyber-card rounded-2xl p-6 border border-white/5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Smartphone className="w-4 h-4 text-cyber-accent" />
            <span className="text-xs font-semibold text-cyber-muted uppercase tracking-wider">App Version Adoption</span>
          </div>
          {latestVersion && (
            <span className="text-xs text-cyber-muted">
              Latest: <span className="text-emerald-400 font-bold">v{latestVersion}</span>
              {outdatedCount > 0 && (
                <span className="ml-2 text-amber-400 font-semibold">{outdatedCount} user{outdatedCount === 1 ? '' : 's'} on older builds</span>
              )}
            </span>
          )}
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-16">
            <div className="w-5 h-5 border-2 border-cyber-purple border-t-transparent rounded-full animate-spin" />
          </div>
        ) : versionsSorted.length === 0 ? (
          <div className="text-sm text-cyber-muted py-4 text-center">No version data yet — appears as users open the app</div>
        ) : (
          <div className="space-y-2">
            {versionsSorted.map(([version, count]) => {
              const pct = users.length > 0 ? Math.round((count / users.length) * 100) : 0
              const isLatest = version === latestVersion
              const isUnknown = version === 'unknown'
              return (
                <div key={version} className="flex items-center gap-3">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-bold w-24 text-center font-mono ${
                    isLatest ? 'bg-emerald-400/20 text-emerald-400'
                    : isUnknown ? 'bg-white/10 text-cyber-muted'
                    : 'bg-amber-500/20 text-amber-400'
                  }`}>
                    {isUnknown ? 'unknown' : `v${version}`}
                  </span>
                  <div className="flex-1 h-1.5 rounded-full bg-white/5 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${isLatest ? 'bg-emerald-400/70' : isUnknown ? 'bg-white/20' : 'bg-amber-400/70'}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="text-xs font-semibold text-white w-8 text-right">{count}</span>
                  <span className="text-[10px] text-cyber-muted w-10 text-right">{pct}%</span>
                  {isLatest && <span className="text-[10px] font-black text-emerald-400 w-12">LATEST</span>}
                  {!isLatest && !isUnknown && <span className="text-[10px] font-bold text-amber-400/70 w-12">OLD</span>}
                  {isUnknown && <span className="w-12" />}
                </div>
              )
            })}
          </div>
        )}
        <div className="mt-4 text-xs text-cyber-muted bg-white/3 border border-white/5 rounded-xl px-3 py-2">
          Updates automatically: every app launch reports its build version, and each user&apos;s full
          upgrade history is kept in <span className="font-mono">versionHistory</span>. Push an update to
          the Play Store and watch adoption move here in real time.
        </div>
      </div>
    </div>
  )
}
