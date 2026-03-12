/**
 * QuickActionsSettings - Manage custom Quick Actions
 *
 * PRIVACY: All data stays local, no analytics
 */
import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Plus, Trash2, RotateCcw, Star, GripVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/Select";
import {
  loadQuickActions,
  saveQuickActions,
  resetQuickActions,
  type QuickAction,
} from "@/data/quickActions";
import { toast } from "sonner";

// Available icons for Quick Actions
const AVAILABLE_ICONS = [
  { id: "Languages", name: "Languages" },
  { id: "List", name: "List" },
  { id: "Sparkles", name: "Sparkles" },
  { id: "Lightbulb", name: "Lightbulb" },
  { id: "Code", name: "Code" },
  { id: "CheckCircle", name: "Check Circle" },
  { id: "Maximize2", name: "Expand" },
  { id: "Minimize2", name: "Simplify" },
  { id: "Star", name: "Star" },
];

// Available categories
const CATEGORIES = [
  { id: "text", name: "Text" },
  { id: "code", name: "Code" },
  { id: "general", name: "General" },
];

interface QuickActionsSettingsProps {
  onSettingsChange?: () => void;
}

export function QuickActionsSettings({ onSettingsChange }: QuickActionsSettingsProps) {
  const { t } = useTranslation();
  const [actions, setActions] = useState<QuickAction[]>([]);
  const [editingAction, setEditingAction] = useState<QuickAction | null>(null);
  const [isAdding, setIsAdding] = useState(false);

  // Form state for new/edit action
  const [formData, setFormData] = useState<Partial<QuickAction>>({
    nameKey: "",
    descriptionKey: "",
    icon: "Star",
    promptTemplate: "",
    category: "text",
  });

  // Load actions on mount
  useEffect(() => {
    setActions(loadQuickActions());
  }, []);

  // Handle form input changes
  const handleFormChange = (field: keyof QuickAction, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // Start editing an action
  const handleEdit = (action: QuickAction) => {
    setEditingAction(action);
    setFormData({
      nameKey: action.nameKey,
      descriptionKey: action.descriptionKey,
      icon: action.icon,
      promptTemplate: action.promptTemplate,
      category: action.category,
    });
    setIsAdding(true);
  };

  // Save action (add or edit)
  const handleSave = () => {
    if (!formData.nameKey || !formData.promptTemplate) {
      toast.error(t("settings.quickActions.errorRequired"));
      return;
    }

    const newAction: QuickAction = {
      id: editingAction?.id || `custom-${Date.now()}`,
      nameKey: formData.nameKey || "",
      descriptionKey: formData.descriptionKey || "",
      icon: formData.icon || "Star",
      promptTemplate: formData.promptTemplate || "",
      shortcut: editingAction?.shortcut,
      category: (formData.category as "text" | "code" | "general") || "general",
    };

    let updatedActions: QuickAction[];
    if (editingAction) {
      // Update existing
      updatedActions = actions.map((a) =>
        a.id === editingAction.id ? newAction : a
      );
    } else {
      // Add new
      updatedActions = [...actions, newAction];
    }

    saveQuickActions(updatedActions);
    setActions(updatedActions);
    setEditingAction(null);
    setIsAdding(false);
    setFormData({
      nameKey: "",
      descriptionKey: "",
      icon: "Star",
      promptTemplate: "",
      category: "text",
    });
    toast.success(t("settings.quickActions.saved"));
    onSettingsChange?.();
  };

  // Delete an action
  const handleDelete = (actionId: string) => {
    const updatedActions = actions.filter((a) => a.id !== actionId);
    saveQuickActions(updatedActions);
    setActions(updatedActions);
    toast.success(t("settings.quickActions.deleted"));
    onSettingsChange?.();
  };

  // Reset to defaults
  const handleReset = () => {
    const defaults = resetQuickActions();
    setActions(defaults);
    toast.success(t("settings.quickActions.resetSuccess"));
    onSettingsChange?.();
  };

  // Cancel editing
  const handleCancel = () => {
    setEditingAction(null);
    setIsAdding(false);
    setFormData({
      nameKey: "",
      descriptionKey: "",
      icon: "Star",
      promptTemplate: "",
      category: "text",
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {t("settings.quickActions.description")}
        </p>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setIsAdding(true);
              setFormData({
                nameKey: "",
                descriptionKey: "",
                icon: "Star",
                promptTemplate: "",
                category: "text",
              });
            }}
          >
            <Plus className="h-4 w-4 mr-1" />
            {t("settings.quickActions.addAction")}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleReset}
          >
            <RotateCcw className="h-4 w-4 mr-1" />
            {t("settings.quickActions.reset")}
          </Button>
        </div>
      </div>

      {/* Add/Edit Form */}
      {isAdding && (
        <div className="p-4 border border-border rounded-lg space-y-4 bg-muted/30">
          <h4 className="text-sm font-medium">
            {editingAction
              ? t("settings.quickActions.editAction")
              : t("settings.quickActions.addAction")}
          </h4>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">{t("settings.quickActions.name")}</Label>
              <Input
                id="name"
                value={formData.nameKey || ""}
                onChange={(e) => handleFormChange("nameKey", e.target.value)}
                placeholder={t("settings.quickActions.namePlaceholder")}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="icon">{t("settings.quickActions.icon")}</Label>
              <Select
                value={formData.icon}
                onValueChange={(v) => handleFormChange("icon", v)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {AVAILABLE_ICONS.map((icon) => (
                    <SelectItem key={icon.id} value={icon.id}>
                      {icon.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">{t("settings.quickActions.description")}</Label>
            <Input
              id="description"
              value={formData.descriptionKey || ""}
              onChange={(e) => handleFormChange("descriptionKey", e.target.value)}
              placeholder={t("settings.quickActions.descriptionPlaceholder")}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="category">{t("settings.quickActions.category")}</Label>
              <Select
                value={formData.category}
                onValueChange={(v) => handleFormChange("category", v)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="prompt">{t("settings.quickActions.promptTemplate")}</Label>
            <textarea
              id="prompt"
              className="w-full min-h-[80px] p-2 text-sm border border-input rounded-md bg-background resize-none"
              value={formData.promptTemplate || ""}
              onChange={(e) => handleFormChange("promptTemplate", e.target.value)}
              placeholder={t("settings.quickActions.promptPlaceholder")}
            />
            <p className="text-xs text-muted-foreground">
              {t("settings.quickActions.promptHint")}
            </p>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={handleCancel}>
              {t("common.cancel")}
            </Button>
            <Button size="sm" onClick={handleSave}>
              {t("common.save")}
            </Button>
          </div>
        </div>
      )}

      {/* Actions List */}
      <div className="space-y-2">
        {actions.map((action) => (
          <div
            key={action.id}
            className="flex items-center justify-between p-3 border border-border rounded-lg hover:bg-muted/30 transition-colors"
          >
            <div className="flex items-center gap-3">
              <GripVertical className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">{action.nameKey}</p>
                <p className="text-xs text-muted-foreground">
                  {action.descriptionKey}
                </p>
              </div>
              {action.shortcut && (
                <span className="text-xs bg-muted px-1.5 py-0.5 rounded">
                  {action.shortcut}
                </span>
              )}
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon-xs"
                onClick={() => handleEdit(action)}
              >
                <Star className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon-xs"
                onClick={() => handleDelete(action.id)}
                className="text-destructive hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>

      {actions.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-4">
          {t("settings.quickActions.noActions")}
        </p>
      )}
    </div>
  );
}

export default QuickActionsSettings;
