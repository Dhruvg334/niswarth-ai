import test from 'node:test'
import assert from 'node:assert/strict'
import {
  normalizeStructuredReport,
  parseStructuredText,
  validateStructuredReport,
} from '../src/utils/structuredReport.js'

const campaign = {
  id: 'c1',
  title: 'Weekend Learning Support',
  updates: [
    { id: 'u1', update_text: '18 students attended a learning support session.' },
    { id: 'u2', update_text: 'Parents requested a follow-up session.' },
  ],
}

test('parseStructuredText extracts JSON from fenced output', () => {
  const parsed = parseStructuredText('```json\n{"title":"Test","summary":"Long enough summary placeholder."}\n```')
  assert.equal(parsed.title, 'Test')
})

test('normalizeStructuredReport repairs zero confidence from usable AI output', () => {
  const normalized = normalizeStructuredReport({
    title: 'Learning Support Impact Draft',
    summary: 'This draft is based on field updates from the learning support campaign. Volunteers recorded attendance and noted a request for a follow-up session. The report should be reviewed before external sharing because more evidence would improve the final impact narrative.',
    evidence_used: [{ field_update_id: 'u1', note: '18 students attended.' }],
    missing_evidence: ['Beneficiary feedback is not available yet.'],
    risk_flags: ['Do not claim learning improvement without assessment data.'],
    next_actions: ['Verify attendance count.'],
    review_required: true,
    confidence: 0,
  }, campaign)

  assert.ok(normalized.confidence >= 35)
  assert.ok(normalized.confidence <= 86)
})

test('normalizeStructuredReport accepts suggestedActions but returns only nextActions shape', () => {
  const normalized = normalizeStructuredReport({
    title: 'Learning Support Impact Draft',
    summary: 'This draft is based on field updates from the learning support campaign. Volunteers recorded attendance and noted a request for a follow-up session. The report should be reviewed before external sharing because more evidence would improve the final impact narrative.',
    evidence_used: ['18 students attended.'],
    missing_evidence: [],
    risk_flags: [],
    suggestedActions: ['Collect one more field note.'],
    review_required: true,
    confidence: 70,
  }, campaign)

  assert.deepEqual(normalized.nextActions, ['Collect one more field note.'])
  assert.equal(Object.hasOwn(normalized, 'suggestedActions'), false)
})

test('validateStructuredReport flags missing structure', () => {
  const result = validateStructuredReport({
    title: 'Incomplete',
    summary: 'Too short.',
    evidenceUsed: [],
    missingEvidence: [],
    riskFlags: [],
    nextActions: [],
    confidence: 80,
    reviewRequired: true,
  })

  assert.equal(result.valid, false)
  assert.ok(result.errors.some((error) => /summary/i.test(error)))
})
