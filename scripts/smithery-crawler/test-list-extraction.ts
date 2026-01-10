/**
 * 测试列表页数据提取和导航
 */

import { chromium } from 'playwright'

async function main() {
  console.log('🔍 Testing list page data extraction and navigation...\n')
  
  const browser = await chromium.launch({ headless: true })
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
  })
  
  const page = await context.newPage()
  
  // 访问列表页
  console.log('📋 Fetching list page...')
  await page.goto('https://smithery.ai/skills?page=1', { waitUntil: 'networkidle', timeout: 30000 })
  await page.waitForSelector('div.grid.gap-6 > div', { timeout: 10000 })
  
  // 提取卡片信息
  const cardsData = await page.evaluate(() => {
    const cards = document.querySelectorAll('div.grid.gap-6.sm\\:grid-cols-2.lg\\:grid-cols-3 > div')
    const results: any[] = []
    
    cards.forEach((card, index) => {
      // 卡片内通常有一个可点击的区域
      const link = card.querySelector('a') || card
      const href = link.getAttribute('href') || ''
      
      // 提取基本信息
      const name = card.querySelector('h3, h4, [class*="font-semibold"], [class*="font-bold"]')?.textContent?.trim()
      const description = card.querySelector('p')?.textContent?.trim()
      
      results.push({
        index,
        href,
        name: name?.substring(0, 50),
        hasClickableArea: !!link
      })
    })
    
    return results
  })
  
  console.log(`\n📊 Found ${cardsData.length} cards:`)
  cardsData.slice(0, 5).forEach((card, i) => {
    console.log(`  ${i + 1}. ${card.name || 'N/A'} -> ${card.href || 'no link'}`)
  })
  
  if (cardsData.length > 5) {
    console.log(`  ... and ${cardsData.length - 5} more`)
  }
  
  // 测试点击卡片导航到详情页
  console.log('\n🖱️ Testing card click navigation...')
  
  // 找到可点击的卡片
  const firstClickableCard = await page.$('div.grid.gap-6.sm\\:grid-cols-2.lg\\:grid-cols-3 > div')
  if (firstClickableCard) {
    await firstClickableCard.click()
    await page.waitForLoadState('networkidle')
    
    const newUrl = page.url()
    console.log(`  Navigated to: ${newUrl}`)
    
    // 验证是否到达详情页
    const isDetailPage = newUrl.includes('/skills/') && newUrl.split('/').filter(Boolean).length >= 3
    console.log(`  Is detail page: ${isDetailPage ? '✅ Yes' : '❌ No'}`)
    
    // 测试返回列表页
    console.log('\n🔙 Testing back navigation...')
    await page.goBack()
    await page.waitForLoadState('networkidle')
    
    const backUrl = page.url()
    console.log(`  Back to: ${backUrl}`)
    const isBackToList = backUrl.includes('/skills?page=')
    console.log(`  Is list page: ${isBackToList ? '✅ Yes' : '❌ No'}`)
  }
  
  // 测试分页
  console.log('\n📄 Testing pagination...')
  await page.goto('https://smithery.ai/skills?page=2', { waitUntil: 'networkidle', timeout: 30000 })
  await page.waitForSelector('div.grid.gap-6 > div', { timeout: 10000 })
  
  const page2Cards = await page.$$('div.grid.gap-6.sm\\:grid-cols-2.lg\\:grid-cols-3 > div')
  console.log(`  Page 2 cards: ${page2Cards.length}`)
  
  // 获取总页数（从响应数据）
  const paginationInfo = await page.evaluate(() => {
    // 尝试从 __NEXT_DATA__ 获取
    const nextData = document.getElementById('__NEXT_DATA__')
    if (nextData) {
      try {
        const data = JSON.parse(nextData.textContent || '{}')
        // 遍历查找 pagination 信息
        const findPagination = (obj: any): any => {
          if (!obj || typeof obj !== 'object') return null
          if (obj.pagination) return obj.pagination
          for (const key of Object.keys(obj)) {
            const result = findPagination(obj[key])
            if (result) return result
          }
          return null
        }
        return findPagination(data)
      } catch (e) {
        return null
      }
    }
    return null
  })
  
  console.log(`  Pagination info: ${JSON.stringify(paginationInfo)}`)
  
  await context.close()
  await browser.close()
  
  console.log('\n✅ List page test completed!')
}

main().catch(console.error)
