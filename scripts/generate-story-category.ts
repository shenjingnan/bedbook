#!/usr/bin/env npx tsx
/**
 * 随机选择一个故事分类
 * 用于每日随机故事生成 workflow
 */

const CATEGORIES = [
  'fairy-tale', // 童话故事
  'growth', // 成长故事
  'history', // 历史故事
  'idiom', // 成语故事
  'myth', // 神话故事
  'original', // 原创故事
  'science', // 科学故事
] as const;

// 随机选择一个分类
const category = CATEGORIES[Math.floor(Math.random() * CATEGORIES.length)];

// 输出 JSON 格式，方便 GitHub Actions 解析
console.log(JSON.stringify({ category }));
