/**
 * 错误码映射和解决建议数据
 * 隐私设计：只提供静态解决方案，不收集用户错误信息
 */

/**
 * 错误类别
 */
export type ErrorCategory =
  | "api_key"      // API Key 相关
  | "connection"   // 连接问题
  | "model"        // 模型相关
  | "ollama"       // Ollama 本地模型
  | "rag"          // 文档对话/RAG
  | "general";     // 通用错误

/**
 * 解决方案步骤
 */
export interface SolutionStep {
  stepKey: string;        // 步骤翻译键
  action?: string;        // 可选的操作指令（如打开设置）
}

/**
 * 错误码配置
 */
export interface ErrorCodeConfig {
  id: string;                     // 错误码 ID
  category: ErrorCategory;        // 错误类别
  titleKey: string;               // 标题翻译键
  descriptionKey: string;         // 描述翻译键
  symptoms: string[];             // 症状关键词（用于匹配）
  solutions: SolutionStep[];      // 解决方案步骤
  relatedSettings?: string;       // 相关设置页面
  learnMoreUrl?: string;          // 了解更多链接
}

/**
 * 错误码配置数据
 * 基于后端错误和常见用户反馈整理
 */
export const ERROR_CODES: ErrorCodeConfig[] = [
  // ========== API Key 相关 ==========
  {
    id: "ERR_API_KEY_MISSING",
    category: "api_key",
    titleKey: "errors.apiKeyMissing.title",
    descriptionKey: "errors.apiKeyMissing.description",
    symptoms: ["api key not configured", "missing api key", "no api key", "api_key", "未配置", "缺少 api"],
    solutions: [
      { stepKey: "errors.apiKeyMissing.step1", action: "open-settings" },
      { stepKey: "errors.apiKeyMissing.step2" },
      { stepKey: "errors.apiKeyMissing.step3" },
    ],
    relatedSettings: "api",
  },
  {
    id: "ERR_API_KEY_INVALID",
    category: "api_key",
    titleKey: "errors.apiKeyInvalid.title",
    descriptionKey: "errors.apiKeyInvalid.description",
    symptoms: ["invalid api key", "invalid_api_key", "unauthorized", "401", "无效", "认证失败", "api key provided"],
    solutions: [
      { stepKey: "errors.apiKeyInvalid.step1", action: "open-settings" },
      { stepKey: "errors.apiKeyInvalid.step2" },
      { stepKey: "errors.apiKeyInvalid.step3" },
    ],
    relatedSettings: "api",
  },
  {
    id: "ERR_API_KEY_FORMAT",
    category: "api_key",
    titleKey: "errors.apiKeyFormat.title",
    descriptionKey: "errors.apiKeyFormat.description",
    symptoms: ["format", "incorrect", "sk-", "格式", "不正确"],
    solutions: [
      { stepKey: "errors.apiKeyFormat.step1" },
      { stepKey: "errors.apiKeyFormat.step2" },
    ],
    relatedSettings: "api",
  },

  // ========== 连接问题 ==========
  {
    id: "ERR_CONNECTION_FAILED",
    category: "connection",
    titleKey: "errors.connectionFailed.title",
    descriptionKey: "errors.connectionFailed.description",
    symptoms: ["connection", "failed", "network", "econnrefused", "连接失败", "网络"],
    solutions: [
      { stepKey: "errors.connectionFailed.step1" },
      { stepKey: "errors.connectionFailed.step2" },
      { stepKey: "errors.connectionFailed.step3" },
    ],
  },
  {
    id: "ERR_TIMEOUT",
    category: "connection",
    titleKey: "errors.timeout.title",
    descriptionKey: "errors.timeout.description",
    symptoms: ["timeout", "timed out", "超时", "响应时间"],
    solutions: [
      { stepKey: "errors.timeout.step1" },
      { stepKey: "errors.timeout.step2", action: "open-settings" },
    ],
    relatedSettings: "advanced",
  },
  {
    id: "ERR_PROXY",
    category: "connection",
    titleKey: "errors.proxy.title",
    descriptionKey: "errors.proxy.description",
    symptoms: ["proxy", "vpn", "代理", "地区限制", "china", "中国"],
    solutions: [
      { stepKey: "errors.proxy.step1" },
      { stepKey: "errors.proxy.step2" },
      { stepKey: "errors.proxy.step3", action: "open-settings" },
    ],
    relatedSettings: "api",
  },
  {
    id: "ERR_BACKEND_OFFLINE",
    category: "connection",
    titleKey: "errors.backendOffline.title",
    descriptionKey: "errors.backendOffline.description",
    symptoms: ["backend", "offline", "not running", "后端", "服务未启动", "8765"],
    solutions: [
      { stepKey: "errors.backendOffline.step1" },
      { stepKey: "errors.backendOffline.step2" },
    ],
  },

  // ========== 模型相关 ==========
  {
    id: "ERR_MODEL_NOT_FOUND",
    category: "model",
    titleKey: "errors.modelNotFound.title",
    descriptionKey: "errors.modelNotFound.description",
    symptoms: ["model", "not found", "does not exist", "模型", "不存在", "unknown model"],
    solutions: [
      { stepKey: "errors.modelNotFound.step1" },
      { stepKey: "errors.modelNotFound.step2", action: "open-settings" },
    ],
    relatedSettings: "model",
  },
  {
    id: "ERR_RATE_LIMIT",
    category: "model",
    titleKey: "errors.rateLimit.title",
    descriptionKey: "errors.rateLimit.description",
    symptoms: ["rate limit", "429", "too many", "请求过多", "限流", "quota"],
    solutions: [
      { stepKey: "errors.rateLimit.step1" },
      { stepKey: "errors.rateLimit.step2" },
      { stepKey: "errors.rateLimit.step3" },
    ],
  },
  {
    id: "ERR_INSUFFICIENT_QUOTA",
    category: "model",
    titleKey: "errors.insufficientQuota.title",
    descriptionKey: "errors.insufficientQuota.description",
    symptoms: ["insufficient", "quota", "billing", "余额不足", "计费", "credits"],
    solutions: [
      { stepKey: "errors.insufficientQuota.step1" },
      { stepKey: "errors.insufficientQuota.step2" },
    ],
  },
  {
    id: "ERR_CONTEXT_LENGTH",
    category: "model",
    titleKey: "errors.contextLength.title",
    descriptionKey: "errors.contextLength.description",
    symptoms: ["context", "length", "token", "too long", "上下文", "长度", "maximum"],
    solutions: [
      { stepKey: "errors.contextLength.step1" },
      { stepKey: "errors.contextLength.step2" },
      { stepKey: "errors.contextLength.step3" },
    ],
  },

  // ========== Ollama 本地模型 ==========
  {
    id: "ERR_OLLAMA_NOT_RUNNING",
    category: "ollama",
    titleKey: "errors.ollamaNotRunning.title",
    descriptionKey: "errors.ollamaNotRunning.description",
    symptoms: ["ollama", "not running", " unavailable", "11434", "本地模型", "未启动"],
    solutions: [
      { stepKey: "errors.ollamaNotRunning.step1" },
      { stepKey: "errors.ollamaNotRunning.step2" },
      { stepKey: "errors.ollamaNotRunning.step3", action: "test-ollama" },
    ],
    relatedSettings: "ollama",
  },
  {
    id: "ERR_OLLAMA_MODEL_NOT_FOUND",
    category: "ollama",
    titleKey: "errors.ollamaModelNotFound.title",
    descriptionKey: "errors.ollamaModelNotFound.description",
    symptoms: ["ollama", "model", "pull", "拉取", "下载模型"],
    solutions: [
      { stepKey: "errors.ollamaModelNotFound.step1" },
      { stepKey: "errors.ollamaModelNotFound.step2" },
      { stepKey: "errors.ollamaModelNotFound.step3", action: "open-settings" },
    ],
    relatedSettings: "ollama",
  },
  {
    id: "ERR_OLLAMA_OUT_OF_MEMORY",
    category: "ollama",
    titleKey: "errors.ollamaOOM.title",
    descriptionKey: "errors.ollamaOOM.description",
    symptoms: ["ollama", "memory", "oom", "out of memory", "内存不足", "gpu"],
    solutions: [
      { stepKey: "errors.ollamaOOM.step1" },
      { stepKey: "errors.ollamaOOM.step2" },
      { stepKey: "errors.ollamaOOM.step3" },
    ],
  },

  // ========== RAG/文档对话 ==========
  {
    id: "ERR_RAG_FILE_TOO_LARGE",
    category: "rag",
    titleKey: "errors.ragFileTooLarge.title",
    descriptionKey: "errors.ragFileTooLarge.description",
    symptoms: ["file", "too large", "5mb", "文件过大", "大小限制"],
    solutions: [
      { stepKey: "errors.ragFileTooLarge.step1" },
      { stepKey: "errors.ragFileTooLarge.step2" },
    ],
  },
  {
    id: "ERR_RAG_UNSUPPORTED_FORMAT",
    category: "rag",
    titleKey: "errors.ragUnsupportedFormat.title",
    descriptionKey: "errors.ragUnsupportedFormat.description",
    symptoms: ["unsupported", "format", "不支持的格式", "pdf", "txt", "md"],
    solutions: [
      { stepKey: "errors.ragUnsupportedFormat.step1" },
      { stepKey: "errors.ragUnsupportedFormat.step2" },
    ],
  },
  {
    id: "ERR_RAG_NO_DOCUMENTS",
    category: "rag",
    titleKey: "errors.ragNoDocuments.title",
    descriptionKey: "errors.ragNoDocuments.description",
    symptoms: ["no documents", "empty", "没有文档", "索引为空", "未上传"],
    solutions: [
      { stepKey: "errors.ragNoDocuments.step1" },
      { stepKey: "errors.ragNoDocuments.step2" },
    ],
  },

  // ========== 通用错误 ==========
  {
    id: "ERR_UNKNOWN",
    category: "general",
    titleKey: "errors.unknown.title",
    descriptionKey: "errors.unknown.description",
    symptoms: [],  // 兜底错误，无特定关键词
    solutions: [
      { stepKey: "errors.unknown.step1" },
      { stepKey: "errors.unknown.step2" },
      { stepKey: "errors.unknown.step3" },
    ],
  },
];

/**
 * 错误类别信息
 */
export interface CategoryInfo {
  id: ErrorCategory;
  titleKey: string;
  icon: string;
}

export const ERROR_CATEGORIES: CategoryInfo[] = [
  { id: "api_key", titleKey: "errors.categories.apiKey", icon: "🔑" },
  { id: "connection", titleKey: "errors.categories.connection", icon: "🌐" },
  { id: "model", titleKey: "errors.categories.model", icon: "🤖" },
  { id: "ollama", titleKey: "errors.categories.ollama", icon: "💻" },
  { id: "rag", titleKey: "errors.categories.rag", icon: "📄" },
  { id: "general", titleKey: "errors.categories.general", icon: "⚠️" },
];

/**
 * 根据错误信息匹配错误码
 * @param errorMessage 错误信息
 * @returns 匹配的错误码配置，如果没有匹配则返回通用错误
 */
export function matchErrorCode(errorMessage: string): ErrorCodeConfig {
  const lowerMessage = errorMessage.toLowerCase();

  // 按顺序匹配症状关键词
  for (const errorConfig of ERROR_CODES) {
    if (errorConfig.id === "ERR_UNKNOWN") continue;  // 跳过通用错误

    for (const symptom of errorConfig.symptoms) {
      if (lowerMessage.includes(symptom.toLowerCase())) {
        return errorConfig;
      }
    }
  }

  // 返回通用错误作为兜底
  return ERROR_CODES.find(e => e.id === "ERR_UNKNOWN")!;
}

/**
 * 根据类别获取错误列表
 */
export function getErrorsByCategory(category: ErrorCategory): ErrorCodeConfig[] {
  return ERROR_CODES.filter(e => e.category === category);
}

/**
 * 根据ID获取错误配置
 */
export function getErrorById(id: string): ErrorCodeConfig | undefined {
  return ERROR_CODES.find(e => e.id === id);
}
