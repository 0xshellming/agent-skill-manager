import { NextResponse } from 'next/server'
import { crawlSkillList, updateNextPendingSkill, getCrawlStatus } from '@/lib/skill-crawler'

export async function POST(request: Request) {
  const authHeader = request.headers.get('authorization')
  const expectedToken = process.env.CRAWL_SECRET

  if (expectedToken && authHeader !== `Bearer ${expectedToken}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const url = new URL(request.url)
  const action = url.searchParams.get('action') || 'status'

  try {
    switch (action) {
      case 'list': {
        console.log('📡 Crawling skill list from GitHub...')
        const result = await crawlSkillList()
        return NextResponse.json({
          success: true,
          action: 'list',
          ...result,
          timestamp: new Date().toISOString(),
        })
      }

      case 'update': {
        console.log('📡 Updating next pending skill...')
        const result = await updateNextPendingSkill()
        return NextResponse.json({
          success: true,
          action: 'update',
          ...result,
          timestamp: new Date().toISOString(),
        })
      }

      case 'status':
      default: {
        const status = await getCrawlStatus()
        return NextResponse.json({
          success: true,
          action: 'status',
          ...status,
          timestamp: new Date().toISOString(),
        })
      }
    }
  } catch (error) {
    console.error('Crawl failed:', error)
    return NextResponse.json({ error: 'Crawl failed', details: String(error) }, { status: 500 })
  }
}

export async function GET() {
  try {
    const status = await getCrawlStatus()
    return NextResponse.json({ status: 'ok', ...status })
  } catch (error) {
    return NextResponse.json({ status: 'error', error: String(error) })
  }
}
