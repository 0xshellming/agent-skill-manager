/**
 * Utility functions
 */

export function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

export function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`
  if (ms < 3600000) return `${(ms / 60000).toFixed(1)}m`
  return `${(ms / 3600000).toFixed(1)}h`
}

export function formatNumber(num: number): string {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
  return num.toString()
}

export function generateTaskId(type: string, ...parts: (string | number)[]): string {
  return `${type}_${parts.join('_')}_${Date.now()}`
}

export function debounce<T extends (...args: any[]) => void>(
  fn: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null
  
  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout)
    timeout = setTimeout(() => fn(...args), wait)
  }
}

export function parseSkillUrlParts(url: string): { namespace: string; slug: string } | null {
  const match = url.match(/\/skills\/([^/]+)\/([^/]+)/)
  if (!match) return null
  return { namespace: match[1], slug: match[2] }
}

export function sanitizeString(str: string): string {
  return str
    .replace(/[\x00-\x1F\x7F]/g, '') // Remove control characters
    .replace(/\\/g, '\\\\')          // Escape backslashes
    .trim()
}

export function createProgressBar(current: number, total: number, width: number = 30): string {
  const percentage = Math.min(current / total, 1)
  const filled = Math.round(width * percentage)
  const empty = width - filled
  const bar = '█'.repeat(filled) + '░'.repeat(empty)
  return `[${bar}] ${(percentage * 100).toFixed(1)}%`
}

export class SimpleLogger {
  private prefix: string
  
  constructor(prefix: string) {
    this.prefix = prefix
  }
  
  private timestamp(): string {
    return new Date().toISOString().replace('T', ' ').substring(0, 19)
  }
  
  info(message: string, ...args: any[]) {
    console.log(`[${this.timestamp()}] [${this.prefix}] ${message}`, ...args)
  }
  
  warn(message: string, ...args: any[]) {
    console.warn(`[${this.timestamp()}] [${this.prefix}] ⚠️ ${message}`, ...args)
  }
  
  error(message: string, ...args: any[]) {
    console.error(`[${this.timestamp()}] [${this.prefix}] ❌ ${message}`, ...args)
  }
  
  success(message: string, ...args: any[]) {
    console.log(`[${this.timestamp()}] [${this.prefix}] ✅ ${message}`, ...args)
  }
  
  debug(message: string, ...args: any[]) {
    if (process.env.DEBUG) {
      console.log(`[${this.timestamp()}] [${this.prefix}] 🔍 ${message}`, ...args)
    }
  }
}
