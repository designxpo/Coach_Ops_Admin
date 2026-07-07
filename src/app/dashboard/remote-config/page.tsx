'use client'
import { useEffect, useState } from 'react'
import { SlidersHorizontal, Save, CheckCircle, Loader2, RotateCcw } from 'lucide-react'
import { dbWatchRemoteConfig, dbSetRemoteConfig, DEF_REMOTE_CONFIG, type RemoteConfigValues } from '@/lib/db'

type NumKey = keyof RemoteConfigValues

interface FieldDef { key: NumKey; label: string; hint: string; unit?: string; unlimitedAtZero?: boolean }

const GROUPS: { title: string; desc: string; fields: FieldDef[] }[] = [
  {
    title: 'Subscription & Client Caps',
    desc: 'Trial length and how many clients each coach tier can manage. These enforce live in the app.',
    fields: [
      { key: 'trialDays',          label: 'Free trial length',   hint: 'Days a new coach gets Pro features free', unit: 'days' },
      { key: 'maxClientsStarter',  label: 'Starter client cap',  hint: 'Max clients on the free tier',            unit: 'clients', unlimitedAtZero: true },
      { key: 'maxClientsPro',      label: 'Pro client cap',      hint: 'Max clients on Pro',                      unit: 'clients', unlimitedAtZero: true },
      { key: 'maxClientsBusiness', label: 'Business client cap', hint: 'Max clients on Business',                 unit: 'clients', unlimitedAtZero: true },
    ],
  },
  {
    title: 'Consistency Thresholds',
    desc: 'How the app colour-codes a client’s consistency score.',
    fields: [
      { key: 'consistencyRedThreshold',    label: 'Red below',    hint: 'Score under this shows red (at risk)', unit: '%' },
      { key: 'consistencyYellowThreshold', label: 'Yellow below', hint: 'Score under this shows yellow (watch)', unit: '%' },
    ],
  },
  {
    title: 'Alerts & Retention',
    desc: 'When to nudge coaches and how long to keep session data.',
    fields: [
      { key: 'checkInAlertDays',    label: 'Check-in alert',   hint: 'Alert a coach if a client hasn’t checked in for this many days', unit: 'days' },
      { key: 'sessionRetentionDays', label: 'Session retention', hint: 'How long session history is kept',                                  unit: 'days' },
    ],
  },
]

export default function RemoteConfigPage() {
  const [cfg,    setCfg]    = useState<RemoteConfigValues | null>(null)
  const [saving, setSaving] = useState(false)
  const [saved,  setSaved]  = useState(false)
  const [dirty,  setDirty]  = useState(false)

  useEffect(() => {
    const unsub = dbWatchRemoteConfig(c => setCfg(prev => (dirty ? prev : c)))
    return unsub
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dirty])

  function upd(key: NumKey, value: number) {
    setCfg(c => (c ? { ...c, [key]: value } : c))
    setDirty(true); setSaved(false)
  }

  async function save() {
    if (!cfg) return
    setSaving(true)
    try {
      await dbSetRemoteConfig(cfg)
      setDirty(false); setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    } finally { setSaving(false) }
  }

  function resetDefaults() {
    if (!confirm('Reset all values to their defaults?')) return
    setCfg({ ...DEF_REMOTE_CONFIG }); setDirty(true); setSaved(false)
  }

  if (!cfg) {
    return (
      <div className="p-8 flex items-center justify-center h-64">
        <div className="w-6 h-6 border-2 border-cyber-purple border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="p-8 max-w-3xl">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2">
            <SlidersHorizontal className="w-6 h-6 text-cyber-accent" />
            Remote Config
          </h1>
          <p className="text-cyber-muted text-sm mt-1">Tune app behaviour without shipping an update — plan limits, trial, thresholds</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={resetDefaults}
            className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-semibold border border-white/10 text-cyber-muted hover:text-white hover:border-white/20 transition-all">
            <RotateCcw className="w-3.5 h-3.5" /> Defaults
          </button>
          <button onClick={save} disabled={saving || !dirty}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-black bg-cyber-purple text-white hover:bg-cyber-purple/80 disabled:opacity-40 transition-all">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : saved ? <CheckCircle className="w-4 h-4" /> : <Save className="w-4 h-4" />}
            {saved ? 'Saved' : 'Save'}
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {GROUPS.map(group => (
          <div key={group.title} className="bg-cyber-card rounded-2xl border border-white/5 p-6">
            <div className="mb-4">
              <h2 className="text-sm font-bold text-white">{group.title}</h2>
              <p className="text-xs text-cyber-muted mt-0.5">{group.desc}</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {group.fields.map(f => {
                const val = cfg[f.key]
                const unlimited = f.unlimitedAtZero && val === 0
                return (
                  <div key={f.key}>
                    <label className="text-xs text-cyber-muted block mb-1.5">{f.label}</label>
                    <div className="relative">
                      <input type="number" min={0} value={val}
                        onChange={e => upd(f.key, Math.max(0, parseInt(e.target.value || '0', 10)))}
                        className="w-full bg-cyber-bg border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyber-purple transition-colors font-mono" />
                      {f.unit && (
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] text-cyber-muted pointer-events-none">
                          {unlimited ? 'unlimited' : f.unit}
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-cyber-muted/70 mt-1">
                      {f.hint}{f.unlimitedAtZero ? ' · 0 = unlimited' : ''}
                    </p>
                  </div>
                )
              })}
            </div>
          </div>
        ))}

        <div className="text-xs text-cyber-muted bg-white/3 border border-white/5 rounded-xl px-4 py-3">
          Writes to <span className="font-mono">admin_config/remote_config</span>. Client caps must match the app&apos;s subscription tiers — the app reads and enforces these values live.
        </div>
      </div>
    </div>
  )
}
