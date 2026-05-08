'use client'
import { useState } from 'react'
import Link from 'next/link'

type Lead = {
  id: string
  name: string
  company: string
  callDate: string
  estimatedDealSize: string | null
  objections: string[]
  status: string
  nextFollowUpDay: number | null
  nextFollowUpDue: boolean
}

const STATUS_STYLES: Record<string, string> = {
  active: 'bg-green-100 text-green-700',
  won: 'bg-blue-100 text-blue-700',
  lost: 'bg-slate-100 text-slate-500',
}

const STAGE_STYLES: Record<number, string> = {
  0: 'bg-red-100 text-red-700',
  3: 'bg-amber-100 text-amber-700',
  10: 'bg-violet-100 text-violet-700',
  18: 'bg-slate-100 text-slate-500',
}

export default function LeadsTable({ leads }: { leads: Lead[] }) {
  const [filter, setFilter] = useState<'all' | 'active' | 'won' | 'lost'>('all')
  const filtered = filter === 'all' ? leads : leads.filter((l) => l.status === filter)

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      <div className="flex items-center justify-between px-[18px] py-3.5 border-b border-slate-100">
        <h3 className="text-sm font-semibold text-slate-900">All Leads</h3>
        <div className="flex gap-1">
          {(['all', 'active', 'won', 'lost'] as const).map((f) => (
            <button key={f} onClick={() => setFilter(f)} className={`text-xs font-medium px-3 py-1.5 rounded-md capitalize ${filter === f ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-500'}`}>
              {f}
            </button>
          ))}
        </div>
      </div>
      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-slate-50">
            {['Lead', 'Call Date', 'Deal Size', 'Objections', 'Follow-up', 'Status'].map((h) => (
              <th key={h} className="text-left text-[11.5px] font-semibold text-slate-400 uppercase tracking-wide px-4 py-2.5 border-b border-slate-100">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {filtered.map((lead) => (
            <tr key={lead.id} className="hover:bg-slate-50 cursor-pointer border-b border-slate-50 last:border-b-0">
              <td className="px-4 py-3">
                <Link href={`/leads/${lead.id}`}>
                  <div className="text-[13.5px] font-semibold text-slate-900">{lead.name}</div>
                  <div className="text-xs text-slate-500">{lead.company}</div>
                </Link>
              </td>
              <td className="px-4 py-3 text-[13.5px] text-slate-600">{lead.callDate}</td>
              <td className="px-4 py-3 text-[13.5px] font-medium text-slate-900">{lead.estimatedDealSize ?? '-'}</td>
              <td className="px-4 py-3 text-xs text-slate-400">{lead.objections.join(', ') || '-'}</td>
              <td className="px-4 py-3">
                {lead.nextFollowUpDay !== null ? (
                  <span className={`text-[11.5px] font-semibold px-2 py-1 rounded-md ${STAGE_STYLES[lead.nextFollowUpDay] ?? 'bg-slate-100 text-slate-500'}`}>
                    Day {lead.nextFollowUpDay}{lead.nextFollowUpDue ? ' - Due' : ''}
                  </span>
                ) : (
                  <span className="text-[11.5px] text-slate-400">Complete</span>
                )}
              </td>
              <td className="px-4 py-3">
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full capitalize ${STATUS_STYLES[lead.status] ?? ''}`}>{lead.status}</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
