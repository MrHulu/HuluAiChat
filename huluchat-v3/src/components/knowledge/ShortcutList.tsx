/**
 * ShortcutList - 快捷键列表组件
 * 展示所有可用的键盘快捷键
 */
import { useTranslation } from "react-i18next";
import { useMemo } from "react";
import { cn } from "@/lib/utils";
import { KEYBOARD_SHORTCUTS } from "@/hooks/useKeyboardShortcuts";

interface ShortcutListProps {
  className?: string;
}

/**
 * 检测是否为 macOS
 */
function isMacOS(): boolean {
  return navigator.platform.toUpperCase().indexOf("MAC") >= 0;
}

/**
 * 快捷键分类
 */
type ShortcutCategory = "general" | "navigation" | "editor";

interface CategorizedShortcut {
  category: ShortcutCategory;
  titleKey: string;
  shortcuts: typeof KEYBOARD_SHORTCUTS;
}

export function ShortcutList({ className }: ShortcutListProps) {
  const { t } = useTranslation();
  const isMac = isMacOS();

  // 分类快捷键
  const categorizedShortcuts = useMemo<CategorizedShortcut[]>(() => {
    return [
      {
        category: "general",
        titleKey: "knowledge.shortcuts.categories.general",
        shortcuts: KEYBOARD_SHORTCUTS.filter((s) =>
          ["Ctrl/Cmd + K", "Ctrl/Cmd + N", "? / F1"].includes(s.key)
        ),
      },
      {
        category: "navigation",
        titleKey: "knowledge.shortcuts.categories.navigation",
        shortcuts: KEYBOARD_SHORTCUTS.filter((s) =>
          ["Ctrl/Cmd + B", "Ctrl/Cmd + 1/2/3", "Ctrl/Cmd + ,", "Escape"].includes(s.key)
        ),
      },
    ];
  }, []);

  return (
    <div className={cn("space-y-6", className)}>
      {categorizedShortcuts.map((category) => (
        <div key={category.category} className="space-y-2">
          {/* 分类标题 */}
          <h3 className="text-sm font-medium text-muted-foreground px-1">
            {t(category.titleKey)}
          </h3>

          {/* 快捷键列表 */}
          <div className="space-y-1">
            {category.shortcuts.map((shortcut, index) => (
              <div
                key={shortcut.key}
                className={cn(
                  "flex items-center justify-between py-2.5 px-3 rounded-lg",
                  "bg-muted/30 hover:bg-muted/50",
                  "transition-all duration-200",
                  "dark:bg-muted/20 dark:hover:bg-muted/30"
                )}
                style={{ animationDelay: `${index * 30}ms` }}
              >
                <span className="text-sm">{t(shortcut.descriptionKey)}</span>
                <kbd
                  className={cn(
                    "px-2.5 py-1 text-xs font-mono rounded",
                    "bg-background border shadow-sm",
                    "dark:bg-muted/60 dark:border-white/10"
                  )}
                  aria-label={t("keyboard.shortcutKey", {
                    action: t(shortcut.descriptionKey),
                    key: isMac ? shortcut.mac : shortcut.windows,
                  })}
                >
                  {isMac ? shortcut.mac : shortcut.windows}
                </kbd>
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* 底部提示 */}
      <p className="text-xs text-muted-foreground text-center pt-2">
        {t("knowledge.shortcuts.footer", {
          key: isMac ? "⌘" : "Ctrl",
        })}
      </p>
    </div>
  );
}
