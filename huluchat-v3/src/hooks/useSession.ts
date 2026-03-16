/**
 * useSession Hook
 * 会话管理逻辑（支持分页）
 */
import { useState, useCallback, useEffect } from "react";
import { Session, listSessions, createSession, deleteSession, getSession, SessionListResponse } from "@/api/client";

export interface UseSessionReturn {
  sessions: Session[];
  currentSession: Session | null;
  isLoading: boolean;
  error: string | null;
  hasMore: boolean;
  total: number;
  selectSession: (id: string) => void;
  createNewSession: () => Promise<Session | null>;
  removeSession: (id: string) => Promise<void>;
  refreshSessions: () => Promise<void>;
  loadMoreSessions: () => Promise<void>;
}

const DEFAULT_PAGE_SIZE = 50;

export function useSession(): UseSessionReturn {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [currentSession, setCurrentSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [total, setTotal] = useState(0);

  const refreshSessions = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data: SessionListResponse = await listSessions({ limit: DEFAULT_PAGE_SIZE, offset: 0 });
      setSessions(data.sessions);
      setHasMore(data.has_more);
      setTotal(data.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load sessions");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loadMoreSessions = useCallback(async () => {
    if (isLoading || !hasMore) return;

    setIsLoading(true);
    setError(null);
    try {
      const data: SessionListResponse = await listSessions({
        limit: DEFAULT_PAGE_SIZE,
        offset: sessions.length
      });
      setSessions((prev) => [...prev, ...data.sessions]);
      setHasMore(data.has_more);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load more sessions");
    } finally {
      setIsLoading(false);
    }
  }, [sessions.length, hasMore, isLoading]);

  const selectSession = useCallback(async (id: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const session = await getSession(id);
      setCurrentSession(session);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load session");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createNewSession = useCallback(async (): Promise<Session | null> => {
    setIsLoading(true);
    setError(null);
    try {
      const session = await createSession();
      setSessions((prev) => [session, ...prev]);
      setCurrentSession(session);
      return session;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create session");
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const removeSession = useCallback(async (id: string) => {
    setIsLoading(true);
    setError(null);
    try {
      await deleteSession(id);
      setSessions((prev) => prev.filter((s) => s.id !== id));
      if (currentSession?.id === id) {
        setCurrentSession(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete session");
    } finally {
      setIsLoading(false);
    }
  }, [currentSession]);

  // 初始加载会话列表
  useEffect(() => {
    refreshSessions();
  }, [refreshSessions]);

  return {
    sessions,
    currentSession,
    isLoading,
    error,
    hasMore,
    total,
    selectSession,
    createNewSession,
    removeSession,
    refreshSessions,
    loadMoreSessions,
  };
}
