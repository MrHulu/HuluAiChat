/**
 * HuluChat v3 - Main App
 * Tauri + React + FastAPI AI Chat Application
 */
import { useState, useEffect, lazy, Suspense } from "react";
import { Toaster, toast } from "sonner";
import { ThemeToggle } from "@/components/theme-toggle";
import { ChatView } from "@/components/chat";
import { SessionList } from "@/components/sidebar";
import { UpdateNotification } from "@/components/UpdateNotification";
import { useSession, useKeyboardShortcuts } from "@/hooks";

// 懒加载设置对话框（非核心功能）
const SettingsDialog = lazy(() =>
  import("@/components/settings").then((mod) => ({ default: mod.SettingsDialog }))
);

function App() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const {
    sessions,
    currentSession,
    isLoading,
    error,
    selectSession,
    createNewSession,
    removeSession,
  } = useSession();

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

  // 键盘快捷键
  useKeyboardShortcuts({
    onNewSession: handleCreateSession,
    onToggleSidebar: () => setSidebarCollapsed((prev) => !prev),
    onOpenSettings: () => setSettingsOpen(true),
  });

  return (
    <>
      <Toaster position="top-center" richColors closeButton />
      <UpdateNotification />
      <div className="flex h-screen bg-background text-foreground">
      {/* 侧边栏 */}
      <SessionList
        sessions={sessions}
        currentSessionId={currentSession?.id || null}
        isLoading={isLoading}
        onSelectSession={selectSession}
        onCreateSession={handleCreateSession}
        onDeleteSession={handleDeleteSession}
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
              v3.1.0
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
