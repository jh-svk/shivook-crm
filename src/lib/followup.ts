import { db } from './db'
import { generateDraft, DraftInput } from './claude'
import { sendFollowUpReminder } from './slack'

export function isDueToday(scheduledFor: Date): boolean {
  const today = new Date()
  today.setHours(23, 59, 59, 999)
  return scheduledFor <= today
}

export async function runFollowupChecker(): Promise<void> {
  console.log('[followup] Starting follow-up check at', new Date().toISOString())

  const dueReminders = await db.followUpReminder.findMany({
    where: {
      sentAt: null,
      stageDay: { in: [3, 10, 18] },
      scheduledFor: { lte: new Date() },
    },
    include: { lead: true },
  })
  console.log(`[followup] ${dueReminders.length} reminders due`)

  for (const reminder of dueReminders) {
    const lead = reminder.lead

    if (lead.status !== 'active') {
      await db.followUpReminder.update({
        where: { id: reminder.id },
        data: { sentAt: new Date() },
      })
      continue
    }

    const draftInput: DraftInput = {
      leadName: lead.name,
      company: lead.company,
      stageDay: reminder.stageDay as 3 | 10 | 18,
      callSummary: lead.callSummary,
      objections: (lead.objections as string[]) ?? [],
      estimatedDealSize: lead.estimatedDealSize,
    }

    let draft: string
    try {
      draft = await generateDraft(draftInput)
    } catch (err) {
      console.error(`[followup] Failed to generate draft for lead ${lead.id}:`, err)
      continue
    }

    try {
      await sendFollowUpReminder({
        leadName: lead.name,
        company: lead.company,
        leadId: lead.id,
        stageDay: reminder.stageDay,
        callDate: lead.callDate,
        estimatedDealSize: lead.estimatedDealSize,
        objections: (lead.objections as string[]) ?? [],
        draft,
      })
      await db.followUpReminder.update({
        where: { id: reminder.id },
        data: { draftMessage: draft, sentAt: new Date() },
      })
      console.log(`[followup] Sent Day ${reminder.stageDay} reminder for ${lead.name}`)
    } catch (err) {
      console.error(`[followup] Failed to send Slack reminder for ${lead.id}:`, err)
    }
  }

  await db.settings.upsert({
    where: { id: 1 },
    create: { id: 1, lastSyncAt: new Date() },
    update: { lastSyncAt: new Date() },
  })
}
