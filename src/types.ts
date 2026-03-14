/**
 * 故事元数据接口
 * 对应 YAML Front Matter 中的字段
 */
export interface StoryMetadata {
  /** 故事标题 */
  title: string;
  /** 适合年龄段 */
  age: string;
  /** 关键词标签 */
  keywords: string[];
  /** 作者 */
  author: string;
  /** 分类 */
  category: string;
  /** 故事语言，如 'zh', 'en' */
  language: string;
}

/**
 * 完整故事接口
 * 包含元数据和内容
 */
export interface Story extends StoryMetadata {
  /** 文件名 */
  filename: string;
  /** 故事正文内容 */
  content: string;
}

/**
 * 搜索参数接口
 */
export interface StorySearchParams {
  /** 年龄段筛选 */
  age?: string;
  /** 故事名称模糊匹配 */
  title?: string;
  /** 关键词搜索 */
  keyword?: string;
}

/**
 * 搜索结果接口
 */
export interface SearchResult {
  /** 最佳匹配故事（含完整内容） */
  bestMatch: Story | null;
  /** 其他匹配项列表（不含内容） */
  otherMatches: Array<Omit<Story, 'content'>>;
}
