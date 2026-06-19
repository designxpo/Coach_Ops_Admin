'use client'
import { useEffect, useState } from 'react'
import { Save, SlidersHorizontal } from 'lucide-react'
import { dbGetRemoteConfig, dbSetRemoteConfig, DEF_REMOTE_CONFIG, type RemoteConfigValues } from '@/lib/db'

interface ConfigField {
  key: keyof RemoteConfigValues
  label: string
  description: string
  unit?: string
  min: number
  max: number
}

const FIELDS: ConfigField[] = [
  {
    key: 'trialDays',
    label: 'Trial Period',
    description: 'Days a new coach gets full access before needing to subscribe',
    unit: 'days', min: 0, max: 90,
  },
  {
    key: 'maxClientsStarter',
    label: 'Max Clients — Starter',
    description: 'Member limit for coaches on the Starter plan',
    unit: 'clients', min: 1, max: 100,
  },
  {
    key: 'maxClientsPro',
    label: 'Max Clients — Pro',
    description: 'Member limit for coaches on the Pro plan',
    unit: 'clients', min: 1, max: 500,
  },
  {
    key: 'maxClientsBusiness',
    label: 'Max Clients — Business',
    description: 'Member limit for coaches on the Business plan',
    unit: 'clients', min: 1, max: 2000,
  },
  {
    key: 'consistencyRedThreshold',
    label: 'Consistency Red Threshold',
    description: 'Consistency score below this triggers a red churn-risk signal',
    unit: '%', min: 10, max: 60,
  },
  {
    key: 'consistencyYellowThreshold',
    label: 'Consistency Yellow Threshold',
    description: 'Consistency score below this triggers a yellow warning signal',
    unit: '%', min: 20, max: 90,
  },
  {
    key: 'checkInAlertDays',
    label: 'Check-in Alert Days',
    description: 'Days without a check-in before a signal is raised',
    unit: 'days', min: 1, max: 30,
  },
  {
    key: 'sessionRetentionDays',
    label: 'Session Retention',
    description: 'How many days of session history to keep in analytics',
    unit: 'days', min: 30, max: 365,
  },
]

export default function RemoteConfigPage() {
  const [values,  setValues]  = useState<RemoteConfigValues>(DEF_REMOTE_CONFIG)
  const [loading, setLoading] = useState(true)
  const [saving,  setSaving]  = useState(false)
  const [saved,   setSaved]   = useState(false)

  useEffect(() => {
    dbGetRemoteConfig().then(v => { setValues(v); setLoading(false) })
  }, [])

  const set = (key: keyof RemoteConfigValues, val: number) =>
    setValues(prev => ({ ...prev, [key]: val }))

  const save = async () => {
    setSaving(true)
    await dbSetRemoteConfig(values)
    setSaving(false); setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  const reset = () => setValues(DEF_REMOTE_CONFIG)

  if (loading) return (
    <div className="p-8 flex items-center justify-center h-64">
      <div className="w-6 h-6 border-2 border-cyber-purple border-t-transparent rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="p-8 max-w-3xl">
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white">Remote Config</h1>
          <p className="text-cyber-muted text-sm mt-1">
            Tune business logic values without a code release. The app reads these on every startup.
          </p>
        </div>
        <button onClick={reset}
          className="text-xs text-cyber-muted hover:text-white transition-colors flex-shrink-0 mt-1">
          Reset to defaults
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {FIELDS.map(({ key, label, description, unit, min, max }) => {
          const val = values[key]
          const def = DEF_REMOTE_CONFIG[key]
          const changed = val !== def
          return (
            <div key={key} className={`bg-cyber-card rounded-2xl p-5 border transition-all ${
              changed ? 'border-cyber-purple/40' : 'border-white/5'
            }`}>
              <div className="flex items-start justify-between gap-2 mb-3">
                <div>
                  <div className="text-sm font-bold text-white flex items-center gap-2">
                    {label}
                    {changed && <span className="text-xs text-cyber-purple font-bold">● modified</span>}
                  </div>
                  <div className="text-xs text-cyber-muted mt-0.5">{description}</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  value={val}
                  min={min}
                  max={max}
                  onChange={e => set(key, Math.min(max, Math.max(min, Number(e.target.value))))}
                  className="w-24 bg-cyber-elevated border border-white/10 rounded-xl px-3 py-2.5 text-white text-center font-black text-lg focus:outline-none focus:border-cyber-purple/50"
                />
                {unit && <span className="text-sm text-cyber-muted">{unit}</span>}
                {changed && (
                  <span className="text-xs text-cyber-muted ml-auto">
                    default: {def}
                  </span>
                )}
              </div>
            </div>
          )
        })}
      </div>

      <div className="flex items-center gap-4 mt-6">
        <button onClick={save} disabled={saving}
          className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition-all disabled:opacity-40 ${
            saved ? 'bg-emerald-500 text-black' : 'bg-cyber-purple hover:bg-cyber-purple/90 text-white'
          }`}
        >
          <Save className="w-4 h-4" />
          {saved ? 'Saved!' : saving ? 'Saving…' : 'Save Config'}
        </button>
        <p className="text-xs text-cyber-muted">
          Changes propagate to the app within ~30 seconds on next launch.
        </p>
      </div>
    </div>
  )
}
