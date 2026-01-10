/**
 * CSS Selectors for Smithery.ai
 */

export const SELECTORS = {
  SKILL_GRID: 'div.grid.gap-6',
  SKILL_CARD: 'div.group\\/card',
  SKILL_CARD_NAMESPACE_SLUG: 'div.text-muted-foreground.text-sm.truncate',
  SKILL_CARD_NAME: 'h3',

  // Detail page
  DETAIL_CONTAINER: 'div.space-y-6',
  SKILL_TITLE: 'div.space-y-6 h1',
  SKILL_DESCRIPTION: 'div.space-y-6 > div > p.text-lg',
  SOURCE_CONTAINER: 'div.rounded-lg.border.border-border.bg-muted\\/50.p-4',
  SOURCE_LINK: 'a[href*="github.com"]',
  STATS_CONTAINER: 'div.flex.items-center.gap-6.text-sm',
  STATS_ITEM: 'div.flex.items-center.gap-1',
  ACTIVITY_CONTAINER: 'div.flex.items-center.gap-6.border-b',

  // Common
  LOADING_INDICATOR: '[class*="loading"], [class*="spinner"]',
} as const

export const URLS = {
  BASE: 'https://smithery.ai',
  SKILLS_LIST: (page: number) => `https://smithery.ai/skills?page=${page}`,
  SKILL_DETAIL: (namespace: string, slug: string) =>
    `https://smithery.ai/skills/${namespace}/${slug}`,
} as const
