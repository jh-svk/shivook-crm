export function filterNewEvents(
  events: Array<{ id: string; summary: string; attachments?: unknown[] }>,
  processedIds: Set<string>
): Array<{ id: string; summary: string; attachments?: unknown[] }> {
  return events.filter(
    (e) => !processedIds.has(e.id) && (e.attachments?.length ?? 0) > 0
  )
}

export function extractDocAttachment(
  attachments: Array<{ mimeType: string; fileId: string }>
): string | null {
  const doc = attachments.find(
    (a) => a.mimeType === 'application/vnd.google-apps.document'
  )
  return doc?.fileId ?? null
}
