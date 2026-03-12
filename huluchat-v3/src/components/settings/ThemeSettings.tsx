/**
 * Theme Settings Component
 * Allows users to customize application appearance
 *
 * PRIVACY: Theme preference is stored locally, no data is sent to servers
 */
import { useTranslation } from "react-i18next";
import { Sun, Moon, Monitor, Palette } from "lucide-react";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/Select";
import { useTheme } from "@/components/theme-provider";

const themeOptions = [
  {
    value: "light",
    icon: Sun,
    labelKey: "theme.light",
    descriptionKey: "appearance.themeLightDescription",
  },
  {
    value: "dark",
    icon: Moon,
    labelKey: "theme.dark",
    descriptionKey: "appearance.themeDarkDescription",
  },
  {
    value: "system",
    icon: Monitor,
    labelKey: "theme.system",
    descriptionKey: "appearance.themeSystemDescription",
  },
] as const;

export function ThemeSettings() {
  const { t } = useTranslation();
  const { theme, setTheme } = useTheme();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Palette className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
        <h3 className="text-sm font-medium">{t("appearance.title")}</h3>
      </div>

      {/* Theme Selection */}
      <div className="space-y-3">
        <Label htmlFor="theme-select">{t("appearance.theme")}</Label>
        <Select value={theme} onValueChange={setTheme}>
          <SelectTrigger id="theme-select" className="w-full">
            <SelectValue placeholder={t("appearance.selectTheme")} />
          </SelectTrigger>
          <SelectContent>
            {themeOptions.map((option) => {
              const Icon = option.icon;
              return (
                <SelectItem key={option.value} value={option.value}>
                  <div className="flex items-center gap-2">
                    <Icon className="h-4 w-4" aria-hidden="true" />
                    <span>{t(option.labelKey)}</span>
                  </div>
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>

        {/* Theme Description */}
        <p className="text-xs text-muted-foreground">
          {t(
            themeOptions.find((opt) => opt.value === theme)?.descriptionKey ||
              "appearance.themeSystemDescription"
          )}
        </p>
      </div>

      {/* Theme Preview Cards */}
      <div className="grid grid-cols-3 gap-3">
        {themeOptions.map((option) => {
          const Icon = option.icon;
          const isActive = theme === option.value;
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => setTheme(option.value)}
              className={`
                flex flex-col items-center gap-2 p-4 rounded-lg border transition-all duration-200
                ${
                  isActive
                    ? "border-primary bg-primary/5 dark:bg-primary/10 ring-1 ring-primary"
                    : "border-border hover:border-primary/50 hover:bg-muted/50"
                }
              `}
              aria-pressed={isActive}
              aria-label={t(option.labelKey)}
            >
              <Icon
                className={`h-6 w-6 ${isActive ? "text-primary" : "text-muted-foreground"}`}
                aria-hidden="true"
              />
              <span
                className={`text-xs ${isActive ? "font-medium text-primary" : "text-muted-foreground"}`}
              >
                {t(option.labelKey)}
              </span>
            </button>
          );
        })}
      </div>

      {/* Privacy Note */}
      <p className="text-xs text-muted-foreground border-t pt-4">
        {t("appearance.privacyNote")}
      </p>
    </div>
  );
}
