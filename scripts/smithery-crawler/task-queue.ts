/**
 * Task Queue - priority-based task queue with thread-safe operations
 */

import type { Task } from './types'
import { SimpleLogger, generateTaskId } from './utils'

/**
 * Simple mutex implementation
 */
class Mutex {
  private locked = false
  private queue: (() => void)[] = []

  async acquire(): Promise<void> {
    return new Promise((resolve) => {
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

export class TaskQueue {
  private queue: Task[] = []
  private processing = new Map<string, Task>()
  private completed = new Set<string>()
  private readonly mutex = new Mutex()
  private readonly logger: SimpleLogger
  private waiters: (() => void)[] = []

  constructor() {
    this.logger = new SimpleLogger('TaskQueue')
  }

  async enqueue(task: Task): Promise<void> {
    await this.mutex.acquire()
    try {
      // Skip if already completed or processing
      if (this.completed.has(task.id) || this.processing.has(task.id)) {
        return
      }

      // Skip if already in queue
      if (this.queue.some((t) => t.id === task.id)) {
        return
      }

      // Insert by priority (lower = higher priority)
      const index = this.queue.findIndex((t) => t.priority > task.priority)
      if (index === -1) {
        this.queue.push(task)
      } else {
        this.queue.splice(index, 0, task)
      }

      // Notify waiting workers
      if (this.waiters.length > 0) {
        const waiter = this.waiters.shift()!
        waiter()
      }
    } finally {
      this.mutex.release()
    }
  }

  async enqueueBatch(tasks: Task[]): Promise<void> {
    for (const task of tasks) {
      await this.enqueue(task)
    }
  }

  async dequeue(): Promise<Task | null> {
    await this.mutex.acquire()
    try {
      const task = this.queue.shift()
      if (task) {
        this.processing.set(task.id, task)
        return task
      }
      return null
    } finally {
      this.mutex.release()
    }
  }

  async waitForTask(timeoutMs: number = 5000): Promise<Task | null> {
    // First try to dequeue directly
    const task = await this.dequeue()
    if (task) return task

    // Wait for new task or timeout
    return new Promise((resolve) => {
      const timeout = setTimeout(() => {
        const index = this.waiters.indexOf(waiter)
        if (index >= 0) this.waiters.splice(index, 1)
        resolve(null)
      }, timeoutMs)

      const waiter = async () => {
        clearTimeout(timeout)
        const task = await this.dequeue()
        resolve(task)
      }

      this.waiters.push(waiter)
    })
  }

  async complete(taskId: string): Promise<void> {
    await this.mutex.acquire()
    try {
      this.processing.delete(taskId)
      this.completed.add(taskId)
    } finally {
      this.mutex.release()
    }
  }

  async requeue(task: Task, incrementPriority: boolean = true): Promise<void> {
    await this.mutex.acquire()
    try {
      this.processing.delete(task.id)

      // Update task for retry
      const updatedTask: Task = {
        ...task,
        retryCount: task.retryCount + 1,
        priority: incrementPriority ? Math.min(task.priority + 1, 10) : task.priority,
      }

      // Add back to queue
      const index = this.queue.findIndex((t) => t.priority > updatedTask.priority)
      if (index === -1) {
        this.queue.push(updatedTask)
      } else {
        this.queue.splice(index, 0, updatedTask)
      }
    } finally {
      this.mutex.release()
    }
  }

  async fail(taskId: string): Promise<void> {
    await this.mutex.acquire()
    try {
      this.processing.delete(taskId)
      // Don't add to completed so it can be retried later
    } finally {
      this.mutex.release()
    }
  }

  size(): number {
    return this.queue.length
  }

  processingCount(): number {
    return this.processing.size
  }

  completedCount(): number {
    return this.completed.size
  }

  isEmpty(): boolean {
    return this.queue.length === 0 && this.processing.size === 0
  }

  isAllDone(): boolean {
    return this.queue.length === 0 && this.processing.size === 0
  }

  getStats() {
    return {
      queued: this.queue.length,
      processing: this.processing.size,
      completed: this.completed.size,
    }
  }

  // Factory methods for creating tasks
  static createListTask(page: number): Task {
    return {
      id: `list_${page}`,
      type: 'list_scan',
      priority: 1,
      page,
      retryCount: 0,
      createdAt: new Date().toISOString(),
    }
  }

  static createDetailTask(page: number, skillIndex: number, skillUrl: string): Task {
    return {
      id: `detail_${page}_${skillIndex}`,
      type: 'detail_fetch',
      priority: 0,
      page,
      skillIndex,
      skillUrl,
      retryCount: 0,
      createdAt: new Date().toISOString(),
    }
  }
}
