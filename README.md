# Bedbook - 儿童故事 MCP 服务

[![MIT License](https://img.shields.io/badge/License-MIT-green.svg)](https://choosealicense.com/licenses/mit/)

Bedbook 是一个基于 [MCP (Model Context Protocol)](https://modelcontextprotocol.io/) 协议的儿童故事服务。它提供故事列表和搜索功能，可以集成到支持 MCP 的 AI 应用中，帮助用户查找和阅读适合不同年龄段的儿童故事。

## 功能特点

- **故事列表**: 列出所有可用故事，展示标题、年龄段、关键词等元信息
- **智能搜索**: 支持按年龄段、名称、关键词模糊搜索，返回最佳匹配结果
- **MCP 协议**: 标准化的 MCP 工具接口，可无缝集成到 Claude、Cursor 等 AI 应用
- **灵活部署**: 支持 stdio 和 HTTP 两种传输方式

## 技术栈

- **语言**: TypeScript 5.x
- **运行时**: Node.js (ES2022)
- **MCP 框架**: [bestmcp](https://github.com/dglguw/bestmcp) SDK
- **参数验证**: Zod
- **包管理器**: pnpm
- **构建工具**: tsup

## 快速开始

Bedbook 是一个 MCP 服务，你可以通过支持 MCP 的 AI 应用来使用它。以下是常见的配置方式：

### 在 Claude Desktop 中配置

编辑配置文件：
- **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`

添加以下配置：

```json
{
  "mcpServers": {
    "bedbook": {
      "command": "npx",
      "args": ["-y", "bedbook"]
    }
  }
}
```

### 在 Cursor 中配置

在项目根目录创建或编辑 `.cursor/mcp.json` 文件：

```json
{
  "mcpServers": {
    "bedbook": {
      "command": "npx",
      "args": ["-y", "bedbook"]
    }
  }
}
```

### 使用示例

配置完成后，你可以直接与 AI 对话来使用 Bedbook：

- "给我找一个适合 5 岁孩子的关于勇敢的故事"
- "有哪些故事可以讲给孩子听？"
- "帮我找一个叫'小老虎'的故事"

### 自定义故事目录（可选）

如果你想使用自己的故事文件，可以通过环境变量指定故事目录：

```json
{
  "mcpServers": {
    "bedbook": {
      "command": "npx",
      "args": ["-y", "bedbook"],
      "env": {
        "BEDBOOK_STORIES_DIR": "/path/to/your/stories"
      }
    }
  }
}
```

## 安装

### 环境要求

- Node.js >= 18.0.0
- pnpm >= 8.0.0

### 安装依赖

```bash
pnpm install
```

## 使用

### 开发模式

```bash
# stdio 传输模式（默认）
pnpm dev

# HTTP 传输模式
pnpm dev:http
```

### 生产模式

```bash
# 构建项目
pnpm build

# stdio 传输模式
pnpm start

# HTTP 传输模式
pnpm start:http
```

### 环境变量

| 变量名 | 说明 | 默认值 |
|--------|------|--------|
| `MCP_TRANSPORT` | 传输方式 (stdio/http) | `stdio` |
| `MCP_PORT` | HTTP 模式端口 | `3000` |
| `MCP_HOST` | HTTP 模式主机 | `0.0.0.0` |
| `BEDBOOK_STORIES_DIR` | 自定义故事目录 | `./stories` |

## MCP 工具

### listStories

列出所有故事（不含完整内容）。

**参数**: 无

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
      "category": "儿童故事"
    }
  ]
}
```

### searchStory

根据条件搜索故事，返回最佳匹配（含完整内容）。

**参数**:

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| `age` | string | 否 | 年龄段筛选，如 `3-7岁` |
| `title` | string | 否 | 故事名称模糊匹配 |
| `keyword` | string | 否 | 关键词搜索 |

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
    "content": "森林里住着一只小老虎..."
  },
  "otherMatches": [
    {
      "filename": "勇敢的小兔子.md",
      "title": "勇敢的小兔子",
      "age": "3-6岁",
      "keywords": ["勇敢", "冒险"],
      "author": "未知",
      "category": "儿童故事"
    }
  ]
}
```

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

## 项目结构

```
bedbook/
├── src/
│   ├── index.ts              # 入口文件，MCP 服务器配置
│   ├── types.ts              # TypeScript 类型定义
│   ├── utils.ts              # 工具函数（文件解析、相似度计算）
│   └── services/
│       ├── index.ts          # 服务导出
│       └── story.service.ts  # 故事服务（MCP 工具）
├── stories/                  # 故事文件目录
│   └── *.md                  # Markdown 格式的故事文件
├── dist/                     # 编译输出目录
├── package.json
└── tsconfig.json
```

## 开发指南

### 代码规范

- **类型安全**: 使用 TypeScript 严格模式，避免 `any` 类型
- **接口定义**: 在 `types.ts` 中定义所有接口和类型
- **服务类**: 使用 `@Tool` 和 `@Param` 装饰器定义 MCP 工具
- **错误处理**: 使用 try-catch 捕获异常，避免服务崩溃

### 命名规范

- **文件名**: kebab-case (如 `story.service.ts`)
- **类名**: PascalCase (如 `StoryService`)
- **函数/变量**: camelCase (如 `getStories`)
- **接口**: PascalCase，不加 `I` 前缀 (如 `Story`)
- **常量**: UPPER_SNAKE_CASE

## 许可证

本项目基于 [MIT](LICENSE) 许可证开源。

## 贡献

欢迎提交 Issue 和 Pull Request！

---

**Bedbook** - 为孩子们带来美好的睡前故事时光