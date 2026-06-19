import { NextResponse } from 'next/server'
import { getAdminMessaging, getAdminFirestore } from '@/lib/firebase-admin'

export async function POST(req: Request) {
  try {
    const { title, body, target } = await req.json() as {
      title: string; body: string; target: string
    }

    if (!title?.trim() || !body?.trim()) {
      return NextResponse.json({ error: 'title and body required' }, { status: 400 })
    }

    const fs = getAdminFirestore()
    const snap = await fs.collection('user_records').get()

    // Collect FCM tokens for the target audience
    const tokens: string[] = []
    snap.docs.forEach(doc => {
      const d = doc.data()
      const token = d.fcmToken as string | undefined
      if (!token) return

      const plan = (d.subscriptionPlan as string | undefined) ?? 'STARTER'
      const role = (d.role as string | undefined) ?? 'coach'

      // Only target coaches (clients receive coach-specific notifications)
      if (role !== 'coach') return

      const include =
        target === 'All Coaches' ||
        (target === 'Pro+ Only'    && ['PRO', 'BUSINESS'].includes(plan)) ||
        (target === 'Business Only' && plan === 'BUSINESS')

      if (include) tokens.push(token)
    })

    if (tokens.length === 0) {
      return NextResponse.json({ delivered: 0, failed: 0, total: 0 })
    }

    const messaging = getAdminMessaging()
    let delivered = 0
    let failed    = 0

    // FCM allows max 500 tokens per multicast call
    for (let i = 0; i < tokens.length; i += 500) {
      const batch = tokens.slice(i, i + 500)
      const result = await messaging.sendEachForMulticast({
        tokens: batch,
        notification: { title, body },
        android: {
          priority: 'high',
          notification: {
            channelId: 'procoach_push',
            sound:     'default',
            icon:      'ic_launcher',
          },
        },
      })
      delivered += result.successCount
      failed    += result.failureCount
    }

    return NextResponse.json({ delivered, failed, total: tokens.length })
  } catch (err) {
    console.error('[send-notification]', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    )
  }
}
