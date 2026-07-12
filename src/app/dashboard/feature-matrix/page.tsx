'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Grid3x3, Save, CheckCircle, Loader2, RotateCcw, Check, X, Dumbbell, User, Users, ArrowRight } from 'lucide-react'
import {
  dbWatchFeatureMatrix, dbSetFeatureMatrix,
  dbWatchRemoteConfig, type RemoteConfigValues,
} from '@/lib/db'
import {
  MATRIX_FEATURES, COACH_TIERS, MEMBER_TIERS,
  DEFAULT_FEATURE_MATRIX, type FeatureMatrix, type MatrixFeature,
} from '@/lib/store'

const TIER_LABEL: Record<string, string> = {
  STARTER: 'Starter', PRO: 'Pro', BUSINESS: 'Business', FREE: 'Free', PREMIUM: 'Premium',
}
const TIER_COLOR: Record<string, string> = {
  STARTER: 'text-cyber-muted', PRO: 'text-cyber-purple', BUSINESS: 'text-amber-400',
  FREE: 'text-cyber-muted', PREMIUM: 'text-cyber-accent',
}

function cell(matrix: FeatureMatrix, key: string, tier: string): boolean {
  return matrix[key]?.[tier] ?? DEFAULT_FEATURE_MATRIX[key]?.[tier] ?? false
}

export default function FeatureMatrixPage() {
  const [matrix, setMatrix] = useState<FeatureMatrix | null>(null)
  const [caps,   setCaps]   = useState<RemoteConfigValues | null>(null)
  const [saving, setSaving] = useState(false)
  const [saved,  setSaved]  = useState(false)
  const [dirty,  setDirty]  = useState(false)

  useEffect(() => {
    const unsub = dbWatchFeatureMatrix(m => setMatrix(prev => (dirty ? prev : m)))
    return unsub
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dirty])

  useEffect(() => {
    const unsub = dbWatchRemoteConfig(c => setCaps(c))
    return unsub
  }, [])

  function toggle(key: string, tier: string) {
    setMatrix(m => {
      if (!m) return m
      const next = cell(m, key, tier) ? false : true
      return { ...m, [key]: { ...m[key], [tier]: next } }
    })
    setDirty(true); setSaved(false)
  }

  async function save() {
    if (!matrix) return
    setSaving(true)
    try {
      await dbSetFeatureMatrix(matrix)
      setDirty(false); setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    } finally { setSaving(false) }
  }

  function resetDefaults() {
    if (!confirm('Reset the whole matrix to default locks/unlocks?')) return
    setMatrix({ ...DEFAULT_FEATURE_MATRIX }); setDirty(true); setSaved(false)
  }

  if (!matrix) {
    return (
      <div className="p-8 flex items-center justify-center h-64">
        <div className="w-6 h-6 border-2 border-cyber-purple border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const coachFeatures  = MATRIX_FEATURES.filter(f => f.audience === 'coach')
  const memberFeatures = MATRIX_FEATURES.filter(f => f.audience === 'member')

  const capLabel = (n?: number) => (n === undefined ? '—' : n <= 0 ? 'Unlimited' : `${n} clients`)

  const Matrix = ({ title, sub, icon: Icon, features, tiers }: {
    title: string; sub: string; icon: any; features: MatrixFeature[]; tiers: string[]
  }) => (
    <div className="bg-cyber-card rounded-2xl border border-white/5 overflow-hidden">
      <div className="flex items-center gap-2 px-6 pt-5 pb-3">
        <Icon className="w-4 h-4 text-cyber-accent" />
        <div>
          <h2 className="text-sm font-bold text-white">{title}</h2>
          <p className="text-xs text-cyber-muted mt-0.5">{sub}</p>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/5 text-left">
              <th className="px-6 py-3 text-xs font-semibold text-cyber-muted uppercase tracking-wider">Feature</th>
              {tiers.map(t => (
                <th key={t} className={`px-4 py-3 text-xs font-bold uppercase tracking-wider text-center ${TIER_COLOR[t]}`}>{TIER_LABEL[t]}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {features.map((f, i) => (
              <tr key={f.key} className={`border-b border-white/4 hover:bg-white/3 transition-colors ${i === features.length - 1 ? 'border-b-0' : ''}`}>
                <td className="px-6 py-4 min-w-[220px]">
                  <div className="font-semibold text-white">{f.label}</div>
                  <div className="text-xs text-cyber-muted mt-0.5">{f.description}</div>
                  <div className="text-[10px] text-cyber-muted/60 font-mono mt-1">{f.key}</div>
                </td>
                {tiers.map(t => {
                  const on = cell(matrix, f.key, t)
                  return (
                    <td key={t} className="px-4 py-4 text-center">
                      <button onClick={() => toggle(f.key, t)} title={on ? 'Unlocked — click to lock' : 'Locked — click to unlock'}
                        className={`inline-flex items-center justify-center w-9 h-9 rounded-xl border transition-all ${
                          on ? 'bg-cyber-accent/15 border-cyber-accent/40 text-cyber-accent hover:bg-cyber-accent/25'
                             : 'bg-white/5 border-white/10 text-cyber-muted hover:border-white/20'
                        }`}>
                        {on ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
                      </button>
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )

  return (
    <div className="p-8 max-w-4xl">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2">
            <Grid3x3 className="w-6 h-6 text-cyber-accent" />
            Feature Matrix
          </h1>
          <p className="text-cyber-muted text-sm mt-1">What each subscription tier unlocks — for coaches and members. The app enforces this live.</p>
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

      {dirty && (
        <div className="mb-4 text-xs text-amber-400 bg-amber-400/10 border border-amber-400/20 rounded-xl px-4 py-3">
          Unsaved changes — hit <span className="font-bold">Save</span> to push them live to the app.
        </div>
      )}

      <div className="space-y-6">
        <Matrix
          title="Coach features"
          sub="Starter · Pro · Business — a green tick means that tier can use the feature"
          icon={Dumbbell}
          features={coachFeatures}
          tiers={COACH_TIERS}
        />

        {/* Client caps (numeric, edited in Remote Config) */}
        <div className="bg-cyber-card rounded-2xl border border-white/5 p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-white">Client caps per coach tier</h2>
              <p className="text-xs text-cyber-muted mt-0.5">How many clients each coach tier can manage (0 = unlimited)</p>
            </div>
            <Link href="/dashboard/remote-config"
              className="flex items-center gap-1 text-xs font-semibold text-cyber-purple hover:text-cyber-purple/80 transition-colors">
              Edit in Remote Config <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {([['STARTER', caps?.maxClientsStarter], ['PRO', caps?.maxClientsPro], ['BUSINESS', caps?.maxClientsBusiness]] as const).map(([tier, val]) => (
              <div key={tier} className="bg-cyber-bg rounded-xl border border-white/5 px-4 py-3">
                <div className={`text-[11px] font-bold uppercase tracking-wider ${TIER_COLOR[tier]}`}>{TIER_LABEL[tier]}</div>
                <div className="text-lg font-black text-white mt-1">{capLabel(val)}</div>
              </div>
            ))}
          </div>
        </div>

        <Matrix
          title="Member features"
          sub="Free vs Premium — set a member's tier per-user on the Users page"
          icon={User}
          features={memberFeatures}
          tiers={MEMBER_TIERS}
        />

        <div className="text-xs text-cyber-muted bg-white/3 border border-white/5 rounded-xl px-4 py-3 space-y-1">
          <p>Writes to <span className="font-mono">admin_config/feature_matrix</span>. The Android app reads this live and locks/unlocks features within seconds — no app update needed.</p>
          <p className="flex items-center gap-1">
            <Users className="w-3 h-3" />
            To change a specific person&apos;s tier (coach plan or member Free/Premium), use the{' '}
            <Link href="/dashboard/users" className="text-cyber-purple hover:underline font-semibold">Users</Link> page.
          </p>
        </div>
      </div>
    </div>
  )
}
