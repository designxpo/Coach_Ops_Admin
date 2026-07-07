'use client'
import { useEffect, useState } from 'react'
import {
  Sliders, AlertTriangle, Megaphone, DownloadCloud, Save, CheckCircle, Loader2, Power,
} from 'lucide-react'
import { dbWatchAppControl, dbSetAppControl, type AppControlConfig } from '@/lib/db'

const ANNOUNCEMENT_TYPES: { value: AppControlConfig['announcementType']; label: string; cls: string }[] = [
  { value: 'info',    label: 'Info',    cls: 'bg-cyber-purple/20 text-cyber-purple border-cyber-purple' },
  { value: 'warning', label: 'Warning', cls: 'bg-amber-500/20 text-amber-400 border-amber-400' },
  { value: 'success', label: 'Success', cls: 'bg-emerald-500/20 text-emerald-400 border-emerald-400' },
]

function Toggle({ on, onChange, danger }: { on: boolean; onChange: (v: boolean) => void; danger?: boolean }) {
  return (
    <button onClick={() => onChange(!on)}
      className={`relative w-12 h-7 rounded-full transition-colors flex-shrink-0 ${
        on ? (danger ? 'bg-cyber-danger' : 'bg-cyber-purple') : 'bg-white/10'
      }`}>
      <span className={`absolute top-1 left-1 w-5 h-5 rounded-full bg-white transition-transform ${on ? 'translate-x-5' : ''}`} />
    </button>
  )
}

const Field = ({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) => (
  <div>
    <label className="text-xs text-cyber-muted block mb-1.5">{label}</label>
    {children}
    {hint && <p className="text-[11px] text-cyber-muted/70 mt-1">{hint}</p>}
  </div>
)

const inputCls = 'w-full bg-cyber-bg border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-cyber-muted focus:outline-none focus:border-cyber-purple transition-colors'

export default function AppControlPage() {
  const [cfg,     setCfg]     = useState<AppControlConfig | null>(null)
  const [saving,  setSaving]  = useState(false)
  const [saved,   setSaved]   = useState(false)
  const [dirty,   setDirty]   = useState(false)

  useEffect(() => {
    const unsub = dbWatchAppControl(c => { setCfg(prev => (dirty ? prev : c)) })
    return unsub
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dirty])

  function upd<K extends keyof AppControlConfig>(key: K, value: AppControlConfig[K]) {
    setCfg(c => (c ? { ...c, [key]: value } : c))
    setDirty(true); setSaved(false)
  }

  async function save() {
    if (!cfg) return
    setSaving(true)
    try {
      await dbSetAppControl(cfg)
      setDirty(false); setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    } finally { setSaving(false) }
  }

  if (!cfg) {
    return (
      <div className="p-8 flex items-center justify-center h-64">
        <div className="w-6 h-6 border-2 border-cyber-purple border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="p-8 max-w-3xl">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2">
            <Sliders className="w-6 h-6 text-cyber-accent" />
            App Control
          </h1>
          <p className="text-cyber-muted text-sm mt-1">Remotely lock the app, force updates, or broadcast a banner — applies to every user instantly</p>
        </div>
        <button onClick={save} disabled={saving || !dirty}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-black bg-cyber-purple text-white hover:bg-cyber-purple/80 disabled:opacity-40 transition-all">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : saved ? <CheckCircle className="w-4 h-4" /> : <Save className="w-4 h-4" />}
          {saved ? 'Saved' : 'Save Changes'}
        </button>
      </div>

      <div className="space-y-4">
        {/* Maintenance Mode */}
        <div className={`bg-cyber-card rounded-2xl border p-6 ${cfg.maintenanceMode ? 'border-cyber-danger/40' : 'border-white/5'}`}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${cfg.maintenanceMode ? 'bg-cyber-danger/15' : 'bg-white/5'}`}>
                <Power className={`w-4 h-4 ${cfg.maintenanceMode ? 'text-cyber-danger' : 'text-cyber-muted'}`} />
              </div>
              <div>
                <div className="text-sm font-bold text-white">Maintenance Mode</div>
                <div className="text-xs text-cyber-muted">Locks the entire app with your message. Use only during outages.</div>
              </div>
            </div>
            <Toggle on={cfg.maintenanceMode} danger onChange={v => {
              if (v && !confirm('Turn ON maintenance mode? Every user will be locked out of the app until you turn it off.')) return
              upd('maintenanceMode', v)
            }} />
          </div>
          <Field label="Message shown to users">
            <textarea value={cfg.maintenanceMessage} onChange={e => upd('maintenanceMessage', e.target.value)} rows={2} className={`${inputCls} resize-none`} />
          </Field>
        </div>

        {/* Force Update */}
        <div className={`bg-cyber-card rounded-2xl border p-6 ${cfg.forceUpdate ? 'border-amber-400/40' : 'border-white/5'}`}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${cfg.forceUpdate ? 'bg-amber-400/15' : 'bg-white/5'}`}>
                <DownloadCloud className={`w-4 h-4 ${cfg.forceUpdate ? 'text-amber-400' : 'text-cyber-muted'}`} />
              </div>
              <div>
                <div className="text-sm font-bold text-white">Force Update</div>
                <div className="text-xs text-cyber-muted">Block users on builds older than the minimum version until they update.</div>
              </div>
            </div>
            <Toggle on={cfg.forceUpdate} danger onChange={v => upd('forceUpdate', v)} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Field label="Minimum version" hint="e.g. 1.2.0">
              <input value={cfg.minVersion} onChange={e => upd('minVersion', e.target.value)} placeholder="1.2.0" className={`${inputCls} font-mono`} />
            </Field>
            <div className="sm:col-span-2">
              <Field label="Update prompt message">
                <input value={cfg.updateMessage} onChange={e => upd('updateMessage', e.target.value)} className={inputCls} />
              </Field>
            </div>
          </div>
        </div>

        {/* Announcement Banner */}
        <div className="bg-cyber-card rounded-2xl border border-white/5 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${cfg.announcementEnabled ? 'bg-cyber-purple/15' : 'bg-white/5'}`}>
                <Megaphone className={`w-4 h-4 ${cfg.announcementEnabled ? 'text-cyber-purple' : 'text-cyber-muted'}`} />
              </div>
              <div>
                <div className="text-sm font-bold text-white">Announcement Banner</div>
                <div className="text-xs text-cyber-muted">Show a dismissible banner at the top of the app.</div>
              </div>
            </div>
            <Toggle on={cfg.announcementEnabled} onChange={v => upd('announcementEnabled', v)} />
          </div>
          <div className="space-y-4">
            <Field label="Banner text">
              <input value={cfg.announcementText} onChange={e => upd('announcementText', e.target.value)} placeholder="e.g. New nutrition plans just dropped! 🥗" className={inputCls} />
            </Field>
            <Field label="Style">
              <div className="flex gap-2">
                {ANNOUNCEMENT_TYPES.map(t => (
                  <button key={t.value} onClick={() => upd('announcementType', t.value)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all ${
                      cfg.announcementType === t.value ? t.cls : 'border-white/10 text-cyber-muted hover:text-white'
                    }`}>{t.label}</button>
                ))}
              </div>
            </Field>
            {cfg.announcementEnabled && cfg.announcementText && (
              <div>
                <p className="text-[11px] text-cyber-muted mb-1.5">Live preview</p>
                <div className={`flex items-center gap-2 px-4 py-3 rounded-xl border text-sm font-medium ${
                  ANNOUNCEMENT_TYPES.find(t => t.value === cfg.announcementType)?.cls
                }`}>
                  <Megaphone className="w-4 h-4 flex-shrink-0" />
                  {cfg.announcementText}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-start gap-2 text-xs text-cyber-muted bg-white/3 border border-white/5 rounded-xl px-4 py-3">
          <AlertTriangle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0 text-amber-400" />
          <span>These controls write to <span className="font-mono">admin_config/app_control</span> in Firestore and take effect the next time each app checks in. Maintenance mode and force update affect <b>all users</b> — use with care.</span>
        </div>
      </div>
    </div>
  )
}
