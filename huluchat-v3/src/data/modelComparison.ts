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
  // OpenAI 模型 - Latest Generation
  {
    id: "gpt-4.1",
    provider: "openai",
    category: "flagship",
    nameKey: "knowledge.models.gpt41.name",
    descriptionKey: "knowledge.models.gpt41.description",
    features: [
      "knowledge.models.features.multimodal",
      "knowledge.models.features.reasoning",
      "knowledge.models.features.codeGeneration",
    ],
    pricingKey: "knowledge.models.pricing.high",
    speedKey: "knowledge.models.speed.medium",
    bestForKey: "knowledge.models.gpt41.bestFor",
    limitationsKey: "knowledge.models.gpt41.limitations",
  },
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
    id: "gpt-4o-mini",
    provider: "openai",
    category: "standard",
    nameKey: "knowledge.models.gpt4oMini.name",
    descriptionKey: "knowledge.models.gpt4oMini.description",
    features: [
      "knowledge.models.features.fastResponse",
      "knowledge.models.features.generalPurpose",
    ],
    pricingKey: "knowledge.models.pricing.low",
    speedKey: "knowledge.models.speed.fast",
    bestForKey: "knowledge.models.gpt4oMini.bestFor",
    limitationsKey: "knowledge.models.gpt4oMini.limitations",
  },
  // OpenAI Reasoning Models
  {
    id: "o3-mini",
    provider: "openai",
    category: "flagship",
    nameKey: "knowledge.models.o3Mini.name",
    descriptionKey: "knowledge.models.o3Mini.description",
    features: [
      "knowledge.models.features.deepReasoning",
      "knowledge.models.features.codeGeneration",
    ],
    pricingKey: "knowledge.models.pricing.medium",
    speedKey: "knowledge.models.speed.medium",
    bestForKey: "knowledge.models.o3Mini.bestFor",
    limitationsKey: "knowledge.models.o3Mini.limitations",
  },
  {
    id: "o1",
    provider: "openai",
    category: "flagship",
    nameKey: "knowledge.models.o1.name",
    descriptionKey: "knowledge.models.o1.description",
    features: [
      "knowledge.models.features.deepReasoning",
      "knowledge.models.features.codeGeneration",
    ],
    pricingKey: "knowledge.models.pricing.high",
    speedKey: "knowledge.models.speed.slow",
    bestForKey: "knowledge.models.o1.bestFor",
    limitationsKey: "knowledge.models.o1.limitations",
  },
  {
    id: "o1-mini",
    provider: "openai",
    category: "standard",
    nameKey: "knowledge.models.o1Mini.name",
    descriptionKey: "knowledge.models.o1Mini.description",
    features: [
      "knowledge.models.features.deepReasoning",
      "knowledge.models.features.fastResponse",
    ],
    pricingKey: "knowledge.models.pricing.medium",
    speedKey: "knowledge.models.speed.medium",
    bestForKey: "knowledge.models.o1Mini.bestFor",
    limitationsKey: "knowledge.models.o1Mini.limitations",
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

  // Claude 模型 - Latest Generation
  {
    id: "claude-sonnet-4-20250514",
    provider: "openai",
    category: "flagship",
    nameKey: "knowledge.models.claudeSonnet4.name",
    descriptionKey: "knowledge.models.claudeSonnet4.description",
    features: [
      "knowledge.models.features.codeGeneration",
      "knowledge.models.features.reasoning",
      "knowledge.models.features.agents",
    ],
    pricingKey: "knowledge.models.pricing.high",
    speedKey: "knowledge.models.speed.medium",
    bestForKey: "knowledge.models.claudeSonnet4.bestFor",
    limitationsKey: "knowledge.models.claudeSonnet4.limitations",
  },
  {
    id: "claude-3-5-sonnet-20241022",
    provider: "openai",
    category: "flagship",
    nameKey: "knowledge.models.claude35Sonnet.name",
    descriptionKey: "knowledge.models.claude35Sonnet.description",
    features: [
      "knowledge.models.features.codeGeneration",
      "knowledge.models.features.multimodal",
    ],
    pricingKey: "knowledge.models.pricing.high",
    speedKey: "knowledge.models.speed.medium",
    bestForKey: "knowledge.models.claude35Sonnet.bestFor",
    limitationsKey: "knowledge.models.claude35Sonnet.limitations",
  },
  {
    id: "claude-3-5-haiku-20241022",
    provider: "openai",
    category: "standard",
    nameKey: "knowledge.models.claude35Haiku.name",
    descriptionKey: "knowledge.models.claude35Haiku.description",
    features: [
      "knowledge.models.features.fastResponse",
      "knowledge.models.features.generalPurpose",
    ],
    pricingKey: "knowledge.models.pricing.medium",
    speedKey: "knowledge.models.speed.fast",
    bestForKey: "knowledge.models.claude35Haiku.bestFor",
    limitationsKey: "knowledge.models.claude35Haiku.limitations",
  },

  // Ollama 本地模型
  {
    id: "llama3.3",
    provider: "ollama",
    category: "local",
    nameKey: "knowledge.models.llama33.name",
    descriptionKey: "knowledge.models.llama33.description",
    features: [
      "knowledge.models.features.local",
      "knowledge.models.features.privacy",
      "knowledge.models.features.offline",
    ],
    pricingKey: "knowledge.models.pricing.free",
    speedKey: "knowledge.models.speed.variable",
    bestForKey: "knowledge.models.llama33.bestFor",
    limitationsKey: "knowledge.models.llama33.limitations",
  },
  {
    id: "qwen2.5",
    provider: "ollama",
    category: "local",
    nameKey: "knowledge.models.qwen25.name",
    descriptionKey: "knowledge.models.qwen25.description",
    features: [
      "knowledge.models.features.local",
      "knowledge.models.features.chineseSupport",
      "knowledge.models.features.offline",
    ],
    pricingKey: "knowledge.models.pricing.free",
    speedKey: "knowledge.models.speed.variable",
    bestForKey: "knowledge.models.qwen25.bestFor",
    limitationsKey: "knowledge.models.qwen25.limitations",
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
