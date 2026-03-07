/**
 * KeyboardHelpDialog - 快捷键帮助对话框
 * 显示所有可用的键盘快捷键
 */
import { useTranslation } from "react-i18next";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { KEYBOARD_SHORTCUTS } from "@/hooks/useKeyboardShortcuts";

interface KeyboardHelpDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * 检测是否为 macOS
 */
function isMacOS(): boolean {
  return navigator.platform.toUpperCase().indexOf("MAC") >= 0;
}

export function KeyboardHelpDialog({
  open,
  onOpenChange,
}: KeyboardHelpDialogProps) {
  const { t } = useTranslation();
  const isMac = isMacOS();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span className="text-lg" aria-hidden="true">⌨️</span>
            {t("keyboard.title")}
          </DialogTitle>
          <DialogDescription>
            {t("keyboard.description")}
          </DialogDescription>
        </DialogHeader>
        <div className="mt-4">
          <ul
            className="space-y-2"
            role="list"
            aria-label={t("keyboard.shortcutsList")}
          >
            {KEYBOARD_SHORTCUTS.map((shortcut, index) => (
              <li
                key={index}
                className="flex items-center justify-between py-2 px-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
              >
                <span className="text-sm text-muted-foreground">
                  {t(shortcut.descriptionKey)}
                </span>
                <kbd className="px-2 py-1 text-xs font-mono bg-background rounded border shadow-sm">
                  {isMac ? shortcut.mac : shortcut.windows}
                </kbd>
              </li>
            ))}
          </ul>
          <p className="mt-4 text-xs text-muted-foreground text-center">
            {t("keyboard.pressToOpen", {
              key1: <kbd className="px-1 py-0.5 text-xs font-mono bg-muted rounded">?</kbd>,
              key2: <kbd className="px-1 py-0.5 text-xs font-mono bg-muted rounded">F1</kbd>,
            })}
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
