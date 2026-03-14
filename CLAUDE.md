# Bedbook - 儿童故事 MCP 服务

## 项目介绍

Bedbook 是一个基于 MCP (Model Context Protocol) 协议的儿童故事服务。它提供故事列表和搜索功能，可以集成到支持 MCP 的 AI 应用中，帮助用户查找和阅读适合不同年龄段的儿童故事。

## 技术栈

- **语言**: TypeScript 5.x
- **运行时**: Node.js (ES2022)
- **MCP 框架**: bestmcp SDK
- **参数验证**: Zod
- **包管理器**: pnpm
- **构建工具**: tsup

## 开发命令

```bash
# 安装依赖
pnpm install

# 开发模式 (stdio 传输)
pnpm dev

# 开发模式 (HTTP 传输)
pnpm dev:http

# 构建
pnpm build

# 生产模式运行 (stdio)
pnpm start

# 生产模式运行 (HTTP)
pnpm start:http
```

### 环境变量

| 变量名 | 说明 | 默认值 |
|--------|------|--------|
| `MCP_TRANSPORT` | 传输方式 (stdio/http) | `stdio` |
| `MCP_PORT` | HTTP 模式端口 | `3000` |
| `MCP_HOST` | HTTP 模式主机 | `0.0.0.0` |
| `BEDBOOK_STORIES_DIR` | 自定义故事目录 | `./stories` |

## 项目结构

```
bedbook/
├── src/
│   ├── index.ts          # 入口文件，MCP 服务器配置
│   ├── types.ts          # TypeScript 类型定义
│   ├── utils.ts          # 工具函数（文件解析、相似度计算）
│   └── story.ts          # 故事服务（MCP 工具）
├── stories/              # 故事文件目录
│   └── *.md              # Markdown 格式的故事文件
├── dist/                 # 编译输出目录
├── package.json
└── tsconfig.json
```

## 代码规范

### TypeScript 配置

- 目标: ES2022
- 模块系统: NodeNext
- 严格模式: 开启
- 路径别名: `@/*` 映射到 `./src/*`

### 编码风格

1. **类型安全**: 使用 TypeScript 严格模式，避免 `any` 类型
2. **接口定义**: 在 `types.ts` 中定义所有接口和类型
3. **服务类**: 使用 `@Tool` 和 `@Param` 装饰器定义 MCP 工具
4. **错误处理**: 使用 try-catch 捕获异常，避免服务崩溃
5. **代码组织**: 按功能模块划分，服务放在 `services/` 目录

### 命名规范

- **文件名**: kebab-case (如 `story.ts`)
- **类名**: PascalCase (如 `StoryService`)
- **函数/变量**: camelCase (如 `getStories`)
- **接口**: PascalCase，不加 `I` 前缀 (如 `Story`)
- **常量**: UPPER_SNAKE_CASE

## 故事文件格式

故事文件存放在 `stories/` 目录，采用 Markdown 格式，包含 YAML Front Matter：

```markdown
---
title: 故事标题
age: 3-7岁
keywords:
  - 关键词1
  - 关键词2
author: 作者名
category: 分类
language: zh
---

故事正文内容...
```

### 元数据字段

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `title` | string | 是 | 故事标题 |
| `age` | string | 是 | 适合年龄段，如 `3-7岁` |
| `keywords` | string[] | 是 | 关键词标签列表 |
| `author` | string | 是 | 作者名（可为"未知"） |
| `category` | string | 是 | 故事分类 |
| `language` | string | 是 | 故事语言，ISO 639-1 代码，如 `zh`、`en` |

## MCP 工具说明

### 1. listStories

列出所有故事（不含完整内容）。

**返回示例**:
```json
{
  "success": true,
  "count": 10,
  "stories": [
    {
      "filename": "小老虎怕下雨.md",
      "title": "小老虎怕下雨",
      "age": "3-7岁",
      "keywords": ["勇敢", "友谊"],
      "author": "未知",
      "category": "儿童故事",
      "language": "zh"
    }
  ]
}
```

### 2. searchStory

根据条件搜索故事，返回最佳匹配（含完整内容）。

**参数**:
- `age` (可选): 年龄段筛选
- `title` (可选): 故事名称模糊匹配
- `keyword` (可选): 关键词搜索

**返回示例**:
```json
{
  "bestMatch": {
    "filename": "小老虎怕下雨.md",
    "title": "小老虎怕下雨",
    "age": "3-7岁",
    "keywords": ["勇敢", "友谊"],
    "author": "未知",
    "category": "儿童故事",
    "language": "zh",
    "content": "森林里住着一只小老虎..."
  },
  "otherMatches": []
}
```