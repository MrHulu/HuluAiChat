/**
 * useContextualTip Hook
 * 上下文智能提示 - 基于当前状态检测提供智能提示
 *
 * 隐私约束：
 * - 只检测"当前状态"，不记录"历史行为"
 * - 关闭状态仅存储于会话内存，不持久化
 */
import { useState, useCallback, useMemo, useEffect } from "react";
import {
  SORTED_TIPS,
  type ContextualTipId,
  type ContextualTipConfig,
} from "@/data/contextualTips";
import { getSettings } from "@/api/client";

/**
 * 上下文状态 - 用于检测提示条件
 */
export interface ContextState {
  /** 当前会话 ID（null 表示没有选中会话） */
  sessionId: string | null;
  /** 消息数量 */
  messageCount: number;
  /** 是否正在加载 */
  isLoading: boolean;
  /** 当前选择的模型 */
  currentModel: string;
  /** 可用模型数量 */
  modelCount: number;
  /** 是否已获取设置 */
  settingsLoaded: boolean;
}

/**
 * 检测到的设置状态
 */
interface SettingsState {
  hasApiKey: boolean;
  loaded: boolean;
}

/**
 * Hook 返回类型
 */
export interface UseContextualTipReturn {
  /** 当前应该显示的提示 */
  currentTip: ContextualTipConfig | null;
  /** 所有符合条件的提示 */
  matchingTips: ContextualTipConfig[];
  /** 关闭当前提示 */
  dismissTip: () => void;
  /** 永久禁用上下文提示 */
  disableAllTips: () => void;
  /** 上下文提示是否被禁用 */
  isDisabled: boolean;
  /** 关闭的提示 ID 列表（仅本次会话） */
  dismissedIds: ContextualTipId[];
}

// Local storage key for tips disabled state
const TIPS_DISABLED_KEY = "huluchat-contextual-tips-disabled";

/**
 * 检查提示是否被永久禁用
 */
function isTipsDisabled(): boolean {
  return localStorage.getItem(TIPS_DISABLED_KEY) === "true";
}

/**
 * 检测是否是首次访问
 */
function isFirstVisit(): boolean {
  // 使用 feature discovery 的状态判断
  const featureUsage = localStorage.getItem("huluchat-feature-usage");
  if (!featureUsage) return true;

  try {
    const usage = JSON.parse(featureUsage);
    // 如果没有使用过任何功能，认为是首次访问
    return Object.values(usage).every((v) => v === false);
  } catch {
    return true;
  }
}

/**
 * 检测条件函数
 */
function checkCondition(
  condition: string,
  context: ContextState,
  settings: SettingsState
): boolean {
  switch (condition) {
    case "isEmptySession":
      // 有会话但没有消息，且不在加载中
      return (
        context.sessionId !== null &&
        context.messageCount === 0 &&
        !context.isLoading
      );

    case "hasNoApiKey":
      // 设置已加载，但没有 API Key
      return settings.loaded && !settings.hasApiKey;

    case "hasNoModel":
      // 设置已加载，有 API Key，但没有选择模型
      return (
        settings.loaded &&
        settings.hasApiKey &&
        !context.currentModel &&
        context.modelCount > 0
      );

    case "isFirstVisit":
      // 首次访问且没有会话
      return isFirstVisit() && context.sessionId === null;

    case "isSettingsIncomplete":
      // 设置不完整（有模型但没有 API Key）
      return (
        settings.loaded &&
        Boolean(context.currentModel) &&
        !settings.hasApiKey
      );

    default:
      return false;
  }
}

/**
 * 上下文智能提示 Hook
 */
export function useContextualTip(context: ContextState): UseContextualTipReturn {
  const [dismissedIds, setDismissedIds] = useState<ContextualTipId[]>([]);
  const [isDisabled, setIsDisabled] = useState(isTipsDisabled);
  const [settings, setSettings] = useState<SettingsState>({
    hasApiKey: false,
    loaded: false,
  });

  // 加载设置状态
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const s = await getSettings();
        setSettings({
          hasApiKey: Boolean(s.openai_api_key),
          loaded: true,
        });
      } catch {
        setSettings({
          hasApiKey: false,
          loaded: false,
        });
      }
    };

    loadSettings();
  }, []);

  // 获取所有符合条件的提示
  const matchingTips = useMemo(() => {
    if (isDisabled) return [];

    return SORTED_TIPS.filter((tip) => {
      // 已关闭的提示不再显示
      if (dismissedIds.includes(tip.id)) return false;

      // 检测条件
      return checkCondition(tip.condition, context, settings);
    });
  }, [isDisabled, dismissedIds, context, settings]);

  // 获取当前应该显示的提示（优先级最高的）
  const currentTip = useMemo(() => {
    return matchingTips.length > 0 ? matchingTips[0] : null;
  }, [matchingTips]);

  // 关闭当前提示
  const dismissTip = useCallback(() => {
    if (currentTip) {
      setDismissedIds((prev) => [...prev, currentTip.id]);
    }
  }, [currentTip]);

  // 永久禁用所有上下文提示
  const disableAllTips = useCallback(() => {
    setIsDisabled(true);
    localStorage.setItem(TIPS_DISABLED_KEY, "true");
  }, []);

  return {
    currentTip,
    matchingTips,
    dismissTip,
    disableAllTips,
    isDisabled,
    dismissedIds,
  };
}

export default useContextualTip;
