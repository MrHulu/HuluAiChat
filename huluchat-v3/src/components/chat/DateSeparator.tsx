/**
 * DateSeparator Component
 * 日期分隔符，用于消息列表按日期分组显示
 */
import { memo } from "react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";

export interface DateSeparatorProps {
  /** 日期字符串 (ISO 格式) */
  date: string;
  /** 额外的类名 */
  className?: string;
}

/**
 * 格式化日期为可读的分组标签
 * @param dateString ISO 日期字符串
 * @param locale 当前语言
 * @returns 格式化后的日期标签
 */
function formatDateLabel(dateString: string, locale: string): string {
  const date = new Date(dateString);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  // 重置时间部分以便比较日期
  const dateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const todayOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const yesterdayOnly = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate());

  if (dateOnly.getTime() === todayOnly.getTime()) {
    return locale === "zh" ? "今天" : "Today";
  }

  if (dateOnly.getTime() === yesterdayOnly.getTime()) {
    return locale === "zh" ? "昨天" : "Yesterday";
  }

  // 其他日期显示完整日期
  return date.toLocaleDateString(locale === "zh" ? "zh-CN" : "en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: locale === "zh" ? undefined : "long",
  });
}

export const DateSeparator = memo(function DateSeparator({ date, className }: DateSeparatorProps) {
  const { i18n } = useTranslation();
  const label = formatDateLabel(date, i18n.language);

  return (
    <div
      role="separator"
      aria-label={label}
      className={cn(
        "flex items-center gap-4 my-4",
        "animate-fade-in",
        className
      )}
    >
      {/* 左侧线条 */}
      <div
        className={cn(
          "flex-1 h-px",
          "bg-gradient-to-r from-transparent via-border to-border/50",
          "dark:via-border dark:to-border/30"
        )}
      />

      {/* 日期标签 */}
      <span
        className={cn(
          "px-3 py-1 text-xs font-medium rounded-full",
          "bg-muted/80 text-muted-foreground",
          "border border-border/50",
          "backdrop-blur-sm",
          "transition-all duration-200",
          // 悬停效果
          "hover:bg-muted hover:border-border",
          // 暗色模式增强
          "dark:bg-muted/60 dark:border-white/10",
          "dark:hover:bg-muted/80 dark:hover:border-white/20"
        )}
      >
        {label}
      </span>

      {/* 右侧线条 */}
      <div
        className={cn(
          "flex-1 h-px",
          "bg-gradient-to-l from-transparent via-border to-border/50",
          "dark:via-border dark:to-border/30"
        )}
      />
    </div>
  );
});
