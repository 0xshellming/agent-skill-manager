# 技术架构

## 系统架构图

```
┌─────────────────────────────────────────────────────────────────────┐
│                         agent-skill.dev                              │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │                    前端层 (Next.js 15)                          │ │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐ │ │
│  │  │ 首页         │  │ 技能详情页   │  │ 技能列表/分类页      │ │ │
│  │  │ /[locale]    │  │ /skill/[slug]│  │ /skills, /category/* │ │ │
│  │  └──────────────┘  └──────────────┘  └──────────────────────┘ │ │
│  │                                                                │ │
│  │  特性: SSG静态生成 | 多语言(en/zh/ja) | SEO优化               │ │
│  └────────────────────────────────────────────────────────────────┘ │
│                                 │                                    │
│                                 ▼                                    │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │                    CMS层 (Payload CMS 3.0)                      │ │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐ │ │
│  │  │ Skills       │  │ Categories   │  │ Media                │ │ │
│  │  │ Collection   │  │ Collection   │  │ Collection           │ │ │
│  │  └──────────────┘  └──────────────┘  └──────────────────────┘ │ │
│  │                                                                │ │
│  │  特性: 自动管理数据库 | 内置多语言 | Admin管理后台            │ │
│  └────────────────────────────────────────────────────────────────┘ │
│                                 │                                    │
│                                 ▼                                    │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │                    数据层 (Cloudflare)                          │ │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐ │ │
│  │  │ Workers      │  │ D1 (SQLite)  │  │ R2 (对象存储)        │ │ │
│  │  │ 边缘计算     │  │ 数据库       │  │ 媒体文件             │ │ │
│  │  └──────────────┘  └──────────────┘  └──────────────────────┘ │ │
│  └────────────────────────────────────────────────────────────────┘ │
│                                 │                                    │
│                                 ▼                                    │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │                    数据抓取层                                    │ │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐ │ │
│  │  │ GitHub API   │  │ Gemini 2.5   │  │ Cloudflare Cron      │ │ │
│  │  │ 获取SKILL.md │  │ Flash解析    │  │ 定时任务(每6小时)    │ │ │
│  │  └──────────────┘  └──────────────┘  └──────────────────────┘ │ │
│  └────────────────────────────────────────────────────────────────┘ │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 技术选型

### 核心框架

| 组件 | 技术选择 | 选择理由 |
|------|---------|---------|
| **CMS** | Payload CMS 3.0 | 自动管理数据库、内置多语言、TypeScript优先 |
| **前端** | Next.js 15 (App Router) | SSG支持、SEO友好、与Payload深度集成 |
| **数据库** | Cloudflare D1 | Payload原生支持、无需手写SQL、免费额度大 |
| **存储** | Cloudflare R2 | 零出口费用、与D1同一生态 |
| **边缘计算** | Cloudflare Workers | 全球边缘部署、低延迟 |

### AI 解析

| 组件 | 技术选择 | 选择理由 |
|------|---------|---------|
| **AI SDK** | Vercel AI SDK | 统一接口、支持结构化输出 |
| **模型** | Gemini 2.5 Flash | 便宜($0.075/1M tokens)、快速、支持JSON输出 |
| **Schema** | Zod | 类型安全、与AI SDK深度集成 |

### 为什么选择 Payload CMS?

1. **无需手写SQL**: Collection定义 → 自动生成表结构
2. **内置多语言**: `localized: true` 一行代码开启
3. **Admin后台**: 开箱即用的内容管理界面
4. **Cloudflare原生支持**: 官方模板一键部署
5. **TypeScript优先**: 类型安全、自动生成类型

### 为什么选择 Gemini 2.5 Flash?

1. **结构化输出**: 原生支持JSON Schema
2. **成本低**: 比GPT-4便宜10倍以上
3. **速度快**: 适合批量处理
4. **多语言翻译**: 一次调用同时生成中日文翻译

---

## 数据流

### 技能抓取流程

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│ GitHub API  │────▶│ 获取SKILL.md│────▶│ 原始内容    │
└─────────────┘     └─────────────┘     └─────────────┘
                                               │
                                               ▼
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│ 存入Payload │◀────│ 结构化JSON  │◀────│ Gemini解析  │
│ (D1数据库)  │     │ + 中日翻译  │     │             │
└─────────────┘     └─────────────┘     └─────────────┘
```

### 页面渲染流程

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│ 用户访问    │────▶│ Cloudflare  │────▶│ 静态页面    │
│ /skill/pdf  │     │ Edge Cache  │     │ (SSG预生成) │
└─────────────┘     └─────────────┘     └─────────────┘
                           │
                           ▼ (缓存未命中)
                    ┌─────────────┐
                    │ Payload API │
                    │ + D1 查询   │
                    └─────────────┘
```

---

## 项目结构

```
agent-skill-web/
├── src/
│   ├── app/                          # Next.js App Router
│   │   ├── (frontend)/               # 前台页面
│   │   │   └── [locale]/             # 多语言路由
│   │   │       ├── page.tsx          # 首页
│   │   │       ├── skills/           # 技能列表
│   │   │       ├── skill/[slug]/     # 技能详情
│   │   │       └── category/[cat]/   # 分类页
│   │   ├── (payload)/                # Payload Admin (自动生成)
│   │   ├── api/
│   │   │   └── crawl/route.ts        # 抓取API
│   │   ├── sitemap.ts                # 动态Sitemap
│   │   └── robots.ts                 # robots.txt
│   │
│   ├── collections/                   # Payload Collections
│   │   ├── Skills.ts                 # 技能集合
│   │   ├── Categories.ts             # 分类集合
│   │   ├── Users.ts                  # 用户集合
│   │   └── Media.ts                  # 媒体集合
│   │
│   ├── lib/                          # 工具库
│   │   ├── skill-parser.ts           # Gemini AI解析器
│   │   ├── github.ts                 # GitHub API工具
│   │   └── skill-crawler.ts          # 抓取编排器
│   │
│   └── payload.config.ts             # Payload配置
│
├── wrangler.toml                     # Cloudflare配置
├── package.json
└── tsconfig.json
```

---

## 关键设计决策

### 1. 为什么不用独立数据库?

**决策**: 使用 Payload CMS + D1，而非独立的 PostgreSQL/MySQL

**理由**:
- Payload 自动管理 Schema 迁移
- D1 免费额度足够 (25B 读取/月)
- 无需维护数据库服务器
- 与 Cloudflare 生态深度集成

### 2. 为什么用 AI 解析而非正则?

**决策**: 使用 Gemini 2.5 Flash 解析 SKILL.md

**理由**:
- SKILL.md 格式不统一 (YAML frontmatter 可能缺失)
- README 结构多样，难以用正则提取
- AI 可同时完成翻译，省去翻译API调用
- 成本极低 (~$0.0001/次)

### 3. 为什么选择 SSG?

**决策**: 技能页面使用静态生成 (SSG)

**理由**:
- SEO 最佳实践
- 首屏加载速度快
- 减少 Workers 计算消耗
- 使用 ISR 支持增量更新

### 4. 多语言方案

**决策**: 使用 `/[locale]/` 子目录结构

**理由**:
- SEO 最佳实践 (Google 推荐)
- 便于实现 hreflang
- Payload 原生支持
- 无需 DNS 配置子域名

---

## 性能优化

### 边缘缓存策略

```
静态资源 (JS/CSS/图片)
├── Cache-Control: public, max-age=31536000, immutable
└── 位置: Cloudflare CDN 全球边缘

HTML 页面 (SSG)
├── Cache-Control: public, max-age=3600, s-maxage=86400
└── 位置: Cloudflare Edge + D1 读取副本

API 响应
├── Cache-Control: private, max-age=0
└── 位置: Workers 动态计算
```

### 数据库优化

```typescript
// Skills Collection 索引
indexes: [
  { fields: { category: 1 } },      // 分类筛选
  { fields: { author: 1 } },        // 作者页
  { fields: { stars: -1 } },        // 热门排序
  { fields: { slug: 1 }, unique: true }, // 快速查找
]
```

---

## 安全考虑

### API 保护

```typescript
// 抓取 API 需要密钥
const authHeader = request.headers.get('authorization')
if (authHeader !== `Bearer ${env.CRAWL_SECRET}`) {
  return new Response('Unauthorized', { status: 401 })
}
```

### 环境变量

```bash
# 敏感信息使用 wrangler secret
wrangler secret put PAYLOAD_SECRET
wrangler secret put GOOGLE_AI_API_KEY
wrangler secret put GITHUB_TOKEN
wrangler secret put CRAWL_SECRET
```

### 内容安全

- 只从白名单仓库抓取数据
- AI 解析后进行数据验证
- XSS 防护 (Payload 自动转义)

---

## 扩展性

### 未来扩展点

1. **CLI 工具**: 发布 `askm` 到 npm
2. **用户系统**: GitHub OAuth 登录
3. **技能提交**: 用户自助提交技能
4. **评分系统**: 基于使用量的评分
5. **API 服务**: 为第三方提供 REST API

### 水平扩展

- Cloudflare Workers 自动扩展
- D1 读取副本提升查询性能
- R2 无限存储容量

---

*架构文档 v1.0 | 更新时间: 2026-01-10*
