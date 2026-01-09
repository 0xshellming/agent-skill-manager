import { NextResponse } from 'next/server'
import { crawlAllSkills } from '@/lib/skill-crawler'

export async function POST(request: Request) {
  const authHeader = request.headers.get('authorization')
  const expectedToken = process.env.CRAWL_SECRET

  if (expectedToken && authHeader !== `Bearer ${expectedToken}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    console.log('📡 Received crawl request')
    const result = await crawlAllSkills()

    return NextResponse.json({
      success: true,
      ...result,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Crawl failed:', error)
    return NextResponse.json({ error: 'Crawl failed', details: String(error) }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({ status: 'ok' })
}
