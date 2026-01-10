const CRAWL_SECRET =
  process.env.CRAWL_SECRET || '53d5f701e37041ba92a01a72400bd8a0b7e25dfc1474bad90a30359a26c980c5'
const BASE_URL = process.env.BASE_URL || 'http://localhost:3000'

async function retrySkill(skillId) {
  const url = `${BASE_URL}/api/skills/${skillId}/fetch`
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

async function retryFailedSkills() {
  const failedIds = [29, 41, 49]

  console.log('🔄 Retrying failed skills...\n')

  for (const id of failedIds) {
    console.log(`\n📡 Retrying skill ID: ${id}`)
    try {
      const result = await retrySkill(id)
      if (result.success) {
        console.log(`  ✅ Success: ${result.skill}`)
      } else {
        console.log(`  ❌ Failed: ${result.error}`)
        if (result.details) {
          console.log(`  📋 Details:`, JSON.stringify(result.details, null, 2))
        }
      }
    } catch (error) {
      console.log(`  ❌ Error: ${error.message}`)
    }
  }
}

retryFailedSkills()
