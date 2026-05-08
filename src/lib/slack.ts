import { db } from './db'

export type SlackReminder = {
  leadName: string
  company: string
  leadId: string
  stageDay: number
  callDate: Date
  estimatedDealSize: string | null
  objections: string[]
  draft: string
}

export async function sendFollowUpReminder(reminder: SlackReminder): Promise<void> {
  const settings = await db.settings.findUnique({ where: { id: 1 } })
  const webhookUrl = settings?.slackWebhookUrl
  if (!webhookUrl) {
    console.warn('Slack webhook URL not configured, skipping reminder')
    return
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
  const callDateStr = reminder.callDate.toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric'
  })
  const objectionText = reminder.objections.length > 0
    ? reminder.objections.join(', ')
    : 'none'

  const text = `*Follow-up due: ${reminder.leadName} (${reminder.company}) - Day ${reminder.stageDay}*
Call date: ${callDateStr} | Deal: ${reminder.estimatedDealSize ?? 'unknown'} | Objections: ${objectionText}

Draft:
"${reminder.draft}"

View lead: ${appUrl}/leads/${reminder.leadId}`

  const response = await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text }),
  })

  if (!response.ok) {
    throw new Error(`Slack webhook failed: ${response.status} ${response.statusText}`)
  }
}
