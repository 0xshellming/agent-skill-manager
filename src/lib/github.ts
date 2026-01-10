const GITHUB_API = 'https://api.github.com'
const RAW_GITHUB = 'https://raw.githubusercontent.com'

interface FetchOptions {
  token?: string
}

async function fetchWithAuth(url: string, options: FetchOptions = {}) {
  const headers: Record<string, string> = {
    'User-Agent': 'agent-skill-crawler',
    Accept: 'application/vnd.github.v3+json',
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
  const response = await fetchWithAuth(`${GITHUB_API}/repos/${owner}/${repo}`, { token })
  return response.json()
}

export async function fetchRepoContents(
  owner: string,
  repo: string,
  path: string,
  branch = 'main',
  token?: string,
) {
  const response = await fetchWithAuth(
    `${GITHUB_API}/repos/${owner}/${repo}/contents/${path}?ref=${branch}`,
    { token },
  )
  return response.json()
}

export async function fetchRawFile(
  owner: string,
  repo: string,
  path: string,
  branch = 'main',
): Promise<string | null> {
  try {
    const response = await fetch(`${RAW_GITHUB}/${owner}/${repo}/${branch}/${path}`)

    if (!response.ok) return null

    return response.text()
  } catch {
    return null
  }
}

interface GitHubContent {
  type: string
  name: string
}

export interface SkillMdResult {
  content: string
  source: 'SKILL.md' | 'SKILL_GUIDE.md' | '.skill-zip'
  fileName?: string
}

const SKILL_FILE_NAMES = ['SKILL.md', 'SKILL_GUIDE.md', 'SKILL_STRUCTURE.md'] as const

export async function fetchSkillMd(
  owner: string,
  repo: string,
  skillPath: string,
  branch = 'main',
  token?: string,
): Promise<SkillMdResult | null> {
  for (const fileName of SKILL_FILE_NAMES) {
    const content = await fetchRawFile(owner, repo, `${skillPath}/${fileName}`, branch)
    if (content) {
      return { content, source: fileName as SkillMdResult['source'], fileName }
    }
  }

  try {
    const contents = (await fetchRepoContents(owner, repo, skillPath, branch, token)) as Array<{
      type: string
      name: string
      download_url?: string
    }>

    const skillFiles = contents.filter(
      (item) => item.type === 'file' && item.name.endsWith('.skill'),
    )

    for (const skillFile of skillFiles) {
      const extracted = await extractSkillMdFromZip(
        owner,
        repo,
        `${skillPath}/${skillFile.name}`,
        branch,
      )
      if (extracted) {
        return { content: extracted, source: '.skill-zip', fileName: skillFile.name }
      }
    }
  } catch {
    return null
  }

  return null
}

async function extractSkillMdFromZip(
  owner: string,
  repo: string,
  path: string,
  branch: string,
): Promise<string | null> {
  try {
    const response = await fetch(
      `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${path}`,
    )
    if (!response.ok) return null

    const arrayBuffer = await response.arrayBuffer()
    const { unzip } = await import('fflate')

    return new Promise((resolve) => {
      unzip(new Uint8Array(arrayBuffer), (err: Error | null, files: Record<string, Uint8Array>) => {
        if (err) {
          console.warn(`Failed to unzip ${path}:`, err.message)
          resolve(null)
          return
        }

        for (const [fileName, data] of Object.entries(files)) {
          if (fileName.endsWith('SKILL.md')) {
            const decoder = new TextDecoder('utf-8')
            resolve(decoder.decode(data))
            return
          }
        }

        resolve(null)
      })
    })
  } catch (error) {
    console.warn(`Failed to extract SKILL.md from ${path}:`, error)
    return null
  }
}

export async function fetchSkillDirectories(
  owner: string,
  repo: string,
  skillsPath: string,
  branch = 'main',
  token?: string,
): Promise<string[]> {
  try {
    const contents = (await fetchRepoContents(
      owner,
      repo,
      skillsPath,
      branch,
      token,
    )) as GitHubContent[]

    return contents
      .filter(
        (item: GitHubContent) =>
          item.type === 'dir' && !item.name.startsWith('.') && !item.name.startsWith('_'),
      )
      .map((item: GitHubContent) => item.name)
  } catch (error) {
    console.error(`Failed to fetch ${owner}/${repo}/${skillsPath}:`, error)
    return []
  }
}
