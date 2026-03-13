/**
 * Plugin Marketplace Component
 * Browse, search, and install plugins from the official registry
 * @module components/settings/PluginMarketplace
 */

import React from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import {
  Search,
  Download,
  Check,
  Loader2,
  Star,
  Zap,
  Code,
  MessageCircle,
  DownloadCloud,
  Palette,
  Wrench,
  Plug,
  ExternalLink,
  Puzzle,
  Sparkles,
  TrendingUp,
  Filter,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { usePluginManager } from "@/hooks";
import {
  type PluginCategory,
  type PluginRegistryEntry,
  getAvailablePlugins,
  searchPlugins,
  getCategories,
  getFeaturedPlugins,
  getCategoryInfo,
  sortPlugins,
} from "@/plugins";

/**
 * Category icon component
 */
function CategoryIcon({ category }: { category: PluginCategory }) {
  const info = getCategoryInfo(category);
  const iconProps = { className: "h-4 w-4", "aria-hidden": true };

  switch (info.icon) {
    case "zap":
      return <Zap {...iconProps} />;
    case "code":
      return <Code {...iconProps} />;
    case "message-circle":
      return <MessageCircle {...iconProps} />;
    case "download":
      return <DownloadCloud {...iconProps} />;
    case "palette":
      return <Palette {...iconProps} />;
    case "tool":
      return <Wrench {...iconProps} />;
    case "plug":
      return <Plug {...iconProps} />;
    default:
      return <Puzzle {...iconProps} />;
  }
}

/**
 * Badge display component
 */
function PluginBadgeDisplay({ badge }: { badge: string }) {
  const { t } = useTranslation();

  const badgeConfig: Record<string, { variant: "default" | "secondary" | "outline"; icon?: React.ReactNode }> = {
    official: { variant: "default", icon: <Check className="h-3 w-3" /> },
    new: { variant: "secondary", icon: <Sparkles className="h-3 w-3" /> },
    popular: { variant: "secondary", icon: <TrendingUp className="h-3 w-3" /> },
    featured: { variant: "default", icon: <Star className="h-3 w-3" /> },
  };

  const config = badgeConfig[badge] || { variant: "outline" };

  return (
    <Badge variant={config.variant} className="text-xs gap-1">
      {config.icon}
      {t(`plugins.badges.${badge}`, badge)}
    </Badge>
  );
}

/**
 * Plugin card for marketplace
 */
function MarketplacePluginCard({
  plugin,
  isInstalled,
  isInstalling,
  onInstall,
}: {
  plugin: PluginRegistryEntry;
  isInstalled: boolean;
  isInstalling: boolean;
  onInstall: () => void;
}) {
  const { t } = useTranslation();
  const categoryInfo = getCategoryInfo(plugin.category);

  return (
    <Card className="transition-all duration-200 hover:shadow-md hover:border-primary/20 dark:hover:shadow-[0_0_12px_oklch(0.4_0.1_264/0.2)] dark:hover:border-primary/30 group">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-base flex items-center gap-2">
              {plugin.manifest.name}
              {plugin.badges && plugin.badges.length > 0 && (
                <span className="flex gap-1">
                  {plugin.badges.map((badge) => (
                    <PluginBadgeDisplay key={badge} badge={badge} />
                  ))}
                </span>
              )}
            </CardTitle>
            <CardDescription className="text-xs mt-1 line-clamp-2">
              {plugin.manifest.description}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {/* Author & Version */}
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{t("plugins.byAuthor", { author: plugin.manifest.author })}</span>
            <span>v{plugin.manifest.version}</span>
          </div>

          {/* Category & Tags */}
          <div className="flex flex-wrap items-center gap-1">
            <Badge variant="outline" className="text-xs gap-1">
              <CategoryIcon category={plugin.category} />
              {t(`plugins.categories.${plugin.category}`, categoryInfo.label)}
            </Badge>
            {plugin.tags.slice(0, 3).map((tag) => (
              <Badge key={tag} variant="secondary" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>

          {/* Permissions preview */}
          {plugin.manifest.permissions.length > 0 && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground cursor-help">
                    <span>{t("plugins.permissionsCount", { count: plugin.manifest.permissions.length })}</span>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <div className="space-y-1">
                    {plugin.manifest.permissions.map((perm) => (
                      <div key={perm} className="text-xs">
                        {t(`plugins.permissions.${perm}`, perm)}
                      </div>
                    ))}
                  </div>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}

          {/* Actions */}
          <div className="flex items-center justify-between pt-2">
            {/* Links */}
            <div className="flex items-center gap-2">
              {plugin.manifest.homepage && (
                <a
                  href={plugin.manifest.homepage}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1"
                >
                  {t("plugins.homepage")}
                  <ExternalLink className="h-3 w-3" />
                </a>
              )}
            </div>

            {/* Install button */}
            {isInstalled ? (
              <Badge variant="secondary" className="gap-1">
                <Check className="h-3 w-3" />
                {t("plugins.installedBadge")}
              </Badge>
            ) : (
              <Button
                variant="default"
                size="sm"
                onClick={onInstall}
                disabled={isInstalling}
                className="group/install"
              >
                {isInstalling ? (
                  <Loader2 className="h-3 w-3 animate-spin mr-1" />
                ) : (
                  <Download className="h-3 w-3 mr-1 transition-transform duration-200 ease-out group-hover/install:translate-y-0.5" />
                )}
                {t("plugins.install")}
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Category filter tabs
 */
function CategoryTabs({
  selectedCategory,
  onSelectCategory,
}: {
  selectedCategory: PluginCategory | "all";
  onSelectCategory: (category: PluginCategory | "all") => void;
}) {
  const { t } = useTranslation();
  const categories = getCategories();

  return (
    <div className="w-full overflow-x-auto whitespace-nowrap">
      <Tabs value={selectedCategory} onValueChange={(v) => onSelectCategory(v as PluginCategory | "all")}>
        <TabsList className="w-full justify-start">
          <TabsTrigger value="all" className="gap-1">
            <Puzzle className="h-3 w-3" />
            {t("plugins.categories.all")}
          </TabsTrigger>
          {categories.map((category) => {
            const info = getCategoryInfo(category);
            return (
              <TabsTrigger key={category} value={category} className="gap-1">
                <CategoryIcon category={category} />
                {t(`plugins.categories.${category}`, info.label)}
              </TabsTrigger>
            );
          })}
        </TabsList>
      </Tabs>
    </div>
  );
}

/**
 * Plugin Marketplace component
 */
export function PluginMarketplace() {
  const { t } = useTranslation();
  const {
    plugins: installedPlugins,
    installPlugin,
    isLoading,
  } = usePluginManager();

  const [searchQuery, setSearchQuery] = React.useState("");
  const [selectedCategory, setSelectedCategory] = React.useState<PluginCategory | "all">("all");
  const [sortBy, setSortBy] = React.useState<"name" | "downloads" | "rating">("name");
  const [installingId, setInstallingId] = React.useState<string | null>(null);
  const [viewMode, setViewMode] = React.useState<"all" | "featured">("all");

  // Get installed plugin IDs
  const installedIds = React.useMemo(
    () => new Set(installedPlugins.map((p) => p.manifest.id)),
    [installedPlugins]
  );

  // Filter and sort plugins
  const filteredPlugins = React.useMemo(() => {
    let plugins: PluginRegistryEntry[];

    // Start with featured or all
    if (viewMode === "featured") {
      plugins = getFeaturedPlugins();
    } else {
      plugins = getAvailablePlugins();
    }

    // Filter by category
    if (selectedCategory !== "all") {
      plugins = plugins.filter((p) => p.category === selectedCategory);
    }

    // Search
    if (searchQuery.trim()) {
      plugins = searchPlugins(searchQuery);
    }

    // Sort
    return sortPlugins(plugins, sortBy);
  }, [selectedCategory, searchQuery, sortBy, viewMode]);

  // Handle install
  const handleInstall = async (plugin: PluginRegistryEntry) => {
    try {
      setInstallingId(plugin.manifest.id);
      // The sourcePath is relative to the plugins directory
      // In production, this would be a bundled path
      const pluginPath = `plugins/${plugin.sourcePath}`;
      await installPlugin(pluginPath);
      toast.success(t("plugins.installSuccess"));
    } catch (err) {
      toast.error(
        t("plugins.installFailed", {
          error: err instanceof Error ? err.message : String(err),
        })
      );
    } finally {
      setInstallingId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8 animate-fade-in">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        <span className="ml-2 text-sm text-muted-foreground">{t("plugins.loading")}</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          <h3 className="text-sm font-medium">{t("plugins.marketplace.title")}</h3>
          <Badge variant="secondary" className="text-xs">
            {t("plugins.marketplace.available", { count: filteredPlugins.length })}
          </Badge>
        </div>
      </div>

      {/* View mode toggle */}
      <div className="flex items-center gap-2">
        <Button
          variant={viewMode === "all" ? "default" : "outline"}
          size="sm"
          onClick={() => setViewMode("all")}
          className="gap-1"
        >
          <Filter className="h-3 w-3" />
          {t("plugins.marketplace.allPlugins")}
        </Button>
        <Button
          variant={viewMode === "featured" ? "default" : "outline"}
          size="sm"
          onClick={() => setViewMode("featured")}
          className="gap-1"
        >
          <Star className="h-3 w-3" />
          {t("plugins.marketplace.featured")}
        </Button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder={t("plugins.marketplace.search")}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Category tabs */}
      <CategoryTabs
        selectedCategory={selectedCategory}
        onSelectCategory={setSelectedCategory}
      />

      {/* Sort options */}
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>{t("plugins.marketplace.sortBy")}</span>
        <div className="flex items-center gap-1">
          {(["name", "downloads", "rating"] as const).map((option) => (
            <Button
              key={option}
              variant={sortBy === option ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setSortBy(option)}
              className="h-7 text-xs"
            >
              {t(`plugins.marketplace.sort.${option}`)}
            </Button>
          ))}
        </div>
      </div>

      {/* Plugin grid */}
      {filteredPlugins.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 text-center border rounded-lg animate-bounce-in">
          <Search className="h-8 w-8 text-muted-foreground mb-2" />
          <p className="text-sm text-muted-foreground">{t("plugins.marketplace.noResults")}</p>
          <p className="text-xs text-muted-foreground mt-1">{t("plugins.marketplace.noResultsHint")}</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {filteredPlugins.map((plugin, index) => (
            <div
              key={plugin.manifest.id}
              className="animate-list-enter"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <MarketplacePluginCard
                plugin={plugin}
                isInstalled={installedIds.has(plugin.manifest.id)}
                isInstalling={installingId === plugin.manifest.id}
                onInstall={() => handleInstall(plugin)}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
