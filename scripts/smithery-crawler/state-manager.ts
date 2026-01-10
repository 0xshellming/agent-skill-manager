/**
 * State Manager - handles crawler state persistence for resumable crawling
 */

import * as fs from 'fs/promises'
import * as path from 'path'
import type { CrawlerState, FailedTask, CrawlerConfig } from './types'
import { debounce, SimpleLogger } from './utils'

export class StateManager {
  private state: CrawlerState
  private readonly statePath: string
  private readonly logger: SimpleLogger
  private saveDebounced: () => void
  private dirty = false

  constructor(config: CrawlerConfig) {
    this.statePath = path.join(config.outputDir, 'crawler-state.json')
    this.logger = new SimpleLogger('StateManager')
    this.state = this.getInitialState()
    this.saveDebounced = debounce(() => this.saveImmediate(), 2000)
  }

  private getInitialState(): CrawlerState {
    return {
      version: '1.0.0',
      lastUpdated: new Date().toISOString(),
      totalPages: 0,
      completedPages: [],
      currentPageProgress: {},
      failedTasks: [],
      stats: {
        totalSkillsFound: 0,
        successCount: 0,
        failCount: 0,
        retryCount: 0,
        startTime: new Date().toISOString(),
        lastActivityTime: new Date().toISOString(),
      },
    }
  }

  async load(): Promise<CrawlerState> {
    try {
      const data = await fs.readFile(this.statePath, 'utf-8')
      this.state = JSON.parse(data)
      this.logger.info(
        `Loaded state: ${this.state.stats.successCount} completed, ` +
        `${this.state.completedPages.length} pages done, ` +
        `${this.state.failedTasks.length} failed tasks`
      )
    } catch (error: any) {
      if (error.code === 'ENOENT') {
        this.logger.info('No existing state found, starting fresh')
        this.state = this.getInitialState()
      } else {
        this.logger.warn(`Error loading state: ${error.message}, starting fresh`)
        this.state = this.getInitialState()
      }
    }
    return this.state
  }

  private async saveImmediate(): Promise<void> {
    if (!this.dirty) return
    
    try {
      this.state.lastUpdated = new Date().toISOString()
      this.state.stats.lastActivityTime = new Date().toISOString()
      
      const dir = path.dirname(this.statePath)
      await fs.mkdir(dir, { recursive: true })
      
      // Write to temp file first, then rename (atomic operation)
      const tempPath = this.statePath + '.tmp'
      await fs.writeFile(tempPath, JSON.stringify(this.state, null, 2))
      await fs.rename(tempPath, this.statePath)
      
      this.dirty = false
    } catch (error: any) {
      this.logger.error(`Failed to save state: ${error.message}`)
    }
  }

  save(): void {
    this.dirty = true
    this.saveDebounced()
  }

  async forceSave(): Promise<void> {
    this.dirty = true
    await this.saveImmediate()
  }

  // Getters
  getState(): CrawlerState {
    return this.state
  }

  getTotalPages(): number {
    return this.state.totalPages
  }

  getCompletedPages(): number[] {
    return [...this.state.completedPages]
  }

  getIncompletePages(): number[] {
    const allPages = Array.from({ length: this.state.totalPages }, (_, i) => i + 1)
    return allPages.filter(p => !this.state.completedPages.includes(p))
  }

  getPageProgress(page: number): number {
    return this.state.currentPageProgress[page] || 0
  }

  getFailedTasks(): FailedTask[] {
    return [...this.state.failedTasks]
  }

  getStats() {
    return { ...this.state.stats }
  }

  // Setters
  setTotalPages(total: number): void {
    this.state.totalPages = total
    this.save()
  }

  updatePageProgress(page: number, skillIndex: number): void {
    this.state.currentPageProgress[page] = skillIndex
    this.save()
  }

  markPageComplete(page: number): void {
    if (!this.state.completedPages.includes(page)) {
      this.state.completedPages.push(page)
      this.state.completedPages.sort((a, b) => a - b)
      delete this.state.currentPageProgress[page]
      this.save()
    }
  }

  incrementSuccess(): void {
    this.state.stats.successCount++
    this.state.stats.totalSkillsFound++
    this.save()
  }

  incrementFail(): void {
    this.state.stats.failCount++
    this.save()
  }

  incrementRetry(): void {
    this.state.stats.retryCount++
    this.save()
  }

  addFailedTask(task: FailedTask): void {
    // Check if already exists
    const existingIndex = this.state.failedTasks.findIndex(t => t.id === task.id)
    if (existingIndex >= 0) {
      this.state.failedTasks[existingIndex] = task
    } else {
      this.state.failedTasks.push(task)
    }
    this.save()
  }

  removeFailedTask(taskId: string): void {
    this.state.failedTasks = this.state.failedTasks.filter(t => t.id !== taskId)
    this.save()
  }

  clearFailedTasks(): void {
    this.state.failedTasks = []
    this.save()
  }

  // Reset for fresh start
  async reset(): Promise<void> {
    this.state = this.getInitialState()
    await this.forceSave()
    this.logger.info('State reset to initial values')
  }
}
