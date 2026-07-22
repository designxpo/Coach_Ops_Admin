'use client'
import { useEffect, useState } from 'react'
import { Database, Download, Loader2, CheckCircle, Dumbbell } from 'lucide-react'
import { dbBulkImportExercises } from '@/lib/db'

interface CatalogItem { id: string; name: string; equipment: string; category: string; imageUrl?: string; gifUrl?: string; [k: string]: unknown }

export default function ExerciseImportPage() {
  const [catalog, setCatalog] = useState<CatalogItem[] | null>(null)
  const [loadErr, setLoadErr] = useState<string | null>(null)
  const [busy,    setBusy]    = useState(false)
  const [done,    setDone]    = useState(0)
  const [total,   setTotal]   = useState(0)
  const [finished, setFinished] = useState(false)

  useEffect(() => {
    fetch('/exercises_catalog.json')
      .then(r => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json() })
      .then((d: CatalogItem[]) => setCatalog(d))
      .catch(e => setLoadErr(String(e)))
  }, [])

  async function runImport() {
    if (!catalog) return
    if (!confirm(`Import ${catalog.length} exercises into the "exercises" collection? Existing docs with the same id are updated (merge).`)) return
    setBusy(true); setFinished(false); setDone(0); setTotal(catalog.length)
    try {
      await dbBulkImportExercises(catalog, (d, t) => { setDone(d); setTotal(t) })
      setFinished(true)
    } catch (e) {
      alert(`Import failed: ${e}`)
    } finally {
      setBusy(false)
    }
  }

  const pct = total > 0 ? Math.round((done / total) * 100) : 0
  const withMedia = catalog?.filter(e => e.imageUrl).length ?? 0

  return (
    <div className="p-8 max-w-3xl">
      <div className="mb-8">
        <h1 className="text-2xl font-black text-white flex items-center gap-2">
          <Database className="w-6 h-6 text-cyber-accent" />
          Exercise Import
        </h1>
        <p className="text-cyber-muted text-sm mt-1">One-click bulk import of the 1,324-exercise catalog into Firestore.</p>
      </div>

      {/* All content here is free to use — no license required */}
      <div className="mb-5 flex items-start gap-2 text-xs bg-emerald-400/10 border border-emerald-400/30 rounded-xl px-4 py-3 text-emerald-200">
        <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0 text-emerald-400" />
        <span>
          Safe to import — everything here is free to use commercially. Exercise <b>data</b>
          (names, muscles, instructions) is MIT-licensed, and the <b>images are from
          free-exercise-db (public domain / Unlicense)</b>, no attribution required.
          Exercises without a matched image show a muscle-group icon instead.
        </span>
      </div>

      <div className="bg-cyber-card rounded-2xl border border-white/5 p-6">
        {loadErr ? (
          <div className="text-sm text-cyber-danger">Couldn’t load catalog: {loadErr}</div>
        ) : !catalog ? (
          <div className="flex items-center gap-2 text-cyber-muted text-sm">
            <Loader2 className="w-4 h-4 animate-spin" /> Loading catalog…
          </div>
        ) : (
          <>
            <div className="grid grid-cols-3 gap-4 mb-5">
              {[
                { label: 'Exercises', value: catalog.length, icon: Dumbbell },
                { label: 'With image', value: withMedia, icon: Download },
                { label: 'Status', value: finished ? 'Imported' : busy ? `${pct}%` : 'Ready', icon: CheckCircle },
              ].map(({ label, value, icon: Icon }) => (
                <div key={label} className="bg-cyber-bg rounded-xl border border-white/5 px-4 py-3">
                  <div className="flex items-center gap-1.5 text-[11px] text-cyber-muted uppercase tracking-wider">
                    <Icon className="w-3 h-3" /> {label}
                  </div>
                  <div className="text-xl font-black text-white mt-1">{value}</div>
                </div>
              ))}
            </div>

            {(busy || finished) && (
              <div className="mb-5">
                <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                  <div className="h-full bg-cyber-accent transition-all" style={{ width: `${finished ? 100 : pct}%` }} />
                </div>
                <div className="text-xs text-cyber-muted mt-1.5">
                  {finished ? `✓ Imported ${total} exercises. They’re live in the app now.` : `Writing ${done} / ${total}…`}
                </div>
              </div>
            )}

            <button onClick={runImport} disabled={busy}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-black bg-cyber-purple text-white hover:bg-cyber-purple/80 disabled:opacity-40 transition-all">
              {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : finished ? <CheckCircle className="w-4 h-4" /> : <Download className="w-4 h-4" />}
              {busy ? 'Importing…' : finished ? 'Re-import' : `Import ${catalog.length} exercises`}
            </button>

            <div className="mt-4 text-xs text-cyber-muted">
              Preview: {catalog.slice(0, 6).map(e => e.name).join(' · ')}…
            </div>
          </>
        )}
      </div>

      <div className="mt-4 text-xs text-cyber-muted bg-white/3 border border-white/5 rounded-xl px-4 py-3">
        Writes to the <span className="font-mono">exercises</span> collection (doc id <span className="font-mono">gv-XXXX</span>).
        The app merges these on top of its built-in library and shows any with <span className="font-mono">isPublished</span> ≠ false.
        You can unpublish or edit individual ones on the <span className="text-white font-semibold">Exercises</span> page.
      </div>
    </div>
  )
}
