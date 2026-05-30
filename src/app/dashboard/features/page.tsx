'use client'
import { useEffect, useState } from 'react'
import { AlertTriangle, CheckCircle } from 'lucide-react'
import { dbSetFlag, dbWatchFlags } from '@/lib/db'
import { FEATURES } from '@/lib/store'

export default function FeaturesPage() {
  const [flags, setFlags] = useState<Record<string, boolean>>({})
  const [saved, setSaved] = useState<string | null>(null)

  useEffect(() => {
    const unsub = dbWatchFlags(f => setFlags(f))
    return unsub
  }, [])

  const toggle = async (key: string, value: boolean) => {
    setFlags(prev => ({ ...prev, [key]: value }))   // optimistic
    setSaved(key)
    await dbSetFlag(key, value)
    setTimeout(() => setSaved(null), 1500)
  }

  return (
    <div className="p-8 max-w-2xl">
      <div className="mb-8">
        <h1 className="text-2xl font-black text-white">Feature Flags</h1>
        <p className="text-cyber-muted text-sm mt-1">
          Toggle features on or off. Changes sync to all devices in real time via Firestore.
        </p>
      </div>

      <div className="space-y-3">
        {FEATURES.map(feature => {
          const enabled = flags[feature.key] ?? feature.defaultEnabled
          return (
            <div key={feature.key}
              className={`flex items-center gap-4 bg-cyber-card rounded-2xl px-5 py-4 border transition-all ${
                feature.dangerous && enabled ? 'border-cyber-danger/40' : 'border-white/5'
              }`}
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                feature.dangerous && enabled ? 'bg-cyber-danger/15' : enabled ? 'bg-cyber-purple/12' : 'bg-cyber-elevated'
              }`}>
                {feature.dangerous
                  ? <AlertTriangle className={`w-5 h-5 ${enabled ? 'text-cyber-danger' : 'text-cyber-muted'}`} />
                  : <CheckCircle   className={`w-5 h-5 ${enabled ? 'text-cyber-purple' : 'text-cyber-muted'}`} />
                }
              </div>

              <div className="flex-1 min-w-0">
                <div className={`text-sm font-bold ${feature.dangerous && enabled ? 'text-cyber-danger' : 'text-white'}`}>
                  {feature.label}
                </div>
                <div className="text-xs text-cyber-muted truncate">{feature.description}</div>
              </div>

              {saved === feature.key && <span className="text-xs text-green-400 font-semibold">Saved</span>}

              <button onClick={() => toggle(feature.key, !enabled)}
                className={`relative w-12 h-6 rounded-full transition-colors flex-shrink-0 overflow-hidden ${
                  enabled ? feature.dangerous ? 'bg-cyber-danger' : 'bg-cyber-purple' : 'bg-cyber-elevated border border-white/10'
                }`}
              >
                <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform duration-200 ${
                  enabled ? 'translate-x-6' : 'translate-x-0'
                }`} />
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}
