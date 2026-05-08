import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { slackWebhookUrl } = body

  if (typeof slackWebhookUrl !== 'string' || slackWebhookUrl.trim() === '') {
    return NextResponse.json({ error: 'slackWebhookUrl required' }, { status: 400 })
  }

  const settings = await db.settings.upsert({
    where: { id: 1 },
    create: { id: 1, slackWebhookUrl },
    update: { slackWebhookUrl },
  })

  return NextResponse.json(settings)
}
