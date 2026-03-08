/**
 * HuluChat v3 - Main App
 * Tauri + React + FastAPI AI Chat Application
 */
import { useState, useEffect, useCallback, lazy, Suspense } from "react";
import { Toaster, toast } from "sonner";
import { useTranslation } from "react-i18next";
import { ThemeToggle } from "@/components/theme-toggle";
import { ChatView } from "@/components/chat";
import { SessionList } from "@/components/sidebar";
import { UpdateNotification } from "@/components/UpdateNotification";
import { KeyboardHelpDialog } from "@/components/keyboard/KeyboardHelpDialog";
import { LanguageSelector } from "@/components/LanguageSelector";
import { CommandPalette } from "@/components/command";
import { WelcomeDialog } from "@/components/WelcomeDialog";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useSession, useKeyboardShortcuts, useFolders } from "@/hooks";
import { exportSession, moveSessionToFolder, ExportFormat } from "@/api/client";

// Import version from package.json for dynamic version display
import { version } from "../package.json";

// 懒加载设置对话框（非核心功能）
const SettingsDialog = lazy(() =>
  import("@/components/settings").then((mod) => ({ default: mod.SettingsDialog }))
);

// Local storage keys
const WELCOME_SHOWN_KEY = "huluchat-welcome-shown";

function App() {
  const { t } = useTranslation();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [keyboardHelpOpen, setKeyboardHelpOpen] = useState(false);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);

  // Welcome dialog state - check if first time user
  const [welcomeOpen, setWelcomeOpen] = useState(() => {
    const hasSeenWelcome = localStorage.getItem(WELCOME_SHOWN_KEY);
    return !hasSeenWelcome;
  });

  const handleWelcomeComplete = () => {
    localStorage.setItem(WELCOME_SHOWN_KEY, "true");
  };

  const {
    sessions,
    currentSession,
    isLoading,
    error,
    selectSession,
    createNewSession,
    removeSession,
    refreshSessions,
  } = useSession();

  const {
    folders,
    createFolder,
    renameFolder,
    removeFolder,
  } = useFolders();

  // 显示错误 toast
  useEffect(() => {
    if (error) {
      toast.error(error);
    }
  }, [error]);

  const handleCreateSession = async () => {
    const session = await createNewSession();
    if (session) {
      selectSession(session.id);
    }
  };

  const handleDeleteSession = async (id: string) => {
    if (window.confirm(t("app.deleteConfirm"))) {
      await removeSession(id);
    }
  };

  // 导出会话
  const handleExportSession = async (sessionId: string, format: ExportFormat) => {
    try {
      const { blob, filename } = await exportSession(sessionId, format);

      // Create download link
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();

      // Cleanup
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success(t("app.exportSuccess", { format: format.toUpperCase() }));
    } catch (error) {
      console.error("Export failed:", error);
      toast.error(t("app.exportFailed"));
    }
  };

  // 创建文件夹
  const handleCreateFolder = async (name: string) => {
    const folder = await createFolder(name);
    if (folder) {
      toast.success(t("app.folderCreated", { name }));
    }
  };

  // 重命名文件夹
  const handleRenameFolder = async (id: string, name: string) => {
    const folder = await renameFolder(id, name);
    if (folder) {
      toast.success(t("app.folderRenamed", { name }));
    }
  };

  // 删除文件夹
  const handleDeleteFolder = async (id: string) => {
    const folder = folders.find((f) => f.id === id);
    if (!folder) return;

    if (window.confirm(t("app.deleteFolderConfirm", { name: folder.name }))) {
      await removeFolder(id);
      toast.success(t("app.folderDeleted", { name: folder.name }));
    }
  };

  // 移动会话到文件夹
  const handleMoveSessionToFolder = async (sessionId: string, folderId: string | null) => {
    try {
      await moveSessionToFolder(sessionId, folderId);
      refreshSessions(); // 刷新会话列表
      const folderName = folderId
        ? folders.find((f) => f.id === folderId)?.name || "folder"
        : t("sidebar.uncategorized");
      toast.success(t("app.movedTo", { name: folderName }));
    } catch (error) {
      console.error("Failed to move session:", error);
      toast.error(t("app.moveFailed"));
    }
  };

  // 键盘快捷键
  useKeyboardShortcuts({
    onNewSession: handleCreateSession,
    onToggleSidebar: () => setSidebarCollapsed((prev) => !prev),
    onOpenSettings: () => setSettingsOpen(true),
    onSwitchSession: (index: number) => {
      if (sessions[index]) {
        selectSession(sessions[index].id);
      }
    },
  });

  // F1 和 ? 键打开快捷键帮助
  const handleHelpKeyDown = useCallback((event: KeyboardEvent) => {
    // F1 键
    if (event.key === "F1") {
      event.preventDefault();
      setKeyboardHelpOpen((prev) => !prev);
      return;
    }

    // ? 键（不在输入框中时）
    if (event.key === "?") {
      const target = event.target as HTMLElement;
      const isInputFocused =
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable;

      if (!isInputFocused) {
        event.preventDefault();
        setKeyboardHelpOpen((prev) => !prev);
      }
    }
  }, []);

  // Ctrl/Cmd + K 打开命令面板
  const handleCommandPaletteKeyDown = useCallback((event: KeyboardEvent) => {
    const isMac = navigator.platform.toUpperCase().indexOf("MAC") >= 0;
    const modifierKey = isMac ? event.metaKey : event.ctrlKey;

    if (event.key.toLowerCase() === "k" && modifierKey) {
      event.preventDefault();
      setCommandPaletteOpen((prev) => !prev);
    }
  }, []);

  useEffect(() => {
    window.addEventListener("keydown", handleHelpKeyDown);
    window.addEventListener("keydown", handleCommandPaletteKeyDown);
    return () => {
      window.removeEventListener("keydown", handleHelpKeyDown);
      window.removeEventListener("keydown", handleCommandPaletteKeyDown);
    };
  }, [handleHelpKeyDown, handleCommandPaletteKeyDown]);

  return (
    <TooltipProvider>
      <Toaster position="top-center" richColors closeButton />
      <UpdateNotification />
      <WelcomeDialog
        open={welcomeOpen}
        onOpenChange={setWelcomeOpen}
        onComplete={handleWelcomeComplete}
      />
      <KeyboardHelpDialog open={keyboardHelpOpen} onOpenChange={setKeyboardHelpOpen} />
      <CommandPalette
        open={commandPaletteOpen}
        onOpenChange={setCommandPaletteOpen}
        onNewSession={handleCreateSession}
        onNewFolder={() => handleCreateFolder(t("sidebar.newFolder"))}
        onToggleSidebar={() => setSidebarCollapsed((prev) => !prev)}
        onOpenSettings={() => setSettingsOpen(true)}
        onExportSession={() => currentSession && handleExportSession(currentSession.id, "markdown")}
        onShowHelp={() => setKeyboardHelpOpen(true)}
      />
      <div className="flex h-screen bg-background text-foreground">
      {/* 侧边栏 */}
      <SessionList
        sessions={sessions}
        folders={folders}
        currentSessionId={currentSession?.id || null}
        isLoading={isLoading}
        onSelectSession={selectSession}
        onCreateSession={handleCreateSession}
        onDeleteSession={handleDeleteSession}
        onExportSession={handleExportSession}
        onCreateFolder={handleCreateFolder}
        onDeleteFolder={handleDeleteFolder}
        onRenameFolder={handleRenameFolder}
        onMoveSession={handleMoveSessionToFolder}
        isCollapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
      />

      {/* 主内容区 */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* 顶部导航栏 */}
        <header
          className="flex items-center justify-between px-4 py-3 border-b border-border bg-background/50 backdrop-blur-sm"
          role="banner"
        >
          <div className="flex items-center gap-3">
            <h1 className="text-lg font-bold">HuluChat</h1>
            <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary">
              v{version}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Suspense fallback={null}>
              <SettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} />
            </Suspense>
            <LanguageSelector />
            <ThemeToggle />
          </div>
        </header>

        {/* 聊天区域 */}
        <main className="flex-1 min-h-0">
          <ChatView sessionId={currentSession?.id || null} />
        </main>
      </div>
    </div>
    </TooltipProvider>
  );
}

export default App;
