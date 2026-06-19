'use client'
import { useEffect, useState } from 'react'
import { Check } from 'lucide-react'
import { dbWatchPlans, dbSetPlans } from '@/lib/db'
import type { Plan } from '@/lib/store'

const PLANS: { id: Plan; emoji: string; name: string; maxClients: string; color: string; features: string[] }[] = [
  { id: 'STARTER', emoji: '🌱', name: 'Starter',  maxClients: '5 clients',    color: '#6B7280',
    features: ['Member management', 'Basic session logging'] },
  { id: 'PRO',     emoji: '⚡', name: 'Pro',      maxClients: '20 clients',   color: '#D4F700',
    features: ['All Starter features', 'Program timeline', 'Revenue chart', 'Body measurements', 'Member notes'] },
  { id: 'BUSINESS',emoji: '🚀', name: 'Business', maxClients: 'Unlimited',    color: '#818CF8',
    features: ['All Pro features', 'Broadcast messaging', 'Advanced analytics', 'Data export'] },
]

export default function PlansPage() {
  const [activePlan,  setActivePlan]  = useState<Plan>('STARTER')
  const [prices,      setPricesState] = useState<Record<Plan, number>>({ STARTER: 0, PRO: 999, BUSINESS: 2499 })
  const [edits,       setEdits]       = useState<Record<Plan, string>>({ STARTER: '0', PRO: '999', BUSINESS: '2499' })
  const [saving,      setSaving]      = useState(false)
  const [saved,       setSaved]       = useState(false)

  useEffect(() => {
    const unsub = dbWatchPlans(({ currentPlan, prices: p }) => {
      setActivePlan(currentPlan)
      setPricesState(p)
      setEdits({ STARTER: String(p.STARTER), PRO: String(p.PRO), BUSINESS: String(p.BUSINESS) })
    })
    return unsub
  }, [])

  const switchPlan = async (plan: Plan) => {
    setActivePlan(plan)
    await dbSetPlans({ currentPlan: plan, prices })
  }

  const savePrices = async () => {
    const updated: Record<Plan, number> = {
      STARTER:  parseInt(edits.STARTER)  || 0,
      PRO:      parseInt(edits.PRO)      || 0,
      BUSINESS: parseInt(edits.BUSINESS) || 0,
    }
    setSaving(true)
    await dbSetPlans({ currentPlan: activePlan, prices: updated })
    setPricesState(updated)
    setSaving(false); setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="p-8 max-w-3xl">
      <div className="mb-8">
        <h1 className="text-2xl font-black text-white">Plans & Pricing</h1>
        <p className="text-cyber-muted text-sm mt-1">Set the coach's plan and control subscription pricing.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {PLANS.map(plan => {
          const isActive = activePlan === plan.id
          return (
            <div key={plan.id} onClick={() => switchPlan(plan.id)}
              style={{ borderColor: isActive ? plan.color : 'transparent' }}
              className="bg-cyber-card rounded-2xl p-5 border-2 cursor-pointer hover:border-white/20 transition-all"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="text-2xl">{plan.emoji}</div>
                {isActive && (
                  <span className="text-xs font-extrabold px-2.5 py-1 rounded-full"
                    style={{ color: plan.color, backgroundColor: plan.color + '20' }}>Active</span>
                )}
              </div>
              <div className="text-base font-black text-white mb-0.5">{plan.name}</div>
              <div className="text-xs text-cyber-muted mb-4">{plan.maxClients}</div>
              <div className="space-y-1.5">
                {plan.features.map(f => (
                  <div key={f} className="flex items-center gap-2 text-xs text-cyber-muted">
                    <Check className="w-3 h-3 flex-shrink-0" style={{ color: plan.color }} />{f}
                  </div>
                ))}
              </div>
              {!isActive && (
                <button className="mt-4 w-full py-2 rounded-xl text-xs font-bold bg-cyber-elevated text-cyber-muted hover:text-white transition-all">
                  Switch to {plan.name}
                </button>
              )}
            </div>
          )
        })}
      </div>

      <div className="bg-cyber-card rounded-2xl p-6 border border-white/5">
        <h2 className="font-bold text-white mb-4">Monthly Pricing (₹)</h2>
        <div className="space-y-3 mb-5">
          {PLANS.map(plan => (
            <div key={plan.id} className="flex items-center gap-4">
              <div className="flex items-center gap-2 w-32">
                <span className="text-base">{plan.emoji}</span>
                <span className="text-sm font-semibold text-white">{plan.name}</span>
              </div>
              <span className="text-cyber-muted text-sm">₹</span>
              <input type="number" value={edits[plan.id]}
                onChange={e => { setEdits(prev => ({ ...prev, [plan.id]: e.target.value })); setSaved(false) }}
                className="w-28 bg-cyber-elevated border border-white/10 rounded-xl px-4 py-2 text-white text-sm text-right focus:outline-none focus:border-cyber-purple/50"
              />
              <span className="text-xs text-cyber-muted">/ month</span>
            </div>
          ))}
        </div>
        <button onClick={savePrices} disabled={saving}
          className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition-all disabled:opacity-50 ${
            saved ? 'bg-green-500 text-white' : 'bg-cyber-purple hover:bg-cyber-purple/90 text-white'
          }`}
        >
          {saved ? <><Check className="w-4 h-4"/> Saved!</> : saving ? 'Saving…' : 'Save Prices'}
        </button>
      </div>
    </div>
  )
}
