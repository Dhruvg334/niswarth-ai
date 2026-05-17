export async function generateAiImpactReport(campaign) {
  const response = await fetch('/api/generate-report', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ campaign }),
  })

  const payload = await response.json().catch(() => ({}))

  if (!response.ok) {
    const message = payload?.error || 'AI report generation failed.'
    throw new Error(message)
  }

  return payload
}
