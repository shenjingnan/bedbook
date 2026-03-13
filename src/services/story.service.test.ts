import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Story } from '@/types';
import * as utils from '@/utils';
import { StoryService } from './story.service';

// Mock utils 模块
vi.mock('@/utils', () => ({
  getStoriesDir: vi.fn(),
  loadAllStories: vi.fn(),
  calculateSimilarity: vi.fn(),
}));

describe('StoryService', () => {
  let service: StoryService;
  const mockStories: Story[] = [
    {
      filename: '故事1.md',
      title: '小老虎怕下雨',
      age: '3-7岁',
      keywords: ['勇敢', '友谊'],
      author: 'Deepseek',
      category: '儿童故事',
      content: '森林里住着一只小老虎...',
    },
    {
      filename: '故事2.md',
      title: '小鹿的温柔脚步',
      age: '5-10岁',
      keywords: ['温柔', '善良'],
      author: 'Deepseek',
      category: '儿童故事',
      content: '森林深处住着一只小鹿...',
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    service = new StoryService();
  });

  describe('listStories', () => {
    it('返回正确的故事列表格式', async () => {
      vi.mocked(utils.loadAllStories).mockReturnValue(mockStories);
      vi.mocked(utils.getStoriesDir).mockReturnValue('/stories');

      const result = await service.listStories();

      expect(result.success).toBe(true);
      expect(result.count).toBe(2);
      expect(result.stories).toHaveLength(2);
    });

    it('不包含 content 字段', async () => {
      vi.mocked(utils.loadAllStories).mockReturnValue(mockStories);
      vi.mocked(utils.getStoriesDir).mockReturnValue('/stories');

      const result = await service.listStories();

      result.stories.forEach((story) => {
        expect(story).not.toHaveProperty('content');
      });
    });

    it('返回的故事包含所有必需字段', async () => {
      vi.mocked(utils.loadAllStories).mockReturnValue(mockStories);
      vi.mocked(utils.getStoriesDir).mockReturnValue('/stories');

      const result = await service.listStories();

      result.stories.forEach((story) => {
        expect(story).toHaveProperty('filename');
        expect(story).toHaveProperty('title');
        expect(story).toHaveProperty('age');
        expect(story).toHaveProperty('keywords');
        expect(story).toHaveProperty('author');
        expect(story).toHaveProperty('category');
      });
    });

    it('空故事列表返回正确格式', async () => {
      vi.mocked(utils.loadAllStories).mockReturnValue([]);
      vi.mocked(utils.getStoriesDir).mockReturnValue('/stories');

      const result = await service.listStories();

      expect(result.success).toBe(true);
      expect(result.count).toBe(0);
      expect(result.stories).toEqual([]);
    });
  });

  describe('searchStory', () => {
    it('按标题搜索返回最佳匹配', async () => {
      vi.mocked(utils.loadAllStories).mockReturnValue(mockStories);
      vi.mocked(utils.getStoriesDir).mockReturnValue('/stories');
      // 完全匹配
      vi.mocked(utils.calculateSimilarity).mockImplementation((str1, str2) => {
        if (str1 === str2) return 1;
        if (str1.includes(str2) || str2.includes(str1)) return 0.8;
        return 0.3;
      });

      const result = await service.searchStory(undefined, '小老虎怕下雨');

      expect(result.bestMatch).not.toBeNull();
      expect(result.bestMatch!.title).toBe('小老虎怕下雨');
      expect(result.bestMatch).toHaveProperty('content');
    });

    it('按年龄段搜索', async () => {
      vi.mocked(utils.loadAllStories).mockReturnValue(mockStories);
      vi.mocked(utils.getStoriesDir).mockReturnValue('/stories');
      vi.mocked(utils.calculateSimilarity).mockImplementation((str1, str2) => {
        if (str1 === str2) return 1;
        if (str1.includes(str2) || str2.includes(str1)) return 0.8;
        return 0.3;
      });

      const result = await service.searchStory('3-7岁');

      expect(result.bestMatch).not.toBeNull();
      expect(result.bestMatch!.age).toBe('3-7岁');
    });

    it('按关键词搜索', async () => {
      vi.mocked(utils.loadAllStories).mockReturnValue(mockStories);
      vi.mocked(utils.getStoriesDir).mockReturnValue('/stories');
      vi.mocked(utils.calculateSimilarity).mockReturnValue(0.3);

      const result = await service.searchStory(undefined, undefined, '勇敢');

      expect(result.bestMatch).not.toBeNull();
      expect(result.bestMatch!.keywords).toContain('勇敢');
    });

    it('综合搜索返回最佳匹配', async () => {
      vi.mocked(utils.loadAllStories).mockReturnValue(mockStories);
      vi.mocked(utils.getStoriesDir).mockReturnValue('/stories');
      vi.mocked(utils.calculateSimilarity).mockImplementation((str1, str2) => {
        if (str1 === str2) return 1;
        if (str1.includes(str2) || str2.includes(str1)) return 0.8;
        return 0.3;
      });

      const result = await service.searchStory('3-7岁', '小老虎', '勇敢');

      expect(result.bestMatch).not.toBeNull();
      expect(result.bestMatch!.title).toBe('小老虎怕下雨');
    });

    it('无匹配结果返回 null', async () => {
      vi.mocked(utils.loadAllStories).mockReturnValue(mockStories);
      vi.mocked(utils.getStoriesDir).mockReturnValue('/stories');
      vi.mocked(utils.calculateSimilarity).mockReturnValue(0.1);

      const result = await service.searchStory('99-100岁', '不存在的故事', '不存在的关键词');

      expect(result.bestMatch).toBeNull();
      expect(result.otherMatches).toEqual([]);
    });

    it('无搜索参数返回空结果', async () => {
      vi.mocked(utils.loadAllStories).mockReturnValue(mockStories);
      vi.mocked(utils.getStoriesDir).mockReturnValue('/stories');

      const result = await service.searchStory();

      expect(result.bestMatch).toBeNull();
      expect(result.otherMatches).toEqual([]);
    });

    it('其他匹配项不包含 content 字段', async () => {
      vi.mocked(utils.loadAllStories).mockReturnValue(mockStories);
      vi.mocked(utils.getStoriesDir).mockReturnValue('/stories');
      vi.mocked(utils.calculateSimilarity).mockImplementation((str1, str2) => {
        if (str1 === str2) return 1;
        if (str1.includes(str2) || str2.includes(str1)) return 0.8;
        return 0.5; // 让两个故事都有分数
      });

      const result = await service.searchStory(undefined, '小');

      // 最佳匹配有内容
      expect(result.bestMatch).toHaveProperty('content');

      // 其他匹配项没有内容
      result.otherMatches.forEach((match) => {
        expect(match).not.toHaveProperty('content');
      });
    });

    it('搜索结果按分数排序', async () => {
      vi.mocked(utils.loadAllStories).mockReturnValue(mockStories);
      vi.mocked(utils.getStoriesDir).mockReturnValue('/stories');

      // 第一个故事分数更高
      let callCount = 0;
      vi.mocked(utils.calculateSimilarity).mockImplementation(() => {
        callCount++;
        // 让第一个故事分数更高
        return callCount % 2 === 1 ? 0.9 : 0.5;
      });

      const result = await service.searchStory(undefined, '小老虎');

      // 最佳匹配应该是第一个故事（分数更高）
      expect(result.bestMatch!.title).toBe('小老虎怕下雨');
    });
  });
});
