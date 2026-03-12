/**
 * 模型对比数据
 * 包含支持的 AI 模型特点、价格、适用场景
 */

export type ModelProvider = "openai" | "deepseek" | "ollama" | "custom";
export type ModelCategory = "flagship" | "standard" | "budget" | "local";

export interface ModelInfo {
  id: string;
  provider: ModelProvider;
  category: ModelCategory;
  nameKey: string;
  descriptionKey: string;
  features: string[]; // 翻译键数组
  pricingKey: string;
  speedKey: string;
  bestForKey: string;
  limitationsKey: string;
}

export interface ProviderInfo {
  id: ModelProvider;
  nameKey: string;
  descriptionKey: string;
  website?: string;
}

export const MODEL_PROVIDERS: ProviderInfo[] = [
  {
    id: "openai",
    nameKey: "knowledge.models.providers.openai.name",
    descriptionKey: "knowledge.models.providers.openai.description",
    website: "https://openai.com",
  },
  {
    id: "deepseek",
    nameKey: "knowledge.models.providers.deepseek.name",
    descriptionKey: "knowledge.models.providers.deepseek.description",
    website: "https://deepseek.com",
  },
  {
    id: "ollama",
    nameKey: "knowledge.models.providers.ollama.name",
    descriptionKey: "knowledge.models.providers.ollama.description",
    website: "https://ollama.com",
  },
];

export const MODELS: ModelInfo[] = [
  // OpenAI 模型
  {
    id: "gpt-4o",
    provider: "openai",
    category: "flagship",
    nameKey: "knowledge.models.gpt4o.name",
    descriptionKey: "knowledge.models.gpt4o.description",
    features: [
      "knowledge.models.features.multimodal",
      "knowledge.models.features.reasoning",
      "knowledge.models.features.codeGeneration",
    ],
    pricingKey: "knowledge.models.pricing.high",
    speedKey: "knowledge.models.speed.medium",
    bestForKey: "knowledge.models.gpt4o.bestFor",
    limitationsKey: "knowledge.models.gpt4o.limitations",
  },
  {
    id: "gpt-4",
    provider: "openai",
    category: "flagship",
    nameKey: "knowledge.models.gpt4.name",
    descriptionKey: "knowledge.models.gpt4.description",
    features: [
      "knowledge.models.features.reasoning",
      "knowledge.models.features.codeGeneration",
      "knowledge.models.features.longContext",
    ],
    pricingKey: "knowledge.models.pricing.high",
    speedKey: "knowledge.models.speed.slow",
    bestForKey: "knowledge.models.gpt4.bestFor",
    limitationsKey: "knowledge.models.gpt4.limitations",
  },
  {
    id: "gpt-35-turbo",
    provider: "openai",
    category: "standard",
    nameKey: "knowledge.models.gpt35.name",
    descriptionKey: "knowledge.models.gpt35.description",
    features: [
      "knowledge.models.features.fastResponse",
      "knowledge.models.features.generalPurpose",
    ],
    pricingKey: "knowledge.models.pricing.medium",
    speedKey: "knowledge.models.speed.fast",
    bestForKey: "knowledge.models.gpt35.bestFor",
    limitationsKey: "knowledge.models.gpt35.limitations",
  },

  // DeepSeek 模型
  {
    id: "deepseek-chat",
    provider: "deepseek",
    category: "standard",
    nameKey: "knowledge.models.deepseekChat.name",
    descriptionKey: "knowledge.models.deepseekChat.description",
    features: [
      "knowledge.models.features.chineseSupport",
      "knowledge.models.features.fastResponse",
      "knowledge.models.features.generalPurpose",
    ],
    pricingKey: "knowledge.models.pricing.low",
    speedKey: "knowledge.models.speed.fast",
    bestForKey: "knowledge.models.deepseekChat.bestFor",
    limitationsKey: "knowledge.models.deepseekChat.limitations",
  },
  {
    id: "deepseek-reasoner",
    provider: "deepseek",
    category: "flagship",
    nameKey: "knowledge.models.deepseekReasoner.name",
    descriptionKey: "knowledge.models.deepseekReasoner.description",
    features: [
      "knowledge.models.features.deepReasoning",
      "knowledge.models.features.codeGeneration",
      "knowledge.models.features.chineseSupport",
    ],
    pricingKey: "knowledge.models.pricing.medium",
    speedKey: "knowledge.models.speed.slow",
    bestForKey: "knowledge.models.deepseekReasoner.bestFor",
    limitationsKey: "knowledge.models.deepseekReasoner.limitations",
  },

  // Ollama 本地模型
  {
    id: "llama3",
    provider: "ollama",
    category: "local",
    nameKey: "knowledge.models.llama3.name",
    descriptionKey: "knowledge.models.llama3.description",
    features: [
      "knowledge.models.features.local",
      "knowledge.models.features.privacy",
      "knowledge.models.features.offline",
    ],
    pricingKey: "knowledge.models.pricing.free",
    speedKey: "knowledge.models.speed.variable",
    bestForKey: "knowledge.models.llama3.bestFor",
    limitationsKey: "knowledge.models.llama3.limitations",
  },
  {
    id: "qwen",
    provider: "ollama",
    category: "local",
    nameKey: "knowledge.models.qwen.name",
    descriptionKey: "knowledge.models.qwen.description",
    features: [
      "knowledge.models.features.local",
      "knowledge.models.features.chineseSupport",
      "knowledge.models.features.offline",
    ],
    pricingKey: "knowledge.models.pricing.free",
    speedKey: "knowledge.models.speed.variable",
    bestForKey: "knowledge.models.qwen.bestFor",
    limitationsKey: "knowledge.models.qwen.limitations",
  },
];

/**
 * 按供应商获取模型列表
 */
export function getModelsByProvider(provider: ModelProvider): ModelInfo[] {
  return MODELS.filter((model) => model.provider === provider);
}

/**
 * 按分类获取模型列表
 */
export function getModelsByCategory(category: ModelCategory): ModelInfo[] {
  return MODELS.filter((model) => model.category === category);
}

/**
 * 获取旗舰模型
 */
export function getFlagshipModels(): ModelInfo[] {
  return getModelsByCategory("flagship");
}

/**
 * 获取本地模型
 */
export function getLocalModels(): ModelInfo[] {
  return getModelsByCategory("local");
}
