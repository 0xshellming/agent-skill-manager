import { crawlSkillList, updateNextPendingSkill, getCrawlStatus } from '../src/lib/skill-crawler.js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

async function runCrawl() {
  console.log('🚀 Starting crawl process...')
  console.log('')

  // Step 1: Crawl list
  console.log('📡 Step 1: Crawling skill list...')
  const listResult = await crawlSkillList()
  console.log(
    `✅ List crawl complete: ${listResult.created} created, ${listResult.skipped} skipped`,
  )
  console.log('')

  // Step 2: Get initial status
  console.log('📊 Initial status:')
  const initialStatus = await getCrawlStatus()
  console.log(`  Pending: ${initialStatus.pending}`)
  console.log(`  Completed: ${initialStatus.completed}`)
  console.log(`  Failed: ${initialStatus.failed}`)
  console.log('')

  // Step 3: Update all pending skills
  console.log('📡 Step 2: Updating pending skills...')

  let completedCount = 0
  let failedCount = 0
  let skillNumber = 0

  while (true) {
    skillNumber++
    const status = await getCrawlStatus()

    if (status.pending === 0) {
      console.log('')
      console.log('✅ All pending skills processed!')
      break
    }

    console.log(
      `\n[${skillNumber}/${status.pending + completedCount + failedCount}] Processing next skill...`,
    )

    const result = await updateNextPendingSkill()

    if (result.updated) {
      completedCount++
      console.log(`✅ Success: ${result.skill} (${result.remaining} remaining)`)
    } else if (result.error) {
      failedCount++
      console.log(`❌ Failed: ${result.error} (${result.remaining} remaining)`)
    }
  }

  // Step 4: Final status
  console.log('')
  console.log('📊 Final status:')
  const finalStatus = await getCrawlStatus()
  console.log(`  Total: ${finalStatus.total}`)
  console.log(`  Completed: ${finalStatus.completed}`)
  console.log(`  Failed: ${finalStatus.failed}`)
  console.log(`  Processing: ${finalStatus.processing}`)
  console.log('')

  // Step 5: Summary
  console.log('📈 Summary:')
  console.log(`  Total processed: ${completedCount + failedCount}`)
  console.log(`  Successful: ${completedCount}`)
  console.log(`  Failed: ${failedCount}`)
  console.log('')

  if (finalStatus.failed > 0) {
    console.log('⚠️  Some skills failed. Check the database for details.')
  } else {
    console.log('🎉 All tasks completed successfully!')
  }
}

runCrawl().catch(console.error)
