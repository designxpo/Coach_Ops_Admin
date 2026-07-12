'use client'

export type Plan = 'STARTER' | 'PRO' | 'BUSINESS'

export interface Feature {
  key: string
  label: string
  description: string
  dangerous?: boolean
  defaultEnabled: boolean
}

export const FEATURES: Feature[] = [
  { key: 'program_timeline', label: 'Program Timeline',   description: 'Daily session tracking per program', defaultEnabled: true },
  { key: 'revenue_chart',    label: 'Revenue Chart',      description: 'MRR trend visualization',            defaultEnabled: true },
  { key: 'measurements',     label: 'Body Measurements',  description: 'Track weight & body fat %',          defaultEnabled: true },
  { key: 'notes',            label: 'Member Notes',       description: 'Quick notes per member',             defaultEnabled: true },
  { key: 'broadcast',        label: 'Broadcast',          description: 'WhatsApp bulk messaging',            defaultEnabled: true },
  { key: 'analytics',        label: 'Analytics',          description: 'Retention & churn insights',         defaultEnabled: true },
  { key: 'maintenance',      label: 'Maintenance Mode',   description: 'Lock app for all users',             defaultEnabled: false, dangerous: true },
  { key: 'force_update',     label: 'Force Update',       description: 'Prompt users to update',             defaultEnabled: false, dangerous: true },
]

// ─── Subscription tiers & per-tier feature matrix ─────────────────────────────
// Coaches sit on STARTER/PRO/BUSINESS; members are FREE or PREMIUM. The matrix
// says which tier unlocks which feature. It writes to admin_config/feature_matrix
// and the app reads + enforces it live — defaults here MUST mirror the app's
// FeatureGate.DEFAULTS so a missing/partial doc changes nothing.

export type MemberTier = 'FREE' | 'PREMIUM'
export const COACH_TIERS: Plan[] = ['STARTER', 'PRO', 'BUSINESS']
export const MEMBER_TIERS: MemberTier[] = ['FREE', 'PREMIUM']

export interface MatrixFeature {
  key: string
  label: string
  description: string
  audience: 'coach' | 'member'
}

export const MATRIX_FEATURES: MatrixFeature[] = [
  { key: 'revenue_analytics',    label: 'Revenue Analytics',    description: 'MRR trend chart & 30-day forecast',            audience: 'coach' },
  { key: 'gym_suite',            label: 'Gym Suite',            description: 'Members, plans, billing & attendance',         audience: 'coach' },
  { key: 'featured_marketplace', label: 'Featured in Discover', description: 'Featured badge + surfaced first in marketplace', audience: 'coach' },
  { key: 'broadcast',            label: 'Broadcast Messaging',  description: 'WhatsApp bulk messaging to all clients',        audience: 'coach' },
  { key: 'ai_nutrition_coach',   label: 'AI Nutrition Coach',   description: 'Chat-based AI nutrition guidance',              audience: 'member' },
  { key: 'ai_meal_planner',      label: 'AI Meal Planner',      description: 'AI meal plans + auto grocery lists',            audience: 'member' },
]

export type FeatureMatrix = Record<string, Record<string, boolean>>

export const DEFAULT_FEATURE_MATRIX: FeatureMatrix = {
  revenue_analytics:    { STARTER: false, PRO: true,  BUSINESS: true },
  gym_suite:            { STARTER: false, PRO: false, BUSINESS: true },
  featured_marketplace: { STARTER: false, PRO: true,  BUSINESS: true },
  broadcast:            { STARTER: true,  PRO: true,  BUSINESS: true },
  ai_nutrition_coach:   { FREE: false, PREMIUM: true },
  ai_meal_planner:      { FREE: false, PREMIUM: true },
}

const DEFAULT_FLAGS: Record<string, boolean> = {
  program_timeline: true,
  revenue_chart: true,
  measurements: true,
  notes: true,
  broadcast: true,
  analytics: true,
  maintenance: false,
  force_update: false,
}

const DEFAULT_PRICES: Record<Plan, number> = {
  STARTER: 0,
  PRO: 999,
  BUSINESS: 2499,
}

export interface AppStats {
  totalCoaches: number
  totalClients: number
  totalMrr: number
  totalSessions: number
  activeToday: number
  lastUpdated?: number
}

export interface AppConfig {
  appVersion: string
  buildNumber: string
  packageName: string
  firebaseConnected: boolean
  firebaseProjectId: string
}

const DEFAULT_STATS: AppStats = {
  totalCoaches: 0, totalClients: 0, totalMrr: 0, totalSessions: 0, activeToday: 0,
}

const DEFAULT_CONFIG: AppConfig = {
  appVersion: '1.0',
  buildNumber: '1',
  packageName: 'com.aistudio.coachops.abxyzm',
  firebaseProjectId: 'coachops-27a73',
  firebaseConnected: true,
}

const STORE_VERSION = 3

function rawGet(key: string) {
  try { return localStorage.getItem(`ca_${key}`) } catch { return null }
}
function rawSet(key: string, value: string) {
  try { localStorage.setItem(`ca_${key}`, value) } catch {}
}

// Run synchronously at module load so pages always read migrated data
function runMigration() {
  if (typeof window === 'undefined') return
  const saved = parseInt(localStorage.getItem('ca_store_version') ?? '0', 10)
  if (saved >= STORE_VERSION) return

  // v1 → v2: wipe old mock stats
  if (saved < 2) {
    const raw = rawGet('stats')
    if (raw) {
      try {
        const p = JSON.parse(raw)
        if (p.totalCoaches === 1 && p.totalClients === 7 && p.totalMrr === 367000) {
          localStorage.removeItem('ca_stats')
        }
      } catch {}
    }
    const rawPlan = rawGet('plan')
    if (rawPlan === '"PRO"') localStorage.removeItem('ca_plan')
  }

  // v2 → v3: seed real Firebase config
  if (saved < 3) {
    const raw = rawGet('app_config')
    const existing: Partial<AppConfig> = raw ? JSON.parse(raw) : {}
    const updated: AppConfig = {
      ...DEFAULT_CONFIG,
      ...existing,
      // Always ensure the real project ID and connected flag
      firebaseProjectId: existing.firebaseProjectId || DEFAULT_CONFIG.firebaseProjectId,
      firebaseConnected: true,
    }
    rawSet('app_config', JSON.stringify(updated))
  }

  localStorage.setItem('ca_store_version', String(STORE_VERSION))
}

// Run immediately when this module is imported on the client
runMigration()

function get<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback
  try {
    const v = localStorage.getItem(`ca_${key}`)
    return v !== null ? JSON.parse(v) : fallback
  } catch { return fallback }
}

function set<T>(key: string, value: T) {
  if (typeof window === 'undefined') return
  localStorage.setItem(`ca_${key}`, JSON.stringify(value))
}

// Auth
export const getPassword  = () => get<string>('password', 'admin123')
export const setPassword  = (p: string) => set('password', p)
export const isLoggedIn   = () => get<boolean>('session', false)
export const setLoggedIn  = (v: boolean) => set('session', v)

// Feature flags
export const getFlags = () => get<Record<string, boolean>>('flags', DEFAULT_FLAGS)
export const setFlag  = (key: string, value: boolean) => {
  const flags = getFlags()
  flags[key] = value
  set('flags', flags)
}

// Plans
export const getCurrentPlan = () => get<Plan>('plan', 'STARTER')
export const setCurrentPlan = (p: Plan) => set('plan', p)
export const getPrices      = () => get<Record<Plan, number>>('prices', DEFAULT_PRICES)
export const setPrices      = (p: Record<Plan, number>) => set('prices', p)

// Notifications
export interface NotifRecord { id: string; title: string; body: string; target: string; sentAt: number; delivered?: number; total?: number }
export const getNotifLog = () => get<NotifRecord[]>('notif_log', [])
export const addNotifLog = (n: NotifRecord) => {
  const log = [n, ...getNotifLog()].slice(0, 20)
  set('notif_log', log)
}

// Stats
export const getStats = () => get<AppStats>('stats', DEFAULT_STATS)
export const setStats = (s: AppStats) => set('stats', { ...s, lastUpdated: Date.now() })

// App config
export const getAppConfig = () => get<AppConfig>('app_config', DEFAULT_CONFIG)
export const setAppConfig = (c: AppConfig) => set('app_config', c)

// Keep export for layout (now a no-op since migration runs at module load)
export function migrateStore() {}
