/**
 * FAQ 常见问题数据
 * 包含分类和 15-20 个常见问题
 */

export type FAQCategory = "getting-started" | "models" | "features" | "privacy" | "troubleshooting";

export interface FAQItem {
  id: string;
  category: FAQCategory;
  questionKey: string;
  answerKey: string;
  order: number;
}

export interface FAQCategoryInfo {
  id: FAQCategory;
  titleKey: string;
  icon: string;
  order: number;
}

export const FAQ_CATEGORIES: FAQCategoryInfo[] = [
  { id: "getting-started", titleKey: "knowledge.faq.categories.gettingStarted", icon: "🚀", order: 1 },
  { id: "models", titleKey: "knowledge.faq.categories.models", icon: "🤖", order: 2 },
  { id: "features", titleKey: "knowledge.faq.categories.features", icon: "✨", order: 3 },
  { id: "privacy", titleKey: "knowledge.faq.categories.privacy", icon: "🔒", order: 4 },
  { id: "troubleshooting", titleKey: "knowledge.faq.categories.troubleshooting", icon: "🔧", order: 5 },
];

export const FAQ_ITEMS: FAQItem[] = [
  // Getting Started (4 questions)
  {
    id: "faq-api-key",
    category: "getting-started",
    questionKey: "knowledge.faq.questions.apiKey.question",
    answerKey: "knowledge.faq.questions.apiKey.answer",
    order: 1,
  },
  {
    id: "faq-first-chat",
    category: "getting-started",
    questionKey: "knowledge.faq.questions.firstChat.question",
    answerKey: "knowledge.faq.questions.firstChat.answer",
    order: 2,
  },
  {
    id: "faq-supported-models",
    category: "getting-started",
    questionKey: "knowledge.faq.questions.supportedModels.question",
    answerKey: "knowledge.faq.questions.supportedModels.answer",
    order: 3,
  },
  {
    id: "faq-local-models",
    category: "getting-started",
    questionKey: "knowledge.faq.questions.localModels.question",
    answerKey: "knowledge.faq.questions.localModels.answer",
    order: 4,
  },

  // Models (4 questions)
  {
    id: "faq-model-difference",
    category: "models",
    questionKey: "knowledge.faq.questions.modelDifference.question",
    answerKey: "knowledge.faq.questions.modelDifference.answer",
    order: 5,
  },
  {
    id: "faq-best-model",
    category: "models",
    questionKey: "knowledge.faq.questions.bestModel.question",
    answerKey: "knowledge.faq.questions.bestModel.answer",
    order: 6,
  },
  {
    id: "faq-model-cost",
    category: "models",
    questionKey: "knowledge.faq.questions.modelCost.question",
    answerKey: "knowledge.faq.questions.modelCost.answer",
    order: 7,
  },
  {
    id: "faq-deepseek-vs-openai",
    category: "models",
    questionKey: "knowledge.faq.questions.deepseekVsOpenai.question",
    answerKey: "knowledge.faq.questions.deepseekVsOpenai.answer",
    order: 8,
  },

  // Features (4 questions)
  {
    id: "faq-document-chat",
    category: "features",
    questionKey: "knowledge.faq.questions.documentChat.question",
    answerKey: "knowledge.faq.questions.documentChat.answer",
    order: 9,
  },
  {
    id: "faq-mcp",
    category: "features",
    questionKey: "knowledge.faq.questions.mcp.question",
    answerKey: "knowledge.faq.questions.mcp.answer",
    order: 10,
  },
  {
    id: "faq-prompt-templates",
    category: "features",
    questionKey: "knowledge.faq.questions.promptTemplates.question",
    answerKey: "knowledge.faq.questions.promptTemplates.answer",
    order: 11,
  },
  {
    id: "faq-export-chat",
    category: "features",
    questionKey: "knowledge.faq.questions.exportChat.question",
    answerKey: "knowledge.faq.questions.exportChat.answer",
    order: 12,
  },

  // Privacy (3 questions)
  {
    id: "faq-data-collection",
    category: "privacy",
    questionKey: "knowledge.faq.questions.dataCollection.question",
    answerKey: "knowledge.faq.questions.dataCollection.answer",
    order: 13,
  },
  {
    id: "faq-data-storage",
    category: "privacy",
    questionKey: "knowledge.faq.questions.dataStorage.question",
    answerKey: "knowledge.faq.questions.dataStorage.answer",
    order: 14,
  },
  {
    id: "faq-offline",
    category: "privacy",
    questionKey: "knowledge.faq.questions.offline.question",
    answerKey: "knowledge.faq.questions.offline.answer",
    order: 15,
  },

  // Troubleshooting (4 questions)
  {
    id: "faq-connection-error",
    category: "troubleshooting",
    questionKey: "knowledge.faq.questions.connectionError.question",
    answerKey: "knowledge.faq.questions.connectionError.answer",
    order: 16,
  },
  {
    id: "faq-slow-response",
    category: "troubleshooting",
    questionKey: "knowledge.faq.questions.slowResponse.question",
    answerKey: "knowledge.faq.questions.slowResponse.answer",
    order: 17,
  },
  {
    id: "faq-ollama-connection",
    category: "troubleshooting",
    questionKey: "knowledge.faq.questions.ollamaConnection.question",
    answerKey: "knowledge.faq.questions.ollamaConnection.answer",
    order: 18,
  },
  {
    id: "faq-update",
    category: "troubleshooting",
    questionKey: "knowledge.faq.questions.update.question",
    answerKey: "knowledge.faq.questions.update.answer",
    order: 19,
  },
];

/**
 * 按分类获取 FAQ 项
 */
export function getFAQByCategory(category: FAQCategory): FAQItem[] {
  return FAQ_ITEMS.filter((item) => item.category === category).sort(
    (a, b) => a.order - b.order
  );
}

/**
 * 获取所有分类的 FAQ（按分类分组）
 */
export function getFAQGroupedByCategory(): Record<FAQCategory, FAQItem[]> {
  const grouped: Record<FAQCategory, FAQItem[]> = {
    "getting-started": [],
    models: [],
    features: [],
    privacy: [],
    troubleshooting: [],
  };

  FAQ_ITEMS.forEach((item) => {
    grouped[item.category].push(item);
  });

  // 对每个分类内的项目排序
  Object.keys(grouped).forEach((category) => {
    grouped[category as FAQCategory].sort((a, b) => a.order - b.order);
  });

  return grouped;
}
