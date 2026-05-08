import { filterNewEvents, extractDocAttachment } from '@/lib/poller'

describe('filterNewEvents', () => {
  it('excludes events whose ID is in the processed set', () => {
    const events = [
      { id: 'evt1', summary: 'Discovery Call', attachments: [{ mimeType: 'application/vnd.google-apps.document', fileId: 'doc1' }] },
      { id: 'evt2', summary: 'Team Sync', attachments: [{ mimeType: 'application/vnd.google-apps.document', fileId: 'doc2' }] },
    ]
    const processed = new Set(['evt1'])
    expect(filterNewEvents(events, processed)).toEqual([events[1]])
  })

  it('excludes events with no attachments', () => {
    const events = [
      { id: 'evt1', summary: 'Discovery Call', attachments: [] },
      { id: 'evt2', summary: 'Discovery Call', attachments: [{ mimeType: 'application/vnd.google-apps.document', fileId: 'doc1' }] },
    ]
    expect(filterNewEvents(events, new Set())).toEqual([events[1]])
  })
})

describe('extractDocAttachment', () => {
  it('returns the fileId of the first Google Doc attachment', () => {
    const attachments = [
      { mimeType: 'image/png', fileId: 'img1' },
      { mimeType: 'application/vnd.google-apps.document', fileId: 'doc1' },
    ]
    expect(extractDocAttachment(attachments)).toBe('doc1')
  })

  it('returns null if no Google Doc attachment', () => {
    const attachments = [{ mimeType: 'image/png', fileId: 'img1' }]
    expect(extractDocAttachment(attachments)).toBeNull()
  })
})

import { scheduleFollowUpDates } from '@/lib/poller'

describe('scheduleFollowUpDates', () => {
  it('returns correct dates for each follow-up stage', () => {
    const callDate = new Date('2026-05-08T14:00:00Z')
    const dates = scheduleFollowUpDates(callDate)
    expect(dates[3].toISOString().startsWith('2026-05-11')).toBe(true)
    expect(dates[10].toISOString().startsWith('2026-05-18')).toBe(true)
    expect(dates[18].toISOString().startsWith('2026-05-26')).toBe(true)
  })
})
