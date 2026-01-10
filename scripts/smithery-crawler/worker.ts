import type { Page } from 'playwright'
import type { Task, SmitherySkill, WorkerStats, CrawlerConfig, FailedTask } from './types'
import { SELECTORS, URLS } from './selectors'
import { TaskQueue } from './task-queue'
import { DataWriter } from './data-writer'
import { StateManager } from './state-manager'
import { delay, SimpleLogger } from './utils'

export class Worker {
  private readonly id: number
  private readonly page: Page
  private readonly taskQueue: TaskQueue
  private readonly dataWriter: DataWriter
  private readonly stateManager: StateManager
  private readonly config: CrawlerConfig
  private readonly logger: SimpleLogger

  private running = false
  private stats: WorkerStats

  constructor(
    id: number,
    page: Page,
    taskQueue: TaskQueue,
    dataWriter: DataWriter,
    stateManager: StateManager,
    config: CrawlerConfig,
  ) {
    this.id = id
    this.page = page
    this.taskQueue = taskQueue
    this.dataWriter = dataWriter
    this.stateManager = stateManager
    this.config = config
    this.logger = new SimpleLogger(`Worker-${id}`)

    this.stats = {
      id,
      tasksCompleted: 0,
      tasksFailed: 0,
      lastTaskTime: '',
      status: 'idle',
    }
  }

  async start(): Promise<void> {
    this.running = true
    this.stats.status = 'working'
    this.logger.info('Started')

    while (this.running) {
      try {
        const task = await this.taskQueue.waitForTask(3000)

        if (!task) {
          if (this.taskQueue.isAllDone()) {
            this.logger.info('Queue empty, stopping')
            break
          }
          continue
        }

        await this.processTask(task)
      } catch (error: any) {
        this.logger.error(`Unexpected error: ${error.message}`)
        await delay(1000)
      }
    }

    this.stats.status = 'stopped'
    this.logger.info('Stopped')
  }

  async stop(): Promise<void> {
    this.running = false
  }

  private async processTask(task: Task): Promise<void> {
    try {
      if (task.type === 'list_scan') {
        await this.processListTask(task)
      } else if (task.type === 'detail_fetch') {
        await this.processDetailTask(task)
      }

      await this.taskQueue.complete(task.id)
      this.stats.tasksCompleted++
      this.stats.lastTaskTime = new Date().toISOString()

      if (this.config.requestDelay > 0) {
        await delay(this.config.requestDelay)
      }
    } catch (error: any) {
      await this.handleTaskError(task, error)
    }
  }

  private async processListTask(task: Task): Promise<void> {
    const pageNum = task.page!
    this.logger.info(`Processing list page ${pageNum}`)

    const url = URLS.SKILLS_LIST(pageNum)
    await this.page.goto(url, {
      waitUntil: 'networkidle',
      timeout: this.config.pageTimeout,
    })

    await this.page.waitForSelector('div.group\\/card', { timeout: 10000 })

    const cardUrls = await this.extractCardUrls()
    this.logger.info(`Found ${cardUrls.length} cards on page ${pageNum}`)

    for (let i = 0; i < cardUrls.length; i++) {
      const detailTask = TaskQueue.createDetailTask(pageNum, i, cardUrls[i])
      await this.taskQueue.enqueue(detailTask)
    }

    this.stateManager.updatePageProgress(pageNum, cardUrls.length)
  }

  private async extractCardUrls(): Promise<string[]> {
    return await this.page.evaluate(() => {
      const cards = document.querySelectorAll('div.group\\/card')
      const result: string[] = []

      cards.forEach((card) => {
        const nsSlugEl = card.querySelector('div.text-muted-foreground.text-sm.truncate')
        const nsSlugText = nsSlugEl?.textContent?.trim() || ''

        const match = nsSlugText.match(/^([a-zA-Z0-9_-]+)\/([a-zA-Z0-9_-]+)$/)
        if (match) {
          result.push(`https://smithery.ai/skills/${match[1]}/${match[2]}`)
        }
      })

      return result
    })
  }

  private async processDetailTask(task: Task): Promise<void> {
    const { skillUrl, page: pageNum, skillIndex } = task
    this.logger.debug(`Processing detail: ${skillUrl}`)

    const urlMatch = skillUrl?.match(/\/skills\/([^/]+)\/([^/]+)/)
    if (urlMatch) {
      const [, namespace, slug] = urlMatch
      if (this.dataWriter.hasSkill(namespace, slug)) {
        this.logger.debug(`Skipping already scraped: ${namespace}/${slug}`)
        return
      }
    }

    await this.page.goto(skillUrl!, {
      waitUntil: 'networkidle',
      timeout: this.config.pageTimeout,
    })

    await this.page.waitForSelector('h1', { timeout: 10000 })

    const skillData = await this.extractSkillData()
    const written = await this.dataWriter.write(skillData)

    if (written) {
      this.stateManager.incrementSuccess()
      this.logger.debug(`Saved: ${skillData.namespace}/${skillData.slug}`)
    }

    if (pageNum !== undefined && skillIndex !== undefined) {
      this.stateManager.updatePageProgress(pageNum, skillIndex + 1)
    }
  }

  private async extractSkillData(): Promise<SmitherySkill> {
    const data = await this.page.evaluate(() => {
      const nameEl = document.querySelector('div.space-y-6 h1')
      const name = nameEl?.textContent?.trim() || ''

      const descEl = document.querySelector('div.space-y-6 > div > p.text-lg')
      const description = descEl?.textContent?.trim() || ''

      const sourceContainer = document.querySelector(
        'div.rounded-lg.border.border-border.bg-muted\\/50.p-4',
      )
      const sourceLink = sourceContainer?.querySelector('a[href*="github.com"]')
      const githubUrl = sourceLink?.getAttribute('href') || ''

      const statsContainer = document.querySelector('div.flex.items-center.gap-6.text-sm')
      let stars = 0,
        forks = 0
      if (statsContainer) {
        const statsItems = statsContainer.querySelectorAll('div.flex.items-center.gap-1')
        statsItems.forEach((item) => {
          const text = item.textContent || ''
          if (text.includes('stars')) {
            stars = parseInt(text.replace(/\D/g, '')) || 0
          } else if (text.includes('forks')) {
            forks = parseInt(text.replace(/\D/g, '')) || 0
          }
        })
      }

      const activityContainer = document.querySelector('div.flex.items-center.gap-6.border-b')
      let activations30d = 0,
        users30d = 0
      if (activityContainer) {
        const items = activityContainer.querySelectorAll('div.flex.items-center.gap-1')
        items.forEach((item, index) => {
          const span = item.querySelector('span')
          if (span) {
            const value = parseInt(span.textContent || '0')
            if (index === 0) activations30d = value
            if (index === 1) users30d = value
          }
        })
      }

      const categoryEls = document.querySelectorAll('a[href*="/skills?category="]')
      const categories: string[] = []
      categoryEls.forEach((el) => {
        const cat = el.textContent?.trim()
        if (cat) categories.push(cat)
      })

      const pathParts = window.location.pathname.split('/').filter(Boolean)
      const namespace = pathParts[1] || ''
      const slug = pathParts[2] || ''

      return {
        namespace,
        slug,
        name,
        description,
        githubUrl,
        stars,
        forks,
        activations30d,
        users30d,
        categories,
        sourceUrl: window.location.href,
      }
    })

    return {
      ...data,
      id: `${data.namespace}/${data.slug}`,
      scrapedAt: new Date().toISOString(),
    }
  }

  private async handleTaskError(task: Task, error: Error): Promise<void> {
    this.logger.warn(`Task ${task.id} failed: ${error.message}`)
    this.stats.tasksFailed++

    if (task.retryCount < this.config.maxRetries) {
      this.stateManager.incrementRetry()
      await this.taskQueue.requeue(task)
      this.logger.info(`Requeued task ${task.id} (retry ${task.retryCount + 1})`)
    } else {
      this.stateManager.incrementFail()
      await this.taskQueue.fail(task.id)

      const failedTask: FailedTask = {
        id: task.id,
        type: task.type === 'list_scan' ? 'list' : 'detail',
        page: task.page,
        skillIndex: task.skillIndex,
        skillUrl: task.skillUrl,
        error: error.message,
        retryCount: task.retryCount,
        lastAttempt: new Date().toISOString(),
      }
      this.stateManager.addFailedTask(failedTask)

      this.logger.error(`Task ${task.id} permanently failed after ${task.retryCount} retries`)
    }
  }

  getStats(): WorkerStats {
    return { ...this.stats }
  }

  getId(): number {
    return this.id
  }
}
