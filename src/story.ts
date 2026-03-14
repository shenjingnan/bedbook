import { Param, Tool } from 'bestmcp';
import { z } from 'zod';
import type { SearchResult, Story } from '@/types';
import { calculateSimilarity, getStoriesDir, loadAllStories } from '@/utils';
import { readCountManager } from '@/readCount';

/**
 * 故事服务类
 * 提供故事列表和搜索功能
 */
export class StoryService {
  private stories: Story[] | null = null;

  /**
   * 获取故事列表（带缓存）
   */
  private getStories(): Story[] {
    if (this.stories === null) {
      const storiesDir = getStoriesDir();
      this.stories = loadAllStories(storiesDir);
    }
    return this.stories;
  }

  /**
   * 列出所有故事
   * 返回故事列表（不含完整内容）
   */
  @Tool('列出 stories 目录中所有故事')
  public async listStories() {
    const stories = this.getStories();

    // 返回故事列表，不包含完整内容
    const storyList = stories.map((story) => ({
      filename: story.filename,
      title: story.title,
      age: story.age,
      keywords: story.keywords,
      author: story.author,
      category: story.category,
      language: story.language,
      readCount: readCountManager.getReadCount(story.filename),
    }));

    return {
      success: true,
      count: storyList.length,
      stories: storyList,
    };
  }

  /**
   * 搜索故事
   * 根据年龄段、名称或关键词模糊搜索故事，返回最佳匹配
   */
  @Tool('根据年龄段、名称或关键词模糊搜索故事，返回最佳匹配')
  public async searchStory(
    @Param(z.string().optional().describe('年龄段筛选，如: 3-7岁'))
    age?: string,
    @Param(z.string().optional().describe('故事名称模糊匹配'))
    title?: string,
    @Param(z.string().optional().describe('关键词搜索'))
    keyword?: string
  ): Promise<SearchResult> {
    const stories = this.getStories();

    // 如果没有任何搜索条件，返回空结果
    if (!age && !title && !keyword) {
      return {
        bestMatch: null,
        otherMatches: [],
      };
    }

    // 计算每个故事的匹配分数
    const scoredStories = stories.map((story) => {
      let score = 0;

      // 年龄匹配
      if (age) {
        const ageSimilarity = calculateSimilarity(story.age, age);
        if (ageSimilarity > 0.5) {
          score += ageSimilarity * 0.3;
        }
      }

      // 标题匹配
      if (title) {
        const titleSimilarity = calculateSimilarity(story.title, title);
        if (titleSimilarity > 0.3) {
          score += titleSimilarity * 0.4;
        }
      }

      // 关键词匹配
      if (keyword) {
        const keywordLower = keyword.toLowerCase();
        const matchedKeywords = story.keywords.filter((k) => {
          const kLower = k.toLowerCase();
          return (
            kLower.includes(keywordLower) ||
            keywordLower.includes(kLower) ||
            calculateSimilarity(kLower, keywordLower) > 0.6
          );
        });
        if (matchedKeywords.length > 0) {
          score += (matchedKeywords.length / story.keywords.length) * 0.3;
        }

        // category 匹配
        const categoryLower = story.category.toLowerCase();
        if (
          categoryLower.includes(keywordLower) ||
          keywordLower.includes(categoryLower) ||
          calculateSimilarity(categoryLower, keywordLower) > 0.6
        ) {
          score += 0.25;
        }

        // content 匹配
        const contentLower = story.content.toLowerCase();
        if (contentLower.includes(keywordLower)) {
          score += 0.2;
        }
      }

      const readCount = readCountManager.getReadCount(story.filename);

      return { story, score, readCount };
    });

    // 过滤出有匹配的故事并排序
    // 先按分数降序，分数相同时按阅读次数升序（阅读少的优先展示）
    const matched = scoredStories
      .filter((item) => item.score > 0)
      .sort((a, b) => {
        if (b.score !== a.score) {
          return b.score - a.score;
        }
        return a.readCount - b.readCount;
      });

    if (matched.length === 0) {
      return {
        bestMatch: null,
        otherMatches: [],
      };
    }

    // 最佳匹配（含完整内容）
    const [{ story: bestMatch, readCount: bestMatchReadCount }] = matched;

    // 增加最佳匹配的阅读次数
    readCountManager.incrementReadCount(bestMatch.filename);
    readCountManager.saveReadCounts();

    // 其他匹配项（不含内容）
    const otherMatches = matched.slice(1).map((item) => ({
      filename: item.story.filename,
      title: item.story.title,
      age: item.story.age,
      keywords: item.story.keywords,
      author: item.story.author,
      category: item.story.category,
      language: item.story.language,
      readCount: item.readCount,
    }));

    return {
      bestMatch: {
        ...bestMatch,
        readCount: bestMatchReadCount,
      },
      otherMatches,
    };
  }
}
