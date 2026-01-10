import { notFound } from 'next/navigation'
import { getPayload } from 'payload'
import config from '@/payload.config'
import { Link } from '@/navigation'
import {
  Star,
  Terminal,
  ExternalLink,
  Github,
  Copy,
  Check,
  ChevronRight,
  User,
  Tag,
  Layers,
  Zap,
  BookOpen,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { Skill, Category, Tag as TagType } from '@/payload-types'
import type { Metadata } from 'next'

interface Props {
  params: Promise<{ locale: string; slug: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params
  const payloadConfig = await config
  const payload = await getPayload({ config: payloadConfig })

  const result = await payload.find({
    collection: 'skills',
    where: { slug: { equals: slug } },
    limit: 1,
    depth: 1,
  })

  const skill = result.docs[0] as Skill | undefined

  if (!skill) {
    return {
      title: 'Skill Not Found',
    }
  }

  const title = `${skill.name || skill.slug} - AI Agent Skill`
  const description =
    skill.description ||
    `Discover ${skill.name || skill.slug}, an AI agent skill for automation and productivity.`

  return {
    title,
    description,
    keywords: [
      skill.name || skill.slug,
      'AI skill',
      'agent skill',
      'Claude skill',
      skill.author || '',
    ].filter(Boolean),
    alternates: {
      canonical: `/${locale}/skill/${slug}`,
      languages: {
        en: `/en/skill/${slug}`,
        zh: `/zh/skill/${slug}`,
        ja: `/ja/skill/${slug}`,
      },
    },
    openGraph: {
      title,
      description,
      url: `https://agent-skill.dev/${locale}/skill/${slug}`,
      type: 'article',
      images: [
        {
          url: `/og/skill/${slug}.png`,
          width: 1200,
          height: 630,
          alt: skill.name || skill.slug,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
  }
}

function generateStructuredData(skill: Skill) {
  const _category = skill.category as Category | null

  return {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: skill.name || skill.slug,
    description: skill.description,
    applicationCategory: 'DeveloperApplication',
    applicationSubCategory: 'AI Agent Skill',
    operatingSystem: 'Cross-platform',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
    },
    author: skill.author
      ? {
          '@type': 'Person',
          name: skill.author,
          url: `https://github.com/${skill.author}`,
        }
      : undefined,
    codeRepository: skill.githubUrl,
    aggregateRating: skill.stars
      ? {
          '@type': 'AggregateRating',
          ratingValue: 5,
          ratingCount: skill.stars,
        }
      : undefined,
  }
}

function generateBreadcrumbData(skill: Skill, locale: string) {
  const category = skill.category as Category | null

  const items = [
    {
      '@type': 'ListItem',
      position: 1,
      name: 'Home',
      item: `https://agent-skill.dev/${locale}`,
    },
    {
      '@type': 'ListItem',
      position: 2,
      name: 'Skills',
      item: `https://agent-skill.dev/${locale}/skills`,
    },
  ]

  if (category) {
    items.push({
      '@type': 'ListItem',
      position: 3,
      name: category.name,
      item: `https://agent-skill.dev/${locale}/category/${category.slug}`,
    })
  }

  items.push({
    '@type': 'ListItem',
    position: items.length + 1,
    name: skill.name || skill.slug,
    item: `https://agent-skill.dev/${locale}/skill/${skill.slug}`,
  })

  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items,
  }
}

export default async function SkillDetailPage({ params }: Props) {
  const { locale, slug } = await params
  const payloadConfig = await config
  const payload = await getPayload({ config: payloadConfig })

  const result = await payload.find({
    collection: 'skills',
    where: { slug: { equals: slug } },
    limit: 1,
    depth: 2,
  })

  const skill = result.docs[0] as Skill | undefined

  if (!skill) {
    notFound()
  }

  const category = skill.category as Category | null
  const tags = (skill.tags || []) as TagType[]

  const relatedSkillsResult = category
    ? await payload.find({
        collection: 'skills',
        where: {
          and: [
            { category: { equals: category.id } },
            { id: { not_equals: skill.id } },
            { _status: { equals: 'published' } },
          ],
        },
        limit: 4,
        sort: '-stars',
        depth: 1,
      })
    : { docs: [] as Skill[] }

  const relatedSkills = relatedSkillsResult.docs as Skill[]

  const structuredData = generateStructuredData(skill)
  const breadcrumbData = generateBreadcrumbData(skill, locale)

  const installCommand = skill.installCommand || `npx askm install ${skill.author}/${skill.slug}`

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbData) }}
      />

      <div className="container mx-auto px-4 py-8 lg:py-12">
        <nav className="mb-6 flex items-center gap-2 text-sm text-muted-foreground">
          <Link href="/" className="hover:text-foreground transition-colors">
            Home
          </Link>
          <ChevronRight className="h-4 w-4" />
          <Link href="/skills" className="hover:text-foreground transition-colors">
            Skills
          </Link>
          {category && (
            <>
              <ChevronRight className="h-4 w-4" />
              <Link
                href={`/category/${category.slug}`}
                className="hover:text-foreground transition-colors"
              >
                {category.name}
              </Link>
            </>
          )}
          <ChevronRight className="h-4 w-4" />
          <span className="text-foreground">{skill.name || skill.slug}</span>
        </nav>

        <div className="grid gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <div className="mb-6 flex items-start justify-between">
              <div>
                <div className="mb-2 flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                    <Terminal className="h-6 w-6 text-primary" />
                  </div>
                  <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
                    {skill.name || skill.slug}
                  </h1>
                </div>

                {skill.author && (
                  <Link
                    href={`/author/${skill.author}`}
                    className="inline-flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <User className="h-4 w-4" />
                    <span>by {skill.author}</span>
                  </Link>
                )}
              </div>

              {skill.stars !== null && skill.stars !== undefined && skill.stars > 0 && (
                <div className="flex items-center gap-1.5 rounded-lg bg-yellow-500/10 px-3 py-1.5">
                  <Star className="h-4 w-4 fill-current text-yellow-500" />
                  <span className="font-semibold text-yellow-500">{skill.stars}</span>
                </div>
              )}
            </div>

            {skill.description && (
              <p className="mb-6 text-lg text-muted-foreground leading-relaxed">
                {skill.description}
              </p>
            )}

            <div className="mb-8 flex flex-wrap gap-2">
              {category && (
                <Link href={`/category/${category.slug}`}>
                  <Badge variant="secondary" className="gap-1">
                    <Layers className="h-3 w-3" />
                    {category.name}
                  </Badge>
                </Link>
              )}
              {tags.map((tag) => (
                <Badge key={tag.id} variant="outline" className="gap-1">
                  <Tag className="h-3 w-3" />
                  {tag.name}
                </Badge>
              ))}
              {skill.compatibility?.map((platform) => (
                <Badge key={platform} className="bg-gradient-sunset text-white">
                  {platform}
                </Badge>
              ))}
            </div>

            <Card className="mb-8 bg-card/50 backdrop-blur overflow-hidden">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-medium flex items-center gap-2">
                  <Terminal className="h-4 w-4" />
                  Quick Install
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2 rounded-lg bg-background p-3 font-mono text-sm">
                  <code className="flex-1 text-primary">{installCommand}</code>
                  <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>

            {skill.useCases && skill.useCases.length > 0 && (
              <Card className="mb-8 bg-card/50 backdrop-blur">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="h-5 w-5 text-primary" />
                    Use Cases
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    {skill.useCases.map((item, i) => (
                      <li key={item.id || i} className="flex items-start gap-3">
                        <Check className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                        <span>{item.useCase}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {skill.prerequisites && skill.prerequisites.length > 0 && (
              <Card className="mb-8 bg-card/50 backdrop-blur">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BookOpen className="h-5 w-5 text-primary" />
                    Prerequisites
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {skill.prerequisites.map((item, i) => (
                      <li key={item.id || i} className="flex items-center gap-2">
                        <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                        <span className="text-muted-foreground">{item.prerequisite}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}
          </div>

          <div className="lg:col-span-1">
            <div className="sticky top-24 space-y-6">
              <Card className="bg-card/50 backdrop-blur">
                <CardHeader>
                  <CardTitle className="text-base">Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {skill.githubUrl && (
                    <a
                      href={skill.githubUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block"
                    >
                      <Button variant="outline" className="w-full justify-start">
                        <Github className="mr-2 h-4 w-4" />
                        View on GitHub
                        <ExternalLink className="ml-auto h-3.5 w-3.5" />
                      </Button>
                    </a>
                  )}
                  <Button className="w-full bg-gradient-sunset hover:opacity-90">
                    <Terminal className="mr-2 h-4 w-4" />
                    Install Skill
                  </Button>
                </CardContent>
              </Card>

              <Card className="bg-card/50 backdrop-blur">
                <CardHeader>
                  <CardTitle className="text-base">Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 text-sm">
                  {skill.author && (
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Author</span>
                      <Link
                        href={`/author/${skill.author}`}
                        className="font-medium hover:text-primary transition-colors"
                      >
                        {skill.author}
                      </Link>
                    </div>
                  )}
                  {category && (
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Category</span>
                      <Link
                        href={`/category/${category.slug}`}
                        className="font-medium hover:text-primary transition-colors"
                      >
                        {category.name}
                      </Link>
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Updated</span>
                    <span className="font-medium">
                      {new Date(skill.updatedAt).toLocaleDateString()}
                    </span>
                  </div>
                </CardContent>
              </Card>

              {relatedSkills.length > 0 && (
                <Card className="bg-card/50 backdrop-blur">
                  <CardHeader>
                    <CardTitle className="text-base">Related Skills</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {relatedSkills.map((related) => (
                      <Link
                        key={related.id}
                        href={`/skill/${related.slug}`}
                        className="group flex items-center justify-between rounded-lg p-2 -mx-2 hover:bg-muted transition-colors"
                      >
                        <span className="font-medium group-hover:text-primary transition-colors">
                          {related.name || related.slug}
                        </span>
                        {related.stars !== null &&
                          related.stars !== undefined &&
                          related.stars > 0 && (
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Star className="h-3 w-3 fill-current text-yellow-500" />
                              {related.stars}
                            </div>
                          )}
                      </Link>
                    ))}
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
