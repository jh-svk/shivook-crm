import { buildClassificationPrompt, parseClassificationResponse } from '@/lib/claude'

describe('buildClassificationPrompt', () => {
  it('includes the event title and transcript', () => {
    const { userMessage } = buildClassificationPrompt({
      eventTitle: 'Discovery Call - Brightleaf',
      startTime: '2026-05-08T14:00:00Z',
      durationMinutes: 45,
      transcript: 'Jacob: Thanks for joining. Tell me about your store...',
    })
    expect(userMessage).toContain('Discovery Call - Brightleaf')
    expect(userMessage).toContain('Tell me about your store')
    expect(userMessage).toContain('45')
  })

  it('mentions Shivook context in the system prompt', () => {
    const { systemPrompt } = buildClassificationPrompt({
      eventTitle: 'Call',
      startTime: '2026-05-08T14:00:00Z',
      durationMinutes: 30,
      transcript: 'hello',
    })
    expect(systemPrompt).toContain('Shivook')
    expect(systemPrompt).toContain('DTC')
  })
})

describe('parseClassificationResponse', () => {
  it('parses a valid JSON response', () => {
    const raw = JSON.stringify({
      is_sales_call: true,
      confidence: 0.92,
      lead_name: 'Sarah Kim',
      company: 'Brightleaf',
      email: 'sarah@brightleaf.com',
      estimated_deal_size: '$1,500 PDP',
      lead_source: 'referral',
      call_summary: 'Sarah runs a skincare brand.',
      objections: ['price'],
      next_action: 'Follow up today',
    })
    const result = parseClassificationResponse(raw)
    expect(result.isSalesCall).toBe(true)
    expect(result.confidence).toBe(0.92)
    expect(result.leadName).toBe('Sarah Kim')
    expect(result.objections).toEqual(['price'])
  })

  it('returns isSalesCall false on parse failure', () => {
    const result = parseClassificationResponse('not valid json at all')
    expect(result.isSalesCall).toBe(false)
  })

  it('returns isSalesCall false if confidence below 0.7', () => {
    const raw = JSON.stringify({
      is_sales_call: true,
      confidence: 0.5,
      lead_name: 'Test',
      company: 'Co',
      email: null,
      estimated_deal_size: null,
      lead_source: null,
      call_summary: 'A call.',
      objections: [],
      next_action: null,
    })
    const result = parseClassificationResponse(raw)
    expect(result.isSalesCall).toBe(false)
  })
})
