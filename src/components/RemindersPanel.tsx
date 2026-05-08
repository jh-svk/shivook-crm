'use client'
import { useState } from 'react'

type Reminder = {
  id: string
  leadId: string
  leadName: string
  company: string
  stageDay: number
  callDate: string
  draft: string
}

const DAY_COLORS: Record<number, string> = {
  0: 'bg-red-600',
  3: 'bg-amber-600',
  10: 'bg-violet-600',
  18: 'bg-slate-500',
}

export default function RemindersPanel({ reminders }: { reminders: Reminder[] }) {
  const [copied, setCopied] = useState<string | null>(null)

  const copyDraft = async (id: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(id)
      setTimeout(() => setCopied(null), 2000)
    } catch {
      // clipboard unavailable (e.g. non-HTTPS) — no-op
    }
  }

  if (reminders.length === 0) return null

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      <div className="flex items-center justify-between px-[18px] py-3.5 border-b border-slate-100">
        <h3 className="text-sm font-semibold text-slate-900">Follow-up Reminders Due Today</h3>
        <span className="bg-amber-100 text-amber-700 text-[11px] font-bold px-2 py-0.5 rounded-full">
          {reminders.length} pending
        </span>
      </div>
      <div>
        {reminders.map((r) => (
          <div key={r.id} className="flex gap-3.5 px-[18px] py-3.5 border-b border-slate-50 last:border-b-0">
            <span className={`${DAY_COLORS[r.stageDay] ?? 'bg-slate-600'} text-white text-[10px] font-bold px-2 py-1 rounded-md h-fit whitespace-nowrap mt-0.5`}>
              DAY {r.stageDay}
            </span>
            <div className="flex-1">
              <div className="text-[13.5px] font-semibold text-slate-900">{r.leadName}</div>
              <div className="text-xs text-slate-500">{r.company} · {r.callDate}</div>
              <div className="mt-2 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 text-[12.5px] text-slate-700 leading-relaxed italic">
                "{r.draft}"
              </div>
              <div className="flex gap-2 mt-2">
                <button onClick={() => copyDraft(r.id, r.draft)} className="bg-slate-900 text-white text-xs font-medium px-3 py-1.5 rounded-md">
                  {copied === r.id ? 'Copied!' : 'Copy Draft'}
                </button>
                <a href={`/leads/${r.leadId}`} className="bg-slate-100 text-slate-600 text-xs font-medium px-3 py-1.5 rounded-md">
                  View Lead
                </a>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
