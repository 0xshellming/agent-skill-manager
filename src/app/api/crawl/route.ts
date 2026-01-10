import { NextResponse } from 'next/server'
import {
  crawlSkillList,
  updateNextPendingSkill,
  getCrawlStatus,
  getFailedSkills,
} from '@/lib/skill-crawler'

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

      case 'failed': {
        console.log('📡 Querying failed skills...')
        const result = await getFailedSkills()
        return NextResponse.json({
          success: true,
          action: 'failed',
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
    const errorMessage = error instanceof Error ? error.message : String(error)
    const errorType = error instanceof Error ? error.constructor.name : 'UnknownError'
    const errorStack = error instanceof Error ? error.stack : undefined

    console.error('Crawl failed:', error)

    return NextResponse.json(
      {
        success: false,
        action,
        error: errorMessage,
        errorType,
        stack: process.env.NODE_ENV === 'development' ? errorStack : undefined,
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    )
  }
}

export async function GET() {
  try {
    const status = await getCrawlStatus()
    return NextResponse.json({
      success: true,
      status: 'ok',
      ...status,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    const errorType = error instanceof Error ? error.constructor.name : 'UnknownError'
    const errorStack = error instanceof Error ? error.stack : undefined

    console.error('GET crawl status failed:', error)

    return NextResponse.json(
      {
        success: false,
        status: 'error',
        error: errorMessage,
        errorType,
        stack: process.env.NODE_ENV === 'development' ? errorStack : undefined,
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    )
  }
}
