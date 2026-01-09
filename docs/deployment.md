# Cloudflare 部署指南

本文档详细说明如何将 agent-skill.dev 部署到 Cloudflare Workers + D1 + R2。

---

## 目录

1. [前置准备](#1-前置准备)
2. [Cloudflare 资源创建](#2-cloudflare-资源创建)
3. [Wrangler 配置](#3-wrangler-配置)
4. [环境变量配置](#4-环境变量配置)
5. [数据库迁移](#5-数据库迁移)
6. [部署流程](#6-部署流程)
7. [域名配置](#7-域名配置)
8. [定时抓取任务](#8-定时抓取任务)
9. [监控与日志](#9-监控与日志)
10. [常见问题](#10-常见问题)

---

## 1. 前置准备

### 1.1 账户要求

- **Cloudflare 账户**: 需要 Workers Paid Plan ($5/月)
- **域名**: `agent-skill.dev` 已转移到 Cloudflare DNS

### 1.2 安装工具

```bash
# 安装 Wrangler CLI
npm install -g wrangler

# 登录 Cloudflare
wrangler login

# 验证登录状态
wrangler whoami
```

### 1.3 获取账户信息

```bash
# 获取 Account ID
wrangler config

# 或在 Cloudflare Dashboard 查看
# dashboard.cloudflare.com → Overview → 右侧边栏 "Account ID"
```

---

## 2. Cloudflare 资源创建

### 2.1 创建 D1 数据库

```bash
# 创建生产数据库
wrangler d1 create agent-skill-db

# 输出示例:
# ✅ Successfully created DB 'agent-skill-db'
# database_id = "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
```

记下 `database_id`，后续配置需要使用。

### 2.2 创建 R2 存储桶

```bash
# 创建存储桶 (用于媒体文件)
wrangler r2 bucket create agent-skill-media

# 输出示例:
# ✅ Created bucket 'agent-skill-media'
```

### 2.3 创建 KV 命名空间 (可选，用于缓存)

```bash
# 创建 KV 命名空间
wrangler kv namespace create CACHE

# 输出示例:
# ✅ Successfully created KV namespace "CACHE"
# id = "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
```

---

## 3. Wrangler 配置

### 3.1 创建 wrangler.toml

在项目根目录创建 `wrangler.toml`:

```toml
name = "agent-skill-web"
main = "src/index.ts"
compatibility_date = "2024-11-01"
compatibility_flags = ["nodejs_compat"]

# 账户配置
account_id = "YOUR_ACCOUNT_ID"

# Workers 配置
workers_dev = false
route = { pattern = "agent-skill.dev/*", zone_name = "agent-skill.dev" }

# D1 数据库绑定
[[d1_databases]]
binding = "D1"
database_name = "agent-skill-db"
database_id = "YOUR_DATABASE_ID"

# R2 存储绑定
[[r2_buckets]]
binding = "R2"
bucket_name = "agent-skill-media"

# KV 绑定 (可选)
# [[kv_namespaces]]
# binding = "CACHE"
# id = "YOUR_KV_NAMESPACE_ID"

# 环境变量 (非敏感)
[vars]
NODE_ENV = "production"
PAYLOAD_PUBLIC_SERVER_URL = "https://agent-skill.dev"

# 静态资源
[site]
bucket = "./dist"

# 构建配置
[build]
command = "pnpm build"
```

### 3.2 多环境配置

如需区分开发/生产环境，添加环境配置：

```toml
# 生产环境 (默认)
[env.production]
route = { pattern = "agent-skill.dev/*", zone_name = "agent-skill.dev" }

[[env.production.d1_databases]]
binding = "D1"
database_name = "agent-skill-db"
database_id = "PROD_DATABASE_ID"

# 预览/开发环境
[env.preview]
route = { pattern = "preview.agent-skill.dev/*", zone_name = "agent-skill.dev" }

[[env.preview.d1_databases]]
binding = "D1"
database_name = "agent-skill-db-preview"
database_id = "PREVIEW_DATABASE_ID"
```

---

## 4. 环境变量配置

### 4.1 敏感变量 (使用 Secrets)

```bash
# Payload CMS 密钥
wrangler secret put PAYLOAD_SECRET
# 输入: (粘贴 openssl rand -hex 32 生成的值)

# Google AI API Key
wrangler secret put GOOGLE_AI_API_KEY
# 输入: (粘贴 Gemini API Key)

# GitHub Token
wrangler secret put GITHUB_TOKEN
# 输入: (粘贴 GitHub PAT)

# 抓取 API 密钥
wrangler secret put CRAWL_SECRET
# 输入: (随机生成的密钥)
```

### 4.2 验证 Secrets

```bash
# 列出已配置的 secrets
wrangler secret list
```

### 4.3 本地开发环境

创建 `.dev.vars` 文件 (本地开发使用，不提交到 Git):

```env
PAYLOAD_SECRET=dev-secret-for-local-only
GOOGLE_AI_API_KEY=your-gemini-api-key
GITHUB_TOKEN=your-github-pat
CRAWL_SECRET=dev-crawl-secret
```

---

## 5. 数据库迁移

### 5.1 生成迁移文件

```bash
# 生成 Payload CMS 迁移
pnpm payload migrate:create

# 迁移文件会生成在 src/migrations/ 目录
```

### 5.2 本地测试迁移

```bash
# 使用本地 D1 模拟
wrangler d1 migrations apply agent-skill-db --local
```

### 5.3 应用到生产

```bash
# 应用迁移到生产数据库
wrangler d1 migrations apply agent-skill-db

# 或直接执行 SQL
wrangler d1 execute agent-skill-db --file=./src/migrations/xxx_migration.sql
```

### 5.4 查看数据库状态

```bash
# 查看表结构
wrangler d1 execute agent-skill-db --command="SELECT name FROM sqlite_master WHERE type='table'"

# 查看数据
wrangler d1 execute agent-skill-db --command="SELECT COUNT(*) FROM skills"
```

---

## 6. 部署流程

### 6.1 首次部署

```bash
# 1. 安装依赖
pnpm install

# 2. 生成 TypeScript 类型
pnpm payload generate:types

# 3. 构建项目
pnpm build

# 4. 部署
wrangler deploy
```

### 6.2 部署输出

```bash
# 成功输出示例:
# ✨ Successfully published your script to the following routes:
#   - agent-skill.dev/*
```

### 6.3 CI/CD 自动部署

创建 `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Cloudflare Workers

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    name: Deploy
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          
      - name: Setup pnpm
        uses: pnpm/action-setup@v2
        with:
          version: 8
          
      - name: Install dependencies
        run: pnpm install
        
      - name: Generate types
        run: pnpm payload generate:types
        
      - name: Build
        run: pnpm build
        
      - name: Deploy to Cloudflare Workers
        uses: cloudflare/wrangler-action@v3
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          accountId: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
```

### 6.4 GitHub Secrets 配置

在 GitHub 仓库 Settings → Secrets 添加:

| Secret 名称 | 说明 |
|------------|------|
| `CLOUDFLARE_API_TOKEN` | Cloudflare API Token (需要 Workers 编辑权限) |
| `CLOUDFLARE_ACCOUNT_ID` | Cloudflare Account ID |

创建 API Token:
1. 访问 https://dash.cloudflare.com/profile/api-tokens
2. 创建 Token → 使用模板 "Edit Cloudflare Workers"
3. 复制 Token

---

## 7. 域名配置

### 7.1 添加域名到 Cloudflare

1. 登录 Cloudflare Dashboard
2. 添加站点 → 输入 `agent-skill.dev`
3. 更新域名注册商的 Nameservers

### 7.2 DNS 记录配置

```
# Workers 路由会自动处理，无需手动添加 A/AAAA 记录
# 但如果需要，可以添加:

Type    Name    Content           Proxy
AAAA    @       100::              ✅
AAAA    www     100::              ✅
```

### 7.3 SSL/TLS 配置

1. SSL/TLS → 概述 → 选择 "Full (strict)"
2. 边缘证书 → 始终使用 HTTPS: 开启
3. 自动 HTTPS 重写: 开启

### 7.4 缓存配置

创建 Page Rules 或使用 Cache Rules:

```
# 静态资源缓存 30 天
URL: agent-skill.dev/_next/static/*
Cache Level: Cache Everything
Edge TTL: 30 days

# API 不缓存
URL: agent-skill.dev/api/*
Cache Level: Bypass
```

---

## 8. 定时抓取任务

### 8.1 使用 Cron Triggers

在 `wrangler.toml` 添加:

```toml
# 定时触发器
[triggers]
crons = ["0 0 * * *"]  # 每天 UTC 00:00 运行
```

### 8.2 处理定时任务

在 Worker 入口添加定时处理:

```typescript
// src/index.ts
export default {
  async fetch(request: Request, env: Env) {
    // 正常请求处理
    return handleRequest(request, env)
  },
  
  async scheduled(event: ScheduledEvent, env: Env, ctx: ExecutionContext) {
    // 定时任务: 抓取技能
    ctx.waitUntil(crawlSkills(env))
  },
}

async function crawlSkills(env: Env) {
  const response = await fetch('https://agent-skill.dev/api/crawl', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${env.CRAWL_SECRET}`,
    },
  })
  
  console.log('Crawl result:', await response.json())
}
```

### 8.3 手动触发抓取

```bash
# 通过 API 手动触发
curl -X POST https://agent-skill.dev/api/crawl \
  -H "Authorization: Bearer YOUR_CRAWL_SECRET"
```

---

## 9. 监控与日志

### 9.1 查看实时日志

```bash
# 实时查看 Worker 日志
wrangler tail

# 带过滤的日志
wrangler tail --format=pretty
```

### 9.2 Cloudflare Analytics

1. Workers & Pages → agent-skill-web → Metrics
2. 查看:
   - 请求数量
   - CPU 时间
   - 错误率
   - 地理分布

### 9.3 自定义监控

添加 Logpush 集成:

1. Analytics → Logpush → 创建作业
2. 选择 Workers 日志
3. 目标: R2 / S3 / HTTP endpoint

### 9.4 告警设置

1. 通知 → 创建通知
2. 类型: Workers
3. 条件: 错误率 > 5%, CPU 使用率 > 80%

---

## 10. 常见问题

### 10.1 部署失败

**问题**: `Error: Script too large`

**解决**: 
```bash
# 检查构建产物大小
du -sh dist/

# 优化: 启用压缩
# 在 next.config.js 添加:
# output: 'standalone'
```

### 10.2 数据库连接失败

**问题**: `D1_ERROR: no such table: skills`

**解决**:
```bash
# 确认迁移已应用
wrangler d1 execute agent-skill-db --command="SELECT name FROM sqlite_master WHERE type='table'"

# 重新运行迁移
wrangler d1 migrations apply agent-skill-db
```

### 10.3 环境变量未生效

**问题**: `Error: Missing PAYLOAD_SECRET`

**解决**:
```bash
# 检查 secrets
wrangler secret list

# 重新设置
wrangler secret put PAYLOAD_SECRET
```

### 10.4 R2 上传失败

**问题**: `R2Error: The bucket does not exist`

**解决**:
```bash
# 确认 bucket 存在
wrangler r2 bucket list

# 创建 bucket
wrangler r2 bucket create agent-skill-media

# 检查 wrangler.toml 绑定名称
```

### 10.5 冷启动慢

**问题**: 首次请求响应慢 (>500ms)

**解决**:
1. 启用 Smart Placement (自动)
2. 使用预热请求:
```bash
# 每分钟发送预热请求 (可用外部服务如 UptimeRobot)
curl https://agent-skill.dev/api/health
```

### 10.6 Workers 限制

| 限制 | 免费版 | 付费版 |
|------|--------|--------|
| CPU 时间/请求 | 10ms | 30s |
| 请求体大小 | 100MB | 100MB |
| 子请求数 | 50 | 1000 |
| KV 操作 | 1000/天 | 无限制 |

---

## 快速命令参考

```bash
# 登录
wrangler login

# 部署
wrangler deploy

# 查看日志
wrangler tail

# 数据库操作
wrangler d1 execute agent-skill-db --command="SQL"
wrangler d1 migrations apply agent-skill-db

# Secrets
wrangler secret put SECRET_NAME
wrangler secret list

# R2
wrangler r2 bucket list
wrangler r2 bucket create BUCKET_NAME

# 本地开发
wrangler dev
```

---

*部署指南 v1.0 | 更新时间: 2026-01-10*
