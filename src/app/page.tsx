import { db } from '@/lib/db'
import StatsRow from '@/components/StatsRow'
import RemindersPanel from '@/components/RemindersPanel'
import LeadsTable from '@/components/LeadsTable'

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  const today = new Date()
  today.setHours(23, 59, 59, 999)

  const [allLeads, pendingReminders] = await Promise.all([
    db.lead.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        reminders: {
          where: { sentAt: null },
          orderBy: { stageDay: 'asc' },
          take: 1,
        },
      },
    }),
    db.followUpReminder.findMany({
      where: { sentAt: null, scheduledFor: { lte: today } },
      include: { lead: true },
      orderBy: { stageDay: 'asc' },
    }),
  ])

  const activeCount = allLeads.filter((l) => l.status === 'active').length
  const wonCount = allLeads.filter((l) => l.status === 'won').length

  const stats = [
    { label: 'Total Leads', value: allLeads.length, sub: 'All time' },
    { label: 'Pending Follow-ups', value: pendingReminders.length, sub: 'Due today', highlight: pendingReminders.length > 0 },
    { label: 'Closed Won', value: wonCount, sub: 'All time' },
    { label: 'Active Pipeline', value: activeCount, sub: 'Active leads' },
  ]

  const reminderData = pendingReminders.map((r) => ({
    id: r.id,
    leadId: r.lead.id,
    leadName: r.lead.name,
    company: r.lead.company,
    stageDay: r.stageDay,
    callDate: r.lead.callDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    draft: r.draftMessage,
  }))

  const leadsData = allLeads.map((l) => {
    const nextReminder = l.reminders[0]
    return {
      id: l.id,
      name: l.name,
      company: l.company,
      callDate: l.callDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      estimatedDealSize: l.estimatedDealSize,
      objections: (l.objections as string[]) ?? [],
      status: l.status,
      nextFollowUpDay: nextReminder?.stageDay ?? null,
      nextFollowUpDue: nextReminder ? nextReminder.scheduledFor <= today : false,
    }
  })

  return (
    <div className="p-6 flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <h1 className="text-base font-semibold text-slate-900">Dashboard</h1>
        <span className="bg-blue-50 border border-blue-200 text-blue-600 text-xs font-semibold px-3 py-1.5 rounded-full">
          Auto-syncing every hour
        </span>
      </div>
      <StatsRow stats={stats} />
      {reminderData.length > 0 && <RemindersPanel reminders={reminderData} />}
      <LeadsTable leads={leadsData} />
    </div>
  )
}
