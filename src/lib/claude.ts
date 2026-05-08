import Anthropic from '@anthropic-ai/sdk'

let _anthropic: Anthropic | null = null
function getClient() {
  if (!_anthropic) _anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  return _anthropic
}

export type ClassificationInput = {
  eventTitle: string
  startTime: string
  durationMinutes: number
  transcript: string
}

export type ClassificationResult = {
  isSalesCall: boolean
  confidence: number
  leadName: string | null
  company: string | null
  email: string | null
  estimatedDealSize: string | null
  leadSource: string | null
  callSummary: string | null
  objections: string[]
  nextAction: string | null
}

const CLASSIFICATION_SYSTEM = `You are a sales call classifier for Jacob Elbaum, CEO of Shivook — a CRO agency that builds performance-driven sales funnels for DTC ecommerce brands. Shivook sells: PDP builds at $1,500 flat (guaranteed 10% lift in revenue per visitor in 30 days or full refund), and monthly retainers at $2,500-$7K/mo.

Determine if this calendar event was a sales or discovery call where Jacob was selling Shivook's services to a potential client. Internal team calls, client check-ins on ongoing work, and personal calls are NOT sales calls.

Return ONLY valid JSON with this exact structure — no markdown, no explanation:
{
  "is_sales_call": boolean,
  "confidence": number between 0 and 1,
  "lead_name": string or null,
  "company": string or null,
  "email": string or null,
  "estimated_deal_size": string or null,
  "lead_source": string or null,
  "call_summary": "3-5 sentence summary" or null,
  "objections": [],
  "next_action": string or null
}`

export function buildClassificationPrompt(input: ClassificationInput): {
  systemPrompt: string
  userMessage: string
} {
  return {
    systemPrompt: CLASSIFICATION_SYSTEM,
    userMessage: `Event title: ${input.eventTitle}
Date/time: ${input.startTime}
Duration: ${input.durationMinutes} minutes

Transcript:
${input.transcript}`,
  }
}

export function parseClassificationResponse(raw: string): ClassificationResult {
  try {
    const cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
    const data = JSON.parse(cleaned)
    if (data.confidence < 0.7) {
      return { isSalesCall: false, confidence: data.confidence, leadName: null, company: null, email: null, estimatedDealSize: null, leadSource: null, callSummary: null, objections: [], nextAction: null }
    }
    return {
      isSalesCall: Boolean(data.is_sales_call),
      confidence: data.confidence,
      leadName: data.lead_name ?? null,
      company: data.company ?? null,
      email: data.email ?? null,
      estimatedDealSize: data.estimated_deal_size ?? null,
      leadSource: data.lead_source ?? null,
      callSummary: data.call_summary ?? null,
      objections: Array.isArray(data.objections) ? data.objections : [],
      nextAction: data.next_action ?? null,
    }
  } catch {
    return { isSalesCall: false, confidence: 0, leadName: null, company: null, email: null, estimatedDealSize: null, leadSource: null, callSummary: null, objections: [], nextAction: null }
  }
}

export async function classifyCall(input: ClassificationInput): Promise<ClassificationResult> {
  const { systemPrompt, userMessage } = buildClassificationPrompt(input)

  const response = await getClient().messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1024,
    system: systemPrompt,
    messages: [{ role: 'user', content: userMessage }],
  })

  const text = response.content[0].type === 'text' ? response.content[0].text : ''
  return parseClassificationResponse(text)
}
