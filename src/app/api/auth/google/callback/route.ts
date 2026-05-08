import { NextRequest, NextResponse } from 'next/server'
import { createOAuthClient } from '@/lib/google'
import { db } from '@/lib/db'

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get('code')
  if (!code) {
    return NextResponse.redirect(new URL('/settings?error=no_code', req.url))
  }

  const client = createOAuthClient()
  let tokens: Awaited<ReturnType<typeof client.getToken>>['tokens']
  try {
    const result = await client.getToken(code)
    tokens = result.tokens
  } catch {
    return NextResponse.redirect(new URL('/settings?error=token_exchange_failed', req.url))
  }

  if (!tokens.access_token || !tokens.refresh_token) {
    return NextResponse.redirect(new URL('/settings?error=no_tokens', req.url))
  }

  await db.googleToken.upsert({
    where: { id: 1 },
    create: {
      id: 1,
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      expiry: new Date(tokens.expiry_date ?? Date.now() + 3600 * 1000),
    },
    update: {
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      expiry: new Date(tokens.expiry_date ?? Date.now() + 3600 * 1000),
    },
  })

  return NextResponse.redirect(new URL('/?connected=true', req.url))
}
