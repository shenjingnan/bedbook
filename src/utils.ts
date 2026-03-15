import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import matter from 'gray-matter';
import type { Story, StoryMetadata } from '@/types';

/** 故事元数据默认值 */
const DEFAULT_METADATA: Required<StoryMetadata> = {
  title: '未命名故事',
  age: '未知',
  keywords: [],
  author: '未知',
  category: '未分类',
  language: 'zh',
};

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
  return join(__dirname, '..', 'stories');
}

/**
 * 解析 YAML Front Matter
 * 从 Markdown 文件中提取元数据和内容
 * 缺失的字段将使用默认值填充
 */
export function parseYamlFrontMatter(
  fileContent: string,
  filename?: string
): {
  metadata: Required<StoryMetadata>;
  content: string;
} {
  const { data, content } = matter(fileContent);

  // 使用默认值填充缺失字段
  const metadata: Required<StoryMetadata> = {
    title: data.title || filename?.replace(/\.md$/, '') || DEFAULT_METADATA.title,
    age: data.age || DEFAULT_METADATA.age,
    keywords: Array.isArray(data.keywords) ? data.keywords : DEFAULT_METADATA.keywords,
    author: data.author || DEFAULT_METADATA.author,
    category: data.category || DEFAULT_METADATA.category,
    language: data.language || DEFAULT_METADATA.language,
  };

  return {
    metadata,
    content: content.trim(),
  };
}

/**
 * 解析单个故事文件
 * @param filePath 故事文件路径
 * @param storiesDir 故事目录路径（用于计算相对路径）
 * @returns 故事对象
 */
export function parseStoryFile(filePath: string, storiesDir: string): Story {
  const fileContent = readFileSync(filePath, 'utf-8');
  const relativePath = relative(storiesDir, filePath);
  const { metadata, content } = parseYamlFrontMatter(fileContent, relativePath);

  return {
    ...metadata,
    filename: relativePath,
    content,
  };
}

/**
 * 递归加载目录中的所有故事文件
 * @param dir 目录路径
 * @param storiesDir 故事根目录路径
 * @returns 故事数组
 */
function loadStoriesFromDir(dir: string, storiesDir: string): Story[] {
  const stories: Story[] = [];
  const entries = readdirSync(dir);

  for (const entry of entries) {
    const fullPath = join(dir, entry);
    const stat = statSync(fullPath);

    if (stat.isDirectory()) {
      // 递归读取子目录
      stories.push(...loadStoriesFromDir(fullPath, storiesDir));
    } else if (entry.endsWith('.md')) {
      try {
        const story = parseStoryFile(fullPath, storiesDir);
        stories.push(story);
      } catch (error) {
        console.warn(`解析故事文件失败: ${entry}`, error);
      }
    }
  }

  return stories;
}

/**
 * 加载所有故事（支持递归读取子目录）
 * @param storiesDir 故事目录路径
 * @returns 故事数组
 */
export function loadAllStories(storiesDir: string): Story[] {
  if (!existsSync(storiesDir)) {
    console.warn(`故事目录不存在: ${storiesDir}`);
    return [];
  }

  return loadStoriesFromDir(storiesDir, storiesDir);
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
  const set1 = new Set(s1.split(''));
  const set2 = new Set(s2.split(''));
  const intersection = new Set([...set1].filter((x) => set2.has(x)));
  const union = new Set([...set1, ...set2]);

  return intersection.size / union.size;
}
