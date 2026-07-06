import { NextRequest, NextResponse } from 'next/server'
import { getAdminMessaging, getAdminFirestore, requireAdmin } from '@/lib/firebase-admin'

export async function POST(req: NextRequest) {
  try {
    // API routes deploy PUBLICLY on Vercel — without this check anyone who
    // finds the URL can push notifications to every user
    const authError = await requireAdmin(req.headers.get('authorization'))
    if (authError) {
      return NextResponse.json({ error: authError }, { status: 401 })
    }

    const { title, body, target } = await req.json()

    if (!title?.trim() || !body?.trim()) {
      return NextResponse.json({ error: 'title and body are required' }, { status: 400 })
    }
    if (!['all', 'coaches', 'clients'].includes(target) && !target?.startsWith?.('uid:')) {
      return NextResponse.json({ error: 'invalid target' }, { status: 400 })
    }

    const firestore = getAdminFirestore()
    const messaging = getAdminMessaging()

    // Collect FCM tokens matching the target. Track token -> doc id so dead
    // tokens can be pruned from user_records after the send.
    const tokenOwner = new Map<string, string>()

    if (target.startsWith('uid:')) {
      // Direct lookup — no reason to scan the whole collection for one user
      const snap = await firestore.collection('user_records').doc(target.slice(4)).get()
      const t = snap.data()?.fcmToken
      if (t) tokenOwner.set(t, snap.id)
    } else {
      const usersSnap = await firestore.collection('user_records').get()
      for (const doc of usersSnap.docs) {
        const data = doc.data()
        if (!data.fcmToken) continue
        const isCoach = !data.role || data.role === 'coach' // legacy records without a role are coaches
        if (
          target === 'all' ||
          (target === 'coaches' && isCoach) ||
          (target === 'clients' && data.role === 'client')
        ) {
          tokenOwner.set(data.fcmToken, doc.id) // Map dedupes shared tokens
        }
      }
    }

    const tokens = Array.from(tokenOwner.keys())
    if (tokens.length === 0) {
      await firestore.collection('notifications').add({
        title, body, target, sentAt: Date.now(), total: 0, delivered: 0,
      })
      return NextResponse.json({ success: true, delivered: 0, total: 0, warning: 'No FCM tokens found' })
    }

    // FCM multicast — max 500 per batch. Prune tokens FCM reports as dead
    // (uninstalls, rotations) so delivery stats stay meaningful over time.
    let accepted = 0
    const deadTokens: string[] = []
    for (let i = 0; i < tokens.length; i += 500) {
      const batch = tokens.slice(i, i + 500)
      const result = await messaging.sendEachForMulticast({
        tokens: batch,
        notification: { title, body },
        android: {
          priority: 'high',
          notification: { channelId: 'procoach_push', sound: 'default', icon: 'ic_stat_notify' },
        },
      })
      accepted += result.successCount
      result.responses.forEach((r, idx) => {
        const code = r.error?.code
        if (code === 'messaging/registration-token-not-registered' ||
            code === 'messaging/invalid-registration-token') {
          deadTokens.push(batch[idx])
        }
      })
    }

    if (deadTokens.length > 0) {
      const { FieldValue } = await import('firebase-admin/firestore')
      await Promise.all(deadTokens.map(t =>
        firestore.collection('user_records').doc(tokenOwner.get(t)!)
          .set({ fcmToken: FieldValue.delete() }, { merge: true })
          .catch(() => {})
      ))
    }

    // Persist to notification history ("delivered" = accepted by FCM)
    await firestore.collection('notifications').add({
      title, body, target,
      sentAt: Date.now(),
      total: tokens.length,
      delivered: accepted,
      prunedDeadTokens: deadTokens.length,
    })

    return NextResponse.json({ success: true, delivered: accepted, total: tokens.length })
  } catch (err: any) {
    console.error('[send-notification]', err)
    return NextResponse.json({ error: err.message ?? 'Internal error' }, { status: 500 })
  }
}
