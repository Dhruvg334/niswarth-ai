import test from 'node:test'
import assert from 'node:assert/strict'
import { generateImpactReport } from '../src/utils/generateImpactReport.js'

test('generateImpactReport creates a complete evidence-grounded fallback report', () => {
  const report = generateImpactReport({
    title: 'Weekend Learning Support',
    location: 'Pune',
    status: 'Active',
    goal: 'Support children with weekend learning sessions.',
    volunteers: [{ id: 'v1' }, { id: 'v2' }],
    fieldUpdates: [
      { id: 'u1', update_text: '32 students attended the weekend session.' },
      { id: 'u2', update_text: 'Volunteers distributed stationery kits.' },
    ],
    metrics: { fieldUpdates: 2, volunteersAssigned: 2, draftReadiness: 78 },
  })

  assert.equal(report.title, 'Weekend Learning Support Impact Draft')
  assert.equal(report.confidence, 78)
  assert.match(report.summary, /32 students attended/)
  assert.match(report.summary, /human review/i)
  assert.equal(report.evidenceUsed.length, 2)
  assert.equal(report.evidenceUsed[0].field_update_id, 'u1')
  assert.ok(report.missingEvidence.length >= 1)
  assert.ok(report.riskFlags.length >= 1)
  assert.ok(report.nextActions.length >= 1)
  assert.equal(report.generationSource, 'local-fallback')
  assert.doesNotMatch(report.summary, /undefined|null|NaN/)
})

test('generateImpactReport handles campaigns without field evidence safely', () => {
  const report = generateImpactReport({
    title: 'New Environment Drive',
    location: 'Goa',
    status: 'Planning',
    metrics: {},
  })

  assert.match(report.summary, /No field updates have been added yet/i)
  assert.match(report.summary, /should not be shared externally/i)
  assert.ok(report.missingEvidence.some((item) => /Field updates/i.test(item)))
  assert.ok(report.riskFlags.some((item) => /no field evidence/i.test(item)))
  assert.doesNotMatch(report.summary, /undefined|null|NaN/)
})
