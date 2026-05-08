'use client'
import { useState } from 'react'

type Reminder = {
  id: string
  stageDay: number
  scheduledFor: string
  draftMessage: string
  sent: boolean
}

type Lead = {
  id: string
  name: string
  company: string
  email: string | null
  callDate: string
  callSummary: string
  transcriptUrl: string
  fullTranscript: string
  estimatedDealSize: string | null
  leadSource: string | null
  objections: string[]
  nextAction: string | null
  status: string
  notes: string | null
  reminders: Reminder[]
}

const STAGE_LABEL: Record<number, string> = {
  0: 'Day 0 - Ask for decision',
  3: 'Day 3 - Low-pressure check-in',
  10: 'Day 10 - Add value',
  18: 'Day 18 - Breakup message',
}

const STATUS_STYLES: Record<string, string> = {
  active: 'bg-green-100 text-green-700',
  won: 'bg-blue-100 text-blue-700',
  lost: 'bg-slate-100 text-slate-500',
}

export default function LeadDetail({ lead }: { lead: Lead }) {
  const [status, setStatus] = useState(lead.status)
  const [notes, setNotes] = useState(lead.notes ?? '')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [saveError, setSaveError] = useState(false)
  const [showTranscript, setShowTranscript] = useState(false)

  const save = async () => {
    setSaving(true)
    setSaved(false)
    setSaveError(false)
    try {
      const r = await fetch(`/api/leads/${lead.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, notes }),
      })
      if (!r.ok) throw new Error('Save failed')
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch {
      setSaveError(true)
      setTimeout(() => setSaveError(false), 3000)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="p-6 max-w-3xl flex flex-col gap-5">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">{lead.name}</h1>
          <div className="text-slate-500 text-sm mt-0.5">{lead.company} · {lead.callDate}</div>
          {lead.estimatedDealSize && <div className="text-sm font-semibold text-slate-700 mt-1">{lead.estimatedDealSize}</div>}
        </div>
        <span className={`text-xs font-semibold px-3 py-1 rounded-full capitalize ${STATUS_STYLES[status] ?? ''}`}>{status}</span>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-4">
        <h2 className="text-sm font-semibold text-slate-700 mb-2">Call Summary</h2>
        <p className="text-[13.5px] text-slate-600 leading-relaxed">{lead.callSummary}</p>
        {lead.nextAction && (
          <div className="mt-3 bg-blue-50 border border-blue-100 rounded-lg px-3 py-2 text-xs text-blue-700">
            <span className="font-semibold">Recommended next action:</span> {lead.nextAction}
          </div>
        )}
      </div>

      {lead.objections.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <h2 className="text-sm font-semibold text-slate-700 mb-2">Objections Detected</h2>
          <div className="flex flex-wrap gap-2">
            {lead.objections.map((o) => (
              <span key={o} className="bg-amber-50 border border-amber-200 text-amber-700 text-xs font-medium px-2.5 py-1 rounded-full capitalize">{o}</span>
            ))}
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl border border-slate-200 p-4">
        <h2 className="text-sm font-semibold text-slate-700 mb-3">Follow-up Timeline</h2>
        <div className="flex flex-col gap-2">
          {lead.reminders.map((r) => (
            <div key={r.id} className={`flex items-start gap-3 p-3 rounded-lg border ${r.sent ? 'border-green-100 bg-green-50' : 'border-slate-100 bg-slate-50'}`}>
              <span className={`text-[10px] font-bold px-2 py-1 rounded-md whitespace-nowrap mt-0.5 ${r.sent ? 'bg-green-600 text-white' : 'bg-slate-700 text-white'}`}>DAY {r.stageDay}</span>
              <div className="flex-1">
                <div className="text-xs text-slate-500">{STAGE_LABEL[r.stageDay]} · {r.scheduledFor}</div>
                {r.draftMessage && <div className="text-[12.5px] text-slate-600 mt-1 italic">"{r.draftMessage}"</div>}
              </div>
              {r.sent && <span className="text-[10px] text-green-600 font-semibold mt-1">Sent</span>}
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-4">
        <h2 className="text-sm font-semibold text-slate-700 mb-2">Notes</h2>
        <textarea value={notes} onChange={(e) => setNotes(e.target.value)} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 resize-none h-24 focus:outline-none focus:ring-2 focus:ring-blue-300" placeholder="Add notes..." />
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-4">
        <h2 className="text-sm font-semibold text-slate-700 mb-2">Status</h2>
        <div className="flex gap-2">
          {(['active', 'won', 'lost'] as const).map((s) => (
            <button key={s} onClick={() => setStatus(s)} className={`text-xs font-semibold px-4 py-1.5 rounded-full capitalize border transition-all ${status === s ? 'bg-slate-900 text-white border-slate-900' : 'border-slate-200 text-slate-500 hover:border-slate-400'}`}>{s}</button>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button onClick={save} disabled={saving} className="bg-slate-900 text-white text-sm font-medium px-5 py-2 rounded-lg disabled:opacity-50">
          {saving ? 'Saving...' : saved ? 'Saved!' : 'Save Changes'}
        </button>
        <a href={lead.transcriptUrl} target="_blank" rel="noopener noreferrer" className="bg-slate-100 text-slate-600 text-sm font-medium px-5 py-2 rounded-lg">
          View Transcript Doc
        </a>
        {saveError && <span className="text-xs text-red-600">Save failed. Try again.</span>}
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <button onClick={() => setShowTranscript(!showTranscript)} className="w-full flex items-center justify-between px-4 py-3 text-sm font-semibold text-slate-700">
          Full Transcript
          <span className="text-slate-400 text-xs">{showTranscript ? 'Hide' : 'Show'}</span>
        </button>
        {showTranscript && (
          <div className="px-4 pb-4 text-xs text-slate-600 leading-relaxed whitespace-pre-wrap border-t border-slate-100 pt-3 max-h-64 overflow-y-auto">
            {lead.fullTranscript}
          </div>
        )}
      </div>
    </div>
  )
}
