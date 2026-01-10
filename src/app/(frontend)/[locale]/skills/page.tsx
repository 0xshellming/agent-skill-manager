import { getPayload } from 'payload'
import config from '@/payload.config'
import { getTranslations } from 'next-intl/server'
import { Search, Filter, Star, Terminal, ArrowUpDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import type { Skill, Category } from '@/payload-types'
import type { Metadata } from 'next'
import { Link } from '@/navigation'

interface Props {
  params: Promise<{ locale: string }>
  searchParams: Promise<{
    q?: string
    category?: string
    page?: string
    sort?: string
  }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  return {
    title: 'All AI Agent Skills',
    description:
      'Browse and discover AI agent skills for Claude, OpenAI Codex, Cursor, and more. Filter by category, search by name, and find the perfect skill for your AI.',
    alternates: {
      canonical: `/${locale}/skills`,
      languages: {
        en: '/en/skills',
        zh: '/zh/skills',
        ja: '/ja/skills',
      },
    },
  }
}

export default async function SkillsPage({ params, searchParams }: Props) {
  await params
  const t = await getTranslations('skills')
  const tHome = await getTranslations('home')
  const search = await searchParams
  const payloadConfig = await config
  const payload = await getPayload({ config: payloadConfig })

  const page = parseInt(search.page || '1', 10)
  const limit = 12
  const sort = search.sort || '-stars'

  const whereClause: Record<string, unknown> = {
    _status: { equals: 'published' },
  }

  if (search.q) {
    whereClause.or = [
      { name: { contains: search.q } },
      { description: { contains: search.q } },
      { author: { contains: search.q } },
    ]
  }

  if (search.category) {
    const category = await payload.find({
      collection: 'categories',
      where: { slug: { equals: search.category } },
      limit: 1,
    })
    if (category.docs[0]) {
      whereClause.category = { equals: category.docs[0].id }
    }
  }

  const [skillsResult, categoriesResult] = await Promise.all([
    payload.find({
      collection: 'skills',
      limit,
      page,
      sort,
      where: whereClause,
      depth: 1,
    }),
    payload.find({
      collection: 'categories',
      limit: 20,
      sort: 'order',
    }),
  ])

  const skills = skillsResult.docs as Skill[]
  const categories = categoriesResult.docs as Category[]
  const { totalDocs, totalPages, hasNextPage, hasPrevPage } = skillsResult

  return (
    <div className="container mx-auto px-4 py-8 lg:py-12">
      <div className="mb-8">
        <h1 className="mb-2 text-3xl font-bold tracking-tight sm:text-4xl">{t('title')}</h1>
        <p className="text-muted-foreground">{totalDocs} {t('title').toLowerCase()}</p>
      </div>

      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <form className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            name="q"
            defaultValue={search.q}
            placeholder={t('search')}
            className="pl-10 bg-card/50"
          />
        </form>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Filter className="mr-2 h-4 w-4" />
            {t('filterByCategory')}
          </Button>
          <Button variant="outline" size="sm">
            <ArrowUpDown className="mr-2 h-4 w-4" />
            {t('sortBy')}
          </Button>
        </div>
      </div>

      {categories.length > 0 && (
        <div className="mb-8 flex flex-wrap gap-2">
          <Link href="/skills">
            <Badge
              variant={!search.category ? 'default' : 'secondary'}
              className="cursor-pointer hover:bg-primary/80 transition-colors"
            >
              {t('allCategories')}
            </Badge>
          </Link>
          {categories.map((cat) => (
            <Link key={cat.id} href={`/skills?category=${cat.slug}`}>
              <Badge
                variant={search.category === cat.slug ? 'default' : 'secondary'}
                className="cursor-pointer hover:bg-primary/80 transition-colors"
              >
                {cat.icon && <span className="mr-1">{cat.icon}</span>}
                {cat.name}
              </Badge>
            </Link>
          ))}
        </div>
      )}

      <Separator className="mb-8" />

      {skills.length > 0 ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 animate-stagger">
            {skills.map((skill) => (
              <Link key={skill.id} href={`/skill/${skill.slug}`}>
                <Card className="group h-full card-hover cursor-pointer bg-card/50 backdrop-blur">
                  <CardContent className="p-5">
                    <div className="mb-3 flex items-start justify-between">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                        <Terminal className="h-5 w-5 text-primary" />
                      </div>
                      {skill.stars && skill.stars > 0 && (
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
                        <span className="text-xs text-muted-foreground">{tHome('by')} {skill.author}</span>
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
                <Link
                  href={`/skills?page=${page - 1}${search.q ? `&q=${search.q}` : ''}${search.category ? `&category=${search.category}` : ''}`}
                >
                  <Button variant="outline">Previous</Button>
                </Link>
              )}

              <span className="px-4 text-sm text-muted-foreground">
                Page {page} of {totalPages}
              </span>

              {hasNextPage && (
                <Link
                  href={`/skills?page=${page + 1}${search.q ? `&q=${search.q}` : ''}${search.category ? `&category=${search.category}` : ''}`}
                >
                  <Button variant="outline">Next</Button>
                </Link>
              )}
            </div>
          )}
        </>
      ) : (
        <Card className="bg-card/50 backdrop-blur">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <Search className="mb-4 h-12 w-12 text-muted-foreground" />
            <h3 className="mb-2 text-lg font-semibold">{t('noResults')}</h3>
            <p className="mb-6 text-muted-foreground">
              {search.q ? `No results for "${search.q}"` : t('tryDifferentSearch')}
            </p>
            <Link href="/skills">
              <Button variant="outline">Clear filters</Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export function generateStaticParams() {
  return [{ locale: 'en' }, { locale: 'zh' }, { locale: 'ja' }]
}
