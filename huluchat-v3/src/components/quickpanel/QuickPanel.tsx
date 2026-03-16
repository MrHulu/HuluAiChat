/**
 * QuickPanel - Floating Quick Question Panel
 *
 * A small floating window for quick AI questions
 * Triggered by global shortcut (Ctrl+Shift+Space / Cmd+Shift+Space)
 *
 * PRIVACY: All data stays local, no analytics
 */
import { useState, useEffect, useRef, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { Send, X, Loader2, Copy, Check, Clipboard, Settings, History } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useModel, useWebSocket, useClipboardHistory } from "@/hooks";
import { createSession, getChatWebSocketUrl } from "@/api/client";
import { toast } from "sonner";
import { QuickActions } from "./QuickActions";
import { ClipboardHistoryPanel } from "./ClipboardHistoryPanel";
import {
  loadQuickActions,
  type QuickAction,
  processPromptTemplate,
  DEFAULT_TARGET_LANGUAGE,
} from "@/data/quickActions";

// WebSocket message type for QuickPanel
interface QuickWSMessage {
  type: "stream_start" | "stream_chunk" | "stream_end" | "error";
  content?: string;
  message_id?: string;
  error?: string;
}

// LocalStorage key for persisting QuickPanel session ID
const QUICKPANEL_SESSION_KEY = "huluchat-quickpanel-session-id";

interface QuickPanelProps {
  /** Whether the panel is visible */
  isOpen: boolean;
  /** Callback when panel should close */
  onClose: () => void;
  /** Optional initial text (e.g., from clipboard) */
  initialText?: string;
  /** Callback to open settings for managing Quick Actions */
  onOpenSettings?: () => void;
  /** Callback when conversation happens - for toast notification */
  onHasConversation?: (hasConversation: boolean) => void;
}

/**
 * QuickPanel Component
 *
 * A compact floating panel for quick AI interactions
 */
export function QuickPanel({
  isOpen,
  onClose,
  initialText = "",
  onOpenSettings,
  onHasConversation,
}: QuickPanelProps) {
  const { t } = useTranslation();
  const [input, setInput] = useState(initialText);
  const [response, setResponse] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Restore sessionId from localStorage to avoid creating empty sessions on every open
  const [sessionId, setSessionId] = useState<string | null>(() => {
    try {
      return localStorage.getItem(QUICKPANEL_SESSION_KEY);
    } catch {
      return null;
    }
  });
  const [quickActions, setQuickActions] = useState<QuickAction[]>([]);
  const [clipboardDetected, setClipboardDetected] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  const inputRef = useRef<HTMLTextAreaElement>(null);
  const responseRef = useRef("");
  const lastInputRef = useRef("");
  const lastActionRef = useRef<string | undefined>(undefined);
  const { currentModel, setModel, models } = useModel();
  const { history, addToHistory, removeFromHistory, clearHistory } = useClipboardHistory();

  // Load Quick Actions on mount
  useEffect(() => {
    setQuickActions(loadQuickActions());
  }, []);

  // Create WebSocket URL when session is available
  const wsUrl = sessionId ? getChatWebSocketUrl(sessionId) : "";

  // Handle WebSocket messages
  const handleWSMessage = useCallback((data: unknown) => {
    const msg = data as QuickWSMessage;

    switch (msg.type) {
      case "stream_start":
        setIsLoading(true);
        responseRef.current = "";
        setResponse("");
        break;

      case "stream_chunk":
        if (msg.content) {
          responseRef.current += msg.content;
          setResponse(responseRef.current);
        }
        break;

      case "stream_end":
        setIsLoading(false);
        // Notify parent that conversation happened
        onHasConversation?.(true);
        // Add to clipboard history
        if (lastInputRef.current && responseRef.current) {
          addToHistory({
            content: lastInputRef.current,
            action: lastActionRef.current,
            response: responseRef.current,
            model: currentModel,
          });
        }
        // Reset refs
        lastInputRef.current = "";
        lastActionRef.current = undefined;
        break;

      case "error":
        setIsLoading(false);
        setError(msg.error || "Unknown error");
        toast.error(t("quickPanel.sendError"));
        // Reset refs on error
        lastInputRef.current = "";
        lastActionRef.current = undefined;
        // If session not found, clear the persisted session ID so a new one will be created next time
        if (msg.error?.includes("not found") || msg.error?.includes("Session")) {
          try {
            localStorage.removeItem(QUICKPANEL_SESSION_KEY);
          } catch {
            // Ignore localStorage errors
          }
          setSessionId(null);
        }
        break;
    }
  }, [t, onHasConversation, addToHistory, currentModel]);

  // Use WebSocket hook for real-time communication
  const { status: connectionStatus, send } = useWebSocket({
    url: wsUrl,
    onMessage: handleWSMessage,
    reconnectAttempts: 3,
    baseDelay: 1000,
  });

  // Create or reuse a session when panel opens
  useEffect(() => {
    if (isOpen && !sessionId) {
      // Try to reuse existing session from localStorage first
      const existingSessionId = localStorage.getItem(QUICKPANEL_SESSION_KEY);
      if (existingSessionId) {
        // Verify session still exists by checking if we can connect to it
        // For simplicity, we just reuse it - if invalid, WebSocket will fail and clear it
        setSessionId(existingSessionId);
        return;
      }

      // No existing session, create new one
      createSession("quickpanel")
        .then((session) => {
          setSessionId(session.id);
          // Persist session ID for reuse
          try {
            localStorage.setItem(QUICKPANEL_SESSION_KEY, session.id);
          } catch {
            // Ignore localStorage errors
          }
        })
        .catch((err) => {
          console.error("Failed to create quick session:", err);
          setError("Failed to initialize");
        });
    }
  }, [isOpen, sessionId]);

  // Detect clipboard content when panel opens
  useEffect(() => {
    if (isOpen && !initialText) {
      detectClipboardContent();
    }
  }, [isOpen, initialText]);

  // Focus input when panel opens
  useEffect(() => {
    if (isOpen) {
      setInput(initialText);
      setResponse("");
      setError(null);
      setCopied(false);
      setClipboardDetected(false);
      responseRef.current = "";
      // Small delay to ensure panel is visible before focusing
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [isOpen, initialText]);

  // Handle Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Detect clipboard content (async)
  const detectClipboardContent = async () => {
    try {
      // Use Tauri clipboard plugin if available
      const { readText } = await import("@tauri-apps/plugin-clipboard-manager");
      const clipboardText = await readText();

      if (clipboardText && clipboardText.trim().length > 0) {
        setInput(clipboardText.trim());
        setClipboardDetected(true);
        toast.success(t("quickPanel.clipboardDetected"));
      }
    } catch (err) {
      // Clipboard plugin not available or no content
      console.debug("Clipboard detection skipped:", err);
    }
  };

  // Handle send message
  const handleSend = useCallback(async () => {
    if (!input.trim() || isLoading || connectionStatus !== "connected") return;

    // Store last input for history
    lastInputRef.current = input.trim();
    lastActionRef.current = undefined;

    setIsLoading(true);
    setError(null);
    setResponse("");
    responseRef.current = "";

    // Send message via WebSocket
    send({
      type: "message",
      content: input.trim(),
      model: currentModel,
    });
  }, [input, isLoading, connectionStatus, currentModel, send]);

  // Handle Quick Action selection
  const handleActionSelect = useCallback((action: QuickAction) => {
    const currentText = input.trim();
    if (!currentText) return;

    // Process the prompt template with the current text
    const processedPrompt = processPromptTemplate(action.promptTemplate, {
      text: currentText,
      target_language: DEFAULT_TARGET_LANGUAGE,
    });

    setInput(processedPrompt);

    // Store for history - use the original content, not the processed prompt
    lastInputRef.current = currentText;
    lastActionRef.current = t(action.nameKey);

    // Auto-send after applying action
    setTimeout(() => {
      if (connectionStatus === "connected") {
        setIsLoading(true);
        setError(null);
        setResponse("");
        responseRef.current = "";

        send({
          type: "message",
          content: processedPrompt,
          model: currentModel,
        });
      }
    }, 100);
  }, [input, connectionStatus, currentModel, send, t]);

  // Handle Enter key (send on Enter, new line on Shift+Enter)
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Copy response to clipboard
  const handleCopy = async () => {
    if (!response) return;

    try {
      // Try Tauri clipboard first, fallback to web API
      try {
        const { writeText } = await import("@tauri-apps/plugin-clipboard-manager");
        await writeText(response);
      } catch {
        await navigator.clipboard.writeText(response);
      }
      setCopied(true);
      toast.success(t("quickPanel.copied"));
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error(t("quickPanel.copyFailed"));
    }
  };

  // Paste from clipboard
  const handlePaste = async () => {
    try {
      const { readText } = await import("@tauri-apps/plugin-clipboard-manager");
      const clipboardText = await readText();
      if (clipboardText) {
        setInput(clipboardText);
        setClipboardDetected(true);
      }
    } catch {
      // Fallback to default paste behavior
      document.execCommand("paste");
    }
  };

  // Clear input
  const handleClear = () => {
    setInput("");
    setResponse("");
    setError(null);
    setCopied(false);
    setClipboardDetected(false);
    setShowHistory(false);
    responseRef.current = "";
    inputRef.current?.focus();
  };

  // Handle reusing history content
  const handleReuseContent = useCallback((content: string) => {
    setInput(content);
    setClipboardDetected(false);
    setShowHistory(false);
    setTimeout(() => inputRef.current?.focus(), 100);
  }, []);

  if (!isOpen) return null;

  return (
    <div
      role="presentation"
      className={cn(
        "fixed inset-0 z-50 flex items-start justify-center pt-[10vh]",
        "animate-in fade-in-0 duration-200"
      )}
      onClick={(e) => {
        // Close when clicking outside the panel
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        className={cn(
          "w-[400px] max-h-[550px] rounded-xl shadow-2xl",
          "bg-background/95 backdrop-blur-xl border border-border/50",
          "animate-in slide-in-from-top-4 duration-200",
          "flex flex-col overflow-hidden"
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border/50">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">{t("quickPanel.title")}</span>
            {/* Model selector */}
            <select
              value={currentModel}
              onChange={(e) => setModel(e.target.value)}
              className="text-xs bg-muted/50 border border-border/50 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-primary/50"
            >
              {models.map((model) => (
                <option key={model.id} value={model.id}>
                  {model.name}
                </option>
              ))}
            </select>
            {/* Connection status indicator */}
            {connectionStatus !== "connected" && (
              <span className="text-xs text-muted-foreground">
                {connectionStatus === "connecting" ? "..." : "!"}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant={showHistory ? "secondary" : "ghost"}
              size="icon-xs"
              onClick={() => setShowHistory(!showHistory)}
              className={cn(
                "text-muted-foreground hover:text-foreground",
                showHistory && "text-primary"
              )}
              aria-label={t("clipboardHistory.title", { count: history.length })}
            >
              <History className="h-4 w-4" />
            </Button>
            {onOpenSettings && (
              <Button
                variant="ghost"
                size="icon-xs"
                onClick={onOpenSettings}
                className="text-muted-foreground hover:text-foreground"
                aria-label={t("quickPanel.settings")}
              >
                <Settings className="h-4 w-4" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon-xs"
              onClick={onClose}
              className="text-muted-foreground hover:text-foreground"
              aria-label={t("quickPanel.close")}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* History panel or main content */}
        {showHistory ? (
          <ClipboardHistoryPanel
            history={history}
            onRemove={removeFromHistory}
            onClear={clearHistory}
            onReuseContent={handleReuseContent}
            compact
          />
        ) : (
          <>
            {/* Quick Actions bar */}
            <div className="px-3 py-2 border-b border-border/50 bg-muted/20">
              <div className="flex items-center justify-between gap-2">
                <QuickActions
                  actions={quickActions}
                  onActionSelect={handleActionSelect}
                  disabled={isLoading || !input.trim()}
                  compact
                />
                <Button
                  variant="ghost"
                  size="icon-xs"
                  onClick={handlePaste}
                  disabled={isLoading}
                  className="text-muted-foreground hover:text-foreground shrink-0"
                  aria-label={t("quickPanel.pasteFromClipboard")}
                >
                  <Clipboard className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>

            {/* Input area */}
            <div className="p-3 border-b border-border/50">
              <div className="relative">
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={t("quickPanel.placeholder")}
                  className={cn(
                    "w-full min-h-[60px] max-h-[120px] p-2 text-sm",
                    "bg-muted/30 border border-border/50 rounded-lg",
                    "placeholder:text-muted-foreground",
                    "focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50",
                    "resize-none",
                    clipboardDetected && "ring-1 ring-primary/30"
                  )}
                  rows={2}
                  disabled={isLoading}
                />
                {clipboardDetected && (
                  <span className="absolute top-1 right-2 text-[10px] text-primary/70">
                    {t("quickPanel.fromClipboard")}
                  </span>
                )}
              </div>
              <div className="flex items-center justify-between mt-2">
                <span className="text-xs text-muted-foreground">
                  {t("quickPanel.hint")}
                </span>
                <div className="flex gap-2">
                  {input && (
                    <Button
                      variant="ghost"
                      size="xs"
                      onClick={handleClear}
                      disabled={isLoading}
                    >
                      {t("quickPanel.clear")}
                    </Button>
                  )}
                  <Button
                    size="xs"
                    onClick={handleSend}
                    disabled={!input.trim() || isLoading || connectionStatus !== "connected"}
                  >
                    {isLoading ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <Send className="h-3 w-3" />
                    )}
                    <span className="ml-1">{t("quickPanel.send")}</span>
                  </Button>
                </div>
              </div>
            </div>

            {/* Response area */}
            <div className="flex-1 overflow-auto p-3 min-h-[80px] max-h-[250px]">
              {error ? (
                <div className="text-sm text-destructive p-2 bg-destructive/10 rounded-lg">
                  {error}
                </div>
              ) : response ? (
                <div className="text-sm whitespace-pre-wrap">
                  {response}
                </div>
              ) : isLoading ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                  <span className="ml-2 text-sm text-muted-foreground">
                    {t("quickPanel.thinking")}
                  </span>
                </div>
              ) : (
                <div className="text-sm text-muted-foreground text-center py-4">
                  {t("quickPanel.emptyResponse")}
                </div>
              )}
            </div>

            {/* Footer with copy button */}
            {response && (
              <div className="flex justify-end p-3 border-t border-border/50">
                <Button
                  variant="outline"
                  size="xs"
                  onClick={handleCopy}
                >
                  {copied ? (
                    <Check className="h-3 w-3 text-green-500" />
                  ) : (
                    <Copy className="h-3 w-3" />
                  )}
                  <span className="ml-1">
                    {copied ? t("quickPanel.copied") : t("quickPanel.copy")}
                  </span>
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default QuickPanel;
