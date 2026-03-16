/**
 * ShortcutTooltip - 快捷键提示 Tooltip 组件
 * 在 tooltip 中显示操作描述和对应快捷键
 *
 * PRIVACY: No data collection, uses platform detection locally only
 */
import { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

/**
 * 检测是否为 macOS
 */
function isMacOS(): boolean {
  return navigator.platform.toUpperCase().indexOf("MAC") >= 0;
}

export interface ShortcutTooltipProps {
  /** 触发 tooltip 的子元素 */
  children: ReactNode;
  /** 操作描述（i18n key 或直接文本） */
  label: string;
  /** 快捷键（macOS 格式，如 ⌘K） */
  shortcutMac: string;
  /** 快捷键（Windows 格式，如 Ctrl+K） */
  shortcutWindows: string;
  /** 是否使用 i18n 翻译 label */
  translateLabel?: boolean;
  /** 额外的 className */
  className?: string;
  /** Tooltip 位置 */
  side?: "top" | "right" | "bottom" | "left";
  /** 是否禁用 tooltip */
  disabled?: boolean;
}

/**
 * ShortcutTooltip 组件
 *
 * @example
 * ```tsx
 * <ShortcutTooltip
 *   label="New Chat"
 *   shortcutMac="⌘N"
 *   shortcutWindows="Ctrl+N"
 * >
 *   <Button>New Chat</Button>
 * </ShortcutTooltip>
 * ```
 */
export function ShortcutTooltip({
  children,
  label,
  shortcutMac,
  shortcutWindows,
  translateLabel = true,
  className,
  side = "bottom",
  disabled = false,
}: ShortcutTooltipProps) {
  const { t } = useTranslation();
  const isMac = isMacOS();
  const shortcut = isMac ? shortcutMac : shortcutWindows;
  const displayLabel = translateLabel ? t(label) : label;

  if (disabled) {
    return <>{children}</>;
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>{children}</TooltipTrigger>
      <TooltipContent
        side={side}
        className={cn("flex items-center gap-2", className)}
      >
        <span>{displayLabel}</span>
        <kbd
          className={cn(
            "px-1.5 py-0.5 text-[10px] font-mono rounded",
            "bg-muted/80 border border-border/50",
            "ml-1"
          )}
          aria-label={t("keyboard.shortcutKey", {
            action: displayLabel,
            key: shortcut,
          })}
        >
          {shortcut}
        </kbd>
      </TooltipContent>
    </Tooltip>
  );
}
