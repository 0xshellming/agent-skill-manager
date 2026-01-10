#!/usr/bin/env npx tsx

import { Orchestrator } from './orchestrator'
import { DEFAULT_CONFIG } from './types'

function printUsage(): void {
  console.log(`
🔍 Smithery.ai Skills Crawler

Usage: npx tsx scripts/smithery-crawler/index.ts [options]

Options:
  --resume        Resume from saved state (skip completed pages)
  --retry-failed  Retry only previously failed tasks
  --reset         Clear all state and start fresh
  --headed        Run browser in headed mode (visible, for debugging)
  --help          Show this help message

Examples:
  npm run crawl:smithery                    # Start fresh crawl
  npm run crawl:smithery -- --resume        # Resume interrupted crawl
  npm run crawl:smithery -- --retry-failed  # Retry failed tasks only
  npm run crawl:smithery -- --headed        # Debug mode with visible browser
`)
}

async function main(): Promise<void> {
  const args = process.argv.slice(2)

  if (args.includes('--help') || args.includes('-h')) {
    printUsage()
    process.exit(0)
  }

  const options = {
    resume: args.includes('--resume'),
    retryFailed: args.includes('--retry-failed'),
    reset: args.includes('--reset'),
  }

  const headless = !args.includes('--headed')

  console.log('\n🔍 Smithery.ai Skills Crawler')
  console.log('='.repeat(50))
  console.log(
    `Mode: ${options.reset ? 'RESET' : options.retryFailed ? 'RETRY FAILED' : options.resume ? 'RESUME' : 'FRESH START'}`,
  )
  console.log(`Browser: ${headless ? 'headless' : 'headed'}`)
  console.log(`Concurrency: ${DEFAULT_CONFIG.concurrency} workers`)
  console.log('='.repeat(50) + '\n')

  const orchestrator = new Orchestrator({
    ...DEFAULT_CONFIG,
    headless,
  })

  await orchestrator.start(options)
}

main().catch((error) => {
  console.error('\n❌ Fatal error:', error.message)
  process.exit(1)
})
