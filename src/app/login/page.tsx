'use client'
import { Suspense, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { signInWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth'
import { auth } from '@/lib/firebase'

function LoginForm() {
  const router       = useRouter()
  const searchParams = useSearchParams()
  const [email,     setEmail]     = useState('')
  const [password,  setPassword]  = useState('')
  const [error,     setError]     = useState(
    searchParams.get('error') === 'unauthorized'
      ? 'Access denied. This panel is for admins only.'
      : ''
  )
  const [loading,   setLoading]   = useState(false)
  const [resetSent, setResetSent] = useState(false)

  const login = async () => {
    if (!email || !password) { setError('Please fill in all fields'); return }
    setLoading(true); setError('')
    try {
      await signInWithEmailAndPassword(auth, email.trim(), password)
      router.replace('/dashboard')
    } catch (e: any) {
      const code = e?.code ?? ''
      if (['auth/invalid-credential', 'auth/wrong-password', 'auth/user-not-found'].includes(code)) {
        setError('Incorrect email or password')
      } else if (code === 'auth/invalid-email') {
        setError('Please enter a valid email')
      } else if (code === 'auth/too-many-requests') {
        setError('Too many attempts. Try again later.')
      } else {
        setError('Login failed. Check your connection.')
      }
      setLoading(false)
    }
  }

  const resetPassword = async () => {
    if (!email) { setError('Enter your email address first'); return }
    try {
      await sendPasswordResetEmail(auth, email.trim())
      setResetSent(true); setError('')
    } catch { setError('Could not send reset email') }
  }

  return (
    <div className="min-h-screen bg-cyber-bg flex items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-10 gap-4">
          <div className="bg-black rounded-2xl p-3 flex items-center justify-center">
            <img src="/coachbase.svg" alt="CoachBase" className="h-16 w-auto object-contain" />
          </div>
          <div className="text-center">
            <h1 className="text-2xl font-black text-white">
              Coach<span className="text-[#d7fa00]">Base</span> Admin
            </h1>
            <p className="text-sm text-cyber-muted mt-1">Business control panel</p>
          </div>
        </div>

        <div className="bg-cyber-card rounded-3xl p-8 border border-white/5 space-y-4">
          <div>
            <label className="text-xs font-semibold text-cyber-muted uppercase tracking-wider mb-2 block">Email</label>
            <input type="email" value={email}
              onChange={e => { setEmail(e.target.value); setError('') }}
              onKeyDown={e => e.key === 'Enter' && login()}
              placeholder="your@email.com"
              className="w-full bg-cyber-elevated border border-white/10 rounded-xl px-4 py-3 text-white placeholder-cyber-muted focus:outline-none focus:border-cyber-purple/50 text-sm"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-cyber-muted uppercase tracking-wider mb-2 block">Password</label>
            <input type="password" value={password}
              onChange={e => { setPassword(e.target.value); setError('') }}
              onKeyDown={e => e.key === 'Enter' && login()}
              placeholder="••••••••"
              className="w-full bg-cyber-elevated border border-white/10 rounded-xl px-4 py-3 text-white placeholder-cyber-muted focus:outline-none focus:border-cyber-purple/50 text-sm"
            />
          </div>

          {error     && <p className="text-cyber-danger text-xs">{error}</p>}
          {resetSent && <p className="text-green-400 text-xs">Reset link sent — check your inbox.</p>}

          <button onClick={login} disabled={!email || !password || loading}
            className="w-full bg-cyber-purple hover:bg-cyber-purple/90 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold py-3 rounded-xl transition-all text-sm">
            {loading ? 'Signing in…' : 'Sign In'}
          </button>

          <button onClick={resetPassword}
            className="w-full text-cyber-muted hover:text-white text-xs py-1 transition-colors text-center">
            Forgot password?
          </button>
        </div>

        <p className="text-xs text-cyber-muted text-center mt-6">
          Admin access only
        </p>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  )
}
