'use client'
import { useEffect, useMemo, useState } from 'react'
import {
  Utensils, Plus, Search, Trash2, Pencil, X, Save, Loader2, Eye, EyeOff, Database,
} from 'lucide-react'
import {
  dbWatchIndianFoods, dbSaveIndianFood, dbDeleteIndianFood, dbToggleIndianFoodPublished,
  dbBulkImportIndianFoods, type AdminIndianFood,
} from '@/lib/db'

const CATEGORIES: Record<string, string> = {
  BREAKFAST: 'Breakfast', MAINS: 'Sabzi & Mains', DAL_CURRY: 'Dal & Curry',
  BREADS_RICE: 'Breads & Rice', SNACKS: 'Snacks & Chaat', SALADS_SIDES: 'Salads & Sides',
  DRINKS: 'Drinks', NONVEG: 'Non-Veg', SWEETS: 'Sweets',
}
const REGIONS: Record<string, string> = {
  '': 'Pan-India', NORTH: 'North Indian', SOUTH: 'South Indian', WEST: 'West Indian', EAST: 'East Indian',
}

const inputCls = 'w-full bg-cyber-bg border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-cyber-muted focus:outline-none focus:border-cyber-purple transition-colors'

type Draft = Omit<AdminIndianFood, 'id' | 'createdAt' | 'updatedAt'>

const EMPTY: Draft = {
  name: '', quantity: '', calories: 0, proteinG: 0, carbsG: 0, fatG: 0,
  isVegetarian: true, category: 'MAINS', region: '', benefits: '', isPublished: true,
}

function Editor({ initial, id, onClose }: { initial: Draft; id?: string; onClose: () => void }) {
  const [d, setD] = useState<Draft>(initial)
  const [saving, setSaving] = useState(false)
  function f<K extends keyof Draft>(key: K, value: Draft[K]) { setD(p => ({ ...p, [key]: value })) }

  async function save() {
    if (!d.name.trim()) { alert('Name is required'); return }
    setSaving(true)
    try { await dbSaveIndianFood({ ...d, name: d.name.trim() }, id); onClose() }
    catch (e) { alert((e as Error)?.message ?? 'Failed to save'); setSaving(false) }
  }

  const Label = ({ children }: { children: React.ReactNode }) => (
    <label className="text-xs text-cyber-muted block mb-1.5">{children}</label>
  )

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-xl h-full bg-cyber-bg border-l border-white/10 overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="sticky top-0 bg-cyber-bg/95 backdrop-blur border-b border-white/10 px-6 py-4 flex items-center justify-between">
          <h2 className="text-lg font-black text-white">{id ? 'Edit dish' : 'New dish'}</h2>
          <button onClick={onClose} className="text-cyber-muted hover:text-white"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <Label>Name</Label>
            <input className={inputCls} value={d.name} onChange={e => f('name', e.target.value)} placeholder="e.g. Masala Dosa" />
          </div>
          <div>
            <Label>Serving / quantity</Label>
            <input className={inputCls} value={d.quantity} onChange={e => f('quantity', e.target.value)} placeholder="e.g. 2 dosa + chutney" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Category</Label>
              <select className={inputCls} value={d.category} onChange={e => f('category', e.target.value)}>
                {Object.entries(CATEGORIES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
            <div>
              <Label>Region</Label>
              <select className={inputCls} value={d.region} onChange={e => f('region', e.target.value)}>
                {Object.entries(REGIONS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-4 gap-3">
            {(['calories', 'proteinG', 'carbsG', 'fatG'] as const).map(k => (
              <div key={k}>
                <Label>{k === 'calories' ? 'kcal' : k === 'proteinG' ? 'Protein g' : k === 'carbsG' ? 'Carbs g' : 'Fat g'}</Label>
                <input type="number" className={inputCls} value={d[k]} onChange={e => f(k, Number(e.target.value) as never)} />
              </div>
            ))}
          </div>
          <div>
            <Label>Benefits / note</Label>
            <textarea className={inputCls} rows={2} value={d.benefits} onChange={e => f('benefits', e.target.value)} placeholder="One-line benefit shown to the user" />
          </div>
          <div className="flex items-center gap-6">
            <button onClick={() => f('isVegetarian', !d.isVegetarian)} className="flex items-center gap-2 text-sm">
              <span className={`w-3 h-3 rounded-full ${d.isVegetarian ? 'bg-emerald-500' : 'bg-cyber-danger'}`} />
              <span className="text-white">{d.isVegetarian ? 'Vegetarian' : 'Non-Vegetarian'}</span>
            </button>
            <button onClick={() => f('isPublished', !d.isPublished)} className="flex items-center gap-2 text-sm text-white">
              {d.isPublished ? <Eye className="w-4 h-4 text-emerald-400" /> : <EyeOff className="w-4 h-4 text-cyber-muted" />}
              {d.isPublished ? 'Published' : 'Hidden'}
            </button>
          </div>
          <button onClick={save} disabled={saving}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-black bg-cyber-accent text-black hover:opacity-90 disabled:opacity-40 transition-all">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {saving ? 'Saving…' : 'Save dish'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function IndianFoodsPage() {
  const [foods, setFoods] = useState<AdminIndianFood[] | null>(null)
  const [q, setQ] = useState('')
  const [cat, setCat] = useState('')
  const [region, setRegion] = useState('')
  const [editing, setEditing] = useState<{ initial: Draft; id?: string } | null>(null)
  const [seeding, setSeeding] = useState(false)
  const [seedMsg, setSeedMsg] = useState('')

  useEffect(() => dbWatchIndianFoods(setFoods), [])

  const filtered = useMemo(() => {
    if (!foods) return []
    return foods
      .filter(f => !cat || f.category === cat)
      .filter(f => !region || (f.region || '') === region)
      .filter(f => !q || f.name.toLowerCase().includes(q.toLowerCase()))
      .sort((a, b) => a.name.localeCompare(b.name))
  }, [foods, q, cat, region])

  async function seedLibrary() {
    if (!confirm('Seed / update the built-in Indian dishes into Firestore? Existing docs with the same id are merged (your edits to other fields are kept).')) return
    setSeeding(true); setSeedMsg('')
    try {
      const res = await fetch('/indian_foods_catalog.json')
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const list = await res.json()
      const n = await dbBulkImportIndianFoods(list)
      setSeedMsg(`✓ Seeded ${n} dishes`)
    } catch (e) {
      setSeedMsg(`Failed: ${(e as Error).message}`)
    } finally {
      setSeeding(false)
    }
  }

  return (
    <div className="p-8">
      <div className="mb-6 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2">
            <Utensils className="w-6 h-6 text-cyber-accent" />
            Indian Foods
          </h1>
          <p className="text-cyber-muted text-sm mt-1">
            Edit the browsable Indian food library shown in the app. Set calories, macros,
            category, region tag & veg/non-veg. Changes appear live.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {seedMsg && <span className="text-xs text-cyber-muted">{seedMsg}</span>}
          <button onClick={seedLibrary} disabled={seeding}
            className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-bold bg-cyber-card border border-white/10 text-white hover:border-cyber-accent/50 disabled:opacity-40 transition-all">
            {seeding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Database className="w-4 h-4" />}
            Seed built-in library
          </button>
          <button onClick={() => setEditing({ initial: EMPTY })}
            className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-black bg-cyber-accent text-black hover:opacity-90 transition-all">
            <Plus className="w-4 h-4" /> New dish
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 mb-5 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 text-cyber-muted absolute left-3 top-1/2 -translate-y-1/2" />
          <input className={`${inputCls} pl-9`} placeholder="Search dishes…" value={q} onChange={e => setQ(e.target.value)} />
        </div>
        <select className={`${inputCls} max-w-[180px]`} value={cat} onChange={e => setCat(e.target.value)}>
          <option value="">All categories</option>
          {Object.entries(CATEGORIES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <select className={`${inputCls} max-w-[160px]`} value={region} onChange={e => setRegion(e.target.value)}>
          <option value="">All regions</option>
          {Object.entries(REGIONS).map(([k, v]) => <option key={k || 'pan'} value={k}>{v}</option>)}
        </select>
      </div>

      {!foods ? (
        <div className="flex items-center gap-2 text-cyber-muted text-sm"><Loader2 className="w-4 h-4 animate-spin" /> Loading…</div>
      ) : foods.length === 0 ? (
        <div className="bg-cyber-card rounded-2xl border border-white/5 p-8 text-center">
          <p className="text-white font-bold mb-1">No dishes in Firestore yet</p>
          <p className="text-cyber-muted text-sm mb-4">Click <b>Seed built-in library</b> to load the ~106 built-in Indian dishes, then edit any of them.</p>
        </div>
      ) : (
        <>
          <div className="text-xs text-cyber-muted mb-2">{filtered.length} of {foods.length} dishes</div>
          <div className="space-y-2">
            {filtered.map(food => (
              <div key={food.id} className="bg-cyber-card rounded-xl border border-white/5 px-4 py-3 flex items-center gap-3">
                <span className={`w-3 h-3 rounded-full flex-shrink-0 ${food.isVegetarian ? 'bg-emerald-500' : 'bg-cyber-danger'}`} />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-bold text-white truncate">{food.name} <span className="text-cyber-muted font-normal">· {food.quantity}</span></div>
                  <div className="text-[11px] text-cyber-muted">
                    {CATEGORIES[food.category] ?? food.category} · {REGIONS[food.region || ''] ?? food.region} · {food.calories} kcal · P{food.proteinG} C{food.carbsG} F{food.fatG}
                  </div>
                </div>
                <button onClick={() => dbToggleIndianFoodPublished(food.id, !food.isPublished)}
                  title={food.isPublished ? 'Published' : 'Hidden'} className="text-cyber-muted hover:text-white flex-shrink-0">
                  {food.isPublished ? <Eye className="w-4 h-4 text-emerald-400" /> : <EyeOff className="w-4 h-4" />}
                </button>
                <button onClick={() => setEditing({ initial: { ...food }, id: food.id })}
                  className="text-cyber-muted hover:text-cyber-accent flex-shrink-0"><Pencil className="w-4 h-4" /></button>
                <button onClick={() => { if (confirm(`Delete "${food.name}"?`)) dbDeleteIndianFood(food.id) }}
                  className="text-cyber-muted hover:text-cyber-danger flex-shrink-0"><Trash2 className="w-4 h-4" /></button>
              </div>
            ))}
          </div>
        </>
      )}

      {editing && <Editor initial={editing.initial} id={editing.id} onClose={() => setEditing(null)} />}
    </div>
  )
}
