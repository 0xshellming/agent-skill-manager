# askm CLI 工具设计

`askm` (Agent Skill Manager) 是一个命令行工具，用于安装、管理和发布 AI Agent Skills。

---

## 目录

1. [概述](#1-概述)
2. [安装方式](#2-安装方式)
3. [命令设计](#3-命令设计)
4. [配置文件](#4-配置文件)
5. [技术实现](#5-技术实现)
6. [发布流程](#6-发布流程)
7. [路线图](#7-路线图)

---

## 1. 概述

### 1.1 设计目标

- **简单易用**: 类似 npm/pip 的使用体验
- **多平台支持**: Claude、OpenAI Codex、Cursor、Windsurf 等
- **零配置**: 自动检测用户环境
- **快速安装**: 单命令即可安装技能

### 1.2 名称含义

```
askm = Agent Skill Manager
     = A Skill Manager
     = Ask M (询问 Manager)
```

### 1.3 核心功能

| 功能 | 描述 |
|------|------|
| `install` | 安装技能到本地 |
| `list` | 列出已安装技能 |
| `search` | 搜索可用技能 |
| `remove` | 卸载技能 |
| `update` | 更新技能 |
| `init` | 初始化新技能项目 |
| `publish` | 发布技能到注册表 |

---

## 2. 安装方式

### 2.1 通过 npm 安装 (推荐)

```bash
npm install -g askm

# 或使用 pnpm
pnpm add -g askm

# 或使用 yarn
yarn global add askm
```

### 2.2 通过脚本安装

```bash
# macOS / Linux
curl -fsSL https://agent-skill.dev/install.sh | sh

# Windows (PowerShell)
irm https://agent-skill.dev/install.ps1 | iex
```

### 2.3 通过 Homebrew (macOS)

```bash
brew install askm
```

### 2.4 验证安装

```bash
askm --version
# 输出: askm v1.0.0

askm --help
```

---

## 3. 命令设计

### 3.1 `askm install` - 安装技能

```bash
# 安装技能 (从注册表)
askm install <skill-id>
askm install anthropics/pdf

# 安装特定版本
askm install anthropics/pdf@1.0.0

# 从 GitHub 直接安装
askm install github:username/repo

# 从本地路径安装
askm install ./my-skill

# 安装到特定平台
askm install anthropics/pdf --target claude
askm install anthropics/pdf --target cursor
askm install anthropics/pdf --target codex
```

**安装流程**:
1. 从 `agent-skill.dev/api/skill/<skill-id>` 获取技能信息
2. 下载 `SKILL.md` 及相关文件
3. 检测用户平台 (Claude/Cursor/Codex)
4. 复制到对应的技能目录:
   - Claude: `~/.claude/skills/`
   - Cursor: `~/.cursor/skills/`
   - OpenAI Codex: `~/.openai/skills/`

### 3.2 `askm list` - 列出已安装技能

```bash
# 列出所有已安装技能
askm list
askm ls

# 输出示例:
# ┌────────────────────┬─────────┬──────────┬───────────┐
# │ Skill              │ Version │ Platform │ Updated   │
# ├────────────────────┼─────────┼──────────┼───────────┤
# │ anthropics/pdf     │ 1.2.0   │ claude   │ 2 days ago│
# │ anthropics/csv     │ 1.0.0   │ claude   │ 1 week ago│
# │ openai/code-review │ 2.1.0   │ codex    │ 3 days ago│
# └────────────────────┴─────────┴──────────┴───────────┘

# 按平台过滤
askm list --target claude

# 显示详细信息
askm list --verbose
```

### 3.3 `askm search` - 搜索技能

```bash
# 搜索技能
askm search <keyword>
askm search pdf
askm search "code review"

# 按分类搜索
askm search --category development
askm search --category document-processing

# 按平台过滤
askm search pdf --target claude

# 显示更多结果
askm search pdf --limit 20
```

**输出示例**:

```
Searching for "pdf"...

1. anthropics/pdf (★ 1.2k)
   Extract and process PDF files
   Tags: pdf, document, extraction

2. community/pdf-merger (★ 456)
   Merge multiple PDF files into one
   Tags: pdf, merge, combine

3. openai/pdf-analyzer (★ 234)
   Analyze PDF content with AI
   Tags: pdf, analysis, ai

Found 12 results. Use 'askm install <skill-id>' to install.
```

### 3.4 `askm remove` - 卸载技能

```bash
# 卸载技能
askm remove <skill-id>
askm remove anthropics/pdf
askm rm anthropics/pdf

# 卸载所有技能
askm remove --all

# 强制卸载 (跳过确认)
askm remove anthropics/pdf --force
```

### 3.5 `askm update` - 更新技能

```bash
# 更新单个技能
askm update <skill-id>
askm update anthropics/pdf

# 更新所有技能
askm update

# 检查可更新的技能
askm update --check
askm outdated
```

### 3.6 `askm info` - 查看技能详情

```bash
# 查看技能详情
askm info <skill-id>
askm info anthropics/pdf

# 输出示例:
# ┌─────────────────────────────────────────────────────┐
# │ anthropics/pdf                                      │
# ├─────────────────────────────────────────────────────┤
# │ Description: Extract and process PDF files         │
# │ Author:      anthropics                            │
# │ Version:     1.2.0                                 │
# │ Stars:       1,234                                 │
# │ Category:    document-processing                   │
# │ Platforms:   claude, cursor                        │
# │ Updated:     2026-01-08                            │
# │                                                    │
# │ Use Cases:                                         │
# │ • Extract text from PDF documents                  │
# │ • Parse PDF tables and forms                       │
# │ • Convert PDF to other formats                     │
# │                                                    │
# │ Prerequisites:                                     │
# │ • pdf-parse npm package                            │
# │                                                    │
# │ GitHub: https://github.com/anthropics/skills/...  │
# └─────────────────────────────────────────────────────┘
```

### 3.7 `askm init` - 初始化技能项目

```bash
# 交互式创建
askm init

# 快速创建
askm init my-skill

# 使用模板
askm init my-skill --template minimal
askm init my-skill --template full
```

**生成的目录结构**:

```
my-skill/
├── SKILL.md          # 技能定义 (必须)
├── README.md         # 文档
├── examples/         # 示例
│   └── example.md
└── tests/            # 测试
    └── test.md
```

**SKILL.md 模板**:

```markdown
---
name: My Skill
description: A brief description of what this skill does
author: your-username
version: 1.0.0
category: development
tags:
  - tag1
  - tag2
compatibility:
  - claude
  - cursor
---

# My Skill

## Description

Describe your skill in detail here.

## When to Use

- Use case 1
- Use case 2

## Prerequisites

- Requirement 1
- Requirement 2

## Instructions

Step-by-step instructions for using this skill.
```

### 3.8 `askm publish` - 发布技能

```bash
# 登录 (首次使用)
askm login

# 发布技能
askm publish

# 发布特定目录
askm publish ./my-skill

# 发布前预览
askm publish --dry-run
```

**发布流程**:
1. 验证 `SKILL.md` 格式
2. 检查必填字段
3. 上传到 `agent-skill.dev`
4. 触发 AI 解析和翻译
5. 生成技能页面

### 3.9 `askm config` - 配置管理

```bash
# 查看配置
askm config list

# 设置默认平台
askm config set default-target claude

# 设置技能目录
askm config set skills-dir ~/.my-skills

# 获取配置值
askm config get default-target
```

---

## 4. 配置文件

### 4.1 全局配置

位置: `~/.askm/config.json`

```json
{
  "defaultTarget": "claude",
  "registry": "https://agent-skill.dev",
  "auth": {
    "token": "xxx"
  },
  "paths": {
    "claude": "~/.claude/skills",
    "cursor": "~/.cursor/skills", 
    "codex": "~/.openai/skills"
  },
  "proxy": null,
  "timeout": 30000
}
```

### 4.2 项目配置

位置: `./askm.json` (可选)

```json
{
  "name": "my-skill",
  "version": "1.0.0",
  "description": "My awesome skill",
  "author": "username",
  "category": "development",
  "tags": ["ai", "automation"],
  "compatibility": ["claude", "cursor"],
  "dependencies": []
}
```

### 4.3 已安装技能记录

位置: `~/.askm/installed.json`

```json
{
  "skills": [
    {
      "id": "anthropics/pdf",
      "version": "1.2.0",
      "target": "claude",
      "installedAt": "2026-01-10T12:00:00Z",
      "path": "~/.claude/skills/pdf"
    }
  ]
}
```

---

## 5. 技术实现

### 5.1 技术栈

| 组件 | 技术选型 | 理由 |
|------|----------|------|
| Runtime | Node.js 18+ | 跨平台、npm 生态 |
| CLI Framework | Commander.js | 轻量、功能完整 |
| HTTP Client | undici / fetch | 内置、高性能 |
| Terminal UI | chalk + ora | 彩色输出、进度条 |
| Config | conf | 简单配置管理 |
| Prompts | inquirer | 交互式提示 |

### 5.2 项目结构

```
askm/
├── src/
│   ├── index.ts          # 入口
│   ├── cli.ts            # CLI 定义
│   ├── commands/         # 命令实现
│   │   ├── install.ts
│   │   ├── list.ts
│   │   ├── search.ts
│   │   ├── remove.ts
│   │   ├── update.ts
│   │   ├── init.ts
│   │   ├── publish.ts
│   │   └── config.ts
│   ├── lib/
│   │   ├── api.ts        # API 客户端
│   │   ├── config.ts     # 配置管理
│   │   ├── detector.ts   # 平台检测
│   │   ├── installer.ts  # 安装逻辑
│   │   └── registry.ts   # 注册表交互
│   └── utils/
│       ├── logger.ts
│       └── paths.ts
├── templates/            # init 模板
├── package.json
└── tsconfig.json
```

### 5.3 平台检测逻辑

```typescript
// src/lib/detector.ts
import { existsSync } from 'fs'
import { homedir } from 'os'
import { join } from 'path'

interface Platform {
  name: string
  skillsDir: string
  detected: boolean
}

export function detectPlatforms(): Platform[] {
  const home = homedir()
  
  const platforms: Platform[] = [
    {
      name: 'claude',
      skillsDir: join(home, '.claude', 'skills'),
      detected: existsSync(join(home, '.claude')),
    },
    {
      name: 'cursor',
      skillsDir: join(home, '.cursor', 'skills'),
      detected: existsSync(join(home, '.cursor')),
    },
    {
      name: 'codex',
      skillsDir: join(home, '.openai', 'skills'),
      detected: existsSync(join(home, '.openai')),
    },
  ]
  
  return platforms.filter(p => p.detected)
}

export function getDefaultPlatform(): Platform | null {
  const detected = detectPlatforms()
  return detected[0] || null
}
```

### 5.4 API 客户端

```typescript
// src/lib/api.ts
const API_BASE = 'https://agent-skill.dev/api'

export interface Skill {
  id: string
  name: string
  description: string
  author: string
  version: string
  category: string
  stars: number
  githubUrl: string
  skillMdUrl: string
}

export async function fetchSkill(skillId: string): Promise<Skill> {
  const response = await fetch(`${API_BASE}/skills/${skillId}`)
  if (!response.ok) {
    throw new Error(`Skill not found: ${skillId}`)
  }
  return response.json()
}

export async function searchSkills(query: string, options?: {
  category?: string
  limit?: number
}): Promise<Skill[]> {
  const params = new URLSearchParams({ q: query })
  if (options?.category) params.set('category', options.category)
  if (options?.limit) params.set('limit', String(options.limit))
  
  const response = await fetch(`${API_BASE}/skills/search?${params}`)
  return response.json()
}

export async function downloadSkillMd(url: string): Promise<string> {
  const response = await fetch(url)
  return response.text()
}
```

### 5.5 安装逻辑

```typescript
// src/lib/installer.ts
import { writeFileSync, mkdirSync, existsSync } from 'fs'
import { join, dirname } from 'path'
import { fetchSkill, downloadSkillMd } from './api'
import { getDefaultPlatform, detectPlatforms } from './detector'

export interface InstallOptions {
  target?: string
  force?: boolean
}

export async function installSkill(
  skillId: string, 
  options: InstallOptions = {}
) {
  // 1. 获取技能信息
  console.log(`Fetching ${skillId}...`)
  const skill = await fetchSkill(skillId)
  
  // 2. 确定安装平台
  const platform = options.target 
    ? detectPlatforms().find(p => p.name === options.target)
    : getDefaultPlatform()
    
  if (!platform) {
    throw new Error('No supported platform detected. Use --target to specify.')
  }
  
  // 3. 下载 SKILL.md
  console.log(`Downloading SKILL.md...`)
  const skillMd = await downloadSkillMd(skill.skillMdUrl)
  
  // 4. 创建技能目录
  const skillDir = join(platform.skillsDir, skill.id.replace('/', '-'))
  if (!existsSync(skillDir)) {
    mkdirSync(skillDir, { recursive: true })
  }
  
  // 5. 写入文件
  const skillPath = join(skillDir, 'SKILL.md')
  writeFileSync(skillPath, skillMd)
  
  // 6. 记录安装
  recordInstall(skill, platform.name, skillDir)
  
  console.log(`✅ Installed ${skill.name} to ${skillDir}`)
  
  return { skill, path: skillDir }
}
```

---

## 6. 发布流程

### 6.1 用户发布技能

```bash
# 1. 初始化技能
askm init my-awesome-skill
cd my-awesome-skill

# 2. 编辑 SKILL.md
# ...

# 3. 登录
askm login
# 浏览器打开 agent-skill.dev/cli-auth
# 复制认证码粘贴

# 4. 发布
askm publish
```

### 6.2 服务端处理流程

```
用户发布 → 验证格式 → AI解析 → 生成翻译 → 存入数据库 → 发布成功
                ↓
          SKILL.md 上传到 R2
```

### 6.3 发布 API

```typescript
// POST /api/skills/publish
// Headers: Authorization: Bearer <token>
// Body: FormData with SKILL.md

interface PublishResponse {
  success: boolean
  skillId: string
  url: string
  message: string
}
```

---

## 7. 路线图

### 7.1 v1.0 (MVP)

- [x] 设计命令结构
- [ ] 实现 `install` 命令
- [ ] 实现 `list` 命令
- [ ] 实现 `search` 命令
- [ ] 实现 `remove` 命令
- [ ] 平台自动检测
- [ ] 发布到 npm

### 7.2 v1.1

- [ ] `update` 命令
- [ ] `init` 命令
- [ ] `publish` 命令
- [ ] 交互式 CLI

### 7.3 v1.2

- [ ] 技能依赖管理
- [ ] 版本锁定
- [ ] 离线缓存
- [ ] 代理支持

### 7.4 v2.0 (未来)

- [ ] 技能商店 GUI
- [ ] VS Code 扩展
- [ ] 技能评分系统
- [ ] 自动更新通知

---

## 快速命令参考

```bash
# 安装
askm install <skill-id>
askm install anthropics/pdf --target claude

# 管理
askm list
askm remove <skill-id>
askm update

# 搜索
askm search <keyword>
askm info <skill-id>

# 创建
askm init <name>
askm publish

# 配置
askm config list
askm config set <key> <value>
```

---

*CLI 工具设计 v1.0 | 更新时间: 2026-01-10*
