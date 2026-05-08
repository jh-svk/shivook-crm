import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const body = await req.json()
  const allowed = ['status', 'notes'] as const
  const data: Record<string, unknown> = {}

  for (const key of allowed) {
    if (key in body) data[key] = body[key]
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 })
  }

  const lead = await db.lead.update({
    where: { id: params.id },
    data,
  })

  return NextResponse.json(lead)
}
