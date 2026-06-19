'use client'
import { useEffect, useRef, useState } from 'react'
import {
  dbWatchNutritionPlans, dbSaveNutritionPlan, dbToggleNutritionPublished,
  type AdminNutritionPlan, type AdminMeal, type AdminFoodItem,
} from '@/lib/db'
import { DEFAULT_NUTRITION_PLANS } from '@/lib/nutritionSeed'
import { uploadNutritionImage } from '@/lib/supabase'
import {
  Utensils, Plus, Pencil, Trash2, Eye, EyeOff, X, Check,
  ChevronDown, ChevronRight, Download, Leaf, Flame, Upload, ImageIcon,
} from 'lucide-react'

// ─── Helpers ──────────────────────────────────────────────────────────────────

const GOALS = [
  { key: 'BUILD_MUSCLE',       label: 'Build Muscle',       emoji: '💪', color: 'text-indigo-400',  border: 'border-indigo-500/30' },
  { key: 'LOSE_FAT',           label: 'Lose Fat',           emoji: '🔥', color: 'text-amber-400',   border: 'border-amber-500/30'  },
  { key: 'IMPROVE_CARDIO',     label: 'Cardio',             emoji: '❤️', color: 'text-red-400',     border: 'border-red-500/30'    },
  { key: 'IMPROVE_FLEXIBILITY',label: 'Flexibility',        emoji: '🤸', color: 'text-emerald-400', border: 'border-emerald-500/30'},
  { key: 'GENERAL_FITNESS',    label: 'General Fitness',    emoji: '⭐', color: 'text-cyber-accent', border: 'border-cyber-accent/30'},
]

const EMPTY_FOOD: AdminFoodItem = {
  name: '', quantity: '', calories: 0, proteinG: 0, carbsG: 0, fatG: 0,
  benefits: '', isVegetarian: true, imageUrl: '',
}
const EMPTY_MEAL: AdminMeal = { name: '', timeSlot: '', notes: '', items: [] }

// ─── Reusable image upload + URL field ───────────────────────────────────────

function ImageUploadField({
  label, hint, value, storagePath, previewShape = 'rect',
  onChange,
}: {
  label: string
  hint?: string
  value: string
  storagePath: string
  previewShape?: 'rect' | 'circle' | 'wide'
  onChange: (url: string) => void
}) {
  const ref = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setError('')
    setUploading(true)
    try {
      const url = await uploadNutritionImage(file, storagePath)
      onChange(url)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setUploading(false)
      if (ref.current) ref.current.value = ''
    }
  }

  const previewClass =
    previewShape === 'circle' ? 'w-10 h-10 rounded-full' :
    previewShape === 'wide'   ? 'w-20 h-10 rounded-lg' :
                                'w-12 h-10 rounded-lg'

  return (
    <div>
      <label className="block text-xs text-cyber-muted mb-1">
        {label} {hint && <span className="text-white/30">{hint}</span>}
      </label>
      <div className="flex gap-2 items-center">
        <input
          className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/20"
          value={value} onChange={e => onChange(e.target.value)}
          placeholder="Paste URL or upload →"
        />
        <input ref={ref} type="file" accept="image/*" className="hidden" onChange={handleFile} />
        <button
          type="button"
          onClick={() => ref.current?.click()}
          disabled={uploading}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-cyber-elevated border border-white/10 text-xs font-semibold text-cyber-muted hover:text-white transition-all disabled:opacity-50 flex-shrink-0"
        >
          {uploading
            ? <span className="w-3.5 h-3.5 border border-current border-t-transparent rounded-full animate-spin" />
            : <Upload size={13} />}
          {uploading ? 'Uploading…' : 'Upload'}
        </button>
        {value && !uploading && (
          <img
            src={value} alt=""
            className={`${previewClass} object-cover flex-shrink-0 border border-white/10`}
            onError={e => (e.currentTarget.style.display = 'none')}
            onLoad={e => (e.currentTarget.style.display = '')}
          />
        )}
        {!value && !uploading && (
          <div className={`${previewClass} flex items-center justify-center bg-white/5 border border-white/10 border-dashed flex-shrink-0`}>
            <ImageIcon size={14} className="text-white/20" />
          </div>
        )}
      </div>
      {error && <p className="text-xs text-red-400 mt-1">{error}</p>}
    </div>
  )
}

function MacroPill({ label, value, unit = 'g', color }: { label: string; value: number; unit?: string; color: string }) {
  return (
    <div className={`flex flex-col items-center px-3 py-2 rounded-xl border bg-white/3 ${color}`}>
      <span className="text-lg font-black">{value}{unit}</span>
      <span className="text-xs opacity-60">{label}</span>
    </div>
  )
}

// ─── Food Item Form (inline) ──────────────────────────────────────────────────

function FoodItemForm({
  item, onSave, onCancel, goalKey, mealIdx, itemIdx,
}: {
  item: AdminFoodItem
  onSave: (f: AdminFoodItem) => void
  onCancel: () => void
  goalKey: string
  mealIdx: number
  itemIdx: number
}) {
  const [f, setF] = useState<AdminFoodItem>({ ...item })
  const upd = (k: keyof AdminFoodItem, v: unknown) => setF(prev => ({ ...prev, [k]: v }))

  return (
    <div className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-cyber-muted mb-1">Food Name *</label>
          <input className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white"
            value={f.name} onChange={e => upd('name', e.target.value)} placeholder="e.g. Paneer Paratha" />
        </div>
        <div>
          <label className="block text-xs text-cyber-muted mb-1">Quantity / Serving</label>
          <input className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white"
            value={f.quantity} onChange={e => upd('quantity', e.target.value)} placeholder="e.g. 2 parathas" />
        </div>
      </div>
      <div className="grid grid-cols-4 gap-2">
        {(['calories', 'proteinG', 'carbsG', 'fatG'] as const).map(k => (
          <div key={k}>
            <label className="block text-xs text-cyber-muted mb-1">
              {k === 'calories' ? 'Calories' : k === 'proteinG' ? 'Protein (g)' : k === 'carbsG' ? 'Carbs (g)' : 'Fat (g)'}
            </label>
            <input type="number" className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white"
              value={f[k]} onChange={e => upd(k, +e.target.value)} />
          </div>
        ))}
      </div>
      <div>
        <label className="block text-xs text-cyber-muted mb-1">Benefits / Why it's in this plan</label>
        <input className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white"
          value={f.benefits} onChange={e => upd('benefits', e.target.value)}
          placeholder="e.g. High protein + complex carbs for muscle fuel" />
      </div>
      <ImageUploadField
        label="Food Image"
        hint="(optional — overrides auto-matched image)"
        value={f.imageUrl ?? ''}
        storagePath={`nutrition/food/${goalKey}/m${mealIdx}_i${itemIdx}_${Date.now()}`}
        previewShape="circle"
        onChange={url => upd('imageUrl', url)}
      />
      <div className="flex items-center gap-3">
        <label className="text-sm text-cyber-muted">Vegetarian</label>
        <button onClick={() => upd('isVegetarian', !f.isVegetarian)}
          className={`w-9 h-5 rounded-full transition-colors flex-shrink-0 ${f.isVegetarian ? 'bg-emerald-500' : 'bg-white/20'}`}>
          <div className={`w-4 h-4 bg-white rounded-full transition-transform mx-0.5 ${f.isVegetarian ? 'translate-x-4' : 'translate-x-0'}`} />
        </button>
      </div>
      <div className="flex gap-2">
        <button onClick={onCancel}
          className="flex-1 py-2 rounded-lg border border-white/10 text-cyber-muted hover:text-white text-sm">Cancel</button>
        <button onClick={() => f.name.trim() && onSave(f)}
          disabled={!f.name.trim()}
          className="flex-1 py-2 rounded-lg bg-cyber-accent text-black font-black text-sm disabled:opacity-40">Save Item</button>
      </div>
    </div>
  )
}

// ─── Meal Editor ──────────────────────────────────────────────────────────────

function MealEditor({
  meal, mealIdx, goalKey, onUpdate, onDelete,
}: { meal: AdminMeal; mealIdx: number; goalKey: string; onUpdate: (m: AdminMeal) => void; onDelete: () => void }) {
  const [expanded, setExpanded]       = useState(mealIdx === 0)
  const [editName, setEditName]       = useState(false)
  const [nameVal, setNameVal]         = useState(meal.name)
  const [timeVal, setTimeVal]         = useState(meal.timeSlot)
  const [addingFood, setAddingFood]   = useState(false)
  const [editingFoodIdx, setEditingFoodIdx] = useState<number | null>(null)

  const totalCal = meal.items.reduce((s, i) => s + i.calories, 0)
  const totalPro = meal.items.reduce((s, i) => s + i.proteinG, 0)

  const saveNameRow = () => {
    onUpdate({ ...meal, name: nameVal.trim() || meal.name, timeSlot: timeVal })
    setEditName(false)
  }

  const saveFood = (food: AdminFoodItem, idx?: number) => {
    const items = [...meal.items]
    if (idx !== undefined) items[idx] = food
    else items.push(food)
    onUpdate({ ...meal, items })
    setAddingFood(false)
    setEditingFoodIdx(null)
  }

  const deleteFood = (idx: number) => {
    onUpdate({ ...meal, items: meal.items.filter((_, i) => i !== idx) })
  }

  return (
    <div className="border border-white/8 rounded-xl overflow-hidden">
      {/* Meal header */}
      <div className="flex items-center gap-3 p-3 bg-white/5 hover:bg-white/8 transition-colors">
        <button onClick={() => setExpanded(e => !e)} className="text-cyber-muted flex-shrink-0">
          {expanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
        </button>

        {editName ? (
          <div className="flex flex-1 gap-2 items-center">
            <input className="flex-1 bg-white/5 border border-white/10 rounded px-2 py-1 text-sm text-white"
              value={nameVal} onChange={e => setNameVal(e.target.value)} placeholder="Meal name" />
            <input className="w-36 bg-white/5 border border-white/10 rounded px-2 py-1 text-xs text-white"
              value={timeVal} onChange={e => setTimeVal(e.target.value)} placeholder="8:00 – 9:00 AM" />
            <button onClick={saveNameRow} className="text-emerald-400 hover:text-emerald-300"><Check size={15} /></button>
            <button onClick={() => { setEditName(false); setNameVal(meal.name); setTimeVal(meal.timeSlot) }}
              className="text-cyber-muted hover:text-white"><X size={15} /></button>
          </div>
        ) : (
          <div className="flex flex-1 items-center gap-2 min-w-0">
            <span className="font-bold text-white truncate">{meal.name || 'Unnamed Meal'}</span>
            {meal.timeSlot && <span className="text-xs text-cyber-muted flex-shrink-0">{meal.timeSlot}</span>}
            <span className="text-xs text-cyber-muted flex-shrink-0">· {meal.items.length} items</span>
            {totalCal > 0 && <span className="text-xs text-amber-400 flex-shrink-0">~{totalCal} cal</span>}
            {totalPro > 0 && <span className="text-xs text-indigo-400 flex-shrink-0">{totalPro}g P</span>}
          </div>
        )}

        {!editName && (
          <div className="flex items-center gap-1 flex-shrink-0">
            <button onClick={() => setEditName(true)}
              className="p-1.5 rounded-lg text-cyber-accent bg-cyber-accent/10 hover:bg-cyber-accent/20"><Pencil size={12} /></button>
            <button onClick={onDelete}
              className="p-1.5 rounded-lg text-red-400 bg-red-400/10 hover:bg-red-400/20"><Trash2 size={12} /></button>
          </div>
        )}
      </div>

      {/* Food items */}
      {expanded && (
        <div className="p-3 space-y-2">
          {meal.items.map((food, idx) => (
            <div key={idx}>
              {editingFoodIdx === idx ? (
                <FoodItemForm item={food} onSave={f => saveFood(f, idx)}
                  onCancel={() => setEditingFoodIdx(null)}
                  goalKey={goalKey} mealIdx={mealIdx} itemIdx={idx} />
              ) : (
                <div className="flex items-start gap-3 px-3 py-2 rounded-lg bg-white/3 hover:bg-white/5 group">
                  <div className="flex-shrink-0 mt-0.5">
                    {food.isVegetarian
                      ? <Leaf size={13} className="text-emerald-400" />
                      : <Flame size={13} className="text-orange-400" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-semibold text-white">{food.name}</span>
                      <span className="text-xs text-cyber-muted">{food.quantity}</span>
                    </div>
                    <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                      <span className="text-xs text-amber-400">{food.calories} cal</span>
                      <span className="text-xs text-indigo-400">P {food.proteinG}g</span>
                      <span className="text-xs text-emerald-400">C {food.carbsG}g</span>
                      <span className="text-xs text-yellow-400">F {food.fatG}g</span>
                    </div>
                    {food.benefits && (
                      <p className="text-xs text-cyber-muted mt-0.5 truncate" title={food.benefits}>{food.benefits}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                    <button onClick={() => setEditingFoodIdx(idx)}
                      className="p-1.5 rounded text-cyber-accent bg-cyber-accent/10 hover:bg-cyber-accent/20"><Pencil size={11} /></button>
                    <button onClick={() => deleteFood(idx)}
                      className="p-1.5 rounded text-red-400 bg-red-400/10 hover:bg-red-400/20"><Trash2 size={11} /></button>
                  </div>
                </div>
              )}
            </div>
          ))}

          {addingFood ? (
            <FoodItemForm item={EMPTY_FOOD} onSave={f => saveFood(f)} onCancel={() => setAddingFood(false)}
              goalKey={goalKey} mealIdx={mealIdx} itemIdx={meal.items.length} />
          ) : (
            <button onClick={() => { setAddingFood(true); setEditingFoodIdx(null) }}
              className="flex items-center gap-2 w-full px-3 py-2 rounded-lg border border-dashed border-white/15 text-cyber-muted hover:text-white hover:border-white/30 text-sm transition-colors">
              <Plus size={13} /> Add Food Item
            </button>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Plan Edit Modal ──────────────────────────────────────────────────────────

function PlanModal({
  plan, goalMeta, onClose, onSave,
}: {
  plan: AdminNutritionPlan | null
  goalMeta: typeof GOALS[0]
  onClose: () => void
  onSave: (p: Omit<AdminNutritionPlan, 'id' | 'updatedAt'>, id: string) => Promise<void>
}) {
  const seed = DEFAULT_NUTRITION_PLANS[goalMeta.key]
  const initial: Omit<AdminNutritionPlan, 'id' | 'updatedAt'> = plan
    ? { goal: plan.goal, goalLabel: plan.goalLabel, goalEmoji: plan.goalEmoji,
        dailyCalories: plan.dailyCalories, proteinG: plan.proteinG,
        carbsG: plan.carbsG, fatG: plan.fatG, hydration: plan.hydration,
        generalTips: plan.generalTips, meals: plan.meals, isPublished: plan.isPublished,
        headerImageUrl: plan.headerImageUrl ?? '', iconImageUrl: plan.iconImageUrl ?? '' }
    : { ...seed, headerImageUrl: '', iconImageUrl: '' }

  const [form, setForm]   = useState(initial)
  const [tab, setTab]     = useState<'overview' | 'tips' | 'meals'>('overview')
  const [saving, setSaving] = useState(false)
  const [newTip, setNewTip] = useState('')
  const [addingMeal, setAddingMeal] = useState(false)
  const [newMealName, setNewMealName] = useState('')
  const [newMealTime, setNewMealTime] = useState('')

  const upd = (k: keyof typeof form, v: unknown) => setForm(f => ({ ...f, [k]: v }))

  const addTip = () => {
    const t = newTip.trim()
    if (t) { upd('generalTips', [...form.generalTips, t]); setNewTip('') }
  }
  const removeTip = (i: number) => upd('generalTips', form.generalTips.filter((_, idx) => idx !== i))

  const addMeal = () => {
    if (!newMealName.trim()) return
    const m: AdminMeal = { name: newMealName.trim(), timeSlot: newMealTime.trim(), notes: '', items: [] }
    upd('meals', [...form.meals, m])
    setNewMealName(''); setNewMealTime(''); setAddingMeal(false)
  }
  const updateMeal  = (i: number, m: AdminMeal) => upd('meals', form.meals.map((x, idx) => idx === i ? m : x))
  const deleteMeal  = (i: number) => upd('meals', form.meals.filter((_, idx) => idx !== i))

  const handleSave = async () => {
    setSaving(true)
    try { await onSave(form, goalMeta.key) } finally { setSaving(false) }
  }

  const totalMealCal = form.meals.reduce((s, m) => s + m.items.reduce((ss, f) => ss + f.calories, 0), 0)

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/75 overflow-y-auto p-4">
      <div className="w-full max-w-3xl bg-[#1a1a2e] border border-white/10 rounded-2xl my-8 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/8">
          <div className="flex items-center gap-3">
            <span className="text-2xl">{goalMeta.emoji}</span>
            <div>
              <h2 className="text-lg font-black text-white">{goalMeta.label} Nutrition Plan</h2>
              <p className="text-xs text-cyber-muted">
                {form.meals.length} meals · {totalMealCal} cal from food items
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-cyber-muted hover:text-white p-1"><X size={20} /></button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-white/8">
          {(['overview', 'tips', 'meals'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-6 py-3 text-sm font-semibold capitalize transition-colors border-b-2 ${
                tab === t ? 'border-cyber-accent text-cyber-accent' : 'border-transparent text-cyber-muted hover:text-white'
              }`}>
              {t === 'overview' ? 'Overview' : t === 'tips' ? `Tips (${form.generalTips.length})` : `Meals (${form.meals.length})`}
            </button>
          ))}
        </div>

        <div className="p-6 overflow-y-auto max-h-[65vh] space-y-5">
          {/* ── Overview Tab ── */}
          {tab === 'overview' && (
            <>
              <div className="grid grid-cols-4 gap-4">
                {([
                  ['dailyCalories', 'Daily Calories', 'kcal'],
                  ['proteinG',      'Protein',        'g'],
                  ['carbsG',        'Carbs',          'g'],
                  ['fatG',          'Fat',            'g'],
                ] as const).map(([k, label, unit]) => (
                  <div key={k}>
                    <label className="block text-xs text-cyber-muted mb-1">{label} ({unit})</label>
                    <input type="number"
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white font-bold"
                      value={form[k]}
                      onChange={e => upd(k, +e.target.value)} />
                  </div>
                ))}
              </div>

              {/* Macro bar */}
              {form.dailyCalories > 0 && (
                <div>
                  <div className="flex justify-between text-xs text-cyber-muted mb-1">
                    <span>Macro split</span>
                    <span>{Math.round(form.proteinG * 4 * 100 / form.dailyCalories)}% P · {Math.round(form.carbsG * 4 * 100 / form.dailyCalories)}% C · {Math.round(form.fatG * 9 * 100 / form.dailyCalories)}% F</span>
                  </div>
                  <div className="flex h-2 rounded-full overflow-hidden">
                    <div style={{ width: `${form.proteinG * 4 * 100 / form.dailyCalories}%` }} className="bg-indigo-500" />
                    <div style={{ width: `${form.carbsG * 4 * 100 / form.dailyCalories}%` }} className="bg-emerald-500" />
                    <div style={{ width: `${form.fatG * 9 * 100 / form.dailyCalories}%` }} className="bg-yellow-500" />
                  </div>
                  <div className="flex gap-4 mt-1 text-xs">
                    <span className="text-indigo-400">■ Protein</span>
                    <span className="text-emerald-400">■ Carbs</span>
                    <span className="text-yellow-400">■ Fat</span>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs text-cyber-muted mb-1">Hydration Recommendation</label>
                <input className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white"
                  value={form.hydration} onChange={e => upd('hydration', e.target.value)}
                  placeholder="e.g. 3.5–4 L water/day. Add electrolytes on training days." />
              </div>

              {/* Image URLs */}
              <div className="space-y-3 pt-1 border-t border-white/8">
                <p className="text-xs font-semibold text-cyber-muted uppercase tracking-wider pt-2">Images</p>
                <ImageUploadField
                  label="Banner Image"
                  hint="(large header shown at top of screen)"
                  value={(form as any).headerImageUrl ?? ''}
                  storagePath={`nutrition/banner/${goalMeta.key}`}
                  previewShape="wide"
                  onChange={url => upd('headerImageUrl' as any, url)}
                />
                <ImageUploadField
                  label="Icon Image"
                  hint="(small circle on goal selection screen)"
                  value={(form as any).iconImageUrl ?? ''}
                  storagePath={`nutrition/icon/${goalMeta.key}`}
                  previewShape="circle"
                  onChange={url => upd('iconImageUrl' as any, url)}
                />
              </div>

              <div className="flex items-center gap-3">
                <label className="text-sm text-cyber-muted">Visible in app</label>
                <button onClick={() => upd('isPublished', !form.isPublished)}
                  className={`w-11 h-6 rounded-full transition-colors ${form.isPublished ? 'bg-cyber-accent' : 'bg-white/20'}`}>
                  <div className={`w-5 h-5 bg-white rounded-full transition-transform mx-0.5 ${form.isPublished ? 'translate-x-5' : 'translate-x-0'}`} />
                </button>
              </div>
            </>
          )}

          {/* ── Tips Tab ── */}
          {tab === 'tips' && (
            <>
              <div className="space-y-2">
                {form.generalTips.map((tip, i) => (
                  <div key={i} className="flex items-start gap-3 px-4 py-3 rounded-xl bg-white/5 border border-white/8 group">
                    <span className="text-cyber-accent font-black flex-shrink-0">·</span>
                    <span className="flex-1 text-sm text-white">{tip}</span>
                    <button onClick={() => removeTip(i)}
                      className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-300 flex-shrink-0 transition-opacity">
                      <X size={14} />
                    </button>
                  </div>
                ))}
                {form.generalTips.length === 0 && (
                  <p className="text-cyber-muted text-sm text-center py-6">No tips yet — add one below.</p>
                )}
              </div>
              <div className="flex gap-2">
                <input
                  className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white"
                  value={newTip} onChange={e => setNewTip(e.target.value)}
                  placeholder="Add a nutrition tip…"
                  onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addTip() } }}
                />
                <button onClick={addTip}
                  className="px-4 py-2 bg-cyber-accent/20 text-cyber-accent rounded-lg text-sm font-semibold hover:bg-cyber-accent/30">
                  + Add
                </button>
              </div>
            </>
          )}

          {/* ── Meals Tab ── */}
          {tab === 'meals' && (
            <>
              <div className="space-y-3">
                {form.meals.map((m, i) => (
                  <MealEditor key={i} meal={m} mealIdx={i} goalKey={goalMeta.key}
                    onUpdate={updated => updateMeal(i, updated)}
                    onDelete={() => deleteMeal(i)} />
                ))}
                {form.meals.length === 0 && (
                  <p className="text-cyber-muted text-sm text-center py-6">No meals yet — add one below.</p>
                )}
              </div>

              {addingMeal ? (
                <div className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-cyber-muted mb-1">Meal Name *</label>
                      <input className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white"
                        value={newMealName} onChange={e => setNewMealName(e.target.value)}
                        placeholder="e.g. Breakfast" autoFocus />
                    </div>
                    <div>
                      <label className="block text-xs text-cyber-muted mb-1">Time Slot</label>
                      <input className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white"
                        value={newMealTime} onChange={e => setNewMealTime(e.target.value)}
                        placeholder="e.g. 8:00 – 9:00 AM" />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => { setAddingMeal(false); setNewMealName(''); setNewMealTime('') }}
                      className="flex-1 py-2 rounded-lg border border-white/10 text-cyber-muted text-sm">Cancel</button>
                    <button onClick={addMeal} disabled={!newMealName.trim()}
                      className="flex-1 py-2 rounded-lg bg-cyber-accent text-black font-black text-sm disabled:opacity-40">Add Meal</button>
                  </div>
                </div>
              ) : (
                <button onClick={() => setAddingMeal(true)}
                  className="flex items-center gap-2 w-full px-4 py-3 rounded-xl border border-dashed border-white/15 text-cyber-muted hover:text-white hover:border-white/30 text-sm transition-colors">
                  <Plus size={15} /> Add Meal
                </button>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-3 p-6 border-t border-white/8">
          <button onClick={onClose}
            className="flex-1 py-3 rounded-xl border border-white/10 text-cyber-muted hover:text-white text-sm">
            Cancel
          </button>
          <button onClick={handleSave} disabled={saving}
            className="flex-1 py-3 rounded-xl bg-cyber-accent text-black font-black text-sm disabled:opacity-50">
            {saving ? 'Saving…' : 'Save Plan'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function NutritionPage() {
  const [plans,   setPlans]   = useState<AdminNutritionPlan[]>([])
  const [editing, setEditing] = useState<string | null>(null)
  const [toast,   setToast]   = useState('')
  const [seeding, setSeeding] = useState(false)

  useEffect(() => { return dbWatchNutritionPlans(setPlans) }, [])

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 3000) }

  const getPlan = (key: string) => plans.find(p => p.id === key) ?? null

  const handleSave = async (data: Omit<AdminNutritionPlan, 'id' | 'updatedAt'>, id: string) => {
    await dbSaveNutritionPlan(data, id)
    setEditing(null)
    showToast('Plan saved ✓')
  }

  const handleToggle = async (id: string, current: boolean) => {
    await dbToggleNutritionPublished(id, !current)
  }

  const handleSeedDefaults = async () => {
    setSeeding(true)
    try {
      const existing = new Set(plans.map(p => p.id))
      let count = 0
      for (const [id, data] of Object.entries(DEFAULT_NUTRITION_PLANS)) {
        if (!existing.has(id)) {
          await dbSaveNutritionPlan(data, id)
          count++
        }
      }
      showToast(count > 0 ? `Seeded ${count} default plan${count > 1 ? 's' : ''} ✓` : 'All plans already exist ✓')
    } catch (err: unknown) {
      showToast(`Seed failed: ${err instanceof Error ? err.message : String(err)}`)
    } finally {
      setSeeding(false)
    }
  }

  const editingGoal = GOALS.find(g => g.key === editing)

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Toast */}
      {toast && (
        <div className="fixed top-6 right-6 z-50 bg-cyber-accent text-black font-bold px-4 py-3 rounded-xl shadow-lg">
          {toast}
        </div>
      )}

      {/* Modal */}
      {editing && editingGoal && (
        <PlanModal
          plan={getPlan(editing)}
          goalMeta={editingGoal}
          onClose={() => setEditing(null)}
          onSave={handleSave}
        />
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2">
            <Utensils className="text-cyber-accent" size={24} /> Nutrition Plans
          </h1>
          <p className="text-sm text-cyber-muted mt-0.5">
            {plans.length} / 5 plans configured · {plans.filter(p => p.isPublished).length} published
          </p>
        </div>
        <button
          onClick={handleSeedDefaults}
          disabled={seeding}
          className="flex items-center gap-2 px-4 py-2.5 bg-white/5 border border-white/10 text-cyber-muted hover:text-white hover:bg-white/10 font-semibold rounded-xl transition-colors disabled:opacity-50"
        >
          {seeding
            ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            : <Download size={15} />}
          {seeding ? 'Seeding…' : 'Seed Defaults'}
        </button>
      </div>

      {/* Goal cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {GOALS.map(g => {
          const plan = getPlan(g.key)
          const hasData = !!plan
          const mealCount = plan?.meals.length ?? 0
          const itemCount = plan?.meals.reduce((s, m) => s + m.items.length, 0) ?? 0

          return (
            <div
              key={g.key}
              className={`relative flex flex-col gap-4 p-5 rounded-2xl border transition-all ${
                hasData ? `bg-white/4 ${g.border} hover:bg-white/6` : 'bg-white/2 border-white/8 border-dashed opacity-70'
              }`}
            >
              {/* Published badge */}
              {hasData && (
                <button
                  onClick={() => handleToggle(g.key, plan!.isPublished)}
                  title={plan!.isPublished ? 'Hide from app' : 'Publish to app'}
                  className={`absolute top-4 right-4 flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${
                    plan!.isPublished
                      ? 'bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25'
                      : 'bg-white/10 text-cyber-muted hover:bg-white/15'
                  }`}
                >
                  {plan!.isPublished ? <><Eye size={10} /> Live</> : <><EyeOff size={10} /> Hidden</>}
                </button>
              )}

              {/* Title */}
              <div className="flex items-center gap-3">
                <span className="text-3xl">{g.emoji}</span>
                <div>
                  <h3 className={`font-black text-base ${g.color}`}>{g.label}</h3>
                  {hasData
                    ? <p className="text-xs text-cyber-muted">{mealCount} meals · {itemCount} food items</p>
                    : <p className="text-xs text-cyber-muted">Not configured</p>}
                </div>
              </div>

              {/* Macros */}
              {hasData && (
                <div className="grid grid-cols-4 gap-2 text-center">
                  <div className="bg-white/5 rounded-xl py-2">
                    <div className="text-sm font-black text-amber-400">{plan!.dailyCalories}</div>
                    <div className="text-xs text-cyber-muted">kcal</div>
                  </div>
                  <div className="bg-white/5 rounded-xl py-2">
                    <div className="text-sm font-black text-indigo-400">{plan!.proteinG}g</div>
                    <div className="text-xs text-cyber-muted">Protein</div>
                  </div>
                  <div className="bg-white/5 rounded-xl py-2">
                    <div className="text-sm font-black text-emerald-400">{plan!.carbsG}g</div>
                    <div className="text-xs text-cyber-muted">Carbs</div>
                  </div>
                  <div className="bg-white/5 rounded-xl py-2">
                    <div className="text-sm font-black text-yellow-400">{plan!.fatG}g</div>
                    <div className="text-xs text-cyber-muted">Fat</div>
                  </div>
                </div>
              )}

              {/* Meals preview */}
              {hasData && plan!.meals.length > 0 && (
                <div className="space-y-1">
                  {plan!.meals.slice(0, 3).map((m, i) => (
                    <div key={i} className="flex items-center justify-between text-xs">
                      <span className="text-white/80 truncate">{m.name}</span>
                      <span className="text-cyber-muted flex-shrink-0 ml-2">{m.items.length} items</span>
                    </div>
                  ))}
                  {plan!.meals.length > 3 && (
                    <p className="text-xs text-cyber-muted">+{plan!.meals.length - 3} more meals</p>
                  )}
                </div>
              )}

              {/* Edit button */}
              <button
                onClick={() => setEditing(g.key)}
                className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-sm font-semibold text-white transition-colors mt-auto"
              >
                <Pencil size={14} />
                {hasData ? 'Edit Plan' : 'Create Plan'}
              </button>
            </div>
          )
        })}
      </div>

      {/* Info callout */}
      <div className="mt-6 p-4 rounded-xl bg-cyber-accent/5 border border-cyber-accent/20">
        <p className="text-xs text-cyber-muted">
          <span className="text-cyber-accent font-semibold">ℹ️ How it works:</span> Plans saved here are stored in Firestore under{' '}
          <code className="text-cyber-accent bg-black/30 px-1 rounded">nutrition_plans/</code>.
          The Android app reads from Firestore first, falling back to built-in defaults if a plan is not found.
          Click <strong className="text-white">Seed Defaults</strong> to populate all 5 plans with the recommended Indian diet data.
        </p>
      </div>
    </div>
  )
}
