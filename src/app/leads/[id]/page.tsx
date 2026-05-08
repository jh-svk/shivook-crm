import { notFound } from 'next/navigation'
import { db } from '@/lib/db'
import LeadDetail from '@/components/LeadDetail'

export const dynamic = 'force-dynamic'

export default async function LeadPage({ params }: { params: { id: string } }) {
  const lead = await db.lead.findUnique({
    where: { id: params.id },
    include: { reminders: { orderBy: { stageDay: 'asc' } } },
  })

  if (!lead) notFound()

  const leadData = {
    id: lead.id,
    name: lead.name,
    company: lead.company,
    email: lead.email,
    callDate: lead.callDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
    callSummary: lead.callSummary,
    transcriptUrl: lead.transcriptUrl,
    fullTranscript: lead.fullTranscript,
    estimatedDealSize: lead.estimatedDealSize,
    leadSource: lead.leadSource,
    objections: (lead.objections as string[]) ?? [],
    nextAction: lead.nextAction,
    status: lead.status,
    notes: lead.notes,
    reminders: lead.reminders.map((r) => ({
      id: r.id,
      stageDay: r.stageDay,
      scheduledFor: r.scheduledFor.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      draftMessage: r.draftMessage,
      sent: r.sentAt !== null,
    })),
  }

  return <LeadDetail lead={leadData} />
}
