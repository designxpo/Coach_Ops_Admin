'use client'
import { useState, useEffect } from 'react'
import { Check, Key, Flame, Package, Save, Wifi } from 'lucide-react'
import { updatePassword, EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth'
import { auth } from '@/lib/firebase'
import { dbGetConfig, dbSetConfig } from '@/lib/db'
import type { AppConfig } from '@/lib/store'

const DEFAULT_CONFIG: AppConfig = {
  appVersion: '1.0', buildNumber: '1',
  packageName: 'com.aistudio.coachops.abxyzm',
  firebaseProjectId: 'coachops-27a73', firebaseConnected: true,
}

export default function SettingsPage() {
  const [currentPw,   setCurrentPw]   = useState('')
  const [newPw,       setNewPw]       = useState('')
  const [confirmPw,   setConfirmPw]   = useState('')
  const [pwError,     setPwError]     = useState('')
  const [pwSaved,     setPwSaved]     = useState(false)
  const [pwLoading,   setPwLoading]   = useState(false)

  const [config,      setConfig]      = useState<AppConfig>(DEFAULT_CONFIG)
  const [configSaved, setConfigSaved] = useState(false)
  const [configLoading, setConfigLoading] = useState(false)

  useEffect(() => {
    dbGetConfig().then(c => setConfig({ ...DEFAULT_CONFIG, ...c }))
  }, [])

  const savePassword = async () => {
    if (!currentPw || !newPw || !confirmPw) { setPwError('All fields required'); return }
    if (newPw !== confirmPw)               { setPwError('New passwords do not match'); return }
    if (newPw.length < 6)                 { setPwError('Password must be at least 6 characters'); return }

    setPwLoading(true); setPwError('')
    try {
      const user = auth.currentUser!
      const credential = EmailAuthProvider.credential(user.email!, currentPw)
      await reauthenticateWithCredential(user, credential)
      await updatePassword(user, newPw)
      setCurrentPw(''); setNewPw(''); setConfirmPw('')
      setPwSaved(true)
      setTimeout(() => setPwSaved(false), 2500)
    } catch (e: any) {
      const code = e?.code ?? ''
      if (code === 'auth/wrong-password' || code === 'auth/invalid-credential') {
        setPwError('Current password is incorrect')
      } else {
        setPwError('Failed to update password')
      }
    }
    setPwLoading(false)
  }

  const saveConfig = async () => {
    const updated = { ...config, firebaseConnected: config.firebaseProjectId.trim().length > 0 }
    setConfig(updated)
    setConfigLoading(true)
    await dbSetConfig(updated)
    setConfigLoading(false); setConfigSaved(true)
    setTimeout(() => setConfigSaved(false), 2500)
  }

  const isConnected = config.firebaseProjectId.trim().length > 0

  return (
    <div className="p-8 max-w-2xl space-y-6">
      <div className="mb-8">
        <h1 className="text-2xl font-black text-white">Settings</h1>
        <p className="text-cyber-muted text-sm mt-1">Admin account and platform configuration.</p>
      </div>

      {/* Firebase Status */}
      <div className={`rounded-2xl px-5 py-4 flex items-center gap-4 border ${
        isConnected ? 'bg-green-500/10 border-green-500/20' : 'bg-cyber-danger/10 border-cyber-danger/20'
      }`}>
        <Wifi className={`w-5 h-5 flex-shrink-0 ${isConnected ? 'text-green-400' : 'text-cyber-danger'}`} />
        <div>
          <p className={`text-sm font-bold ${isConnected ? 'text-green-400' : 'text-cyber-danger'}`}>
            Firebase {isConnected ? 'Connected' : 'Not Connected'}
          </p>
          <p className="text-xs text-cyber-muted mt-0.5">
            {isConnected ? `Project: ${config.firebaseProjectId} · Data syncs to Firestore` : 'Enter your Firebase Project ID below'}
          </p>
        </div>
      </div>

      {/* App Config */}
      <div className="bg-cyber-card rounded-2xl p-6 border border-white/5">
        <div className="flex items-center gap-2 mb-5">
          <Package className="w-4 h-4 text-cyber-purple" />
          <h2 className="font-bold text-white">App Config</h2>
        </div>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {[
              { label: 'App Version',  key: 'appVersion',   placeholder: '1.0' },
              { label: 'Build Number', key: 'buildNumber',  placeholder: '1'   },
            ].map(({ label, key, placeholder }) => (
              <div key={key}>
                <label className="text-xs font-semibold text-cyber-muted uppercase tracking-wider mb-1.5 block">{label}</label>
                <input type="text" value={(config as any)[key]}
                  onChange={e => setConfig(p => ({ ...p, [key]: e.target.value }))}
                  placeholder={placeholder}
                  className="w-full bg-cyber-elevated border border-white/10 rounded-xl px-4 py-3 text-white placeholder-cyber-muted focus:outline-none focus:border-cyber-purple/50 text-sm"
                />
              </div>
            ))}
          </div>
          <div>
            <label className="text-xs font-semibold text-cyber-muted uppercase tracking-wider mb-1.5 block">Package Name</label>
            <input type="text" value={config.packageName}
              onChange={e => setConfig(p => ({ ...p, packageName: e.target.value }))}
              className="w-full bg-cyber-elevated border border-white/10 rounded-xl px-4 py-3 text-white placeholder-cyber-muted focus:outline-none focus:border-cyber-purple/50 text-sm"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-cyber-muted uppercase tracking-wider mb-1.5 block">Firebase Project ID</label>
            <div className="relative">
              <input type="text" value={config.firebaseProjectId}
                onChange={e => setConfig(p => ({ ...p, firebaseProjectId: e.target.value }))}
                className={`w-full bg-cyber-elevated border rounded-xl px-4 py-3 text-white focus:outline-none text-sm pr-10 ${
                  isConnected ? 'border-green-500/40 focus:border-green-500/60' : 'border-white/10 focus:border-cyber-purple/50'
                }`}
              />
              {isConnected && <Check className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-green-400" />}
            </div>
          </div>
          <button onClick={saveConfig} disabled={configLoading}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition-all disabled:opacity-50 ${
              configSaved ? 'bg-green-500 text-white' : 'bg-cyber-purple hover:bg-cyber-purple/90 text-white'
            }`}
          >
            {configSaved ? <><Check className="w-4 h-4"/> Saved!</> : configLoading ? 'Saving…' : <><Save className="w-4 h-4"/> Save Config</>}
          </button>
        </div>
      </div>

      {/* Change Password via Firebase Auth */}
      <div className="bg-cyber-card rounded-2xl p-6 border border-white/5">
        <div className="flex items-center gap-2 mb-5">
          <Key className="w-4 h-4 text-cyber-purple" />
          <h2 className="font-bold text-white">Change Password</h2>
        </div>
        <div className="space-y-3">
          {[
            { label: 'Current Password', value: currentPw, set: setCurrentPw },
            { label: 'New Password',     value: newPw,     set: setNewPw     },
            { label: 'Confirm New',      value: confirmPw, set: setConfirmPw },
          ].map(({ label, value, set }) => (
            <div key={label}>
              <label className="text-xs font-semibold text-cyber-muted uppercase tracking-wider mb-1.5 block">{label}</label>
              <input type="password" value={value}
                onChange={e => { set(e.target.value); setPwError(''); setPwSaved(false) }}
                className="w-full bg-cyber-elevated border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-cyber-purple/50 text-sm"
              />
            </div>
          ))}
          {pwError && <p className="text-cyber-danger text-xs">{pwError}</p>}
          <button onClick={savePassword} disabled={pwLoading}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition-all disabled:opacity-50 ${
              pwSaved ? 'bg-green-500 text-white' : 'bg-cyber-purple hover:bg-cyber-purple/90 text-white'
            }`}
          >
            {pwSaved ? <><Check className="w-4 h-4"/> Password updated!</> : pwLoading ? 'Updating…' : 'Update Password'}
          </button>
        </div>
      </div>
    </div>
  )
}
