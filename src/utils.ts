import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import type { Story, StoryMetadata } from "@/types";

/**
 * 获取 package.json 中的版本号
 */
export function getPackageVersion(): string {
  try {
    const packageJsonPath = join(__dirname, "..", "package.json");
    const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf-8"));
    return packageJson.version || "0.0.1";
  } catch {
    console.warn("无法读取 package.json 中的版本号，使用默认版本 0.0.1");
    return "0.0.1";
  }
}

/**
 * 获取故事目录路径
 * 支持通过环境变量 BEDBOOK_STORIES_DIR 自定义路径
 */
export function getStoriesDir(): string {
  const customDir = process.env.BEDBOOK_STORIES_DIR;
  if (customDir) {
    return customDir;
  }
  // 默认使用项目根目录下的 stories 文件夹
  return join(__dirname, "..", "stories");
}

/**
 * 解析 YAML Front Matter
 * 从 Markdown 文件中提取元数据和内容
 */
export function parseYamlFrontMatter(fileContent: string): {
  metadata: StoryMetadata;
  content: string;
} {
  // 匹配 YAML Front Matter (--- 包围的部分)
  const frontMatterRegex = /^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$/;
  const match = fileContent.match(frontMatterRegex);

  if (!match) {
    throw new Error("无效的故事文件格式：缺少 YAML Front Matter");
  }

  const [, yamlContent, content] = match;
  const metadata: Partial<StoryMetadata> = {};

  // 简单的 YAML 解析
  const lines = yamlContent.split("\n");
  let currentKey = "";
  let currentArray: string[] | null = null;

  for (const line of lines) {
    const trimmedLine = line.trim();

    // 跳过空行
    if (!trimmedLine) {
      continue;
    }

    // 检查是否是数组项 (以 - 开头)
    if (trimmedLine.startsWith("- ")) {
      if (currentArray !== null) {
        currentArray.push(trimmedLine.substring(2).trim());
      }
      continue;
    }

    // 检查是否是键值对
    const colonIndex = trimmedLine.indexOf(":");
    if (colonIndex > 0) {
      const key = trimmedLine.substring(0, colonIndex).trim() as keyof StoryMetadata;
      const value = trimmedLine.substring(colonIndex + 1).trim();

      // 检查下一行是否可能是数组
      if (value === "") {
        currentKey = key;
        currentArray = [];
        (metadata as Record<string, string[] | string>)[key] = currentArray;
      } else {
        currentKey = key;
        currentArray = null;
        (metadata as Record<string, string>)[key] = value;
      }
    }
  }

  // 验证必需字段
  const requiredFields: (keyof StoryMetadata)[] = ["title", "age", "keywords", "author", "category"];
  for (const field of requiredFields) {
    if (!metadata[field]) {
      throw new Error(`缺少必需的元数据字段: ${field}`);
    }
  }

  return {
    metadata: metadata as StoryMetadata,
    content: content.trim(),
  };
}

/**
 * 解析单个故事文件
 * @param filePath 故事文件路径
 * @returns 故事对象
 */
export function parseStoryFile(filePath: string): Story {
  const fileContent = readFileSync(filePath, "utf-8");
  const filename = filePath.split("/").pop() || "";
  const { metadata, content } = parseYamlFrontMatter(fileContent);

  return {
    ...metadata,
    filename,
    content,
  };
}

/**
 * 加载所有故事
 * @param storiesDir 故事目录路径
 * @returns 故事数组
 */
export function loadAllStories(storiesDir: string): Story[] {
  if (!existsSync(storiesDir)) {
    console.warn(`故事目录不存在: ${storiesDir}`);
    return [];
  }

  const files = readdirSync(storiesDir);
  const stories: Story[] = [];

  for (const file of files) {
    if (file.endsWith(".md")) {
      try {
        const story = parseStoryFile(join(storiesDir, file));
        stories.push(story);
      } catch (error) {
        console.warn(`解析故事文件失败: ${file}`, error);
      }
    }
  }

  return stories;
}

/**
 * 计算两个字符串的相似度 (Jaccard 相似度)
 * 用于模糊匹配搜索
 */
export function calculateSimilarity(str1: string, str2: string): number {
  const s1 = str1.toLowerCase();
  const s2 = str2.toLowerCase();

  // 完全匹配
  if (s1 === s2) return 1;

  // 包含关系
  if (s1.includes(s2) || s2.includes(s1)) return 0.8;

  // 计算字符集合的 Jaccard 相似度
  const set1 = new Set(s1.split(""));
  const set2 = new Set(s2.split(""));
  const intersection = new Set([...set1].filter((x) => set2.has(x)));
  const union = new Set([...set1, ...set2]);

  return intersection.size / union.size;
}