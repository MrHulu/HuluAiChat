/**
 * HuluChat v3 - Main App
 * Tauri + React + FastAPI AI Chat Application
 */
import { useState, useEffect, useCallback, useRef, lazy, Suspense } from "react";
import { Toaster, toast } from "sonner";
import { useTranslation } from "react-i18next";
import { ThemeToggle } from "@/components/theme-toggle";
import { ChatView, type ChatViewRef } from "@/components/chat";
import { SessionList, type SessionListRef } from "@/components/sidebar";
import { UpdateNotification } from "@/components/UpdateNotification";
import { KeyboardHelpDialog } from "@/components/keyboard/KeyboardHelpDialog";
import { LanguageSelector } from "@/components/LanguageSelector";
import { CommandPalette } from "@/components/command";
import { KnowledgeCenter } from "@/components/knowledge";
import { WelcomeDialog } from "@/components/WelcomeDialog";
import { FeatureDiscoveryTip } from "@/components/FeatureDiscoveryTip";
import { ContextualTip } from "@/components/ContextualTip";
import { BookmarkJumpDialog } from "@/components/bookmark";
import { PermissionGuideDialog } from "@/components/permission";
import { QuickPanel } from "@/components/quickpanel";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ErrorBoundary } from "@/components/ui/error-boundary";
import { useSession, useKeyboardShortcuts, useFolders, useFeatureDiscovery, useContextualTip, useModel, useBackendHealth, useGlobalShortcut, useAccessibilityPermission } from "@/hooks";
import { BackendStatusIndicator } from "@/components/BackendStatusIndicator";
import { exportSession, moveSessionToFolder, updateSettings, ExportFormat } from "@/api/client";
import { getAPIKey } from "@/services/keyring";

// Import version from package.json for dynamic version display
import { version } from "../package.json";

// Migration flag stored in localStorage
const API_KEY_MIGRATED_KEY = "huluchat-api-key-migrated-v2";

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
  const [knowledgeCenterOpen, setKnowledgeCenterOpen] = useState(false);
  const [bookmarkJumpOpen, setBookmarkJumpOpen] = useState(false);
  const [quickPanelOpen, setQuickPanelOpen] = useState(false);
  const [hasQuickPanelConversation, setHasQuickPanelConversation] = useState(false);
  const sessionListRef = useRef<SessionListRef>(null);
  const chatViewRef = useRef<ChatViewRef>(null);

  // Welcome dialog state - check if first time user
  const [welcomeOpen, setWelcomeOpen] = useState(() => {
    const hasSeenWelcome = localStorage.getItem(WELCOME_SHOWN_KEY);
    return !hasSeenWelcome;
  });

  // Accessibility permission hook - for macOS global shortcuts
  const {
    status: permissionStatus,
    showGuide: showPermissionGuide,
    openSettings: openAccessibilitySettings,
    checkPermission: recheckPermission,
    dismissGuide: dismissPermissionGuide,
    dismissPermanently: dismissPermissionPermanently,
  } = useAccessibilityPermission();

  // Global shortcut hook - for quick summon (Ctrl+Shift+Space)
  useGlobalShortcut(
    {
      id: "quick-summon",
      shortcut: "CommandOrControl+Shift+Space",
      handler: () => {
        // Only show QuickPanel if permission is granted or not required
        if (permissionStatus === "granted") {
          setQuickPanelOpen(true);
        }
      },
      description: "Quick summon HuluChat from anywhere",
    },
    {
      enabled: permissionStatus === "granted",
      onError: (error) => {
        console.error("Global shortcut error:", error);
        // Show toast with guidance
        if (error.message.includes("permission") || error.message.includes("denied")) {
          toast.warning(t("globalShortcut.permissionRequired"), {
            action: {
              label: t("globalShortcut.openSettings"),
              onClick: () => openAccessibilitySettings(),
            },
          });
        }
      },
    }
  );

  // Feature discovery hook
  const {
    currentTip,
    markFeatureUsed,
    dismissCurrentTip,
    disableTips,
  } = useFeatureDiscovery();

  const {
    sessions,
    currentSession,
    isLoading: isSessionLoading,
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

  // Model hook for contextual tips
  const { currentModel, models } = useModel();

  // Contextual tip hook - detects current state for smart tips
  const {
    currentTip: contextualTip,
    dismissTip: dismissContextualTip,
    disableAllTips: disableAllContextualTips,
  } = useContextualTip({
    sessionId: currentSession?.id || null,
    messageCount: 0, // Will be updated by ChatView if needed
    isLoading: isSessionLoading,
    currentModel,
    modelCount: models.length,
    settingsLoaded: true,
  });

  // Backend health monitoring hook
  const {
    status: backendStatus,
    version: backendVersion,
    isRecovering,
    lastChecked,
    triggerRecovery,
  } = useBackendHealth({
    interval: 30000, // Check every 30 seconds
    failureThreshold: 3,
  });

  const handleWelcomeComplete = () => {
    localStorage.setItem(WELCOME_SHOWN_KEY, "true");
  };

  // Initialize API key from keyring on app startup
  // This ensures the backend has the API key for the current session
  useEffect(() => {
    const initializeAPIKeyFromKeyring = async () => {
      try {
        // Check if we've already done migration
        const migrated = localStorage.getItem(API_KEY_MIGRATED_KEY);

        // Load API key from keyring and send to backend
        // Only load openai provider's key as the main API key
        const apiKey = await getAPIKey("openai");
        if (apiKey) {
          // Send to backend for immediate use (backend stores only in memory)
          await updateSettings({ openai_api_key: apiKey });
          console.log("Loaded openai API key from keyring");
        }

        // Mark migration as complete
        if (!migrated) {
          localStorage.setItem(API_KEY_MIGRATED_KEY, "true");
        }
      } catch (error) {
        console.warn("Failed to initialize API key from keyring:", error);
      }
    };

    initializeAPIKeyFromKeyring();
  }, []);

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
    markFeatureUsed("session-export");
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
    markFeatureUsed("folder-management");
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
      markFeatureUsed("command-palette");
    }
  }, [markFeatureUsed]);

  // / 键聚焦搜索框（不在输入框中时）
  const handleSearchFocusKeyDown = useCallback((event: KeyboardEvent) => {
    if (event.key === "/") {
      const target = event.target as HTMLElement;
      const isInputFocused =
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable;

      if (!isInputFocused && !sidebarCollapsed) {
        event.preventDefault();
        sessionListRef.current?.focusSearch();
      }
    }
  }, [sidebarCollapsed]);

  useEffect(() => {
    window.addEventListener("keydown", handleHelpKeyDown);
    window.addEventListener("keydown", handleCommandPaletteKeyDown);
    window.addEventListener("keydown", handleSearchFocusKeyDown);
    return () => {
      window.removeEventListener("keydown", handleHelpKeyDown);
      window.removeEventListener("keydown", handleCommandPaletteKeyDown);
      window.removeEventListener("keydown", handleSearchFocusKeyDown);
    };
  }, [handleHelpKeyDown, handleCommandPaletteKeyDown, handleSearchFocusKeyDown]);

  return (
    <TooltipProvider>
      <Toaster
        position="top-center"
        richColors
        closeButton
        toastOptions={{
          classNames: {
            toast: "animate-slide-down",
            success: "animate-success",
            error: "animate-shake-subtle",
          },
        }}
      />
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
        onOpenKnowledgeCenter={() => {
          setKnowledgeCenterOpen(true);
          markFeatureUsed("knowledge-center");
        }}
        onJumpToBookmark={() => setBookmarkJumpOpen(true)}
      />
      <KnowledgeCenter
        open={knowledgeCenterOpen}
        onOpenChange={setKnowledgeCenterOpen}
      />
      <BookmarkJumpDialog
        open={bookmarkJumpOpen}
        onOpenChange={setBookmarkJumpOpen}
        onJumpToBookmark={(sessionId, messageId) => {
          // Switch to the session first
          selectSession(sessionId);
          // Then scroll to the message (with a small delay to allow session switch)
          setTimeout(() => {
            chatViewRef.current?.scrollToMessage(messageId);
          }, 100);
        }}
      />
      {/* Permission Guide Dialog - macOS Accessibility Permission */}
      <PermissionGuideDialog
        open={showPermissionGuide}
        onOpenChange={(open) => {
          if (!open) {
            dismissPermissionGuide();
          }
        }}
        status={permissionStatus}
        onOpenSettings={openAccessibilitySettings}
        onDismiss={dismissPermissionGuide}
        onDismissPermanently={dismissPermissionPermanently}
        onRecheck={recheckPermission}
      />
      {/* Quick Panel - Floating quick question panel */}
      <QuickPanel
        isOpen={quickPanelOpen}
        onClose={() => {
          setQuickPanelOpen(false);
          // Show toast if there was a conversation
          if (hasQuickPanelConversation) {
            toast.success(t("quickPanel.savedToQuickChats"));
          }
        }}
        onOpenSettings={() => setSettingsOpen(true)}
        onHasConversation={setHasQuickPanelConversation}
      />
      <div className="flex h-screen bg-background text-foreground">
      {/* Skip to main content link - Accessibility enhancement */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[100] focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-md focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
      >
        {t("accessibility.skipToMain")}
      </a>
      {/* 侧边栏 */}
      <SessionList
        ref={sessionListRef}
        sessions={sessions}
        folders={folders}
        currentSessionId={currentSession?.id || null}
        isLoading={isSessionLoading}
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
          className="flex items-center justify-between px-4 py-3 border-b border-border bg-background/50 dark:bg-background/80 dark:backdrop-blur-md dark:shadow-[0_4px_24px_-8px_rgba(0,0,0,0.4)] backdrop-blur-sm"
          role="banner"
        >
          <div className="flex items-center gap-3">
            <h1 className="text-lg font-bold dark:text-foreground/95">HuluChat</h1>
            <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium dark:bg-primary/20 dark:text-primary dark:shadow-[0_0_12px_rgba(var(--primary),0.15)] dark:border dark:border-primary/20">
              v{version}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <BackendStatusIndicator
              status={backendStatus}
              version={backendVersion}
              isRecovering={isRecovering}
              lastChecked={lastChecked}
              onRetry={triggerRecovery}
              compact={true}
            />
            <Suspense fallback={null}>
              <SettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} />
            </Suspense>
            <LanguageSelector />
            <ThemeToggle />
          </div>
        </header>

        {/* 聊天区域 */}
        <main id="main-content" className="flex-1 min-h-0" tabIndex={-1}>
          <ErrorBoundary>
            <ChatView
              ref={chatViewRef}
              sessionId={currentSession?.id || null}
              onSessionUpdated={refreshSessions}
            />
          </ErrorBoundary>
        </main>

        {/* Contextual tip - 优先显示（基于当前状态） */}
        {!welcomeOpen && contextualTip && (
          <div className="p-4 border-t border-border bg-muted/30">
            <ContextualTip
              tip={contextualTip}
              onDismiss={dismissContextualTip}
              onDisableAll={disableAllContextualTips}
              onAction={() => {
                // 根据提示类型执行相应操作
                switch (contextualTip.id) {
                  case "no-api-key":
                  case "no-model":
                  case "settings-incomplete":
                    setSettingsOpen(true);
                    break;
                  case "empty-session":
                    // Focus on input - this will be handled by ChatView
                    break;
                  case "first-visit":
                    // Show welcome dialog
                    setWelcomeOpen(true);
                    break;
                }
              }}
            />
          </div>
        )}

        {/* 功能发现提示 - 仅在欢迎流程完成后且没有上下文提示时显示 */}
        {!welcomeOpen && !contextualTip && currentTip && (
          <div className="p-4 border-t border-border bg-muted/30">
            <FeatureDiscoveryTip
              feature={currentTip}
              onDismiss={dismissCurrentTip}
              onDisableAll={disableTips}
              onAction={() => {
                // 根据功能类型执行相应操作
                switch (currentTip.id) {
                  case "command-palette":
                    setCommandPaletteOpen(true);
                    break;
                  case "knowledge-center":
                    setKnowledgeCenterOpen(true);
                    break;
                  case "session-export":
                    if (currentSession) {
                      handleExportSession(currentSession.id, "markdown");
                    }
                    break;
                  case "folder-management":
                    handleCreateFolder(t("sidebar.newFolder"));
                    break;
                  case "model-switch":
                    setSettingsOpen(true);
                    break;
                }
              }}
            />
          </div>
        )}
      </div>
    </div>
    </TooltipProvider>
  );
}

export default App;
