const CRAWL_SECRET =
  process.env.CRAWL_SECRET || '53d5f701e37041ba92a01a72400bd8a0b7e25dfc1474bad90a30359a26c980c5'
const BASE_URL = 'http://localhost:3000/api/crawl'

async function callAPI(action) {
  const url = `${BASE_URL}?action=${action}`
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${CRAWL_SECRET}`,
      'Content-Type': 'application/json',
    },
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`API call failed (${response.status}): ${errorText}`)
  }

  return await response.json()
}

async function checkStatus() {
  const response = await fetch(`${BASE_URL}?action=status`, {
    headers: {
      Authorization: `Bearer ${CRAWL_SECRET}`,
    },
  })

  if (!response.ok) {
    throw new Error(`Status check failed: ${response.status}`)
  }

  return await response.json()
}

async function waitForServer() {
  console.log('⏳ Waiting for server to be ready...')
  let retries = 30

  while (retries > 0) {
    try {
      await checkStatus()
      console.log('✅ Server is ready!')
      return
    } catch (error) {
      retries--
      await new Promise((resolve) => setTimeout(resolve, 2000))
    }
  }

  throw new Error('Server did not become ready in time')
}

async function runCrawl() {
  try {
    // Wait for server
    await waitForServer()

    // Step 1: Check initial status
    console.log('\n📊 Initial status:')
    const initialStatus = await checkStatus()
    console.log(`  Total: ${initialStatus.total}`)
    console.log(`  Pending: ${initialStatus.pending}`)
    console.log(`  Processing: ${initialStatus.processing}`)
    console.log(`  Completed: ${initialStatus.completed}`)
    console.log(`  Failed: ${initialStatus.failed}`)

    // Step 2: Crawl list
    console.log('\n📡 Step 1: Crawling skill list...')
    const listResult = await callAPI('list')
    console.log(
      `✅ List crawl complete: ${listResult.created} created, ${listResult.skipped} skipped`,
    )

    // Step 3: Check status after list crawl
    console.log('\n📊 Status after list crawl:')
    const statusAfterList = await checkStatus()
    console.log(`  Pending: ${statusAfterList.pending}`)
    console.log(`  Completed: ${statusAfterList.completed}`)

    // Step 4: Update all pending skills
    console.log('\n📡 Step 2: Updating pending skills...')

    let completedCount = 0
    let failedCount = 0
    let skillNumber = 0
    let consecutiveFailures = 0
    const maxConsecutiveFailures = 10

    while (true) {
      skillNumber++

      const status = await checkStatus()

      if (status.pending === 0) {
        console.log('\n✅ All pending skills processed!')
        break
      }

      console.log(
        `\n[${skillNumber}] Pending: ${status.pending}, Completed: ${status.completed}, Failed: ${status.failed}`,
      )

      const result = await callAPI('update')

      if (result.updated) {
        completedCount++
        consecutiveFailures = 0
        console.log(`  ✅ Success: ${result.skill} (${result.remaining} remaining)`)
      } else if (result.error) {
        failedCount++
        consecutiveFailures++
        console.log(`  ❌ Failed: ${result.error} (${result.remaining} remaining)`)
        console.log(`  📝 Error details: ${result.errorType || 'Unknown'}`)

        // If too many consecutive failures, stop
        if (consecutiveFailures >= maxConsecutiveFailures) {
          console.log(`\n⚠️  Stopping after ${maxConsecutiveFailures} consecutive failures`)
          console.log('   This may indicate a systematic issue that needs fixing')
          break
        }
      }
    }

    // Step 5: Final status
    console.log('\n📊 Final status:')
    const finalStatus = await checkStatus()
    console.log(`  Total: ${finalStatus.total}`)
    console.log(`  Completed: ${finalStatus.completed}`)
    console.log(`  Failed: ${finalStatus.failed}`)
    console.log(`  Processing: ${finalStatus.processing}`)

    // Step 6: Summary
    console.log('\n📈 Summary:')
    console.log(`  Total processed: ${completedCount + failedCount}`)
    console.log(`  Successful: ${completedCount}`)
    console.log(`  Failed: ${failedCount}`)

    if (finalStatus.failed > 0) {
      console.log('\n⚠️  Some skills failed. Please check the crawl_error field in the database.')
    } else {
      console.log('\n🎉 All tasks completed successfully!')
    }
  } catch (error) {
    console.error('\n❌ Fatal error:', error.message)
    process.exit(1)
  }
}

runCrawl()
