/**
 * CustomCommandsSettings - Manage user-defined commands
 *
 * PRIVACY: All data stays local, no analytics
 * NO TRACKING: Command usage frequency is NOT tracked
 */
import { useState, useEffect, useMemo, useCallback } from "react";
import { useTranslation } from "react-i18next";
import {
  Plus,
  Trash2,
  RotateCcw,
  Edit3,
  Search,
  Terminal,
  Check,
  X,
  Filter,
} from "lucide-react";
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
import { Switch } from "@/components/ui/switch";
import {
  loadCustomCommands,
  saveCustomCommands,
  resetCustomCommands,
  searchCommands,
  filterCommandsByCategory,
  sortCommandsByName,
  COMMAND_CATEGORIES,
  type CustomCommand,
  type CommandCategory,
} from "@/data/customCommands";
import { toast } from "sonner";

interface CustomCommandsSettingsProps {
  onSettingsChange?: () => void;
}

export function CustomCommandsSettings({ onSettingsChange }: CustomCommandsSettingsProps) {
  const { t } = useTranslation();
  const [commands, setCommands] = useState<CustomCommand[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<CommandCategory | "all">("all");
  const [editingCommand, setEditingCommand] = useState<CustomCommand | null>(null);
  const [isAdding, setIsAdding] = useState(false);

  // Form state for new/edit command
  const [formData, setFormData] = useState<Partial<CustomCommand>>({
    name: "",
    description: "",
    promptTemplate: "",
    category: "general",
    shortcut: "",
    enabled: true,
  });

  // Load commands on mount
  useEffect(() => {
    setCommands(loadCustomCommands());
  }, []);

  // Filtered and sorted commands
  const filteredCommands = useMemo(() => {
    let result = commands;
    if (searchQuery) {
      result = searchCommands(result, searchQuery);
    }
    if (categoryFilter !== "all") {
      result = filterCommandsByCategory(result, categoryFilter);
    }
    return sortCommandsByName(result);
  }, [commands, searchQuery, categoryFilter]);

  // Handle form input changes
  const handleFormChange = useCallback(<K extends keyof CustomCommand>(
    field: K,
    value: CustomCommand[K]
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  }, []);

  // Start editing a command
  const handleEdit = useCallback((command: CustomCommand) => {
    setEditingCommand(command);
    setFormData({
      name: command.name,
      description: command.description,
      promptTemplate: command.promptTemplate,
      category: command.category,
      shortcut: command.shortcut,
      enabled: command.enabled,
    });
    setIsAdding(true);
  }, []);

  // Reset form to defaults
  const resetForm = useCallback(() => {
    setFormData({
      name: "",
      description: "",
      promptTemplate: "",
      category: "general",
      shortcut: "",
      enabled: true,
    });
  }, []);

  // Save command (add or edit)
  const handleSave = useCallback(() => {
    if (!formData.name?.trim() || !formData.promptTemplate?.trim()) {
      toast.error(t("settings.customCommands.errorRequired"));
      return;
    }

    const now = Date.now();
    let updatedCommands: CustomCommand[];

    if (editingCommand) {
      // Update existing
      updatedCommands = commands.map((cmd) =>
        cmd.id === editingCommand.id
          ? {
              ...cmd,
              name: formData.name!.trim(),
              description: formData.description?.trim() || "",
              promptTemplate: formData.promptTemplate!.trim(),
              category: formData.category || "general",
              shortcut: formData.shortcut?.trim() || undefined,
              enabled: formData.enabled ?? true,
              updatedAt: now,
            }
          : cmd
      );
    } else {
      // Add new
      const newCommand: CustomCommand = {
        id: `cmd-${now}-${Math.random().toString(36).substring(2, 9)}`,
        name: formData.name!.trim(),
        description: formData.description?.trim() || "",
        promptTemplate: formData.promptTemplate!.trim(),
        category: formData.category || "general",
        shortcut: formData.shortcut?.trim() || undefined,
        enabled: formData.enabled ?? true,
        createdAt: now,
        updatedAt: now,
      };
      updatedCommands = [...commands, newCommand];
    }

    saveCustomCommands(updatedCommands);
    setCommands(updatedCommands);
    setEditingCommand(null);
    setIsAdding(false);
    resetForm();
    toast.success(t("settings.customCommands.saved"));
    onSettingsChange?.();
  }, [formData, editingCommand, commands, t, onSettingsChange, resetForm]);

  // Delete a command
  const handleDelete = useCallback((commandId: string) => {
    const updatedCommands = commands.filter((cmd) => cmd.id !== commandId);
    saveCustomCommands(updatedCommands);
    setCommands(updatedCommands);
    toast.success(t("settings.customCommands.deleted"));
    onSettingsChange?.();
  }, [commands, t, onSettingsChange]);

  // Toggle command enabled state
  const handleToggleEnabled = useCallback((commandId: string, enabled: boolean) => {
    const updatedCommands = commands.map((cmd) =>
      cmd.id === commandId ? { ...cmd, enabled, updatedAt: Date.now() } : cmd
    );
    saveCustomCommands(updatedCommands);
    setCommands(updatedCommands);
    onSettingsChange?.();
  }, [commands, onSettingsChange]);

  // Reset to defaults
  const handleReset = useCallback(() => {
    const defaults = resetCustomCommands();
    setCommands(defaults);
    toast.success(t("settings.customCommands.resetSuccess"));
    onSettingsChange?.();
  }, [t, onSettingsChange]);

  // Cancel editing
  const handleCancel = useCallback(() => {
    setEditingCommand(null);
    setIsAdding(false);
    resetForm();
  }, [resetForm]);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {t("settings.customCommands.settingsDescription")}
        </p>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setIsAdding(true);
              resetForm();
            }}
          >
            <Plus className="h-4 w-4 mr-1" />
            {t("settings.customCommands.addCommand")}
          </Button>
          <Button variant="ghost" size="sm" onClick={handleReset}>
            <RotateCcw className="h-4 w-4 mr-1" />
            {t("settings.customCommands.reset")}
          </Button>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t("settings.customCommands.searchPlaceholder")}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8"
          />
        </div>
        <Select
          value={categoryFilter}
          onValueChange={(v) => setCategoryFilter(v as CommandCategory | "all")}
        >
          <SelectTrigger className="w-[140px]">
            <Filter className="h-4 w-4 mr-1" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("settings.customCommands.allCategories")}</SelectItem>
            {COMMAND_CATEGORIES.map((cat) => (
              <SelectItem key={cat.id} value={cat.id}>
                {t(`settings.customCommands.categories.${cat.id}`)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Add/Edit Form */}
      {isAdding && (
        <div className="p-4 border border-border rounded-lg space-y-4 bg-muted/30">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium flex items-center gap-2">
              <Terminal className="h-4 w-4" />
              {editingCommand
                ? t("settings.customCommands.editCommand")
                : t("settings.customCommands.addCommand")}
            </h4>
            <Button variant="ghost" size="icon-xs" onClick={handleCancel}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="cmd-name">{t("settings.customCommands.name")}</Label>
              <Input
                id="cmd-name"
                value={formData.name || ""}
                onChange={(e) => handleFormChange("name", e.target.value)}
                placeholder={t("settings.customCommands.namePlaceholder")}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cmd-category">{t("settings.customCommands.category")}</Label>
              <Select
                value={formData.category}
                onValueChange={(v) => handleFormChange("category", v as CommandCategory)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {COMMAND_CATEGORIES.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {t(`settings.customCommands.categories.${cat.id}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="cmd-description">{t("settings.customCommands.commandDescription")}</Label>
            <Input
              id="cmd-description"
              value={formData.description || ""}
              onChange={(e) => handleFormChange("description", e.target.value)}
              placeholder={t("settings.customCommands.descriptionPlaceholder")}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="cmd-shortcut">{t("settings.customCommands.shortcut")}</Label>
              <Input
                id="cmd-shortcut"
                value={formData.shortcut || ""}
                onChange={(e) => handleFormChange("shortcut", e.target.value)}
                placeholder={t("settings.customCommands.shortcutPlaceholder")}
              />
              <p className="text-xs text-muted-foreground">
                {t("settings.customCommands.shortcutHint")}
              </p>
            </div>

            <div className="space-y-2">
              <Label>{t("settings.customCommands.status")}</Label>
              <div className="flex items-center gap-2 pt-2">
                <Switch
                  checked={formData.enabled ?? true}
                  onCheckedChange={(v) => handleFormChange("enabled", v)}
                />
                <span className="text-sm">
                  {formData.enabled ? t("common.enabled") : t("common.disabled")}
                </span>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="cmd-prompt">{t("settings.customCommands.promptTemplate")}</Label>
            <textarea
              id="cmd-prompt"
              className="w-full min-h-[100px] p-2 text-sm border border-input rounded-md bg-background resize-none focus:outline-none focus:ring-2 focus:ring-ring"
              value={formData.promptTemplate || ""}
              onChange={(e) => handleFormChange("promptTemplate", e.target.value)}
              placeholder={t("settings.customCommands.promptPlaceholder")}
            />
            <p className="text-xs text-muted-foreground">
              {t("settings.customCommands.promptHint")}
            </p>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={handleCancel}>
              {t("common.cancel")}
            </Button>
            <Button size="sm" onClick={handleSave}>
              <Check className="h-4 w-4 mr-1" />
              {t("common.save")}
            </Button>
          </div>
        </div>
      )}

      {/* Commands List */}
      <div className="space-y-2">
        {filteredCommands.map((command) => (
          <div
            key={command.id}
            className={`flex items-center justify-between p-3 border border-border rounded-lg hover:bg-muted/30 transition-colors ${
              !command.enabled ? "opacity-60" : ""
            }`}
          >
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <Switch
                checked={command.enabled}
                onCheckedChange={(v) => handleToggleEnabled(command.id, v)}
                aria-label={t("settings.customCommands.toggleEnabled")}
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium truncate">{command.name}</p>
                  {command.shortcut && (
                    <span className="text-xs bg-muted px-1.5 py-0.5 rounded font-mono">
                      {command.shortcut}
                    </span>
                  )}
                  <span className="text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded">
                    {t(`settings.customCommands.categories.${command.category}`)}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground truncate">
                  {command.description || command.promptTemplate.substring(0, 60) + "..."}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon-xs"
                onClick={() => handleEdit(command)}
                aria-label={t("settings.customCommands.editCommand")}
              >
                <Edit3 className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon-xs"
                onClick={() => handleDelete(command.id)}
                className="text-destructive hover:text-destructive"
                aria-label={t("settings.customCommands.deleteCommand")}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>

      {filteredCommands.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-4">
          {searchQuery || categoryFilter !== "all"
            ? t("settings.customCommands.noResults")
            : t("settings.customCommands.noCommands")}
        </p>
      )}

      {/* Privacy Note */}
      <p className="text-xs text-muted-foreground border-t pt-4">
        {t("settings.customCommands.privacyNote")}
      </p>
    </div>
  );
}

export default CustomCommandsSettings;
