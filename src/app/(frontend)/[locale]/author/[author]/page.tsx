import Link from 'next/link'
import { getPayload } from 'payload'
import config from '@/payload.config'
import { Star, Terminal, ArrowLeft, Github, ExternalLink, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import type { Skill } from '@/payload-types'
import type { Metadata } from 'next'

interface Props {
  params: Promise<{ locale: string; author: string }>
  searchParams: Promise<{ page?: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, author } = await params

  return {
    title: `${author}'s AI Skills`,
    description: `Browse AI agent skills created by ${author}. Discover tools for Claude, OpenAI Codex, Cursor, and more.`,
    alternates: {
      canonical: `/${locale}/author/${author}`,
      languages: {
        en: `/en/author/${author}`,
        zh: `/zh/author/${author}`,
        ja: `/ja/author/${author}`,
      },
    },
  }
}

export default async function AuthorPage({ params, searchParams }: Props) {
  const { locale, author } = await params
  const search = await searchParams
  const payloadConfig = await config
  const payload = await getPayload({ config: payloadConfig })

  const page = parseInt(search.page || '1', 10)
  const limit = 12

  const skillsResult = await payload.find({
    collection: 'skills',
    where: {
      and: [{ author: { equals: author } }, { _status: { equals: 'published' } }],
    },
    limit,
    page,
    sort: '-stars',
    depth: 1,
  })

  const skills = skillsResult.docs as Skill[]
  const { totalDocs, totalPages, hasNextPage, hasPrevPage } = skillsResult

  const totalStars = skills.reduce((sum, skill) => sum + (skill.stars || 0), 0)

  return (
    <div className="container mx-auto px-4 py-8 lg:py-12">
      <div className="mb-8">
        <Link href={`/${locale}/skills`}>
          <Button variant="ghost" size="sm" className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            All Skills
          </Button>
        </Link>

        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
              <User className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{author}</h1>
              <div className="mt-2 flex items-center gap-4 text-sm text-muted-foreground">
                <span>
                  {totalDocs} skill{totalDocs !== 1 ? 's' : ''}
                </span>
                {totalStars > 0 && (
                  <span className="flex items-center gap-1">
                    <Star className="h-4 w-4 fill-current text-yellow-500" />
                    {totalStars} total stars
                  </span>
                )}
              </div>
            </div>
          </div>

          <a href={`https://github.com/${author}`} target="_blank" rel="noopener noreferrer">
            <Button variant="outline">
              <Github className="mr-2 h-4 w-4" />
              GitHub
              <ExternalLink className="ml-2 h-3.5 w-3.5" />
            </Button>
          </a>
        </div>
      </div>

      {skills.length > 0 ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 animate-stagger">
            {skills.map((skill) => (
              <Link key={skill.id} href={`/${locale}/skill/${skill.slug}`}>
                <Card className="group h-full card-hover cursor-pointer bg-card/50 backdrop-blur">
                  <CardContent className="p-5">
                    <div className="mb-3 flex items-start justify-between">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                        <Terminal className="h-5 w-5 text-primary" />
                      </div>
                      {skill.stars !== null && skill.stars !== undefined && skill.stars > 0 && (
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Star className="h-3.5 w-3.5 fill-current text-yellow-500" />
                          {skill.stars}
                        </div>
                      )}
                    </div>

                    <h2 className="mb-1.5 font-semibold line-clamp-1 group-hover:text-primary transition-colors">
                      {skill.name || skill.slug}
                    </h2>

                    {skill.description && (
                      <p className="mb-3 text-sm text-muted-foreground line-clamp-2">
                        {skill.description}
                      </p>
                    )}

                    {skill.compatibility && skill.compatibility.length > 0 && (
                      <div className="flex gap-1">
                        {skill.compatibility.slice(0, 3).map((platform) => (
                          <Badge
                            key={platform}
                            variant="secondary"
                            className="text-[10px] px-1.5 py-0"
                          >
                            {platform}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="mt-12 flex items-center justify-center gap-2">
              {hasPrevPage && (
                <Link href={`/${locale}/author/${author}?page=${page - 1}`}>
                  <Button variant="outline">Previous</Button>
                </Link>
              )}
              <span className="px-4 text-sm text-muted-foreground">
                Page {page} of {totalPages}
              </span>
              {hasNextPage && (
                <Link href={`/${locale}/author/${author}?page=${page + 1}`}>
                  <Button variant="outline">Next</Button>
                </Link>
              )}
            </div>
          )}
        </>
      ) : (
        <Card className="bg-card/50 backdrop-blur">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <User className="mb-4 h-12 w-12 text-muted-foreground" />
            <h3 className="mb-2 text-lg font-semibold">No skills found</h3>
            <p className="text-muted-foreground">This author hasn't published any skills yet.</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
