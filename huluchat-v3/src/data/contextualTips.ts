/**
 * Contextual Tips Configuration
 * 上下文智能提示配置
 *
 * 隐私约束：
 * - 只基于"当前状态"检测，不记录"历史行为"
 * - 提示关闭状态仅存储于会话内存
 */

import type { ReactNode } from "react";

/**
 * 提示 ID 类型
 */
export type ContextualTipId =
  | "empty-session"
  | "no-api-key"
  | "no-model"
  | "first-visit"
  | "settings-incomplete";

/**
 * 提示配置
 */
export interface ContextualTipConfig {
  /** 提示 ID */
  id: ContextualTipId;
  /** 标题 i18n key */
  titleKey: string;
  /** 描述 i18n key */
  descriptionKey: string;
  /** 操作按钮 i18n key */
  actionKey: string;
  /** 图标 */
  icon: ReactNode;
  /** 优先级（数字越小优先级越高） */
  priority: number;
  /** 检测条件函数类型标识 */
  condition: TipCondition;
}

/**
 * 提示条件类型
 */
export type TipCondition =
  | "isEmptySession"
  | "hasNoApiKey"
  | "hasNoModel"
  | "isFirstVisit"
  | "isSettingsIncomplete";

/**
 * 所有上下文提示配置
 */
export const CONTEXTUAL_TIPS: ContextualTipConfig[] = [
  {
    id: "no-api-key",
    titleKey: "contextualTips.tips.noApiKey.title",
    descriptionKey: "contextualTips.tips.noApiKey.description",
    actionKey: "contextualTips.tips.noApiKey.action",
    icon: "🔑",
    priority: 1,
    condition: "hasNoApiKey",
  },
  {
    id: "no-model",
    titleKey: "contextualTips.tips.noModel.title",
    descriptionKey: "contextualTips.tips.noModel.description",
    actionKey: "contextualTips.tips.noModel.action",
    icon: "🤖",
    priority: 2,
    condition: "hasNoModel",
  },
  {
    id: "empty-session",
    titleKey: "contextualTips.tips.emptySession.title",
    descriptionKey: "contextualTips.tips.emptySession.description",
    actionKey: "contextualTips.tips.emptySession.action",
    icon: "💬",
    priority: 10,
    condition: "isEmptySession",
  },
  {
    id: "first-visit",
    titleKey: "contextualTips.tips.firstVisit.title",
    descriptionKey: "contextualTips.tips.firstVisit.description",
    actionKey: "contextualTips.tips.firstVisit.action",
    icon: "👋",
    priority: 5,
    condition: "isFirstVisit",
  },
  {
    id: "settings-incomplete",
    titleKey: "contextualTips.tips.settingsIncomplete.title",
    descriptionKey: "contextualTips.tips.settingsIncomplete.description",
    actionKey: "contextualTips.tips.settingsIncomplete.action",
    icon: "⚙️",
    priority: 3,
    condition: "isSettingsIncomplete",
  },
];

/**
 * 根据优先级排序的提示列表
 */
export const SORTED_TIPS = [...CONTEXTUAL_TIPS].sort(
  (a, b) => a.priority - b.priority
);

/**
 * 获取提示配置
 */
export function getTipConfig(id: ContextualTipId): ContextualTipConfig | undefined {
  return CONTEXTUAL_TIPS.find((tip) => tip.id === id);
}
