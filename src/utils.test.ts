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
language: zh
---

这是故事正文内容。`;

    const result = parseYamlFrontMatter(content);

    expect(result.metadata.title).toBe('测试故事');
    expect(result.metadata.age).toBe('3-7岁');
    expect(result.metadata.keywords).toEqual(['关键词1', '关键词2']);
    expect(result.metadata.author).toBe('测试作者');
    expect(result.metadata.category).toBe('测试分类');
    expect(result.metadata.language).toBe('zh');
    expect(result.content).toBe('这是故事正文内容。');
  });

  it('缺失单个字段时使用默认值 - 缺少 title', () => {
    const content = `---
age: 3-7岁
keywords:
  - 关键词
author: 作者
category: 分类
language: zh
---

内容`;

    const result = parseYamlFrontMatter(content, '测试文件.md');

    expect(result.metadata.title).toBe('测试文件');
    expect(result.metadata.age).toBe('3-7岁');
  });

  it('缺失单个字段时使用默认值 - 缺少 age', () => {
    const content = `---
title: 测试故事
keywords:
  - 关键词
author: 作者
category: 分类
language: zh
---

内容`;

    const result = parseYamlFrontMatter(content);

    expect(result.metadata.title).toBe('测试故事');
    expect(result.metadata.age).toBe('未知');
  });

  it('缺失单个字段时使用默认值 - 缺少 keywords', () => {
    const content = `---
title: 测试故事
age: 3-7岁
author: 作者
category: 分类
language: zh
---

内容`;

    const result = parseYamlFrontMatter(content);

    expect(result.metadata.title).toBe('测试故事');
    expect(result.metadata.keywords).toEqual([]);
  });

  it('缺失单个字段时使用默认值 - 缺少 author', () => {
    const content = `---
title: 测试故事
age: 3-7岁
keywords:
  - 关键词
category: 分类
language: zh
---

内容`;

    const result = parseYamlFrontMatter(content);

    expect(result.metadata.title).toBe('测试故事');
    expect(result.metadata.author).toBe('未知');
  });

  it('缺失单个字段时使用默认值 - 缺少 category', () => {
    const content = `---
title: 测试故事
age: 3-7岁
keywords:
  - 关键词
author: 作者
language: zh
---

内容`;

    const result = parseYamlFrontMatter(content);

    expect(result.metadata.title).toBe('测试故事');
    expect(result.metadata.category).toBe('未分类');
  });

  it('缺失单个字段时使用默认值 - 缺少 language', () => {
    const content = `---
title: 测试故事
age: 3-7岁
keywords:
  - 关键词
author: 作者
category: 分类
---

内容`;

    const result = parseYamlFrontMatter(content);

    expect(result.metadata.title).toBe('测试故事');
    expect(result.metadata.language).toBe('zh');
  });

  it('缺失多个字段时使用默认值填充', () => {
    const content = `---
title: 测试故事
keywords:
  - 关键词
---

内容`;

    const result = parseYamlFrontMatter(content);

    expect(result.metadata.title).toBe('测试故事');
    expect(result.metadata.age).toBe('未知');
    expect(result.metadata.keywords).toEqual(['关键词']);
    expect(result.metadata.author).toBe('未知');
    expect(result.metadata.category).toBe('未分类');
    expect(result.metadata.language).toBe('zh');
  });

  it('完全没有 frontmatter 时全部使用默认值', () => {
    const content = `这是故事正文内容。`;

    const result = parseYamlFrontMatter(content, '新故事.md');

    expect(result.metadata.title).toBe('新故事');
    expect(result.metadata.age).toBe('未知');
    expect(result.metadata.keywords).toEqual([]);
    expect(result.metadata.author).toBe('未知');
    expect(result.metadata.category).toBe('未分类');
    expect(result.metadata.language).toBe('zh');
    expect(result.content).toBe('这是故事正文内容。');
  });

  it('空 frontmatter 时全部使用默认值', () => {
    const content = `---
---

这是故事正文内容。`;

    const result = parseYamlFrontMatter(content, '空故事.md');

    expect(result.metadata.title).toBe('空故事');
    expect(result.metadata.age).toBe('未知');
    expect(result.metadata.keywords).toEqual([]);
    expect(result.metadata.author).toBe('未知');
    expect(result.metadata.category).toBe('未分类');
    expect(result.metadata.language).toBe('zh');
  });

  it('没有提供文件名时使用默认标题', () => {
    const content = `---
age: 3-7岁
---

内容`;

    const result = parseYamlFrontMatter(content);

    expect(result.metadata.title).toBe('未命名故事');
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
language: zh
---

故事内容`;

    writeFileSync(testFile, content, 'utf-8');

    const result = parseStoryFile(testFile, testDir);

    expect(result.filename).toBe('test-story.md');
    expect(result.title).toBe('测试故事');
    expect(result.age).toBe('3-7岁');
    expect(result.keywords).toEqual(['关键词1']);
    expect(result.author).toBe('测试作者');
    expect(result.category).toBe('测试分类');
    expect(result.language).toBe('zh');
    expect(result.content).toBe('故事内容');
  });

  it('文件不存在时抛出错误', () => {
    const nonExistentFile = join(testDir, 'non-existent.md');
    expect(() => parseStoryFile(nonExistentFile, testDir)).toThrow();
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
language: zh
---

内容1`;

    const story2 = `---
title: 故事2
age: 5-10岁
keywords:
  - 关键词2
author: 作者2
category: 分类2
language: zh
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
language: zh
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
language: zh
---

内容`;

    // 使用无效的 YAML 语法（未闭合的引号）来触发解析错误
    const invalidStory = `---
title: "无效故事
---

无效内容`;

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

  it('缺失字段的故事文件使用默认值成功加载', () => {
    const storyWithMissingFields = `---
title: 缺失字段的故事
---

内容`;

    writeFileSync(join(testDir, 'missing-fields.md'), storyWithMissingFields, 'utf-8');

    const stories = loadAllStories(testDir);

    expect(stories).toHaveLength(1);
    expect(stories[0]?.title).toBe('缺失字段的故事');
    expect(stories[0]?.age).toBe('未知');
    expect(stories[0]?.author).toBe('未知');
    expect(stories[0]?.category).toBe('未分类');
    expect(stories[0]?.language).toBe('zh');
    expect(stories[0]?.keywords).toEqual([]);
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
