import Link from 'next/link'
import { Github, Twitter, Command, Heart } from 'lucide-react'
import { Separator } from '@/components/ui/separator'

const footerLinks = {
  product: [
    { name: 'All Skills', href: '/en/skills' },
    { name: 'Categories', href: '/en/categories' },
    { name: 'Submit Skill', href: '/en/submit' },
    { name: 'CLI Tool', href: '/en/docs/cli' },
  ],
  resources: [
    { name: 'Documentation', href: '/en/docs' },
    { name: 'Getting Started', href: '/en/docs/getting-started' },
    { name: 'API Reference', href: '/en/docs/api' },
    { name: 'Changelog', href: '/en/changelog' },
  ],
  company: [
    { name: 'About', href: '/en/about' },
    { name: 'Blog', href: '/en/blog' },
    { name: 'Contact', href: '/en/contact' },
    { name: 'Privacy', href: '/en/privacy' },
  ],
}

const socialLinks = [
  { name: 'GitHub', href: 'https://github.com/agent-skill', icon: Github },
  { name: 'Twitter', href: 'https://twitter.com/agentskill', icon: Twitter },
]

interface FooterProps {
  locale?: string
}

export function Footer({ locale = 'en' }: FooterProps) {
  return (
    <footer className="border-t border-border bg-card/50">
      <div className="container mx-auto px-4 lg:px-8">
        <div className="py-12 lg:py-16">
          <div className="grid grid-cols-2 gap-8 md:grid-cols-4 lg:gap-12">
            <div className="col-span-2 md:col-span-1">
              <Link href={`/${locale}`} className="flex items-center gap-2 group">
                <Command className="h-7 w-7 text-primary transition-transform duration-300 group-hover:scale-110" />
                <span className="text-lg font-bold text-gradient">agent-skill.dev</span>
              </Link>
              <p className="mt-4 text-sm text-muted-foreground leading-relaxed">
                Discover, install, and share AI agent skills. The npm for AI agents.
              </p>
              <div className="mt-6 flex items-center gap-3">
                {socialLinks.map((item) => (
                  <a
                    key={item.name}
                    href={item.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted text-muted-foreground transition-all duration-200 hover:bg-primary hover:text-primary-foreground hover:scale-105"
                  >
                    <item.icon className="h-4 w-4" />
                    <span className="sr-only">{item.name}</span>
                  </a>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-foreground">Product</h3>
              <ul className="mt-4 space-y-3">
                {footerLinks.product.map((link) => (
                  <li key={link.name}>
                    <Link
                      href={link.href.replace('/en/', `/${locale}/`)}
                      className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-foreground">Resources</h3>
              <ul className="mt-4 space-y-3">
                {footerLinks.resources.map((link) => (
                  <li key={link.name}>
                    <Link
                      href={link.href.replace('/en/', `/${locale}/`)}
                      className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-foreground">Company</h3>
              <ul className="mt-4 space-y-3">
                {footerLinks.company.map((link) => (
                  <li key={link.name}>
                    <Link
                      href={link.href.replace('/en/', `/${locale}/`)}
                      className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        <Separator />

        <div className="flex flex-col items-center justify-between gap-4 py-6 md:flex-row">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} agent-skill.dev. All rights reserved.
          </p>
          <p className="flex items-center gap-1 text-sm text-muted-foreground">
            Made with <Heart className="h-3.5 w-3.5 text-destructive fill-destructive" /> for AI
            developers
          </p>
        </div>
      </div>
    </footer>
  )
}
