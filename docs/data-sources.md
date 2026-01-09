# 数据源

本文档说明 agent-skill.dev 的技能数据来源和抓取策略。

---

## 数据源概览

### Awesome Lists / Collections (数据源列表)

| 数据源                                                                                      | Stars    | 技能数量 | 格式     | 优先级       |
| ------------------------------------------------------------------------------------------- | -------- | -------- | -------- | ------------ |
| [anthropics/skills](https://github.com/anthropics/skills)                                   | 36.4k ⭐ | ~15+     | SKILL.md | ⭐⭐⭐⭐⭐⭐ |
| [ComposioHQ/awesome-claude-skills](https://github.com/ComposioHQ/awesome-claude-skills)     | 16.8k ⭐ | ~25+     | SKILL.md | ⭐⭐⭐⭐⭐⭐ |
| [openai/skills](https://github.com/openai/skills)                                           | 1.4k ⭐  | ~20+     | SKILL.md | ⭐⭐⭐⭐     |
| [karanb192/awesome-claude-skills](https://github.com/karanb192/awesome-claude-skills)       | -        | 50+      | SKILL.md | ⭐⭐⭐⭐⭐   |
| [heilcheng/awesome-agent-skills](https://github.com/heilcheng/awesome-agent-skills)         | -        | 动态     | SKILL.md | ⭐⭐⭐⭐     |
| [skillmatic-ai/awesome-agent-skills](https://github.com/skillmatic-ai/awesome-agent-skills) | -        | 动态     | SKILL.md | ⭐⭐⭐⭐     |
| GitHub Topic: agent-skill                                                                   | -        | 动态     | 各种     | ⭐⭐⭐       |

---

## 1. Anthropic 官方技能

### 仓库信息

- **地址**: https://github.com/anthropics/skills
- **分支**: main
- **技能路径**: `skills/`
- **格式**: 每个子目录包含 `SKILL.md`

### 目录结构

```
anthropics/skills/
├── skills/
│   ├── docx/
│   │   └── SKILL.md
│   ├── pdf/
│   │   └── SKILL.md
│   ├── pptx/
│   │   └── SKILL.md
│   ├── xlsx/
│   │   └── SKILL.md
│   └── ...
├── spec/                    # Agent Skills 规范
├── template/                # 技能模板
└── README.md
```

### 包含的技能分类

- **文档处理**: docx, pdf, pptx, xlsx
- **开发工具**: artifacts-builder
- **其他**: 品牌指南、设计等

### 特殊说明

- 文档处理技能 (docx, pdf, pptx, xlsx) 是 **source-available**，非开源
- 其他技能使用 Apache 2.0 许可

---

## 2. OpenAI 官方技能

### 仓库信息

- **地址**: https://github.com/openai/skills
- **分支**: main
- **技能路径**:
  - `skills/.system/` (系统技能)
  - `skills/.curated/` (精选技能)
  - `skills/.experimental/` (实验技能)

### 目录结构

```
openai/skills/
├── skills/
│   ├── .system/
│   │   ├── $chat/
│   │   ├── $git/
│   │   └── ...
│   ├── .curated/
│   │   ├── gh-address-comments/
│   │   └── ...
│   └── .experimental/
│       ├── create-plan/
│       └── ...
└── README.md
```

### 安装方式

OpenAI 技能设计用于 Codex CLI：

```bash
# 安装精选技能
$skill-installer gh-address-comments

# 安装实验技能
$skill-installer install the create-plan skill from the .experimental folder
```

### 特殊说明

- 与 Anthropic 的 SKILL.md 格式兼容
- 许可证在每个技能目录的 `LICENSE.txt` 中

---

## 3. Composio Awesome List

### 仓库信息

- **地址**: https://github.com/ComposioHQ/awesome-claude-skills
- **分支**: master
- **技能路径**: 根目录 (每个目录是一个技能)

### 目录结构

```
ComposioHQ/awesome-claude-skills/
├── artifacts-builder/
│   └── SKILL.md
├── brand-guidelines/
│   └── SKILL.md
├── canvas-design/
│   └── SKILL.md
├── changelog-generator/
│   └── SKILL.md
├── ... (25+ 技能)
├── README.md                 # 包含外部技能链接
└── CONTRIBUTING.md
```

### README 中的外部链接

README.md 包含指向其他仓库的技能链接：

```markdown
- [docx](https://github.com/anthropics/skills/tree/main/skills/docx) - Create, edit...
- [aws-skills](https://github.com/zxkane/aws-skills) - AWS development...
```

### 抓取策略

1. 抓取根目录的所有技能文件夹
2. 解析 README.md 中的外部链接
3. 去重 (避免重复抓取 anthropics/skills)

---

## 4. GitHub Topic 发现

### 搜索策略

使用 GitHub Search API 发现新技能：

```bash
# 搜索带有 agent-skill topic 的仓库
https://api.github.com/search/repositories?q=topic:agent-skill

# 搜索带有 claude-skill topic 的仓库
https://api.github.com/search/repositories?q=topic:claude-skill
```

### 验证条件

发现的仓库需满足：

1. 包含 `SKILL.md` 文件
2. Stars > 5 (过滤低质量)
3. 最近 6 个月有更新
4. 非 fork 仓库

---

## 5. SKILL.md 格式规范

### 标准格式

```markdown
---
name: skill-name
description: A clear description of what this skill does
---

# Skill Name

Detailed description and instructions...

## When to Use

- Use case 1
- Use case 2

## Instructions

[Detailed instructions for AI]

## Examples

[Usage examples]
```

### YAML Frontmatter 字段

| 字段        | 必需 | 说明       |
| ----------- | ---- | ---------- |
| name        | ✅   | 技能标识符 |
| description | ✅   | 简短描述   |
| author      | ❌   | 作者名     |
| version     | ❌   | 版本号     |
| license     | ❌   | 许可证     |
| tags        | ❌   | 标签数组   |

### 非标准格式处理

部分技能没有标准 frontmatter，使用 AI 解析：

- 从标题提取名称
- 从首段提取描述
- 从内容推断分类

---

## 6. 抓取流程

### 流程图

```
┌─────────────────┐
│ Cloudflare Cron │
│ (每6小时)        │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ 遍历数据源       │
│ - anthropics    │
│ - openai        │
│ - ComposioHQ    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ GitHub API      │
│ 获取目录列表     │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ 获取 SKILL.md   │
│ 获取 README.md  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Gemini 2.5 Flash│
│ 解析 + 翻译      │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Payload CMS     │
│ 存入 D1 数据库   │
└─────────────────┘
```

### 抓取配置

```typescript
const SKILL_SOURCES = [
  {
    owner: 'anthropics',
    repo: 'skills',
    skillsPath: 'skills',
    branch: 'main',
  },
  {
    owner: 'openai',
    repo: 'skills',
    skillsPath: 'skills/.curated',
    branch: 'main',
  },
  {
    owner: 'openai',
    repo: 'skills',
    skillsPath: 'skills/.system',
    branch: 'main',
  },
  {
    owner: 'ComposioHQ',
    repo: 'awesome-claude-skills',
    skillsPath: '',
    branch: 'master',
  },
]
```

### 速率限制

| 服务       | 限制             | 处理方式   |
| ---------- | ---------------- | ---------- |
| GitHub API | 5000/小时 (认证) | 使用 Token |
| Gemini API | 1500/分钟        | 500ms 间隔 |

---

## 7. 数据更新策略

### 更新频率

| 数据类型            | 更新频率 |
| ------------------- | -------- |
| 技能内容 (SKILL.md) | 每6小时  |
| Star 数             | 每6小时  |
| 新技能发现          | 每6小时  |

### 增量更新

```typescript
// 检查是否需要更新
const existing = await payload.find({
  collection: 'skills',
  where: { slug: { equals: skillSlug } },
})

if (existing.docs.length > 0) {
  // 更新现有记录
  await payload.update({
    collection: 'skills',
    id: existing.docs[0].id,
    data: skillData,
  })
} else {
  // 创建新记录
  await payload.create({
    collection: 'skills',
    data: skillData,
  })
}
```

### 删除策略

- 暂不自动删除技能
- 手动在 Admin 后台删除
- 未来: 标记 "已归档" 状态

---

## 8. 数据质量

### AI 解析验证

Gemini 返回的数据通过 Zod Schema 验证：

```typescript
const SkillSchema = z.object({
  name: z.string().min(1),
  description: z.string().min(10),
  category: z.enum([...]),
  tags: z.array(z.string()).max(5),
  // ...
})
```

### 错误处理

```typescript
try {
  const parsed = await parseSkillWithAI(skillMd, readme, repoInfo)
  // 保存
} catch (error) {
  console.error(`解析失败: ${skillDir}`, error)
  // 记录失败，继续下一个
  totalFailed++
}
```

### 手动审核

- 首次抓取后在 Admin 后台审核
- 检查分类是否正确
- 检查翻译质量
- 修正错误数据

---

## 9. 更多 Agent Skills 相关仓库

### 9.1 Awesome Lists (精选列表)

| 仓库                                                                                        | Stars   | 特点                        | 可抓取 |
| ------------------------------------------------------------------------------------------- | ------- | --------------------------- | ------ |
| [karanb192/awesome-claude-skills](https://github.com/karanb192/awesome-claude-skills)       | -       | 50+ 验证的 Claude Skills    | ✅     |
| [VoltAgent/awesome-claude-skills](https://github.com/VoltAgent/awesome-claude-skills)       | -       | Claude Skills 资源列表      | ✅     |
| [heilcheng/awesome-agent-skills](https://github.com/heilcheng/awesome-agent-skills)         | -       | 通用 AI 编程 agent 技能列表 | ❌     |
| [skillmatic-ai/awesome-agent-skills](https://github.com/skillmatic-ai/awesome-agent-skills) | -       | Agent Skills 理论与实践     | ❌     |
| [BehiSecc/awesome-claude-skills](https://github.com/BehiSecc/awesome-claude-skills)         | 3.7k ⭐ | 分类详细                    | ✅     |
| [travisvn/awesome-claude-skills](https://github.com/travisvn/awesome-claude-skills)         | -       | 资源和工具列表              | ✅     |
| [brightdata/awesome-claude-skills](https://github.com/brightdata/awesome-claude-skills)     | -       | 生产就绪技能集合            | ✅     |

### 9.2 Official / Tooling (官方/工具)

| 仓库                                                                  | Stars   | 说明                  | 可抓取 |
| --------------------------------------------------------------------- | ------- | --------------------- | ------ |
| [huggingface/skills](https://github.com/huggingface/skills)           | -       | 兼容多个 AI agent     | ✅     |
| [agentskills/agentskills](https://github.com/agentskills/agentskills) | -       | Agent Skills 规范文档 | ❌     |
| [modelcontextprotocol](https://github.com/modelcontextprotocol)       | -       | MCP 规范与文档        | ❌     |
| [openai/skills](https://github.com/openai/skills)                     | 1.4k ⭐ | Codex 技能目录        | ✅     |

### 9.3 Skills Collections (技能集合)

| 仓库                                                                                                    | Stars | 说明                           | 可抓取 |
| ------------------------------------------------------------------------------------------------------- | ----- | ------------------------------ | ------ |
| [meetrais/claude-agent-skills](https://github.com/meetrais/claude-agent-skills)                         | -     | Claude Skills API 示例         | ✅     |
| [numman-ali/openskills](https://github.com/numman-ali/openskills)                                       | -     | 通用技能加载器，支持多个 agent | ❌     |
| [alirezarezvani/claude-code-skill-factory](https://github.com/alirezarezvani/claude-code-skill-factory) | -     | Claude Skills 构建工具         | ❌     |
| [grandinh/claude-code-central](https://github.com/grandinh/claude-code-central)                         | -     | 共享 Claude Code agents 和技能 | ✅     |

### 9.4 Claude Code Skills (Claude Code 专用)

| 仓库                                                                                              | Stars | 技能数量                         | 说明 | 可抓取 |
| ------------------------------------------------------------------------------------------------- | ----- | -------------------------------- | ---- | ------ |
| [automationcreators/claude-code-skills](https://github.com/automationcreators/claude-code-skills) | -     | 全面的 Claude Code 技能集合      | ✅   |
| [levnikolaevich/claude-code-skills](https://github.com/levnikolaevich/claude-code-skills)         | -     | 51 个生产就绪技能，Agile 工作流  | ✅   |
| [czottmann/claude-code-skills](https://github.com/czottmann/claude-code-stuff)                    | -     | 个人配置系统，包含 agents 和技能 | ✅   |
| [cblecker/claude-skills](https://github.com/cblecker/claude-skills)                               | -     | Claude Code 插件市场             | ✅   |

### 9.5 MCP Servers (Model Context Protocol)

| 仓库                                                                    | Stars | 说明                    | 相关性 |
| ----------------------------------------------------------------------- | ----- | ----------------------- | ------ |
| [github/github-mcp-server](https://github.com/github/github-mcp-server) | -     | GitHub 官方 MCP 服务器  | 🔗     |
| [microsoft/mcp](https://github.com/microsoft/mcp)                       | -     | 微软官方 MCP 服务器目录 | 🔗     |
| [bobmatnyc/mcp-skillset](https://github.com/bobmatnyc/mcp-skillset)     | -     | RAG 驱动的动态技能服务  | 🔗     |

### 9.6 Tooling & Infrastructure (工具和基础设施)

| 仓库                                                                    | Stars | 说明                                    |
| ----------------------------------------------------------------------- | ----- | --------------------------------------- |
| [blencorp/claude-code-kit](https://github.com/blencorp/claude-code-kit) | -     | Claude Code 基础设施，30秒自动部署      |
| [numman-ali/openskills](https://github.com/numman-ali/openskills)       | -     | 通用技能加载器，兼容 Claude Skills 格式 |

---

## 10. 扩展数据源

### 未来计划

1. **Smithery.ai API**
   - 获取 MCP 服务器列表
   - 与 Skills 关联

2. **SkillsMP.com**
   - 社区技能市场
   - API 对接 (如有)

3. **用户提交**
   - GitHub OAuth 登录
   - 提交仓库 URL
   - 自动验证 + 审核

### 添加新数据源

```typescript
// 在 SKILL_SOURCES 中添加
SKILL_SOURCES.push({
  owner: 'new-org',
  repo: 'skills-repo',
  skillsPath: 'skills',
  branch: 'main',
})
```

---

_数据源文档 v1.0 | 更新时间: 2026-01-10_
