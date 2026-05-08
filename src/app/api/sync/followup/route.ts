import { NextResponse } from 'next/server'
import { runFollowupChecker } from '@/lib/followup'

export const dynamic = 'force-dynamic'

export async function POST() {
  try {
    await runFollowupChecker()
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[sync/followup] Failed:', err)
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 })
  }
}
