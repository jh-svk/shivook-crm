import { NextResponse } from 'next/server'
import { runCalendarPoller } from '@/lib/poller'

export async function POST() {
  try {
    await runCalendarPoller()
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[sync] Manual sync failed:', err)
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 })
  }
}
