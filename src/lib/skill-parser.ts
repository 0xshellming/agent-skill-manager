import { createGoogleGenerativeAI } from '@ai-sdk/google'
import { generateObject } from 'ai'
import { z } from 'zod'

const FALLBACK_MODELS = [
  'gemini-3-flash-preview',
  'gemini-2.5-flash',
  'gemini-2.5-flash-lite',
  'gemini-2.0-flash',
  'gemini-2.0-flash-lite',
] as const

type GeminiModel = (typeof FALLBACK_MODELS)[number]

function getApiKeys(): string[] {
  const keysEnv = process.env.GOOGLE_AI_API_KEYS
  if (keysEnv) {
    return keysEnv
      .split(',')
      .map((k) => k.trim())
      .filter(Boolean)
  }
  const singleKey = process.env.GOOGLE_AI_API_KEY
  return singleKey ? [singleKey] : []
}

function getRandomApiKey(): string {
  const keys = getApiKeys()
  if (keys.length === 0) {
    throw new Error(
      'No Google AI API keys configured. Set GOOGLE_AI_API_KEYS or GOOGLE_AI_API_KEY.',
    )
  }
  return keys[Math.floor(Math.random() * keys.length)]
}

function createGoogleProvider() {
  return createGoogleGenerativeAI({ apiKey: getRandomApiKey() })
}

const SkillSchema = z.object({
  name: z.string().describe('Skill name, keep it concise'),

  description: z.string().describe('One-sentence description of the skill purpose'),

  category: z
    .enum([
      'document-processing',
      'development',
      'data-analysis',
      'business-marketing',
      'communication',
      'creative-media',
      'productivity',
      'security',
      'other',
    ])
    .describe('The most matching category'),

  tags: z.array(z.string()).max(5).describe('Related keywords, max 5'),

  useCases: z.array(z.string()).min(1).max(5).describe('Use cases, 1-5 items'),

  prerequisites: z.array(z.string()).describe('Prerequisites: tools, libraries or configurations'),

  compatibility: z
    .array(z.enum(['claude', 'openai', 'cursor', 'other']))
    .describe('Compatible AI platforms'),

  translations: z.object({
    zh: z.object({
      name: z.string().describe('Chinese name'),
      description: z.string().describe('Chinese description'),
      useCases: z.array(z.string()).describe('Chinese use cases'),
    }),
    ja: z.object({
      name: z.string().describe('Japanese name'),
      description: z.string().describe('Japanese description'),
      useCases: z.array(z.string()).describe('Japanese use cases'),
    }),
  }),
})

export type ParsedSkill = z.infer<typeof SkillSchema>

async function generateWithFallback(prompt: string): Promise<ParsedSkill> {
  let lastError: Error | null = null

  for (const modelName of FALLBACK_MODELS) {
    const google = createGoogleProvider()
    try {
      const { object } = await generateObject({
        model: google(modelName),
        schema: SkillSchema,
        prompt,
      })
      return object
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error))
      console.warn(`Model ${modelName} failed, trying next fallback...`, lastError.message)
    }
  }

  throw lastError ?? new Error('All Gemini models failed')
}

export async function parseSkillWithAI(
  skillMdContent: string,
  readmeContent: string | null,
  repoInfo: {
    owner: string
    repo: string
    skillName: string
    stars: number
  },
): Promise<ParsedSkill> {
  const prompt = `You are analyzing an AI Agent Skill from GitHub. Extract structured information.

## Repository Info
- Owner: ${repoInfo.owner}
- Repo: ${repoInfo.repo}
- Skill Name: ${repoInfo.skillName}
- Stars: ${repoInfo.stars}

## SKILL.md Content
\`\`\`markdown
${skillMdContent.slice(0, 8000)}
\`\`\`

${
  readmeContent
    ? `## README.md Content
\`\`\`markdown
${readmeContent.slice(0, 4000)}
\`\`\``
    : ''
}

## Requirements
1. Extract the skill's purpose and functionality
2. Choose the most appropriate category
3. Identify key use cases
4. List prerequisites (tools, libraries, etc.)
5. Determine platform compatibility (default to claude if uncertain)
6. Provide accurate Chinese and Japanese translations
7. Keep English technical terms in translations

Return structured data.`

  return generateWithFallback(prompt)
}
