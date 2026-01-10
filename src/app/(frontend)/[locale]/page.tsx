import Link from 'next/link'
import { getPayload } from 'payload'
import config from '@/payload.config'
import {
  ArrowRight,
  Sparkles,
  Search,
  Download,
  Star,
  Zap,
  Code2,
  FileText,
  BarChart3,
  Shield,
  Palette,
  Terminal,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import type { Skill, Category } from '@/payload-types'

const categoryIcons: Record<string, React.ElementType> = {
  development: Code2,
  document: FileText,
  data: BarChart3,
  security: Shield,
  creative: Palette,
  automation: Zap,
  default: Terminal,
}

interface Props {
  params: Promise<{ locale: string }>
}

export default async function HomePage({ params }: Props) {
  const { locale } = await params
  const payloadConfig = await config
  const payload = await getPayload({ config: payloadConfig })

  const [skillsResult, categoriesResult] = await Promise.all([
    payload.find({
      collection: 'skills',
      limit: 12,
      sort: '-stars',
      where: {
        _status: { equals: 'published' },
      },
      depth: 1,
    }),
    payload.find({
      collection: 'categories',
      limit: 8,
      sort: 'order',
    }),
  ])

  const skills = skillsResult.docs as Skill[]
  const categories = categoriesResult.docs as Category[]
  const totalSkills = skillsResult.totalDocs

  return (
    <div className="relative">
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute top-0 left-1/4 h-96 w-96 rounded-full bg-gradient-start/20 blur-3xl" />
        <div className="absolute top-32 right-1/4 h-96 w-96 rounded-full bg-gradient-mid/20 blur-3xl" />
        <div className="absolute bottom-0 left-1/2 h-96 w-96 rounded-full bg-gradient-end/20 blur-3xl" />
      </div>

      <section className="container mx-auto px-4 pt-16 pb-24 lg:pt-24 lg:pb-32">
        <div className="mx-auto max-w-4xl text-center">
          <Badge
            variant="secondary"
            className="mb-6 px-4 py-1.5 text-sm font-medium animate-fade-in"
          >
            <Sparkles className="mr-1.5 h-3.5 w-3.5" />
            {totalSkills}+ AI Skills Available
          </Badge>

          <h1 className="mb-6 text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl animate-fade-in">
            The <span className="text-gradient">npm</span> for AI Agent Skills
          </h1>

          <p className="mx-auto mb-10 max-w-2xl text-lg text-muted-foreground sm:text-xl animate-fade-in">
            Discover, install, and share powerful skills for Claude, OpenAI Codex, Cursor, and more.
            Supercharge your AI agents in seconds.
          </p>

          <div className="mx-auto mb-8 max-w-xl animate-fade-in">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search skills... (e.g., PDF, code review, data analysis)"
                className="h-14 pl-12 pr-4 text-base rounded-xl border-2 border-border bg-card/50 backdrop-blur focus:border-primary"
              />
              <Button
                size="sm"
                className="absolute right-2 top-1/2 -translate-y-1/2 bg-gradient-sunset hover:opacity-90"
              >
                Search
              </Button>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4 animate-fade-in">
            <Link href={`/${locale}/skills`}>
              <Button size="lg" className="bg-gradient-sunset hover:opacity-90 h-12 px-8">
                Browse All Skills
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link href={`/${locale}/docs/getting-started`}>
              <Button size="lg" variant="outline" className="h-12 px-8">
                <Terminal className="mr-2 h-4 w-4" />
                Get Started
              </Button>
            </Link>
          </div>

          <div className="mt-12 flex flex-wrap items-center justify-center gap-8 text-sm text-muted-foreground animate-fade-in">
            <div className="flex items-center gap-2">
              <Download className="h-4 w-4" />
              <span>Easy Install</span>
            </div>
            <div className="flex items-center gap-2">
              <Star className="h-4 w-4" />
              <span>Community Rated</span>
            </div>
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4" />
              <span>Instant Setup</span>
            </div>
          </div>
        </div>
      </section>

      {categories.length > 0 && (
        <section className="container mx-auto px-4 py-16 lg:py-24">
          <div className="mb-12 text-center">
            <h2 className="mb-4 text-3xl font-bold tracking-tight sm:text-4xl">
              Browse by Category
            </h2>
            <p className="text-muted-foreground">Find the perfect skill for your use case</p>
          </div>

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:gap-6 animate-stagger">
            {categories.map((category) => {
              const IconComponent = categoryIcons[category.slug] || categoryIcons.default
              return (
                <Link key={category.id} href={`/${locale}/category/${category.slug}`}>
                  <Card className="group h-full card-hover cursor-pointer bg-card/50 backdrop-blur">
                    <CardContent className="flex flex-col items-center p-6 text-center">
                      <div className="mb-4 rounded-xl bg-primary/10 p-3 transition-colors group-hover:bg-primary/20">
                        <IconComponent className="h-6 w-6 text-primary" />
                      </div>
                      <h3 className="font-semibold">{category.name}</h3>
                      {category.description && (
                        <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
                          {category.description}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                </Link>
              )
            })}
          </div>
        </section>
      )}

      <section className="container mx-auto px-4 py-16 lg:py-24">
        <div className="mb-12 flex items-center justify-between">
          <div>
            <h2 className="mb-2 text-3xl font-bold tracking-tight sm:text-4xl">Popular Skills</h2>
            <p className="text-muted-foreground">Most loved by the community</p>
          </div>
          <Link href={`/${locale}/skills`}>
            <Button variant="outline">
              View All
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>

        {skills.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 animate-stagger">
            {skills.map((skill) => (
              <Link key={skill.id} href={`/${locale}/skill/${skill.slug}`}>
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

                    <h3 className="mb-1.5 font-semibold line-clamp-1 group-hover:text-primary transition-colors">
                      {skill.name || skill.slug}
                    </h3>

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
        ) : (
          <Card className="bg-card/50 backdrop-blur">
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <Terminal className="mb-4 h-12 w-12 text-muted-foreground" />
              <h3 className="mb-2 text-lg font-semibold">No skills yet</h3>
              <p className="mb-6 text-muted-foreground">Be the first to submit a skill!</p>
              <Button className="bg-gradient-sunset hover:opacity-90">
                <Sparkles className="mr-2 h-4 w-4" />
                Submit Your Skill
              </Button>
            </CardContent>
          </Card>
        )}
      </section>

      <section className="container mx-auto px-4 py-16 lg:py-24">
        <Card className="overflow-hidden border-gradient bg-card/50 backdrop-blur">
          <CardContent className="p-8 sm:p-12 lg:p-16">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="mb-4 text-3xl font-bold tracking-tight sm:text-4xl">
                Install Skills with One Command
              </h2>
              <p className="mb-8 text-muted-foreground">
                Use our CLI tool to instantly add skills to your AI agent
              </p>

              <div className="mb-8 rounded-xl bg-background/80 p-4 font-mono text-sm sm:text-base">
                <code className="text-primary">npx askm install anthropics/pdf</code>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-4">
                <Link href={`/${locale}/docs/cli`}>
                  <Button size="lg" className="bg-gradient-sunset hover:opacity-90">
                    <Terminal className="mr-2 h-4 w-4" />
                    View CLI Docs
                  </Button>
                </Link>
                <Link href={`/${locale}/submit`}>
                  <Button size="lg" variant="outline">
                    <Sparkles className="mr-2 h-4 w-4" />
                    Submit a Skill
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  )
}

export function generateStaticParams() {
  return [{ locale: 'en' }, { locale: 'zh' }, { locale: 'ja' }]
}
