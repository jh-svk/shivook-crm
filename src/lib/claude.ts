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
    const confidence = typeof data.confidence === 'number' ? data.confidence : 0
    if (confidence < 0.7) {
      return { isSalesCall: false, confidence, leadName: null, company: null, email: null, estimatedDealSize: null, leadSource: null, callSummary: null, objections: [], nextAction: null }
    }
    return {
      isSalesCall: Boolean(data.is_sales_call),
      confidence,
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

export type DraftInput = {
  leadName: string
  company: string
  stageDay: 0 | 3 | 10 | 18
  callSummary: string
  objections: string[]
  estimatedDealSize: string | null
}

const STAGE_GOALS: Record<number, string> = {
  0: 'Ask for the decision directly. Mention the guarantee: 10% revenue lift in 30 days or full refund. This is the most direct message.',
  3: 'Short, low-pressure check-in. Offer to answer any questions or objections.',
  10: 'Add value with a brief reference to a result or case study from a similar client.',
  18: 'Clean breakup message. Honest, no guilt, leave the door open.',
}

const DRAFT_SYSTEM = `You are writing a follow-up message for Jacob Elbaum, CEO of Shivook CRO agency. Shivook's core offer includes a guarantee: 10% revenue lift in 30 days or full refund. Only mention the guarantee when the stage goal explicitly says to.

VOICE RULES (strictly enforced):
- Start with "Hey [name]"
- Direct and casual-professional
- Never use em-dashes (the — character or -- sequence)
- No emojis
- No "I hope this email finds you well" or similar filler
- Short, punchy sentences
- Maximum 4 sentences (Day 10 can be 5 if including a case study reference)

Write ONLY the message text. No subject line, no explanation, no prefix.`

export function buildDraftPrompt(input: DraftInput): {
  systemPrompt: string
  userMessage: string
} {
  const objectionText = input.objections.length > 0 ? input.objections.join(', ') : 'none mentioned'
  return {
    systemPrompt: DRAFT_SYSTEM,
    userMessage: `Stage: Day ${input.stageDay}
Goal: ${STAGE_GOALS[input.stageDay]}
Lead name: ${input.leadName}
Company: ${input.company}
Deal size: ${input.estimatedDealSize ?? 'unknown'}
Objections raised: ${objectionText}
Call summary: ${input.callSummary}`,
  }
}

export async function generateDraft(input: DraftInput): Promise<string> {
  const { systemPrompt, userMessage } = buildDraftPrompt(input)

  const response = await getClient().messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 512,
    system: systemPrompt,
    messages: [{ role: 'user', content: userMessage }],
  })

  const text = response.content[0].type === 'text' ? response.content[0].text : ''
  return text.trim().replace(/^["']|["']$/g, '')
}
