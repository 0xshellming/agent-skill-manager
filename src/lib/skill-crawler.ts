import { getPayload, Payload } from 'payload'
import config from '@payload-config'
import { parseSkillWithAI } from './skill-parser'
import {
  fetchRepoInfo,
  fetchRawFile,
  fetchRepoContents,
  fetchSkillMd,
  fetchAwesomeListSkills,
} from './github'

interface SkillSource {
  owner: string
  repo: string
  skillsPath?: string
  branch?: string
  type?: 'directory' | 'awesome'
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
  { owner: 'obra', repo: 'superpowers', skillsPath: 'skills', branch: 'main' },
  { owner: 'jezweb', repo: 'claude-skills', skillsPath: '', branch: 'main' },
  { owner: 'VoltAgent', repo: 'awesome-claude-skills', type: 'awesome', branch: 'main' },
  { owner: 'travisvn', repo: 'awesome-claude-skills', type: 'awesome', branch: 'main' },
  { owner: 'brightdata', repo: 'awesome-claude-skills', type: 'awesome', branch: 'main' },
  { owner: 'BehiSecc', repo: 'awesome-claude-skills', type: 'awesome', branch: 'main' },
  { owner: 'ComposioHQ', repo: 'awesome-claude-skills', type: 'awesome', branch: 'master' },
  { owner: 'karanb192', repo: 'awesome-claude-skills', type: 'awesome', branch: 'main' },
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

export async function getSkillDirectories(
  source: SkillSource,
  branch: string,
  token?: string,
): Promise<string[]> {
  if (source.type === 'awesome') {
    return await fetchAwesomeListSkills(source.owner, source.repo, branch, token)
  }

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
    source.skillsPath || '',
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
  const stats = { found: 0, new: 0, errors: 0 }

  for (const source of SKILL_SOURCES) {
    try {
      const branch = source.branch || 'main'
      const skillDirs = await getSkillDirectories(source, branch, token)

      for (const skillDir of skillDirs) {
        stats.found++

        const isAwesome = source.type === 'awesome'

        let owner = source.owner
        let repo = source.repo
        let path = skillDir
        let sourceRepo = `${source.owner}/${source.repo}`

        if (isAwesome) {
          const parts = skillDir.split('/')
          if (parts.length >= 3) {
            owner = parts[0]
            repo = parts[1]
            path = parts.slice(2).join('/')
            sourceRepo = `${owner}/${repo}`
          }
        } else if (source.skillsPath) {
          path = `${source.skillsPath}/${skillDir}`
        }

        const skillSlug = slugify(`${owner}-${repo}-${path.split('/').pop()}`)

        const existing = await payload.find({
          collection: 'skills',
          where: { slug: { equals: skillSlug } },
          limit: 1,
        })

        if (existing.totalDocs === 0) {
          await payload.create({
            collection: 'skills',
            data: {
              name: path.split('/').pop() || 'Untitled Skill',
              slug: skillSlug,
              skillPath: `${owner}/${repo}/${path}`,
              sourceRepo: sourceRepo,
              branch: branch,
              crawlStatus: 'pending',
              githubUrl: `https://github.com/${owner}/${repo}/tree/${branch}/${path}`,
            },
          })
          stats.new++
        }
      }
    } catch (error) {
      console.error(`Error crawling ${source.owner}/${source.repo}:`, error)
      stats.errors++
    }
  }

  return stats
}

export async function updateNextPendingSkill() {
  const payload = await getPayload({ config })
  const token = process.env.GITHUB_TOKEN

  const pendingSkills = await payload.find({
    collection: 'skills',
    where: { crawlStatus: { equals: 'pending' } },
    limit: 1,
    sort: 'createdAt',
  })

  if (pendingSkills.totalDocs === 0) {
    return { status: 'no_pending_skills' }
  }

  const skill = pendingSkills.docs[0]
  const [owner, repo, ...pathParts] = skill.skillPath.split('/')
  const path = pathParts.join('/')
  const branch = skill.branch || 'main'

  try {
    await payload.update({
      collection: 'skills',
      id: skill.id,
      data: { crawlStatus: 'processing' },
    })

    let stars = 0
    try {
      const repoInfo = (await fetchRepoInfo(owner, repo, token)) as { stargazers_count: number }
      stars = repoInfo.stargazers_count
    } catch (e) {
      console.warn(`Failed to fetch repo info for ${owner}/${repo}`, e)
    }

    const skillMdResult = await fetchSkillMd(owner, repo, path, branch, token)

    if (!skillMdResult) {
      throw new Error('SKILL.md not found')
    }

    const readmeContent = await fetchRawFile(owner, repo, `${path}/README.md`, branch)

    const parsed = await parseSkillWithAI(skillMdResult.content, readmeContent, {
      owner,
      repo,
      skillName: skill.name || 'Untitled',
      stars,
    })

    const categoryId = await getOrCreateCategory(payload, parsed.category)
    const tagIds = await getOrCreateTags(payload, parsed.tags)

    await payload.update({
      collection: 'skills',
      id: skill.id,
      data: {
        crawlStatus: 'completed',
        name: parsed.name,
        description: parsed.description,
        stars: stars,
        category: categoryId,
        tags: tagIds,
        compatibility: parsed.compatibility,
        useCases: parsed.useCases.map((uc) => ({ useCase: uc })),
        prerequisites: parsed.prerequisites.map((p) => ({ prerequisite: p })),
        rawSkillMd: skillMdResult.content,
      },
    })

    return {
      status: 'success',
      skill: skill.slug,
      name: parsed.name,
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)

    await payload.update({
      collection: 'skills',
      id: skill.id,
      data: {
        crawlStatus: 'failed',
        crawlError: errorMessage,
      },
    })

    return {
      status: 'failed',
      skill: skill.slug,
      error: errorMessage,
    }
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

export async function getFailedSkills() {
  const payload = await getPayload({ config })

  const failed = await payload.find({
    collection: 'skills',
    where: { crawlStatus: { equals: 'failed' } },
    limit: 50,
    sort: '-updatedAt',
  })

  return {
    count: failed.totalDocs,
    skills: failed.docs.map((doc) => ({
      name: doc.name,
      slug: doc.slug,
      error: doc.crawlError,
      repo: doc.sourceRepo,
    })),
  }
}

export async function fetchSkillById(id: string) {
  try {
    const payload = await getPayload({ config })
    const skill = await payload.findByID({
      collection: 'skills',
      id: Number(id),
    })

    if (!skill) {
      return { success: false, error: 'Skill not found', errorType: 'NotFound' }
    }

    return { success: true, skill }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    return { success: false, error: errorMessage, details: error }
  }
}

export async function deleteSkillById(id: string) {
  try {
    const payload = await getPayload({ config })
    await payload.delete({
      collection: 'skills',
      id: Number(id),
    })

    return { success: true }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    return { success: false, error: errorMessage }
  }
}
