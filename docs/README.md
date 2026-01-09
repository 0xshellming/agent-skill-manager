# Agent Skill Manager 技术文档

> **项目**: agent-skill.dev  
> **定位**: AI Agent 技能的 npm - 发现、安装、分享 AI 代理技能  
> **技术栈**: Payload CMS + Cloudflare (Workers/D1/R2) + Gemini 2.5 Flash

---

## 📚 文档目录

| 文档 | 说明 |
|------|------|
| [技术架构](./architecture.md) | 系统架构设计与技术选型 |
| [实施指南](./implementation-guide.md) | 详细的实施步骤与代码示例 |
| [SEO策略](./seo-strategy.md) | SEO优化方案与关键词策略 |
| [数据源](./data-sources.md) | 技能数据来源与抓取方案 |
| [部署指南](./deployment.md) | Cloudflare 部署流程 |
| [CLI工具](./cli-tool.md) | askm 命令行工具设计 |

---

## 🎯 项目目标

1. **SEO优先**: 通过搜索引擎获取自然流量
2. **成本优先**: 月成本控制在 $10 以内
3. **多语言**: 支持英文、中文、日文
4. **开源友好**: 从 GitHub 仓库抓取技能数据

---

## 💰 成本预估

| 服务 | 月成本 |
|------|--------|
| Cloudflare Workers (Paid Plan) | $5 |
| Cloudflare D1 | ~$0 (免费额度) |
| Cloudflare R2 | ~$0.15 |
| Gemini 2.5 Flash | ~$0.50 |
| 域名 (agent-skill.dev) | ~$1.25 |
| **总计** | **~$7/月** |

---

## 🚀 快速开始

```bash
# 1. 创建项目
npx create-payload-app@latest agent-skill-web --template with-cloudflare-d1

# 2. 安装依赖
cd agent-skill-web
pnpm add ai @ai-sdk/google zod

# 3. 本地开发
pnpm dev

# 4. 部署
pnpm wrangler login
pnpm deploy
```

---

## 📅 实施计划

| 阶段 | 天数 | 内容 |
|------|------|------|
| Phase 1 | 1天 | 项目搭建、Payload CMS 配置 |
| Phase 2 | 1天 | 定义 Collections、数据库迁移 |
| Phase 3 | 1-2天 | AI 解析器、数据抓取 |
| Phase 4 | 1-2天 | 前端页面开发 |
| Phase 5 | 1天 | SEO 优化 |
| Phase 6 | 0.5天 | 部署上线 |
| Phase 7 | 0.5天 | 定时任务配置 |
| **总计** | **5-7天** | |

---

*文档版本: v1.0*  
*更新时间: 2026-01-10*
