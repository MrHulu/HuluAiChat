/**
 * Keyring Service - Secure API Key Storage using System Keyring
 *
 * Uses tauri-plugin-keyring to store API keys securely in the OS keyring:
 * - macOS: Keychain
 * - Windows: Credential Manager
 * - Linux: Secret Service (e.g., GNOME Keyring)
 */
import {
  getPassword,
  setPassword,
  deletePassword,
} from "tauri-plugin-keyring-api";

// Service and account identifiers for keyring storage
const SERVICE_NAME = "HuluChat";
const OPENAI_API_KEY_ACCOUNT = "openai_api_key";
const DEEPSEEK_API_KEY_ACCOUNT = "deepseek_api_key";

export type APIKeyProvider = "openai" | "deepseek";

/**
 * Store an API key in the system keyring
 */
export async function storeAPIKey(
  provider: APIKeyProvider,
  apiKey: string
): Promise<void> {
  const account = getAccountForProvider(provider);
  await setPassword(SERVICE_NAME, account, apiKey);
}

/**
 * Retrieve an API key from the system keyring
 * Returns null if the key doesn't exist or keyring is unavailable
 */
export async function getAPIKey(provider: APIKeyProvider): Promise<string | null> {
  try {
    const account = getAccountForProvider(provider);
    const key = await getPassword(SERVICE_NAME, account);
    return key;
  } catch (error) {
    // Key doesn't exist or keyring unavailable
    console.warn(`Failed to get API key from keyring: ${error}`);
    return null;
  }
}

/**
 * Delete an API key from the system keyring
 */
export async function deleteAPIKey(provider: APIKeyProvider): Promise<void> {
  try {
    const account = getAccountForProvider(provider);
    await deletePassword(SERVICE_NAME, account);
  } catch (error) {
    // Key doesn't exist, ignore
    console.warn(`Failed to delete API key from keyring: ${error}`);
  }
}

/**
 * Check if an API key exists in the keyring
 */
export async function hasAPIKey(provider: APIKeyProvider): Promise<boolean> {
  try {
    const key = await getAPIKey(provider);
    return key !== null && key.length > 0;
  } catch {
    return false;
  }
}

/**
 * Migrate API key from backend storage to keyring
 * This is called once during app initialization if needed
 */
export async function migrateAPIKeyToKeyring(
  provider: APIKeyProvider,
  apiKey: string
): Promise<boolean> {
  try {
    await storeAPIKey(provider, apiKey);
    console.log(`Migrated ${provider} API key to keyring`);
    return true;
  } catch (error) {
    console.error(`Failed to migrate API key to keyring: ${error}`);
    return false;
  }
}

// Helper to get account name for provider
function getAccountForProvider(provider: APIKeyProvider): string {
  switch (provider) {
    case "openai":
      return OPENAI_API_KEY_ACCOUNT;
    case "deepseek":
      return DEEPSEEK_API_KEY_ACCOUNT;
    default:
      return OPENAI_API_KEY_ACCOUNT;
  }
}
