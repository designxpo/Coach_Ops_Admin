'use client'
import { useEffect, useMemo, useState } from 'react'
import {
  Dumbbell, Plus, Search, Trash2, Pencil, X, Save, Loader2, Eye, EyeOff, RefreshCw,
} from 'lucide-react'
import {
  dbWatchExercises, dbSaveExercise, dbDeleteExercise, dbToggleExercisePublished,
  type AdminExercise,
} from '@/lib/db'

const CATEGORIES   = ['STRENGTH', 'YOGA', 'CARDIO', 'HIIT', 'FLEXIBILITY']
const DIFFICULTIES = ['BEGINNER', 'INTERMEDIATE', 'ADVANCED']

const CAT_CLS: Record<string, string> = {
  STRENGTH:    'bg-cyber-purple/20 text-cyber-purple',
  YOGA:        'bg-emerald-400/15 text-emerald-400',
  CARDIO:      'bg-cyber-danger/15 text-cyber-danger',
  HIIT:        'bg-amber-500/20 text-amber-400',
  FLEXIBILITY: 'bg-sky-400/15 text-sky-400',
}
const DIFF_CLS: Record<string, string> = {
  BEGINNER:     'text-emerald-400',
  INTERMEDIATE: 'text-amber-400',
  ADVANCED:     'text-cyber-danger',
}

type Draft = Omit<AdminExercise, 'id' | 'createdAt' | 'updatedAt'>

const EMPTY: Draft = {
  name: '', sanskritName: '', category: 'STRENGTH',
  primaryMuscles: [], secondaryMuscles: [], equipment: '', difficulty: 'BEGINNER',
  suitableFor: [], sets: '', reps: '', tempo: '', rest: '',
  howTo: [], commonErrors: [], benefits: [], bodyEffect: '', caloriesBurned: '',
  muscleEmoji: '💪', estimatedMinutes: 10, imageUrl: '', isPublished: false,
}

const inputCls = 'w-full bg-cyber-bg border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-cyber-muted focus:outline-none focus:border-cyber-purple transition-colors'
const linesToArr = (s: string) => s.split('\n').map(x => x.trim()).filter(Boolean)
const csvToArr   = (s: string) => s.split(',').map(x => x.trim()).filter(Boolean)

function Editor({ initial, id, onClose }: { initial: Draft; id?: string; onClose: () => void }) {
  const [d, setD]       = useState<Draft>(initial)
  const [saving, setSaving] = useState(false)

  function f<K extends keyof Draft>(key: K, value: Draft[K]) { setD(p => ({ ...p, [key]: value })) }

  async function save() {
    if (!d.name.trim()) { alert('Name is required'); return }
    setSaving(true)
    try { await dbSaveExercise({ ...d, name: d.name.trim() }, id); onClose() }
    catch (e: any) { alert(e?.message ?? 'Failed to save'); setSaving(false) }
  }

  const Label = ({ children }: { children: React.ReactNode }) => (
    <label className="text-xs text-cyber-muted block mb-1.5">{children}</label>
  )

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-2xl h-full bg-cyber-bg border-l border-white/10 overflow-y-auto" onClick={e => e.stopPropagation()}>
        {/* Editor header */}
        <div className="sticky top-0 z-10 bg-cyber-bg/95 backdrop-blur border-b border-white/10 px-6 py-4 flex items-center justify-between">
          <h2 className="text-lg font-black text-white">{id ? 'Edit Exercise' : 'New Exercise'}</h2>
          <div className="flex items-center gap-2">
            <button onClick={save} disabled={saving}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-black bg-cyber-purple text-white hover:bg-cyber-purple/80 disabled:opacity-40 transition-all">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save
            </button>
            <button onClick={onClose} className="p-2 rounded-xl text-cyber-muted hover:text-white hover:bg-white/5 transition-all"><X className="w-5 h-5" /></button>
          </div>
        </div>

        <div className="p-6 space-y-5">
          {/* Basics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2"><Label>Name *</Label>
              <input value={d.name} onChange={e => f('name', e.target.value)} placeholder="Barbell Back Squat" className={inputCls} /></div>
            <div><Label>Sanskrit / alt name</Label>
              <input value={d.sanskritName} onChange={e => f('sanskritName', e.target.value)} placeholder="Utkatasana" className={inputCls} /></div>
            <div><Label>Muscle emoji</Label>
              <input value={d.muscleEmoji} onChange={e => f('muscleEmoji', e.target.value)} placeholder="💪" className={inputCls} /></div>
            <div><Label>Category</Label>
              <select value={d.category} onChange={e => f('category', e.target.value)} className={inputCls}>
                {CATEGORIES.map(c => <option key={c} value={c} className="bg-cyber-bg">{c}</option>)}
              </select></div>
            <div><Label>Difficulty</Label>
              <select value={d.difficulty} onChange={e => f('difficulty', e.target.value)} className={inputCls}>
                {DIFFICULTIES.map(c => <option key={c} value={c} className="bg-cyber-bg">{c}</option>)}
              </select></div>
            <div><Label>Equipment</Label>
              <input value={d.equipment} onChange={e => f('equipment', e.target.value)} placeholder="Barbell, rack" className={inputCls} /></div>
            <div><Label>Estimated minutes</Label>
              <input type="number" min={0} value={d.estimatedMinutes} onChange={e => f('estimatedMinutes', parseInt(e.target.value || '0', 10))} className={inputCls} /></div>
          </div>

          {/* Muscles */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div><Label>Primary muscles (comma-separated)</Label>
              <input value={d.primaryMuscles.join(', ')} onChange={e => f('primaryMuscles', csvToArr(e.target.value))} placeholder="Quads, Glutes" className={inputCls} /></div>
            <div><Label>Secondary muscles (comma-separated)</Label>
              <input value={d.secondaryMuscles.join(', ')} onChange={e => f('secondaryMuscles', csvToArr(e.target.value))} placeholder="Hamstrings, Core" className={inputCls} /></div>
            <div className="sm:col-span-2"><Label>Suitable for (comma-separated)</Label>
              <input value={d.suitableFor.join(', ')} onChange={e => f('suitableFor', csvToArr(e.target.value))} placeholder="Weight loss, Muscle gain" className={inputCls} /></div>
          </div>

          {/* Prescription */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div><Label>Sets</Label><input value={d.sets} onChange={e => f('sets', e.target.value)} placeholder="3–4" className={inputCls} /></div>
            <div><Label>Reps</Label><input value={d.reps} onChange={e => f('reps', e.target.value)} placeholder="8–12" className={inputCls} /></div>
            <div><Label>Tempo</Label><input value={d.tempo} onChange={e => f('tempo', e.target.value)} placeholder="2-0-1" className={inputCls} /></div>
            <div><Label>Rest</Label><input value={d.rest} onChange={e => f('rest', e.target.value)} placeholder="90s" className={inputCls} /></div>
          </div>

          {/* Text areas for arrays */}
          <div><Label>How to (one step per line)</Label>
            <textarea value={d.howTo.join('\n')} onChange={e => f('howTo', linesToArr(e.target.value))} rows={4} className={`${inputCls} resize-none`} placeholder={'Set the bar on your traps\nBrace your core\nSquat to depth'} /></div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div><Label>Common errors (one per line)</Label>
              <textarea value={d.commonErrors.join('\n')} onChange={e => f('commonErrors', linesToArr(e.target.value))} rows={3} className={`${inputCls} resize-none`} /></div>
            <div><Label>Benefits (one per line)</Label>
              <textarea value={d.benefits.join('\n')} onChange={e => f('benefits', linesToArr(e.target.value))} rows={3} className={`${inputCls} resize-none`} /></div>
          </div>

          {/* Effect */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div><Label>Body effect</Label><input value={d.bodyEffect} onChange={e => f('bodyEffect', e.target.value)} placeholder="Builds lower-body strength" className={inputCls} /></div>
            <div><Label>Calories burned</Label><input value={d.caloriesBurned} onChange={e => f('caloriesBurned', e.target.value)} placeholder="~8 kcal/min" className={inputCls} /></div>
            <div className="sm:col-span-2"><Label>Image URL</Label><input value={d.imageUrl} onChange={e => f('imageUrl', e.target.value)} placeholder="https://…" className={`${inputCls} font-mono`} /></div>
          </div>

          {/* Published */}
          <label className="flex items-center gap-3 cursor-pointer">
            <button type="button" onClick={() => f('isPublished', !d.isPublished)}
              className={`relative w-12 h-7 rounded-full transition-colors ${d.isPublished ? 'bg-emerald-500' : 'bg-white/10'}`}>
              <span className={`absolute top-1 left-1 w-5 h-5 rounded-full bg-white transition-transform ${d.isPublished ? 'translate-x-5' : ''}`} />
            </button>
            <span className="text-sm text-white font-semibold">{d.isPublished ? 'Published — visible in the app' : 'Draft — hidden from the app'}</span>
          </label>
        </div>
      </div>
    </div>
  )
}

export default function ExercisesPage() {
  const [list,     setList]     = useState<AdminExercise[]>([])
  const [loading,  setLoading]  = useState(true)
  const [search,   setSearch]   = useState('')
  const [cat,      setCat]      = useState<'all' | string>('all')
  const [busy,     setBusy]     = useState<string | null>(null)
  const [editing,  setEditing]  = useState<{ id?: string; draft: Draft } | null>(null)
  const [lastSync, setLastSync] = useState(Date.now())

  useEffect(() => {
    const unsub = dbWatchExercises(l => { setList(l); setLoading(false); setLastSync(Date.now()) })
    return unsub
  }, [])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return list.filter(e => {
      if (cat !== 'all' && e.category !== cat) return false
      if (q && !(`${e.name} ${e.sanskritName} ${(e.primaryMuscles || []).join(' ')}`.toLowerCase().includes(q))) return false
      return true
    })
  }, [list, cat, search])

  const published = list.filter(e => e.isPublished).length

  async function togglePublish(e: AdminExercise) {
    setBusy(e.id)
    try { await dbToggleExercisePublished(e.id, !e.isPublished) }
    finally { setBusy(null) }
  }
  async function handleDelete(e: AdminExercise) {
    if (!confirm(`Delete “${e.name}” permanently?`)) return
    setBusy(e.id)
    try { await dbDeleteExercise(e.id) }
    finally { setBusy(null) }
  }

  return (
    <div className="p-8 max-w-6xl">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2">
            <Dumbbell className="w-6 h-6 text-cyber-accent" />
            Exercise Library
          </h1>
          <p className="text-cyber-muted text-sm mt-1">{list.length} exercises · {published} published — the catalogue coaches build programs from</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-xs text-cyber-muted">
            <RefreshCw className="w-3 h-3" /><span>Live · {loading ? '…' : 'synced'}</span>
          </div>
          <button onClick={() => setEditing({ draft: { ...EMPTY } })}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-cyber-purple text-white text-sm font-black hover:bg-cyber-purple/80 transition-all">
            <Plus className="w-4 h-4" /> New Exercise
          </button>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        {(['all', ...CATEGORIES] as const).map(c => (
          <button key={c} onClick={() => setCat(c)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              cat === c ? 'bg-cyber-purple text-white' : 'bg-white/5 text-cyber-muted hover:text-white'
            }`}>
            {c === 'all' ? `All (${list.length})` : c}
          </button>
        ))}
        <div className="flex-1" />
        <div className="relative">
          <Search className="w-4 h-4 text-cyber-muted absolute left-3 top-1/2 -translate-y-1/2" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search exercises…"
            className="w-56 bg-cyber-bg border border-white/10 rounded-xl pl-9 pr-4 py-2 text-sm text-white placeholder:text-cyber-muted focus:outline-none focus:border-cyber-purple transition-colors" />
        </div>
      </div>

      {/* List */}
      {loading ? (
        <div className="flex items-center justify-center h-40">
          <div className="w-6 h-6 border-2 border-cyber-purple border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-cyber-card rounded-2xl p-12 border border-white/5 text-center">
          <Dumbbell className="w-8 h-8 text-cyber-muted mx-auto mb-3 opacity-30" />
          <div className="text-white font-bold">{list.length === 0 ? 'No exercises yet' : 'Nothing matches'}</div>
          <div className="text-cyber-muted text-sm mt-1">{list.length === 0 ? 'Click “New Exercise” to add your first one.' : 'Try a different search or category.'}</div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {filtered.map(e => (
            <div key={e.id} className="bg-cyber-card rounded-2xl border border-white/5 p-4 flex items-start gap-3">
              <div className="w-11 h-11 rounded-xl bg-white/5 flex items-center justify-center text-xl flex-shrink-0">{e.muscleEmoji || '💪'}</div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-bold text-white truncate">{e.name}</span>
                  {!e.isPublished && <span className="px-1.5 py-0.5 rounded bg-white/10 text-cyber-muted text-[10px] font-bold">DRAFT</span>}
                </div>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${CAT_CLS[e.category] ?? 'bg-white/10 text-cyber-muted'}`}>{e.category}</span>
                  <span className={`text-[10px] font-bold ${DIFF_CLS[e.difficulty] ?? 'text-cyber-muted'}`}>{e.difficulty}</span>
                  {(e.primaryMuscles?.length ?? 0) > 0 && <span className="text-[10px] text-cyber-muted truncate">{e.primaryMuscles.join(', ')}</span>}
                </div>
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                <button onClick={() => togglePublish(e)} disabled={busy === e.id} title={e.isPublished ? 'Unpublish' : 'Publish'}
                  className={`p-1.5 rounded-lg transition-all disabled:opacity-40 ${e.isPublished ? 'text-emerald-400 hover:bg-emerald-400/10' : 'text-cyber-muted hover:text-white hover:bg-white/5'}`}>
                  {e.isPublished ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                </button>
                <button onClick={() => setEditing({ id: e.id, draft: { ...EMPTY, ...e } })} title="Edit"
                  className="p-1.5 rounded-lg text-cyber-muted hover:text-white hover:bg-white/5 transition-all"><Pencil className="w-4 h-4" /></button>
                <button onClick={() => handleDelete(e)} disabled={busy === e.id} title="Delete"
                  className="p-1.5 rounded-lg text-cyber-muted hover:text-cyber-danger hover:bg-cyber-danger/10 transition-all disabled:opacity-40"><Trash2 className="w-4 h-4" /></button>
              </div>
            </div>
          ))}
        </div>
      )}

      {editing && <Editor initial={editing.draft} id={editing.id} onClose={() => setEditing(null)} />}
    </div>
  )
}
