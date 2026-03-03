/**
 * KeyboardHelpDialog - 快捷键帮助对话框
 * 显示所有可用的键盘快捷键
 */
import {
  Dialog,
  DialogContent,
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
  const isMac = isMacOS();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span className="text-lg">⌨️</span>
            键盘快捷键
          </DialogTitle>
        </DialogHeader>
        <div className="mt-4">
          <div className="space-y-2">
            {KEYBOARD_SHORTCUTS.map((shortcut, index) => (
              <div
                key={index}
                className="flex items-center justify-between py-2 px-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
              >
                <span className="text-sm text-muted-foreground">
                  {shortcut.description}
                </span>
                <kbd className="px-2 py-1 text-xs font-mono bg-background rounded border shadow-sm">
                  {isMac ? shortcut.mac : shortcut.windows}
                </kbd>
              </div>
            ))}
          </div>
          <p className="mt-4 text-xs text-muted-foreground text-center">
            按 <kbd className="px-1 py-0.5 text-xs font-mono bg-muted rounded">?</kbd> 或{" "}
            <kbd className="px-1 py-0.5 text-xs font-mono bg-muted rounded">F1</kbd> 随时打开此帮助
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
