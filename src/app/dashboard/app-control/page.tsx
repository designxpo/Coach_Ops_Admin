'use client'
import { useEffect, useState } from 'react'
import { Save, AlertTriangle, RefreshCw, Megaphone, Shield } from 'lucide-react'
import { dbGetAppControl, dbSetAppControl, type AppControlConfig } from '@/lib/db'

const DEF: AppControlConfig = {
  maintenanceMode: false,
  maintenanceMessage: "ProCoach India is under maintenance. We'll be back shortly.",
  forceUpdate: false,
  minVersion: '1.0.0',
  updateMessage: 'A new version of ProCoach India is required. Please update from the Play Store.',
  announcementEnabled: false,
  announcementText: '',
  announcementType: 'info',
}

function Toggle({ checked, onChange, danger }: { checked: boolean; onChange: (v: boolean) => void; danger?: boolean }) {
  return (
    <button onClick={() => onChange(!checked)}
      className={`relative w-12 h-6 rounded-full transition-all flex-shrink-0 ${
        checked ? (danger ? 'bg-cyber-danger' : 'bg-cyber-purple') : 'bg-white/10'
      }`}
    >
      <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
        checked ? 'translate-x-6' : 'translate-x-0'
      }`} />
    </button>
  )
}

function Section({ icon: Icon, title, desc, children }: {
  icon: React.ElementType; title: string; desc: string; children: React.ReactNode
}) {
  return (
    <div className="bg-cyber-card rounded-2xl p-6 border border-white/5 space-y-5">
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-xl bg-cyber-purple/15 flex items-center justify-center flex-shrink-0 mt-0.5">
          <Icon className="w-4 h-4 text-cyber-purple" />
        </div>
        <div>
          <h2 className="font-bold text-white text-sm">{title}</h2>
          <p className="text-xs text-cyber-muted mt-0.5">{desc}</p>
        </div>
      </div>
      {children}
    </div>
  )
}

export default function AppControlPage() {
  const [cfg,     setCfg]     = useState<AppControlConfig>(DEF)
  const [loading, setLoading] = useState(true)
  const [saving,  setSaving]  = useState(false)
  const [saved,   setSaved]   = useState(false)

  useEffect(() => {
    dbGetAppControl().then(c => { setCfg(c); setLoading(false) })
  }, [])

  const set = <K extends keyof AppControlConfig>(key: K, val: AppControlConfig[K]) =>
    setCfg(prev => ({ ...prev, [key]: val }))

  const save = async () => {
    setSaving(true)
    await dbSetAppControl(cfg)
    setSaving(false); setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  if (loading) return (
    <div className="p-8 flex items-center justify-center h-64">
      <div className="w-6 h-6 border-2 border-cyber-purple border-t-transparent rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="p-8 max-w-2xl space-y-6">
      <div className="mb-2">
        <h1 className="text-2xl font-black text-white">App Control</h1>
        <p className="text-cyber-muted text-sm mt-1">
          Control the live app without a code release. Changes take effect within seconds.
        </p>
      </div>

      {/* Maintenance Mode */}
      <Section icon={Shield} title="Maintenance Mode"
        desc="Takes the app offline for all users and shows a custom message.">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-semibold text-white">Enable Maintenance Mode</div>
            <div className="text-xs text-cyber-muted mt-0.5">All coaches will see the maintenance screen</div>
          </div>
          <Toggle checked={cfg.maintenanceMode} onChange={v => set('maintenanceMode', v)} danger />
        </div>
        {cfg.maintenanceMode && (
          <div className="flex items-start gap-2 bg-cyber-danger/10 border border-cyber-danger/20 rounded-xl px-4 py-3">
            <AlertTriangle className="w-4 h-4 text-cyber-danger flex-shrink-0 mt-0.5" />
            <p className="text-xs text-cyber-danger font-semibold">
              App is currently offline for all users. Remember to turn this off when done.
            </p>
          </div>
        )}
        <div>
          <label className="text-xs font-semibold text-cyber-muted uppercase tracking-wider mb-2 block">Message shown to users</label>
          <textarea value={cfg.maintenanceMessage}
            onChange={e => set('maintenanceMessage', e.target.value)}
            rows={2}
            className="w-full bg-cyber-elevated border border-white/10 rounded-xl px-4 py-3 text-white placeholder-cyber-muted focus:outline-none focus:border-cyber-purple/50 text-sm resize-none"
          />
        </div>
      </Section>

      {/* Force Update */}
      <Section icon={RefreshCw} title="Force Update"
        desc="Requires coaches to update the app before they can continue using it.">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-semibold text-white">Enable Force Update</div>
            <div className="text-xs text-cyber-muted mt-0.5">Users on older versions must update to proceed</div>
          </div>
          <Toggle checked={cfg.forceUpdate} onChange={v => set('forceUpdate', v)} danger />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-semibold text-cyber-muted uppercase tracking-wider mb-2 block">Minimum Version</label>
            <input value={cfg.minVersion}
              onChange={e => set('minVersion', e.target.value)}
              placeholder="e.g. 1.2.0"
              className="w-full bg-cyber-elevated border border-white/10 rounded-xl px-4 py-3 text-white placeholder-cyber-muted focus:outline-none focus:border-cyber-purple/50 text-sm"
            />
          </div>
          <div className="col-span-2">
            <label className="text-xs font-semibold text-cyber-muted uppercase tracking-wider mb-2 block">Message shown to users</label>
            <textarea value={cfg.updateMessage}
              onChange={e => set('updateMessage', e.target.value)}
              rows={2}
              className="w-full bg-cyber-elevated border border-white/10 rounded-xl px-4 py-3 text-white placeholder-cyber-muted focus:outline-none focus:border-cyber-purple/50 text-sm resize-none"
            />
          </div>
        </div>
      </Section>

      {/* Announcement Banner */}
      <Section icon={Megaphone} title="Announcement Banner"
        desc="Shows a dismissible banner at the top of the app for all coaches.">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-semibold text-white">Show Announcement</div>
            <div className="text-xs text-cyber-muted mt-0.5">Visible to all logged-in coaches</div>
          </div>
          <Toggle checked={cfg.announcementEnabled} onChange={v => set('announcementEnabled', v)} />
        </div>
        <div>
          <label className="text-xs font-semibold text-cyber-muted uppercase tracking-wider mb-2 block">Banner Text</label>
          <input value={cfg.announcementText}
            onChange={e => set('announcementText', e.target.value)}
            placeholder="e.g. New feature: bulk session logging is live!"
            className="w-full bg-cyber-elevated border border-white/10 rounded-xl px-4 py-3 text-white placeholder-cyber-muted focus:outline-none focus:border-cyber-purple/50 text-sm"
          />
        </div>
        <div>
          <label className="text-xs font-semibold text-cyber-muted uppercase tracking-wider mb-2 block">Banner Type</label>
          <div className="flex gap-2">
            {(['info', 'warning', 'success'] as const).map(type => (
              <button key={type} onClick={() => set('announcementType', type)}
                className={`px-4 py-2 rounded-xl text-xs font-bold capitalize transition-all ${
                  cfg.announcementType === type
                    ? type === 'info'    ? 'bg-cyber-purple text-white'
                    : type === 'warning' ? 'bg-amber-500 text-black'
                    :                     'bg-emerald-500 text-black'
                    : 'bg-cyber-elevated text-cyber-muted hover:text-white'
                }`}
              >{type}</button>
            ))}
          </div>
        </div>
        {cfg.announcementEnabled && cfg.announcementText && (
          <div className={`rounded-xl px-4 py-3 text-sm font-semibold ${
            cfg.announcementType === 'info'    ? 'bg-cyber-purple/20 text-cyber-purple border border-cyber-purple/30' :
            cfg.announcementType === 'warning' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                                                 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
          }`}>
            Preview: {cfg.announcementText}
          </div>
        )}
      </Section>

      <button onClick={save} disabled={saving}
        className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition-all disabled:opacity-40 ${
          saved ? 'bg-emerald-500 text-black' : 'bg-cyber-purple hover:bg-cyber-purple/90 text-white'
        }`}
      >
        <Save className="w-4 h-4" />
        {saved ? 'Saved!' : saving ? 'Saving…' : 'Save Changes'}
      </button>
    </div>
  )
}
