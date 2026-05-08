'use client'
import { useState, useEffect } from 'react'

export default function SettingsPage() {
  const [slackUrl, setSlackUrl] = useState('')
  const [saving, setSaving] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [saved, setSaved] = useState(false)
  const [syncMsg, setSyncMsg] = useState('')
  const [googleConnected, setGoogleConnected] = useState<boolean | null>(null)

  useEffect(() => {
    fetch('/api/auth/google/status')
      .then((r) => r.json())
      .then((d) => setGoogleConnected(d.connected))
      .catch(() => setGoogleConnected(false))
  }, [])

  const saveSettings = async () => {
    setSaving(true)
    await fetch('/api/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slackWebhookUrl: slackUrl }),
    })
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const manualSync = async () => {
    setSyncing(true)
    setSyncMsg('')
    try {
      const r = await fetch('/api/sync', { method: 'POST' })
      const d = await r.json()
      setSyncMsg(d.ok ? 'Sync complete.' : `Error: ${d.error}`)
    } catch {
      setSyncMsg('Sync failed.')
    }
    setSyncing(false)
  }

  return (
    <div className="p-6 max-w-xl flex flex-col gap-5">
      <h1 className="text-base font-semibold text-slate-900">Settings</h1>

      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <h2 className="text-sm font-semibold text-slate-700 mb-1">Google Calendar</h2>
        <p className="text-xs text-slate-400 mb-4">Required to fetch calendar events and Gemini transcripts.</p>
        {googleConnected === null ? (
          <div className="text-xs text-slate-400">Checking connection...</div>
        ) : googleConnected ? (
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 bg-green-500 rounded-full"></span>
            <span className="text-sm text-green-700 font-medium">Connected</span>
            <a href="/api/auth/google" className="ml-auto text-xs text-slate-400 underline">Reconnect</a>
          </div>
        ) : (
          <a href="/api/auth/google" className="inline-block bg-slate-900 text-white text-sm font-medium px-5 py-2 rounded-lg">
            Connect Google Account
          </a>
        )}
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <h2 className="text-sm font-semibold text-slate-700 mb-1">Slack Webhook</h2>
        <p className="text-xs text-slate-400 mb-3">Follow-up reminders will post to this webhook URL.</p>
        <input
          type="text"
          value={slackUrl}
          onChange={(e) => setSlackUrl(e.target.value)}
          placeholder="https://hooks.slack.com/services/..."
          className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-300 mb-3"
        />
        <button onClick={saveSettings} disabled={saving} className="bg-slate-900 text-white text-sm font-medium px-5 py-2 rounded-lg disabled:opacity-50">
          {saved ? 'Saved!' : saving ? 'Saving...' : 'Save'}
        </button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <h2 className="text-sm font-semibold text-slate-700 mb-1">Manual Sync</h2>
        <p className="text-xs text-slate-400 mb-3">Trigger the calendar poll right now without waiting for the hourly cron.</p>
        <button onClick={manualSync} disabled={syncing} className="bg-slate-100 text-slate-700 text-sm font-medium px-5 py-2 rounded-lg disabled:opacity-50">
          {syncing ? 'Syncing...' : 'Sync Now'}
        </button>
        {syncMsg && <p className="text-xs text-slate-500 mt-2">{syncMsg}</p>}
      </div>
    </div>
  )
}
