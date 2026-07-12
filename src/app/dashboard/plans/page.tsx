'use client'
import { useEffect, useState } from 'react'
import { CreditCard, Save, CheckCircle, Loader2, Check } from 'lucide-react'
import { dbWatchPlans, dbSetPlans } from '@/lib/db'
import type { Plan } from '@/lib/store'

const PLAN_META: { key: Plan; name: string; tagline: string; accent: string; ring: string; perks: string[] }[] = [
  { key: 'STARTER',  name: 'Starter',  tagline: 'Get started free', accent: 'text-cyber-muted', ring: 'border-white/10',
    perks: ['Up to 5 clients', 'Core training tools', 'Nutrition logging'] },
  { key: 'PRO',      name: 'Pro',      tagline: 'For growing coaches', accent: 'text-cyber-purple', ring: 'border-cyber-purple/40',
    perks: ['Up to 20 clients', 'Analytics & retention', 'WhatsApp broadcast', 'Revenue charts'] },
  { key: 'BUSINESS', name: 'Business', tagline: 'Scale without limits', accent: 'text-amber-400', ring: 'border-amber-400/40',
    perks: ['Unlimited clients', 'Everything in Pro', 'Priority support'] },
]

export default function PlansPage() {
  const [prices,      setPrices]      = useState<Record<Plan, number>>({ STARTER: 0, PRO: 999, BUSINESS: 2499 })
  const [currentPlan, setCurrentPlan] = useState<Plan>('STARTER')
  const [memberMonthly, setMemberMonthly] = useState(199)
  const [memberYearly,  setMemberYearly]  = useState(999)
  const [loading,     setLoading]     = useState(true)
  const [saving,      setSaving]      = useState(false)
  const [saved,       setSaved]       = useState(false)
  const [dirty,       setDirty]       = useState(false)

  useEffect(() => {
    const unsub = dbWatchPlans(p => {
      if (!dirty) {
        setPrices(p.prices); setCurrentPlan(p.currentPlan)
        setMemberMonthly(p.memberPremiumMonthly); setMemberYearly(p.memberPremiumYearly)
      }
      setLoading(false)
    })
    return unsub
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dirty])

  function setPrice(key: Plan, value: number) {
    setPrices(p => ({ ...p, [key]: Math.max(0, value) }))
    setDirty(true); setSaved(false)
  }

  function setMember(kind: 'monthly' | 'yearly', value: number) {
    const v = Math.max(0, value)
    if (kind === 'monthly') setMemberMonthly(v); else setMemberYearly(v)
    setDirty(true); setSaved(false)
  }

  async function save() {
    setSaving(true)
    try {
      await dbSetPlans({ currentPlan, prices, memberPremiumMonthly: memberMonthly, memberPremiumYearly: memberYearly })
      setDirty(false); setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    } finally { setSaving(false) }
  }

  return (
    <div className="p-8 max-w-4xl">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2">
            <CreditCard className="w-6 h-6 text-cyber-accent" />
            Plans & Pricing
          </h1>
          <p className="text-cyber-muted text-sm mt-1">Set the monthly price of each coach subscription tier (in ₹)</p>
        </div>
        <button onClick={save} disabled={saving || !dirty || loading}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-black bg-cyber-purple text-white hover:bg-cyber-purple/80 disabled:opacity-40 transition-all">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : saved ? <CheckCircle className="w-4 h-4" /> : <Save className="w-4 h-4" />}
          {saved ? 'Saved' : 'Save Prices'}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {PLAN_META.map(plan => (
          <div key={plan.key} className={`bg-cyber-card rounded-2xl border ${plan.ring} p-6 flex flex-col`}>
            <div className="mb-4">
              <div className={`text-lg font-black ${plan.accent}`}>{plan.name}</div>
              <div className="text-xs text-cyber-muted">{plan.tagline}</div>
            </div>

            {/* Price editor */}
            <div className="mb-5">
              {plan.key === 'STARTER' ? (
                <div className="text-2xl font-black text-white">Free</div>
              ) : (
                <div className="flex items-center gap-1">
                  <span className="text-lg font-black text-cyber-muted">₹</span>
                  <input type="number" min={0} value={prices[plan.key]}
                    onChange={e => setPrice(plan.key, parseInt(e.target.value || '0', 10))}
                    className="w-24 bg-cyber-bg border border-white/10 rounded-xl px-3 py-2 text-2xl font-black text-white focus:outline-none focus:border-cyber-purple transition-colors" />
                  <span className="text-xs text-cyber-muted self-end pb-2">/mo</span>
                </div>
              )}
            </div>

            <ul className="space-y-2 flex-1">
              {plan.perks.map(perk => (
                <li key={perk} className="flex items-start gap-2 text-xs text-cyber-muted">
                  <Check className={`w-3.5 h-3.5 mt-0.5 flex-shrink-0 ${plan.accent}`} />
                  {perk}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* Member Premium pricing — client-side subscription */}
      <div className="mt-6 bg-cyber-card rounded-2xl border border-cyber-accent/30 p-6">
        <div className="mb-4">
          <div className="text-lg font-black text-cyber-accent">Member Premium</div>
          <div className="text-xs text-cyber-muted">Client-side subscription — unlocks the AI Nutrition Coach & Meal Planner. Shown live in the app paywall.</div>
        </div>
        <div className="grid grid-cols-2 gap-4 max-w-md">
          <div>
            <label className="text-xs text-cyber-muted block mb-1.5">Monthly price</label>
            <div className="flex items-center gap-1">
              <span className="text-lg font-black text-cyber-muted">₹</span>
              <input type="number" min={0} value={memberMonthly}
                onChange={e => setMember('monthly', parseInt(e.target.value || '0', 10))}
                className="w-24 bg-cyber-bg border border-white/10 rounded-xl px-3 py-2 text-2xl font-black text-white focus:outline-none focus:border-cyber-accent transition-colors" />
              <span className="text-xs text-cyber-muted self-end pb-2">/mo</span>
            </div>
          </div>
          <div>
            <label className="text-xs text-cyber-muted block mb-1.5">Yearly price</label>
            <div className="flex items-center gap-1">
              <span className="text-lg font-black text-cyber-muted">₹</span>
              <input type="number" min={0} value={memberYearly}
                onChange={e => setMember('yearly', parseInt(e.target.value || '0', 10))}
                className="w-24 bg-cyber-bg border border-white/10 rounded-xl px-3 py-2 text-2xl font-black text-white focus:outline-none focus:border-cyber-accent transition-colors" />
              <span className="text-xs text-cyber-muted self-end pb-2">/yr</span>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4 text-xs text-cyber-muted bg-white/3 border border-white/5 rounded-xl px-4 py-3">
        Writes to <span className="font-mono">admin_config/plans</span>. Client caps per tier are set in <span className="text-white font-semibold">Remote Config</span>; feature locks in <span className="text-white font-semibold">Feature Matrix</span>. These prices drive your revenue figures on the Overview and the in-app Premium paywall.
      </div>
    </div>
  )
}
