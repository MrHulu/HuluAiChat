/**
 * Sidebar Error Fallback Tests
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { SidebarErrorFallback } from "./sidebar-error-fallback";

// Mock i18n
vi.mock("@/i18n", () => ({
  default: {
    t: (key: string) => {
      const translations: Record<string, string> = {
        "errorBoundary.sidebarError": "Sidebar Error",
        "errorBoundary.sidebarErrorDesc": "Failed to load session list.",
        "errorBoundary.tryAgain": "Try Again",
      };
      return translations[key] || key;
    },
  },
}));

describe("SidebarErrorFallback", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders error message", () => {
    render(<SidebarErrorFallback />);

    expect(screen.getByText("Sidebar Error")).toBeInTheDocument();
    expect(screen.getByText("Failed to load session list.")).toBeInTheDocument();
  });

  it("renders Try Again button", () => {
    render(<SidebarErrorFallback />);

    expect(screen.getByText("Try Again")).toBeInTheDocument();
  });

  it("calls onReset when Try Again is clicked", () => {
    const onReset = vi.fn();
    render(<SidebarErrorFallback onReset={onReset} />);

    fireEvent.click(screen.getByText("Try Again"));
    expect(onReset).toHaveBeenCalledTimes(1);
  });

  it("has role='alert' for accessibility", () => {
    render(<SidebarErrorFallback />);

    expect(screen.getByRole("alert")).toBeInTheDocument();
  });
});
