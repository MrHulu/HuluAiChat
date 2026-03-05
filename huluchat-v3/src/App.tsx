/**
 * HuluChat v3 - Main App
 * Tauri + React + FastAPI AI Chat Application
 */
import { useState, useEffect, useCallback, lazy, Suspense } from "react";
import { Toaster, toast } from "sonner";
import { ThemeToggle } from "@/components/theme-toggle";
import { ChatView } from "@/components/chat";
import { SessionList } from "@/components/sidebar";
import { UpdateNotification } from "@/components/UpdateNotification";
import { KeyboardHelpDialog } from "@/components/keyboard/KeyboardHelpDialog";
import { useSession, useKeyboardShortcuts, useFolders } from "@/hooks";
import { exportSession, moveSessionToFolder, ExportFormat } from "@/api/client";

// 懒加载设置对话框（非核心功能）
const SettingsDialog = lazy(() =>
  import("@/components/settings").then((mod) => ({ default: mod.SettingsDialog }))
);

function App() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [keyboardHelpOpen, setKeyboardHelpOpen] = useState(false);

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
    if (window.confirm("Are you sure you want to delete this conversation?")) {
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

      toast.success(`Exported as ${format.toUpperCase()}`);
    } catch (error) {
      console.error("Export failed:", error);
      toast.error("Failed to export session");
    }
  };

  // 创建文件夹
  const handleCreateFolder = async (name: string) => {
    const folder = await createFolder(name);
    if (folder) {
      toast.success(`Created folder "${name}"`);
    }
  };

  // 重命名文件夹
  const handleRenameFolder = async (id: string, name: string) => {
    const folder = await renameFolder(id, name);
    if (folder) {
      toast.success(`Renamed folder to "${name}"`);
    }
  };

  // 删除文件夹
  const handleDeleteFolder = async (id: string) => {
    const folder = folders.find((f) => f.id === id);
    if (!folder) return;

    if (window.confirm(`Delete folder "${folder.name}"? Sessions will be moved to uncategorized.`)) {
      await removeFolder(id);
      toast.success(`Deleted folder "${folder.name}"`);
    }
  };

  // 移动会话到文件夹
  const handleMoveSessionToFolder = async (sessionId: string, folderId: string | null) => {
    try {
      await moveSessionToFolder(sessionId, folderId);
      refreshSessions(); // 刷新会话列表
      const folderName = folderId
        ? folders.find((f) => f.id === folderId)?.name || "folder"
        : "uncategorized";
      toast.success(`Moved to ${folderName}`);
    } catch (error) {
      console.error("Failed to move session:", error);
      toast.error("Failed to move session");
    }
  };

  // 键盘快捷键
  useKeyboardShortcuts({
    onNewSession: handleCreateSession,
    onToggleSidebar: () => setSidebarCollapsed((prev) => !prev),
    onOpenSettings: () => setSettingsOpen(true),
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

  useEffect(() => {
    window.addEventListener("keydown", handleHelpKeyDown);
    return () => {
      window.removeEventListener("keydown", handleHelpKeyDown);
    };
  }, [handleHelpKeyDown]);

  return (
    <>
      <Toaster position="top-center" richColors closeButton />
      <UpdateNotification />
      <KeyboardHelpDialog open={keyboardHelpOpen} onOpenChange={setKeyboardHelpOpen} />
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
        <header className="flex items-center justify-between px-4 py-3 border-b border-border bg-background/50 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <h1 className="text-lg font-bold">HuluChat</h1>
            <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary">
              v3.11.0
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Suspense fallback={null}>
              <SettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} />
            </Suspense>
            <ThemeToggle />
          </div>
        </header>

        {/* 聊天区域 */}
        <main className="flex-1 min-h-0">
          <ChatView sessionId={currentSession?.id || null} />
        </main>
      </div>
    </div>
    </>
  );
}

export default App;
