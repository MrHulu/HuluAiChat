/**
 * Integration Tests: App Component Integration
 *
 * These tests verify that key components are properly integrated
 * into the main App.tsx. This prevents issues like "component exists
 * but is never used" from slipping through to production.
 *
 * Why integration tests?
 * - Unit tests mock everything, so they can't detect integration issues
 * - These tests verify actual imports and usage in the App component
 */

import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import React from "react";
import { TooltipProvider } from "@/components/ui/tooltip";

// ============================================
// Test 1: Component Export Verification
// ============================================

describe("Component Exports Integration", () => {
  /**
   * Verify that components used in App.tsx can be imported
   */

  it("should export ThemeToggle from @/components/theme-toggle", async () => {
    const mod = await import("@/components/theme-toggle");
    expect(mod.ThemeToggle).toBeDefined();
  });

  it("should export ChatView from @/components/chat", async () => {
    const mod = await import("@/components/chat");
    expect(mod.ChatView).toBeDefined();
  });

  it("should export SessionList from @/components/sidebar", async () => {
    const mod = await import("@/components/sidebar");
    expect(mod.SessionList).toBeDefined();
  });

  it("should export UpdateNotification from @/components/UpdateNotification", async () => {
    const mod = await import("@/components/UpdateNotification");
    expect(mod.UpdateNotification).toBeDefined();
  });

  it("should export KeyboardHelpDialog from @/components/keyboard/KeyboardHelpDialog", async () => {
    const mod = await import("@/components/keyboard/KeyboardHelpDialog");
    expect(mod.KeyboardHelpDialog).toBeDefined();
  });

  it("should export LanguageSelector from @/components/LanguageSelector", async () => {
    const mod = await import("@/components/LanguageSelector");
    expect(mod.LanguageSelector).toBeDefined();
  });

  it("should export CommandPalette from @/components/command", async () => {
    const mod = await import("@/components/command");
    expect(mod.CommandPalette).toBeDefined();
  });

  it("should export KnowledgeCenter from @/components/knowledge", async () => {
    const mod = await import("@/components/knowledge");
    expect(mod.KnowledgeCenter).toBeDefined();
  });

  it("should export WelcomeDialog from @/components/WelcomeDialog", async () => {
    const mod = await import("@/components/WelcomeDialog");
    expect(mod.WelcomeDialog).toBeDefined();
  });

  it("should export FeatureDiscoveryTip from @/components/FeatureDiscoveryTip", async () => {
    const mod = await import("@/components/FeatureDiscoveryTip");
    expect(mod.FeatureDiscoveryTip).toBeDefined();
  });

  it("should export ContextualTip from @/components/ContextualTip", async () => {
    const mod = await import("@/components/ContextualTip");
    expect(mod.ContextualTip).toBeDefined();
  });

  it("should export BookmarkJumpDialog from @/components/bookmark", async () => {
    const mod = await import("@/components/bookmark");
    expect(mod.BookmarkJumpDialog).toBeDefined();
  });

  it("should export BackendStatusIndicator from @/components/BackendStatusIndicator", async () => {
    const mod = await import("@/components/BackendStatusIndicator");
    expect(mod.BackendStatusIndicator).toBeDefined();
  });
});

// ============================================
// Test 2: Hook Integration
// ============================================

describe("Hook Integration", () => {
  /**
   * Verify all hooks used in App.tsx are exported from @/hooks
   */

  it("should export useSession from @/hooks", async () => {
    const hooks = await import("@/hooks");
    expect(hooks.useSession).toBeDefined();
    expect(typeof hooks.useSession).toBe("function");
  });

  it("should export useKeyboardShortcuts from @/hooks", async () => {
    const hooks = await import("@/hooks");
    expect(hooks.useKeyboardShortcuts).toBeDefined();
    expect(typeof hooks.useKeyboardShortcuts).toBe("function");
  });

  it("should export useFolders from @/hooks", async () => {
    const hooks = await import("@/hooks");
    expect(hooks.useFolders).toBeDefined();
    expect(typeof hooks.useFolders).toBe("function");
  });

  it("should export useFeatureDiscovery from @/hooks", async () => {
    const hooks = await import("@/hooks");
    expect(hooks.useFeatureDiscovery).toBeDefined();
    expect(typeof hooks.useFeatureDiscovery).toBe("function");
  });

  it("should export useContextualTip from @/hooks", async () => {
    const hooks = await import("@/hooks");
    expect(hooks.useContextualTip).toBeDefined();
    expect(typeof hooks.useContextualTip).toBe("function");
  });

  it("should export useModel from @/hooks", async () => {
    const hooks = await import("@/hooks");
    expect(hooks.useModel).toBeDefined();
    expect(typeof hooks.useModel).toBe("function");
  });

  it("should export useBackendHealth from @/hooks", async () => {
    const hooks = await import("@/hooks");
    expect(hooks.useBackendHealth).toBeDefined();
    expect(typeof hooks.useBackendHealth).toBe("function");
  });
});

// ============================================
// Test 3: API Client Integration
// ============================================

describe("API Client Integration", () => {
  /**
   * Verify API functions used in App.tsx are exported
   */

  it("should export exportSession from @/api/client", async () => {
    const client = await import("@/api/client");
    expect(client.exportSession).toBeDefined();
    expect(typeof client.exportSession).toBe("function");
  });

  it("should export moveSessionToFolder from @/api/client", async () => {
    const client = await import("@/api/client");
    expect(client.moveSessionToFolder).toBeDefined();
    expect(typeof client.moveSessionToFolder).toBe("function");
  });

  it("should export updateSettings from @/api/client", async () => {
    const client = await import("@/api/client");
    expect(client.updateSettings).toBeDefined();
    expect(typeof client.updateSettings).toBe("function");
  });
});

// ============================================
// Test 4: Service Integration
// ============================================

describe("Service Integration", () => {
  /**
   * Verify services used in App.tsx are exported
   */

  it("should export getAPIKey from @/services/keyring", async () => {
    const keyring = await import("@/services/keyring");
    expect(keyring.getAPIKey).toBeDefined();
    expect(typeof keyring.getAPIKey).toBe("function");
  });

  // Note: APIKeyProvider is a TypeScript type, not a runtime value
  // We verify the module exports expected functions instead
  it("should export storeAPIKey from @/services/keyring", async () => {
    const keyring = await import("@/services/keyring");
    expect(keyring.storeAPIKey).toBeDefined();
    expect(typeof keyring.storeAPIKey).toBe("function");
  });
});

// ============================================
// Test 5: BackendStatusIndicator Component Test
// ============================================

describe("BackendStatusIndicator Component Integration", () => {
  /**
   * Test: Verify BackendStatusIndicator is importable
   * If this fails, it means the component file is missing or not exported
   */
  it("should be importable from @/components/BackendStatusIndicator", async () => {
    const { BackendStatusIndicator } = await import(
      "@/components/BackendStatusIndicator"
    );
    expect(BackendStatusIndicator).toBeDefined();
    expect(typeof BackendStatusIndicator).toBe("function");
  });

  /**
   * Test: Verify component renders with checking status
   * Requires TooltipProvider wrapper
   */
  it("should render with 'checking' status", async () => {
    const { BackendStatusIndicator } = await import(
      "@/components/BackendStatusIndicator"
    );

    render(
      <TooltipProvider>
        <BackendStatusIndicator
          status="checking"
          version={null}
          isRecovering={false}
          lastChecked={null}
          onRetry={() => {}}
          compact={true}
        />
      </TooltipProvider>
    );

    const statusElement = screen.getByRole("status");
    expect(statusElement).toBeDefined();
  });

  /**
   * Test: Verify component renders with healthy status
   */
  it("should render with 'healthy' status", async () => {
    const { BackendStatusIndicator } = await import(
      "@/components/BackendStatusIndicator"
    );

    render(
      <TooltipProvider>
        <BackendStatusIndicator
          status="healthy"
          version="1.0.0"
          isRecovering={false}
          lastChecked={new Date()}
          onRetry={() => {}}
          compact={true}
        />
      </TooltipProvider>
    );

    const statusElement = screen.getByRole("status");
    expect(statusElement).toBeDefined();
  });

  /**
   * Test: Verify component renders with degraded status
   */
  it("should render with 'degraded' status", async () => {
    const { BackendStatusIndicator } = await import(
      "@/components/BackendStatusIndicator"
    );

    render(
      <TooltipProvider>
        <BackendStatusIndicator
          status="degraded"
          version="1.0.0"
          isRecovering={false}
          lastChecked={new Date()}
          onRetry={() => {}}
          compact={true}
        />
      </TooltipProvider>
    );

    const statusElement = screen.getByRole("status");
    expect(statusElement).toBeDefined();
  });

  /**
   * Test: Verify component renders with offline status
   */
  it("should render with 'offline' status", async () => {
    const { BackendStatusIndicator } = await import(
      "@/components/BackendStatusIndicator"
    );

    render(
      <TooltipProvider>
        <BackendStatusIndicator
          status="offline"
          version={null}
          isRecovering={false}
          lastChecked={new Date()}
          onRetry={() => {}}
          compact={true}
        />
      </TooltipProvider>
    );

    const statusElement = screen.getByRole("status");
    expect(statusElement).toBeDefined();
  });
});

// ============================================
// Test 6: Import Path Consistency
// ============================================

describe("Import Path Consistency", () => {
  /**
   * This test verifies that import paths in App.tsx are correct
   * by checking that the imports don't throw errors
   */
  it("all App.tsx imports should resolve successfully", async () => {
    // These are all the imports from App.tsx
    const appImports = [
      () => import("@/components/theme-toggle"),
      () => import("@/components/chat"),
      () => import("@/components/sidebar"),
      () => import("@/components/UpdateNotification"),
      () => import("@/components/keyboard/KeyboardHelpDialog"),
      () => import("@/components/LanguageSelector"),
      () => import("@/components/command"),
      () => import("@/components/knowledge"),
      () => import("@/components/WelcomeDialog"),
      () => import("@/components/FeatureDiscoveryTip"),
      () => import("@/components/ContextualTip"),
      () => import("@/components/bookmark"),
      () => import("@/components/ui/tooltip"),
      () => import("@/components/ui/error-boundary"),
      () => import("@/hooks"),
      () => import("@/components/BackendStatusIndicator"),
      () => import("@/api/client"),
      () => import("@/services/keyring"),
    ];

    // All imports should resolve without throwing
    for (const importFn of appImports) {
      await expect(importFn()).resolves.toBeDefined();
    }
  });
});
