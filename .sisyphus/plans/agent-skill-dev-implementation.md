# Agent Skill Manager - Implementation Plan

> **Project**: agent-skill.dev
> **Goal**: Create an SEO-optimized website for AI Agent Skills discovery
> **Timeline**: 5-7 days for MVP
> **Tech Stack**: Payload CMS + Cloudflare (Workers/D1/R2) + Gemini 2.5 Flash

---

## Overview

Build a skill registry website similar to npm for AI Agent Skills, with:
- SEO-first approach for organic traffic
- Multi-language support (en/zh/ja)
- Data sourced from GitHub repositories
- AI-powered content parsing with Gemini 2.5 Flash

---

## Phase 1: Project Setup (Day 1)

### Task 1.1: Create Payload CMS Project

```bash
# Create project from official Cloudflare template
npx create-payload-app@latest agent-skill-web --template with-cloudflare-d1

cd agent-skill-web
pnpm install
```

**Acceptance Criteria:**
- [ ] Project created successfully
- [ ] `pnpm dev` runs without errors
- [ ] Payload admin panel accessible at `/admin`

### Task 1.2: Install Additional Dependencies

```bash
pnpm add ai @ai-sdk/google zod
pnpm add -D @types/node
```

**Dependencies:**
| Package | Purpose |
|---------|---------|
| `ai` | Vercel AI SDK core |
| `@ai-sdk/google` | Gemini provider |
| `zod` | Schema validation for structured output |

### Task 1.3: Configure Environment Variables

Create `.env` file:

```env
# Payload
PAYLOAD_SECRET=<generate-with-openssl-rand-hex-32>

# Google AI (Gemini)
GOOGLE_AI_API_KEY=<your-gemini-api-key>

# GitHub (for API rate limits)
GITHUB_TOKEN=<your-github-token>

# Cloudflare (auto-configured by wrangler)
CLOUDFLARE_ACCOUNT_ID=
CLOUDFLARE_API_TOKEN=
```

### Task 1.4: Configure Payload for Multi-language

Update `src/payload.config.ts`:

```typescript
import { buildConfig } from 'payload'
import { sqliteD1Adapter } from '@payloadcms/db-d1-sqlite'
import { r2Storage } from '@payloadcms/storage-r2'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { seoPlugin } from '@payloadcms/plugin-seo'
import { getCloudflareContext } from '@opennextjs/cloudflare'

import { Skills } from './collections/Skills'
import { Categories } from './collections/Categories'
import { Users } from './collections/Users'
import { Media } from './collections/Media'

const cloudflare = await getCloudflareContext({ async: true })

export default buildConfig({
  admin: {
    user: Users.slug,
  },
  
  collections: [Users, Media, Skills, Categories],
  
  editor: lexicalEditor(),
  
  // Multi-language support
  localization: {
    locales: [
      { label: 'English', code: 'en' },
      { label: '中文', code: 'zh' },
      { label: '日本語', code: 'ja' },
    ],
    defaultLocale: 'en',
    fallback: true,
  },
  
  // Cloudflare D1 database
  db: sqliteD1Adapter({
    binding: cloudflare.env.D1,
  }),
  
  // Plugins
  plugins: [
    r2Storage({
      bucket: cloudflare.env.R2,
      collections: { media: true },
    }),
    seoPlugin({
      collections: ['skills'],
      generateTitle: ({ doc }) => `${doc.name} - AI Agent Skill | agent-skill.dev`,
      generateDescription: ({ doc }) => doc.description,
    }),
  ],
  
  typescript: {
    outputFile: 'src/payload-types.ts',
  },
})
```

---

## Phase 2: Define Collections (Day 1-2)

### Task 2.1: Skills Collection

Create `src/collections/Skills.ts`:

```typescript
import { CollectionConfig } from 'payload'

export const Skills: CollectionConfig = {
  slug: 'skills',
  
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'author', 'category', 'stars', 'updatedAt'],
    group: 'Content',
  },
  
  // Enable versioning for content changes
  versions: {
    drafts: true,
  },
  
  fields: [
    // Basic Info
    {
      name: 'name',
      type: 'text',
      required: true,
      localized: true,
      admin: {
        description: 'Display name of the skill',
      },
    },
    {
      name: 'slug',
      type: 'text',
      required: true,
      unique: true,
      admin: {
        position: 'sidebar',
        description: 'URL-friendly identifier',
      },
      hooks: {
        beforeValidate: [
          ({ value, data }) => {
            if (!value && data?.name) {
              return data.name
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, '-')
                .replace(/(^-|-$)/g, '')
            }
            return value
          },
        ],
      },
    },
    {
      name: 'description',
      type: 'textarea',
      required: true,
      localized: true,
      admin: {
        description: 'Brief description (used for SEO meta description)',
      },
    },
    
    // Source Info
    {
      name: 'author',
      type: 'text',
      required: true,
      admin: {
        description: 'GitHub username or organization',
      },
    },
    {
      name: 'githubUrl',
      type: 'text',
      required: true,
      admin: {
        description: 'Full GitHub URL to the skill',
      },
    },
    {
      name: 'sourceRepo',
      type: 'text',
      required: true,
      admin: {
        description: 'Format: owner/repo',
      },
    },
    {
      name: 'stars',
      type: 'number',
      defaultValue: 0,
      admin: {
        position: 'sidebar',
      },
    },
    
    // Classification
    {
      name: 'category',
      type: 'select',
      required: true,
      options: [
        { label: 'Document Processing', value: 'document-processing' },
        { label: 'Development & Code', value: 'development' },
        { label: 'Data & Analysis', value: 'data-analysis' },
        { label: 'Business & Marketing', value: 'business-marketing' },
        { label: 'Communication', value: 'communication' },
        { label: 'Creative & Media', value: 'creative-media' },
        { label: 'Productivity', value: 'productivity' },
        { label: 'Security', value: 'security' },
        { label: 'Other', value: 'other' },
      ],
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'tags',
      type: 'array',
      admin: {
        description: 'Keywords for search and filtering',
      },
      fields: [
        {
          name: 'tag',
          type: 'text',
        },
      ],
    },
    {
      name: 'compatibility',
      type: 'select',
      hasMany: true,
      defaultValue: ['claude'],
      options: [
        { label: 'Claude', value: 'claude' },
        { label: 'OpenAI Codex', value: 'openai' },
        { label: 'Cursor', value: 'cursor' },
        { label: 'Other', value: 'other' },
      ],
      admin: {
        position: 'sidebar',
      },
    },
    
    // Content (localized)
    {
      name: 'readme',
      type: 'richText',
      localized: true,
      admin: {
        description: 'Rendered README content',
      },
    },
    {
      name: 'useCases',
      type: 'array',
      localized: true,
      admin: {
        description: 'When to use this skill',
      },
      fields: [
        {
          name: 'useCase',
          type: 'text',
        },
      ],
    },
    {
      name: 'prerequisites',
      type: 'array',
      admin: {
        description: 'Required tools or dependencies',
      },
      fields: [
        {
          name: 'prerequisite',
          type: 'text',
        },
      ],
    },
    
    // Installation
    {
      name: 'installCommand',
      type: 'text',
      admin: {
        description: 'CLI install command (e.g., askm install author/skill)',
      },
    },
    
    // Raw content for reference
    {
      name: 'rawSkillMd',
      type: 'textarea',
      admin: {
        description: 'Original SKILL.md content',
        condition: (data) => Boolean(data?.rawSkillMd),
      },
    },
  ],
  
  // Indexes for performance
  indexes: [
    { fields: { category: 1 } },
    { fields: { author: 1 } },
    { fields: { stars: -1 } },
  ],
}
```

### Task 2.2: Categories Collection

Create `src/collections/Categories.ts`:

```typescript
import { CollectionConfig } from 'payload'

export const Categories: CollectionConfig = {
  slug: 'categories',
  
  admin: {
    useAsTitle: 'name',
    group: 'Content',
  },
  
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
      localized: true,
    },
    {
      name: 'slug',
      type: 'text',
      required: true,
      unique: true,
    },
    {
      name: 'description',
      type: 'textarea',
      localized: true,
    },
    {
      name: 'icon',
      type: 'text',
      admin: {
        description: 'Emoji or icon identifier',
      },
    },
    {
      name: 'order',
      type: 'number',
      defaultValue: 0,
      admin: {
        description: 'Display order (lower = first)',
      },
    },
  ],
}
```

### Task 2.3: Run Migrations

```bash
# Generate types
pnpm payload generate:types

# Create and run migrations
pnpm payload migrate:create
pnpm payload migrate
```

**Acceptance Criteria:**
- [ ] All collections appear in Payload admin
- [ ] Can create/edit skills manually
- [ ] Multi-language fields work correctly

---

## Phase 3: AI-Powered Data Parser (Day 2-3)

### Task 3.1: Create Skill Parser with Gemini

Create `src/lib/skill-parser.ts`:

```typescript
import { createGoogleGenerativeAI } from '@ai-sdk/google'
import { generateObject } from 'ai'
import { z } from 'zod'

const google = createGoogleGenerativeAI({
  apiKey: process.env.GOOGLE_AI_API_KEY!,
})

// Structured output schema
const SkillSchema = z.object({
  name: z.string().describe('The skill name, keep it concise'),
  description: z.string().describe('One-sentence description of what the skill does'),
  category: z.enum([
    'document-processing',
    'development',
    'data-analysis',
    'business-marketing',
    'communication',
    'creative-media',
    'productivity',
    'security',
    'other',
  ]).describe('Best matching category for this skill'),
  tags: z.array(z.string()).max(5).describe('Relevant keywords, max 5'),
  useCases: z.array(z.string()).min(1).max(5).describe('When to use this skill, 1-5 items'),
  prerequisites: z.array(z.string()).describe('Required tools, libraries, or setup'),
  compatibility: z.array(z.enum(['claude', 'openai', 'cursor', 'other'])).describe('Compatible AI platforms'),
  
  // Translations
  translations: z.object({
    zh: z.object({
      name: z.string().describe('Chinese translation of name'),
      description: z.string().describe('Chinese translation of description'),
      useCases: z.array(z.string()).describe('Chinese translations of use cases'),
    }),
    ja: z.object({
      name: z.string().describe('Japanese translation of name'),
      description: z.string().describe('Japanese translation of description'),
      useCases: z.array(z.string()).describe('Japanese translations of use cases'),
    }),
  }),
})

export type ParsedSkill = z.infer<typeof SkillSchema>

export async function parseSkillWithAI(
  skillMdContent: string,
  readmeContent: string | null,
  repoInfo: { owner: string; repo: string; skillName: string; stars: number }
): Promise<ParsedSkill> {
  const { object } = await generateObject({
    model: google('gemini-3-flash-preview'),
    schema: SkillSchema,
    prompt: `You are analyzing an AI Agent Skill from GitHub. Extract structured information.

## Repository Info
- Owner: ${repoInfo.owner}
- Repository: ${repoInfo.repo}
- Skill Name: ${repoInfo.skillName}
- Stars: ${repoInfo.stars}

## SKILL.md Content
\`\`\`markdown
${skillMdContent.slice(0, 8000)}
\`\`\`

${readmeContent ? `## README.md Content
\`\`\`markdown
${readmeContent.slice(0, 4000)}
\`\`\`` : ''}

## Instructions
1. Extract the skill's purpose and functionality
2. Categorize it appropriately
3. Identify key use cases
4. List any prerequisites (tools, libraries, etc.)
5. Determine platform compatibility (default to 'claude' if unclear)
6. Provide accurate Chinese and Japanese translations
7. Keep technical terms in English for translations

Return the structured data.`,
  })

  return object
}
```

### Task 3.2: Create GitHub Fetcher

Create `src/lib/github.ts`:

```typescript
const GITHUB_API = 'https://api.github.com'
const RAW_GITHUB = 'https://raw.githubusercontent.com'

interface FetchOptions {
  token?: string
}

async function fetchWithAuth(url: string, options: FetchOptions = {}) {
  const headers: Record<string, string> = {
    'User-Agent': 'agent-skill-crawler',
    'Accept': 'application/vnd.github.v3+json',
  }
  
  if (options.token) {
    headers['Authorization'] = `token ${options.token}`
  }
  
  const response = await fetch(url, { headers })
  
  if (!response.ok) {
    throw new Error(`GitHub API error: ${response.status} ${response.statusText}`)
  }
  
  return response
}

export async function fetchRepoInfo(owner: string, repo: string, token?: string) {
  const response = await fetchWithAuth(
    `${GITHUB_API}/repos/${owner}/${repo}`,
    { token }
  )
  return response.json()
}

export async function fetchRepoContents(
  owner: string,
  repo: string,
  path: string,
  branch = 'main',
  token?: string
) {
  const response = await fetchWithAuth(
    `${GITHUB_API}/repos/${owner}/${repo}/contents/${path}?ref=${branch}`,
    { token }
  )
  return response.json()
}

export async function fetchRawFile(
  owner: string,
  repo: string,
  path: string,
  branch = 'main'
): Promise<string | null> {
  try {
    const response = await fetch(
      `${RAW_GITHUB}/${owner}/${repo}/${branch}/${path}`
    )
    
    if (!response.ok) return null
    
    return response.text()
  } catch {
    return null
  }
}

export async function fetchSkillDirectories(
  owner: string,
  repo: string,
  skillsPath: string,
  token?: string
): Promise<string[]> {
  try {
    const contents = await fetchRepoContents(owner, repo, skillsPath, 'main', token)
    
    return contents
      .filter((item: any) => 
        item.type === 'dir' && 
        !item.name.startsWith('.') &&
        !item.name.startsWith('_')
      )
      .map((item: any) => item.name)
  } catch (error) {
    console.error(`Failed to fetch ${owner}/${repo}/${skillsPath}:`, error)
    return []
  }
}
```

### Task 3.3: Create Skill Crawler

Create `src/lib/skill-crawler.ts`:

```typescript
import { getPayload } from 'payload'
import config from '@payload-config'
import { parseSkillWithAI } from './skill-parser'
import { fetchRepoInfo, fetchRawFile, fetchSkillDirectories } from './github'

interface SkillSource {
  owner: string
  repo: string
  skillsPath: string
  branch?: string
}

const SKILL_SOURCES: SkillSource[] = [
  // Official Anthropic skills
  { owner: 'anthropics', repo: 'skills', skillsPath: 'skills' },
  
  // Official OpenAI skills
  { owner: 'openai', repo: 'skills', skillsPath: 'skills/.curated' },
  { owner: 'openai', repo: 'skills', skillsPath: 'skills/.system' },
  
  // Community skills from awesome-claude-skills
  { owner: 'ComposioHQ', repo: 'awesome-claude-skills', skillsPath: '' },
]

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

export async function crawlAllSkills() {
  const payload = await getPayload({ config })
  const token = process.env.GITHUB_TOKEN
  
  console.log('🚀 Starting skill crawl...')
  
  let totalIndexed = 0
  let totalFailed = 0
  
  for (const source of SKILL_SOURCES) {
    console.log(`\n📂 Processing ${source.owner}/${source.repo}/${source.skillsPath}`)
    
    try {
      const repoInfo = await fetchRepoInfo(source.owner, source.repo, token)
      
      // Get skill directories
      let skillDirs: string[]
      
      if (source.skillsPath === '') {
        // For awesome-claude-skills, get root directories (each is a skill)
        const contents = await fetchRepoContents(
          source.owner,
          source.repo,
          '',
          source.branch || 'master',
          token
        )
        skillDirs = contents
          .filter((item: any) => 
            item.type === 'dir' && 
            !item.name.startsWith('.') &&
            !['node_modules', 'dist', 'build'].includes(item.name)
          )
          .map((item: any) => item.name)
      } else {
        skillDirs = await fetchSkillDirectories(
          source.owner,
          source.repo,
          source.skillsPath,
          token
        )
      }
      
      console.log(`  Found ${skillDirs.length} skill directories`)
      
      for (const skillDir of skillDirs) {
        try {
          const skillPath = source.skillsPath 
            ? `${source.skillsPath}/${skillDir}`
            : skillDir
          
          // Fetch SKILL.md
          const skillMd = await fetchRawFile(
            source.owner,
            source.repo,
            `${skillPath}/SKILL.md`,
            source.branch || 'main'
          )
          
          if (!skillMd) {
            console.log(`  ⚠️ No SKILL.md found for ${skillDir}`)
            continue
          }
          
          // Fetch README.md (optional)
          const readme = await fetchRawFile(
            source.owner,
            source.repo,
            `${skillPath}/README.md`,
            source.branch || 'main'
          )
          
          // Parse with AI
          const parsed = await parseSkillWithAI(skillMd, readme, {
            owner: source.owner,
            repo: source.repo,
            skillName: skillDir,
            stars: repoInfo.stargazers_count || 0,
          })
          
          const skillSlug = slugify(skillDir)
          const skillId = `${source.owner}/${skillDir}`
          
          // Check if skill exists
          const existing = await payload.find({
            collection: 'skills',
            where: { slug: { equals: skillSlug } },
            limit: 1,
          })
          
          const skillData = {
            name: parsed.name,
            slug: skillSlug,
            description: parsed.description,
            author: source.owner,
            githubUrl: `https://github.com/${source.owner}/${source.repo}/tree/main/${skillPath}`,
            sourceRepo: `${source.owner}/${source.repo}`,
            stars: repoInfo.stargazers_count || 0,
            category: parsed.category,
            tags: parsed.tags.map(tag => ({ tag })),
            compatibility: parsed.compatibility,
            useCases: parsed.useCases.map(useCase => ({ useCase })),
            prerequisites: parsed.prerequisites.map(prerequisite => ({ prerequisite })),
            installCommand: `askm install ${skillId}`,
            rawSkillMd: skillMd,
          }
          
          if (existing.docs.length > 0) {
            // Update existing
            await payload.update({
              collection: 'skills',
              id: existing.docs[0].id,
              data: skillData,
              locale: 'en',
            })
          } else {
            // Create new
            await payload.create({
              collection: 'skills',
              data: skillData,
              locale: 'en',
            })
          }
          
          // Update translations
          const skill = await payload.find({
            collection: 'skills',
            where: { slug: { equals: skillSlug } },
            limit: 1,
          })
          
          if (skill.docs.length > 0) {
            // Chinese translation
            await payload.update({
              collection: 'skills',
              id: skill.docs[0].id,
              data: {
                name: parsed.translations.zh.name,
                description: parsed.translations.zh.description,
                useCases: parsed.translations.zh.useCases.map(useCase => ({ useCase })),
              },
              locale: 'zh',
            })
            
            // Japanese translation
            await payload.update({
              collection: 'skills',
              id: skill.docs[0].id,
              data: {
                name: parsed.translations.ja.name,
                description: parsed.translations.ja.description,
                useCases: parsed.translations.ja.useCases.map(useCase => ({ useCase })),
              },
              locale: 'ja',
            })
          }
          
          console.log(`  ✅ Indexed: ${skillId}`)
          totalIndexed++
          
          // Rate limiting: wait 500ms between AI calls
          await new Promise(resolve => setTimeout(resolve, 500))
          
        } catch (error) {
          console.error(`  ❌ Failed: ${skillDir}`, error)
          totalFailed++
        }
      }
    } catch (error) {
      console.error(`Failed to process source ${source.owner}/${source.repo}:`, error)
    }
  }
  
  console.log(`\n🏁 Crawl completed: ${totalIndexed} indexed, ${totalFailed} failed`)
  
  return { indexed: totalIndexed, failed: totalFailed }
}
```

### Task 3.4: Create Crawl API Endpoint

Create `src/app/api/crawl/route.ts`:

```typescript
import { NextResponse } from 'next/server'
import { crawlAllSkills } from '@/lib/skill-crawler'

export async function POST(request: Request) {
  // Verify secret token for security
  const authHeader = request.headers.get('authorization')
  const expectedToken = process.env.CRAWL_SECRET
  
  if (expectedToken && authHeader !== `Bearer ${expectedToken}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  try {
    const result = await crawlAllSkills()
    return NextResponse.json(result)
  } catch (error) {
    console.error('Crawl failed:', error)
    return NextResponse.json(
      { error: 'Crawl failed', details: String(error) },
      { status: 500 }
    )
  }
}
```

**Acceptance Criteria:**
- [ ] AI parser correctly extracts skill metadata
- [ ] Translations are generated for zh/ja
- [ ] Skills are created/updated in Payload
- [ ] API endpoint triggers crawl successfully

---

## Phase 4: Frontend Pages (Day 3-4)

### Task 4.1: Homepage

Create `src/app/(frontend)/[locale]/page.tsx`:

```typescript
import { getPayload } from 'payload'
import config from '@payload-config'
import Link from 'next/link'
import { Metadata } from 'next'

interface Props {
  params: { locale: string }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const titles: Record<string, string> = {
    en: 'Agent Skill Manager - Discover AI Agent Skills',
    zh: 'Agent Skill Manager - 发现 AI 代理技能',
    ja: 'Agent Skill Manager - AIエージェントスキルを発見',
  }
  
  const descriptions: Record<string, string> = {
    en: 'Browse and install AI agent skills for Claude, OpenAI Codex, Cursor, and more. The npm for AI skills.',
    zh: '浏览和安装适用于 Claude、OpenAI Codex、Cursor 等的 AI 代理技能。AI 技能的 npm。',
    ja: 'Claude、OpenAI Codex、Cursorなど向けのAIエージェントスキルを閲覧・インストール。',
  }
  
  return {
    title: titles[params.locale] || titles.en,
    description: descriptions[params.locale] || descriptions.en,
    alternates: {
      canonical: `/${params.locale}`,
      languages: {
        en: '/en',
        zh: '/zh',
        ja: '/ja',
      },
    },
  }
}

export default async function HomePage({ params }: Props) {
  const payload = await getPayload({ config })
  const { locale } = params
  
  // Fetch featured skills
  const featuredSkills = await payload.find({
    collection: 'skills',
    locale,
    limit: 12,
    sort: '-stars',
  })
  
  // Fetch categories with counts
  const categories = [
    { slug: 'document-processing', name: 'Document Processing', icon: '📄' },
    { slug: 'development', name: 'Development & Code', icon: '💻' },
    { slug: 'data-analysis', name: 'Data & Analysis', icon: '📊' },
    { slug: 'business-marketing', name: 'Business & Marketing', icon: '📈' },
    { slug: 'communication', name: 'Communication', icon: '✍️' },
    { slug: 'creative-media', name: 'Creative & Media', icon: '🎨' },
    { slug: 'productivity', name: 'Productivity', icon: '⚡' },
    { slug: 'security', name: 'Security', icon: '🔒' },
  ]
  
  return (
    <main>
      {/* Hero Section */}
      <section className="hero">
        <h1>The npm for AI Agent Skills</h1>
        <p>Discover, install, and share skills for Claude, OpenAI Codex, and more.</p>
        
        <div className="install-example">
          <code>askm install anthropics/pdf</code>
        </div>
      </section>
      
      {/* Categories */}
      <section className="categories">
        <h2>Browse by Category</h2>
        <div className="category-grid">
          {categories.map(cat => (
            <Link 
              key={cat.slug} 
              href={`/${locale}/category/${cat.slug}`}
              className="category-card"
            >
              <span className="icon">{cat.icon}</span>
              <span className="name">{cat.name}</span>
            </Link>
          ))}
        </div>
      </section>
      
      {/* Featured Skills */}
      <section className="featured-skills">
        <h2>Popular Skills</h2>
        <div className="skill-grid">
          {featuredSkills.docs.map(skill => (
            <Link 
              key={skill.id} 
              href={`/${locale}/skill/${skill.slug}`}
              className="skill-card"
            >
              <h3>{skill.name}</h3>
              <p>{skill.description}</p>
              <div className="meta">
                <span className="author">by {skill.author}</span>
                <span className="stars">⭐ {skill.stars}</span>
              </div>
            </Link>
          ))}
        </div>
        
        <Link href={`/${locale}/skills`} className="view-all">
          View All Skills →
        </Link>
      </section>
    </main>
  )
}
```

### Task 4.2: Skill Detail Page

Create `src/app/(frontend)/[locale]/skill/[slug]/page.tsx`:

```typescript
import { getPayload } from 'payload'
import config from '@payload-config'
import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'

interface Props {
  params: { locale: string; slug: string }
}

export async function generateStaticParams() {
  const payload = await getPayload({ config })
  const skills = await payload.find({
    collection: 'skills',
    limit: 1000,
  })
  
  const locales = ['en', 'zh', 'ja']
  
  return skills.docs.flatMap(skill =>
    locales.map(locale => ({
      locale,
      slug: skill.slug,
    }))
  )
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const payload = await getPayload({ config })
  const { locale, slug } = params
  
  const result = await payload.find({
    collection: 'skills',
    where: { slug: { equals: slug } },
    locale,
    limit: 1,
  })
  
  const skill = result.docs[0]
  if (!skill) return { title: 'Skill Not Found' }
  
  return {
    title: `${skill.name} - AI Agent Skill | agent-skill.dev`,
    description: skill.description,
    
    openGraph: {
      title: skill.name,
      description: skill.description,
      url: `https://agent-skill.dev/${locale}/skill/${slug}`,
      siteName: 'Agent Skill Manager',
      type: 'article',
    },
    
    twitter: {
      card: 'summary_large_image',
      title: skill.name,
      description: skill.description,
    },
    
    alternates: {
      canonical: `/${locale}/skill/${slug}`,
      languages: {
        en: `/en/skill/${slug}`,
        zh: `/zh/skill/${slug}`,
        ja: `/ja/skill/${slug}`,
      },
    },
  }
}

export default async function SkillPage({ params }: Props) {
  const payload = await getPayload({ config })
  const { locale, slug } = params
  
  const result = await payload.find({
    collection: 'skills',
    where: { slug: { equals: slug } },
    locale,
    limit: 1,
  })
  
  const skill = result.docs[0]
  if (!skill) notFound()
  
  // Fetch related skills
  const related = await payload.find({
    collection: 'skills',
    where: {
      and: [
        { category: { equals: skill.category } },
        { slug: { not_equals: slug } },
      ],
    },
    locale,
    limit: 4,
  })
  
  return (
    <>
      {/* Schema.org Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'SoftwareApplication',
            name: skill.name,
            description: skill.description,
            applicationCategory: 'DeveloperApplication',
            operatingSystem: 'Cross-platform',
            offers: {
              '@type': 'Offer',
              price: '0',
              priceCurrency: 'USD',
            },
            author: {
              '@type': 'Person',
              name: skill.author,
              url: `https://github.com/${skill.author}`,
            },
            codeRepository: skill.githubUrl,
          }),
        }}
      />
      
      <article className="skill-page">
        {/* Breadcrumb */}
        <nav className="breadcrumb">
          <Link href={`/${locale}`}>Home</Link>
          <span>/</span>
          <Link href={`/${locale}/skills`}>Skills</Link>
          <span>/</span>
          <Link href={`/${locale}/category/${skill.category}`}>
            {skill.category}
          </Link>
          <span>/</span>
          <span>{skill.name}</span>
        </nav>
        
        {/* Header */}
        <header className="skill-header">
          <h1>{skill.name}</h1>
          <p className="description">{skill.description}</p>
          
          <div className="meta">
            <span className="author">
              by <a href={`https://github.com/${skill.author}`}>{skill.author}</a>
            </span>
            <span className="stars">⭐ {skill.stars}</span>
            <span className="category">{skill.category}</span>
          </div>
          
          {/* Install Command */}
          <div className="install-command">
            <code>{skill.installCommand}</code>
            <button 
              onClick={() => navigator.clipboard.writeText(skill.installCommand)}
              className="copy-btn"
            >
              Copy
            </button>
          </div>
          
          {/* Tags */}
          {skill.tags && skill.tags.length > 0 && (
            <div className="tags">
              {skill.tags.map((t: any, i: number) => (
                <span key={i} className="tag">{t.tag}</span>
              ))}
            </div>
          )}
        </header>
        
        {/* Use Cases */}
        {skill.useCases && skill.useCases.length > 0 && (
          <section className="use-cases">
            <h2>When to Use</h2>
            <ul>
              {skill.useCases.map((uc: any, i: number) => (
                <li key={i}>{uc.useCase}</li>
              ))}
            </ul>
          </section>
        )}
        
        {/* Prerequisites */}
        {skill.prerequisites && skill.prerequisites.length > 0 && (
          <section className="prerequisites">
            <h2>Prerequisites</h2>
            <ul>
              {skill.prerequisites.map((p: any, i: number) => (
                <li key={i}>{p.prerequisite}</li>
              ))}
            </ul>
          </section>
        )}
        
        {/* Compatibility */}
        <section className="compatibility">
          <h2>Compatible With</h2>
          <div className="platforms">
            {skill.compatibility?.map((platform: string) => (
              <span key={platform} className="platform">{platform}</span>
            ))}
          </div>
        </section>
        
        {/* GitHub Link */}
        <section className="github">
          <a 
            href={skill.githubUrl} 
            target="_blank" 
            rel="noopener noreferrer"
            className="github-link"
          >
            View on GitHub →
          </a>
        </section>
        
        {/* Related Skills */}
        {related.docs.length > 0 && (
          <section className="related">
            <h2>Related Skills</h2>
            <div className="skill-grid">
              {related.docs.map(s => (
                <Link key={s.id} href={`/${locale}/skill/${s.slug}`}>
                  <h3>{s.name}</h3>
                  <p>{s.description}</p>
                </Link>
              ))}
            </div>
          </section>
        )}
      </article>
    </>
  )
}
```

### Task 4.3: Skills List Page

Create `src/app/(frontend)/[locale]/skills/page.tsx`:

```typescript
import { getPayload } from 'payload'
import config from '@payload-config'
import Link from 'next/link'
import { Metadata } from 'next'

interface Props {
  params: { locale: string }
  searchParams: { category?: string; page?: string }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return {
    title: 'All AI Agent Skills | agent-skill.dev',
    description: 'Browse all available AI agent skills for Claude, OpenAI Codex, Cursor, and more.',
    alternates: {
      canonical: `/${params.locale}/skills`,
      languages: {
        en: '/en/skills',
        zh: '/zh/skills',
        ja: '/ja/skills',
      },
    },
  }
}

export default async function SkillsListPage({ params, searchParams }: Props) {
  const payload = await getPayload({ config })
  const { locale } = params
  const page = parseInt(searchParams.page || '1', 10)
  const category = searchParams.category
  
  const where: any = {}
  if (category) {
    where.category = { equals: category }
  }
  
  const skills = await payload.find({
    collection: 'skills',
    locale,
    where,
    page,
    limit: 24,
    sort: '-stars',
  })
  
  return (
    <main className="skills-list">
      <h1>All Skills</h1>
      
      {/* Category Filter */}
      <nav className="filters">
        <Link href={`/${locale}/skills`}>All</Link>
        <Link href={`/${locale}/skills?category=document-processing`}>Documents</Link>
        <Link href={`/${locale}/skills?category=development`}>Development</Link>
        <Link href={`/${locale}/skills?category=data-analysis`}>Data</Link>
        {/* Add more filters */}
      </nav>
      
      {/* Skills Grid */}
      <div className="skill-grid">
        {skills.docs.map(skill => (
          <Link 
            key={skill.id} 
            href={`/${locale}/skill/${skill.slug}`}
            className="skill-card"
          >
            <h2>{skill.name}</h2>
            <p>{skill.description}</p>
            <div className="meta">
              <span>by {skill.author}</span>
              <span>⭐ {skill.stars}</span>
            </div>
          </Link>
        ))}
      </div>
      
      {/* Pagination */}
      {skills.totalPages > 1 && (
        <nav className="pagination">
          {skills.hasPrevPage && (
            <Link href={`/${locale}/skills?page=${page - 1}`}>← Previous</Link>
          )}
          <span>Page {page} of {skills.totalPages}</span>
          {skills.hasNextPage && (
            <Link href={`/${locale}/skills?page=${page + 1}`}>Next →</Link>
          )}
        </nav>
      )}
    </main>
  )
}
```

**Acceptance Criteria:**
- [ ] Homepage displays featured skills
- [ ] Skill detail page shows all information
- [ ] Multi-language content displays correctly
- [ ] Pages are statically generated

---

## Phase 5: SEO Implementation (Day 4-5)

### Task 5.1: Sitemap Generation

Create `src/app/sitemap.ts`:

```typescript
import { MetadataRoute } from 'next'
import { getPayload } from 'payload'
import config from '@payload-config'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const payload = await getPayload({ config })
  const baseUrl = 'https://agent-skill.dev'
  const locales = ['en', 'zh', 'ja']
  
  // Fetch all skills
  const skills = await payload.find({
    collection: 'skills',
    limit: 10000,
  })
  
  // Static pages
  const staticPages = ['', '/skills']
  
  const staticEntries: MetadataRoute.Sitemap = staticPages.flatMap(page =>
    locales.map(locale => ({
      url: `${baseUrl}/${locale}${page}`,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: page === '' ? 1.0 : 0.8,
      alternates: {
        languages: Object.fromEntries(
          locales.map(l => [l, `${baseUrl}/${l}${page}`])
        ),
      },
    }))
  )
  
  // Skill pages
  const skillEntries: MetadataRoute.Sitemap = skills.docs.flatMap(skill =>
    locales.map(locale => ({
      url: `${baseUrl}/${locale}/skill/${skill.slug}`,
      lastModified: new Date(skill.updatedAt),
      changeFrequency: 'weekly' as const,
      priority: 0.7,
      alternates: {
        languages: Object.fromEntries(
          locales.map(l => [l, `${baseUrl}/${l}/skill/${skill.slug}`])
        ),
      },
    }))
  )
  
  // Category pages
  const categories = [
    'document-processing', 'development', 'data-analysis',
    'business-marketing', 'communication', 'creative-media',
    'productivity', 'security',
  ]
  
  const categoryEntries: MetadataRoute.Sitemap = categories.flatMap(cat =>
    locales.map(locale => ({
      url: `${baseUrl}/${locale}/category/${cat}`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.6,
      alternates: {
        languages: Object.fromEntries(
          locales.map(l => [l, `${baseUrl}/${l}/category/${cat}`])
        ),
      },
    }))
  )
  
  return [...staticEntries, ...skillEntries, ...categoryEntries]
}
```

### Task 5.2: Robots.txt

Create `src/app/robots.ts`:

```typescript
import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin/', '/api/', '/_next/'],
      },
    ],
    sitemap: 'https://agent-skill.dev/sitemap.xml',
  }
}
```

### Task 5.3: Global Layout with SEO

Update `src/app/(frontend)/[locale]/layout.tsx`:

```typescript
import { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  metadataBase: new URL('https://agent-skill.dev'),
  title: {
    default: 'Agent Skill Manager - The npm for AI Skills',
    template: '%s | agent-skill.dev',
  },
  description: 'Discover, install, and share AI agent skills for Claude, OpenAI Codex, Cursor, and more.',
  keywords: ['AI skills', 'Claude skills', 'AI agent', 'MCP', 'agent skills', 'OpenAI Codex'],
  authors: [{ name: 'agent-skill.dev' }],
  openGraph: {
    type: 'website',
    siteName: 'Agent Skill Manager',
  },
  twitter: {
    card: 'summary_large_image',
  },
  robots: {
    index: true,
    follow: true,
  },
}

export async function generateStaticParams() {
  return [{ locale: 'en' }, { locale: 'zh' }, { locale: 'ja' }]
}

export default function RootLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: { locale: string }
}) {
  return (
    <html lang={params.locale}>
      <head>
        {/* Preconnect to external resources */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://github.com" />
      </head>
      <body className={inter.className}>
        <header>
          {/* Navigation */}
          <nav>
            <a href={`/${params.locale}`}>Agent Skill Manager</a>
            <a href={`/${params.locale}/skills`}>Skills</a>
            <a href={`/${params.locale}/docs`}>Docs</a>
            
            {/* Language Switcher */}
            <div className="lang-switcher">
              <a href="/en" hrefLang="en">EN</a>
              <a href="/zh" hrefLang="zh">中文</a>
              <a href="/ja" hrefLang="ja">日本語</a>
            </div>
          </nav>
        </header>
        
        {children}
        
        <footer>
          <p>© 2025 agent-skill.dev</p>
        </footer>
      </body>
    </html>
  )
}
```

**Acceptance Criteria:**
- [ ] Sitemap includes all skills and locales
- [ ] hreflang tags present on all pages
- [ ] Schema.org markup on skill pages
- [ ] robots.txt properly configured

---

## Phase 6: Deployment (Day 5)

### Task 6.1: Configure Cloudflare Resources

```bash
# Login to Cloudflare
pnpm wrangler login

# Create D1 database
wrangler d1 create agent-skill-db

# Create R2 bucket
wrangler r2 bucket create agent-skill-assets
```

Update `wrangler.toml`:

```toml
name = "agent-skill-web"
main = ".open-next/worker.js"
compatibility_date = "2024-09-23"
compatibility_flags = ["nodejs_compat"]

[vars]
NEXT_PRIVATE_STANDALONE = "true"

[[d1_databases]]
binding = "D1"
database_name = "agent-skill-db"
database_id = "<your-database-id>"

[[r2_buckets]]
binding = "R2"
bucket_name = "agent-skill-assets"
```

### Task 6.2: Set Secrets

```bash
# Set environment secrets
wrangler secret put PAYLOAD_SECRET
wrangler secret put GOOGLE_AI_API_KEY
wrangler secret put GITHUB_TOKEN
wrangler secret put CRAWL_SECRET
```

### Task 6.3: Deploy

```bash
# Run migrations on remote database
pnpm payload migrate --env production

# Build and deploy
pnpm deploy
```

### Task 6.4: Configure Custom Domain

1. Go to Cloudflare Dashboard → Workers & Pages
2. Select your worker
3. Go to "Custom Domains"
4. Add `agent-skill.dev`
5. Configure DNS records as directed

### Task 6.5: Initial Data Crawl

```bash
# Trigger initial crawl
curl -X POST https://agent-skill.dev/api/crawl \
  -H "Authorization: Bearer YOUR_CRAWL_SECRET"
```

**Acceptance Criteria:**
- [ ] Site accessible at agent-skill.dev
- [ ] HTTPS working
- [ ] Skills data populated
- [ ] All pages loading correctly

---

## Phase 7: Scheduled Crawling (Day 6)

### Task 7.1: Setup Cloudflare Cron Trigger

Add to `wrangler.toml`:

```toml
[triggers]
crons = ["0 */6 * * *"]  # Every 6 hours
```

Create `src/worker-cron.ts`:

```typescript
export default {
  async scheduled(event: ScheduledEvent, env: Env, ctx: ExecutionContext) {
    // Trigger crawl endpoint
    await fetch('https://agent-skill.dev/api/crawl', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${env.CRAWL_SECRET}`,
      },
    })
  },
}
```

**Acceptance Criteria:**
- [ ] Cron job runs every 6 hours
- [ ] New skills automatically indexed
- [ ] Existing skills updated with new star counts

---

## Success Metrics

### MVP Launch Criteria
- [ ] 50+ skills indexed
- [ ] 3 languages (en/zh/ja) supported
- [ ] All pages indexed by Google (submit sitemap)
- [ ] Core Web Vitals passing

### Post-Launch (Week 2+)
- [ ] CLI tool (`askm`) released to npm
- [ ] 100+ skills indexed
- [ ] First 1000 organic visitors

---

## Cost Summary

| Service | Monthly Cost |
|---------|-------------|
| Cloudflare Workers (Paid) | $5 |
| Cloudflare D1 | ~$0 (free tier) |
| Cloudflare R2 | ~$0.15 |
| Gemini 2.5 Flash | ~$0.50 |
| Domain (agent-skill.dev) | ~$1.25/mo |
| **Total** | **~$7/month** |

---

## Notes

- All commands use `pnpm` as specified in package.json
- Payload CMS handles all database migrations automatically
- Gemini 2.5 Flash provides cost-effective structured output
- No manual SQL needed - Payload Collections define schema

---

*Plan created: 2026-01-10*
*Last updated: 2026-01-10*
