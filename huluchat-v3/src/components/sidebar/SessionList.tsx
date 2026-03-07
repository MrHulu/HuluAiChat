/**
 * SessionList Component
 * 会话列表侧边栏，支持文件夹分组和标签筛选
 */
import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { useTranslation } from "react-i18next";
import {
  Session,
  Folder,
  SessionSearchResult,
  searchSessions,
  ExportFormat,
  moveSessionToFolder,
  getSessionTags,
  listAllTags,
} from "@/api/client";
import { SessionItem } from "./SessionItem";
import { TagFilter } from "./TagFilter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loading } from "@/components/ui/loading";
import { cn } from "@/lib/utils";

export interface SessionListProps {
  sessions: Session[];
  folders: Folder[];
  currentSessionId: string | null;
  isLoading: boolean;
  onSelectSession: (id: string) => void;
  onCreateSession: () => void;
  onDeleteSession: (id: string) => void;
  onExportSession?: (sessionId: string, format: ExportFormat) => void;
  onCreateFolder: (name: string) => void;
  onDeleteFolder: (id: string) => void;
  onRenameFolder: (id: string, name: string) => void;
  onMoveSession?: (sessionId: string, folderId: string | null) => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

// Session tags state type
type SessionTagsMap = Record<string, string[]>;

export function SessionList({
  sessions,
  folders,
  currentSessionId,
  isLoading,
  onSelectSession,
  onCreateSession,
  onDeleteSession,
  onExportSession,
  onCreateFolder,
  onDeleteFolder,
  onRenameFolder,
  onMoveSession,
  isCollapsed = false,
  onToggleCollapse,
}: SessionListProps) {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SessionSearchResult[] | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [showNewFolderInput, setShowNewFolderInput] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [editingFolderId, setEditingFolderId] = useState<string | null>(null);
  const [editingFolderName, setEditingFolderName] = useState("");
  const [activeFolderFilter, setActiveFolderFilter] = useState<string | null>(null);
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Tag-related state
  const [sessionTags, setSessionTags] = useState<SessionTagsMap>({});
  const [allTags, setAllTags] = useState<string[]>([]);
  const [selectedFilterTags, setSelectedFilterTags] = useState<string[]>([]);

  // Load all tags on mount
  useEffect(() => {
    const loadAllTags = async () => {
      try {
        const tags = await listAllTags();
        setAllTags(tags);
      } catch (error) {
        console.error("Failed to load tags:", error);
      }
    };
    loadAllTags();
  }, []);

  // Load tags for all sessions
  useEffect(() => {
    const loadSessionTags = async () => {
      const tagsMap: SessionTagsMap = {};
      for (const session of sessions) {
        try {
          const tagList = await getSessionTags(session.id);
          tagsMap[session.id] = tagList.tags;
        } catch (error) {
          console.error(`Failed to load tags for session ${session.id}:`, error);
          tagsMap[session.id] = [];
        }
      }
      setSessionTags(tagsMap);
    };

    if (sessions.length > 0) {
      loadSessionTags();
    }
  }, [sessions]);

  // Tag filter handlers
  const handleTagFilterSelect = useCallback((tag: string) => {
    setSelectedFilterTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  }, []);

  const handleClearTagFilter = useCallback(() => {
    setSelectedFilterTags([]);
  }, []);

  const handleTagClick = useCallback((tag: string) => {
    handleTagFilterSelect(tag);
  }, [handleTagFilterSelect]);

  // Debounced search
  const performSearch = useCallback(async (query: string) => {
    if (!query.trim()) {
      setSearchResults(null);
      return;
    }

    setIsSearching(true);
    try {
      const results = await searchSessions(query);
      setSearchResults(results);
    } catch (error) {
      console.error("Search failed:", error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  }, []);

  // Debounce search input
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (!searchQuery.trim()) {
      setSearchResults(null);
      return;
    }

    searchTimeoutRef.current = setTimeout(() => {
      performSearch(searchQuery);
    }, 300);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery, performSearch]);

  // Group sessions by folder
  const sessionsByFolder = useMemo(() => {
    const grouped: Record<string, Session[]> = {
      root: [], // Sessions without a folder
    };

    // Initialize folders
    folders.forEach((folder) => {
      grouped[folder.id] = [];
    });

    // Group sessions
    sessions.forEach((session) => {
      const folderId = session.folder_id || "root";
      if (!grouped[folderId]) {
        grouped[folderId] = [];
      }
      grouped[folderId].push(session);
    });

    return grouped;
  }, [sessions, folders]);

  // Display sessions based on search state and tag filter
  const displaySessions = useMemo(() => {
    let result: Session[];

    if (searchResults) {
      result = searchResults.map((r) => r.session);
    } else if (activeFolderFilter !== null) {
      result = sessionsByFolder[activeFolderFilter] || [];
    } else {
      result = sessions;
    }

    // Filter by selected tags (AND logic - session must have all selected tags)
    if (selectedFilterTags.length > 0) {
      result = result.filter((session) => {
        const sessionTagList = sessionTags[session.id] || [];
        return selectedFilterTags.every((tag) => sessionTagList.includes(tag));
      });
    }

    return result;
  }, [sessions, sessionsByFolder, searchResults, activeFolderFilter, selectedFilterTags, sessionTags]);

  const toggleFolder = (folderId: string) => {
    setExpandedFolders((prev) => {
      const next = new Set(prev);
      if (next.has(folderId)) {
        next.delete(folderId);
      } else {
        next.add(folderId);
      }
      return next;
    });
  };

  const handleCreateFolder = () => {
    if (newFolderName.trim()) {
      onCreateFolder(newFolderName.trim());
      setNewFolderName("");
      setShowNewFolderInput(false);
    }
  };

  const handleRenameFolder = () => {
    if (editingFolderId && editingFolderName.trim()) {
      onRenameFolder(editingFolderId, editingFolderName.trim());
      setEditingFolderId(null);
      setEditingFolderName("");
    }
  };

  const handleMoveSession = async (sessionId: string, folderId: string | null) => {
    if (onMoveSession) {
      onMoveSession(sessionId, folderId);
    } else {
      // Fallback: call API directly
      await moveSessionToFolder(sessionId, folderId);
    }
  };

  if (isCollapsed) {
    return (
      <div className="w-14 flex flex-col items-center py-4 border-r border-border bg-muted/30">
        <button
          onClick={onToggleCollapse}
          className="p-2 rounded-lg hover:bg-muted transition-colors"
          title={t("sidebar.expandSidebar")}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect width="18" height="18" x="3" y="3" rx="2" />
            <path d="M9 3v18" />
            <path d="m14 9 3 3-3 3" />
          </svg>
        </button>

        <button
          onClick={onCreateSession}
          className="mt-4 p-2 rounded-lg hover:bg-muted transition-colors"
          title={t("sidebar.newChat")}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 5v14" />
            <path d="M5 12h14" />
          </svg>
        </button>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex flex-col h-full border-r border-border bg-muted/30",
        "transition-all duration-300 ease-in-out"
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <h2 className="font-semibold text-foreground">{t("sidebar.chats")}</h2>
        <div className="flex items-center gap-1">
          <button
            onClick={onToggleCollapse}
            className="p-1.5 rounded-md hover:bg-muted transition-all"
            title={t("sidebar.collapseSidebar")}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect width="18" height="18" x="3" y="3" rx="2" />
              <path d="M9 3v18" />
              <path d="m14 15-3-3 3-3" />
            </svg>
          </button>
        </div>
      </div>

      {/* New Chat Button */}
      <div className="p-3">
        <Button
          onClick={onCreateSession}
          className="w-full justify-start gap-2"
          variant="outline"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 5v14" />
            <path d="M5 12h14" />
          </svg>
          {t("sidebar.newChat")}
        </Button>
      </div>

      {/* Search Box */}
      <div className="p-3">
        <div className="relative">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            xmlns="http://www.w3.org/2000/svg"
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.3-4.3" />
          </svg>
          <Input
            type="text"
            placeholder={t("sidebar.searchChats")}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-8 text-sm bg-background"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 rounded hover:bg-muted transition-colors"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M18 6 6 18" />
                <path d="m6 6 12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Tag Filter */}
      {allTags.length > 0 && (
        <div className="px-3 pb-3">
          <TagFilter
            allTags={allTags}
            selectedTags={selectedFilterTags}
            onTagSelect={handleTagFilterSelect}
            onClearSelection={handleClearTagFilter}
          />
        </div>
      )}

      {/* Session List */}
      <div className="flex-1 overflow-y-auto p-2 scrollbar-thin">
        {isLoading || isSearching ? (
          <div className="flex items-center justify-center py-8 animate-fade-in">
            <Loading variant="ring" size="md" />
          </div>
        ) : searchQuery ? (
          // Search Results
          displaySessions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p className="text-sm">{t("sidebar.noResults")}</p>
              <p className="text-xs mt-1">{t("sidebar.tryDifferent")}</p>
            </div>
          ) : (
            <div className="space-y-1">
              {displaySessions.map((session) => {
                const searchResult = searchResults?.find((r) => r.session.id === session.id);
                const matchedMessages = searchResult?.matched_messages || [];

                return (
                  <div key={session.id}>
                    <SessionItem
                      session={session}
                      folders={folders}
                      isActive={session.id === currentSessionId}
                      onClick={() => onSelectSession(session.id)}
                      onDelete={() => onDeleteSession(session.id)}
                      onExport={onExportSession}
                      onMoveToFolder={handleMoveSession}
                      tags={sessionTags[session.id] || []}
                      onTagClick={handleTagClick}
                    />
                    {matchedMessages.length > 0 && (
                      <div className="ml-4 mt-1 mb-2 space-y-1">
                        {matchedMessages.map((msg) => (
                          <div
                            key={msg.id}
                            className="text-xs p-2 rounded bg-muted/50 cursor-pointer hover:bg-muted transition-colors"
                            onClick={() => onSelectSession(session.id)}
                          >
                            <span
                              className={cn(
                                "font-medium",
                                msg.role === "user" ? "text-blue-500" : "text-green-500"
                              )}
                            >
                              {msg.role === "user" ? t("chat.you") : t("chat.ai")}:
                            </span>
                            <span className="ml-1 text-muted-foreground line-clamp-2">
                              <HighlightText text={msg.content_snippet} query={searchQuery} />
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )
        ) : (
          // Folder View
          <>
            {/* Folders Section */}
            <div className="mb-2">
              {/* Folders Header */}
              <div className="flex items-center justify-between px-3 py-2 mx-2 rounded-md bg-muted/40">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  {t("sidebar.folders")}
                </span>
                <button
                  onClick={() => setShowNewFolderInput(true)}
                  className="p-1 rounded-md hover:bg-background/50 transition-all text-muted-foreground hover:text-foreground"
                  title={t("sidebar.newFolder")}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M12 5v14" />
                    <path d="M5 12h14" />
                  </svg>
                </button>
              </div>

              {/* New Folder Input */}
              {showNewFolderInput && (
                <div className="px-2 pb-2">
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleCreateFolder();
                    }}
                  >
                    <Input
                      autoFocus
                      value={newFolderName}
                      onChange={(e) => setNewFolderName(e.target.value)}
                      onBlur={() => {
                        if (!newFolderName.trim()) {
                          setShowNewFolderInput(false);
                        }
                      }}
                      placeholder={t("sidebar.folderName")}
                      className="h-7 text-sm"
                    />
                  </form>
                </div>
              )}

              {/* Folder List */}
              {folders.map((folder) => (
                <FolderItem
                  key={folder.id}
                  folder={folder}
                  sessions={sessionsByFolder[folder.id] || []}
                  isExpanded={expandedFolders.has(folder.id)}
                  isActive={activeFolderFilter === folder.id}
                  isEditing={editingFolderId === folder.id}
                  editingName={editingFolderName}
                  onToggle={() => toggleFolder(folder.id)}
                  onClick={() =>
                    setActiveFolderFilter(activeFolderFilter === folder.id ? null : folder.id)
                  }
                  onStartEdit={() => {
                    setEditingFolderId(folder.id);
                    setEditingFolderName(folder.name);
                  }}
                  onEditChange={setEditingFolderName}
                  onEditSubmit={handleRenameFolder}
                  onEditCancel={() => {
                    setEditingFolderId(null);
                    setEditingFolderName("");
                  }}
                  onDelete={() => onDeleteFolder(folder.id)}
                  onSelectSession={onSelectSession}
                  currentSessionId={currentSessionId}
                  onDeleteSession={onDeleteSession}
                  onExportSession={onExportSession}
                  onMoveSession={handleMoveSession}
                  folders={folders}
                  sessionTags={sessionTags}
                  onTagClick={handleTagClick}
                />
              ))}
            </div>

            {/* Uncategorized Sessions */}
            {activeFolderFilter === null && sessionsByFolder.root.length > 0 && (
              <div className="mt-2">
                <div className="px-3 py-2 mx-2 rounded-md bg-muted/40">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    {t("sidebar.uncategorized")}
                  </span>
                </div>
                <div className="space-y-1 mt-1">
                  {sessionsByFolder.root.map((session) => (
                    <SessionItem
                      key={session.id}
                      session={session}
                      folders={folders}
                      isActive={session.id === currentSessionId}
                      onClick={() => onSelectSession(session.id)}
                      onDelete={() => onDeleteSession(session.id)}
                      onExport={onExportSession}
                      onMoveToFolder={handleMoveSession}
                      tags={sessionTags[session.id] || []}
                      onTagClick={handleTagClick}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Sessions in selected folder */}
            {activeFolderFilter !== null && (
              <div className="mt-2">
                <button
                  onClick={() => setActiveFolderFilter(null)}
                  className="flex items-center gap-1 px-2 py-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="m15 18-6-6 6-6" />
                  </svg>
                  {t("sidebar.backToAll")}
                </button>
                <div className="space-y-1 mt-1">
                  {(sessionsByFolder[activeFolderFilter] || []).map((session) => (
                    <SessionItem
                      key={session.id}
                      session={session}
                      folders={folders}
                      isActive={session.id === currentSessionId}
                      onClick={() => onSelectSession(session.id)}
                      onDelete={() => onDeleteSession(session.id)}
                      onExport={onExportSession}
                      onMoveToFolder={handleMoveSession}
                      tags={sessionTags[session.id] || []}
                      onTagClick={handleTagClick}
                    />
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

/**
 * Folder Item Component
 */
interface FolderItemProps {
  folder: Folder;
  sessions: Session[];
  isExpanded: boolean;
  isActive: boolean;
  isEditing: boolean;
  editingName: string;
  onToggle: () => void;
  onClick: () => void;
  onStartEdit: () => void;
  onEditChange: (name: string) => void;
  onEditSubmit: () => void;
  onEditCancel: () => void;
  onDelete: () => void;
  onSelectSession: (id: string) => void;
  currentSessionId: string | null;
  onDeleteSession: (id: string) => void;
  onExportSession?: (sessionId: string, format: ExportFormat) => void;
  onMoveSession: (sessionId: string, folderId: string | null) => void;
  folders: Folder[];
  sessionTags: SessionTagsMap;
  onTagClick: (tag: string) => void;
}

function FolderItem({
  folder,
  sessions,
  isExpanded,
  isActive,
  isEditing,
  editingName,
  onToggle,
  onClick,
  onStartEdit,
  onEditChange,
  onEditSubmit,
  onEditCancel,
  onDelete,
  onSelectSession,
  currentSessionId,
  onDeleteSession,
  onExportSession,
  onMoveSession,
  folders,
  sessionTags,
  onTagClick,
}: FolderItemProps) {
  const { t } = useTranslation();
  const [showMenu, setShowMenu] = useState(false);

  return (
    <div className="select-none">
      <div
        className={cn(
          "flex items-center gap-1 px-2 py-1.5 rounded-md cursor-pointer transition-colors group",
          isActive ? "bg-muted" : "hover:bg-muted/50"
        )}
        onClick={onClick}
        onContextMenu={(e) => {
          e.preventDefault();
          setShowMenu(!showMenu);
        }}
      >
        {/* Expand/Collapse Toggle */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggle();
          }}
          className="p-1 rounded-md hover:bg-background/50 transition-all"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={cn("transition-transform", isExpanded ? "rotate-90" : "")}
          >
            <path d="m9 18 6-6-6-6" />
          </svg>
        </button>

        {/* Folder Icon */}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={isExpanded ? "text-primary" : "text-muted-foreground"}
        >
          <path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z" />
        </svg>

        {/* Folder Name */}
        {isEditing ? (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              onEditSubmit();
            }}
            className="flex-1"
          >
            <Input
              autoFocus
              value={editingName}
              onChange={(e) => onEditChange(e.target.value)}
              onBlur={onEditCancel}
              className="h-6 text-sm px-1"
              onClick={(e) => e.stopPropagation()}
            />
          </form>
        ) : (
          <span className="flex-1 text-sm truncate">{folder.name}</span>
        )}

        {/* Session Count */}
        <span className="text-xs text-muted-foreground">{sessions.length}</span>

        {/* Context Menu Button */}
        <div className="relative">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowMenu(!showMenu);
            }}
            className={cn(
              "p-1 rounded-md hover:bg-background/50 transition-all",
              "opacity-0 group-hover:opacity-100"
            )}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="1" />
              <circle cx="12" cy="5" r="1" />
              <circle cx="12" cy="19" r="1" />
            </svg>
          </button>

          {/* Dropdown Menu */}
          {showMenu && (
            <div className="absolute right-0 top-full mt-1 bg-popover border border-border rounded-md shadow-lg py-1 z-50 min-w-[120px]">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowMenu(false);
                  onStartEdit();
                }}
                className="w-full px-3 py-1.5 text-sm text-left hover:bg-muted transition-colors"
              >
                {t("common.rename")}
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowMenu(false);
                  onDelete();
                }}
                className="w-full px-3 py-1.5 text-sm text-left hover:bg-muted text-destructive transition-colors"
              >
                {t("common.delete")}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Sessions in Folder */}
      {isExpanded && sessions.length > 0 && (
        <div className="ml-4 border-l border-border pl-2 space-y-1">
          {sessions.map((session) => (
            <SessionItem
              key={session.id}
              session={session}
              folders={folders}
              isActive={session.id === currentSessionId}
              onClick={() => onSelectSession(session.id)}
              onDelete={() => onDeleteSession(session.id)}
              onExport={onExportSession}
              onMoveToFolder={onMoveSession}
              tags={sessionTags[session.id] || []}
              onTagClick={onTagClick}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * Highlight matching text in search results
 */
function HighlightText({ text, query }: { text: string; query: string }) {
  if (!query.trim()) return <>{text}</>;

  const regex = new RegExp(`(${escapeRegex(query)})`, "gi");
  const parts = text.split(regex);

  return (
    <>
      {parts.map((part, i) =>
        part.toLowerCase() === query.toLowerCase() ? (
          <mark
            key={i}
            className="bg-yellow-200 dark:bg-yellow-500/30 text-inherit rounded px-0.5"
          >
            {part}
          </mark>
        ) : (
          part
        )
      )}
    </>
  );
}

function escapeRegex(string: string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
