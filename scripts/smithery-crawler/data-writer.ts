/**
 * Data Writer - thread-safe JSONL writer with mutex lock
 */

import * as fs from 'fs'
import * as fsPromises from 'fs/promises'
import * as path from 'path'
import type { SmitherySkill, CrawlerConfig } from './types'
import { SimpleLogger } from './utils'

/**
 * Simple mutex implementation for async operations
 */
class Mutex {
  private locked = false
  private queue: (() => void)[] = []

  async acquire(): Promise<void> {
    return new Promise(resolve => {
      if (!this.locked) {
        this.locked = true
        resolve()
      } else {
        this.queue.push(resolve)
      }
    })
  }

  release(): void {
    if (this.queue.length > 0) {
      const next = this.queue.shift()!
      next()
    } else {
      this.locked = false
    }
  }
}

export class DataWriter {
  private stream: fs.WriteStream | null = null
  private readonly mutex = new Mutex()
  private buffer: SmitherySkill[] = []
  private readonly filePath: string
  private readonly logger: SimpleLogger
  private flushInterval: NodeJS.Timeout | null = null
  private readonly BUFFER_SIZE = 10
  private readonly FLUSH_INTERVAL = 5000  // 5 seconds
  private writtenIds = new Set<string>()
  private totalWritten = 0

  constructor(config: CrawlerConfig) {
    this.filePath = path.join(config.outputDir, 'smithery-skills.jsonl')
    this.logger = new SimpleLogger('DataWriter')
  }

  async initialize(): Promise<void> {
    const dir = path.dirname(this.filePath)
    await fsPromises.mkdir(dir, { recursive: true })

    // Load existing IDs to prevent duplicates
    await this.loadExistingIds()

    // Open file in append mode
    this.stream = fs.createWriteStream(this.filePath, { flags: 'a' })
    
    // Set up periodic flush
    this.flushInterval = setInterval(() => {
      this.flush().catch(err => {
        this.logger.error(`Periodic flush failed: ${err.message}`)
      })
    }, this.FLUSH_INTERVAL)

    this.logger.info(`Initialized, ${this.writtenIds.size} existing records loaded`)
  }

  private async loadExistingIds(): Promise<void> {
    try {
      const content = await fsPromises.readFile(this.filePath, 'utf-8')
      const lines = content.split('\n').filter(line => line.trim())
      
      for (const line of lines) {
        try {
          const skill = JSON.parse(line) as SmitherySkill
          if (skill.id) {
            this.writtenIds.add(skill.id)
          }
        } catch {
          // Skip invalid lines
        }
      }
      
      this.totalWritten = this.writtenIds.size
    } catch (error: any) {
      if (error.code !== 'ENOENT') {
        this.logger.warn(`Error loading existing data: ${error.message}`)
      }
    }
  }

  async write(skill: SmitherySkill): Promise<boolean> {
    // Check for duplicate
    const skillId = `${skill.namespace}/${skill.slug}`
    if (this.writtenIds.has(skillId)) {
      this.logger.debug(`Skipping duplicate: ${skillId}`)
      return false
    }

    await this.mutex.acquire()
    try {
      // Double-check after acquiring lock
      if (this.writtenIds.has(skillId)) {
        return false
      }

      this.writtenIds.add(skillId)
      this.buffer.push({ ...skill, id: skillId })
      
      if (this.buffer.length >= this.BUFFER_SIZE) {
        await this.flushInternal()
      }
      
      return true
    } finally {
      this.mutex.release()
    }
  }

  async writeMany(skills: SmitherySkill[]): Promise<number> {
    let written = 0
    for (const skill of skills) {
      if (await this.write(skill)) {
        written++
      }
    }
    return written
  }

  private async flushInternal(): Promise<void> {
    if (this.buffer.length === 0 || !this.stream) return

    const lines = this.buffer.map(s => JSON.stringify(s)).join('\n') + '\n'
    
    return new Promise((resolve, reject) => {
      this.stream!.write(lines, (err) => {
        if (err) {
          reject(err)
        } else {
          this.totalWritten += this.buffer.length
          this.buffer = []
          resolve()
        }
      })
    })
  }

  async flush(): Promise<void> {
    await this.mutex.acquire()
    try {
      await this.flushInternal()
    } finally {
      this.mutex.release()
    }
  }

  async close(): Promise<void> {
    if (this.flushInterval) {
      clearInterval(this.flushInterval)
      this.flushInterval = null
    }

    await this.flush()

    if (this.stream) {
      return new Promise((resolve, reject) => {
        this.stream!.end((err: Error | null | undefined) => {
          if (err) reject(err)
          else resolve()
        })
      })
    }
  }

  getTotalWritten(): number {
    return this.totalWritten + this.buffer.length
  }

  hasSkill(namespace: string, slug: string): boolean {
    return this.writtenIds.has(`${namespace}/${slug}`)
  }
}
