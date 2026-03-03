/**
 * useFolders Hook
 * Folder management logic
 */
import { useState, useCallback, useEffect } from "react";
import {
  Folder,
  listFolders,
  createFolder as apiCreateFolder,
  updateFolder as apiUpdateFolder,
  deleteFolder as apiDeleteFolder,
} from "@/api/client";

export interface UseFoldersReturn {
  folders: Folder[];
  isLoading: boolean;
  error: string | null;
  createFolder: (name: string, parentId?: string) => Promise<Folder | null>;
  renameFolder: (id: string, name: string) => Promise<Folder | null>;
  removeFolder: (id: string) => Promise<void>;
  refreshFolders: () => Promise<void>;
}

export function useFolders(): UseFoldersReturn {
  const [folders, setFolders] = useState<Folder[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshFolders = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await listFolders();
      setFolders(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load folders");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createFolder = useCallback(
    async (name: string, parentId?: string): Promise<Folder | null> => {
      setIsLoading(true);
      setError(null);
      try {
        const folder = await apiCreateFolder(name, parentId);
        setFolders((prev) => [...prev, folder]);
        return folder;
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to create folder");
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const renameFolder = useCallback(
    async (id: string, name: string): Promise<Folder | null> => {
      setIsLoading(true);
      setError(null);
      try {
        const folder = await apiUpdateFolder(id, name);
        setFolders((prev) => prev.map((f) => (f.id === id ? folder : f)));
        return folder;
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to rename folder");
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const removeFolder = useCallback(async (id: string) => {
    setIsLoading(true);
    setError(null);
    try {
      await apiDeleteFolder(id);
      setFolders((prev) => prev.filter((f) => f.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete folder");
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    refreshFolders();
  }, [refreshFolders]);

  return {
    folders,
    isLoading,
    error,
    createFolder,
    renameFolder,
    removeFolder,
    refreshFolders,
  };
}
