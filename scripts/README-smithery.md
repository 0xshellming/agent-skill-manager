# Smithery.ai 技能爬虫使用说明

这是一个独立的 TypeScript 爬虫脚本，用于抓取 smithery.ai 上的所有技能数据。

## 功能特点

- ✅ 完整的分页爬取（自动获取总页数）
- ✅ 断点续传（支持中断后继续）
- ✅ 失败重试（指数退避，最多3次）
- ✅ 进度追踪（实时保存进度）
- ✅ CSV 导出（符合你指定的字段）
- ✅ 反爬策略（随机延迟、浏览器伪装）

## 前置要求

确保已安装 Playwright 浏览器：

```bash
pnpm exec playwright install chromium
```

## 使用方法

### 首次运行

```bash
pnpm tsx scripts/crawl-smithery.ts
```

### 中断后继续

如果爬取过程中断（手动停止或异常退出），直接再次运行即可从断点继续：

```bash
pnpm tsx scripts/crawl-smithery.ts
```

### 重新开始

如果想清空进度重新抓取：

```bash
pnpm tsx scripts/crawl-smithery.ts --reset
```

## 输出文件

### 主要输出

- **`output/smithery-skills.csv`** - 最终的技能数据（CSV格式）

### 进度文件（可删除重新开始）

- `.crawl-progress/progress.json` - 当前抓取进度
- `.crawl-progress/skills-data.json` - 临时数据存储
- `.crawl-progress/failed-skills.json` - 失败记录

## CSV 字段说明

| 字段 | 说明 |
|------|------|
| 名称 | 技能名称 |
| 描述 | 技能描述 |
| GitHub地址 | GitHub 仓库链接 |
| Stars | GitHub Star 数 |
| Forks | GitHub Fork 数 |
| 作者 | GitHub 作者用户名 |
| 分类 | 技能分类 |
| 标签 | 相关标签（逗号分隔）|
| Smithery链接 | Smithery 详情页 URL |
| README | README 内容（前1000字符）|
| 最后更新 | 最后更新时间 |

## 重要说明

### ⚠️ 选择器需要验证

脚本中的 CSS 选择器是基于你提供的示例选择器编写的，但实际运行时可能需要调整。

如果遇到数据提取问题，请：

1. 打开浏览器开发者工具
2. 访问 https://smithery.ai/skills
3. 检查实际的 HTML 结构
4. 修改脚本中的 `SELECTORS` 配置

主要需要验证的选择器：

```typescript
const SELECTORS = {
  // 列表页
  skillCards: '...', // 技能卡片列表
  pagination: '...', // 分页导航
  
  // 详情页
  title: '...',      // 标题
  description: '...', // 描述
  githubLink: '...',  // GitHub 链接
  // ... 等等
}
```

### 防封建议

1. **延迟设置**：默认每个请求间隔 2-5 秒，可以调整 `DELAY_MIN` 和 `DELAY_MAX`
2. **运行时间**：预计抓取 1500 个技能需要 2-3 小时
3. **有界面模式**：使用 `headless: false` 可以观察抓取过程，更像真人操作
4. **网络环境**：建议使用稳定的网络，避免频繁超时

## 故障排除

### 问题：元素未找到

**原因**：选择器不匹配实际页面结构

**解决**：
1. 运行脚本时观察浏览器窗口
2. 打开开发者工具，检查元素选择器
3. 修改脚本中的 `SELECTORS` 配置
4. 使用 `--reset` 重新开始

### 问题：网络超时

**原因**：网络不稳定或页面加载慢

**解决**：
1. 增加超时时间（脚本中的 `timeout` 参数）
2. 检查网络连接
3. 减少并发（当前已经是串行）

### 问题：被识别为机器人

**原因**：请求频率过高或行为模式可疑

**解决**：
1. 增加延迟时间（修改 `DELAY_MIN` 和 `DELAY_MAX`）
2. 更换 IP 地址
3. 暂停一段时间后再继续

### 问题：数据不完整

**原因**：某些字段在页面上不存在或选择器错误

**解决**：
1. 查看控制台警告信息（⚠️ 标记）
2. 手动访问几个详情页，确认字段是否存在
3. 调整对应的选择器或处理逻辑

## 高级配置

### 修改延迟时间

编辑脚本中的常量：

```typescript
const DELAY_MIN = 2000  // 最小延迟（毫秒）
const DELAY_MAX = 5000  // 最大延迟（毫秒）
```

### 修改重试次数

```typescript
const RETRY_MAX = 3  // 最大重试次数
```

### 使用无头模式

如果想在后台运行（不显示浏览器窗口）：

```typescript
const browser = await chromium.launch({
  headless: true,  // 改为 true
  // ...
})
```

## 监控进度

脚本会实时输出进度信息：

```
📄 正在抓取第 5/50 页...
   找到 30 个技能
   [1/30] 抓取技能...
   ✓ Skill Name Here

📈 进度: 123 成功 | 2 失败
```

你也可以查看进度文件：

```bash
cat .crawl-progress/progress.json
```

## 完成后

抓取完成后，你会得到：

1. `output/smithery-skills.csv` - 包含所有成功抓取的技能
2. 控制台输出最终统计信息
3. 如果有失败的项目，会在 `.crawl-progress/failed-skills.json` 中列出

## 示例输出

```
✅ 所有页面抓取完成
📊 导出 CSV...
✅ 导出完成: output/smithery-skills.csv
   共 1247 个技能

====================================================================
📊 最终统计
   ✓ 成功: 1247
   ✗ 失败: 3
   ⏱️  耗时: 8426532 毫秒
```

## 技术细节

- **语言**：TypeScript
- **浏览器**：Playwright (Chromium)
- **导出格式**：CSV (UTF-8)
- **进度保存**：JSON 文件
- **错误处理**：三层重试机制

## 注意事项

1. **合法性**：请确保遵守 smithery.ai 的服务条款和 robots.txt
2. **频率控制**：默认配置已经包含合理的延迟，不要盲目减少
3. **数据使用**：抓取的数据仅供个人学习研究使用
4. **版权**：尊重原作者的版权和知识产权

## 需要帮助？

如果遇到问题：

1. 检查控制台输出的警告和错误信息
2. 查看 `.crawl-progress/failed-skills.json` 了解失败原因
3. 参考本文档的"故障排除"部分
4. 必要时调整选择器配置
