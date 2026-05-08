import { NextResponse } from 'next/server'
import { isGoogleConnected } from '@/lib/google'

export const dynamic = 'force-dynamic'

export async function GET() {
  const connected = await isGoogleConnected()
  return NextResponse.json({ connected })
}
