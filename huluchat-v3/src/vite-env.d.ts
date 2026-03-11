/// <reference types="vite/client" />

interface ImportMetaEnv {
  /**
   * API Base URL for the Python FastAPI backend
   * @default "http://127.0.0.1:8765/api"
   */
  readonly VITE_API_BASE: string;

  /**
   * Ollama Base URL for local Ollama instance
   * @default "http://localhost:11434"
   */
  readonly VITE_OLLAMA_BASE_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

