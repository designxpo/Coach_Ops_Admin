'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { signOut } from 'firebase/auth'
import { Settings as SettingsIcon, Save, CheckCircle, Loader2, LogOut, Shield, Database, Package } from 'lucide-react'
import { auth } from '@/lib/firebase'
import { dbGetConfig, dbSetConfig } from '@/lib/db'
import type { AppConfig } from '@/lib/store'

const inputCls = 'w-full bg-cyber-bg border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-cyber-muted focus:outline-none focus:border-cyber-purple transition-colors font-mono'
const readonlyCls = 'w-full bg-white/3 border border-white/5 rounded-xl px-4 py-2.5 text-sm text-cyber-muted font-mono'

export default function SettingsPage() {
  const router = useRouter()
  const [cfg,     setCfg]     = useState<AppConfig | null>(null)
  const [email,   setEmail]   = useState('')
  const [saving,  setSaving]  = useState(false)
  const [saved,   setSaved]   = useState(false)
  const [dirty,   setDirty]   = useState(false)

  useEffect(() => {
    dbGetConfig().then(setCfg)
    setEmail(auth.currentUser?.email ?? '')
  }, [])

  function upd<K extends keyof AppConfig>(key: K, value: AppConfig[K]) {
    setCfg(c => (c ? { ...c, [key]: value } : c))
    setDirty(true); setSaved(false)
  }

  async function save() {
    if (!cfg) return
    setSaving(true)
    try {
      await dbSetConfig(cfg)
      setDirty(false); setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    } finally { setSaving(false) }
  }

  async function logout() {
    await signOut(auth)
    router.replace('/login')
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
            <SettingsIcon className="w-6 h-6 text-cyber-accent" />
            Settings
          </h1>
          <p className="text-cyber-muted text-sm mt-1">Admin account, app metadata and platform connection</p>
        </div>
        <button onClick={save} disabled={saving || !dirty}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-black bg-cyber-purple text-white hover:bg-cyber-purple/80 disabled:opacity-40 transition-all">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : saved ? <CheckCircle className="w-4 h-4" /> : <Save className="w-4 h-4" />}
          {saved ? 'Saved' : 'Save'}
        </button>
      </div>

      <div className="space-y-4">
        {/* Admin account */}
        <div className="bg-cyber-card rounded-2xl border border-white/5 p-6">
          <div className="flex items-center gap-2 mb-4">
            <Shield className="w-4 h-4 text-cyber-accent" />
            <h2 className="text-sm font-bold text-white">Admin Account</h2>
          </div>
          <div className="flex items-center justify-between gap-4">
            <div className="min-w-0">
              <div className="text-sm font-semibold text-white truncate">{email || '—'}</div>
              <div className="text-xs text-cyber-muted">Sole owner · full platform access</div>
            </div>
            <button onClick={logout}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold border border-white/10 text-cyber-muted hover:text-cyber-danger hover:border-cyber-danger/30 transition-all flex-shrink-0">
              <LogOut className="w-3.5 h-3.5" /> Sign out
            </button>
          </div>
          <p className="text-[11px] text-cyber-muted/70 mt-3">
            Change your password from the login screen’s “Forgot password?” link, or in the Firebase Console.
          </p>
        </div>

        {/* App metadata */}
        <div className="bg-cyber-card rounded-2xl border border-white/5 p-6">
          <div className="flex items-center gap-2 mb-4">
            <Package className="w-4 h-4 text-cyber-purple" />
            <h2 className="text-sm font-bold text-white">App Metadata</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-cyber-muted block mb-1.5">Current version name</label>
              <input value={cfg.appVersion} onChange={e => upd('appVersion', e.target.value)} placeholder="1.2.0" className={inputCls} />
            </div>
            <div>
              <label className="text-xs text-cyber-muted block mb-1.5">Build number (versionCode)</label>
              <input value={cfg.buildNumber} onChange={e => upd('buildNumber', e.target.value)} placeholder="4" className={inputCls} />
            </div>
            <div className="sm:col-span-2">
              <label className="text-xs text-cyber-muted block mb-1.5">Package name</label>
              <input value={cfg.packageName} readOnly className={readonlyCls} />
            </div>
          </div>
        </div>

        {/* Platform */}
        <div className="bg-cyber-card rounded-2xl border border-white/5 p-6">
          <div className="flex items-center gap-2 mb-4">
            <Database className="w-4 h-4 text-emerald-400" />
            <h2 className="text-sm font-bold text-white">Platform Connection</h2>
          </div>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-2 h-2 rounded-full bg-emerald-400" />
            <span className="text-sm font-semibold text-emerald-400">Firebase Connected</span>
          </div>
          <div>
            <label className="text-xs text-cyber-muted block mb-1.5">Firebase project</label>
            <input value={cfg.firebaseProjectId} readOnly className={readonlyCls} />
          </div>
        </div>

        <div className="text-xs text-cyber-muted bg-white/3 border border-white/5 rounded-xl px-4 py-3">
          App metadata writes to <span className="font-mono">admin_config/app</span>. Package name and Firebase project are fixed to the production app and shown for reference.
        </div>
      </div>
    </div>
  )
}
