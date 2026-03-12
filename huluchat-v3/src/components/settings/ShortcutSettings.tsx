/**
 * Shortcut Settings Component
 * Allows users to customize keyboard shortcuts
 *
 * PRIVACY: All shortcut preferences stored locally, no data sent to servers
 */
import { useState, useCallback, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Keyboard, RotateCcw, AlertTriangle, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  useShortcutSettings,
  SHORTCUT_META,
  type ShortcutBinding,
} from "@/hooks/useShortcutSettings";

/**
 * Key recorder component
 */
function KeyRecorder({
  isRecording,
  onStartRecording,
  onStopRecording,
  formattedKey,
  hasConflict,
}: {
  binding: ShortcutBinding;
  isRecording: boolean;
  onStartRecording: () => void;
  onStopRecording: () => void;
  formattedKey: string;
  hasConflict: boolean;
}) {
  const { t } = useTranslation();
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (isRecording && buttonRef.current) {
      buttonRef.current.focus();
    }
  }, [isRecording]);

  return (
    <button
      ref={buttonRef}
      type="button"
      onClick={isRecording ? onStopRecording : onStartRecording}
      className={`
        min-w-[100px] px-3 py-1.5 rounded-md border text-sm font-mono transition-all duration-200
        ${
          isRecording
            ? "border-primary bg-primary/10 ring-2 ring-primary/50 animate-pulse"
            : hasConflict
              ? "border-warning bg-warning/10 text-warning-foreground"
              : "border-border bg-muted/50 hover:bg-muted hover:border-primary/50"
        }
      `}
      aria-label={isRecording ? t("shortcuts.pressKeys") : formattedKey}
    >
      {isRecording ? t("shortcuts.pressKeys") : formattedKey}
    </button>
  );
}

/**
 * Single shortcut row
 */
function ShortcutRow({
  binding,
  formattedKey,
  conflictIds,
  onUpdate,
  onReset,
  isMac,
  t,
}: {
  binding: ShortcutBinding;
  formattedKey: string;
  conflictIds: string[];
  onUpdate: (binding: Partial<ShortcutBinding>) => void;
  onReset: () => void;
  isMac: boolean;
  t: (key: string) => string;
}) {
  const [isRecording, setIsRecording] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!isRecording) return;

      // Escape cancels recording
      if (event.key === "Escape") {
        setIsRecording(false);
        return;
      }

      // Ignore modifier-only presses
      if (["Control", "Shift", "Alt", "Meta"].includes(event.key)) {
        return;
      }

      event.preventDefault();

      const newBinding: Partial<ShortcutBinding> = {
        key: event.code,
        ctrlKey: event.ctrlKey,
        metaKey: event.metaKey,
        shiftKey: event.shiftKey,
        altKey: event.altKey,
      };

      // On Mac, convert Ctrl to Meta
      if (isMac) {
        newBinding.metaKey = event.ctrlKey || event.metaKey;
        newBinding.ctrlKey = false;
      }

      onUpdate(newBinding);
      setIsRecording(false);
    },
    [isRecording, onUpdate, isMac]
  );

  useEffect(() => {
    if (isRecording) {
      const container = containerRef.current;
      container?.addEventListener("keydown", handleKeyDown);
      return () => {
        container?.removeEventListener("keydown", handleKeyDown);
      };
    }
  }, [isRecording, handleKeyDown]);

  // Blur handler to stop recording when focus leaves
  const handleBlur = useCallback(() => {
    if (isRecording) {
      setIsRecording(false);
    }
  }, [isRecording]);

  const hasConflict = conflictIds.length > 0;
  const meta = SHORTCUT_META[binding.id];

  return (
    <div
      ref={containerRef}
      tabIndex={isRecording ? 0 : -1}
      onBlur={handleBlur}
      className={`
        flex items-center justify-between p-3 rounded-lg border transition-all duration-200
        ${
          hasConflict
            ? "border-warning/50 bg-warning/5"
            : "border-border hover:border-primary/30 hover:bg-muted/30"
        }
      `}
    >
      <div className="flex items-center gap-3">
        {hasConflict && (
          <AlertTriangle
            className="h-4 w-4 text-warning flex-shrink-0"
            aria-label={t("shortcuts.conflictWarning")}
          />
        )}
        <div className="flex flex-col">
          <span className="text-sm font-medium">
            {meta ? t(meta.descriptionKey) : binding.id}
          </span>
          {hasConflict && (
            <span className="text-xs text-warning">
              {t("shortcuts.conflictsWith")}:{" "}
              {conflictIds.map((id) => t(SHORTCUT_META[id]?.descriptionKey || id)).join(", ")}
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <KeyRecorder
          binding={binding}
          isRecording={isRecording}
          onStartRecording={() => setIsRecording(true)}
          onStopRecording={() => setIsRecording(false)}
          formattedKey={formattedKey}
          hasConflict={hasConflict}
        />
        <Button
          variant="ghost"
          size="icon"
          onClick={onReset}
          aria-label={t("shortcuts.resetShortcut")}
          className="h-8 w-8"
        >
          <RotateCcw className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}

/**
 * Shortcut Settings Component
 */
export function ShortcutSettings() {
  const { t } = useTranslation();
  const {
    shortcuts,
    conflicts,
    isMac,
    updateShortcut,
    resetShortcut,
    resetAllShortcuts,
    formatShortcut,
    checkConflict,
  } = useShortcutSettings();

  // Group shortcuts by category
  const groupedShortcuts = shortcuts.reduce(
    (groups, binding) => {
      const meta = SHORTCUT_META[binding.id];
      const group = meta?.group || "other";
      if (!groups[group]) {
        groups[group] = [];
      }
      groups[group].push(binding);
      return groups;
    },
    {} as Record<string, ShortcutBinding[]>
  );

  const groupLabels: Record<string, string> = {
    navigation: t("shortcuts.groupNavigation"),
    actions: t("shortcuts.groupActions"),
    other: t("shortcuts.groupOther"),
  };

  const handleUpdate = useCallback(
    (id: string, binding: Partial<ShortcutBinding>) => {
      // Check for conflicts before updating
      const fullBinding = { ...shortcuts.find((s) => s.id === id)!, ...binding };
      const conflictIds = checkConflict(id, fullBinding);

      // Update even if there's a conflict (user can see warning and decide)
      updateShortcut(id, binding);

      if (conflictIds.length > 0) {
        console.log(`Shortcut ${id} conflicts with:`, conflictIds);
      }
    },
    [shortcuts, checkConflict, updateShortcut]
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Keyboard className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
          <h3 className="text-sm font-medium">{t("shortcuts.title")}</h3>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={resetAllShortcuts}
          className="text-xs"
        >
          <RotateCcw className="h-3 w-3 mr-1" />
          {t("shortcuts.resetAll")}
        </Button>
      </div>

      {/* Instructions */}
      <p className="text-xs text-muted-foreground">
        {t("shortcuts.instructions")}
      </p>

      {/* Platform indicator */}
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Check className="h-3 w-3 text-success" />
        {isMac ? t("shortcuts.platformMac") : t("shortcuts.platformWin")}
      </div>

      {/* Shortcuts by group */}
      <div className="space-y-4">
        {Object.entries(groupedShortcuts).map(([group, bindings]) => (
          <div key={group} className="space-y-2">
            <Label className="text-xs text-muted-foreground uppercase tracking-wide">
              {groupLabels[group] || group}
            </Label>
            <div className="space-y-2">
              {bindings.map((binding) => {
                const conflictIds = conflicts.get(binding.id) || [];
                return (
                  <ShortcutRow
                    key={binding.id}
                    binding={binding}
                    formattedKey={formatShortcut(binding)}
                    conflictIds={conflictIds}
                    onUpdate={(b) => handleUpdate(binding.id, b)}
                    onReset={() => resetShortcut(binding.id)}
                    isMac={isMac}
                    t={t}
                  />
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Privacy Note */}
      <p className="text-xs text-muted-foreground border-t pt-4">
        {t("shortcuts.privacyNote")}
      </p>
    </div>
  );
}
