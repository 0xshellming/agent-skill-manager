/**
 * 测试列表页导航 - 分析 HTML 结构
 */

import { chromium } from 'playwright'

async function main() {
  console.log('🔍 Analyzing list page HTML structure...\n')
  
  const browser = await chromium.launch({ headless: true })
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
  })
  
  const page = await context.newPage()
  
  // 访问列表页
  await page.goto('https://smithery.ai/skills?page=1', { waitUntil: 'networkidle', timeout: 30000 })
  await page.waitForSelector('div.grid.gap-6 > div', { timeout: 10000 })
  
  // 获取第一个卡片的 HTML 结构
  const cardHtml = await page.evaluate(() => {
    const card = document.querySelector('div.grid.gap-6.sm\\:grid-cols-2.lg\\:grid-cols-3 > div')
    return card?.outerHTML?.substring(0, 2000) || 'Not found'
  })
  
  console.log('📋 First card HTML structure:')
  console.log(cardHtml.substring(0, 1000))
  console.log('...')
  
  // 检查是否有可点击元素
  const clickableElements = await page.evaluate(() => {
    const card = document.querySelector('div.grid.gap-6.sm\\:grid-cols-2.lg\\:grid-cols-3 > div')
    if (!card) return []
    
    const elements: any[] = []
    
    // 检查所有可能的点击目标
    const allElements = card.querySelectorAll('*')
    allElements.forEach(el => {
      const tag = el.tagName.toLowerCase()
      const role = el.getAttribute('role')
      const onClick = el.getAttribute('onclick')
      const cursor = window.getComputedStyle(el).cursor
      
      if (tag === 'a' || tag === 'button' || role === 'button' || onClick || cursor === 'pointer') {
        elements.push({
          tag,
          role,
          href: (el as HTMLAnchorElement).href || null,
          cursor,
          className: el.className?.substring(0, 50)
        })
      }
    })
    
    return elements
  })
  
  console.log('\n🖱️ Clickable elements in card:')
  clickableElements.forEach((el, i) => {
    console.log(`  ${i + 1}. ${el.tag} (cursor: ${el.cursor}) - href: ${el.href}`)
  })
  
  // 检查整个卡片是否可点击（通过 cursor 样式）
  const cardStyle = await page.evaluate(() => {
    const card = document.querySelector('div.grid.gap-6.sm\\:grid-cols-2.lg\\:grid-cols-3 > div')
    if (!card) return null
    
    const style = window.getComputedStyle(card)
    return {
      cursor: style.cursor,
      hasOnClick: !!card.getAttribute('onclick'),
      role: card.getAttribute('role')
    }
  })
  
  console.log('\n📦 Card container style:')
  console.log(JSON.stringify(cardStyle, null, 2))
  
  // 尝试直接通过 URL 构造详情页链接
  const skillUrls = await page.evaluate(() => {
    const cards = document.querySelectorAll('div.grid.gap-6.sm\\:grid-cols-2.lg\\:grid-cols-3 > div')
    const urls: string[] = []
    
    cards.forEach(card => {
      // 尝试从卡片内容提取 namespace/slug
      const text = card.textContent || ''
      
      // 查找所有链接
      const links = card.querySelectorAll('a')
      links.forEach(link => {
        if (link.href && link.href.includes('/skills/')) {
          urls.push(link.href)
        }
      })
      
      // 如果卡片本身有 data 属性
      const dataSlug = card.getAttribute('data-slug')
      const dataNamespace = card.getAttribute('data-namespace')
      if (dataSlug && dataNamespace) {
        urls.push(`/skills/${dataNamespace}/${dataSlug}`)
      }
    })
    
    return urls
  })
  
  console.log('\n🔗 Found skill URLs in cards:')
  skillUrls.slice(0, 5).forEach(url => console.log(`  ${url}`))
  
  // 检查 React 事件绑定
  console.log('\n🔬 Testing click via JavaScript...')
  
  // 尝试点击并监听 URL 变化
  await page.evaluate(() => {
    const card = document.querySelector('div.grid.gap-6.sm\\:grid-cols-2.lg\\:grid-cols-3 > div')
    if (card) {
      // 触发点击事件
      card.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    }
  })
  
  await page.waitForTimeout(1000)
  console.log(`  URL after click: ${page.url()}`)
  
  // 尝试使用 page.click 直接点击整个卡片区域
  await page.goto('https://smithery.ai/skills?page=1', { waitUntil: 'networkidle' })
  await page.waitForSelector('div.grid.gap-6 > div', { timeout: 10000 })
  
  console.log('\n🖱️ Trying page.click on card...')
  try {
    await page.click('div.grid.gap-6.sm\\:grid-cols-2.lg\\:grid-cols-3 > div >> nth=0', { timeout: 5000 })
    await page.waitForTimeout(2000)
    console.log(`  URL after page.click: ${page.url()}`)
  } catch (e: any) {
    console.log(`  Error: ${e.message}`)
  }
  
  await context.close()
  await browser.close()
  
  console.log('\n✅ Analysis completed!')
}

main().catch(console.error)
