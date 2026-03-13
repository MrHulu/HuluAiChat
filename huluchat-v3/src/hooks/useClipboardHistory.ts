/**
 * useClipboardHistory - Clipboard history management hook
 *
 * Records clipboard processing history locally (max 50 items)
 *
 * PRIVACY: All data stays local in localStorage, no analytics
 */

import { useState, useEffect, useCallback } from "react";

const STORAGE_KEY = "huluchat_clipboard_history";
const MAX_HISTORY_SIZE = 50;

export interface ClipboardHistoryItem {
  /** Unique ID */
  id: string;
  /** Original clipboard content */
  content: string;
  /** The action that was applied (e.g., "translate", "summarize") */
  action?: string;
  /** The AI response */
  response: string;
  /** Timestamp when processed */
  timestamp: number;
  /** Model used */
  model?: string;
}

interface UseClipboardHistoryReturn {
  /** List of history items (most recent first) */
  history: ClipboardHistoryItem[];
  /** Add a new item to history */
  addToHistory: (item: Omit<ClipboardHistoryItem, "id" | "timestamp">) => void;
  /** Remove an item from history */
  removeFromHistory: (id: string) => void;
  /** Clear all history */
  clearHistory: () => void;
  /** Get an item by ID */
  getItem: (id: string) => ClipboardHistoryItem | undefined;
  /** Whether history is empty */
  isEmpty: boolean;
  /** Number of items in history */
  count: number;
}

/**
 * Hook for managing clipboard processing history
 */
export function useClipboardHistory(): UseClipboardHistoryReturn {
  const [history, setHistory] = useState<ClipboardHistoryItem[]>([]);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as ClipboardHistoryItem[];
        // Validate and sort by timestamp (most recent first)
        const validItems = parsed
          .filter(
            (item) =>
              item.id &&
              item.content &&
              item.response &&
              typeof item.timestamp === "number"
          )
          .sort((a, b) => b.timestamp - a.timestamp);
        setHistory(validItems);
      }
    } catch (err) {
      console.debug("Failed to load clipboard history:", err);
    }
  }, []);

  // Save to localStorage whenever history changes
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
    } catch (err) {
      console.debug("Failed to save clipboard history:", err);
    }
  }, [history]);

  // Add new item to history
  const addToHistory = useCallback(
    (item: Omit<ClipboardHistoryItem, "id" | "timestamp">) => {
      const newItem: ClipboardHistoryItem = {
        ...item,
        id: `clip_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
        timestamp: Date.now(),
      };

      setHistory((prev) => {
        // Add new item at the beginning, limit to MAX_HISTORY_SIZE
        const newHistory = [newItem, ...prev].slice(0, MAX_HISTORY_SIZE);
        return newHistory;
      });
    },
    []
  );

  // Remove item from history
  const removeFromHistory = useCallback((id: string) => {
    setHistory((prev) => prev.filter((item) => item.id !== id));
  }, []);

  // Clear all history
  const clearHistory = useCallback(() => {
    setHistory([]);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  // Get item by ID
  const getItem = useCallback(
    (id: string): ClipboardHistoryItem | undefined => {
      return history.find((item) => item.id === id);
    },
    [history]
  );

  return {
    history,
    addToHistory,
    removeFromHistory,
    clearHistory,
    getItem,
    isEmpty: history.length === 0,
    count: history.length,
  };
}

export default useClipboardHistory;
