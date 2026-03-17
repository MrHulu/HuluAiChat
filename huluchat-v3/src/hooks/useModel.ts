/**
 * useModel Hook
 * 管理当前选择的 AI 模型
 * 支持本地偏好学习（隐私优先：所有数据存储在本地）
 */
import { useState, useEffect, useCallback } from "react";
import {
  getSettings,
  getModels,
  getOllamaStatus,
  getOllamaModels,
  recordModelUsage,
  getRecommendedModel,
  type ModelInfo,
  type OllamaModel,
} from "@/api/client";

export interface ChatParameters {
  temperature: number;
  top_p: number;
  max_tokens: number;
}

export interface UseModelReturn {
  /** 当前选择的模型 ID */
  currentModel: string;
  /** 可用的模型列表 */
  models: ModelInfo[];
  /** 设置当前模型 */
  setModel: (modelId: string) => void;
  /** 是否正在加载 */
  isLoading: boolean;
  /** 获取当前模型的显示名称 */
  getModelName: (modelId?: string) => string;
  /** Ollama 是否可用 */
  ollamaAvailable: boolean;
  /** Ollama 本地模型列表 */
  ollamaModels: OllamaModel[];
  /** 刷新 Ollama 模型列表 */
  refreshOllamaModels: () => Promise<void>;
  /** 刷新模型数据（从后端重新加载） */
  refresh: () => Promise<void>;
  /** 聊天参数 */
  parameters: ChatParameters;
  /** 推荐的模型 ID */
  recommendedModel: string | null;
}

const STORAGE_KEY = "huluchat-selected-model";

export function useModel(): UseModelReturn {
  const [currentModel, setCurrentModel] = useState<string>("");
  const [models, setModels] = useState<ModelInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [ollamaAvailable, setOllamaAvailable] = useState(false);
  const [ollamaModels, setOllamaModels] = useState<OllamaModel[]>([]);
  const [parameters, setParameters] = useState<ChatParameters>({
    temperature: 0.7,
    top_p: 1.0,
    max_tokens: 4096,
  });
  const [recommendedModel, setRecommendedModel] = useState<string | null>(null);

  // 检查 Ollama 状态
  useEffect(() => {
    const checkOllamaStatus = async () => {
      try {
        const status = await getOllamaStatus();
        setOllamaAvailable(status.available);
        if (status.available) {
          const models = await getOllamaModels();
          setOllamaModels(models);
        }
      } catch {
        setOllamaAvailable(false);
      }
    };
    checkOllamaStatus();
  }, []);

  // 加载模型列表和默认模型
  useEffect(() => {
    const loadModelData = async () => {
      setIsLoading(true);
      try {
        // 并行加载设置和模型列表
        const [settings, modelList] = await Promise.all([
          getSettings(),
          getModels(),
        ]);

        setModels(modelList);

        // 获取推荐模型
        const modelIds = modelList.map((m) => m.id);
        try {
          const recommended = await getRecommendedModel(modelIds);
          if (recommended.model_id) {
            setRecommendedModel(recommended.model_id);
          }
        } catch {
          // Ignore recommendation errors
        }

        // 优先级：localStorage > 推荐模型 > 后端设置 > 第一个可用模型
        // 注意：自定义模型可能不在预定义列表中，但仍应使用
        const savedModel = localStorage.getItem(STORAGE_KEY);
        if (savedModel) {
          // 如果在列表中，直接使用
          if (modelList.some((m) => m.id === savedModel)) {
            setCurrentModel(savedModel);
          } else {
            // 自定义模型：添加到列表并使用
            const customModelInfo: ModelInfo = {
              id: savedModel,
              name: savedModel,
              description: "Custom model",
              provider: "openai",
            };
            setModels((prev) => {
              // 避免重复添加
              if (prev.some((m) => m.id === savedModel)) {
                return prev;
              }
              return [...prev, customModelInfo];
            });
            setCurrentModel(savedModel);
          }
        } else if (recommendedModel && modelList.some((m) => m.id === recommendedModel)) {
          setCurrentModel(recommendedModel);
        } else if (settings.openai_model) {
          // 使用后端设置的模型
          if (modelList.some((m) => m.id === settings.openai_model)) {
            setCurrentModel(settings.openai_model);
          } else {
            // 自定义模型：添加到列表并使用
            const customModelInfo: ModelInfo = {
              id: settings.openai_model,
              name: settings.openai_model,
              description: "Custom model",
              provider: "openai",
            };
            setModels((prev) => {
              // 避免重复添加
              if (prev.some((m) => m.id === settings.openai_model)) {
                return prev;
              }
              return [...prev, customModelInfo];
            });
            setCurrentModel(settings.openai_model);
          }
        } else if (modelList.length > 0) {
          setCurrentModel(modelList[0].id);
        }

        // 加载模型参数
        setParameters({
          temperature: settings.temperature ?? 0.7,
          top_p: settings.top_p ?? 1.0,
          max_tokens: settings.max_tokens ?? 4096,
        });
      } catch (error) {
        console.error("Failed to load model data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadModelData();
    // Note: recommendedModel is intentionally excluded - it's set inside this effect
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 设置模型并保存到 localStorage，同时记录使用情况
  const setModel = useCallback((modelId: string) => {
    // 检查模型是否在列表中
    const modelInList = models.some((m) => m.id === modelId);

    if (modelInList) {
      setCurrentModel(modelId);
      localStorage.setItem(STORAGE_KEY, modelId);
    } else {
      // 自定义模型：添加到列表并使用
      const customModelInfo: ModelInfo = {
        id: modelId,
        name: modelId,
        description: "Custom model",
        provider: "openai",
      };
      setModels((prev) => {
        // 避免重复添加
        if (prev.some((m) => m.id === modelId)) {
          return prev;
        }
        return [...prev, customModelInfo];
      });
      setCurrentModel(modelId);
      localStorage.setItem(STORAGE_KEY, modelId);
    }

    // 异步记录使用情况（不阻塞 UI）
    recordModelUsage(modelId).catch(() => {
      // Ignore recording errors
    });
  }, [models]);

  // 获取模型显示名称
  const getModelName = useCallback(
    (modelId?: string) => {
      const id = modelId || currentModel;
      const model = models.find((m) => m.id === id);
      return model?.name || id;
    },
    [currentModel, models]
  );

  // 刷新 Ollama 模型列表
  const refreshOllamaModels = useCallback(async () => {
    try {
      const status = await getOllamaStatus();
      setOllamaAvailable(status.available);
      if (status.available) {
        const models = await getOllamaModels();
        setOllamaModels(models);
      } else {
        setOllamaModels([]);
      }
    } catch {
      setOllamaAvailable(false);
      setOllamaModels([]);
    }
  }, []);

  // 刷新模型数据（从后端重新加载）
  const refresh = useCallback(async () => {
    setIsLoading(true);
    try {
      const [settings, modelList] = await Promise.all([
        getSettings(),
        getModels(),
      ]);

      setModels(modelList);

      // 获取推荐模型
      const modelIds = modelList.map((m) => m.id);
      try {
        const recommended = await getRecommendedModel(modelIds);
        if (recommended.model_id) {
          setRecommendedModel(recommended.model_id);
        }
      } catch {
        // Ignore recommendation errors
      }

      // 优先级：localStorage > 后端设置 > 第一个可用模型
      // 注意：自定义模型可能不在预定义列表中，但仍应使用
      const savedModel = localStorage.getItem(STORAGE_KEY);
      if (savedModel) {
        // 如果在列表中，直接使用
        if (modelList.some((m) => m.id === savedModel)) {
          setCurrentModel(savedModel);
        } else {
          // 自定义模型：添加到列表并使用
          const customModelInfo: ModelInfo = {
            id: savedModel,
            name: savedModel,
            description: "Custom model",
            provider: "openai",
          };
          setModels([...modelList, customModelInfo]);
          setCurrentModel(savedModel);
        }
      } else if (settings.openai_model) {
        // 使用后端设置的模型
        if (modelList.some((m) => m.id === settings.openai_model)) {
          setCurrentModel(settings.openai_model);
        } else {
          // 自定义模型：添加到列表并使用
          const customModelInfo: ModelInfo = {
            id: settings.openai_model,
            name: settings.openai_model,
            description: "Custom model",
            provider: "openai",
          };
          setModels([...modelList, customModelInfo]);
          setCurrentModel(settings.openai_model);
        }
      } else if (modelList.length > 0) {
        setCurrentModel(modelList[0].id);
      }

      // 加载模型参数
      setParameters({
        temperature: settings.temperature ?? 0.7,
        top_p: settings.top_p ?? 1.0,
        max_tokens: settings.max_tokens ?? 4096,
      });
    } catch (error) {
      console.error("Failed to refresh model data:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 监听设置变更事件
  useEffect(() => {
    const handleSettingsChange = () => {
      refresh();
    };

    window.addEventListener("settings-changed", handleSettingsChange);
    return () => {
      window.removeEventListener("settings-changed", handleSettingsChange);
    };
  }, [refresh]);

  return {
    currentModel,
    models,
    setModel,
    isLoading,
    getModelName,
    ollamaAvailable,
    ollamaModels,
    refreshOllamaModels,
    refresh,
    parameters,
    recommendedModel,
  };
}
