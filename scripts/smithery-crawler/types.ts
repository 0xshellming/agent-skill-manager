/**
 * Smithery Crawler Types
 */

export interface SmitherySkill {
  id: string
  namespace: string
  slug: string
  name: string
  description: string
  githubUrl: string
  stars: number
  forks: number
  activations30d: number
  users30d: number
  categories: string[]
  scrapedAt: string
  sourceUrl: string
}

export interface CrawlerState {
  version: string
  lastUpdated: string
  totalPages: number
  completedPages: number[]
  currentPageProgress: Record<number, number>  // page -> last completed skill index
  failedTasks: FailedTask[]
  stats: CrawlerStats
}

export interface CrawlerStats {
  totalSkillsFound: number
  successCount: number
  failCount: number
  retryCount: number
  startTime: string
  lastActivityTime: string
}

export interface FailedTask {
  id: string
  type: 'list' | 'detail'
  page?: number
  skillIndex?: number
  skillUrl?: string
  error: string
  retryCount: number
  lastAttempt: string
}

export interface Task {
  id: string
  type: 'list_scan' | 'detail_fetch'
  priority: number  // 0 = highest
  page?: number
  skillIndex?: number
  skillUrl?: string
  retryCount: number
  createdAt: string
}

export interface WorkerStats {
  id: number
  tasksCompleted: number
  tasksFailed: number
  lastTaskTime: string
  status: 'idle' | 'working' | 'stopped'
}

export interface CrawlerConfig {
  concurrency: number
  maxRetries: number
  requestDelay: number  // ms between requests per worker
  pageTimeout: number   // ms
  headless: boolean
  outputDir: string
}

export const DEFAULT_CONFIG: CrawlerConfig = {
  concurrency: 7,
  maxRetries: 3,
  requestDelay: 500,
  pageTimeout: 30000,
  headless: true,
  outputDir: './scripts/smithery-crawler/data'
}
