'use client'

import * as React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Menu, X, Sparkles, Github, Command } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const navigation = [
  { name: 'Skills', href: '/en/skills' },
  { name: 'Categories', href: '/en/categories' },
  { name: 'Docs', href: '/en/docs' },
]

const languages = [
  { code: 'en', name: 'EN' },
  { code: 'zh', name: '中文' },
  { code: 'ja', name: '日本語' },
]

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false)
  const pathname = usePathname()

  const currentLocale = pathname.split('/')[1] || 'en'

  const switchLocale = (locale: string) => {
    const pathParts = pathname.split('/')
    pathParts[1] = locale
    return pathParts.join('/') || `/${locale}`
  }

  return (
    <header className="sticky top-0 z-50 w-full glass-strong">
      <nav className="container mx-auto flex h-16 items-center justify-between px-4 lg:px-8">
        <div className="flex items-center gap-8">
          <Link href={`/${currentLocale}`} className="flex items-center gap-2 group">
            <div className="relative">
              <Command className="h-8 w-8 text-primary transition-transform duration-300 group-hover:scale-110" />
              <Sparkles className="absolute -top-1 -right-1 h-3 w-3 text-accent animate-pulse" />
            </div>
            <span className="text-xl font-bold text-gradient hidden sm:block">agent-skill.dev</span>
          </Link>

          <div className="hidden md:flex items-center gap-1">
            {navigation.map((item) => {
              const isActive = pathname.includes(item.href.split('/')[2])
              return (
                <Link
                  key={item.name}
                  href={item.href.replace('/en/', `/${currentLocale}/`)}
                  className={cn(
                    'px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200',
                    isActive
                      ? 'text-primary bg-primary/10'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted',
                  )}
                >
                  {item.name}
                </Link>
              )
            })}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-1 bg-muted rounded-lg p-1">
            {languages.map((lang) => (
              <Link
                key={lang.code}
                href={switchLocale(lang.code)}
                className={cn(
                  'px-2.5 py-1 text-xs font-medium rounded-md transition-all duration-200',
                  currentLocale === lang.code
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground',
                )}
              >
                {lang.name}
              </Link>
            ))}
          </div>

          <a
            href="https://github.com/agent-skill"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:flex"
          >
            <Button variant="ghost" size="icon" className="h-9 w-9">
              <Github className="h-4 w-4" />
            </Button>
          </a>

          <Button
            variant="default"
            size="sm"
            className="hidden sm:flex bg-gradient-sunset hover:opacity-90 transition-opacity"
          >
            <Sparkles className="h-4 w-4 mr-1.5" />
            Submit Skill
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </nav>

      {mobileMenuOpen && (
        <div className="md:hidden border-t border-border animate-fade-in">
          <div className="container mx-auto px-4 py-4 space-y-3">
            {navigation.map((item) => {
              const isActive = pathname.includes(item.href.split('/')[2])
              return (
                <Link
                  key={item.name}
                  href={item.href.replace('/en/', `/${currentLocale}/`)}
                  className={cn(
                    'block px-4 py-3 text-base font-medium rounded-lg transition-colors',
                    isActive
                      ? 'text-primary bg-primary/10'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted',
                  )}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {item.name}
                </Link>
              )
            })}

            <div className="pt-3 border-t border-border">
              <div className="flex items-center gap-2">
                {languages.map((lang) => (
                  <Link
                    key={lang.code}
                    href={switchLocale(lang.code)}
                    className={cn(
                      'flex-1 text-center px-3 py-2 text-sm font-medium rounded-lg transition-colors',
                      currentLocale === lang.code
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-muted-foreground hover:text-foreground',
                    )}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {lang.name}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  )
}
