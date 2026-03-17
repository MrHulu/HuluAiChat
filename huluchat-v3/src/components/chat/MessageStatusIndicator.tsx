/**
 * MessageStatusIndicator Component
 * 显示消息状态指示器：发送中、已保存、等待发送
 * TASK-349: 消息状态指示器
 */
import { memo } from "react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import { Loader2, Check, Clock, WifiOff } from "lucide-react";

/**
 * 消息状态类型
 */
export type MessageStatus = "sending" | "saved" | "queued" | "error";

export interface MessageStatusIndicatorProps {
  /** 消息状态 */
  status: MessageStatus;
  /** 是否为用户消息 */
  isUser?: boolean;
  /** 是否显示文字标签 */
  showLabel?: boolean;
  /** 额外类名 */
  className?: string;
}

/**
 * 消息状态指示器组件
 */
export const MessageStatusIndicator = memo(function MessageStatusIndicator({
  status,
  isUser = true,
  showLabel = false,
  className,
}: MessageStatusIndicatorProps) {
  const { t } = useTranslation();

  // 状态配置
  const statusConfig = {
    sending: {
      icon: Loader2,
      label: t("chat.status.sending"),
      className: "animate-spin text-muted-foreground",
      ariaLabel: t("chat.status.sending"),
    },
    saved: {
      icon: Check,
      label: t("chat.status.saved"),
      className: "text-green-500 dark:text-green-400",
      ariaLabel: t("chat.status.saved"),
    },
    queued: {
      icon: Clock,
      label: t("chat.status.queued"),
      className: "text-amber-500 dark:text-amber-400",
      ariaLabel: t("chat.status.queued"),
    },
    error: {
      icon: WifiOff,
      label: t("chat.status.error"),
      className: "text-destructive",
      ariaLabel: t("chat.status.error"),
    },
  };

  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <div
      className={cn(
        "flex items-center gap-1 text-[10px] transition-all duration-200",
        isUser ? "text-primary-foreground/70" : "text-muted-foreground",
        className
      )}
      role="status"
      aria-label={config.ariaLabel}
    >
      <Icon
        className={cn(
          "w-3 h-3",
          config.className
        )}
        aria-hidden="true"
      />
      {showLabel && (
        <span className={cn(status === "sending" && "animate-pulse")}>
          {config.label}
        </span>
      )}
    </div>
  );
});

/**
 * 消息状态组 - 用于显示多条消息的状态
 */
export interface MessageStatusGroupProps {
  /** 队列中的消息数量 */
  queueSize: number;
  /** 连接状态 */
  isConnected: boolean;
  /** 额外类名 */
  className?: string;
}

export const MessageStatusGroup = memo(function MessageStatusGroup({
  queueSize,
  isConnected,
  className,
}: MessageStatusGroupProps) {
  const { t } = useTranslation();

  if (queueSize === 0 || isConnected) {
    return null;
  }

  return (
    <div
      className={cn(
        "flex items-center gap-2 px-3 py-2 rounded-lg",
        "bg-amber-500/10 text-amber-600 dark:text-amber-400",
        "text-sm",
        className
      )}
      role="status"
      aria-live="polite"
    >
      <WifiOff className="w-4 h-4" aria-hidden="true" />
      <span>
        {t("chat.status.queuedMessages", { count: queueSize })}
      </span>
    </div>
  );
});

/**
 * 获取消息状态 - 辅助函数
 * 根据消息 ID 和连接状态判断消息状态
 *
 * @param messageId - 消息 ID
 * @param isConnected - 是否连接到服务器
 * @param isLocalMessage - 是否是本地消息（未保存到服务器）
 * @returns 消息状态
 */
// eslint-disable-next-line react-refresh/only-export-components
export function getMessageStatus(
  messageId: string,
  isConnected: boolean,
  isLocalMessage: boolean = false
): MessageStatus {
  // 断线时本地消息为排队状态
  if (!isConnected && isLocalMessage) {
    return "queued";
  }

  // 临时 ID 表示正在发送
  if (messageId.startsWith("temp-")) {
    return isConnected ? "sending" : "queued";
  }

  // 正常 ID 表示已保存
  return "saved";
}

export default MessageStatusIndicator;
