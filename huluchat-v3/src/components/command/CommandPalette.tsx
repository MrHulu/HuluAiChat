/**
 * CommandPalette - 快捷命令面板
 * 类似 Raycast/Spotlight 的命令搜索和执行
 */
import { useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import {
  Plus,
  Settings,
  PanelLeft,
  Download,
  Search,
  Globe,
  Moon,
  HelpCircle,
  FolderPlus,
} from "lucide-react";
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandShortcut,
  CommandSeparator,
} from "@/components/ui/command";

export interface CommandAction {
  id: string;
  icon: React.ReactNode;
  labelKey: string;
  shortcut?: string;
  action: () => void;
  group?: "actions" | "navigation" | "settings";
}

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  // Actions
  onNewSession?: () => void;
  onNewFolder?: () => void;
  onToggleSidebar?: () => void;
  onOpenSettings?: () => void;
  onExportSession?: () => void;
  onSearch?: () => void;
  onChangeLanguage?: () => void;
  onToggleTheme?: () => void;
  onShowHelp?: () => void;
}

/**
 * 检测是否为 macOS
 */
function isMacOS(): boolean {
  return navigator.platform.toUpperCase().indexOf("MAC") >= 0;
}

export function CommandPalette({
  open,
  onOpenChange,
  onNewSession,
  onNewFolder,
  onToggleSidebar,
  onOpenSettings,
  onExportSession,
  onSearch,
  onChangeLanguage,
  onToggleTheme,
  onShowHelp,
}: CommandPaletteProps) {
  const { t } = useTranslation();
  const isMac = isMacOS();

  // 定义所有命令
  const commands = useMemo<CommandAction[]>(() => {
    const cmds: CommandAction[] = [];

    // Actions group
    if (onNewSession) {
      cmds.push({
        id: "new-session",
        icon: <Plus className="size-4 transition-transform duration-200 data-[selected=true]:scale-110" aria-hidden="true" />,
        labelKey: "command.newSession",
        shortcut: isMac ? "⌘N" : "Ctrl+N",
        action: onNewSession,
        group: "actions",
      });
    }

    if (onNewFolder) {
      cmds.push({
        id: "new-folder",
        icon: <FolderPlus className="size-4 transition-transform duration-200 data-[selected=true]:scale-110" aria-hidden="true" />,
        labelKey: "command.newFolder",
        action: onNewFolder,
        group: "actions",
      });
    }

    if (onExportSession) {
      cmds.push({
        id: "export",
        icon: <Download className="size-4 transition-transform duration-200 data-[selected=true]:translate-y-0.5" aria-hidden="true" />,
        labelKey: "command.exportSession",
        action: onExportSession,
        group: "actions",
      });
    }

    if (onSearch) {
      cmds.push({
        id: "search",
        icon: <Search className="size-4 transition-transform duration-200 data-[selected=true]:scale-110" aria-hidden="true" />,
        labelKey: "command.search",
        shortcut: isMac ? "⌘F" : "Ctrl+F",
        action: onSearch,
        group: "actions",
      });
    }

    // Navigation group
    if (onToggleSidebar) {
      cmds.push({
        id: "toggle-sidebar",
        icon: <PanelLeft className="size-4 transition-transform duration-200 data-[selected=true]:translate-x-0.5" aria-hidden="true" />,
        labelKey: "command.toggleSidebar",
        shortcut: isMac ? "⌘B" : "Ctrl+B",
        action: onToggleSidebar,
        group: "navigation",
      });
    }

    // Settings group
    if (onChangeLanguage) {
      cmds.push({
        id: "change-language",
        icon: <Globe className="size-4 transition-transform duration-200 data-[selected=true]:rotate-12" aria-hidden="true" />,
        labelKey: "command.changeLanguage",
        action: onChangeLanguage,
        group: "settings",
      });
    }

    if (onToggleTheme) {
      cmds.push({
        id: "toggle-theme",
        icon: <Moon className="size-4 transition-transform duration-200 data-[selected=true]:-rotate-12" aria-hidden="true" />,
        labelKey: "command.toggleTheme",
        action: onToggleTheme,
        group: "settings",
      });
    }

    if (onOpenSettings) {
      cmds.push({
        id: "settings",
        icon: <Settings className="size-4 transition-transform duration-200 data-[selected=true]:rotate-45" aria-hidden="true" />,
        labelKey: "command.settings",
        shortcut: isMac ? "⌘," : "Ctrl+,",
        action: onOpenSettings,
        group: "settings",
      });
    }

    if (onShowHelp) {
      cmds.push({
        id: "help",
        icon: <HelpCircle className="size-4 transition-transform duration-200 data-[selected=true]:scale-110" aria-hidden="true" />,
        labelKey: "command.showHelp",
        shortcut: isMac ? "?" : "?",
        action: onShowHelp,
        group: "settings",
      });
    }

    return cmds;
  }, [
    onNewSession,
    onNewFolder,
    onToggleSidebar,
    onOpenSettings,
    onExportSession,
    onSearch,
    onChangeLanguage,
    onToggleTheme,
    onShowHelp,
    isMac,
  ]);

  // 分组命令
  const groupedCommands = useMemo(() => {
    const groups: Record<string, CommandAction[]> = {
      actions: [],
      navigation: [],
      settings: [],
    };

    commands.forEach((cmd) => {
      const group = cmd.group || "actions";
      if (groups[group]) {
        groups[group].push(cmd);
      }
    });

    return groups;
  }, [commands]);

  // 执行命令
  const runCommand = useCallback(
    (command: CommandAction) => {
      onOpenChange(false);
      command.action();
    },
    [onOpenChange]
  );

  return (
    <CommandDialog
      open={open}
      onOpenChange={onOpenChange}
      title={t("command.title")}
      description={t("command.description")}
      className="sm:max-w-lg"
    >
      <CommandInput placeholder={t("command.placeholder")} aria-label={t("command.searchInput")} />
      <CommandList>
        <CommandEmpty>{t("command.noResults")}</CommandEmpty>

        {/* Actions Group */}
        {groupedCommands.actions.length > 0 && (
          <CommandGroup heading={t("command.groupActions")}>
            {groupedCommands.actions.map((cmd) => (
              <CommandItem
                key={cmd.id}
                onSelect={() => runCommand(cmd)}
                className="cursor-pointer"
              >
                {cmd.icon}
                <span>{t(cmd.labelKey)}</span>
                {cmd.shortcut && (
                  <CommandShortcut>{cmd.shortcut}</CommandShortcut>
                )}
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {/* Navigation Group */}
        {groupedCommands.navigation.length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading={t("command.groupNavigation")}>
              {groupedCommands.navigation.map((cmd) => (
                <CommandItem
                  key={cmd.id}
                  onSelect={() => runCommand(cmd)}
                  className="cursor-pointer"
                >
                  {cmd.icon}
                  <span>{t(cmd.labelKey)}</span>
                  {cmd.shortcut && (
                    <CommandShortcut>{cmd.shortcut}</CommandShortcut>
                  )}
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}

        {/* Settings Group */}
        {groupedCommands.settings.length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading={t("command.groupSettings")}>
              {groupedCommands.settings.map((cmd) => (
                <CommandItem
                  key={cmd.id}
                  onSelect={() => runCommand(cmd)}
                  className="cursor-pointer"
                >
                  {cmd.icon}
                  <span>{t(cmd.labelKey)}</span>
                  {cmd.shortcut && (
                    <CommandShortcut>{cmd.shortcut}</CommandShortcut>
                  )}
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}
      </CommandList>
    </CommandDialog>
  );
}
