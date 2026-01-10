#!/usr/bin/env tsx

/**
 * Smithery.ai 技能爬虫脚本
 * 
 * 功能：
 * - 抓取 smithery.ai 所有技能数据
 * - 支持断点续传
 * - 支持失败重试
 * - 输出 CSV 文件
 * 
 * 使用方法：
 * pnpm tsx scripts/crawl-smithery.ts
 * pnpm tsx scripts/crawl-smithery.ts --reset  # 重新开始
 */

import { chromium, Browser, Page } from 'playwright'
import * as fs from 'fs'
import * as path from 'path'
import { stringify } from 'csv-stringify/sync'

// ============================================================================
// 类型定义
// ============================================================================

interface SkillData {
  name: string
  description: string
  githubUrl: string
  stars: number
  forks: number
  author: string
  category: string
  tags: string
  smitheryUrl: string
  readme: string
  lastUpdated: string
}

interface CrawlProgress {
  currentPage: number
  currentIndex: number
  totalPages: number
  successCount: number
  failedCount: number
  startTime: string
  lastUpdateTime: string
}

interface FailedSkill {
  page: number
  index: number
  url: string
  error: string
  retryCount: number
  lastAttempt: string
}

// ============================================================================
// 配置常量
// ============================================================================

const PROGRESS_DIR = '.crawl-progress'
const OUTPUT_DIR = 'output'
const PROGRESS_FILE = path.join(PROGRESS_DIR, 'progress.json')
const SKILLS_DATA_FILE = path.join(PROGRESS_DIR, 'skills-data.json')
const FAILED_SKILLS_FILE = path.join(PROGRESS_DIR, 'failed-skills.json')
const OUTPUT_CSV = path.join(OUTPUT_DIR, 'smithery-skills.csv')

const BASE_URL = 'https://smithery.ai/skills'

// 延迟配置（毫秒）
const DELAY_MIN = 2000
const DELAY_MAX = 5000
const RETRY_MAX = 3

// 选择器配置（需要根据实际页面调整）
const SELECTORS = {
  // 列表页
  skillCards: 'body > div.flex.min-h-screen.flex-col > div.flex-1 > div > main > main > div.space-y-6 > div.grid.gap-6.sm\\:grid-cols-2.lg\\:grid-cols-3 > div',
  pagination: 'nav[aria-label="pagination"]',
  pageInfo: 'nav[aria-label="pagination"] span',
  
  // 详情页（需要验证）
  title: 'h1',
  description: 'p.text-muted-foreground',
  githubLink: 'a[href*="github.com"]',
  stats: 'div.flex.items-center.gap-4 span',
  category: 'span.badge',
  tags: 'div.flex.flex-wrap.gap-2 span',
  readme: 'div.prose',
  lastUpdated: 'time',
}

// ============================================================================
// 工具函数
// ============================================================================

function ensureDirectories() {
  if (!fs.existsSync(PROGRESS_DIR)) {
    fs.mkdirSync(PROGRESS_DIR, { recursive: true })
  }
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true })
  }
}

function randomDelay(min: number = DELAY_MIN, max: number = DELAY_MAX): Promise<void> {
  const delay = Math.random() * (max - min) + min
  return new Promise(resolve => setTimeout(resolve, delay))
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

function extractAuthorFromGithubUrl(githubUrl: string): string {
  const match = githubUrl.match(/github\.com\/([^\/]+)/)
  return match ? match[1] : ''
}

// ============================================================================
// 进度管理
// ============================================================================

function loadProgress(): CrawlProgress {
  if (fs.existsSync(PROGRESS_FILE)) {
    const data = JSON.parse(fs.readFileSync(PROGRESS_FILE, 'utf-8'))
    console.log(`📂 从第 ${data.currentPage} 页第 ${data.currentIndex} 个技能继续抓取`)
    return data
  }
  
  const initialProgress: CrawlProgress = {
    currentPage: 1,
    currentIndex: 0,
    totalPages: 999, // 第一次运行时会更新
    successCount: 0,
    failedCount: 0,
    startTime: new Date().toISOString(),
    lastUpdateTime: new Date().toISOString(),
  }
  
  return initialProgress
}

function saveProgress(progress: CrawlProgress) {
  progress.lastUpdateTime = new Date().toISOString()
  fs.writeFileSync(PROGRESS_FILE, JSON.stringify(progress, null, 2), 'utf-8')
}

function resetProgress() {
  if (fs.existsSync(PROGRESS_FILE)) fs.unlinkSync(PROGRESS_FILE)
  if (fs.existsSync(SKILLS_DATA_FILE)) fs.unlinkSync(SKILLS_DATA_FILE)
  if (fs.existsSync(FAILED_SKILLS_FILE)) fs.unlinkSync(FAILED_SKILLS_FILE)
  console.log('✨ 进度已重置')
}

// ============================================================================
// 技能数据管理
// ============================================================================

function loadSkillsData(): SkillData[] {
  if (fs.existsSync(SKILLS_DATA_FILE)) {
    return JSON.parse(fs.readFileSync(SKILLS_DATA_FILE, 'utf-8'))
  }
  return []
}

function saveSkillData(skill: SkillData) {
  const skills = loadSkillsData()
  skills.push(skill)
  fs.writeFileSync(SKILLS_DATA_FILE, JSON.stringify(skills, null, 2), 'utf-8')
}

// ============================================================================
// 失败记录管理
// ============================================================================

function loadFailedSkills(): FailedSkill[] {
  if (fs.existsSync(FAILED_SKILLS_FILE)) {
    return JSON.parse(fs.readFileSync(FAILED_SKILLS_FILE, 'utf-8'))
  }
  return []
}

function saveFailedSkills(failed: FailedSkill[]) {
  fs.writeFileSync(FAILED_SKILLS_FILE, JSON.stringify(failed, null, 2), 'utf-8')
}

function recordFailure(pageNum: number, index: number, url: string, error: string) {
  const failed = loadFailedSkills()
  const existing = failed.find(f => f.page === pageNum && f.index === index)
  
  if (existing) {
    existing.retryCount++
    existing.lastAttempt = new Date().toISOString()
    existing.error = error
  } else {
    failed.push({
      page: pageNum,
      index,
      url,
      error,
      retryCount: 0,
      lastAttempt: new Date().toISOString(),
    })
  }
  
  saveFailedSkills(failed)
}

function removeFromFailedList(pageNum: number, index: number) {
  const failed = loadFailedSkills()
  const filtered = failed.filter(f => !(f.page === pageNum && f.index === index))
  saveFailedSkills(filtered)
}

// ============================================================================
// 浏览器初始化
// ============================================================================

async function initBrowser(): Promise<Browser> {
  console.log('🚀 启动浏览器...')
  
  const browser = await chromium.launch({
    headless: false, // 使用有界面浏览器，更像真人
    args: [
      '--disable-blink-features=AutomationControlled',
      '--disable-dev-shm-usage',
      '--no-sandbox',
    ],
  })
  
  return browser
}

async function setupPage(browser: Browser): Promise<Page> {
  const page = await browser.newPage({
    viewport: { width: 1920, height: 1080 },
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  })
  
  // 隐藏 webdriver 特征
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'webdriver', { get: () => false })
  })
  
  return page
}

// ============================================================================
// 获取总页数
// ============================================================================

async function getTotalPages(page: Page): Promise<number> {
  try {
    // 等待分页元素加载
    await page.waitForSelector(SELECTORS.pagination, { timeout: 10000 })
    
    // 尝试获取分页信息文本（如 "1 of 50"）
    const pageInfoText = await page.textContent(SELECTORS.pageInfo)
    
    if (pageInfoText) {
      const match = pageInfoText.match(/of\s+(\d+)/)
      if (match) {
        return parseInt(match[1])
      }
    }
    
    // 如果上面的方法失败，尝试查找所有页码按钮
    const pageButtons = await page.$$('nav[aria-label="pagination"] button')
    let maxPage = 1
    
    for (const button of pageButtons) {
      const text = await button.textContent()
      if (text) {
        const num = parseInt(text.trim())
        if (!isNaN(num) && num > maxPage) {
          maxPage = num
        }
      }
    }
    
    return maxPage > 1 ? maxPage : 50 // 默认假设50页
  } catch (error) {
    console.warn('⚠️  无法获取总页数，使用默认值 50')
    return 50
  }
}

// ============================================================================
// 数据提取
// ============================================================================

async function extractSkillData(page: Page): Promise<SkillData> {
  // 等待页面加载完成
  await page.waitForLoadState('networkidle', { timeout: 15000 })
  
  // 名称
  const name = await page.locator(SELECTORS.title).first().textContent() || ''
  
  // 描述
  const description = await page.locator(SELECTORS.description).first().textContent() || ''
  
  // GitHub URL
  let githubUrl = ''
  try {
    const githubLink = await page.locator(SELECTORS.githubLink).first()
    githubUrl = await githubLink.getAttribute('href') || ''
  } catch (error) {
    console.warn('⚠️  未找到 GitHub 链接')
  }
  
  // 提取 Stars 和 Forks（从页面统计区域）
  let stars = 0
  let forks = 0
  try {
    const statsElements = await page.locator(SELECTORS.stats).all()
    for (const stat of statsElements) {
      const text = await stat.textContent() || ''
      if (text.includes('stars') || text.includes('★')) {
        const match = text.match(/(\d+)/)
        if (match) stars = parseInt(match[1])
      }
      if (text.includes('forks') || text.includes('fork')) {
        const match = text.match(/(\d+)/)
        if (match) forks = parseInt(match[1])
      }
    }
  } catch (error) {
    console.warn('⚠️  未找到统计数据')
  }
  
  // 作者
  const author = githubUrl ? extractAuthorFromGithubUrl(githubUrl) : ''
  
  // 分类
  let category = ''
  try {
    const categoryElement = await page.locator(SELECTORS.category).first()
    category = await categoryElement.textContent() || ''
  } catch (error) {
    console.warn('⚠️  未找到分类')
  }
  
  // 标签
  let tags: string[] = []
  try {
    const tagElements = await page.locator(SELECTORS.tags).all()
    for (const tag of tagElements) {
      const text = await tag.textContent()
      if (text) tags.push(text.trim())
    }
  } catch (error) {
    console.warn('⚠️  未找到标签')
  }
  
  // README
  let readme = ''
  try {
    const readmeElement = await page.locator(SELECTORS.readme).first()
    readme = await readmeElement.innerHTML() || ''
  } catch (error) {
    // README 可能不存在
  }
  
  // 最后更新时间
  let lastUpdated = ''
  try {
    const timeElement = await page.locator(SELECTORS.lastUpdated).first()
    lastUpdated = await timeElement.getAttribute('datetime') || await timeElement.textContent() || ''
  } catch (error) {
    lastUpdated = new Date().toISOString()
  }
  
  // Smithery URL
  const smitheryUrl = page.url()
  
  return {
    name: name.trim(),
    description: description.trim(),
    githubUrl,
    stars,
    forks,
    author,
    category: category.trim(),
    tags: tags.join(', '),
    smitheryUrl,
    readme: readme.substring(0, 1000), // 限制长度
    lastUpdated,
  }
}

// ============================================================================
// 页面抓取
// ============================================================================

async function crawlPage(browser: Browser, pageNum: number, progress: CrawlProgress): Promise<void> {
  const page = await setupPage(browser)
  
  try {
    console.log(`\n📄 正在抓取第 ${pageNum}/${progress.totalPages} 页...`)
    
    // 导航到列表页
    const listUrl = `${BASE_URL}?page=${pageNum}`
    await page.goto(listUrl, { waitUntil: 'networkidle', timeout: 30000 })
    
    // 等待技能卡片加载
    await page.waitForSelector(SELECTORS.skillCards, { timeout: 15000 })
    
    // 获取当前页所有技能卡片
    const skillCards = await page.locator(SELECTORS.skillCards).all()
    const totalSkills = skillCards.length
    
    console.log(`   找到 ${totalSkills} 个技能`)
    
    // 从上次中断的位置继续
    const startIndex = (pageNum === progress.currentPage) ? progress.currentIndex : 0
    
    for (let i = startIndex; i < totalSkills; i++) {
      try {
        console.log(`   [${i + 1}/${totalSkills}] 抓取技能...`)
        
        // 重新获取卡片（防止 stale element）
        const cards = await page.locator(SELECTORS.skillCards).all()
        if (i >= cards.length) {
          console.warn(`   ⚠️  索引 ${i} 超出范围，跳过`)
          continue
        }
        
        // 点击进入详情页
        await cards[i].click()
        await randomDelay(1000, 2000)
        
        // 提取数据
        const skillData = await extractSkillData(page)
        
        console.log(`   ✓ ${skillData.name}`)
        
        // 保存数据
        saveSkillData(skillData)
        
        // 返回列表页
        await page.goBack()
        await page.waitForSelector(SELECTORS.skillCards, { timeout: 10000 })
        
        // 更新进度
        progress.currentIndex = i + 1
        progress.successCount++
        saveProgress(progress)
        
        // 延迟（防止被封）
        await randomDelay()
        
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error)
        console.error(`   ✗ 抓取失败: ${errorMsg}`)
        
        // 记录失败
        recordFailure(pageNum, i, listUrl, errorMsg)
        progress.failedCount++
        saveProgress(progress)
        
        // 尝试返回列表页
        try {
          await page.goto(listUrl, { waitUntil: 'networkidle', timeout: 30000 })
          await page.waitForSelector(SELECTORS.skillCards, { timeout: 10000 })
        } catch (navError) {
          console.error('   ✗ 无法返回列表页，重新加载...')
          throw navError
        }
      }
    }
    
    // 完成当前页
    progress.currentPage = pageNum + 1
    progress.currentIndex = 0
    saveProgress(progress)
    
  } finally {
    await page.close()
  }
}

// ============================================================================
// 重试失败的技能
// ============================================================================

async function retryFailed(browser: Browser): Promise<void> {
  const failed = loadFailedSkills()
  
  if (failed.length === 0) {
    console.log('\n✨ 没有需要重试的技能')
    return
  }
  
  console.log(`\n🔄 重试 ${failed.length} 个失败的技能...`)
  
  for (const item of failed) {
    if (item.retryCount >= RETRY_MAX) {
      console.log(`   ⏭️  放弃重试: 第 ${item.page} 页第 ${item.index} 个技能（已重试 ${item.retryCount} 次）`)
      continue
    }
    
    const page = await setupPage(browser)
    
    try {
      // 指数退避
      const backoffTime = Math.pow(2, item.retryCount) * 1000
      console.log(`   ⏳ 等待 ${backoffTime / 1000} 秒后重试...`)
      await sleep(backoffTime)
      
      console.log(`   🔄 重试第 ${item.page} 页第 ${item.index} 个技能...`)
      
      // 导航到列表页
      await page.goto(`${BASE_URL}?page=${item.page}`, { waitUntil: 'networkidle', timeout: 30000 })
      await page.waitForSelector(SELECTORS.skillCards, { timeout: 15000 })
      
      // 点击进入详情
      const cards = await page.locator(SELECTORS.skillCards).all()
      if (item.index < cards.length) {
        await cards[item.index].click()
        await randomDelay(1000, 2000)
        
        // 提取数据
        const skillData = await extractSkillData(page)
        saveSkillData(skillData)
        
        console.log(`   ✓ 重试成功: ${skillData.name}`)
        
        // 从失败列表移除
        removeFromFailedList(item.page, item.index)
      } else {
        console.warn(`   ⚠️  索引超出范围，跳过`)
      }
      
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error)
      console.error(`   ✗ 重试失败: ${errorMsg}`)
      
      // 更新重试次数
      item.retryCount++
      item.lastAttempt = new Date().toISOString()
      saveFailedSkills(failed)
      
    } finally {
      await page.close()
    }
    
    await randomDelay()
  }
}

// ============================================================================
// CSV 导出
// ============================================================================

async function exportToCSV(): Promise<void> {
  console.log('\n📊 导出 CSV...')
  
  const skills = loadSkillsData()
  
  if (skills.length === 0) {
    console.log('⚠️  没有数据可导出')
    return
  }
  
  const csv = stringify(skills, {
    header: true,
    columns: [
      { key: 'name', header: '名称' },
      { key: 'description', header: '描述' },
      { key: 'githubUrl', header: 'GitHub地址' },
      { key: 'stars', header: 'Stars' },
      { key: 'forks', header: 'Forks' },
      { key: 'author', header: '作者' },
      { key: 'category', header: '分类' },
      { key: 'tags', header: '标签' },
      { key: 'smitheryUrl', header: 'Smithery链接' },
      { key: 'readme', header: 'README' },
      { key: 'lastUpdated', header: '最后更新' },
    ],
    quoted: true,
  })
  
  fs.writeFileSync(OUTPUT_CSV, csv, 'utf-8')
  
  console.log(`✅ 导出完成: ${OUTPUT_CSV}`)
  console.log(`   共 ${skills.length} 个技能`)
}

// ============================================================================
// 主函数
// ============================================================================

async function main() {
  console.log('🕷️  Smithery.ai 技能爬虫')
  console.log('=' .repeat(60))
  
  // 检查是否需要重置
  const args = process.argv.slice(2)
  if (args.includes('--reset')) {
    resetProgress()
  }
  
  // 确保目录存在
  ensureDirectories()
  
  // 加载进度
  const progress = loadProgress()
  
  // 启动浏览器
  const browser = await initBrowser()
  
  try {
    // 如果是第一次运行，获取总页数
    if (progress.totalPages === 999) {
      console.log('🔍 获取总页数...')
      const page = await setupPage(browser)
      await page.goto(BASE_URL, { waitUntil: 'networkidle', timeout: 30000 })
      progress.totalPages = await getTotalPages(page)
      await page.close()
      console.log(`   总共 ${progress.totalPages} 页`)
      saveProgress(progress)
    }
    
    // 开始抓取
    console.log(`\n🚀 开始抓取（从第 ${progress.currentPage} 页开始）`)
    
    for (let pageNum = progress.currentPage; pageNum <= progress.totalPages; pageNum++) {
      await crawlPage(browser, pageNum, progress)
      
      // 显示进度
      console.log(`\n📈 进度: ${progress.successCount} 成功 | ${progress.failedCount} 失败`)
    }
    
    console.log('\n✅ 所有页面抓取完成')
    
    // 重试失败的技能
    await retryFailed(browser)
    
    // 导出 CSV
    await exportToCSV()
    
    // 显示最终统计
    const finalFailed = loadFailedSkills()
    console.log('\n' + '='.repeat(60))
    console.log('📊 最终统计')
    console.log(`   ✓ 成功: ${progress.successCount}`)
    console.log(`   ✗ 失败: ${finalFailed.length}`)
    console.log(`   ⏱️  耗时: ${new Date().getTime() - new Date(progress.startTime).getTime()} 毫秒`)
    
    if (finalFailed.length > 0) {
      console.log('\n⚠️  以下技能抓取失败（已达最大重试次数）:')
      finalFailed.forEach(f => {
        console.log(`   - 第 ${f.page} 页第 ${f.index} 个: ${f.error}`)
      })
    }
    
  } catch (error) {
    console.error('\n❌ 抓取过程中出现严重错误:', error)
    throw error
  } finally {
    await browser.close()
    console.log('\n👋 浏览器已关闭')
  }
}

// 运行主函数
main().catch(error => {
  console.error('❌ 程序异常退出:', error)
  process.exit(1)
})
