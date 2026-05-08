import { db } from './db'
import { fetchRecentCalendarEvents, readGoogleDoc, CalendarEvent } from './google'
import { classifyCall, generateDraft, DraftInput } from './claude'
import { sendFollowUpReminder } from './slack'

export function filterNewEvents(
  events: Array<{ id: string; summary: string; attachments?: unknown[] }>,
  processedIds: Set<string>
): Array<{ id: string; summary: string; attachments?: unknown[] }> {
  return events.filter(
    (e) => !processedIds.has(e.id) && (e.attachments?.length ?? 0) > 0
  )
}

export function extractDocAttachment(
  attachments: Array<{ mimeType: string; fileId: string }>
): string | null {
  const doc = attachments.find(
    (a) => a.mimeType === 'application/vnd.google-apps.document'
  )
  return doc?.fileId ?? null
}

export function scheduleFollowUpDates(callDate: Date): Record<number, Date> {
  const addDays = (d: Date, days: number) => {
    const result = new Date(d)
    result.setDate(result.getDate() + days)
    return result
  }
  return {
    3: addDays(callDate, 3),
    10: addDays(callDate, 10),
    18: addDays(callDate, 18),
  }
}

export async function runCalendarPoller(): Promise<void> {
  console.log('[poller] Starting calendar poll at', new Date().toISOString())

  let events: CalendarEvent[]
  try {
    events = await fetchRecentCalendarEvents()
  } catch (err) {
    console.error('[poller] Failed to fetch calendar events:', err)
    return
  }

  const processedRecords = await db.processedEvent.findMany({
    select: { googleEventId: true },
  })
  const processedIds = new Set(processedRecords.map((r) => r.googleEventId))

  const newEvents = filterNewEvents(events, processedIds)
  console.log(`[poller] ${newEvents.length} new events to process`)

  for (const event of newEvents) {
    await processEvent(event as CalendarEvent)
  }
}

async function processEvent(event: CalendarEvent): Promise<void> {
  const attachments = event.attachments ?? []
  const docFileId = extractDocAttachment(
    attachments as Array<{ mimeType: string; fileId: string }>
  )

  if (!docFileId) {
    await db.processedEvent.create({ data: { googleEventId: event.id } })
    return
  }

  let transcript: string
  try {
    transcript = await readGoogleDoc(docFileId)
  } catch (err) {
    console.error(`[poller] Could not read doc for event ${event.id}:`, err)
    await db.processedEvent.create({ data: { googleEventId: event.id } })
    return
  }

  const callDate = new Date(event.start.dateTime)
  const durationMs = new Date(event.end.dateTime).getTime() - callDate.getTime()
  const durationMinutes = Math.round(durationMs / 60000)

  const classification = await classifyCall({
    eventTitle: event.summary,
    startTime: event.start.dateTime,
    durationMinutes,
    transcript,
  })

  await db.processedEvent.create({ data: { googleEventId: event.id } })

  if (!classification.isSalesCall) {
    console.log(`[poller] Event "${event.summary}" is not a sales call, skipping`)
    return
  }

  const transcriptUrl = `https://docs.google.com/document/d/${docFileId}`

  const lead = await db.lead.create({
    data: {
      name: classification.leadName ?? 'Unknown',
      company: classification.company ?? 'Unknown',
      email: classification.email,
      callDate,
      callSummary: classification.callSummary ?? '',
      transcriptUrl,
      fullTranscript: transcript,
      estimatedDealSize: classification.estimatedDealSize,
      leadSource: classification.leadSource,
      objections: classification.objections,
      nextAction: classification.nextAction,
    },
  })

  console.log(`[poller] New lead created: ${lead.name} (${lead.company})`)

  const draftInput: DraftInput = {
    leadName: lead.name,
    company: lead.company,
    stageDay: 0,
    callSummary: lead.callSummary,
    objections: classification.objections,
    estimatedDealSize: lead.estimatedDealSize,
  }

  const day0Draft = await generateDraft(draftInput)

  try {
    await sendFollowUpReminder({
      leadName: lead.name,
      company: lead.company,
      leadId: lead.id,
      stageDay: 0,
      callDate: lead.callDate,
      estimatedDealSize: lead.estimatedDealSize,
      objections: classification.objections,
      draft: day0Draft,
    })
    await db.followUpReminder.create({
      data: {
        leadId: lead.id,
        stageDay: 0,
        scheduledFor: callDate,
        draftMessage: day0Draft,
        sentAt: new Date(),
      },
    })
    console.log(`[poller] Sent Day 0 reminder for ${lead.name}`)
  } catch (err) {
    console.error('[poller] Failed to send Day 0 Slack reminder:', err)
    await db.followUpReminder.create({
      data: {
        leadId: lead.id,
        stageDay: 0,
        scheduledFor: callDate,
        draftMessage: day0Draft,
        sentAt: null,
      },
    })
  }

  const futureDates = scheduleFollowUpDates(callDate)
  for (const [day, date] of Object.entries(futureDates)) {
    await db.followUpReminder.create({
      data: {
        leadId: lead.id,
        stageDay: Number(day),
        scheduledFor: date,
        draftMessage: '',
      },
    })
  }
}
