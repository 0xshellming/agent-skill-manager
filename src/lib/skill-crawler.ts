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
  { owner: 'karanb192', repo: 'awesome-claude-skills', skillsPath: '', branch: 'main' },
  { owner: 'BehiSecc', repo: 'awesome-claude-skills', skillsPath: '', branch: 'main' },
  { owner: 'meetrais', repo: 'claude-agent-skills', skillsPath: 'skills', branch: 'main' },
  { owner: 'automationcreators', repo: 'claude-code-skills', skillsPath: '', branch: 'main' },
  { owner: 'levnikolaevich', repo: 'claude-code-skills', skillsPath: '', branch: 'main' },
]

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

async function getOrCreateCategory(
  payload: Payload,
  categoryName: string,
): Promise<number | undefined> {
  const slug = slugify(categoryName)

  const existing = await payload.find({
    collection: 'categories',
    where: { slug: { equals: slug } },
    limit: 1,
  })

  if (existing.docs.length > 0) {
    return existing.docs[0].id
  }

  const created = await payload.create({
    collection: 'categories',
    data: {
      name: categoryName,
      slug: slug,
      description: `Category: ${categoryName}`,
      order: 0,
    },
  })

  return created.id
}

async function getOrCreateTags(payload: Payload, tagNames: string[]): Promise<number[]> {
  const tagIds: number[] = []

  for (const tagName of tagNames) {
    const slug = slugify(tagName)

    const existing = await payload.find({
      collection: 'tags',
      where: { slug: { equals: slug } },
      limit: 1,
    })

    if (existing.docs.length > 0) {
      tagIds.push(existing.docs[0].id)
    } else {
      const created = await payload.create({
        collection: 'tags',
        data: {
          name: tagName,
          slug: slug,
          description: `Tag: ${tagName}`,
          order: 0,
        },
      })
      tagIds.push(created.id)
    }
  }

  return tagIds
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

export async function crawlSkillList() {
  const payload = await getPayload({ config })
  const token = process.env.GITHUB_TOKEN

  console.log('🚀 Starting skill list crawl (no AI)...')

  let totalCreated = 0
  let totalSkipped = 0

  for (const source of SKILL_SOURCES) {
    console.log(`\n📂 Processing ${source.owner}/${source.repo}/${source.skillsPath}`)

    try {
      const repoInfo = (await fetchRepoInfo(source.owner, source.repo, token)) as RepoInfo
      const branch = source.branch || 'main'
      const skillDirs = await getSkillDirectories(source, branch, token)

      console.log(`  Found ${skillDirs.length} skill directories`)

      for (const skillDir of skillDirs) {
        const skillSlug = slugify(skillDir)
        const skillPath = source.skillsPath ? `${source.skillsPath}/${skillDir}` : skillDir

        const existing = await payload.find({
          collection: 'skills',
          where: { slug: { equals: skillSlug } },
          limit: 1,
        })

        if (existing.docs.length > 0) {
          console.log(`  ⏭️ Skip: ${skillDir} (already exists)`)
          totalSkipped++
          continue
        }

        const categoryId = await getOrCreateCategory(payload, 'other')

        await payload.create({
          collection: 'skills',
          data: {
            name: skillDir,
            slug: skillSlug,
            description: `Skill from ${source.owner}/${source.repo}`,
            skillPath: `${source.owner}/${source.repo}/${skillPath}`,
            branch,
            author: source.owner,
            sourceRepo: `${source.owner}/${source.repo}`,
            githubUrl: `https://github.com/${source.owner}/${source.repo}/tree/${branch}/${skillPath}`,
            stars: repoInfo.stargazers_count || 0,
            category: categoryId,
            crawlStatus: 'pending',
          },
          locale: 'en',
        })

        console.log(`  ✅ Created: ${skillDir}`)
        totalCreated++
      }
    } catch (error) {
      console.error(`Failed to process ${source.owner}/${source.repo}:`, error)
    }
  }

  console.log(`\n🏁 List crawl complete: ${totalCreated} created, ${totalSkipped} skipped`)

  return { created: totalCreated, skipped: totalSkipped }
}

export async function updateNextPendingSkill() {
  const payload = await getPayload({ config })

  const pending = await payload.find({
    collection: 'skills',
    where: {
      and: [{ crawlStatus: { equals: 'pending' } }, { skillPath: { exists: true } }],
    },
    limit: 1,
    sort: 'createdAt',
  })

  if (pending.docs.length === 0) {
    console.log('✅ No pending skills to update')
    return { updated: false, remaining: 0 }
  }

  const skill = pending.docs[0]

  if (!skill.skillPath) {
    console.log(`  ⚠️ Skill ${skill.name} has no skillPath, marking as failed`)
    await payload.update({
      collection: 'skills',
      id: skill.id,
      data: { crawlStatus: 'failed' },
    })
    return { updated: false, error: 'No skillPath', remaining: pending.totalDocs - 1 }
  }

  console.log(`🤖 Updating skill: ${skill.name} (${skill.skillPath})`)

  await payload.update({
    collection: 'skills',
    id: skill.id,
    data: { crawlStatus: 'processing' },
  })

  try {
    const [owner, repo, ...pathParts] = (skill.skillPath || '').split('/')
    const skillPath = pathParts.join('/')
    const branch = skill.branch || 'main'

    const skillMd = await fetchRawFile(owner, repo, `${skillPath}/SKILL.md`, branch)

    if (!skillMd) {
      console.log(`  ⚠️ No SKILL.md found`)
      await payload.update({
        collection: 'skills',
        id: skill.id,
        data: { crawlStatus: 'failed' },
      })
      return { updated: false, error: 'No SKILL.md', remaining: pending.totalDocs - 1 }
    }

    const readme = await fetchRawFile(owner, repo, `${skillPath}/README.md`, branch)

    const repoInfo = (await fetchRepoInfo(owner, repo, process.env.GITHUB_TOKEN)) as RepoInfo

    const parsed = await parseSkillWithAI(skillMd, readme, {
      owner,
      repo,
      skillName: skill.slug || skill.name || '',
      stars: repoInfo.stargazers_count || 0,
    })

    const categoryId = await getOrCreateCategory(payload, parsed.category)
    const tagIds = await getOrCreateTags(payload, parsed.tags)

    await payload.update({
      collection: 'skills',
      id: skill.id,
      data: {
        name: parsed.name,
        description: parsed.description,
        category: categoryId,
        tags: tagIds,
        compatibility: parsed.compatibility,
        useCases: parsed.useCases.map((useCase) => ({ useCase })),
        prerequisites: parsed.prerequisites.map((prerequisite) => ({ prerequisite })),
        installCommand: `askm install ${owner}/${skill.slug}`,
        rawSkillMd: skillMd,
        stars: repoInfo.stargazers_count || 0,
        crawlStatus: 'completed',
      },
      locale: 'en',
    })

    await payload.update({
      collection: 'skills',
      id: skill.id,
      data: {
        name: parsed.translations.zh.name,
        description: parsed.translations.zh.description,
        useCases: parsed.translations.zh.useCases.map((useCase) => ({ useCase })),
      },
      locale: 'zh',
    })

    await payload.update({
      collection: 'skills',
      id: skill.id,
      data: {
        name: parsed.translations.ja.name,
        description: parsed.translations.ja.description,
        useCases: parsed.translations.ja.useCases.map((useCase) => ({ useCase })),
      },
      locale: 'ja',
    })

    console.log(`  ✅ Updated: ${skill.name}`)

    const remainingCount = await payload.count({
      collection: 'skills',
      where: { crawlStatus: { equals: 'pending' } },
    })

    return { updated: true, skill: skill.name, remaining: remainingCount.totalDocs }
  } catch (error) {
    console.error(`  ❌ Failed to update ${skill.name}:`, error)

    await payload.update({
      collection: 'skills',
      id: skill.id,
      data: { crawlStatus: 'failed' },
    })

    const remainingCount = await payload.count({
      collection: 'skills',
      where: { crawlStatus: { equals: 'pending' } },
    })

    return { updated: false, error: String(error), remaining: remainingCount.totalDocs }
  }
}

export async function getCrawlStatus() {
  const payload = await getPayload({ config })

  const [pending, processing, completed, failed] = await Promise.all([
    payload.count({ collection: 'skills', where: { crawlStatus: { equals: 'pending' } } }),
    payload.count({ collection: 'skills', where: { crawlStatus: { equals: 'processing' } } }),
    payload.count({ collection: 'skills', where: { crawlStatus: { equals: 'completed' } } }),
    payload.count({ collection: 'skills', where: { crawlStatus: { equals: 'failed' } } }),
  ])

  return {
    pending: pending.totalDocs,
    processing: processing.totalDocs,
    completed: completed.totalDocs,
    failed: failed.totalDocs,
    total: pending.totalDocs + processing.totalDocs + completed.totalDocs + failed.totalDocs,
  }
}
