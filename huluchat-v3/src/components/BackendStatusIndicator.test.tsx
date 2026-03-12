/**
 * BackendStatusIndicator Component Tests
 */
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { BackendStatusIndicator } from "./BackendStatusIndicator";
import { TooltipProvider } from "@/components/ui/tooltip";
import type { BackendStatus } from "@/hooks/useBackendHealth";

// Mock useTranslation
vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, params?: Record<string, string | number>) => {
      const translations: Record<string, string> = {
        "backend.healthy": "Backend Online",
        "backend.degraded": "Backend Degraded",
        "backend.offline": "Backend Offline",
        "backend.checking": "Checking...",
        "backend.retry": "Retry",
        "backend.restartAttempts": "Restart attempt {{current}}/{{max}}",
        "backend.manualRestart": "Manual Restart",
      };
      let result = translations[key] || key;
      // Replace {{param}} with actual values
      if (params) {
        Object.entries(params).forEach(([k, v]) => {
          result = result.replace(new RegExp(`\\{\\{${k}\\}\\}`, "g"), String(v));
        });
      }
      return result;
    },
  }),
}));

// Helper to render with TooltipProvider
const renderWithProviders = (ui: React.ReactNode) => {
  return render(<TooltipProvider>{ui}</TooltipProvider>);
};

describe("BackendStatusIndicator", () => {
  const defaultProps = {
    status: "healthy" as BackendStatus,
    version: "3.0.0",
    isRecovering: false,
    lastChecked: new Date(),
    onRetry: vi.fn(),
    restartAttempts: 0,
    maxRestartAttempts: 3,
    restartError: null,
    onManualRestart: undefined,
  };

  it("should render healthy status with green indicator", () => {
    renderWithProviders(<BackendStatusIndicator {...defaultProps} />);

    // Should have the status indicator with correct aria-label
    expect(screen.getByRole("status")).toBeInTheDocument();
    expect(screen.getByLabelText("Backend Online")).toBeInTheDocument();
  });

  it("should render degraded status with warning indicator", () => {
    renderWithProviders(<BackendStatusIndicator {...defaultProps} status="degraded" />);

    expect(screen.getByLabelText("Backend Degraded")).toBeInTheDocument();
  });

  it("should render offline status with error indicator", () => {
    renderWithProviders(<BackendStatusIndicator {...defaultProps} status="offline" />);

    expect(screen.getByLabelText("Backend Offline")).toBeInTheDocument();
  });

  it("should render checking status", () => {
    renderWithProviders(<BackendStatusIndicator {...defaultProps} status="checking" />);

    expect(screen.getByLabelText("Checking...")).toBeInTheDocument();
  });

  it("should apply custom className", () => {
    renderWithProviders(
      <BackendStatusIndicator {...defaultProps} className="custom-class" />
    );

    const indicator = screen.getByRole("status");
    expect(indicator).toHaveClass("custom-class");
  });

  it("should animate when offline", () => {
    renderWithProviders(<BackendStatusIndicator {...defaultProps} status="offline" />);

    const indicator = screen.getByRole("status");
    expect(indicator).toHaveClass("animate-pulse");
  });

  it("should animate when checking", () => {
    renderWithProviders(<BackendStatusIndicator {...defaultProps} status="checking" />);

    const indicator = screen.getByRole("status");
    // The icon should have animate-spin class
    expect(indicator.querySelector(".animate-spin")).toBeInTheDocument();
  });

  it("should animate when recovering", () => {
    renderWithProviders(
      <BackendStatusIndicator {...defaultProps} status="offline" isRecovering={true} />
    );

    const indicator = screen.getByRole("status");
    expect(indicator).toHaveClass("animate-pulse");
    expect(indicator.querySelector(".animate-spin")).toBeInTheDocument();
  });

  describe("compact mode", () => {
    it("should render compact mode by default", () => {
      renderWithProviders(<BackendStatusIndicator {...defaultProps} />);

      // In compact mode, only icon is shown
      expect(screen.getByRole("status")).toBeInTheDocument();
      // The label should NOT be directly visible (it's in tooltip)
      expect(screen.queryByText("Backend Online")).not.toBeInTheDocument();
    });

    it("should render full mode when compact is false", () => {
      renderWithProviders(<BackendStatusIndicator {...defaultProps} compact={false} />);

      // In full mode, label is shown directly
      expect(screen.getByText("Backend Online")).toBeInTheDocument();
    });
  });

  describe("status colors", () => {
    it("should have success color for healthy status", () => {
      renderWithProviders(<BackendStatusIndicator {...defaultProps} status="healthy" />);

      const indicator = screen.getByRole("status");
      expect(indicator.className).toContain("success");
    });

    it("should have warning color for degraded status", () => {
      renderWithProviders(<BackendStatusIndicator {...defaultProps} status="degraded" />);

      const indicator = screen.getByRole("status");
      expect(indicator.className).toContain("warning");
    });

    it("should have destructive color for offline status", () => {
      renderWithProviders(<BackendStatusIndicator {...defaultProps} status="offline" />);

      const indicator = screen.getByRole("status");
      expect(indicator.className).toContain("destructive");
    });
  });

  describe("accessibility", () => {
    it("should have aria-live set to polite", () => {
      renderWithProviders(<BackendStatusIndicator {...defaultProps} />);

      const indicator = screen.getByRole("status");
      expect(indicator).toHaveAttribute("aria-live", "polite");
    });

    it("should have correct aria-label for each status", () => {
      const statuses: Array<{ status: BackendStatus; label: string }> = [
        { status: "healthy", label: "Backend Online" },
        { status: "degraded", label: "Backend Degraded" },
        { status: "offline", label: "Backend Offline" },
        { status: "checking", label: "Checking..." },
      ];

      statuses.forEach(({ status, label }) => {
        const { unmount } = renderWithProviders(
          <BackendStatusIndicator {...defaultProps} status={status} />
        );

        expect(screen.getByLabelText(label)).toBeInTheDocument();
        unmount();
      });
    });
  });

  describe("sidecar health monitoring", () => {
    it("should show restart attempts when offline", () => {
      renderWithProviders(
        <BackendStatusIndicator
          {...defaultProps}
          status="offline"
          restartAttempts={2}
          maxRestartAttempts={3}
          compact={false}
        />
      );

      expect(screen.getByText("Restart attempt 2/3")).toBeInTheDocument();
    });

    it("should show restart error when provided", () => {
      renderWithProviders(
        <BackendStatusIndicator
          {...defaultProps}
          status="offline"
          restartError="Failed to restart backend"
          compact={false}
        />
      );

      expect(screen.getByText("Failed to restart backend")).toBeInTheDocument();
    });

    it("should show manual restart button when auto-restart exhausted", () => {
      const onManualRestart = vi.fn();
      renderWithProviders(
        <BackendStatusIndicator
          {...defaultProps}
          status="offline"
          restartAttempts={3}
          maxRestartAttempts={3}
          onManualRestart={onManualRestart}
          compact={false}
        />
      );

      expect(screen.getByText("Manual Restart")).toBeInTheDocument();
    });

    it("should call onManualRestart when clicked", () => {
      const onManualRestart = vi.fn();
      renderWithProviders(
        <BackendStatusIndicator
          {...defaultProps}
          status="offline"
          restartAttempts={3}
          maxRestartAttempts={3}
          onManualRestart={onManualRestart}
          compact={false}
        />
      );

      const button = screen.getByText("Manual Restart");
      fireEvent.click(button);

      expect(onManualRestart).toHaveBeenCalledOnce();
    });

    it("should not show manual restart button when attempts not exhausted", () => {
      const onManualRestart = vi.fn();
      renderWithProviders(
        <BackendStatusIndicator
          {...defaultProps}
          status="offline"
          restartAttempts={1}
          maxRestartAttempts={3}
          onManualRestart={onManualRestart}
          compact={false}
        />
      );

      expect(screen.queryByText("Manual Restart")).not.toBeInTheDocument();
    });

    it("should disable retry button when recovering", () => {
      renderWithProviders(
        <BackendStatusIndicator
          {...defaultProps}
          status="offline"
          isRecovering={true}
          compact={false}
        />
      );

      const retryButton = screen.getByText("Retry").closest("button");
      expect(retryButton).toBeDisabled();
    });
  });
});
