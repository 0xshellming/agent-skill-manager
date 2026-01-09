import { NextResponse } from 'next/server'
import { getPayload, Payload } from 'payload'
import config from '@payload-config'

export async function GET() {
  const startTime = Date.now()
  const results: Record<string, any> = {}

  try {
    const payload = await getPayload({ config })

    // Test 1: Find (READ)
    try {
      const findResult = await payload.find({
        collection: 'skills',
        limit: 1,
      })
      results.read = {
        status: 'ok',
        count: findResult.totalDocs,
        duration: `${Date.now() - startTime}ms`,
      }
    } catch (error) {
      results.read = {
        status: 'error',
        error: error instanceof Error ? error.message : String(error),
      }
    }

    // Test 2: Count
    try {
      const countResult = await payload.count({
        collection: 'skills',
      })
      results.count = {
        status: 'ok',
        total: countResult.totalDocs,
        duration: `${Date.now() - startTime}ms`,
      }
    } catch (error) {
      results.count = {
        status: 'error',
        error: error instanceof Error ? error.message : String(error),
      }
    }

    // Test 3: Find by ID (if any exists)
    try {
      const skills = await payload.find({
        collection: 'skills',
        limit: 1,
      })

      if (skills.docs.length > 0) {
        const skillId = skills.docs[0].id
        const findByIdResult = await payload.findByID({
          collection: 'skills',
          id: skillId,
          depth: 0,
        })
        results.findById = {
          status: 'ok',
          found: findByIdResult?.id === skillId,
          duration: `${Date.now() - startTime}ms`,
        }
      } else {
        results.findById = {
          status: 'skipped',
          reason: 'No skills to test with',
        }
      }
    } catch (error) {
      results.findById = {
        status: 'error',
        error: error instanceof Error ? error.message : String(error),
      }
    }

    // Test 4: Check collection connectivity
    try {
      const status = await Promise.all([
        payload.count({ collection: 'skills' }),
        payload.count({ collection: 'categories' }),
        payload.count({ collection: 'tags' }),
      ])
      results.collections = {
        status: 'ok',
        skills: status[0].totalDocs,
        categories: status[1].totalDocs,
        tags: status[2].totalDocs,
        duration: `${Date.now() - startTime}ms`,
      }
    } catch (error) {
      results.collections = {
        status: 'error',
        error: error instanceof Error ? error.message : String(error),
      }
    }

    const allPassed = Object.values(results).every(
      (result) => result.status === 'ok' || result.status === 'skipped',
    )

    return NextResponse.json({
      status: allPassed ? 'healthy' : 'degraded',
      timestamp: new Date().toISOString(),
      totalDuration: `${Date.now() - startTime}ms`,
      tests: results,
    })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    const errorType = error instanceof Error ? error.constructor.name : 'UnknownError'
    const errorStack = error instanceof Error ? error.stack : undefined

    console.error('Health check failed:', error)

    return NextResponse.json(
      {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: errorMessage,
        errorType,
        stack: process.env.NODE_ENV === 'development' ? errorStack : undefined,
      },
      { status: 500 },
    )
  }
}
