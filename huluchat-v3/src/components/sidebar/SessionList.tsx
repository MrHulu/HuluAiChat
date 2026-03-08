/**
 * SessionList Component
 * 会话列表侧边栏，支持文件夹分组和标签筛选
 */
import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { useTranslation } from "react-i18next";
import {
  PanelLeftClose,
  PanelLeft,
  Plus,
  Search,
  X,
  ChevronRight,
  FolderOpen,
  MoreVertical,
  ArrowLeft,
  Pencil,
  Trash2,
} from "lucide-react";
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
import { SkeletonSessionItem } from "@/components/ui/skeleton";
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
      <div
        className="w-14 flex flex-col items-center py-4 border-r border-border bg-muted/30 dark:bg-muted/10 dark:border-white/5 dark:shadow-sm dark:shadow-black/10"
        role="region"
        aria-label={t("sidebar.chats")}
      >
        <button
          onClick={onToggleCollapse}
          className={cn(
            "p-2 rounded-lg transition-all duration-200 ease-out",
            "hover:bg-muted dark:hover:bg-muted/50",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1",
            "active:scale-95",
            // Dark mode enhancements - Cycle #192
            "dark:hover:bg-primary/15 dark:hover:shadow-[0_0_12px_oklch(0.5_0.15_264/0.2)]"
          )}
          aria-label={t("sidebar.expandSidebar")}
        >
          <PanelLeft className="w-5 h-5" aria-hidden="true" />
        </button>

        <button
          onClick={onCreateSession}
          className={cn(
            "mt-4 p-2 rounded-lg transition-all duration-200 ease-out",
            "hover:bg-muted dark:hover:bg-muted/50",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1",
            "active:scale-95",
            // Dark mode enhancements - Cycle #192
            "dark:hover:bg-primary/15 dark:hover:shadow-[0_0_12px_oklch(0.5_0.15_264/0.2)]"
          )}
          aria-label={t("sidebar.newChat")}
        >
          <Plus className="w-5 h-5" aria-hidden="true" />
        </button>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex flex-col h-full border-r border-border bg-muted/30",
        "transition-all duration-200 ease-out",
        "dark:bg-muted/10 dark:border-white/5"
      )}
      role="navigation"
      aria-label={t("sidebar.chats")}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <h2 className="font-semibold text-foreground">{t("sidebar.chats")}</h2>
        <div className="flex items-center gap-1">
          <button
            onClick={onToggleCollapse}
            className="p-1.5 rounded-md hover:bg-muted transition-all duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1"
            aria-label={t("sidebar.collapseSidebar")}
          >
            <PanelLeftClose className="w-4 h-4" aria-hidden="true" />
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
          <Plus className="w-4 h-4" aria-hidden="true" />
          {t("sidebar.newChat")}
        </Button>
      </div>

      {/* Search Box */}
      <div className="p-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" aria-hidden="true" />
          <Input
            type="search"
            placeholder={t("sidebar.searchChats")}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-8 text-sm bg-background"
            aria-label={t("sidebar.searchChats")}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 rounded hover:bg-muted transition-all duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              aria-label={t("common.clear")}
            >
              <X className="w-3 h-3" aria-hidden="true" />
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
      <div
        className="flex-1 overflow-y-auto p-2 scrollbar-thin"
        role="list"
        aria-label={t("sidebar.chats")}
      >
        {isLoading || isSearching ? (
          <div className="space-y-1 animate-fade-in" aria-busy="true" aria-live="polite">
            <SkeletonSessionItem />
            <SkeletonSessionItem />
            <SkeletonSessionItem />
            <SkeletonSessionItem />
            <SkeletonSessionItem />
          </div>
        ) : searchQuery ? (
          // Search Results
          displaySessions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground" role="status" aria-live="polite">
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
                            className="text-xs p-2 rounded bg-muted/50 cursor-pointer hover:bg-muted transition-all duration-200 ease-out"
                            onClick={() => onSelectSession(session.id)}
                          >
                            <span
                              className={cn(
                                "font-medium",
                                msg.role === "user" ? "text-primary" : "text-chart-2"
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
            <div className="mb-2" role="region" aria-label={t("sidebar.folders")}>
              {/* Folders Header */}
              <div className="flex items-center justify-between px-3 py-2 mx-2 rounded-md bg-muted/40 dark:bg-muted/20 dark:border dark:border-white/10 dark:shadow-sm dark:shadow-black/10">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  {t("sidebar.folders")}
                </span>
                <button
                  onClick={() => setShowNewFolderInput(true)}
                  className="p-1 rounded-md hover:bg-background/50 transition-all duration-200 ease-out text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  aria-label={t("sidebar.newFolder")}
                >
                  <Plus className="w-3.5 h-3.5" aria-hidden="true" />
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
                      aria-label={t("sidebar.folderName")}
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
              <div className="mt-2" role="region" aria-label={t("sidebar.uncategorized")}>
                <div className="px-3 py-2 mx-2 rounded-md bg-muted/40 dark:bg-muted/20 dark:border dark:border-white/10 dark:shadow-sm dark:shadow-black/10">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    {t("sidebar.uncategorized")}
                  </span>
                </div>
                <div className="space-y-1 mt-1" role="list">
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
                  className="flex items-center gap-1 px-2 py-1 text-xs text-muted-foreground hover:text-foreground transition-all duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
                  aria-label={t("sidebar.backToAll")}
                >
                  <ArrowLeft className="w-3 h-3" aria-hidden="true" />
                  {t("sidebar.backToAll")}
                </button>
                <div className="space-y-1 mt-1" role="list">
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
    <div className="select-none" role="listitem">
      <div
        className={cn(
          "flex items-center gap-1 px-2 py-1.5 rounded-md cursor-pointer transition-all duration-200 ease-out group",
          isActive ? "bg-muted" : "hover:bg-muted/50",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1"
        )}
        onClick={onClick}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onClick();
          }
        }}
        onContextMenu={(e) => {
          e.preventDefault();
          setShowMenu(!showMenu);
        }}
        tabIndex={0}
        role="button"
        aria-expanded={isExpanded}
        aria-label={t("sidebar.folderWithName", { name: folder.name, count: sessions.length })}
      >
        {/* Expand/Collapse Toggle */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggle();
          }}
          className="p-1 rounded-md hover:bg-background/50 transition-all duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          aria-label={isExpanded ? t("sidebar.collapseFolder") : t("sidebar.expandFolder")}
        >
          <ChevronRight
            className={cn(
              "w-3 h-3 transition-transform",
              isExpanded && "rotate-90"
            )}
            aria-hidden="true"
          />
        </button>

        {/* Folder Icon */}
        <FolderOpen
          className={cn(
            "w-4 h-4",
            isExpanded ? "text-primary" : "text-muted-foreground"
          )}
          aria-hidden="true"
        />

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
              aria-label={t("sidebar.folderName")}
            />
          </form>
        ) : (
          <span className="flex-1 text-sm truncate">{folder.name}</span>
        )}

        {/* Session Count */}
        <span className="text-xs text-muted-foreground" aria-label={t("sidebar.sessionCount", { count: sessions.length })}>
          {sessions.length}
        </span>

        {/* Context Menu Button */}
        <div className="relative">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowMenu(!showMenu);
            }}
            className={cn(
              "p-1 rounded-md hover:bg-background/50 transition-all",
              "opacity-0 group-hover:opacity-100",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:opacity-100"
            )}
            aria-label={t("common.more")}
            aria-expanded={showMenu}
          >
            <MoreVertical className="w-3.5 h-3.5" aria-hidden="true" />
          </button>

          {/* Dropdown Menu */}
          {showMenu && (
            <div
              className="absolute right-0 top-full mt-1 bg-popover border border-border rounded-md shadow-lg py-1 z-50 min-w-[120px]"
              role="menu"
            >
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowMenu(false);
                  onStartEdit();
                }}
                className="w-full px-3 py-1.5 text-sm text-left hover:bg-muted transition-colors flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"
                role="menuitem"
              >
                <Pencil className="w-3.5 h-3.5" aria-hidden="true" />
                {t("common.rename")}
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowMenu(false);
                  onDelete();
                }}
                className="w-full px-3 py-1.5 text-sm text-left hover:bg-muted text-destructive transition-colors flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"
                role="menuitem"
              >
                <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                {t("common.delete")}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Sessions in Folder - with slide-in animation */}
      {isExpanded && sessions.length > 0 && (
        <div
          className="ml-4 border-l border-border pl-2 space-y-1 animate-in slide-in-from-top-1 duration-200"
          role="list"
        >
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
            className="bg-primary/20 dark:bg-primary/30 dark:text-inherit rounded px-0.5 dark:shadow-sm"
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
