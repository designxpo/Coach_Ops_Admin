import {
  doc, getDoc, setDoc, collection,
  query, orderBy, limit, getDocs, addDoc, deleteDoc,
  onSnapshot, writeBatch, type Unsubscribe,
} from 'firebase/firestore'
import { db } from './firebase'
import type { Plan, AppStats, AppConfig, NotifRecord, FeatureMatrix } from './store'
import { DEFAULT_FEATURE_MATRIX } from './store'

// ─── Firestore collection paths ──────────────────────────────────────────────
const CFG  = (name: string) => doc(db, 'admin_config', name)
const NOTIF = () => collection(db, 'notifications')
const TEMPLATES = () => collection(db, 'notification_templates')
const USER_RECORDS = () => collection(db, 'user_records')

// ─── Default values ───────────────────────────────────────────────────────────
const DEF_FLAGS: Record<string, boolean> = {
  program_timeline: true, revenue_chart: true, measurements: true,
  notes: true, broadcast: true, analytics: true,
  maintenance: false, force_update: false,
}
const DEF_PRICES: Record<Plan, number> = { STARTER: 0, PRO: 999, BUSINESS: 2499 }
const DEF_STATS: AppStats = { totalCoaches: 0, totalClients: 0, totalMrr: 0, totalSessions: 0, activeToday: 0 }
const DEF_CONFIG: AppConfig = {
  appVersion: '1.0', buildNumber: '1',
  packageName: 'com.aistudio.coachops.abxyzm',
  firebaseProjectId: 'coachops-27a73', firebaseConnected: true,
}

// ─── Feature Flags ────────────────────────────────────────────────────────────
export async function dbGetFlags(): Promise<Record<string, boolean>> {
  const snap = await getDoc(CFG('flags'))
  return snap.exists() ? (snap.data() as Record<string, boolean>) : DEF_FLAGS
}
export async function dbSetFlag(key: string, value: boolean) {
  const snap = await getDoc(CFG('flags'))
  const current = snap.exists() ? snap.data() : DEF_FLAGS
  await setDoc(CFG('flags'), { ...current, [key]: value })
}
export function dbWatchFlags(cb: (f: Record<string, boolean>) => void): Unsubscribe {
  return onSnapshot(CFG('flags'), snap =>
    cb(snap.exists() ? (snap.data() as Record<string, boolean>) : DEF_FLAGS)
  )
}

// ─── Plans & Prices ───────────────────────────────────────────────────────────
// Coach tier prices + member Premium price. The app reads memberPremiumMonthly/
// Yearly live in the paywall, so changing them here updates the in-app price.
export interface PlansConfig {
  currentPlan: Plan
  prices: Record<Plan, number>
  memberPremiumMonthly: number
  memberPremiumYearly: number
}
const DEF_PLANS: PlansConfig = {
  currentPlan: 'STARTER', prices: DEF_PRICES,
  memberPremiumMonthly: 199, memberPremiumYearly: 999,
}
export async function dbGetPlans(): Promise<PlansConfig> {
  const snap = await getDoc(CFG('plans'))
  return snap.exists() ? { ...DEF_PLANS, ...(snap.data() as Partial<PlansConfig>) } : DEF_PLANS
}
export async function dbSetPlans(data: PlansConfig) {
  await setDoc(CFG('plans'), data)
}
export function dbWatchPlans(cb: (d: PlansConfig) => void): Unsubscribe {
  return onSnapshot(CFG('plans'), snap =>
    cb(snap.exists() ? { ...DEF_PLANS, ...(snap.data() as Partial<PlansConfig>) } : DEF_PLANS)
  )
}

// ─── Stats ────────────────────────────────────────────────────────────────────
export async function dbGetStats(): Promise<AppStats> {
  const snap = await getDoc(CFG('stats'))
  return snap.exists() ? (snap.data() as AppStats) : DEF_STATS
}
export async function dbSetStats(stats: AppStats) {
  await setDoc(CFG('stats'), { ...stats, lastUpdated: Date.now() })
}
export function dbWatchStats(cb: (s: AppStats) => void): Unsubscribe {
  return onSnapshot(CFG('stats'), snap => cb(snap.exists() ? (snap.data() as AppStats) : DEF_STATS))
}

// ─── App Config ───────────────────────────────────────────────────────────────
export async function dbGetConfig(): Promise<AppConfig> {
  const snap = await getDoc(CFG('app'))
  return snap.exists() ? (snap.data() as AppConfig) : DEF_CONFIG
}
export async function dbSetConfig(config: AppConfig) {
  await setDoc(CFG('app'), config)
}

// ─── Notifications ────────────────────────────────────────────────────────────
export async function dbGetNotifications(): Promise<NotifRecord[]> {
  const q = query(NOTIF(), orderBy('sentAt', 'desc'), limit(20))
  const snap = await getDocs(q)
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as NotifRecord))
}
export async function dbAddNotification(record: Omit<NotifRecord, 'id'>) {
  await addDoc(NOTIF(), record)
}
export function dbWatchNotifications(cb: (n: NotifRecord[]) => void): Unsubscribe {
  const q = query(NOTIF(), orderBy('sentAt', 'desc'), limit(20))
  return onSnapshot(q, snap =>
    cb(snap.docs.map(d => ({ id: d.id, ...d.data() } as NotifRecord)))
  )
}

// ─── App Control (maintenance mode, force update, announcement banner) ────────

export interface AppControlConfig {
  maintenanceMode: boolean
  maintenanceMessage: string
  forceUpdate: boolean
  minVersion: string
  updateMessage: string
  announcementEnabled: boolean
  announcementText: string
  announcementType: 'info' | 'warning' | 'success'
  // Version-count update gate — the app compares its own versionCode to this.
  latestVersionCode: number       // newest versionCode on Play (0 = gate off)
  updateNudgeEnabled: boolean      // dismissible "update available" banner
  compulsoryUpdateAfter: number    // behind by MORE than this ⇒ blocking update sheet
}

const DEF_APP_CONTROL: AppControlConfig = {
  maintenanceMode: false,
  maintenanceMessage: 'ProCoach India is under maintenance. We\'ll be back shortly.',
  forceUpdate: false,
  minVersion: '1.0.0',
  updateMessage: 'A new version of ProCoach India is required. Please update from the Play Store.',
  announcementEnabled: false,
  announcementText: '',
  announcementType: 'info',
  latestVersionCode: 0,
  updateNudgeEnabled: false,
  compulsoryUpdateAfter: 4,
}

export async function dbGetAppControl(): Promise<AppControlConfig> {
  const snap = await getDoc(CFG('app_control'))
  return snap.exists() ? { ...DEF_APP_CONTROL, ...(snap.data() as AppControlConfig) } : DEF_APP_CONTROL
}
export async function dbSetAppControl(config: AppControlConfig) {
  await setDoc(CFG('app_control'), config)
}
export function dbWatchAppControl(cb: (c: AppControlConfig) => void): Unsubscribe {
  return onSnapshot(CFG('app_control'), snap =>
    cb(snap.exists() ? { ...DEF_APP_CONTROL, ...(snap.data() as AppControlConfig) } : DEF_APP_CONTROL)
  )
}

// ─── Remote Config ────────────────────────────────────────────────────────────

export interface RemoteConfigValues {
  trialDays: number
  maxClientsStarter: number
  maxClientsPro: number
  maxClientsBusiness: number
  consistencyRedThreshold: number
  consistencyYellowThreshold: number
  checkInAlertDays: number
  sessionRetentionDays: number
}

// Client caps: 0 = unlimited. Must match the app's SubscriptionPlan tiers
// (Starter 5 · Pro 20 · Business unlimited) — the app now applies these live.
export const DEF_REMOTE_CONFIG: RemoteConfigValues = {
  trialDays: 14,
  maxClientsStarter: 5,
  maxClientsPro: 20,
  maxClientsBusiness: 0,
  consistencyRedThreshold: 40,
  consistencyYellowThreshold: 70,
  checkInAlertDays: 5,
  sessionRetentionDays: 90,
}

export async function dbGetRemoteConfig(): Promise<RemoteConfigValues> {
  const snap = await getDoc(CFG('remote_config'))
  return snap.exists() ? { ...DEF_REMOTE_CONFIG, ...(snap.data() as RemoteConfigValues) } : DEF_REMOTE_CONFIG
}
export async function dbSetRemoteConfig(config: RemoteConfigValues) {
  await setDoc(CFG('remote_config'), config)
}
export function dbWatchRemoteConfig(cb: (c: RemoteConfigValues) => void): Unsubscribe {
  return onSnapshot(CFG('remote_config'), snap =>
    cb(snap.exists() ? { ...DEF_REMOTE_CONFIG, ...(snap.data() as RemoteConfigValues) } : DEF_REMOTE_CONFIG)
  )
}

// ─── Feature Matrix (per-tier locked/unlocked) ────────────────────────────────
// One doc, admin_config/feature_matrix: { featureKey: { TIER: boolean } }.
// Coach tiers STARTER/PRO/BUSINESS · member tiers FREE/PREMIUM. The Android app
// reads this live and enforces it; missing cells fall back to DEFAULT_FEATURE_MATRIX.

export async function dbGetFeatureMatrix(): Promise<FeatureMatrix> {
  const snap = await getDoc(CFG('feature_matrix'))
  return snap.exists() ? { ...DEFAULT_FEATURE_MATRIX, ...(snap.data() as FeatureMatrix) } : DEFAULT_FEATURE_MATRIX
}
export async function dbSetFeatureMatrix(matrix: FeatureMatrix) {
  await setDoc(CFG('feature_matrix'), matrix)
}
export function dbWatchFeatureMatrix(cb: (m: FeatureMatrix) => void): Unsubscribe {
  return onSnapshot(CFG('feature_matrix'), snap =>
    cb(snap.exists() ? { ...DEFAULT_FEATURE_MATRIX, ...(snap.data() as FeatureMatrix) } : DEFAULT_FEATURE_MATRIX)
  )
}

// ─── User Records ─────────────────────────────────────────────────────────────

export interface UserRecord {
  uid: string
  email: string
  displayName: string
  joinedAt: number
  lastActiveAt: number
  plan: string
  suspended: boolean
  appVersion: string
  appVersionCode?: number
  appVersionUpdatedAt?: number
  versionHistory?: string[]  // every version this user has ever run
  role: 'coach' | 'client'   // 'coach' if not set (legacy)
  memberPremium?: boolean    // client-side premium tier (FREE when false/absent)
  // Aggregate stats written by the Android app on every data change
  clientCount?: number
  totalMrr?: number
  sessionCount?: number
}

export async function dbGetUsers(): Promise<UserRecord[]> {
  const snap = await getDocs(USER_RECORDS())
  return snap.docs.map(d => d.data() as UserRecord)
}
export function dbWatchUsers(cb: (u: UserRecord[]) => void): Unsubscribe {
  return onSnapshot(USER_RECORDS(), snap =>
    cb(snap.docs.map(d => d.data() as UserRecord).sort((a, b) => b.joinedAt - a.joinedAt))
  )
}
export async function dbSetUserSuspended(uid: string, suspended: boolean) {
  await setDoc(doc(db, 'user_records', uid), { suspended }, { merge: true })
}
export async function dbSetUserPlan(uid: string, plan: string) {
  await setDoc(doc(db, 'user_records', uid), { plan }, { merge: true })
}
// Member subscription (client-side): FREE ↔ PREMIUM. The app reads memberPremium
// live from user_records and unlocks the AI features gated to Premium.
export async function dbSetMemberPremium(uid: string, premium: boolean) {
  await setDoc(doc(db, 'user_records', uid), { memberPremium: premium }, { merge: true })
}
// Manual role correction — older app builds never wrote `role` for members who
// signed in via Google on the login screen, so they surfaced here as coaches.
export async function dbSetUserRole(uid: string, role: 'coach' | 'client') {
  await setDoc(doc(db, 'user_records', uid), { role }, { merge: true })
}

// ─── Notification Templates ───────────────────────────────────────────────────

export interface NotifTemplate {
  id: string
  title: string
  body: string
  createdAt: number
}

export async function dbSaveTemplate(t: Omit<NotifTemplate, 'id'>) {
  await addDoc(TEMPLATES(), t)
}
export async function dbDeleteTemplate(id: string) {
  await deleteDoc(doc(db, 'notification_templates', id))
}
export function dbWatchTemplates(cb: (t: NotifTemplate[]) => void): Unsubscribe {
  const q = query(TEMPLATES(), orderBy('createdAt', 'desc'))
  return onSnapshot(q, snap =>
    cb(snap.docs.map(d => ({ id: d.id, ...d.data() } as NotifTemplate)))
  )
}

// ─── Exercise Library (admin CRUD) ───────────────────────────────────────────

export interface AdminExercise {
  id: string
  name: string
  sanskritName: string
  category: string        // STRENGTH | YOGA | CARDIO | HIIT | FLEXIBILITY
  primaryMuscles: string[]
  secondaryMuscles: string[]
  equipment: string
  difficulty: string      // BEGINNER | INTERMEDIATE | ADVANCED
  suitableFor: string[]
  sets: string
  reps: string
  tempo: string
  rest: string
  howTo: string[]
  commonErrors: string[]
  benefits: string[]
  bodyEffect: string
  caloriesBurned: string
  muscleEmoji: string
  estimatedMinutes: number
  imageUrl: string
  isPublished: boolean
  createdAt: number
  updatedAt: number
}

const EXERCISES = () => collection(db, 'exercises')

export async function dbGetExercises(): Promise<AdminExercise[]> {
  const q = query(EXERCISES(), orderBy('category'), orderBy('name'))
  const snap = await getDocs(q)
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as AdminExercise))
}

export async function dbSaveExercise(ex: Omit<AdminExercise, 'id' | 'createdAt' | 'updatedAt'>, id?: string): Promise<string> {
  const now = Date.now()
  if (id) {
    await setDoc(doc(db, 'exercises', id), { ...ex, updatedAt: now }, { merge: true })
    return id
  } else {
    const ref = await addDoc(EXERCISES(), { ...ex, createdAt: now, updatedAt: now })
    return ref.id
  }
}

export async function dbDeleteExercise(id: string) {
  await deleteDoc(doc(db, 'exercises', id))
}

export async function dbToggleExercisePublished(id: string, published: boolean) {
  await setDoc(doc(db, 'exercises', id), { isPublished: published, updatedAt: Date.now() }, { merge: true })
}

// Bulk-import a pre-transformed exercise catalog (e.g. the Gym visual dataset) into
// the `exercises` collection. Writes in batches of 400 (Firestore's 500-op limit),
// merging so a re-run just updates. Each item's `id` becomes the document id.
export async function dbBulkImportExercises(
  list: Array<Record<string, unknown> & { id: string }>,
  onProgress?: (done: number, total: number) => void,
): Promise<number> {
  const now = Date.now()
  const CHUNK = 400
  let done = 0
  for (let i = 0; i < list.length; i += CHUNK) {
    const batch = writeBatch(db)
    for (const e of list.slice(i, i + CHUNK)) {
      const { id, ...rest } = e
      batch.set(doc(db, 'exercises', id), { ...rest, createdAt: now, updatedAt: now }, { merge: true })
    }
    await batch.commit()
    done = Math.min(i + CHUNK, list.length)
    onProgress?.(done, list.length)
  }
  return done
}

export function dbWatchExercises(cb: (list: AdminExercise[]) => void): Unsubscribe {
  const q = query(EXERCISES(), orderBy('category'), orderBy('name'))
  return onSnapshot(q, snap =>
    cb(snap.docs.map(d => ({ id: d.id, ...d.data() } as AdminExercise)))
  )
}

// ─── Nutrition Plans (admin CRUD) ─────────────────────────────────────────────

export interface AdminFoodItem {
  name: string
  quantity: string
  calories: number
  proteinG: number
  carbsG: number
  fatG: number
  benefits: string
  isVegetarian: boolean
  imageUrl?: string
}

export interface AdminMeal {
  name: string
  timeSlot: string
  notes: string
  items: AdminFoodItem[]
}

export interface AdminNutritionPlan {
  id: string          // == goal key, e.g. 'BUILD_MUSCLE'
  goal: string
  goalLabel: string
  goalEmoji: string
  dailyCalories: number
  proteinG: number
  carbsG: number
  fatG: number
  hydration: string
  generalTips: string[]
  meals: AdminMeal[]
  isPublished: boolean
  updatedAt: number
  headerImageUrl?: string   // large banner shown at top of nutrition screen
  iconImageUrl?: string     // small circle icon on goal selection screen
}

const NUTRITION = () => collection(db, 'nutrition_plans')

export async function dbGetNutritionPlans(): Promise<AdminNutritionPlan[]> {
  const snap = await getDocs(NUTRITION())
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as AdminNutritionPlan))
}

export async function dbSaveNutritionPlan(plan: Omit<AdminNutritionPlan, 'id' | 'updatedAt'>, id: string): Promise<void> {
  await setDoc(doc(db, 'nutrition_plans', id), { ...plan, updatedAt: Date.now() }, { merge: true })
}

export async function dbToggleNutritionPublished(id: string, published: boolean) {
  await setDoc(doc(db, 'nutrition_plans', id), { isPublished: published, updatedAt: Date.now() }, { merge: true })
}

export function dbWatchNutritionPlans(cb: (list: AdminNutritionPlan[]) => void): Unsubscribe {
  return onSnapshot(NUTRITION(), snap =>
    cb(snap.docs.map(d => ({ id: d.id, ...d.data() } as AdminNutritionPlan)))
  )
}

// ─── Early Access Sign-ups ────────────────────────────────────────────────────

export interface EarlyAccessRecord {
  id: string
  name: string
  email: string
  role: 'coach' | 'member'
  signedUpAt: number
  source?: string
}

const EARLY_ACCESS = () => collection(db, 'early_access')

export function dbWatchEarlyAccess(cb: (list: EarlyAccessRecord[]) => void): Unsubscribe {
  const q = query(EARLY_ACCESS(), orderBy('signedUpAt', 'desc'))
  return onSnapshot(q, snap =>
    cb(snap.docs.map(d => ({ id: d.id, ...d.data() } as EarlyAccessRecord)))
  )
}

export async function dbDeleteEarlyAccess(id: string): Promise<void> {
  await deleteDoc(doc(db, 'early_access', id))
}

// ─── In-app Issue Reports ─────────────────────────────────────────────────────

export type IssueStatus = 'OPEN' | 'IN_PROGRESS' | 'RESOLVED'

export interface IssueReport {
  id: string
  uid: string
  name: string
  email: string
  role: string
  category: string
  message: string
  status: IssueStatus
  appVersion: string
  appVersionCode: number
  device: string
  androidVersion: string
  lastCrash: string
  createdAt: number
}

const ISSUES = () => collection(db, 'issue_reports')

export function dbWatchIssueReports(cb: (list: IssueReport[]) => void): Unsubscribe {
  const q = query(ISSUES(), orderBy('createdAt', 'desc'))
  return onSnapshot(q, snap =>
    cb(snap.docs.map(d => ({ id: d.id, ...d.data() } as IssueReport)))
  )
}

export async function dbSetIssueStatus(id: string, status: IssueStatus): Promise<void> {
  await setDoc(doc(db, 'issue_reports', id), { status, updatedAt: Date.now() }, { merge: true })
}

export async function dbDeleteIssueReport(id: string): Promise<void> {
  await deleteDoc(doc(db, 'issue_reports', id))
}

// ─── Subscription Upgrade Requests ────────────────────────────────────────────
// The app writes to upgrade_requests when a coach/member asks to upgrade. The
// admin approves here → we flip the plan on user_records/{uid}, which the app
// picks up live via its EntitlementManager listener. Closes the loop.

export type UpgradeStatus = 'PENDING' | 'CONTACTED' | 'ACTIVATED' | 'DECLINED'

export interface UpgradeRequest {
  id: string
  uid: string
  email: string
  name: string
  phone: string
  currentPlan: string      // STARTER | PRO | BUSINESS
  requestedTier: string    // STARTER | PRO | BUSINESS | MEMBER_PREMIUM
  note: string
  status: UpgradeStatus
  requestedAt: number
}

const UPGRADES = () => collection(db, 'upgrade_requests')

export function dbWatchUpgradeRequests(cb: (list: UpgradeRequest[]) => void): Unsubscribe {
  const q = query(UPGRADES(), orderBy('requestedAt', 'desc'))
  return onSnapshot(q, snap =>
    cb(snap.docs.map(d => ({ id: d.id, ...d.data() } as UpgradeRequest)))
  )
}

/**
 * Approve a request: apply the entitlement to user_records/{uid} (which the app
 * reads live) and mark the request ACTIVATED.
 */
export async function dbApproveUpgrade(req: UpgradeRequest): Promise<void> {
  const userRef = doc(db, 'user_records', req.uid)
  if (req.requestedTier === 'MEMBER_PREMIUM') {
    await setDoc(userRef, { memberPremium: true }, { merge: true })
  } else {
    await setDoc(userRef, { plan: req.requestedTier }, { merge: true })
  }
  await setDoc(doc(db, 'upgrade_requests', req.id),
    { status: 'ACTIVATED', activatedAt: Date.now() }, { merge: true })
}

export async function dbSetUpgradeStatus(id: string, status: UpgradeStatus): Promise<void> {
  await setDoc(doc(db, 'upgrade_requests', id), { status, updatedAt: Date.now() }, { merge: true })
}

export async function dbDeleteUpgradeRequest(id: string): Promise<void> {
  await deleteDoc(doc(db, 'upgrade_requests', id))
}

// ─── Trainer certificate reviews ──────────────────────────────────────────────
// Coaches upload a certificate photo in the app; on-device OCR marks it
// verified_auto or pending. Admin gets final say here — approve writes the
// Verified badge straight onto the live trainer profile.

export type CertStatus = 'pending' | 'verified_auto' | 'verified' | 'rejected'

export interface CertReview {
  uid: string
  name: string
  certifications: string
  certDocUrl: string
  status: CertStatus
  submittedAt: number
  reviewedAt?: number
}

const CERT_REVIEWS = () => collection(db, 'cert_reviews')

export function dbWatchCertReviews(cb: (list: CertReview[]) => void): Unsubscribe {
  const q = query(CERT_REVIEWS(), orderBy('submittedAt', 'desc'))
  return onSnapshot(q, snap =>
    cb(snap.docs.map(d => ({ ...(d.data() as CertReview), uid: d.id })))
  )
}

/** Approve/reject: updates the live trainer profile AND the review queue entry. */
export async function dbSetCertStatus(uid: string, status: 'verified' | 'rejected'): Promise<void> {
  await setDoc(doc(db, 'trainers', uid), { certStatus: status }, { merge: true })
  await setDoc(doc(db, 'cert_reviews', uid), { status, reviewedAt: Date.now() }, { merge: true })
}
