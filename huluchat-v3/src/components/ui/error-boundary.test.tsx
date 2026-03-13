/**
 * ErrorBoundary Component Tests
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ErrorBoundary, withErrorBoundary } from "./error-boundary";

// Mock i18n
vi.mock("@/i18n", () => ({
  default: {
    t: (key: string) => {
      const translations: Record<string, string> = {
        "errorBoundary.title": "Something went wrong",
        "errorBoundary.description": "An unexpected error occurred. Please try again.",
        "errorBoundary.tryAgain": "Try Again",
        "errorBoundary.goHome": "Go Home",
        "errorBoundary.exportLogs": "Export Logs",
        "errorBoundary.helpText": "Error details are saved locally.",
      };
      return translations[key] || key;
    },
  },
}));

// Mock errorLogger
vi.mock("@/utils/errorLogger", () => ({
  logError: vi.fn(),
  exportErrorLogs: vi.fn(() => "[]"),
  clearErrorLogs: vi.fn(),
}));

// Suppress console.error for cleaner test output
const originalError = console.error;

beforeEach(() => {
  console.error = vi.fn();
});

afterEach(() => {
  console.error = originalError;
});

// Component that throws an error
function ThrowError({ shouldThrow }: { shouldThrow: boolean }) {
  if (shouldThrow) {
    throw new Error("Test error");
  }
  return <div>No error</div>;
}

describe("ErrorBoundary", () => {
  describe("normal rendering", () => {
    it("renders children when no error", () => {
      render(
        <ErrorBoundary>
          <div>Test content</div>
        </ErrorBoundary>
      );

      expect(screen.getByText("Test content")).toBeInTheDocument();
    });

    it("does not show error UI when no error", () => {
      render(
        <ErrorBoundary>
          <div>Safe content</div>
        </ErrorBoundary>
      );

      expect(screen.queryByText("Something went wrong")).not.toBeInTheDocument();
    });
  });

  describe("error handling", () => {
    it("catches errors and displays fallback UI", () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      expect(screen.getByText("Something went wrong")).toBeInTheDocument();
      expect(screen.getByText("An unexpected error occurred. Please try again.")).toBeInTheDocument();
    });

    it("hides children when error occurs", () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      expect(screen.queryByText("No error")).not.toBeInTheDocument();
    });

    it("displays error icon", () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      // AlertTriangle icon should be present
      const iconContainer = screen.getByRole("alert").querySelector("svg");
      expect(iconContainer).toBeInTheDocument();
    });
  });

  describe("custom fallback", () => {
    it("renders custom fallback when provided", () => {
      render(
        <ErrorBoundary fallback={<div>Custom error message</div>}>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      expect(screen.getByText("Custom error message")).toBeInTheDocument();
      expect(screen.queryByText("Something went wrong")).not.toBeInTheDocument();
    });
  });

  describe("actions", () => {
    it("renders Try Again button", () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      expect(screen.getByText("Try Again")).toBeInTheDocument();
    });

    it("renders Go Home button", () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      expect(screen.getByText("Go Home")).toBeInTheDocument();
    });

    it("calls onReset when Try Again is clicked", () => {
      const onReset = vi.fn();

      render(
        <ErrorBoundary onReset={onReset}>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      fireEvent.click(screen.getByText("Try Again"));
      expect(onReset).toHaveBeenCalledTimes(1);
    });

    it("clears error state when Try Again is clicked", () => {
      // Use a controlled component to test error boundary reset
      let shouldThrow = true;

      const ControlledErrorComponent = () => {
        if (shouldThrow) {
          throw new Error("Test error");
        }
        return <div>No error</div>;
      };

      const { rerender } = render(
        <ErrorBoundary
          onReset={() => {
            shouldThrow = false;
          }}
        >
          <ControlledErrorComponent />
        </ErrorBoundary>
      );

      // Error UI should be visible
      expect(screen.getByText("Something went wrong")).toBeInTheDocument();

      // Click Try Again - this triggers onReset which sets shouldThrow to false
      fireEvent.click(screen.getByText("Try Again"));

      // Rerender to reflect the state change
      rerender(
        <ErrorBoundary
          onReset={() => {
            shouldThrow = false;
          }}
        >
          <ControlledErrorComponent />
        </ErrorBoundary>
      );

      // Children should now be visible
      expect(screen.getByText("No error")).toBeInTheDocument();
    });

    it("sets location.href when Go Home is clicked", () => {
      // Mock window.location.href setter
      const originalLocation = window.location;
      // @ts-expect-error - Mocking window.location
      delete window.location;
      window.location = { href: "" } as Location;

      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      fireEvent.click(screen.getByText("Go Home"));
      expect(window.location.href).toBe("/");

      // Restore
      window.location = originalLocation;
    });
  });

  describe("accessibility", () => {
    it("has role='alert' on error container", () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      expect(screen.getByRole("alert")).toBeInTheDocument();
    });
  });

  describe("error logging", () => {
    it("renders Export Logs button", () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      expect(screen.getByText("Export Logs")).toBeInTheDocument();
    });

    it("displays help text", () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      expect(screen.getByText("Error details are saved locally.")).toBeInTheDocument();
    });
  });
});

describe("withErrorBoundary HOC", () => {
  it("wraps component with ErrorBoundary", () => {
    const SafeComponent = withErrorBoundary(ThrowError);

    render(<SafeComponent shouldThrow={false} />);

    expect(screen.getByText("No error")).toBeInTheDocument();
  });

  it("catches errors in wrapped component", () => {
    const SafeComponent = withErrorBoundary(ThrowError);

    render(<SafeComponent shouldThrow={true} />);

    expect(screen.getByText("Something went wrong")).toBeInTheDocument();
  });

  it("accepts errorBoundaryProps", () => {
    const CustomFallback = () => <div>Custom fallback</div>;
    const SafeComponent = withErrorBoundary(ThrowError, {
      fallback: <CustomFallback />,
    });

    render(<SafeComponent shouldThrow={true} />);

    expect(screen.getByText("Custom fallback")).toBeInTheDocument();
  });

  it("preserves component display name", () => {
    const NamedComponent = () => <div>Named</div>;
    NamedComponent.displayName = "NamedComponent";

    const Wrapped = withErrorBoundary(NamedComponent);
    expect(Wrapped.displayName).toBe("WithErrorBoundary(NamedComponent)");
  });

  it("uses component name when displayName is not set", () => {
    const SimpleComponent = function SimpleComponent() {
      return <div>Simple</div>;
    };

    const Wrapped = withErrorBoundary(SimpleComponent);
    // Component name may have a suffix in test environment
    expect(Wrapped.displayName).toMatch(/WithErrorBoundary\(SimpleComponent\d*\)/);
  });
});
