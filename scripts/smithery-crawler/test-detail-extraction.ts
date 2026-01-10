/**
 * 测试详情页数据提取
 */

import { chromium } from 'playwright'

async function main() {
  console.log('🔍 Testing detail page data extraction...\n')
  
  const browser = await chromium.launch({ headless: true })
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
  })
  
  const page = await context.newPage()
  
  // 测试一个已知的详情页
  const testUrl = 'https://smithery.ai/skills/anthropics/frontend-design'
  
  console.log(`📄 Fetching: ${testUrl}`)
  await page.goto(testUrl, { waitUntil: 'networkidle', timeout: 30000 })
  
  // 等待页面加载
  await page.waitForSelector('h1', { timeout: 10000 })
  
  // 提取数据
  const skillData = await page.evaluate(() => {
    // 名称 - h1 在容器内
    const nameEl = document.querySelector('div.space-y-6 h1')
    const name = nameEl?.textContent?.trim() || ''
    
    // 描述
    const descEl = document.querySelector('div.space-y-6 > div > p.text-lg')
    const description = descEl?.textContent?.trim() || ''
    
    // GitHub URL
    const sourceContainer = document.querySelector('div.rounded-lg.border.border-border.bg-muted\\/50.p-4')
    const sourceLink = sourceContainer?.querySelector('a[href*="github.com"]')
    const githubUrl = sourceLink?.getAttribute('href') || ''
    
    // Stars 和 Forks
    const statsContainer = document.querySelector('div.flex.items-center.gap-6.text-sm')
    let stars = 0, forks = 0
    if (statsContainer) {
      const statsItems = statsContainer.querySelectorAll('div.flex.items-center.gap-1')
      statsItems.forEach(item => {
        const text = item.textContent || ''
        if (text.includes('stars')) {
          stars = parseInt(text.replace(/\D/g, '')) || 0
        } else if (text.includes('forks')) {
          forks = parseInt(text.replace(/\D/g, '')) || 0
        }
      })
    }
    
    // 30天活跃数据
    const activityContainer = document.querySelector('div.flex.items-center.gap-6.border-b')
    let activations30d = 0, users30d = 0
    if (activityContainer) {
      const items = activityContainer.querySelectorAll('div.flex.items-center.gap-1')
      items.forEach((item, index) => {
        const span = item.querySelector('span')
        if (span) {
          const value = parseInt(span.textContent || '0')
          if (index === 0) activations30d = value
          if (index === 1) users30d = value
        }
      })
    }
    
    // 从 URL 获取 namespace 和 slug
    const pathParts = window.location.pathname.split('/').filter(Boolean)
    const namespace = pathParts[1] || ''
    const slug = pathParts[2] || ''
    
    return {
      namespace,
      slug,
      name,
      description,
      githubUrl,
      stars,
      forks,
      activations30d,
      users30d,
      sourceUrl: window.location.href
    }
  })
  
  console.log('\n📊 Extracted Data:')
  console.log(JSON.stringify(skillData, null, 2))
  
  // 验证数据
  console.log('\n🔍 Validation:')
  const checks = [
    { field: 'name', value: skillData.name, expected: 'non-empty' },
    { field: 'namespace', value: skillData.namespace, expected: 'anthropics' },
    { field: 'slug', value: skillData.slug, expected: 'frontend-design' },
    { field: 'description', value: skillData.description.length > 0, expected: true },
    { field: 'githubUrl', value: skillData.githubUrl.includes('github.com'), expected: true },
    { field: 'stars', value: skillData.stars > 0, expected: true },
    { field: 'forks', value: skillData.forks > 0, expected: true },
  ]
  
  for (const check of checks) {
    const passed = check.expected === true 
      ? check.value === true 
      : check.expected === 'non-empty' 
        ? check.value && check.value.length > 0
        : check.value === check.expected
    console.log(`  ${passed ? '✅' : '❌'} ${check.field}: ${JSON.stringify(check.value).substring(0, 50)}`)
  }
  
  await context.close()
  await browser.close()
  
  console.log('\n✅ Test completed!')
}

main().catch(console.error)
