import { getPayload, Payload } from 'payload'
import config from '@payload-config'
import { parseSkillWithAI } from './skill-parser'
import { fetchRepoInfo, fetchRawFile, fetchRepoContents } from './github'

interface SkillSource {
  owner: string
  repo: string
  skillsPath: string
  branch?: string
}

interface GitHubContent {
  type: string
  name: string
}

interface RepoInfo {
  stargazers_count?: number
}

const SKILL_SOURCES: SkillSource[] = [
  { owner: 'anthropics', repo: 'skills', skillsPath: 'skills' },
  { owner: 'openai', repo: 'skills', skillsPath: 'skills/.curated' },
  { owner: 'openai', repo: 'skills', skillsPath: 'skills/.system' },
  { owner: 'ComposioHQ', repo: 'awesome-claude-skills', skillsPath: '', branch: 'master' },
]

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

async function processSkill(
  payload: Payload,
  source: SkillSource,
  skillDir: string,
  branch: string,
  repoInfo: RepoInfo,
): Promise<boolean> {
  const skillPath = source.skillsPath ? `${source.skillsPath}/${skillDir}` : skillDir

  const skillMd = await fetchRawFile(source.owner, source.repo, `${skillPath}/SKILL.md`, branch)

  if (!skillMd) {
    console.log(`  ⚠️ ${skillDir} has no SKILL.md`)
    return false
  }

  const readme = await fetchRawFile(source.owner, source.repo, `${skillPath}/README.md`, branch)

  console.log(`  🤖 Parsing ${skillDir}...`)
  const parsed = await parseSkillWithAI(skillMd, readme, {
    owner: source.owner,
    repo: source.repo,
    skillName: skillDir,
    stars: repoInfo.stargazers_count || 0,
  })

  const skillSlug = slugify(skillDir)
  const skillId = `${source.owner}/${skillDir}`

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
    githubUrl: `https://github.com/${source.owner}/${source.repo}/tree/${branch}/${skillPath}`,
    sourceRepo: `${source.owner}/${source.repo}`,
    stars: repoInfo.stargazers_count || 0,
    category: parsed.category,
    tags: parsed.tags.map((tag) => ({ tag })),
    compatibility: parsed.compatibility,
    useCases: parsed.useCases.map((useCase) => ({ useCase })),
    prerequisites: parsed.prerequisites.map((prerequisite) => ({ prerequisite })),
    installCommand: `askm install ${skillId}`,
    rawSkillMd: skillMd,
  }

  let skillDocId: number

  if (existing.docs.length > 0) {
    await payload.update({
      collection: 'skills',
      id: existing.docs[0].id,
      data: skillData,
      locale: 'en',
    })
    skillDocId = existing.docs[0].id
  } else {
    const created = await payload.create({
      collection: 'skills',
      data: skillData,
      locale: 'en',
    })
    skillDocId = created.id
  }

  await payload.update({
    collection: 'skills',
    id: skillDocId,
    data: {
      name: parsed.translations.zh.name,
      description: parsed.translations.zh.description,
      useCases: parsed.translations.zh.useCases.map((useCase) => ({ useCase })),
    },
    locale: 'zh',
  })

  await payload.update({
    collection: 'skills',
    id: skillDocId,
    data: {
      name: parsed.translations.ja.name,
      description: parsed.translations.ja.description,
      useCases: parsed.translations.ja.useCases.map((useCase) => ({ useCase })),
    },
    locale: 'ja',
  })

  console.log(`  ✅ Done: ${skillId}`)
  return true
}

async function getSkillDirectories(
  source: SkillSource,
  branch: string,
  token?: string,
): Promise<string[]> {
  if (source.skillsPath === '') {
    const contents = (await fetchRepoContents(
      source.owner,
      source.repo,
      '',
      branch,
      token,
    )) as GitHubContent[]
    return contents
      .filter(
        (item) =>
          item.type === 'dir' &&
          !item.name.startsWith('.') &&
          !['node_modules', 'dist', 'build'].includes(item.name),
      )
      .map((item) => item.name)
  }

  const contents = (await fetchRepoContents(
    source.owner,
    source.repo,
    source.skillsPath,
    branch,
    token,
  )) as GitHubContent[]
  return contents
    .filter(
      (item) => item.type === 'dir' && !item.name.startsWith('.') && !item.name.startsWith('_'),
    )
    .map((item) => item.name)
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
      const repoInfo = (await fetchRepoInfo(source.owner, source.repo, token)) as RepoInfo
      const branch = source.branch || 'main'
      const skillDirs = await getSkillDirectories(source, branch, token)

      console.log(`  Found ${skillDirs.length} skill directories`)

      for (const skillDir of skillDirs) {
        try {
          const success = await processSkill(payload, source, skillDir, branch, repoInfo)
          if (success) {
            totalIndexed++
          }
          await new Promise((resolve) => setTimeout(resolve, 500))
        } catch (error) {
          console.error(`  ❌ Failed: ${skillDir}`, error)
          totalFailed++
        }
      }
    } catch (error) {
      console.error(`Failed to process ${source.owner}/${source.repo}:`, error)
    }
  }

  console.log(`\n🏁 Crawl complete: ${totalIndexed} succeeded, ${totalFailed} failed`)

  return { indexed: totalIndexed, failed: totalFailed }
}
