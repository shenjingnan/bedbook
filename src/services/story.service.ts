import { Param, Tool } from "bestmcp";
import { z } from "zod";
import type { Story, SearchResult } from "@/types";
import { calculateSimilarity, getStoriesDir, loadAllStories } from "@/utils";

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
  @Tool("列出 stories 目录中所有故事")
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
  @Tool("根据年龄段、名称或关键词模糊搜索故事，返回最佳匹配")
  public async searchStory(
    @Param(z.string().optional().describe("年龄段筛选，如: 3-7岁"))
    age?: string,
    @Param(z.string().optional().describe("故事名称模糊匹配"))
    title?: string,
    @Param(z.string().optional().describe("关键词搜索"))
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
      }

      return { story, score };
    });

    // 过滤出有匹配的故事并按分数排序
    const matched = scoredStories
      .filter((item) => item.score > 0)
      .sort((a, b) => b.score - a.score);

    if (matched.length === 0) {
      return {
        bestMatch: null,
        otherMatches: [],
      };
    }

    // 最佳匹配（含完整内容）
    const bestMatch = matched[0]!.story;

    // 其他匹配项（不含内容）
    const otherMatches = matched.slice(1).map((item) => ({
      filename: item.story.filename,
      title: item.story.title,
      age: item.story.age,
      keywords: item.story.keywords,
      author: item.story.author,
      category: item.story.category,
    }));

    return {
      bestMatch,
      otherMatches,
    };
  }
}