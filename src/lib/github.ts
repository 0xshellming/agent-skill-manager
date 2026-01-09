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
