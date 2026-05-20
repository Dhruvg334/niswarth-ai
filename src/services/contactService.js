const DEFAULT_FORMSPREE_ENDPOINT = 'https://formspree.io/f/mzdwernl'

const CONTACT_ENDPOINT = import.meta.env.VITE_FORMSPREE_ENDPOINT || DEFAULT_FORMSPREE_ENDPOINT

function normalizeFormspreeError(payload) {
  if (!payload) return null
  if (Array.isArray(payload.errors) && payload.errors.length > 0) {
    return payload.errors.map((error) => error.message || error.code).filter(Boolean).join(', ')
  }
  if (payload.error) return payload.error
  return null
}

export async function submitContactInquiry(formData) {
  if (!CONTACT_ENDPOINT) {
    throw new Error('Contact endpoint is not configured.')
  }

  const response = await fetch(CONTACT_ENDPOINT, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: formData.name,
      email: formData.email,
      organization: formData.organization,
      city: formData.city,
      inquiry_type: formData.inquiryType,
      message: formData.message,
      _subject: `Niswarth AI inquiry: ${formData.inquiryType}`,
      _gotcha: formData.website || '',
    }),
  })

  let payload = null
  try {
    payload = await response.json()
  } catch {
    payload = null
  }

  if (!response.ok) {
    const errorMessage = normalizeFormspreeError(payload)
    throw new Error(errorMessage || 'The message could not be sent right now.')
  }

  return payload
}
