/**
 * HuluChat API Client
 */

const API_BASE = "http://127.0.0.1:8765/api";

// ============== Ollama Types ==============

/**
 * 模型提供者类型
 */
export type ModelProvider = "openai" | "ollama";

/**
 * Ollama 模型信息
 */
export interface OllamaModel {
  name: string;
  size: number;
  modified_at: string;
}

/**
 * Ollama 服务状态
 */
export interface OllamaStatus {
  available: boolean;
  base_url: string;
  version?: string;
}

export interface Session {
  id: string;
  title: string;
  folder_id: string | null;
  created_at: string;
  updated_at: string;
}

// Folder types
export interface Folder {
  id: string;
  name: string;
  parent_id: string | null;
  created_at: string;
  updated_at: string;
}

// Image content type for multimodal messages
export interface ImageContent {
  type: "image_url";
  image_url: {
    url: string;  // data:image/xxx;base64,xxx
  };
}

export interface Message {
  id: string;
  session_id: string;
  role: "user" | "assistant";
  content: string;
  images?: ImageContent[];  // Optional images for multimodal messages
  created_at: string;
}

// Search types
export interface MessageMatch {
  id: string;
  session_id: string;
  role: "user" | "assistant";
  content_snippet: string;
  created_at: string;
}

export interface SessionSearchResult {
  session: Session;
  matched_messages: MessageMatch[];
  match_type: "title" | "content" | "both";
}

/**
 * Health check
 */
export async function healthCheck(): Promise<{ status: string; version: string }> {
  const response = await fetch(`${API_BASE}/health`);
  return response.json();
}

/**
 * List all sessions
 */
export async function listSessions(): Promise<Session[]> {
  const response = await fetch(`${API_BASE}/sessions/`);
  return response.json();
}

/**
 * Create a new session
 */
export async function createSession(): Promise<Session> {
  const response = await fetch(`${API_BASE}/sessions/`, { method: "POST" });
  return response.json();
}

/**
 * Get a session by ID
 */
export async function getSession(id: string): Promise<Session> {
  const response = await fetch(`${API_BASE}/sessions/${id}`);
  return response.json();
}

/**
 * Delete a session
 */
export async function deleteSession(id: string): Promise<void> {
  await fetch(`${API_BASE}/sessions/${id}`, { method: "DELETE" });
}

/**
 * Search sessions by title and message content
 */
export async function searchSessions(query: string): Promise<SessionSearchResult[]> {
  const response = await fetch(`${API_BASE}/sessions/search/?q=${encodeURIComponent(query)}`);
  return response.json();
}

/**
 * Get messages for a session
 */
export async function getSessionMessages(
  sessionId: string,
  limit: number = 50,
  offset: number = 0
): Promise<{ messages: Message[] }> {
  const response = await fetch(
    `${API_BASE}/chat/${sessionId}/messages?limit=${limit}&offset=${offset}`
  );
  return response.json();
}

/**
 * Update a message's content
 */
export async function updateMessage(
  sessionId: string,
  messageId: string,
  content: string
): Promise<Message> {
  const response = await fetch(
    `${API_BASE}/chat/${sessionId}/messages/${messageId}`,
    {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(content),
    }
  );
  return response.json();
}

/**
 * Create WebSocket connection for chat
 */
export function createChatWebSocket(sessionId: string): WebSocket {
  return new WebSocket(`ws://127.0.0.1:8765/api/chat/ws/${sessionId}`);
}

// Settings types
export interface AppSettings {
  openai_api_key: string | null;
  openai_base_url: string | null;
  openai_model: string;
  has_api_key: boolean;
  // Model parameters
  temperature: number;
  top_p: number;
  max_tokens: number;
}

export interface ModelInfo {
  id: string;
  name: string;
  description: string;
  provider?: ModelProvider;
}

/**
 * Get current settings
 */
export async function getSettings(): Promise<AppSettings> {
  const response = await fetch(`${API_BASE}/settings/`);
  return response.json();
}

/**
 * Update settings
 */
export async function updateSettings(settings: Partial<{
  openai_api_key: string;
  openai_base_url: string;
  openai_model: string;
  temperature: number;
  top_p: number;
  max_tokens: number;
}>): Promise<AppSettings> {
  const response = await fetch(`${API_BASE}/settings/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(settings),
  });
  return response.json();
}

/**
 * Get available models
 */
export async function getModels(): Promise<ModelInfo[]> {
  const response = await fetch(`${API_BASE}/settings/models`);
  return response.json();
}

/**
 * Test API connection
 */
export async function testConnection(): Promise<{ status: string; message: string }> {
  const response = await fetch(`${API_BASE}/settings/test`, { method: "POST" });
  return response.json();
}

// Export format types
export type ExportFormat = "markdown" | "json" | "txt";

/**
 * Export a session with all messages in specified format
 * Returns a blob that can be downloaded
 */
export async function exportSession(
  sessionId: string,
  format: ExportFormat = "markdown"
): Promise<{ blob: Blob; filename: string }> {
  const response = await fetch(
    `${API_BASE}/sessions/${sessionId}/export?format=${format}`
  );
  if (!response.ok) {
    throw new Error(`Export failed: ${response.statusText}`);
  }

  // Extract filename from Content-Disposition header
  const contentDisposition = response.headers.get("Content-Disposition");
  let filename = `export.${format}`;
  if (contentDisposition) {
    const match = contentDisposition.match(/filename="(.+)"/);
    if (match) {
      filename = match[1];
    }
  }

  const blob = await response.blob();
  return { blob, filename };
}

// ============== Folder APIs ==============

/**
 * List all folders
 */
export async function listFolders(): Promise<Folder[]> {
  const response = await fetch(`${API_BASE}/folders/`);
  return response.json();
}

/**
 * Create a new folder
 */
export async function createFolder(name: string, parentId?: string): Promise<Folder> {
  const response = await fetch(`${API_BASE}/folders/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, parent_id: parentId || null }),
  });
  return response.json();
}

/**
 * Update a folder's name
 */
export async function updateFolder(id: string, name: string): Promise<Folder> {
  const response = await fetch(`${API_BASE}/folders/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name }),
  });
  return response.json();
}

/**
 * Delete a folder
 */
export async function deleteFolder(id: string): Promise<void> {
  await fetch(`${API_BASE}/folders/${id}`, { method: "DELETE" });
}

/**
 * Move a session to a folder (or root if folderId is null)
 */
export async function moveSessionToFolder(
  sessionId: string,
  folderId: string | null
): Promise<Session> {
  const response = await fetch(`${API_BASE}/sessions/${sessionId}/folder`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ folder_id: folderId }),
  });
  return response.json();
}

/**
 * List sessions filtered by folder
 */
export async function listSessionsByFolder(folderId: string | null): Promise<Session[]> {
  const url = folderId
    ? `${API_BASE}/sessions/?folder_id=${folderId}`
    : `${API_BASE}/sessions/`;
  const response = await fetch(url);
  return response.json();
}

// ============== Ollama APIs ==============

/**
 * 检测 Ollama 服务状态
 */
export async function getOllamaStatus(): Promise<OllamaStatus> {
  try {
    const response = await fetch(`${API_BASE}/ollama/status`);
    if (!response.ok) {
      return { available: false, base_url: "http://localhost:11434" };
    }
    return response.json();
  } catch {
    return { available: false, base_url: "http://localhost:11434" };
  }
}

/**
 * 获取本地 Ollama 模型列表
 */
export async function getOllamaModels(): Promise<OllamaModel[]> {
  try {
    const response = await fetch(`${API_BASE}/ollama/models`);
    if (!response.ok) {
      return [];
    }
    const data = await response.json();
    return data.models || [];
  } catch {
    return [];
  }
}

/**
 * 拉取新的 Ollama 模型
 */
export async function pullOllamaModel(name: string): Promise<{ status: string; digest?: string }> {
  try {
    const response = await fetch(`${API_BASE}/ollama/pull`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    return response.json();
  } catch {
    return { status: "error" };
  }
}

/**
 * 测试 Ollama 连接
 */
export async function testOllamaConnection(): Promise<{ status: string; message: string }> {
  try {
    const response = await fetch(`${API_BASE}/ollama/test`, { method: "POST" });
    return response.json();
  } catch {
    return { status: "error", message: "Failed to connect to Ollama" };
  }
}

// ============== Prompt Templates APIs ==============

/**
 * Template category type
 */
export type TemplateCategory = "writing" | "coding" | "analysis" | "translation" | "custom";

/**
 * Prompt template interface
 */
export interface PromptTemplate {
  id: string;
  name: string;
  content: string;
  category: TemplateCategory;
  is_builtin: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * List all templates, optionally filtered by category
 */
export async function listTemplates(category?: TemplateCategory): Promise<PromptTemplate[]> {
  const url = category
    ? `${API_BASE}/templates/?category=${category}`
    : `${API_BASE}/templates/`;
  const response = await fetch(url);
  return response.json();
}

/**
 * Create a new custom template
 */
export async function createTemplate(
  name: string,
  content: string,
  category: TemplateCategory = "custom"
): Promise<PromptTemplate> {
  const response = await fetch(`${API_BASE}/templates/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, content, category }),
  });
  return response.json();
}

/**
 * Get a template by ID
 */
export async function getTemplate(id: string): Promise<PromptTemplate> {
  const response = await fetch(`${API_BASE}/templates/${id}`);
  return response.json();
}

/**
 * Update a custom template
 */
export async function updateTemplate(
  id: string,
  updates: { name?: string; content?: string; category?: TemplateCategory }
): Promise<PromptTemplate> {
  const response = await fetch(`${API_BASE}/templates/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(updates),
  });
  return response.json();
}

/**
 * Delete a custom template
 */
export async function deleteTemplate(id: string): Promise<void> {
  await fetch(`${API_BASE}/templates/${id}`, { method: "DELETE" });
}

// ============== RAG APIs ==============

/**
 * RAG document interface
 */
export interface RAGDocument {
  doc_id: string;
  filename: string;
  chunk_count: number;
}

/**
 * Retrieved chunk from RAG query
 */
export interface RetrievedChunk {
  content: string;
  source: string;
  chunk_index: number;
  score: number;
}

/**
 * RAG query response
 */
export interface RAGQueryResponse {
  success: boolean;
  chunks: RetrievedChunk[];
  context: string;
}

/**
 * RAG upload response
 */
export interface RAGUploadResponse {
  success: boolean;
  doc_id: string;
  filename: string;
  chunk_count: number;
  error?: string;
}

/**
 * Upload and index a document for RAG
 * Supports TXT, MD, PDF formats
 * Maximum file size: 5MB
 */
export async function uploadRAGDocument(file: File): Promise<RAGUploadResponse> {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(`${API_BASE}/rag/upload`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: "Upload failed" }));
    throw new Error(error.detail || "Upload failed");
  }

  return response.json();
}

/**
 * Query indexed documents for relevant content
 */
export async function queryRAGDocuments(
  query: string,
  nResults: number = 5
): Promise<RAGQueryResponse> {
  const response = await fetch(`${API_BASE}/rag/query`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query, n_results: nResults }),
  });

  if (!response.ok) {
    throw new Error("Query failed");
  }

  return response.json();
}

/**
 * List all indexed documents
 */
export async function listRAGDocuments(): Promise<{ documents: RAGDocument[] }> {
  const response = await fetch(`${API_BASE}/rag/documents`);
  return response.json();
}

/**
 * Delete an indexed document
 */
export async function deleteRAGDocument(docId: string): Promise<{ success: boolean; error?: string }> {
  const response = await fetch(`${API_BASE}/rag/documents/${docId}`, {
    method: "DELETE",
  });
  return response.json();
}

// ============== Session Tags APIs ==============

/**
 * Tag list for a session
 */
export interface TagList {
  session_id: string;
  tags: string[];
}

/**
 * Tag response
 */
export interface TagResponse {
  id: string;
  session_id: string;
  tag_name: string;
  created_at: string;
}

/**
 * Get all tags for a session
 */
export async function getSessionTags(sessionId: string): Promise<TagList> {
  const response = await fetch(`${API_BASE}/sessions/${sessionId}/tags`);
  return response.json();
}

/**
 * Add a tag to a session
 */
export async function addSessionTag(sessionId: string, tagName: string): Promise<TagResponse> {
  const response = await fetch(`${API_BASE}/sessions/${sessionId}/tags`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ session_id: sessionId, tag_name: tagName }),
  });
  return response.json();
}

/**
 * Remove a tag from a session
 */
export async function removeSessionTag(sessionId: string, tagName: string): Promise<void> {
  await fetch(`${API_BASE}/sessions/${sessionId}/tags/${encodeURIComponent(tagName)}`, {
    method: "DELETE",
  });
}

/**
 * Get all unique tag names
 */
export async function listAllTags(): Promise<string[]> {
  const response = await fetch(`${API_BASE}/tags`);
  return response.json();
}

/**
 * Session with tags
 */
export interface SessionWithTags extends Session {
  tags: string[];
}

/**
 * Get all sessions with a specific tag
 */
export async function getSessionsByTag(tagName: string): Promise<SessionWithTags[]> {
  const response = await fetch(`${API_BASE}/tags/${encodeURIComponent(tagName)}/sessions`);
  return response.json();
}

// ============== Message Bookmarks APIs ==============

/**
 * Bookmark response
 */
export interface BookmarkResponse {
  id: string;
  message_id: string;
  session_id: string;
  note: string | null;
  created_at: string;
}

/**
 * Bookmark with message content
 */
export interface BookmarkWithMessage extends BookmarkResponse {
  message_content: string;
  message_role: "user" | "assistant";
}

/**
 * Create a bookmark for a message
 */
export async function createBookmark(
  messageId: string,
  sessionId: string,
  note?: string
): Promise<BookmarkResponse> {
  const response = await fetch(`${API_BASE}/bookmarks`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message_id: messageId, session_id: sessionId, note }),
  });
  return response.json();
}

/**
 * Delete a bookmark
 */
export async function deleteBookmark(bookmarkId: string): Promise<void> {
  await fetch(`${API_BASE}/bookmarks/${bookmarkId}`, { method: "DELETE" });
}

/**
 * Update bookmark note
 */
export async function updateBookmark(bookmarkId: string, note: string): Promise<BookmarkResponse> {
  const response = await fetch(`${API_BASE}/bookmarks/${bookmarkId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ note }),
  });
  return response.json();
}

/**
 * Get all bookmarks for a session
 */
export async function getSessionBookmarks(sessionId: string): Promise<BookmarkWithMessage[]> {
  const response = await fetch(`${API_BASE}/sessions/${sessionId}/bookmarks`);
  return response.json();
}

/**
 * Get all bookmarks
 */
export async function listAllBookmarks(): Promise<BookmarkWithMessage[]> {
  const response = await fetch(`${API_BASE}/bookmarks`);
  return response.json();
}

/**
 * Get bookmark for a specific message
 */
export async function getMessageBookmark(messageId: string): Promise<BookmarkResponse> {
  const response = await fetch(`${API_BASE}/messages/${messageId}/bookmark`);
  return response.json();
}
