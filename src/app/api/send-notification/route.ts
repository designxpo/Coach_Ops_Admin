import { NextRequest, NextResponse } from 'next/server'
import { getAdminMessaging, getAdminFirestore } from '@/lib/firebase-admin'

export async function POST(req: NextRequest) {
  try {
    const { title, body, target } = await req.json()

    if (!title?.trim() || !body?.trim()) {
      return NextResponse.json({ error: 'title and body are required' }, { status: 400 })
    }

    const firestore = getAdminFirestore()
    const messaging = getAdminMessaging()

    // Collect FCM tokens matching the target
    const usersSnap = await firestore.collection('user_records').get()
    const tokens: string[] = []

    for (const doc of usersSnap.docs) {
      const data = doc.data()
      if (!data.fcmToken) continue

      if (target === 'all') {
        tokens.push(data.fcmToken)
      } else if (target === 'coaches') {
        // legacy records without a role field are coaches
        if (!data.role || data.role === 'coach') tokens.push(data.fcmToken)
      } else if (target === 'clients') {
        if (data.role === 'client') tokens.push(data.fcmToken)
      } else if (target.startsWith('uid:')) {
        if (doc.id === target.slice(4)) tokens.push(data.fcmToken)
      }
    }

    if (tokens.length === 0) {
      await firestore.collection('notifications').add({
        title, body, target, sentAt: Date.now(), total: 0, delivered: 0,
      })
      return NextResponse.json({ success: true, delivered: 0, total: 0, warning: 'No FCM tokens found' })
    }

    // FCM multicast — max 500 per batch
    let delivered = 0
    for (let i = 0; i < tokens.length; i += 500) {
      const batch = tokens.slice(i, i + 500)
      const result = await messaging.sendEachForMulticast({
        tokens: batch,
        notification: { title, body },
        android: {
          priority: 'high',
          notification: { channelId: 'procoach_push', sound: 'default', icon: 'ic_launcher' },
        },
      })
      delivered += result.successCount
    }

    // Persist to notification history
    await firestore.collection('notifications').add({
      title, body, target,
      sentAt: Date.now(),
      total: tokens.length,
      delivered,
    })

    return NextResponse.json({ success: true, delivered, total: tokens.length })
  } catch (err: any) {
    console.error('[send-notification]', err)
    return NextResponse.json({ error: err.message ?? 'Internal error' }, { status: 500 })
  }
}
