import { chromium, Browser, BrowserContext } from 'playwright'
import type { CrawlerConfig } from './types'
import { DEFAULT_CONFIG } from './types'
import { SELECTORS, URLS } from './selectors'
import { TaskQueue } from './task-queue'
import { DataWriter } from './data-writer'
import { StateManager } from './state-manager'
import { Worker } from './worker'
import { SimpleLogger, createProgressBar, formatDuration } from './utils'

export interface OrchestratorOptions {
  resume?: boolean
  retryFailed?: boolean
  reset?: boolean
}

export class Orchestrator {
  private readonly config: CrawlerConfig
  private readonly logger: SimpleLogger
  private readonly taskQueue: TaskQueue
  private readonly dataWriter: DataWriter
  private readonly stateManager: StateManager

  private browser: Browser | null = null
  private context: BrowserContext | null = null
  private workers: Worker[] = []
  private progressInterval: NodeJS.Timeout | null = null
  private startTime: number = 0
  private shuttingDown = false

  constructor(config: Partial<CrawlerConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config }
    this.logger = new SimpleLogger('Orchestrator')
    this.taskQueue = new TaskQueue()
    this.dataWriter = new DataWriter(this.config)
    this.stateManager = new StateManager(this.config)
  }

  async start(options: OrchestratorOptions = {}): Promise<void> {
    this.startTime = Date.now()
    this.logger.info('Starting Smithery.ai crawler')
    this.logger.info(`Concurrency: ${this.config.concurrency} workers`)

    this.setupShutdownHandler()

    if (options.reset) {
      await this.stateManager.reset()
    } else {
      await this.stateManager.load()
    }

    await this.dataWriter.initialize()

    this.browser = await chromium.launch({ headless: this.config.headless })
    this.context = await this.browser.newContext({
      userAgent:
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    })

    const totalPages = await this.discoverTotalPages()
    this.stateManager.setTotalPages(totalPages)
    this.logger.info(`Total pages to crawl: ${totalPages}`)

    await this.initializeTaskQueue(options)

    const pages = await Promise.all(
      Array.from({ length: this.config.concurrency }, () => this.context!.newPage()),
    )

    this.workers = pages.map(
      (page, index) =>
        new Worker(
          index + 1,
          page,
          this.taskQueue,
          this.dataWriter,
          this.stateManager,
          this.config,
        ),
    )

    this.startProgressDisplay()

    this.logger.info(`Starting ${this.workers.length} workers`)
    await Promise.all(this.workers.map((worker) => worker.start()))

    await this.shutdown()
  }

  private async discoverTotalPages(): Promise<number> {
    const existingTotal = this.stateManager.getTotalPages()
    if (existingTotal > 0) {
      this.logger.info(`Using cached total pages: ${existingTotal}`)
      return existingTotal
    }

    this.logger.info('Discovering total pages...')

    const page = await this.context!.newPage()
    try {
      await page.goto(URLS.SKILLS_LIST(1), {
        waitUntil: 'networkidle',
        timeout: this.config.pageTimeout,
      })

      await page.waitForSelector('div.group\\/card', { timeout: 10000 })

      const totalPages = await page.evaluate(() => {
        const navButtons = document.querySelectorAll(
          'nav[aria-label="pagination"] button, nav[aria-label="pagination"] a',
        )
        let maxPage = 1

        navButtons.forEach((btn) => {
          const text = btn.textContent?.trim() || ''
          const pageNum = parseInt(text)
          if (!isNaN(pageNum) && pageNum > maxPage) {
            maxPage = pageNum
          }
        })

        return maxPage
      })

      return totalPages || 1463
    } finally {
      await page.close()
    }
  }

  private async initializeTaskQueue(options: OrchestratorOptions): Promise<void> {
    if (options.retryFailed) {
      const failedTasks = this.stateManager.getFailedTasks()
      this.logger.info(`Retrying ${failedTasks.length} failed tasks`)

      for (const failed of failedTasks) {
        if (failed.type === 'list' && failed.page !== undefined) {
          await this.taskQueue.enqueue(TaskQueue.createListTask(failed.page))
        } else if (failed.type === 'detail' && failed.skillUrl) {
          await this.taskQueue.enqueue(
            TaskQueue.createDetailTask(failed.page || 0, failed.skillIndex || 0, failed.skillUrl),
          )
        }
      }

      this.stateManager.clearFailedTasks()
      return
    }

    const totalPages = this.stateManager.getTotalPages()
    const completedPages = options.resume ? this.stateManager.getCompletedPages() : []
    const completedSet = new Set(completedPages)

    let enqueuedCount = 0
    for (let page = 1; page <= totalPages; page++) {
      if (!completedSet.has(page)) {
        await this.taskQueue.enqueue(TaskQueue.createListTask(page))
        enqueuedCount++
      }
    }

    this.logger.info(
      `Enqueued ${enqueuedCount} list tasks (${completedPages.length} pages already completed)`,
    )
  }

  private startProgressDisplay(): void {
    this.progressInterval = setInterval(() => {
      this.displayProgress()
    }, 10000)
  }

  private displayProgress(): void {
    const queueStats = this.taskQueue.getStats()
    const stateStats = this.stateManager.getStats()
    const totalPages = this.stateManager.getTotalPages()
    const completedPages = this.stateManager.getCompletedPages().length
    const elapsed = Date.now() - this.startTime

    const workerStatuses = this.workers.map((w) => w.getStats())
    const activeWorkers = workerStatuses.filter((s) => s.status === 'working').length

    console.log('\n' + '='.repeat(60))
    console.log(`📊 Progress Report - ${formatDuration(elapsed)} elapsed`)
    console.log('='.repeat(60))
    console.log(`Pages:    ${createProgressBar(completedPages, totalPages)}`)
    console.log(`          ${completedPages}/${totalPages} pages completed`)
    console.log(`Skills:   ${stateStats.successCount} saved, ${stateStats.failCount} failed`)
    console.log(`Queue:    ${queueStats.queued} pending, ${queueStats.processing} processing`)
    console.log(`Workers:  ${activeWorkers}/${this.workers.length} active`)
    console.log(`Retries:  ${stateStats.retryCount}`)
    console.log('='.repeat(60) + '\n')
  }

  private setupShutdownHandler(): void {
    const handler = async () => {
      if (this.shuttingDown) return
      this.shuttingDown = true

      console.log('\n')
      this.logger.info('Received shutdown signal, gracefully stopping...')

      await Promise.all(this.workers.map((w) => w.stop()))
      await this.shutdown()

      process.exit(0)
    }

    process.on('SIGINT', handler)
    process.on('SIGTERM', handler)
  }

  private async shutdown(): Promise<void> {
    if (this.progressInterval) {
      clearInterval(this.progressInterval)
      this.progressInterval = null
    }

    this.displayProgress()

    this.logger.info('Saving final state...')
    await this.stateManager.forceSave()
    await this.dataWriter.close()

    if (this.context) {
      await this.context.close()
      this.context = null
    }

    if (this.browser) {
      await this.browser.close()
      this.browser = null
    }

    const stats = this.stateManager.getStats()
    const elapsed = Date.now() - this.startTime

    console.log('\n' + '='.repeat(60))
    console.log('🏁 Crawl Complete')
    console.log('='.repeat(60))
    console.log(`Total skills saved:  ${stats.successCount}`)
    console.log(`Failed:              ${stats.failCount}`)
    console.log(`Retries:             ${stats.retryCount}`)
    console.log(`Duration:            ${formatDuration(elapsed)}`)
    console.log(`Output:              ${this.config.outputDir}/smithery-skills.jsonl`)
    console.log('='.repeat(60) + '\n')
  }
}
