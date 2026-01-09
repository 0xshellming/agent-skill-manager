# 实施指南

本文档提供 agent-skill.dev 的详细实施步骤，包含完整代码示例。

---

## 目录

1. [项目搭建](#1-项目搭建)
2. [定义 Collections](#2-定义-collections)
3. [AI 解析器](#3-ai-解析器)
4. [数据抓取](#4-数据抓取)
5. [前端页面](#5-前端页面)
6. [SEO 实现](#6-seo-实现)

---

## 1. 项目搭建

### 1.1 创建项目

```bash
# 使用官方 Cloudflare 模板创建项目
npx create-payload-app@latest agent-skill-web --template with-cloudflare-d1

cd agent-skill-web
```

### 1.2 安装依赖

```bash
# AI SDK 和 Zod
pnpm add ai @ai-sdk/google zod

# 开发依赖
pnpm add -D @types/node
```

### 1.3 配置环境变量

创建 `.env` 文件:

```env
# Payload CMS
PAYLOAD_SECRET=your-secret-here-generate-with-openssl

# Google AI (Gemini)
GOOGLE_AI_API_KEY=your-gemini-api-key

# GitHub API
GITHUB_TOKEN=your-github-personal-access-token

# 抓取 API 密钥
CRAWL_SECRET=your-random-secret

# Cloudflare (wrangler 自动配置)
CLOUDFLARE_ACCOUNT_ID=
CLOUDFLARE_API_TOKEN=
```

生成 PAYLOAD_SECRET:

```bash
openssl rand -hex 32
```

### 1.4 配置 Payload CMS

更新 `src/payload.config.ts`:

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
    meta: {
      titleSuffix: '- Agent Skill Manager',
    },
  },
  
  collections: [Users, Media, Skills, Categories],
  
  editor: lexicalEditor(),
  
  // 多语言配置
  localization: {
    locales: [
      { label: 'English', code: 'en' },
      { label: '中文', code: 'zh' },
      { label: '日本語', code: 'ja' },
    ],
    defaultLocale: 'en',
    fallback: true,
  },
  
  // Cloudflare D1 数据库
  db: sqliteD1Adapter({
    binding: cloudflare.env.D1,
  }),
  
  // 插件
  plugins: [
    // R2 存储
    r2Storage({
      bucket: cloudflare.env.R2,
      collections: { media: true },
    }),
    // SEO 插件
    seoPlugin({
      collections: ['skills'],
      generateTitle: ({ doc }) => `${doc.name} - AI Agent Skill | agent-skill.dev`,
      generateDescription: ({ doc }) => doc.description,
    }),
  ],
  
  // TypeScript 类型生成
  typescript: {
    outputFile: 'src/payload-types.ts',
  },
})
```

---

## 2. 定义 Collections

### 2.1 Skills Collection

创建 `src/collections/Skills.ts`:

```typescript
import { CollectionConfig } from 'payload'

export const Skills: CollectionConfig = {
  slug: 'skills',
  
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'author', 'category', 'stars', 'updatedAt'],
    group: '内容管理',
  },
  
  // 启用版本控制
  versions: {
    drafts: true,
  },
  
  fields: [
    // ===== 基本信息 =====
    {
      name: 'name',
      label: '名称',
      type: 'text',
      required: true,
      localized: true,
      admin: {
        description: '技能的显示名称',
      },
    },
    {
      name: 'slug',
      label: 'URL标识',
      type: 'text',
      required: true,
      unique: true,
      admin: {
        position: 'sidebar',
        description: 'URL友好的标识符',
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
      label: '描述',
      type: 'textarea',
      required: true,
      localized: true,
      admin: {
        description: '简短描述 (用于SEO meta description)',
      },
    },
    
    // ===== 来源信息 =====
    {
      name: 'author',
      label: '作者',
      type: 'text',
      required: true,
      admin: {
        description: 'GitHub 用户名或组织名',
      },
    },
    {
      name: 'githubUrl',
      label: 'GitHub链接',
      type: 'text',
      required: true,
    },
    {
      name: 'sourceRepo',
      label: '源仓库',
      type: 'text',
      required: true,
      admin: {
        description: '格式: owner/repo',
      },
    },
    {
      name: 'stars',
      label: 'Star数',
      type: 'number',
      defaultValue: 0,
      admin: {
        position: 'sidebar',
      },
    },
    
    // ===== 分类 =====
    {
      name: 'category',
      label: '分类',
      type: 'select',
      required: true,
      options: [
        { label: '文档处理', value: 'document-processing' },
        { label: '开发工具', value: 'development' },
        { label: '数据分析', value: 'data-analysis' },
        { label: '商业营销', value: 'business-marketing' },
        { label: '沟通写作', value: 'communication' },
        { label: '创意媒体', value: 'creative-media' },
        { label: '效率工具', value: 'productivity' },
        { label: '安全工具', value: 'security' },
        { label: '其他', value: 'other' },
      ],
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'tags',
      label: '标签',
      type: 'array',
      admin: {
        description: '搜索和筛选关键词',
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
      label: '兼容平台',
      type: 'select',
      hasMany: true,
      defaultValue: ['claude'],
      options: [
        { label: 'Claude', value: 'claude' },
        { label: 'OpenAI Codex', value: 'openai' },
        { label: 'Cursor', value: 'cursor' },
        { label: '其他', value: 'other' },
      ],
      admin: {
        position: 'sidebar',
      },
    },
    
    // ===== 内容 (多语言) =====
    {
      name: 'useCases',
      label: '使用场景',
      type: 'array',
      localized: true,
      admin: {
        description: '什么时候使用这个技能',
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
      label: '前置要求',
      type: 'array',
      admin: {
        description: '需要的工具或依赖',
      },
      fields: [
        {
          name: 'prerequisite',
          type: 'text',
        },
      ],
    },
    
    // ===== 安装 =====
    {
      name: 'installCommand',
      label: '安装命令',
      type: 'text',
      admin: {
        description: '例如: askm install author/skill',
      },
    },
    
    // ===== 原始内容 =====
    {
      name: 'rawSkillMd',
      label: '原始SKILL.md',
      type: 'textarea',
      admin: {
        description: 'SKILL.md 原始内容',
        condition: (data) => Boolean(data?.rawSkillMd),
      },
    },
  ],
}
```

### 2.2 Categories Collection

创建 `src/collections/Categories.ts`:

```typescript
import { CollectionConfig } from 'payload'

export const Categories: CollectionConfig = {
  slug: 'categories',
  
  admin: {
    useAsTitle: 'name',
    group: '内容管理',
  },
  
  fields: [
    {
      name: 'name',
      label: '名称',
      type: 'text',
      required: true,
      localized: true,
    },
    {
      name: 'slug',
      label: 'URL标识',
      type: 'text',
      required: true,
      unique: true,
    },
    {
      name: 'description',
      label: '描述',
      type: 'textarea',
      localized: true,
    },
    {
      name: 'icon',
      label: '图标',
      type: 'text',
      admin: {
        description: 'Emoji 或图标标识符',
      },
    },
    {
      name: 'order',
      label: '排序',
      type: 'number',
      defaultValue: 0,
      admin: {
        description: '显示顺序 (小的在前)',
      },
    },
  ],
}
```

### 2.3 运行迁移

```bash
# 生成 TypeScript 类型
pnpm payload generate:types

# 创建迁移文件
pnpm payload migrate:create

# 运行迁移
pnpm payload migrate
```

---

## 3. AI 解析器

### 3.1 定义输出 Schema

创建 `src/lib/skill-parser.ts`:

```typescript
import { createGoogleGenerativeAI } from '@ai-sdk/google'
import { generateObject } from 'ai'
import { z } from 'zod'

// 创建 Gemini 客户端
const google = createGoogleGenerativeAI({
  apiKey: process.env.GOOGLE_AI_API_KEY!,
})

// 定义结构化输出 Schema
const SkillSchema = z.object({
  name: z.string().describe('技能名称，保持简洁'),
  
  description: z.string().describe('一句话描述技能用途'),
  
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
  ]).describe('最匹配的分类'),
  
  tags: z.array(z.string()).max(5).describe('相关关键词，最多5个'),
  
  useCases: z.array(z.string()).min(1).max(5).describe('使用场景，1-5个'),
  
  prerequisites: z.array(z.string()).describe('前置要求：工具、库或配置'),
  
  compatibility: z.array(
    z.enum(['claude', 'openai', 'cursor', 'other'])
  ).describe('兼容的AI平台'),
  
  // 多语言翻译
  translations: z.object({
    zh: z.object({
      name: z.string().describe('中文名称'),
      description: z.string().describe('中文描述'),
      useCases: z.array(z.string()).describe('中文使用场景'),
    }),
    ja: z.object({
      name: z.string().describe('日文名称'),
      description: z.string().describe('日文描述'),
      useCases: z.array(z.string()).describe('日文使用场景'),
    }),
  }),
})

export type ParsedSkill = z.infer<typeof SkillSchema>

/**
 * 使用 Gemini 2.5 Flash 解析技能内容
 */
export async function parseSkillWithAI(
  skillMdContent: string,
  readmeContent: string | null,
  repoInfo: { 
    owner: string
    repo: string
    skillName: string
    stars: number 
  }
): Promise<ParsedSkill> {
  
  const { object } = await generateObject({
    model: google('gemini-2.0-flash'),
    schema: SkillSchema,
    prompt: `你正在分析一个来自 GitHub 的 AI Agent Skill。请提取结构化信息。

## 仓库信息
- 所有者: ${repoInfo.owner}
- 仓库: ${repoInfo.repo}
- 技能名称: ${repoInfo.skillName}
- Stars: ${repoInfo.stars}

## SKILL.md 内容
\`\`\`markdown
${skillMdContent.slice(0, 8000)}
\`\`\`

${readmeContent ? `## README.md 内容
\`\`\`markdown
${readmeContent.slice(0, 4000)}
\`\`\`` : ''}

## 要求
1. 提取技能的用途和功能
2. 选择最合适的分类
3. 识别关键使用场景
4. 列出前置要求（工具、库等）
5. 判断平台兼容性（如不确定默认为 claude）
6. 提供准确的中文和日文翻译
7. 翻译时保留技术术语的英文原文

返回结构化数据。`,
  })

  return object
}
```

---

## 4. 数据抓取

### 4.1 GitHub API 工具

创建 `src/lib/github.ts`:

```typescript
const GITHUB_API = 'https://api.github.com'
const RAW_GITHUB = 'https://raw.githubusercontent.com'

interface FetchOptions {
  token?: string
}

/**
 * 带认证的 GitHub API 请求
 */
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
    throw new Error(`GitHub API 错误: ${response.status} ${response.statusText}`)
  }
  
  return response
}

/**
 * 获取仓库信息
 */
export async function fetchRepoInfo(
  owner: string, 
  repo: string, 
  token?: string
) {
  const response = await fetchWithAuth(
    `${GITHUB_API}/repos/${owner}/${repo}`,
    { token }
  )
  return response.json()
}

/**
 * 获取目录内容
 */
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

/**
 * 获取原始文件内容
 */
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

/**
 * 获取技能目录列表
 */
export async function fetchSkillDirectories(
  owner: string,
  repo: string,
  skillsPath: string,
  branch = 'main',
  token?: string
): Promise<string[]> {
  try {
    const contents = await fetchRepoContents(
      owner, 
      repo, 
      skillsPath, 
      branch, 
      token
    )
    
    return contents
      .filter((item: any) => 
        item.type === 'dir' && 
        !item.name.startsWith('.') &&
        !item.name.startsWith('_')
      )
      .map((item: any) => item.name)
  } catch (error) {
    console.error(`获取 ${owner}/${repo}/${skillsPath} 失败:`, error)
    return []
  }
}
```

### 4.2 抓取编排器

创建 `src/lib/skill-crawler.ts`:

```typescript
import { getPayload } from 'payload'
import config from '@payload-config'
import { parseSkillWithAI } from './skill-parser'
import { 
  fetchRepoInfo, 
  fetchRawFile, 
  fetchRepoContents,
  fetchSkillDirectories 
} from './github'

// 数据源配置
interface SkillSource {
  owner: string
  repo: string
  skillsPath: string
  branch?: string
}

const SKILL_SOURCES: SkillSource[] = [
  // Anthropic 官方技能
  { owner: 'anthropics', repo: 'skills', skillsPath: 'skills' },
  
  // OpenAI 官方技能
  { owner: 'openai', repo: 'skills', skillsPath: 'skills/.curated' },
  { owner: 'openai', repo: 'skills', skillsPath: 'skills/.system' },
  
  // 社区技能 (awesome-claude-skills)
  { owner: 'ComposioHQ', repo: 'awesome-claude-skills', skillsPath: '', branch: 'master' },
]

/**
 * 生成 URL 友好的 slug
 */
function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

/**
 * 抓取所有技能
 */
export async function crawlAllSkills() {
  const payload = await getPayload({ config })
  const token = process.env.GITHUB_TOKEN
  
  console.log('🚀 开始抓取技能...')
  
  let totalIndexed = 0
  let totalFailed = 0
  
  for (const source of SKILL_SOURCES) {
    console.log(`\n📂 处理 ${source.owner}/${source.repo}/${source.skillsPath}`)
    
    try {
      // 获取仓库信息
      const repoInfo = await fetchRepoInfo(source.owner, source.repo, token)
      
      // 获取技能目录
      let skillDirs: string[]
      const branch = source.branch || 'main'
      
      if (source.skillsPath === '') {
        // awesome-claude-skills: 根目录的每个文件夹都是一个技能
        const contents = await fetchRepoContents(
          source.owner,
          source.repo,
          '',
          branch,
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
          branch,
          token
        )
      }
      
      console.log(`  找到 ${skillDirs.length} 个技能目录`)
      
      // 处理每个技能
      for (const skillDir of skillDirs) {
        try {
          const skillPath = source.skillsPath 
            ? `${source.skillsPath}/${skillDir}`
            : skillDir
          
          // 获取 SKILL.md
          const skillMd = await fetchRawFile(
            source.owner,
            source.repo,
            `${skillPath}/SKILL.md`,
            branch
          )
          
          if (!skillMd) {
            console.log(`  ⚠️ ${skillDir} 没有 SKILL.md`)
            continue
          }
          
          // 获取 README.md (可选)
          const readme = await fetchRawFile(
            source.owner,
            source.repo,
            `${skillPath}/README.md`,
            branch
          )
          
          // AI 解析
          console.log(`  🤖 解析 ${skillDir}...`)
          const parsed = await parseSkillWithAI(skillMd, readme, {
            owner: source.owner,
            repo: source.repo,
            skillName: skillDir,
            stars: repoInfo.stargazers_count || 0,
          })
          
          const skillSlug = slugify(skillDir)
          const skillId = `${source.owner}/${skillDir}`
          
          // 检查是否已存在
          const existing = await payload.find({
            collection: 'skills',
            where: { slug: { equals: skillSlug } },
            limit: 1,
          })
          
          // 准备数据
          const skillData = {
            name: parsed.name,
            slug: skillSlug,
            description: parsed.description,
            author: source.owner,
            githubUrl: `https://github.com/${source.owner}/${source.repo}/tree/${branch}/${skillPath}`,
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
          
          let skillDocId: string
          
          if (existing.docs.length > 0) {
            // 更新现有记录
            await payload.update({
              collection: 'skills',
              id: existing.docs[0].id,
              data: skillData,
              locale: 'en',
            })
            skillDocId = existing.docs[0].id
          } else {
            // 创建新记录
            const created = await payload.create({
              collection: 'skills',
              data: skillData,
              locale: 'en',
            })
            skillDocId = created.id
          }
          
          // 更新中文翻译
          await payload.update({
            collection: 'skills',
            id: skillDocId,
            data: {
              name: parsed.translations.zh.name,
              description: parsed.translations.zh.description,
              useCases: parsed.translations.zh.useCases.map(useCase => ({ useCase })),
            },
            locale: 'zh',
          })
          
          // 更新日文翻译
          await payload.update({
            collection: 'skills',
            id: skillDocId,
            data: {
              name: parsed.translations.ja.name,
              description: parsed.translations.ja.description,
              useCases: parsed.translations.ja.useCases.map(useCase => ({ useCase })),
            },
            locale: 'ja',
          })
          
          console.log(`  ✅ 完成: ${skillId}`)
          totalIndexed++
          
          // 速率限制: AI调用之间等待500ms
          await new Promise(resolve => setTimeout(resolve, 500))
          
        } catch (error) {
          console.error(`  ❌ 失败: ${skillDir}`, error)
          totalFailed++
        }
      }
    } catch (error) {
      console.error(`处理 ${source.owner}/${source.repo} 失败:`, error)
    }
  }
  
  console.log(`\n🏁 抓取完成: ${totalIndexed} 成功, ${totalFailed} 失败`)
  
  return { indexed: totalIndexed, failed: totalFailed }
}
```

### 4.3 抓取 API 端点

创建 `src/app/api/crawl/route.ts`:

```typescript
import { NextResponse } from 'next/server'
import { crawlAllSkills } from '@/lib/skill-crawler'

export async function POST(request: Request) {
  // 验证密钥
  const authHeader = request.headers.get('authorization')
  const expectedToken = process.env.CRAWL_SECRET
  
  if (expectedToken && authHeader !== `Bearer ${expectedToken}`) {
    return NextResponse.json(
      { error: '未授权' }, 
      { status: 401 }
    )
  }
  
  try {
    console.log('📡 收到抓取请求')
    const result = await crawlAllSkills()
    
    return NextResponse.json({
      success: true,
      ...result,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('抓取失败:', error)
    return NextResponse.json(
      { 
        error: '抓取失败', 
        details: String(error) 
      },
      { status: 500 }
    )
  }
}

// 健康检查
export async function GET() {
  return NextResponse.json({ status: 'ok' })
}
```

---

## 5. 前端页面

### 5.1 布局文件

创建 `src/app/(frontend)/[locale]/layout.tsx`:

```typescript
import { Metadata } from 'next'
import { Inter } from 'next/font/google'
import Link from 'next/link'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  metadataBase: new URL('https://agent-skill.dev'),
  title: {
    default: 'Agent Skill Manager - AI技能的npm',
    template: '%s | agent-skill.dev',
  },
  description: '发现、安装、分享适用于 Claude、OpenAI Codex、Cursor 等的 AI 代理技能。',
  keywords: ['AI skills', 'Claude skills', 'AI agent', 'MCP', 'agent skills'],
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

// 生成静态路由参数
export async function generateStaticParams() {
  return [
    { locale: 'en' }, 
    { locale: 'zh' }, 
    { locale: 'ja' }
  ]
}

// 翻译文本
const translations: Record<string, Record<string, string>> = {
  en: {
    home: 'Home',
    skills: 'Skills',
    docs: 'Docs',
    copyright: '© 2025 agent-skill.dev',
  },
  zh: {
    home: '首页',
    skills: '技能',
    docs: '文档',
    copyright: '© 2025 agent-skill.dev',
  },
  ja: {
    home: 'ホーム',
    skills: 'スキル',
    docs: 'ドキュメント',
    copyright: '© 2025 agent-skill.dev',
  },
}

export default function RootLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: { locale: string }
}) {
  const { locale } = params
  const t = translations[locale] || translations.en
  
  return (
    <html lang={locale}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
      </head>
      <body className={inter.className}>
        {/* 导航栏 */}
        <header className="header">
          <nav className="nav">
            <Link href={`/${locale}`} className="logo">
              Agent Skill Manager
            </Link>
            
            <div className="nav-links">
              <Link href={`/${locale}`}>{t.home}</Link>
              <Link href={`/${locale}/skills`}>{t.skills}</Link>
              <Link href={`/${locale}/docs`}>{t.docs}</Link>
            </div>
            
            {/* 语言切换 */}
            <div className="lang-switcher">
              <Link href="/en" hrefLang="en">EN</Link>
              <Link href="/zh" hrefLang="zh">中文</Link>
              <Link href="/ja" hrefLang="ja">日本語</Link>
            </div>
          </nav>
        </header>
        
        {/* 主内容 */}
        <main className="main">
          {children}
        </main>
        
        {/* 页脚 */}
        <footer className="footer">
          <p>{t.copyright}</p>
        </footer>
      </body>
    </html>
  )
}
```

### 5.2 首页

创建 `src/app/(frontend)/[locale]/page.tsx`:

```typescript
import { getPayload } from 'payload'
import config from '@payload-config'
import Link from 'next/link'
import { Metadata } from 'next'

interface Props {
  params: { locale: string }
}

// 分类配置
const CATEGORIES = [
  { slug: 'document-processing', icon: '📄', en: 'Document Processing', zh: '文档处理', ja: 'ドキュメント処理' },
  { slug: 'development', icon: '💻', en: 'Development', zh: '开发工具', ja: '開発ツール' },
  { slug: 'data-analysis', icon: '📊', en: 'Data & Analysis', zh: '数据分析', ja: 'データ分析' },
  { slug: 'business-marketing', icon: '📈', en: 'Business & Marketing', zh: '商业营销', ja: 'ビジネス' },
  { slug: 'communication', icon: '✍️', en: 'Communication', zh: '沟通写作', ja: 'コミュニケーション' },
  { slug: 'creative-media', icon: '🎨', en: 'Creative & Media', zh: '创意媒体', ja: 'クリエイティブ' },
  { slug: 'productivity', icon: '⚡', en: 'Productivity', zh: '效率工具', ja: '生産性' },
  { slug: 'security', icon: '🔒', en: 'Security', zh: '安全工具', ja: 'セキュリティ' },
]

// 页面翻译
const pageTranslations: Record<string, Record<string, string>> = {
  en: {
    title: 'The npm for AI Agent Skills',
    subtitle: 'Discover, install, and share skills for Claude, OpenAI Codex, and more.',
    browseCategory: 'Browse by Category',
    popularSkills: 'Popular Skills',
    viewAll: 'View All Skills →',
    by: 'by',
  },
  zh: {
    title: 'AI技能的npm',
    subtitle: '发现、安装、分享适用于 Claude、OpenAI Codex 等的 AI 代理技能。',
    browseCategory: '按分类浏览',
    popularSkills: '热门技能',
    viewAll: '查看全部技能 →',
    by: '作者',
  },
  ja: {
    title: 'AIスキルのnpm',
    subtitle: 'Claude、OpenAI Codexなど向けのスキルを発見・インストール・共有。',
    browseCategory: 'カテゴリで探す',
    popularSkills: '人気のスキル',
    viewAll: 'すべてのスキルを見る →',
    by: '作者',
  },
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = params
  const t = pageTranslations[locale] || pageTranslations.en
  
  return {
    title: t.title,
    description: t.subtitle,
    alternates: {
      canonical: `/${locale}`,
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
  const t = pageTranslations[locale] || pageTranslations.en
  
  // 获取热门技能
  const featuredSkills = await payload.find({
    collection: 'skills',
    locale,
    limit: 12,
    sort: '-stars',
  })
  
  return (
    <div className="home-page">
      {/* Hero 区域 */}
      <section className="hero">
        <h1>{t.title}</h1>
        <p className="subtitle">{t.subtitle}</p>
        
        <div className="install-example">
          <code>askm install anthropics/pdf</code>
        </div>
      </section>
      
      {/* 分类导航 */}
      <section className="categories">
        <h2>{t.browseCategory}</h2>
        <div className="category-grid">
          {CATEGORIES.map(cat => (
            <Link 
              key={cat.slug} 
              href={`/${locale}/category/${cat.slug}`}
              className="category-card"
            >
              <span className="icon">{cat.icon}</span>
              <span className="name">
                {cat[locale as keyof typeof cat] || cat.en}
              </span>
            </Link>
          ))}
        </div>
      </section>
      
      {/* 热门技能 */}
      <section className="featured-skills">
        <h2>{t.popularSkills}</h2>
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
                <span className="author">{t.by} {skill.author}</span>
                <span className="stars">⭐ {skill.stars}</span>
              </div>
            </Link>
          ))}
        </div>
        
        <Link href={`/${locale}/skills`} className="view-all-link">
          {t.viewAll}
        </Link>
      </section>
    </div>
  )
}
```

### 5.3 技能详情页

创建 `src/app/(frontend)/[locale]/skill/[slug]/page.tsx`:

```typescript
import { getPayload } from 'payload'
import config from '@payload-config'
import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'

interface Props {
  params: { locale: string; slug: string }
}

// 生成静态路径
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

// SEO 元数据
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
  if (!skill) return { title: '技能未找到' }
  
  return {
    title: `${skill.name} - AI Agent Skill`,
    description: skill.description,
    
    openGraph: {
      title: skill.name,
      description: skill.description,
      url: `https://agent-skill.dev/${locale}/skill/${slug}`,
      type: 'article',
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

// 页面翻译
const pageTranslations: Record<string, Record<string, string>> = {
  en: {
    by: 'by',
    install: 'Install',
    copy: 'Copy',
    whenToUse: 'When to Use',
    prerequisites: 'Prerequisites',
    compatibleWith: 'Compatible With',
    viewOnGitHub: 'View on GitHub →',
    relatedSkills: 'Related Skills',
  },
  zh: {
    by: '作者',
    install: '安装',
    copy: '复制',
    whenToUse: '使用场景',
    prerequisites: '前置要求',
    compatibleWith: '兼容平台',
    viewOnGitHub: '在 GitHub 查看 →',
    relatedSkills: '相关技能',
  },
  ja: {
    by: '作者',
    install: 'インストール',
    copy: 'コピー',
    whenToUse: '使用シーン',
    prerequisites: '前提条件',
    compatibleWith: '対応プラットフォーム',
    viewOnGitHub: 'GitHubで見る →',
    relatedSkills: '関連スキル',
  },
}

export default async function SkillPage({ params }: Props) {
  const payload = await getPayload({ config })
  const { locale, slug } = params
  const t = pageTranslations[locale] || pageTranslations.en
  
  // 获取技能
  const result = await payload.find({
    collection: 'skills',
    where: { slug: { equals: slug } },
    locale,
    limit: 1,
  })
  
  const skill = result.docs[0]
  if (!skill) notFound()
  
  // 获取相关技能
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
      {/* Schema.org 结构化数据 */}
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
        {/* 面包屑导航 */}
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
        
        {/* 头部信息 */}
        <header className="skill-header">
          <h1>{skill.name}</h1>
          <p className="description">{skill.description}</p>
          
          <div className="meta">
            <span className="author">
              {t.by}{' '}
              <a 
                href={`https://github.com/${skill.author}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                {skill.author}
              </a>
            </span>
            <span className="stars">⭐ {skill.stars}</span>
            <span className="category">{skill.category}</span>
          </div>
          
          {/* 安装命令 */}
          <div className="install-command">
            <code>{skill.installCommand}</code>
            <button className="copy-btn">{t.copy}</button>
          </div>
          
          {/* 标签 */}
          {skill.tags && skill.tags.length > 0 && (
            <div className="tags">
              {skill.tags.map((t: any, i: number) => (
                <span key={i} className="tag">{t.tag}</span>
              ))}
            </div>
          )}
        </header>
        
        {/* 使用场景 */}
        {skill.useCases && skill.useCases.length > 0 && (
          <section className="use-cases">
            <h2>{t.whenToUse}</h2>
            <ul>
              {skill.useCases.map((uc: any, i: number) => (
                <li key={i}>{uc.useCase}</li>
              ))}
            </ul>
          </section>
        )}
        
        {/* 前置要求 */}
        {skill.prerequisites && skill.prerequisites.length > 0 && (
          <section className="prerequisites">
            <h2>{t.prerequisites}</h2>
            <ul>
              {skill.prerequisites.map((p: any, i: number) => (
                <li key={i}>{p.prerequisite}</li>
              ))}
            </ul>
          </section>
        )}
        
        {/* 兼容平台 */}
        <section className="compatibility">
          <h2>{t.compatibleWith}</h2>
          <div className="platforms">
            {skill.compatibility?.map((platform: string) => (
              <span key={platform} className="platform">{platform}</span>
            ))}
          </div>
        </section>
        
        {/* GitHub 链接 */}
        <section className="github">
          <a 
            href={skill.githubUrl} 
            target="_blank" 
            rel="noopener noreferrer"
            className="github-link"
          >
            {t.viewOnGitHub}
          </a>
        </section>
        
        {/* 相关技能 */}
        {related.docs.length > 0 && (
          <section className="related-skills">
            <h2>{t.relatedSkills}</h2>
            <div className="skill-grid">
              {related.docs.map(s => (
                <Link 
                  key={s.id} 
                  href={`/${locale}/skill/${s.slug}`}
                  className="skill-card"
                >
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

---

## 6. SEO 实现

### 6.1 Sitemap

创建 `src/app/sitemap.ts`:

```typescript
import { MetadataRoute } from 'next'
import { getPayload } from 'payload'
import config from '@payload-config'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const payload = await getPayload({ config })
  const baseUrl = 'https://agent-skill.dev'
  const locales = ['en', 'zh', 'ja']
  
  // 获取所有技能
  const skills = await payload.find({
    collection: 'skills',
    limit: 10000,
  })
  
  // 静态页面
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
  
  // 技能页面
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
  
  // 分类页面
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

### 6.2 robots.txt

创建 `src/app/robots.ts`:

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

---

## 下一步

完成以上代码后：

1. 运行 `pnpm dev` 本地测试
2. 运行 `pnpm payload migrate` 创建数据库表
3. 参考 [部署指南](./deployment.md) 部署到 Cloudflare

---

*实施指南 v1.0 | 更新时间: 2026-01-10*
