/**
 * useModel Hook
 * 管理当前选择的 AI 模型
 */
import { useState, useEffect, useCallback } from "react";
import {
  getSettings,
  getModels,
  getOllamaStatus,
  getOllamaModels,
  type ModelInfo,
  type OllamaModel,
} from "@/api/client";

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
}

const STORAGE_KEY = "huluchat-selected-model";

export function useModel(): UseModelReturn {
  const [currentModel, setCurrentModel] = useState<string>("");
  const [models, setModels] = useState<ModelInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [ollamaAvailable, setOllamaAvailable] = useState(false);
  const [ollamaModels, setOllamaModels] = useState<OllamaModel[]>([]);

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

        // 优先级：localStorage > 后端设置 > 第一个可用模型
        const savedModel = localStorage.getItem(STORAGE_KEY);
        if (savedModel && modelList.some((m) => m.id === savedModel)) {
          setCurrentModel(savedModel);
        } else if (settings.openai_model) {
          setCurrentModel(settings.openai_model);
        } else if (modelList.length > 0) {
          setCurrentModel(modelList[0].id);
        }
      } catch (error) {
        console.error("Failed to load model data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadModelData();
  }, []);

  // 设置模型并保存到 localStorage
  const setModel = useCallback((modelId: string) => {
    if (models.some((m) => m.id === modelId)) {
      setCurrentModel(modelId);
      localStorage.setItem(STORAGE_KEY, modelId);
    }
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

  return {
    currentModel,
    models,
    setModel,
    isLoading,
    getModelName,
    ollamaAvailable,
    ollamaModels,
    refreshOllamaModels,
  };
}
