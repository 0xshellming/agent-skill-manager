# SEO 策略

本文档详细说明 agent-skill.dev 的 SEO 优化方案。

---

## 目录

1. [关键词策略](#1-关键词策略)
2. [URL结构](#2-url结构)
3. [多语言SEO](#3-多语言seo)
4. [页面SEO](#4-页面seo)
5. [技术SEO](#5-技术seo)
6. [程序化SEO](#6-程序化seo)
7. [内链策略](#7-内链策略)

---

## 1. 关键词策略

### 1.1 核心关键词矩阵

| 关键词类型 | 关键词示例 | 搜索意图 | 目标页面 | 优先级 |
|-----------|-----------|---------|---------|--------|
| **品牌词** | agent-skill.dev, askm | 导航型 | 首页 | ⭐⭐⭐⭐ |
| **核心词** | AI agent skills, Claude skills | 信息型 | 首页/列表 | ⭐⭐⭐⭐⭐ |
| **分类词** | PDF processing AI skill | 信息型 | 分类页 | ⭐⭐⭐⭐ |
| **技能词** | {skill-name} AI skill | 交易型 | 详情页 | ⭐⭐⭐⭐⭐ |
| **长尾词** | how to install Claude skills | 信息型 | 文档页 | ⭐⭐⭐ |

### 1.2 分类关键词

| 分类 | 英文关键词 | 中文关键词 |
|------|-----------|-----------|
| 文档处理 | PDF skill, document automation | PDF技能, 文档自动化 |
| 开发工具 | code review skill, git automation | 代码审查技能, Git自动化 |
| 数据分析 | CSV analyzer, data visualization | CSV分析器, 数据可视化 |
| 商业营销 | marketing automation, brand guidelines | 营销自动化, 品牌指南 |
| 沟通写作 | email automation, meeting notes | 邮件自动化, 会议记录 |
| 创意媒体 | image processing, video AI | 图片处理, 视频AI |
| 效率工具 | file organizer, invoice automation | 文件整理, 发票自动化 |
| 安全工具 | threat hunting, security forensics | 威胁狩猎, 安全取证 |

### 1.3 技能页面关键词模板

每个技能详情页自动生成以下关键词：

```
主关键词: {skill-name} AI skill
次关键词:
  - {skill-name} Claude plugin
  - {skill-name} agent skill
  - {skill-name} automation
  - how to use {skill-name}
  - {skill-name} tutorial
```

---

## 2. URL结构

### 2.1 URL模式

```
https://agent-skill.dev/
├── /                              # 重定向到 /en
├── /{locale}/                     # 本地化首页
├── /{locale}/skills               # 技能列表
├── /{locale}/skill/{slug}         # 技能详情 ⭐ SEO核心
├── /{locale}/category/{category}  # 分类页
├── /{locale}/author/{author}      # 作者页
├── /{locale}/docs                 # 文档首页
├── /{locale}/docs/{slug}          # 文档页
├── /{locale}/compare/{a}-vs-{b}   # 对比页 (程序化SEO)
└── /sitemap.xml                   # Sitemap
```

### 2.2 语言代码

| 语言 | 代码 | URL示例 |
|------|------|---------|
| 英文 | en | /en/skill/pdf |
| 中文 | zh | /zh/skill/pdf |
| 日文 | ja | /ja/skill/pdf |

### 2.3 Slug 规范

- 使用小写字母
- 使用连字符分隔单词
- 避免特殊字符
- 保持简短

示例: `pdf-form-filler`, `changelog-generator`

---

## 3. 多语言SEO

### 3.1 hreflang 实现

每个页面必须包含指向所有语言版本的 hreflang 标签：

```html
<link rel="alternate" hreflang="en" href="https://agent-skill.dev/en/skill/pdf" />
<link rel="alternate" hreflang="zh" href="https://agent-skill.dev/zh/skill/pdf" />
<link rel="alternate" hreflang="ja" href="https://agent-skill.dev/ja/skill/pdf" />
<link rel="alternate" hreflang="x-default" href="https://agent-skill.dev/en/skill/pdf" />
```

### 3.2 Next.js 实现

```typescript
// 在 generateMetadata 中
export async function generateMetadata({ params }): Promise<Metadata> {
  return {
    alternates: {
      canonical: `/${params.locale}/skill/${params.slug}`,
      languages: {
        en: `/en/skill/${params.slug}`,
        zh: `/zh/skill/${params.slug}`,
        ja: `/ja/skill/${params.slug}`,
      },
    },
  }
}
```

### 3.3 Sitemap 中的 hreflang

```typescript
// sitemap.ts
{
  url: `${baseUrl}/${locale}/skill/${skill.slug}`,
  alternates: {
    languages: {
      en: `${baseUrl}/en/skill/${skill.slug}`,
      zh: `${baseUrl}/zh/skill/${skill.slug}`,
      ja: `${baseUrl}/ja/skill/${skill.slug}`,
    },
  },
}
```

### 3.4 语言切换器

```html
<nav class="lang-switcher">
  <a href="/en/skill/pdf" hreflang="en">EN</a>
  <a href="/zh/skill/pdf" hreflang="zh">中文</a>
  <a href="/ja/skill/pdf" hreflang="ja">日本語</a>
</nav>
```

---

## 4. 页面SEO

### 4.1 Title 标签

| 页面类型 | 格式 | 示例 |
|---------|------|------|
| 首页 | {品牌口号} | Agent Skill Manager - AI技能的npm |
| 列表页 | {页面名} \| {品牌} | All AI Skills \| agent-skill.dev |
| 详情页 | {技能名} - AI Agent Skill \| {品牌} | PDF Form Filler - AI Agent Skill \| agent-skill.dev |
| 分类页 | {分类名} AI Skills \| {品牌} | Document Processing AI Skills \| agent-skill.dev |

**长度**: 50-60 字符

### 4.2 Meta Description

| 页面类型 | 格式 |
|---------|------|
| 首页 | 发现、安装、分享适用于 Claude、OpenAI Codex 等的 AI 代理技能。 |
| 详情页 | {描述}. 兼容 {平台}. 安装: askm install {id} |
| 分类页 | 浏览最佳的 {分类} AI 技能。支持 Claude、OpenAI Codex 等。 |

**长度**: 150-160 字符

### 4.3 标题层级

```html
<h1>PDF Form Filler</h1>                    <!-- 唯一的 H1 -->
<h2>使用场景</h2>                            <!-- 主要章节 -->
<h2>前置要求</h2>
<h2>兼容平台</h2>
<h2>相关技能</h2>
  <h3>Skill Name 1</h3>                      <!-- 相关技能标题 -->
  <h3>Skill Name 2</h3>
```

### 4.4 Open Graph

```typescript
openGraph: {
  title: skill.name,
  description: skill.description,
  url: `https://agent-skill.dev/${locale}/skill/${slug}`,
  siteName: 'Agent Skill Manager',
  type: 'article',
  images: [{
    url: `https://agent-skill.dev/og/${slug}.png`,
    width: 1200,
    height: 630,
    alt: skill.name,
  }],
  locale: locale,
}
```

---

## 5. 技术SEO

### 5.1 结构化数据 (Schema.org)

**技能页面使用 SoftwareApplication**:

```json
{
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  "name": "PDF Form Filler",
  "description": "Extract and fill PDF form fields using Python",
  "applicationCategory": "DeveloperApplication",
  "applicationSubCategory": "AI Agent Skill",
  "operatingSystem": "Cross-platform",
  "offers": {
    "@type": "Offer",
    "price": "0",
    "priceCurrency": "USD"
  },
  "author": {
    "@type": "Person",
    "name": "anthropics",
    "url": "https://github.com/anthropics"
  },
  "codeRepository": "https://github.com/anthropics/skills/tree/main/skills/pdf",
  "programmingLanguage": "Markdown"
}
```

**面包屑导航使用 BreadcrumbList**:

```json
{
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": [
    {
      "@type": "ListItem",
      "position": 1,
      "name": "Home",
      "item": "https://agent-skill.dev/en"
    },
    {
      "@type": "ListItem",
      "position": 2,
      "name": "Skills",
      "item": "https://agent-skill.dev/en/skills"
    },
    {
      "@type": "ListItem",
      "position": 3,
      "name": "PDF Form Filler",
      "item": "https://agent-skill.dev/en/skill/pdf"
    }
  ]
}
```

### 5.2 Sitemap

**配置**:

| 页面类型 | Priority | Change Frequency |
|---------|----------|-----------------|
| 首页 | 1.0 | daily |
| 技能列表 | 0.8 | daily |
| 技能详情 | 0.7 | weekly |
| 分类页 | 0.6 | weekly |
| 文档页 | 0.5 | monthly |

**大型站点处理** (超过 50,000 URL):

```typescript
// 使用 generateSitemaps 分割
export async function generateSitemaps() {
  const skillCount = await getSkillCount()
  const sitemapsNeeded = Math.ceil(skillCount / 50000)
  
  return Array.from({ length: sitemapsNeeded }, (_, i) => ({ id: i }))
}
```

### 5.3 robots.txt

```
User-agent: *
Allow: /
Disallow: /admin/
Disallow: /api/
Disallow: /_next/

Sitemap: https://agent-skill.dev/sitemap.xml
```

### 5.4 性能优化

| 指标 | 目标 |
|------|------|
| LCP (最大内容绘制) | < 2.5s |
| FID (首次输入延迟) | < 100ms |
| CLS (累积布局偏移) | < 0.1 |

**实现方法**:

- 使用 SSG 预生成页面
- 图片使用 next/image 优化
- 字体使用 next/font 预加载
- 启用 Cloudflare CDN 缓存

---

## 6. 程序化SEO

### 6.1 技能对比页

自动生成同类技能的对比页面：

**URL**: `/en/compare/pdf-vs-docx`

**Title**: `PDF vs DOCX - AI Skill Comparison | agent-skill.dev`

**内容结构**:

```markdown
# PDF vs DOCX: Which AI Skill is Better?

## Overview
| Feature | PDF | DOCX |
|---------|-----|------|
| Category | Document Processing | Document Processing |
| Author | anthropics | anthropics |
| Stars | 1000 | 800 |

## PDF Skill
{description}

## DOCX Skill  
{description}

## Comparison
- PDF is better for...
- DOCX is better for...

## Conclusion
Choose PDF if... Choose DOCX if...
```

**生成逻辑**:

```typescript
export async function generateStaticParams() {
  const skills = await getPopularSkills(50)
  
  const combinations = []
  for (let i = 0; i < skills.length; i++) {
    for (let j = i + 1; j < skills.length; j++) {
      // 只对比同类技能
      if (skills[i].category === skills[j].category) {
        combinations.push({
          skill1: skills[i].slug,
          skill2: skills[j].slug,
        })
      }
    }
  }
  
  return combinations
}
```

### 6.2 分类聚合页

为每个分类生成专门页面：

**URL**: `/en/category/document-processing`

**Title**: `Document Processing AI Skills - Best Agent Skills | agent-skill.dev`

**内容**:
- 分类介绍
- 该分类下所有技能列表
- 热门技能推荐
- 使用场景说明

### 6.3 作者页

为每个活跃作者生成页面：

**URL**: `/en/author/anthropics`

**Title**: `anthropics AI Skills | agent-skill.dev`

**内容**:
- 作者简介 (从 GitHub 获取)
- 该作者的所有技能
- 总 Star 数

---

## 7. 内链策略

### 7.1 链接结构

```
首页
├── 链接到所有分类页
├── 链接到热门技能 (Top 12)
└── 链接到技能列表

分类页
├── 链接到首页
├── 链接到该分类所有技能
└── 链接到相关分类

技能详情页
├── 面包屑: 首页 > 技能 > 分类 > 当前技能
├── 链接到作者页
├── 链接到分类页
├── 链接到相关技能 (同分类, 4个)
└── 链接到 GitHub 源码
```

### 7.2 面包屑导航

每个页面都需要面包屑：

```
首页 / Skills / Document Processing / PDF Form Filler
```

### 7.3 相关技能

技能详情页底部显示 4 个相关技能：

- 同分类
- 排除当前技能
- 按 Star 数排序

---

## 8. SEO检查清单

### 上线前检查

- [ ] 所有页面有唯一 Title (50-60字符)
- [ ] 所有页面有 Meta Description (150-160字符)
- [ ] 所有页面有正确的 hreflang 标签
- [ ] 所有页面有 canonical URL
- [ ] Sitemap 包含所有页面
- [ ] robots.txt 配置正确
- [ ] Schema.org 结构化数据有效
- [ ] 图片有 alt 属性
- [ ] 面包屑导航工作正常
- [ ] 内链结构完整

### 上线后检查

- [ ] 提交 Sitemap 到 Google Search Console
- [ ] 验证所有页面可被索引
- [ ] 检查 Core Web Vitals
- [ ] 监控搜索排名
- [ ] 分析搜索流量

---

*SEO策略 v1.0 | 更新时间: 2026-01-10*
