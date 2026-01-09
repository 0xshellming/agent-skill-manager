import { NextResponse } from 'next/server'
import { fetchSkillById } from '@/lib/skill-crawler'

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function POST(request: Request, { params }: RouteParams) {
  const authHeader = request.headers.get('authorization')
  const expectedToken = process.env.CRAWL_SECRET

  if (expectedToken && authHeader !== `Bearer ${expectedToken}`) {
    return NextResponse.json(
      {
        success: false,
        error: 'Unauthorized',
        errorType: 'AuthenticationError',
      },
      { status: 401 },
    )
  }

  try {
    const { id } = await params
    console.log(`📡 API: Fetch skill ${id}`)

    const result = await fetchSkillById(id)

    if (result.success) {
      return NextResponse.json({
        success: true,
        action: 'fetch',
        ...result,
        timestamp: new Date().toISOString(),
      })
    } else {
      return NextResponse.json(
        {
          success: false,
          action: 'fetch',
          error: result.error,
          errorType: result.errorType || 'FetchError',
          details: result.details,
          timestamp: new Date().toISOString(),
        },
        { status: 500 },
      )
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    const errorType = error instanceof Error ? error.constructor.name : 'UnknownError'
    const errorStack = error instanceof Error ? error.stack : undefined

    console.error('API fetch skill failed:', error)

    return NextResponse.json(
      {
        success: false,
        action: 'fetch',
        error: errorMessage,
        errorType,
        stack: process.env.NODE_ENV === 'development' ? errorStack : undefined,
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    )
  }
}
