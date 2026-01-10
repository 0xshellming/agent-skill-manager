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

async function getSkillDirectories(
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
