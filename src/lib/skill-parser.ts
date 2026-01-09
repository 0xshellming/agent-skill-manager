import { createGoogleGenerativeAI } from '@ai-sdk/google'
import { generateObject } from 'ai'
import { z } from 'zod'

const google = createGoogleGenerativeAI({
  apiKey: process.env.GOOGLE_AI_API_KEY!,
})

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
  const { object } = await generateObject({
    model: google('gemini-3-flash-preview'),
    schema: SkillSchema,
    prompt: `You are analyzing an AI Agent Skill from GitHub. Extract structured information.

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

Return structured data.`,
  })

  return object
}
