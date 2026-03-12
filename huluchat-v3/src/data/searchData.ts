/**
 * 帮助文档搜索数据
 * 整合所有可搜索内容：提示词技巧、FAQ、模型对比
 */
import MiniSearch from "minisearch";
import { PROMPT_TIPS, type PromptTip } from "./promptTips";
import { FAQ_ITEMS, type FAQCategory } from "./faqData";
import { MODELS, type ModelInfo } from "./modelComparison";

// 搜索结果类型
export type SearchItemType = "tip" | "faq" | "model";

export interface SearchItem {
  id: string;
  type: SearchItemType;
  // 搜索字段
  title: string; // 翻译后的标题
  description: string; // 翻译后的描述/内容
  tags: string; // 标签（用于搜索）
  // 原始数据引用
  originalData: PromptTip | FAQItem | ModelInfo;
}

interface FAQItem {
  id: string;
  category: FAQCategory;
  questionKey: string;
  answerKey: string;
  order: number;
}

// 空的 MiniSearch 实例，用于初始化
let miniSearch: MiniSearch<SearchItem> | null = null;

/**
 * 创建搜索索引
 * @param t - i18next 翻译函数
 */
export function createSearchIndex(t: (key: string) => string): MiniSearch<SearchItem> {
  const searchItems: SearchItem[] = [];

  // 添加提示词技巧
  PROMPT_TIPS.forEach((tip) => {
    searchItems.push({
      id: `tip-${tip.id}`,
      type: "tip",
      title: t(tip.titleKey),
      description: t(tip.descriptionKey),
      tags: tip.tags.join(" "),
      originalData: tip,
    });
  });

  // 添加 FAQ
  FAQ_ITEMS.forEach((faq) => {
    searchItems.push({
      id: `faq-${faq.id}`,
      type: "faq",
      title: t(faq.questionKey),
      description: t(faq.answerKey),
      tags: "",
      originalData: faq,
    });
  });

  // 添加模型
  MODELS.forEach((model) => {
    searchItems.push({
      id: `model-${model.id}`,
      type: "model",
      title: t(model.nameKey),
      description: `${t(model.descriptionKey)} ${t(model.bestForKey)}`,
      tags: `${model.provider} ${model.category}`,
      originalData: model,
    });
  });

  // 创建 MiniSearch 实例
  miniSearch = new MiniSearch({
    fields: ["title", "description", "tags"], // 搜索字段
    storeFields: ["id", "type", "title", "description", "originalData"], // 返回字段
    searchOptions: {
      fuzzy: 0.2, // 模糊匹配
      prefix: true, // 前缀匹配
      boost: { title: 2 }, // 标题权重更高
    },
  });

  // 添加文档
  miniSearch.addAll(searchItems);

  return miniSearch;
}

/**
 * 获取现有的搜索索引
 */
export function getSearchIndex(): MiniSearch<SearchItem> | null {
  return miniSearch;
}

/**
 * 搜索帮助文档
 * @param query - 搜索关键词
 */
export function searchKnowledge(query: string): SearchItem[] {
  // 如果没有索引或查询为空，返回空数组
  if (!miniSearch || !query.trim()) {
    return [];
  }

  // 执行搜索
  const results = miniSearch.search(query);

  // 返回搜索结果（最多 10 个）
  return results.slice(0, 10).map((result) => ({
    id: result.id,
    type: result.type as SearchItemType,
    title: result.title,
    description: result.description,
    tags: "",
    originalData: result.originalData as PromptTip | FAQItem | ModelInfo,
  }));
}

/**
 * 获取搜索结果分类标签
 */
export function getSearchResultTypeLabel(type: SearchItemType): string {
  switch (type) {
    case "tip":
      return "knowledge.search.typeTip";
    case "faq":
      return "knowledge.search.typeFaq";
    case "model":
      return "knowledge.search.typeModel";
    default:
      return "";
  }
}
