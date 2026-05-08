import { isDueToday } from '@/lib/followup'

describe('isDueToday', () => {
  it('returns true when scheduledFor is today', () => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    expect(isDueToday(today)).toBe(true)
  })

  it('returns true when scheduledFor is in the past', () => {
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    expect(isDueToday(yesterday)).toBe(true)
  })

  it('returns false when scheduledFor is in the future', () => {
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    expect(isDueToday(tomorrow)).toBe(false)
  })
})
