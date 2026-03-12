/**
 * QuickActions - Preset actions for quick clipboard processing
 *
 * PRIVACY: All data stays local, no analytics
 */
import { useTranslation } from "react-i18next";
import {
  Languages,
  List,
  Sparkles,
  Lightbulb,
  Code,
  CheckCircle,
  Maximize2,
  Minimize2,
  Star,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import type { QuickAction } from "@/data/quickActions";

// Icon mapping for QuickActions
const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Languages,
  List,
  Sparkles,
  Lightbulb,
  Code,
  CheckCircle,
  Maximize2,
  Minimize2,
  Star,
};

interface QuickActionsProps {
  /** Available actions to display */
  actions: QuickAction[];
  /** Callback when an action is selected */
  onActionSelect: (action: QuickAction) => void;
  /** Whether actions are disabled */
  disabled?: boolean;
  /** Whether to show in compact mode (limited actions, icon-only on mobile) */
  compact?: boolean;
}

/**
 * QuickActions Component
 *
 * Displays preset action buttons for quick clipboard processing
 */
export function QuickActions({
  actions,
  onActionSelect,
  disabled = false,
  compact = false,
}: QuickActionsProps) {
  const { t } = useTranslation();

  if (actions.length === 0) {
    return null;
  }

  // In compact mode, only show first 5 actions
  const visibleActions = compact ? actions.slice(0, 5) : actions;

  return (
    <div
      className={cn(
        "flex flex-wrap gap-1",
        compact ? "justify-center" : "justify-start"
      )}
      role="toolbar"
      aria-label={t("quickPanel.quickActions")}
    >
      {visibleActions.map((action) => {
        const IconComponent = ICON_MAP[action.icon] || Lightbulb;

        return (
          <Button
            key={action.id}
            variant="ghost"
            size="xs"
            onClick={() => onActionSelect(action)}
            disabled={disabled}
            className={cn(
              "h-6 px-2 text-xs gap-1",
              "hover:bg-primary/10 hover:text-primary",
              "transition-colors"
            )}
            title={t(action.descriptionKey)}
            aria-label={t(action.nameKey)}
          >
            <IconComponent className="h-3 w-3 shrink-0" />
            <span className="truncate max-w-[60px]">{t(action.nameKey)}</span>
          </Button>
        );
      })}
    </div>
  );
}

export default QuickActions;
