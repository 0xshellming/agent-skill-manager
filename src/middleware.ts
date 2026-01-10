import createMiddleware from 'next-intl/middleware'
import { locales, defaultLocale } from './i18n/config'

export default createMiddleware({
  locales,
  defaultLocale,
  localePrefix: 'as-needed', // 关键配置：默认语言不显示前缀
  localeDetection: true,
})

export const config = {
  // 匹配除了 API、静态资源、admin 等的所有路径
  matcher: ['/((?!api|_next|_vercel|admin|.*\\..*).*)'],
}
