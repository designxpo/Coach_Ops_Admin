'use client'
import { useEffect, useState } from 'react'
import { ToggleLeft, AlertTriangle, RefreshCw } from 'lucide-react'
import { dbWatchFlags, dbSetFlag } from '@/lib/db'
import { FEATURES } from '@/lib/store'

export default function FeatureFlagsPage() {
  const [flags,    setFlags]    = useState<Record<string, boolean>>({})
  const [loading,  setLoading]  = useState(true)
  const [busy,     setBusy]     = useState<string | null>(null)
  const [lastSync, setLastSync] = useState(Date.now())

  useEffect(() => {
    const unsub = dbWatchFlags(f => {
      setFlags(f); setLoading(false); setLastSync(Date.now())
    })
    return unsub
  }, [])

  async function toggle(key: string, dangerous: boolean | undefined, next: boolean) {
    if (dangerous && next && !confirm(`Enable “${FEATURES.find(f => f.key === key)?.label}”? This affects every user immediately.`)) return
    setBusy(key)
    try { await dbSetFlag(key, next) }
    finally { setBusy(null) }
  }

  const enabledCount = FEATURES.filter(f => flags[f.key] ?? f.defaultEnabled).length

  return (
    <div className="p-8 max-w-3xl">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2">
            <ToggleLeft className="w-6 h-6 text-cyber-accent" />
            Feature Flags
          </h1>
          <p className="text-cyber-muted text-sm mt-1">Turn app features on or off remotely — {enabledCount} of {FEATURES.length} enabled</p>
        </div>
        <div className="flex items-center gap-2 text-xs text-cyber-muted">
          <RefreshCw className="w-3 h-3" />
          <span>Live · {loading ? '…' : 'synced'}</span>
        </div>
      </div>

      <div className="space-y-3">
        {FEATURES.map(f => {
          const on = flags[f.key] ?? f.defaultEnabled
          return (
            <div key={f.key} className={`flex items-center justify-between bg-cyber-card rounded-2xl border p-5 transition-colors ${
              f.dangerous && on ? 'border-cyber-danger/40' : 'border-white/5'
            }`}>
              <div className="flex items-start gap-3 min-w-0">
                {f.dangerous && (
                  <AlertTriangle className={`w-4 h-4 mt-0.5 flex-shrink-0 ${on ? 'text-cyber-danger' : 'text-amber-400'}`} />
                )}
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-white">{f.label}</span>
                    {f.dangerous && <span className="px-1.5 py-0.5 rounded bg-cyber-danger/15 text-cyber-danger text-[10px] font-bold">SENSITIVE</span>}
                  </div>
                  <div className="text-xs text-cyber-muted mt-0.5">{f.description}</div>
                  <div className="text-[10px] text-cyber-muted/60 font-mono mt-1">{f.key}</div>
                </div>
              </div>
              <button onClick={() => toggle(f.key, f.dangerous, !on)} disabled={busy === f.key || loading}
                className={`relative w-12 h-7 rounded-full transition-colors flex-shrink-0 disabled:opacity-40 ${
                  on ? (f.dangerous ? 'bg-cyber-danger' : 'bg-cyber-purple') : 'bg-white/10'
                }`}>
                <span className={`absolute top-1 left-1 w-5 h-5 rounded-full bg-white transition-transform ${on ? 'translate-x-5' : ''}`} />
              </button>
            </div>
          )
        })}
      </div>

      <div className="mt-4 text-xs text-cyber-muted bg-white/3 border border-white/5 rounded-xl px-4 py-3">
        Writes to <span className="font-mono">admin_config/flags</span>. For the full maintenance-mode message and force-update controls, use <span className="text-white font-semibold">App Control</span>.
      </div>
    </div>
  )
}
