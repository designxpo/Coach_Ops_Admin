'use client'
import { useEffect, useRef, useState } from 'react'
import {
  dbWatchExercises, dbSaveExercise, dbDeleteExercise, dbToggleExercisePublished,
  type AdminExercise,
} from '@/lib/db'
import { DEFAULT_EXERCISES } from '@/lib/exerciseSeed'
import { uploadExerciseImage } from '@/lib/supabase'
import {
  Dumbbell, Plus, Pencil, Trash2, Eye, EyeOff,
  ChevronDown, Search, X, Check, Download, Upload,
} from 'lucide-react'

// ─── Constants ────────────────────────────────────────────────────────────────

const CATEGORIES  = ['STRENGTH', 'YOGA', 'CARDIO', 'HIIT', 'FLEXIBILITY']
const DIFFICULTIES = ['BEGINNER', 'INTERMEDIATE', 'ADVANCED']
const EQUIPMENTS  = ['BODYWEIGHT', 'BARBELL', 'DUMBBELL', 'KETTLEBELL', 'CABLE', 'MACHINE', 'RESISTANCE_BAND', 'MAT', 'PULL_UP_BAR']
const MUSCLES     = ['CHEST', 'BACK', 'SHOULDERS', 'BICEPS', 'TRICEPS', 'FOREARMS', 'CORE', 'QUADS', 'HAMSTRINGS', 'GLUTES', 'CALVES', 'FULL_BODY', 'HIP_FLEXORS', 'SPINE']
const GOALS       = ['BUILD_MUSCLE', 'LOSE_FAT', 'IMPROVE_CARDIO', 'IMPROVE_FLEXIBILITY', 'GENERAL_FITNESS']

const CAT_COLORS: Record<string, string> = {
  STRENGTH: 'bg-indigo-500/20 text-indigo-300',
  YOGA: 'bg-emerald-500/20 text-emerald-300',
  CARDIO: 'bg-amber-500/20 text-amber-300',
  HIIT: 'bg-red-500/20 text-red-300',
  FLEXIBILITY: 'bg-violet-500/20 text-violet-300',
}
const DIFF_COLORS: Record<string, string> = {
  BEGINNER: 'bg-emerald-500/20 text-emerald-300',
  INTERMEDIATE: 'bg-amber-500/20 text-amber-300',
  ADVANCED: 'bg-red-500/20 text-red-300',
}

const EMPTY_EXERCISE: Omit<AdminExercise, 'id' | 'createdAt' | 'updatedAt'> = {
  name: '', sanskritName: '', category: 'STRENGTH',
  primaryMuscles: [], secondaryMuscles: [], equipment: 'BODYWEIGHT',
  difficulty: 'BEGINNER', suitableFor: [],
  sets: '3–4 sets', reps: '10–15 reps', tempo: '2-1-2-0', rest: '60 sec',
  howTo: [], commonErrors: [], benefits: [],
  bodyEffect: '', caloriesBurned: '', muscleEmoji: '💪',
  estimatedMinutes: 20, imageUrl: '', isPublished: true,
}

// ─── Helper ───────────────────────────────────────────────────────────────────

function Badge({ text, colorClass }: { text: string; colorClass: string }) {
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${colorClass}`}>{text}</span>
  )
}

function TagInput({ label, values, onChange }: { label: string; values: string[]; onChange: (v: string[]) => void }) {
  const [input, setInput] = useState('')
  const add = () => {
    const v = input.trim()
    if (v && !values.includes(v)) { onChange([...values, v]); setInput('') }
  }
  return (
    <div>
      <label className="block text-xs text-cyber-muted mb-1">{label}</label>
      <div className="flex flex-wrap gap-1 mb-1">
        {values.map(v => (
          <span key={v} className="flex items-center gap-1 text-xs bg-white/10 rounded px-2 py-0.5">
            {v}
            <X className="w-3 h-3 cursor-pointer" onClick={() => onChange(values.filter(x => x !== v))} />
          </span>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white"
          placeholder="Type and press Enter"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); add() } }}
        />
        <button onClick={add} className="px-3 py-2 bg-cyber-accent/20 text-cyber-accent rounded-lg text-sm">+</button>
      </div>
    </div>
  )
}

function MultiSelect({ label, options, selected, onChange }: {
  label: string; options: string[]; selected: string[]; onChange: (v: string[]) => void
}) {
  const toggle = (opt: string) =>
    onChange(selected.includes(opt) ? selected.filter(x => x !== opt) : [...selected, opt])
  return (
    <div>
      <label className="block text-xs text-cyber-muted mb-1">{label}</label>
      <div className="flex flex-wrap gap-1">
        {options.map(opt => (
          <button
            key={opt}
            onClick={() => toggle(opt)}
            className={`text-xs px-2 py-1 rounded-full border transition-colors ${
              selected.includes(opt)
                ? 'border-cyber-accent bg-cyber-accent/20 text-cyber-accent'
                : 'border-white/10 text-cyber-muted hover:border-white/30'
            }`}
          >
            {opt}
          </button>
        ))}
      </div>
    </div>
  )
}

function TextAreaArray({ label, values, onChange }: {
  label: string; values: string[]; onChange: (v: string[]) => void
}) {
  const text = values.join('\n')
  return (
    <div>
      <label className="block text-xs text-cyber-muted mb-1">{label} <span className="opacity-50">(one per line)</span></label>
      <textarea
        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white resize-none"
        rows={4}
        value={text}
        onChange={e => onChange(e.target.value.split('\n').filter(Boolean))}
      />
    </div>
  )
}

// ─── Exercise Form Modal ──────────────────────────────────────────────────────

function ExerciseModal({
  exercise, onClose, onSave,
}: {
  exercise: Partial<AdminExercise> | null
  onClose: () => void
  onSave: (data: Omit<AdminExercise, 'id' | 'createdAt' | 'updatedAt'>, id?: string) => Promise<void>
}) {
  const [form, setForm] = useState<Omit<AdminExercise, 'id' | 'createdAt' | 'updatedAt'>>({
    ...EMPTY_EXERCISE,
    ...(exercise ? {
      name: exercise.name ?? '',
      sanskritName: exercise.sanskritName ?? '',
      category: exercise.category ?? 'STRENGTH',
      primaryMuscles: exercise.primaryMuscles ?? [],
      secondaryMuscles: exercise.secondaryMuscles ?? [],
      equipment: exercise.equipment ?? 'BODYWEIGHT',
      difficulty: exercise.difficulty ?? 'BEGINNER',
      suitableFor: exercise.suitableFor ?? [],
      sets: exercise.sets ?? '3–4 sets',
      reps: exercise.reps ?? '10–15 reps',
      tempo: exercise.tempo ?? '2-1-2-0',
      rest: exercise.rest ?? '60 sec',
      howTo: exercise.howTo ?? [],
      commonErrors: exercise.commonErrors ?? [],
      benefits: exercise.benefits ?? [],
      bodyEffect: exercise.bodyEffect ?? '',
      caloriesBurned: exercise.caloriesBurned ?? '',
      muscleEmoji: exercise.muscleEmoji ?? '💪',
      estimatedMinutes: exercise.estimatedMinutes ?? 20,
      imageUrl: exercise.imageUrl ?? '',
      isPublished: exercise.isPublished ?? true,
    } : {}),
  })
  const [saving,      setSaving]      = useState(false)
  const [uploading,   setUploading]   = useState(false)
  const [uploadError, setUploadError] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const set = (key: keyof typeof form, value: unknown) =>
    setForm(f => ({ ...f, [key]: value }))

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadError('')
    setUploading(true)
    try {
      // Use exercise name as ID slug, or timestamp as fallback
      const id = form.name.trim().toLowerCase().replace(/\s+/g, '_') || Date.now().toString()
      const url = await uploadExerciseImage(file, id)
      set('imageUrl', url)
    } catch (err: unknown) {
      setUploadError(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const handleSave = async () => {
    if (!form.name.trim()) return
    setSaving(true)
    try { await onSave(form, (exercise as AdminExercise)?.id) } finally { setSaving(false) }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/70 overflow-y-auto p-4">
      <div className="w-full max-w-2xl bg-[#1a1a2e] border border-white/10 rounded-2xl p-6 my-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-black text-white">
            {(exercise as AdminExercise)?.id ? 'Edit Exercise' : 'Add New Exercise'}
          </h2>
          <button onClick={onClose} className="text-cyber-muted hover:text-white"><X /></button>
        </div>

        <div className="space-y-5">
          {/* Basic info */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-cyber-muted mb-1">Exercise Name *</label>
              <input
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white"
                value={form.name} onChange={e => set('name', e.target.value)}
                placeholder="e.g. Push-Up"
              />
            </div>
            <div>
              <label className="block text-xs text-cyber-muted mb-1">Sanskrit Name (Yoga)</label>
              <input
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white"
                value={form.sanskritName} onChange={e => set('sanskritName', e.target.value)}
                placeholder="e.g. Bhujangasana"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-xs text-cyber-muted mb-1">Category</label>
              <select className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white"
                value={form.category} onChange={e => set('category', e.target.value)}>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-cyber-muted mb-1">Difficulty</label>
              <select className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white"
                value={form.difficulty} onChange={e => set('difficulty', e.target.value)}>
                {DIFFICULTIES.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-cyber-muted mb-1">Equipment</label>
              <select className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white"
                value={form.equipment} onChange={e => set('equipment', e.target.value)}>
                {EQUIPMENTS.map(e => <option key={e} value={e}>{e}</option>)}
              </select>
            </div>
          </div>

          <MultiSelect label="Primary Muscles" options={MUSCLES} selected={form.primaryMuscles}
            onChange={v => set('primaryMuscles', v)} />
          <MultiSelect label="Secondary Muscles" options={MUSCLES} selected={form.secondaryMuscles}
            onChange={v => set('secondaryMuscles', v)} />
          <MultiSelect label="Suitable For (Goals)" options={GOALS} selected={form.suitableFor}
            onChange={v => set('suitableFor', v)} />

          {/* Prescription */}
          <div className="grid grid-cols-4 gap-3">
            {(['sets', 'reps', 'tempo', 'rest'] as const).map(field => (
              <div key={field}>
                <label className="block text-xs text-cyber-muted mb-1 capitalize">{field}</label>
                <input
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white"
                  value={form[field] as string}
                  onChange={e => set(field, e.target.value)}
                />
              </div>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-cyber-muted mb-1">Estimated Minutes</label>
              <input type="number" className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white"
                value={form.estimatedMinutes} onChange={e => set('estimatedMinutes', +e.target.value)} />
            </div>
            <div>
              <label className="block text-xs text-cyber-muted mb-1">Calories Burned</label>
              <input className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white"
                value={form.caloriesBurned} onChange={e => set('caloriesBurned', e.target.value)}
                placeholder="~7–10 kcal/min" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-cyber-muted mb-1">Muscle Emoji</label>
              <input className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white"
                value={form.muscleEmoji} onChange={e => set('muscleEmoji', e.target.value)} />
            </div>
            <div>
              <label className="block text-xs text-cyber-muted mb-1">
                Exercise Image <span className="opacity-50">(upload or paste URL · max 5 MB)</span>
              </label>
              {/* Hidden file input */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleImageUpload}
              />
              <div className="flex gap-2">
                <input
                  className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white"
                  value={form.imageUrl}
                  onChange={e => set('imageUrl', e.target.value)}
                  placeholder="https://images.unsplash.com/... or upload →"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="flex items-center gap-1.5 px-3 py-2 bg-cyber-accent/20 hover:bg-cyber-accent/30 text-cyber-accent rounded-lg text-xs font-semibold disabled:opacity-50 transition-colors whitespace-nowrap"
                >
                  <Upload size={13} />
                  {uploading ? 'Uploading…' : 'Upload'}
                </button>
              </div>
              {uploadError && (
                <p className="text-xs text-red-400 mt-1">{uploadError}</p>
              )}
              {form.imageUrl && !uploading && (
                <img
                  src={form.imageUrl}
                  alt="preview"
                  className="mt-2 h-24 w-full object-cover rounded-lg opacity-80"
                  onError={e => { (e.target as HTMLImageElement).style.display = 'none' }}
                />
              )}
            </div>
          </div>

          <TextAreaArray label="How To (steps)" values={form.howTo} onChange={v => set('howTo', v)} />
          <TextAreaArray label="Common Errors" values={form.commonErrors} onChange={v => set('commonErrors', v)} />
          <TextAreaArray label="Benefits" values={form.benefits} onChange={v => set('benefits', v)} />

          <div>
            <label className="block text-xs text-cyber-muted mb-1">Body Effect (physiology explanation)</label>
            <textarea
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white resize-none"
              rows={3} value={form.bodyEffect} onChange={e => set('bodyEffect', e.target.value)}
            />
          </div>

          <div className="flex items-center gap-3">
            <label className="text-sm text-cyber-muted">Published (visible in app)</label>
            <button
              onClick={() => set('isPublished', !form.isPublished)}
              className={`w-11 h-6 rounded-full transition-colors ${form.isPublished ? 'bg-cyber-accent' : 'bg-white/20'}`}
            >
              <div className={`w-5 h-5 bg-white rounded-full transition-transform mx-0.5 ${form.isPublished ? 'translate-x-5' : 'translate-x-0'}`} />
            </button>
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className="flex-1 py-3 rounded-xl border border-white/10 text-cyber-muted hover:text-white text-sm">
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !form.name.trim()}
            className="flex-1 py-3 rounded-xl bg-cyber-accent text-black font-black text-sm disabled:opacity-50"
          >
            {saving ? 'Saving…' : 'Save Exercise'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function ExercisesPage() {
  const [exercises, setExercises] = useState<AdminExercise[]>([])
  const [search, setSearch] = useState('')
  const [catFilter, setCatFilter] = useState<string | null>(null)
  const [editTarget, setEditTarget] = useState<Partial<AdminExercise> | null | 'new'>(null)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [toast, setToast] = useState('')
  const [seeding, setSeeding] = useState(false)

  useEffect(() => {
    return dbWatchExercises(setExercises)
  }, [])

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 3000) }

  const filtered = exercises.filter(ex => {
    const matchCat = !catFilter || ex.category === catFilter
    const matchSearch = !search || ex.name.toLowerCase().includes(search.toLowerCase())
    return matchCat && matchSearch
  })

  const handleSave = async (data: Omit<AdminExercise, 'id' | 'createdAt' | 'updatedAt'>, id?: string) => {
    await dbSaveExercise(data, id)
    setEditTarget(null)
    showToast(id ? 'Exercise updated ✓' : 'Exercise added ✓')
  }

  const handleDelete = async (id: string) => {
    setDeleting(id)
    await dbDeleteExercise(id)
    setDeleting(null)
    showToast('Exercise deleted')
  }

  const handleToggle = async (ex: AdminExercise) => {
    await dbToggleExercisePublished(ex.id, !ex.isPublished)
  }

  const handleSeedDefaults = async () => {
    setSeeding(true)
    try {
      const existingIds = new Set(exercises.map(e => e.id))
      const toSeed = DEFAULT_EXERCISES.filter(e => !existingIds.has(e.id))
      if (toSeed.length === 0) {
        showToast('All default exercises already exist ✓')
        return
      }
      for (const ex of toSeed) {
        const { id, ...data } = ex
        await dbSaveExercise(data, id)
      }
      showToast(`Seeded ${toSeed.length} default exercises ✓`)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      showToast(`Seed failed: ${msg}`)
    } finally {
      setSeeding(false)
    }
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Toast */}
      {toast && (
        <div className="fixed top-6 right-6 z-50 bg-cyber-accent text-black font-bold px-4 py-3 rounded-xl shadow-lg">
          {toast}
        </div>
      )}

      {/* Modal */}
      {editTarget !== null && (
        <ExerciseModal
          exercise={editTarget === 'new' ? null : editTarget}
          onClose={() => setEditTarget(null)}
          onSave={handleSave}
        />
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2">
            <Dumbbell className="text-cyber-accent" size={24} /> Exercise Library
          </h1>
          <p className="text-sm text-cyber-muted mt-0.5">
            {exercises.length} exercises · {exercises.filter(e => e.isPublished).length} published
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* Seed default exercises button */}
          <button
            onClick={handleSeedDefaults}
            disabled={seeding}
            title="Load all 22 hardcoded default exercises into Firestore (skips existing)"
            className="flex items-center gap-2 px-4 py-2.5 bg-white/5 border border-white/10 text-cyber-muted hover:text-white hover:bg-white/10 font-semibold rounded-xl transition-colors disabled:opacity-50"
          >
            {seeding
              ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              : <Download size={15} />}
            {seeding ? 'Seeding…' : 'Seed Defaults'}
          </button>
        <button
          onClick={() => setEditTarget('new')}
          className="flex items-center gap-2 px-4 py-2.5 bg-cyber-accent text-black font-black rounded-xl hover:bg-cyber-accent/90 transition-colors"
        >
          <Plus size={16} /> Add Exercise
        </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-5">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-cyber-muted w-4 h-4" />
          <input
            className="pl-9 pr-4 py-2 bg-white/5 border border-white/10 rounded-xl text-sm text-white w-56"
            placeholder="Search exercises…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setCatFilter(null)}
            className={`px-3 py-2 rounded-xl text-xs font-semibold border transition-colors ${
              !catFilter ? 'bg-cyber-accent/20 border-cyber-accent text-cyber-accent' : 'border-white/10 text-cyber-muted'
            }`}
          >
            All
          </button>
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setCatFilter(catFilter === cat ? null : cat)}
              className={`px-3 py-2 rounded-xl text-xs font-semibold border transition-colors ${
                catFilter === cat ? 'bg-cyber-accent/20 border-cyber-accent text-cyber-accent' : 'border-white/10 text-cyber-muted'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Exercise list */}
      <div className="space-y-2">
        {filtered.length === 0 && (
          <div className="text-center py-16 text-cyber-muted">
            <Dumbbell size={40} className="mx-auto mb-3 opacity-30" />
            <p className="font-semibold">No exercises found</p>
            <p className="text-xs mt-1">Add your first exercise to get started</p>
          </div>
        )}
        {filtered.map(ex => (
          <div
            key={ex.id}
            className={`flex items-center gap-4 p-4 rounded-xl border transition-colors ${
              ex.isPublished
                ? 'bg-white/5 border-white/8 hover:bg-white/8'
                : 'bg-white/2 border-white/4 opacity-60'
            }`}
          >
            {/* Image */}
            <div className="w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 bg-white/10 flex items-center justify-center">
              {ex.imageUrl
                ? <img src={ex.imageUrl} alt={ex.name} className="w-full h-full object-cover" />
                : <span className="text-2xl">{ex.muscleEmoji}</span>
              }
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-black text-white truncate">{ex.name}</span>
                {ex.sanskritName && <span className="text-xs text-cyber-muted">({ex.sanskritName})</span>}
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <Badge text={ex.category} colorClass={CAT_COLORS[ex.category] ?? 'bg-white/10 text-white'} />
                <Badge text={ex.difficulty} colorClass={DIFF_COLORS[ex.difficulty] ?? 'bg-white/10 text-white'} />
                <span className="text-xs text-cyber-muted">{ex.equipment}</span>
                <span className="text-xs text-cyber-muted">·</span>
                <span className="text-xs text-cyber-muted">{ex.estimatedMinutes} min</span>
                <span className="text-xs text-cyber-muted">·</span>
                <span className="text-xs text-cyber-muted">{ex.primaryMuscles.join(', ')}</span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleToggle(ex)}
                title={ex.isPublished ? 'Hide from app' : 'Publish to app'}
                className={`p-2 rounded-lg transition-colors ${
                  ex.isPublished
                    ? 'text-emerald-400 bg-emerald-400/10 hover:bg-emerald-400/20'
                    : 'text-cyber-muted bg-white/5 hover:bg-white/10'
                }`}
              >
                {ex.isPublished ? <Eye size={15} /> : <EyeOff size={15} />}
              </button>
              <button
                onClick={() => setEditTarget(ex)}
                className="p-2 rounded-lg text-cyber-accent bg-cyber-accent/10 hover:bg-cyber-accent/20 transition-colors"
              >
                <Pencil size={15} />
              </button>
              <button
                onClick={() => handleDelete(ex.id)}
                disabled={deleting === ex.id}
                className="p-2 rounded-lg text-red-400 bg-red-400/10 hover:bg-red-400/20 transition-colors disabled:opacity-50"
              >
                <Trash2 size={15} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
