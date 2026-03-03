/**
 * HuluChat API Client
 */

const API_BASE = "http://127.0.0.1:8765/api";

export interface Session {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
}

export interface Message {
  id: string;
  session_id: string;
  role: "user" | "assistant";
  content: string;
  created_at: string;
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
}

export interface ModelInfo {
  id: string;
  name: string;
  description: string;
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
