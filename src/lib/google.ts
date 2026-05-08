import { google } from 'googleapis'
import { db } from './db'

export function createOAuthClient() {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID!,
    process.env.GOOGLE_CLIENT_SECRET!,
    process.env.GOOGLE_REDIRECT_URI!
  )
}

export function getAuthUrl(): string {
  const client = createOAuthClient()
  return client.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent',
    scope: [
      'https://www.googleapis.com/auth/calendar.readonly',
      'https://www.googleapis.com/auth/drive.readonly',
    ],
  })
}

export async function getAuthedClient() {
  const token = await db.googleToken.findUnique({ where: { id: 1 } })
  if (!token) throw new Error('Google account not connected')

  const client = createOAuthClient()
  client.setCredentials({
    access_token: token.accessToken,
    refresh_token: token.refreshToken,
    expiry_date: token.expiry.getTime(),
  })

  client.on('tokens', async (tokens) => {
    if (tokens.access_token) {
      await db.googleToken.update({
        where: { id: 1 },
        data: {
          accessToken: tokens.access_token,
          expiry: new Date(tokens.expiry_date ?? Date.now() + 3600 * 1000),
          ...(tokens.refresh_token && { refreshToken: tokens.refresh_token }),
        },
      })
    }
  })

  return client
}

export async function isGoogleConnected(): Promise<boolean> {
  const token = await db.googleToken.findUnique({ where: { id: 1 } })
  return token !== null
}

export type CalendarEvent = {
  id: string
  summary: string
  start: { dateTime: string }
  end: { dateTime: string }
  attachments?: Array<{
    fileId: string
    mimeType: string
    title?: string
  }>
}

export async function fetchRecentCalendarEvents(): Promise<CalendarEvent[]> {
  const client = await getAuthedClient()
  const calendar = google.calendar({ version: 'v3', auth: client })

  const now = new Date()
  const threeHoursAgo = new Date(now.getTime() - 3 * 60 * 60 * 1000)

  const response = await calendar.events.list({
    calendarId: 'primary',
    timeMin: threeHoursAgo.toISOString(),
    timeMax: now.toISOString(),
    singleEvents: true,
    orderBy: 'startTime',
    supportsAttachments: true,
    fields: 'items(id,summary,start,end,attachments)',
  })

  return (response.data.items ?? []) as CalendarEvent[]
}

export async function readGoogleDoc(fileId: string): Promise<string> {
  const client = await getAuthedClient()
  const drive = google.drive({ version: 'v3', auth: client })

  const response = await drive.files.export(
    { fileId, mimeType: 'text/plain' },
    { responseType: 'text' }
  )

  return response.data as string
}
