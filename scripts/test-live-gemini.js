import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { buildStructuredReportPrompt } from '../src/utils/aiReportPrompt.js'
import { DEFAULT_AI_MODEL, normalizeStructuredReport, parseStructuredText, validateStructuredReport } from '../src/utils/structuredReport.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const GEMINI_ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${DEFAULT_AI_MODEL}:generateContent`

async function readFixture(fileName) {
  const fixturePath = path.join(__dirname, '..', 'tests', 'fixtures', 'reportCases', fileName)
  const raw = await fs.readFile(fixturePath, 'utf8')
  return JSON.parse(raw)
}

async function callGemini(apiKey, campaign) {
  const prompt = buildStructuredReportPrompt(campaign)

  const response = await fetch(GEMINI_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-goog-api-key': apiKey,
    },
    body: JSON.stringify({
      contents: [
        {
          role: 'user',
          parts: [{ text: prompt }],
        },
      ],
      generationConfig: {
        temperature: 0.2,
        topP: 0.8,
        maxOutputTokens: 3200,
        responseMimeType: 'application/json',
        thinkingConfig: {
          thinkingBudget: 0,
        },
      },
    }),
  })

  const rawText = await response.text()
  let payload = {}

  try {
    payload = rawText ? JSON.parse(rawText) : {}
  } catch {
    payload = { rawText }
  }

  if (!response.ok) {
    throw new Error(payload?.error?.message || rawText || 'Gemini request failed.')
  }

  const candidate = payload?.candidates?.[0]
  const outputText = candidate?.content?.parts?.map((part) => part.text || '').join('\n').trim() || ''

  if (!outputText || candidate?.finishReason === 'MAX_TOKENS') {
    throw new Error(`Incomplete Gemini output. finishReason=${candidate?.finishReason || 'UNKNOWN'}`)
  }

  return outputText
}

function checkFixtureExpectations(report, fixture) {
  const issues = []
  const searchable = `${report.summary} ${report.evidenceUsed.map((item) => item.note).join(' ')} ${report.missingEvidence.join(' ')} ${report.riskFlags.join(' ')} ${report.nextActions.join(' ')}`.toLowerCase()

  for (const phrase of fixture.expectedEvidence || []) {
    if (!searchable.includes(String(phrase).toLowerCase())) {
      issues.push(`Expected evidence phrase not found: "${phrase}"`)
    }
  }

  for (const phrase of fixture.mustNotInvent || []) {
    if (searchable.includes(String(phrase).toLowerCase())) {
      issues.push(`Possible unsupported claim found: "${phrase}"`)
    }
  }

  return issues
}

async function main() {
  const apiKey = process.env.GEMINI_API_KEY

  if (!apiKey) {
    console.log('Skipping live Gemini test because GEMINI_API_KEY is not configured.')
    console.log('Set GEMINI_API_KEY locally and run npm run test:ai-live when you want to test real model behavior.')
    return
  }

  const fixtureFile = process.argv[2] || 'education-drive.json'
  const fixture = await readFixture(fixtureFile)

  console.log(`Running live Gemini structured report test: ${fixture.name}`)
  const outputText = await callGemini(apiKey, fixture.campaign)
  const parsed = parseStructuredText(outputText)
  const report = normalizeStructuredReport(parsed, fixture.campaign, {
    aiModel: DEFAULT_AI_MODEL,
    generationSource: 'gemini-live-test',
  })
  const validation = validateStructuredReport(report)
  const expectationIssues = checkFixtureExpectations(report, fixture)

  console.log('\nReport title:')
  console.log(report.title)
  console.log('\nConfidence:', report.confidence)
  console.log('Evidence items:', report.evidenceUsed.length)
  console.log('Missing evidence items:', report.missingEvidence.length)
  console.log('Risk flags:', report.riskFlags.length)
  console.log('Next actions:', report.nextActions.length)

  if (!validation.valid) {
    console.error('\nStructured report validation failed:')
    for (const error of validation.errors) console.error(`- ${error}`)
    process.exitCode = 1
    return
  }

  if (expectationIssues.length) {
    console.error('\nFixture expectation issues:')
    for (const issue of expectationIssues) console.error(`- ${issue}`)
    process.exitCode = 1
    return
  }

  console.log('\nLive Gemini structured report test passed.')
}

main().catch((error) => {
  console.error('Live Gemini structured report test failed.')
  console.error(error?.message || error)
  process.exitCode = 1
})
