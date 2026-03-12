/**
 * Integration Test Utilities
 *
 * These utilities help verify that components are properly integrated
 * into the application, preventing issues like "component exists but is never used".
 *
 * Integration tests differ from unit tests:
 * - Unit tests: Test a component in isolation with mocked dependencies
 * - Integration tests: Test components working together with real dependencies
 */

import { render, RenderOptions, RenderResult } from "@testing-library/react";
import { ReactElement, ReactNode } from "react";
import { I18nextProvider } from "react-i18next";
import { describe, beforeAll, afterAll, expect } from "vitest";

// Import the i18n instance from test setup (already configured in setup.ts)
// This ensures we use the same i18n configuration as unit tests
declare global {
  var testI18n: import("i18next").i18n | undefined;
}

/**
 * Wrapper component for integration tests
 * Uses the global i18n instance from test setup
 */
function IntegrationTestWrapper({ children }: { children: ReactNode }) {
  // Use the i18n instance from test setup if available
  const i18nInstance = globalThis.testI18n;
  if (i18nInstance) {
    return <I18nextProvider i18n={i18nInstance}>{children}</I18nextProvider>;
  }
  return <>{children}</>;
}

/**
 * Custom render function for integration tests
 * Includes all necessary providers that the app uses
 *
 * @example
 * ```tsx
 * import { renderIntegration } from "./utils";
 * import { BackendStatusIndicator } from "@/components/BackendStatusIndicator";
 *
 * test("should render in app context", () => {
 *   const { getByRole } = renderIntegration(<BackendStatusIndicator />);
 *   expect(getByRole("status")).toBeDefined();
 * });
 * ```
 */
export function renderIntegration<Element extends ReactElement>(
  ui: Element,
  options?: Omit<RenderOptions, "wrapper">
): RenderResult {
  return render(ui, {
    wrapper: IntegrationTestWrapper,
    ...options,
  });
}

/**
 * Check if a component file exists and is exported
 * This is a compile-time check - if the import fails, the test fails
 *
 * @example
 * ```tsx
 * import { verifyComponentExists } from "./utils";
 * import { BackendStatusIndicator } from "@/components/BackendStatusIndicator";
 *
 * test("component exists", () => {
 *   verifyComponentExists(BackendStatusIndicator, "BackendStatusIndicator");
 * });
 * ```
 */
export function verifyComponentExists(
  component: unknown,
  componentName: string
): void {
  expect(component).toBeDefined();
  expect(typeof component).toBe("function");
  expect(componentName).toBeTruthy();
}

/**
 * Integration test metadata
 */
export interface IntegrationTestMeta {
  /** Name of the component being tested */
  componentName: string;
  /** Description of what integration is being tested */
  description: string;
  /** Related components that should be tested together */
  relatedComponents?: string[];
}

/**
 * Create a describe block for integration tests
 * Includes metadata and setup
 *
 * @example
 * ```tsx
 * describeIntegration(
 *   "BackendStatusIndicator",
 *   "Integration with App.tsx header",
 *   () => {
 *     test("is imported in App.tsx", async () => {
 *       // Test code here
 *     });
 *   }
 * );
 * ```
 */
export function describeIntegration(
  componentName: string,
  description: string,
  tests: () => void
): void {
  describe(`${componentName} Integration: ${description}`, () => {
    beforeAll(() => {
      // Any global setup needed for integration tests
    });

    afterAll(() => {
      // Any cleanup needed
    });

    tests();
  });
}

/**
 * Re-export testing library utilities for convenience
 */
export { screen, fireEvent, waitFor, within } from "@testing-library/react";
export { userEvent } from "@testing-library/user-event";
