import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import type { ReadCountRecord } from '@/types';
import { getStoriesDir } from '@/utils';

/**
 * 阅读次数管理器
 * 负责管理故事的阅读次数统计和持久化
 */
export class ReadCountManager {
  /** 阅读次数数据文件名 */
  private static readonly DATA_FILE = '.read-counts.json';

  /** 内存缓存的阅读次数记录 */
  private readCounts: ReadCountRecord = {};

  /** 数据文件路径 */
  private dataFilePath: string;

  constructor() {
    const storiesDir = getStoriesDir();
    this.dataFilePath = join(storiesDir, ReadCountManager.DATA_FILE);
    this.loadReadCounts();
  }

  /**
   * 加载阅读次数数据
   * 如果文件不存在或解析失败，初始化为空对象
   */
  public loadReadCounts(): void {
    try {
      if (existsSync(this.dataFilePath)) {
        const content = readFileSync(this.dataFilePath, 'utf-8');
        this.readCounts = JSON.parse(content);
      } else {
        this.readCounts = {};
      }
    } catch (error) {
      console.warn('加载阅读次数数据失败，将重置为空:', error);
      this.readCounts = {};
    }
  }

  /**
   * 保存阅读次数数据到文件
   */
  public saveReadCounts(): void {
    try {
      writeFileSync(this.dataFilePath, JSON.stringify(this.readCounts, null, 2), 'utf-8');
    } catch (error) {
      console.error('保存阅读次数数据失败:', error);
    }
  }

  /**
   * 获取指定故事的阅读次数
   * @param filename 故事文件相对路径
   * @returns 阅读次数，默认为 0
   */
  public getReadCount(filename: string): number {
    return this.readCounts[filename] ?? 0;
  }

  /**
   * 增加指定故事的阅读次数
   * @param filename 故事文件相对路径
   */
  public incrementReadCount(filename: string): void {
    this.readCounts[filename] = this.getReadCount(filename) + 1;
  }
}

/** 全局单例 */
export const readCountManager = new ReadCountManager();
