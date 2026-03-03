/**
 * useSession Hook
 * 会话管理逻辑
 */
import { useState, useCallback, useEffect } from "react";
import { Session, listSessions, createSession, deleteSession, getSession } from "@/api/client";

export interface UseSessionReturn {
  sessions: Session[];
  currentSession: Session | null;
  isLoading: boolean;
  error: string | null;
  selectSession: (id: string) => void;
  createNewSession: () => Promise<Session | null>;
  removeSession: (id: string) => Promise<void>;
  refreshSessions: () => Promise<void>;
}

export function useSession(): UseSessionReturn {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [currentSession, setCurrentSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshSessions = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await listSessions();
      setSessions(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load sessions");
    } finally {
      setIsLoading(false);
    }
  }, []);

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
    selectSession,
    createNewSession,
    removeSession,
    refreshSessions,
  };
}
