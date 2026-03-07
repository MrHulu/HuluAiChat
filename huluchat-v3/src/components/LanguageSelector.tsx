/**
 * Language Selector Component
 * Allows users to switch between supported languages
 * Supports lazy loading of language files
 */
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Globe, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { supportedLanguages, changeLanguage, type LanguageCode } from "@/i18n";

export function LanguageSelector() {
  const { i18n, t } = useTranslation();
  const [isLoading, setIsLoading] = useState(false);
  const [loadingLang, setLoadingLang] = useState<string | null>(null);

  const handleLanguageChange = async (langCode: LanguageCode) => {
    if (isLoading || i18n.language === langCode) return;

    setIsLoading(true);
    setLoadingLang(langCode);

    try {
      await changeLanguage(langCode);
    } catch (error) {
      console.error("Failed to change language:", error);
    } finally {
      setIsLoading(false);
      setLoadingLang(null);
    }
  };

  return (
    <DropdownMenu>
      <Tooltip>
        <TooltipTrigger asChild>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Globe className="h-5 w-5" />
              )}
              <span className="sr-only">{t("languageSelector.language")}</span>
            </Button>
          </DropdownMenuTrigger>
        </TooltipTrigger>
        <TooltipContent>
          <p>{t("languageSelector.changeLanguage")}</p>
        </TooltipContent>
      </Tooltip>
      <DropdownMenuContent align="end">
        {supportedLanguages.map((lang) => (
          <DropdownMenuItem
            key={lang.code}
            onClick={() => handleLanguageChange(lang.code)}
            disabled={isLoading}
            className={i18n.language === lang.code ? "bg-accent" : ""}
          >
            <span className="mr-2">{lang.nativeName}</span>
            {loadingLang === lang.code && (
              <Loader2 className="ml-auto h-3 w-3 animate-spin" />
            )}
            {i18n.language === lang.code && loadingLang !== lang.code && (
              <span className="ml-auto text-xs text-muted-foreground">✓</span>
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
