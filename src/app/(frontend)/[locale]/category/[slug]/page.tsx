import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getPayload } from 'payload'
import config from '@/payload.config'
import { Star, Terminal, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import type { Skill, Category } from '@/payload-types'
import type { Metadata } from 'next'

interface Props {
  params: Promise<{ locale: string; slug: string }>
  searchParams: Promise<{ page?: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params
  const payloadConfig = await config
  const payload = await getPayload({ config: payloadConfig })

  const result = await payload.find({
    collection: 'categories',
    where: { slug: { equals: slug } },
    limit: 1,
  })

  const category = result.docs[0] as Category | undefined

  if (!category) {
    return { title: 'Category Not Found' }
  }

  return {
    title: `${category.name} AI Skills`,
    description:
      category.description ||
      `Browse the best ${category.name} AI agent skills for Claude, OpenAI Codex, Cursor, and more.`,
    alternates: {
      canonical: `/${locale}/category/${slug}`,
      languages: {
        en: `/en/category/${slug}`,
        zh: `/zh/category/${slug}`,
        ja: `/ja/category/${slug}`,
      },
    },
  }
}

export default async function CategoryPage({ params, searchParams }: Props) {
  const { locale, slug } = await params
  const search = await searchParams
  const payloadConfig = await config
  const payload = await getPayload({ config: payloadConfig })

  const categoryResult = await payload.find({
    collection: 'categories',
    where: { slug: { equals: slug } },
    limit: 1,
  })

  const category = categoryResult.docs[0] as Category | undefined

  if (!category) {
    notFound()
  }

  const page = parseInt(search.page || '1', 10)
  const limit = 12

  const skillsResult = await payload.find({
    collection: 'skills',
    where: {
      and: [{ category: { equals: category.id } }, { _status: { equals: 'published' } }],
    },
    limit,
    page,
    sort: '-stars',
    depth: 1,
  })

  const skills = skillsResult.docs as Skill[]
  const { totalDocs, totalPages, hasNextPage, hasPrevPage } = skillsResult

  return (
    <div className="container mx-auto px-4 py-8 lg:py-12">
      <div className="mb-8">
        <Link href={`/${locale}/skills`}>
          <Button variant="ghost" size="sm" className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            All Skills
          </Button>
        </Link>

        <div className="flex items-center gap-4">
          {category.icon && (
            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10 text-2xl">
              {category.icon}
            </div>
          )}
          <div>
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{category.name}</h1>
            {category.description && (
              <p className="mt-1 text-muted-foreground">{category.description}</p>
            )}
          </div>
        </div>

        <p className="mt-4 text-sm text-muted-foreground">
          {totalDocs} skill{totalDocs !== 1 ? 's' : ''} in this category
        </p>
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

                    <div className="flex items-center justify-between">
                      {skill.author && (
                        <span className="text-xs text-muted-foreground">by {skill.author}</span>
                      )}
                      {skill.compatibility && skill.compatibility.length > 0 && (
                        <div className="flex gap-1">
                          {skill.compatibility.slice(0, 2).map((platform) => (
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
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="mt-12 flex items-center justify-center gap-2">
              {hasPrevPage && (
                <Link href={`/${locale}/category/${slug}?page=${page - 1}`}>
                  <Button variant="outline">Previous</Button>
                </Link>
              )}
              <span className="px-4 text-sm text-muted-foreground">
                Page {page} of {totalPages}
              </span>
              {hasNextPage && (
                <Link href={`/${locale}/category/${slug}?page=${page + 1}`}>
                  <Button variant="outline">Next</Button>
                </Link>
              )}
            </div>
          )}
        </>
      ) : (
        <Card className="bg-card/50 backdrop-blur">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <Terminal className="mb-4 h-12 w-12 text-muted-foreground" />
            <h3 className="mb-2 text-lg font-semibold">No skills yet</h3>
            <p className="text-muted-foreground">No skills have been added to this category yet.</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
