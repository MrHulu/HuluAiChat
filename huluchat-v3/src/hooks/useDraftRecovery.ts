/**
 * useDraftRecovery Hook
 * 草稿自动保存和恢复功能
 *
 * TASK-326: Context Recovery
 * - 每 30 秒自动保存当前输入内容
 * - 启动时检测未完成的草稿
 * - 最多保留 5 个可恢复会话
 * - 本地存储，无云同步
 */
import { useState, useEffect, useCallback, useRef } from "react";
import { ImageContent, FileAttachment } from "@/api/client";

// Storage key for drafts
const DRAFTS_STORAGE_KEY = "huluchat_drafts";
const MAX_DRAFTS = 5;
const SAVE_INTERVAL_MS = 30000; // 30 seconds

/**
 * Draft data structure
 */
export interface DraftData {
  /** Session ID */
  sessionId: string;
  /** Session title for display */
  sessionTitle?: string;
  /** Text content of the draft */
  content: string;
  /** Images attached to the draft */
  images?: ImageContent[];
  /** Files attached to the draft */
  files?: FileAttachment[];
  /** When the draft was saved */
  savedAt: string;
}

/**
 * Draft storage structure
 */
interface DraftStorage {
  drafts: DraftData[];
}

/**
 * Hook options
 */
export interface UseDraftRecoveryOptions {
  /** Current session ID */
  sessionId: string | null;
  /** Current session title */
  sessionTitle?: string;
  /** Enable auto-save (default: true) */
  enabled?: boolean;
  /** Custom save interval in ms (default: 30000) */
  saveInterval?: number;
}

/**
 * Hook return type
 */
export interface UseDraftRecoveryReturn {
  /** Drafts available for recovery */
  recoverableDrafts: DraftData[];
  /** Whether there's a draft for the current session */
  hasCurrentDraft: boolean;
  /** Draft for the current session (if any) */
  currentDraft: DraftData | null;
  /** Save draft manually */
  saveDraft: (content: string, images?: ImageContent[], files?: FileAttachment[]) => void;
  /** Recover a draft */
  recoverDraft: (sessionId: string) => DraftData | null;
  /** Dismiss a draft */
  dismissDraft: (sessionId: string) => void;
  /** Clear all drafts */
  clearAllDrafts: () => void;
  /** Check for recoverable drafts on startup */
  checkForDrafts: () => void;
}

/**
 * Load drafts from localStorage
 */
function loadDrafts(): DraftStorage {
  try {
    const stored = localStorage.getItem(DRAFTS_STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored) as DraftStorage;
      return parsed;
    }
  } catch (error) {
    console.error("Failed to load drafts:", error);
  }
  return { drafts: [] };
}

/**
 * Save drafts to localStorage
 */
function saveDraftsToStorage(drafts: DraftData[]): void {
  try {
    localStorage.setItem(DRAFTS_STORAGE_KEY, JSON.stringify({ drafts }));
  } catch (error) {
    console.error("Failed to save drafts:", error);
  }
}

/**
 * Clean up old drafts, keeping only the most recent MAX_DRAFTS
 */
function cleanupDrafts(drafts: DraftData[]): DraftData[] {
  if (drafts.length <= MAX_DRAFTS) {
    return drafts;
  }
  // Sort by savedAt descending and keep the most recent
  return drafts
    .sort((a, b) => new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime())
    .slice(0, MAX_DRAFTS);
}

/**
 * Hook for draft recovery functionality
 */
export function useDraftRecovery(options: UseDraftRecoveryOptions): UseDraftRecoveryReturn {
  const {
    sessionId,
    sessionTitle,
    enabled = true,
    saveInterval = SAVE_INTERVAL_MS,
  } = options;

  const [recoverableDrafts, setRecoverableDrafts] = useState<DraftData[]>([]);
  const [currentDraft, setCurrentDraft] = useState<DraftData | null>(null);

  // Use refs to track current input state for auto-save
  const contentRef = useRef<string>("");
  const imagesRef = useRef<ImageContent[]>([]);
  const filesRef = useRef<FileAttachment[]>([]);
  const lastSaveTimeRef = useRef<number>(Date.now());

  /**
   * Check for drafts for a specific session
   */
  const checkForCurrentDraft = useCallback((sid: string | null) => {
    if (!sid) {
      setCurrentDraft(null);
      return;
    }

    const storage = loadDrafts();
    const draft = storage.drafts.find(d => d.sessionId === sid);
    setCurrentDraft(draft || null);
  }, []);

  /**
   * Check for all recoverable drafts
   */
  const checkForDrafts = useCallback(() => {
    const storage = loadDrafts();
    // Filter out drafts with empty content and no attachments
    const validDrafts = storage.drafts.filter(
      d => d.content.trim() || (d.images?.length ?? 0) > 0 || (d.files?.length ?? 0) > 0
    );
    setRecoverableDrafts(validDrafts);
  }, []);

  /**
   * Save draft manually or via auto-save
   */
  const saveDraft = useCallback((
    content: string,
    images?: ImageContent[],
    files?: FileAttachment[]
  ) => {
    if (!sessionId || !enabled) return;

    // Don't save empty drafts
    if (!content.trim() && (!images?.length) && (!files?.length)) {
      return;
    }

    const storage = loadDrafts();

    // Create new draft
    const newDraft: DraftData = {
      sessionId,
      sessionTitle,
      content,
      images,
      files,
      savedAt: new Date().toISOString(),
    };

    // Update or add draft
    const existingIndex = storage.drafts.findIndex(d => d.sessionId === sessionId);
    if (existingIndex >= 0) {
      storage.drafts[existingIndex] = newDraft;
    } else {
      storage.drafts.push(newDraft);
    }

    // Cleanup and save
    storage.drafts = cleanupDrafts(storage.drafts);
    saveDraftsToStorage(storage.drafts);

    // Update state
    setCurrentDraft(newDraft);
    // Also update recoverableDrafts to keep them in sync
    setRecoverableDrafts(storage.drafts.filter(
      d => d.content.trim() || (d.images?.length ?? 0) > 0 || (d.files?.length ?? 0) > 0
    ));
    lastSaveTimeRef.current = Date.now();
  }, [sessionId, sessionTitle, enabled]);

  /**
   * Recover a draft by session ID
   */
  const recoverDraft = useCallback((targetSessionId: string): DraftData | null => {
    const storage = loadDrafts();
    const draft = storage.drafts.find(d => d.sessionId === targetSessionId);
    return draft || null;
  }, []);

  /**
   * Dismiss a draft (remove from storage)
   */
  const dismissDraft = useCallback((targetSessionId: string) => {
    const storage = loadDrafts();
    storage.drafts = storage.drafts.filter(d => d.sessionId !== targetSessionId);
    saveDraftsToStorage(storage.drafts);

    // Update state
    setRecoverableDrafts(storage.drafts);
    if (targetSessionId === sessionId) {
      setCurrentDraft(null);
    }
  }, [sessionId]);

  /**
   * Clear all drafts
   */
  const clearAllDrafts = useCallback(() => {
    localStorage.removeItem(DRAFTS_STORAGE_KEY);
    setRecoverableDrafts([]);
    setCurrentDraft(null);
  }, []);

  /**
   * Update refs when input changes (for external use)
   */
  const updateInputState = useCallback((
    content: string,
    images?: ImageContent[],
    files?: FileAttachment[]
  ) => {
    contentRef.current = content;
    imagesRef.current = images || [];
    filesRef.current = files || [];
  }, []);

  // Auto-save effect
  useEffect(() => {
    if (!enabled || !sessionId) return;

    const autoSave = () => {
      const content = contentRef.current;
      const images = imagesRef.current;
      const files = filesRef.current;

      // Only save if there's content and enough time has passed
      if (content.trim() || images.length > 0 || files.length > 0) {
        saveDraft(content, images.length > 0 ? images : undefined, files.length > 0 ? files : undefined);
      }
    };

    const intervalId = setInterval(autoSave, saveInterval);

    return () => {
      clearInterval(intervalId);
    };
  }, [enabled, sessionId, saveInterval, saveDraft]);

  // Check for current draft when session changes
  useEffect(() => {
    checkForCurrentDraft(sessionId);
  }, [sessionId, checkForCurrentDraft]);

  // Check for recoverable drafts on mount
  useEffect(() => {
    checkForDrafts();
  }, [checkForDrafts]);

  // Expose updateInputState through the hook
  (useDraftRecovery as unknown as Record<string, unknown>)._updateInputState = updateInputState;

  return {
    recoverableDrafts,
    hasCurrentDraft: currentDraft !== null,
    currentDraft,
    saveDraft,
    recoverDraft,
    dismissDraft,
    clearAllDrafts,
    checkForDrafts,
  };
}

/**
 * Helper to update input state for auto-save
 * Call this from ChatInput when content changes
 */
export function updateDraftInputState(
  content: string,
  images?: ImageContent[],
  files?: FileAttachment[]
): void {
  const hook = useDraftRecovery as unknown as Record<string, unknown>;
  if (typeof hook._updateInputState === "function") {
    hook._updateInputState(content, images, files);
  }
}
