/**
 * useFeatureDiscovery Hook
 * 功能发现提示系统 - 检测功能使用状态，推荐未使用功能
 *
 * 隐私约束：
 * - 只存储布尔值（是否使用过）
 * - 不记录使用次数、时间、频率等
 * - 所有数据存储在本地
 */
import { useState, useCallback } from "react";

// Local storage key for feature usage states
const FEATURE_USAGE_KEY = "huluchat-feature-usage";
const FEATURE_TIPS_DISABLED_KEY = "huluchat-feature-tips-disabled";

// 功能列表
export type FeatureId =
  | "command-palette"
  | "knowledge-center"
  | "document-chat"
  | "session-export"
  | "folder-management"
  | "model-switch";

// 功能配置
export interface FeatureConfig {
  id: FeatureId;
  titleKey: string;
  descriptionKey: string;
  actionKey: string;
  icon: string;
}

// 所有可发现的功能
export const DISCOVERABLE_FEATURES: FeatureConfig[] = [
  {
    id: "command-palette",
    titleKey: "featureDiscovery.features.commandPalette.title",
    descriptionKey: "featureDiscovery.features.commandPalette.description",
    actionKey: "featureDiscovery.features.commandPalette.action",
    icon: "⌘",
  },
  {
    id: "knowledge-center",
    titleKey: "featureDiscovery.features.knowledgeCenter.title",
    descriptionKey: "featureDiscovery.features.knowledgeCenter.description",
    actionKey: "featureDiscovery.features.knowledgeCenter.action",
    icon: "📚",
  },
  {
    id: "document-chat",
    titleKey: "featureDiscovery.features.documentChat.title",
    descriptionKey: "featureDiscovery.features.documentChat.description",
    actionKey: "featureDiscovery.features.documentChat.action",
    icon: "📄",
  },
  {
    id: "session-export",
    titleKey: "featureDiscovery.features.sessionExport.title",
    descriptionKey: "featureDiscovery.features.sessionExport.description",
    actionKey: "featureDiscovery.features.sessionExport.action",
    icon: "📤",
  },
  {
    id: "folder-management",
    titleKey: "featureDiscovery.features.folderManagement.title",
    descriptionKey: "featureDiscovery.features.folderManagement.description",
    actionKey: "featureDiscovery.features.folderManagement.action",
    icon: "📁",
  },
  {
    id: "model-switch",
    titleKey: "featureDiscovery.features.modelSwitch.title",
    descriptionKey: "featureDiscovery.features.modelSwitch.description",
    actionKey: "featureDiscovery.features.modelSwitch.action",
    icon: "🔄",
  },
];

// 功能使用状态类型
type FeatureUsageState = Record<FeatureId, boolean>;

/**
 * 从 localStorage 读取功能使用状态
 */
function loadFeatureUsage(): FeatureUsageState {
  try {
    const stored = localStorage.getItem(FEATURE_USAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch {
    // Ignore parse errors
  }
  // 默认所有功能都未使用
  return {
    "command-palette": false,
    "knowledge-center": false,
    "document-chat": false,
    "session-export": false,
    "folder-management": false,
    "model-switch": false,
  };
}

/**
 * 保存功能使用状态到 localStorage
 */
function saveFeatureUsage(state: FeatureUsageState): void {
  localStorage.setItem(FEATURE_USAGE_KEY, JSON.stringify(state));
}

/**
 * 检查功能提示是否被永久禁用
 */
function isTipsDisabled(): boolean {
  return localStorage.getItem(FEATURE_TIPS_DISABLED_KEY) === "true";
}

/**
 * 设置功能提示禁用状态
 */
function setTipsDisabled(disabled: boolean): void {
  if (disabled) {
    localStorage.setItem(FEATURE_TIPS_DISABLED_KEY, "true");
  } else {
    localStorage.removeItem(FEATURE_TIPS_DISABLED_KEY);
  }
}

/**
 * Hook 返回类型
 */
export interface UseFeatureDiscoveryReturn {
  /** 所有功能配置 */
  features: FeatureConfig[];
  /** 功能使用状态 */
  featureUsage: FeatureUsageState;
  /** 标记功能为已使用 */
  markFeatureUsed: (featureId: FeatureId) => void;
  /** 获取未使用的功能列表 */
  getUnusedFeatures: () => FeatureConfig[];
  /** 获取下一个未使用的功能（用于提示） */
  getNextUnusedFeature: () => FeatureConfig | null;
  /** 提示是否被禁用 */
  isTipsDisabled: boolean;
  /** 永久禁用提示 */
  disableTips: () => void;
  /** 重新启用提示 */
  enableTips: () => void;
  /** 关闭当前提示（本次会话不再显示） */
  dismissCurrentTip: () => void;
  /** 当前应该显示的提示 */
  currentTip: FeatureConfig | null;
}

/**
 * 功能发现提示 Hook
 */
export function useFeatureDiscovery(): UseFeatureDiscoveryReturn {
  const [featureUsage, setFeatureUsage] = useState<FeatureUsageState>(loadFeatureUsage);
  const [tipsDisabled, setTipsDisabledState] = useState(isTipsDisabled);
  const [dismissedTip, setDismissedTip] = useState<FeatureId | null>(null);

  // 标记功能为已使用
  const markFeatureUsed = useCallback((featureId: FeatureId) => {
    setFeatureUsage((prev) => {
      if (prev[featureId]) {
        return prev; // 已经是已使用状态，无需更新
      }
      const newState = { ...prev, [featureId]: true };
      saveFeatureUsage(newState);
      return newState;
    });
    // 清除已关闭的提示（如果正好是这个功能）
    setDismissedTip((prev) => (prev === featureId ? null : prev));
  }, []);

  // 获取未使用的功能列表
  const getUnusedFeatures = useCallback((): FeatureConfig[] => {
    return DISCOVERABLE_FEATURES.filter((f) => !featureUsage[f.id]);
  }, [featureUsage]);

  // 获取下一个未使用的功能
  const getNextUnusedFeature = useCallback((): FeatureConfig | null => {
    const unused = getUnusedFeatures();
    return unused.length > 0 ? unused[0] : null;
  }, [getUnusedFeatures]);

  // 永久禁用提示
  const disableTips = useCallback(() => {
    setTipsDisabled(true);
    setTipsDisabledState(true);
  }, []);

  // 重新启用提示
  const enableTips = useCallback(() => {
    setTipsDisabled(false);
    setTipsDisabledState(false);
  }, []);

  // 关闭当前提示（本次会话不再显示）
  const dismissCurrentTip = useCallback(() => {
    const nextTip = getNextUnusedFeature();
    if (nextTip) {
      setDismissedTip(nextTip.id);
    }
  }, [getNextUnusedFeature]);

  // 计算当前应该显示的提示
  const currentTip: FeatureConfig | null = tipsDisabled
    ? null
    : (() => {
        const nextUnused = getNextUnusedFeature();
        if (!nextUnused) return null;
        if (dismissedTip === nextUnused.id) return null;
        return nextUnused;
      })();

  return {
    features: DISCOVERABLE_FEATURES,
    featureUsage,
    markFeatureUsed,
    getUnusedFeatures,
    getNextUnusedFeature,
    isTipsDisabled: tipsDisabled,
    disableTips,
    enableTips,
    dismissCurrentTip,
    currentTip,
  };
}

export default useFeatureDiscovery;
