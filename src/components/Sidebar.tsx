'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  LayoutDashboard, Bell, ToggleLeft, CreditCard,
  Settings, LogOut, Sliders, Users, SlidersHorizontal, Dumbbell,
} from 'lucide-react'
import { signOut } from 'firebase/auth'
import { auth } from '@/lib/firebase'

const NAV = [
  { href: '/dashboard',               icon: LayoutDashboard,   label: 'Overview'        },
  { href: '/dashboard/app-control',   icon: Sliders,           label: 'App Control'     },
  { href: '/dashboard/users',         icon: Users,             label: 'Users'           },
  { href: '/dashboard/exercises',     icon: Dumbbell,          label: 'Exercises'       },
  { href: '/dashboard/notifications', icon: Bell,              label: 'Notifications'   },
  { href: '/dashboard/features',      icon: ToggleLeft,        label: 'Feature Flags'   },
  { href: '/dashboard/plans',         icon: CreditCard,        label: 'Plans & Pricing' },
  { href: '/dashboard/remote-config', icon: SlidersHorizontal, label: 'Remote Config'   },
  { href: '/dashboard/settings',      icon: Settings,          label: 'Settings'        },
]

export default function Sidebar() {
  const pathname = usePathname()
  const router   = useRouter()

  const logout = async () => {
    await signOut(auth)
    router.replace('/login')
  }

  const email = auth.currentUser?.email ?? ''
  const initials = email ? email[0].toUpperCase() : 'A'

  return (
    <aside className="w-60 min-h-screen bg-cyber-card border-r border-white/5 flex flex-col">
      <div className="p-6 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex-shrink-0 bg-black flex items-center justify-center p-0.5">
            <img src="/coachbase.svg" alt="CoachBase" className="w-full h-full object-contain" />
          </div>
          <div>
            <div className="text-sm font-black text-white">
              Coach<span className="text-[#d7fa00]">Base</span>
            </div>
            <div className="text-xs text-cyber-muted">Admin Panel</div>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {NAV.map(({ href, icon: Icon, label }) => {
          const active = pathname === href
          return (
            <Link key={href} href={href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                active ? 'bg-cyber-purple text-white' : 'text-cyber-muted hover:text-white hover:bg-white/5'
              }`}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              {label}
            </Link>
          )
        })}
      </nav>

      <div className="p-4 border-t border-white/5">
        <div className="flex items-center gap-2 px-3 py-2 mb-2">
          <div className="w-7 h-7 rounded-full bg-cyber-purple/20 flex items-center justify-center text-xs font-bold text-cyber-purple">
            {initials}
          </div>
          <div className="min-w-0">
            <div className="text-xs font-semibold text-white truncate">{email || 'Admin'}</div>
            <div className="text-xs text-cyber-muted">CoachOps Owner</div>
          </div>
        </div>
        <button onClick={logout}
          className="flex items-center gap-2 w-full px-3 py-2 rounded-xl text-sm font-semibold text-cyber-danger hover:bg-cyber-danger/10 transition-all">
          <LogOut className="w-4 h-4" />
          Sign Out
        </button>
      </div>
    </aside>
  )
}
