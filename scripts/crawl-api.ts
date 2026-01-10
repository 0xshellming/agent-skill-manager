interface ApiResponse {
  success: boolean
  action?: string
  status?: string
  skill?: string
  name?: string
  error?: string
  [key: string]: any
}

async function run() {
  const baseUrl = 'http://localhost:3000/api/crawl'

  console.log('📡 Triggering list crawl...')
  try {
    const listRes = await fetch(`${baseUrl}?action=list`, { method: 'POST' })

    if (listRes.status === 401) {
      console.error('❌ Unauthorized: CRAWL_SECRET is required but not provided.')
      process.exit(1)
    }

    if (!listRes.ok) {
      const text = await listRes.text()
      console.error(`❌ List crawl failed with status ${listRes.status}: ${text}`)
      process.exit(1)
    }

    const listData = (await listRes.json()) as ApiResponse
    console.log('List Result:', JSON.stringify(listData, null, 2))

    if (!listData.success) {
      console.error('List crawl failed logic')
      return
    }

    console.log('📡 Starting skill details crawl loop...')
    let noPending = false

    while (!noPending) {
      const updateRes = await fetch(`${baseUrl}?action=update`, { method: 'POST' })
      const updateData = (await updateRes.json()) as ApiResponse

      if (!updateData.success) {
        console.error('Update failed:', updateData)
      }

      if (updateData.status === 'no_pending_skills') {
        console.log('✅ All skills processed.')
        noPending = true
      } else if (updateData.status === 'success') {
        console.log(`✅ Processed: ${updateData.skill} (${updateData.name})`)
      } else if (updateData.status === 'failed') {
        console.log(`❌ Failed: ${updateData.skill} - ${updateData.error}`)
      } else {
        console.log('Unknown status:', updateData)
      }

      await new Promise((r) => setTimeout(r, 500))
    }
  } catch (error) {
    console.error('Script error:', error)
  }
}

run()
