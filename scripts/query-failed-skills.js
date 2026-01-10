const CRAWL_SECRET =
  process.env.CRAWL_SECRET || '53d5f701e37041ba92a01a72400bd8a0b7e25dfc1474bad90a30359a26c980c5'
const BASE_URL = process.env.BASE_URL || 'http://localhost:3000/api/crawl'

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

async function queryFailedSkills() {
  console.log('🔍 Querying failed skills...\n')

  try {
    const result = await callAPI('failed')

    console.log(`Found ${result.total} failed skills\n`)
    console.log('='.repeat(80))

    for (const skill of result.skills) {
      console.log(`\n### ${skill.name}`)
      console.log(`- ID: ${skill.id}`)
      console.log(`- Slug: ${skill.slug}`)
      console.log(`- Path: ${skill.skillPath}`)
      console.log(`- Branch: ${skill.branch}`)
      console.log(`- GitHub: ${skill.githubUrl}`)
      console.log(`- Error Type: ${skill.errorType}`)
      console.log(`- Error:`)
      console.log(skill.error || 'No error message')
      console.log('-'.repeat(80))
    }

    console.log('\n\n## Error Pattern Summary\n')
    for (const [pattern, count] of Object.entries(result.errorPatterns).sort(
      (a, b) => b[1] - a[1],
    )) {
      console.log(`- ${pattern}: ${count}`)
    }

    console.log('\n\n## JSON Output\n')
    console.log(JSON.stringify(result, null, 2))
  } catch (error) {
    console.error('Failed to query failed skills:', error.message)
    process.exit(1)
  }
}

queryFailedSkills()
