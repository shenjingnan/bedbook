import { existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  calculateSimilarity,
  getStoriesDir,
  loadAllStories,
  parseStoryFile,
  parseYamlFrontMatter,
} from './utils';

describe('calculateSimilarity', () => {
  it('完全相同的字符串返回 1', () => {
    expect(calculateSimilarity('hello', 'hello')).toBe(1);
    expect(calculateSimilarity('Hello', 'hello')).toBe(1); // 大小写不敏感
  });

  it('包含关系返回 0.8', () => {
    expect(calculateSimilarity('hello world', 'hello')).toBe(0.8);
    expect(calculateSimilarity('hello', 'hello world')).toBe(0.8);
  });

  it('部分相似返回 Jaccard 相似度', () => {
    // "abc" 和 "abd" 的 Jaccard 相似度
    // 交集: a, b = 2, 并集: a, b, c, d = 4
    // 相似度 = 2/4 = 0.5
    expect(calculateSimilarity('abc', 'abd')).toBe(0.5);
  });

  it('完全不同的字符串返回较低相似度', () => {
    // "abc" 和 "xyz" 无交集
    expect(calculateSimilarity('abc', 'xyz')).toBe(0);
  });
});

describe('parseYamlFrontMatter', () => {
  it('正确解析标准格式的 YAML Front Matter', () => {
    const content = `---
title: 测试故事
age: 3-7岁
keywords:
  - 关键词1
  - 关键词2
author: 测试作者
category: 测试分类
---

这是故事正文内容。`;

    const result = parseYamlFrontMatter(content);

    expect(result.metadata.title).toBe('测试故事');
    expect(result.metadata.age).toBe('3-7岁');
    expect(result.metadata.keywords).toEqual(['关键词1', '关键词2']);
    expect(result.metadata.author).toBe('测试作者');
    expect(result.metadata.category).toBe('测试分类');
    expect(result.content).toBe('这是故事正文内容。');
  });

  it('缺失必需字段时抛出错误', () => {
    const content = `---
title: 测试故事
---

这是故事正文内容。`;

    expect(() => parseYamlFrontMatter(content)).toThrow('缺少必需的元数据字段');
  });
});

describe('parseStoryFile', () => {
  const testDir = join(__dirname, '__test_fixtures__');
  const testFile = join(testDir, 'test-story.md');

  beforeEach(() => {
    if (!existsSync(testDir)) {
      mkdirSync(testDir, { recursive: true });
    }
  });

  afterEach(() => {
    if (existsSync(testDir)) {
      rmSync(testDir, { recursive: true, force: true });
    }
  });

  it('正确解析故事文件', () => {
    const content = `---
title: 测试故事
age: 3-7岁
keywords:
  - 关键词1
author: 测试作者
category: 测试分类
---

故事内容`;

    writeFileSync(testFile, content, 'utf-8');

    const result = parseStoryFile(testFile);

    expect(result.filename).toBe('test-story.md');
    expect(result.title).toBe('测试故事');
    expect(result.age).toBe('3-7岁');
    expect(result.keywords).toEqual(['关键词1']);
    expect(result.author).toBe('测试作者');
    expect(result.category).toBe('测试分类');
    expect(result.content).toBe('故事内容');
  });

  it('文件不存在时抛出错误', () => {
    const nonExistentFile = join(testDir, 'non-existent.md');
    expect(() => parseStoryFile(nonExistentFile)).toThrow();
  });
});

describe('loadAllStories', () => {
  const testDir = join(__dirname, '__test_stories__');

  beforeEach(() => {
    if (!existsSync(testDir)) {
      mkdirSync(testDir, { recursive: true });
    }
  });

  afterEach(() => {
    if (existsSync(testDir)) {
      rmSync(testDir, { recursive: true, force: true });
    }
  });

  it('加载目录下所有 .md 文件', () => {
    const story1 = `---
title: 故事1
age: 3-7岁
keywords:
  - 关键词1
author: 作者1
category: 分类1
---

内容1`;

    const story2 = `---
title: 故事2
age: 5-10岁
keywords:
  - 关键词2
author: 作者2
category: 分类2
---

内容2`;

    writeFileSync(join(testDir, 'story1.md'), story1, 'utf-8');
    writeFileSync(join(testDir, 'story2.md'), story2, 'utf-8');

    const stories = loadAllStories(testDir);

    expect(stories).toHaveLength(2);
    expect(stories.map((s) => s.title)).toContain('故事1');
    expect(stories.map((s) => s.title)).toContain('故事2');
  });

  it('目录不存在时返回空数组并打印警告', () => {
    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    const nonExistentDir = join(__dirname, '__non_existent_dir__');
    const stories = loadAllStories(nonExistentDir);

    expect(stories).toEqual([]);
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('故事目录不存在'));

    consoleSpy.mockRestore();
  });

  it('忽略非 .md 文件', () => {
    const story = `---
title: 故事
age: 3-7岁
keywords:
  - 关键词
author: 作者
category: 分类
---

内容`;

    writeFileSync(join(testDir, 'story.md'), story, 'utf-8');
    writeFileSync(join(testDir, 'ignore.txt'), '应该被忽略', 'utf-8');

    const stories = loadAllStories(testDir);

    expect(stories).toHaveLength(1);
    expect(stories[0]?.title).toBe('故事');
  });

  it('解析失败的文件被跳过', () => {
    const validStory = `---
title: 有效故事
age: 3-7岁
keywords:
  - 关键词
author: 作者
category: 分类
---

内容`;

    const invalidStory = `---
title: 无效故事
---

缺少必需字段`;

    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    writeFileSync(join(testDir, 'valid.md'), validStory, 'utf-8');
    writeFileSync(join(testDir, 'invalid.md'), invalidStory, 'utf-8');

    const stories = loadAllStories(testDir);

    expect(stories).toHaveLength(1);
    expect(stories[0]?.title).toBe('有效故事');
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('解析故事文件失败'),
      expect.anything()
    );

    consoleSpy.mockRestore();
  });
});

describe('getStoriesDir', () => {
  const originalEnv = process.env.BEDBOOK_STORIES_DIR;

  afterEach(() => {
    // 恢复环境变量
    if (originalEnv !== undefined) {
      process.env.BEDBOOK_STORIES_DIR = originalEnv;
    } else {
      delete process.env.BEDBOOK_STORIES_DIR;
    }
  });

  it('使用环境变量 BEDBOOK_STORIES_DIR 自定义路径', () => {
    process.env.BEDBOOK_STORIES_DIR = '/custom/path';
    expect(getStoriesDir()).toBe('/custom/path');
  });

  it('默认使用项目根目录下的 stories 文件夹', () => {
    delete process.env.BEDBOOK_STORIES_DIR;
    const result = getStoriesDir();
    expect(result).toContain('stories');
  });
});
