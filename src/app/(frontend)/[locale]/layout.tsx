import React from 'react'
import { NextIntlClientProvider } from 'next-intl'
import { getMessages } from 'next-intl/server'
import { Inter, JetBrains_Mono } from 'next/font/google'
import { Header, Footer } from '@/components/layout'
import type { Metadata } from 'next'
import { locales } from '@/i18n/config'

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-sans',
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-mono',
})

export const metadata: Metadata = {
  metadataBase: new URL('https://agent-skill.dev'),
  title: {
    default: 'Agent Skill Manager - The npm for AI Agent Skills',
    template: '%s | agent-skill.dev',
  },
  description:
    'Discover, install, and share AI agent skills for Claude, OpenAI Codex, Cursor, and more. The package manager for AI agents.',
  keywords: [
    'AI agent skills',
    'Claude skills',
    'AI automation',
    'agent plugins',
    'OpenAI Codex',
    'Cursor skills',
    'AI tools',
    'prompt engineering',
  ],
  authors: [{ name: 'agent-skill.dev' }],
  creator: 'agent-skill.dev',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://agent-skill.dev',
    siteName: 'Agent Skill Manager',
    title: 'Agent Skill Manager - The npm for AI Agent Skills',
    description:
      'Discover, install, and share AI agent skills for Claude, OpenAI Codex, Cursor, and more.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Agent Skill Manager',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Agent Skill Manager - The npm for AI Agent Skills',
    description:
      'Discover, install, and share AI agent skills for Claude, OpenAI Codex, Cursor, and more.',
    images: ['/og-image.png'],
    creator: '@agentskill',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon-16x16.png',
    apple: '/apple-touch-icon.png',
  },
  manifest: '/site.webmanifest',
}

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }))
}

interface LocaleLayoutProps {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}

export default async function LocaleLayout({ children, params }: LocaleLayoutProps) {
  const { locale } = await params
  const messages = await getMessages()

  return (
    <html
      lang={locale}
      className={`${inter.variable} ${jetbrainsMono.variable} dark`}
      suppressHydrationWarning
    >
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="min-h-screen bg-background font-sans antialiased">
        <NextIntlClientProvider messages={messages}>
          <div className="relative flex min-h-screen flex-col">
            <Header />
            <main className="flex-1">{children}</main>
            <Footer />
          </div>
        </NextIntlClientProvider>
      </body>
    </html>
  )
}
