'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { onAuthStateChanged, signOut } from 'firebase/auth'
import { auth } from '@/lib/firebase'
import Sidebar from '@/components/Sidebar'

// Only this email can access the admin panel
const ADMIN_EMAIL = 'priyeshmishraofficial@gmail.com'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async user => {
      if (!user) {
        router.replace('/login')
        return
      }
      if (user.email?.toLowerCase() !== ADMIN_EMAIL.toLowerCase()) {
        // Signed in but not the admin — kick them out immediately
        await signOut(auth)
        router.replace('/login?error=unauthorized')
        return
      }
      setChecking(false)
    })
    return unsub
  }, [router])

  if (checking) {
    return (
      <div className="min-h-screen bg-cyber-bg flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-cyber-purple border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="flex min-h-screen bg-cyber-bg">
      <Sidebar />
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  )
}
