import { Moon, Sun } from "lucide-react"
import { useTranslation } from "react-i18next"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { useTheme } from "@/components/theme-provider"

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const { t } = useTranslation()

  return (
    <DropdownMenu>
      <Tooltip>
        <TooltipTrigger asChild>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              aria-label={t("theme.toggle")}
              aria-haspopup="true"
              className="relative overflow-hidden"
            >
              <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all duration-300 ease-out dark:-rotate-90 dark:scale-0" aria-hidden="true" />
              <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all duration-300 ease-out dark:rotate-0 dark:scale-100" aria-hidden="true" />
              <span className="sr-only">{t("theme.toggle")}</span>
            </Button>
          </DropdownMenuTrigger>
        </TooltipTrigger>
        <TooltipContent>
          <p>{t("theme.toggle")}</p>
        </TooltipContent>
      </Tooltip>
      <DropdownMenuContent align="end">
        <DropdownMenuItem
          onClick={() => setTheme("light")}
          aria-current={theme === "light" ? "true" : undefined}
          className="transition-colors duration-150"
        >
          {t("theme.light")}
          {theme === "light" && (
            <span className="ml-auto text-xs animate-in zoom-in-50 duration-150">✓</span>
          )}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => setTheme("dark")}
          aria-current={theme === "dark" ? "true" : undefined}
          className="transition-colors duration-150"
        >
          {t("theme.dark")}
          {theme === "dark" && (
            <span className="ml-auto text-xs animate-in zoom-in-50 duration-150">✓</span>
          )}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => setTheme("system")}
          aria-current={theme === "system" ? "true" : undefined}
          className="transition-colors duration-150"
        >
          {t("theme.system")}
          {theme === "system" && (
            <span className="ml-auto text-xs animate-in zoom-in-50 duration-150">✓</span>
          )}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
