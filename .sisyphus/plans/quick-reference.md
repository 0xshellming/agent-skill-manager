# Agent Skill Manager - Quick Reference

## Project Info
- **Domain**: agent-skill.dev
- **Tech Stack**: Payload CMS + Cloudflare + Gemini 2.5 Flash
- **Repository**: agent-skill-manager

---

## Quick Start Commands

```bash
# 1. Create project
npx create-payload-app@latest agent-skill-web --template with-cloudflare-d1
cd agent-skill-web

# 2. Install dependencies
pnpm add ai @ai-sdk/google zod

# 3. Local development
pnpm dev

# 4. Deploy
pnpm wrangler login
wrangler d1 create agent-skill-db
wrangler r2 bucket create agent-skill-assets
pnpm deploy

# 5. Trigger crawl
curl -X POST https://agent-skill.dev/api/crawl -H "Authorization: Bearer $CRAWL_SECRET"
```

---

## File Structure (Key Files to Create)

```
src/
├── collections/
│   ├── Skills.ts          # Skill collection definition
│   └── Categories.ts      # Category collection
├── lib/
│   ├── skill-parser.ts    # Gemini AI parser
│   ├── github.ts          # GitHub API utils
│   └── skill-crawler.ts   # Crawl orchestrator
├── app/
│   ├── (frontend)/
│   │   └── [locale]/
│   │       ├── page.tsx           # Homepage
│   │       ├── skills/page.tsx    # Skills list
│   │       └── skill/[slug]/page.tsx  # Skill detail
│   ├── api/
│   │   └── crawl/route.ts  # Crawl API endpoint
│   ├── sitemap.ts
│   └── robots.ts
└── payload.config.ts       # Payload configuration
```

---

## Data Sources

| Source | URL | Skills Path |
|--------|-----|-------------|
| Anthropic | github.com/anthropics/skills | skills/ |
| OpenAI | github.com/openai/skills | skills/.curated, skills/.system |
| Composio | github.com/ComposioHQ/awesome-claude-skills | root directories |

---

## Environment Variables

```env
# Required
PAYLOAD_SECRET=<openssl rand -hex 32>
GOOGLE_AI_API_KEY=<gemini-api-key>
GITHUB_TOKEN=<github-pat>
CRAWL_SECRET=<random-secret>

# Cloudflare (auto-set by wrangler)
CLOUDFLARE_ACCOUNT_ID=
CLOUDFLARE_API_TOKEN=
```

---

## Deployment Checklist

- [ ] Domain purchased (agent-skill.dev)
- [ ] Cloudflare account created
- [ ] D1 database created
- [ ] R2 bucket created
- [ ] Secrets configured
- [ ] Custom domain connected
- [ ] Initial crawl executed
- [ ] Sitemap submitted to Google

---

## Key Decisions

| Decision | Choice | Reason |
|----------|--------|--------|
| CMS | Payload CMS | Auto-manages D1, built-in i18n |
| Database | Cloudflare D1 | Managed by Payload, no SQL needed |
| AI Parser | Gemini 2.5 Flash | Cheap, fast, structured output |
| Hosting | Cloudflare Workers | Low cost, global edge |
| Data Source | GitHub repos | Official skill repositories |

---

## Cost Breakdown

| Service | Cost/Month |
|---------|------------|
| Cloudflare Workers | $5 |
| D1/R2 | ~$0.15 |
| Gemini Flash | ~$0.50 |
| Domain | ~$1.25 |
| **Total** | **~$7** |

---

## Timeline

| Phase | Days | Tasks |
|-------|------|-------|
| 1 | 1 | Project setup, Payload config |
| 2 | 1 | Collections, migrations |
| 3 | 1-2 | AI parser, crawler |
| 4 | 1-2 | Frontend pages |
| 5 | 1 | SEO (sitemap, meta, schema) |
| 6 | 0.5 | Deployment |
| 7 | 0.5 | Cron setup |
| **Total** | **5-7** | |

---

## Support Resources

- Payload CMS Docs: https://payloadcms.com/docs
- Cloudflare D1: https://developers.cloudflare.com/d1/
- Vercel AI SDK: https://sdk.vercel.ai/docs
- Gemini API: https://ai.google.dev/docs

---

*Quick reference for agent-skill.dev implementation*
