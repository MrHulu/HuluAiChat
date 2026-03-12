/**
 * PermissionGuideDialog Component Tests
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { PermissionGuideDialog } from "./PermissionGuideDialog";
import type { PermissionStatus } from "@/hooks/useAccessibilityPermission";

// Mock react-i18next
vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        "permission.guide.title": "Accessibility Permission Required",
        "permission.guide.description": "Global shortcuts require Accessibility permission.",
        "permission.guide.whyNeeded": "macOS requires Accessibility permission for apps to respond to keyboard shortcuts.",
        "permission.guide.step1.title": "Open System Settings",
        "permission.guide.step1.description": "Click the button below to open macOS System Settings",
        "permission.guide.step2.title": "Navigate to Privacy & Security",
        "permission.guide.step2.description": "Go to Privacy & Security → Accessibility",
        "permission.guide.step3.title": "Enable HuluChat",
        "permission.guide.step3.description": "Find HuluChat in the list and enable the checkbox",
        "permission.guide.openSettings": "Open System Settings",
        "permission.guide.opening": "Opening...",
        "permission.guide.recheck": "Check Again",
        "permission.status.granted": "Permission granted",
        "permission.status.denied": "Permission not granted",
        "permission.status.checking": "Checking permission...",
        "permission.guide.remindLater": "Remind Later",
        "permission.guide.dontShowAgain": "Don't Show Again",
      };
      return translations[key] || key;
    },
  }),
}));

describe("PermissionGuideDialog", () => {
  const mockOnOpenChange = vi.fn();
  const mockOnOpenSettings = vi.fn().mockResolvedValue(undefined);
  const mockOnDismiss = vi.fn();
  const mockOnDismissPermanently = vi.fn();
  const mockOnRecheck = vi.fn();

  const defaultProps = {
    open: true,
    onOpenChange: mockOnOpenChange,
    status: "denied" as PermissionStatus,
    onOpenSettings: mockOnOpenSettings,
    onDismiss: mockOnDismiss,
    onDismissPermanently: mockOnDismissPermanently,
    onRecheck: mockOnRecheck,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should render when open", () => {
    render(<PermissionGuideDialog {...defaultProps} />);

    expect(screen.getByText("Accessibility Permission Required")).toBeInTheDocument();
    expect(screen.getByText("Global shortcuts require Accessibility permission.")).toBeInTheDocument();
  });

  it("should not render when closed", () => {
    render(<PermissionGuideDialog {...defaultProps} open={false} />);

    expect(screen.queryByText("Accessibility Permission Required")).not.toBeInTheDocument();
  });

  it("should show step-by-step guide", () => {
    render(<PermissionGuideDialog {...defaultProps} />);

    // Use getAllByText to handle multiple elements with same text
    expect(screen.getAllByText("Open System Settings").length).toBeGreaterThan(0);
    expect(screen.getByText("Navigate to Privacy & Security")).toBeInTheDocument();
    expect(screen.getByText("Enable HuluChat")).toBeInTheDocument();
  });

  it("should show correct status indicator for denied status", () => {
    render(<PermissionGuideDialog {...defaultProps} status="denied" />);

    expect(screen.getByText("Permission not granted")).toBeInTheDocument();
  });

  it("should show correct status indicator for granted status", () => {
    render(<PermissionGuideDialog {...defaultProps} status="granted" />);

    expect(screen.getByText("Permission granted")).toBeInTheDocument();
  });

  it("should show correct status indicator for checking status", () => {
    render(<PermissionGuideDialog {...defaultProps} status="checking" />);

    expect(screen.getByText("Checking permission...")).toBeInTheDocument();
  });

  it("should call onOpenSettings when Open Settings button is clicked", async () => {
    render(<PermissionGuideDialog {...defaultProps} />);

    // Use getAllByText and select the button (not the <p> tag)
    const openButtons = screen.getAllByText("Open System Settings");
    // The button should be one of them
    const button = openButtons.find(el => el.tagName === "BUTTON");
    expect(button).toBeDefined();
    fireEvent.click(button!);

    await waitFor(() => {
      expect(mockOnOpenSettings).toHaveBeenCalledTimes(1);
    });
  });

  it("should call onRecheck when Check Again button is clicked", () => {
    render(<PermissionGuideDialog {...defaultProps} />);

    const recheckButton = screen.getByText("Check Again");
    fireEvent.click(recheckButton);

    expect(mockOnRecheck).toHaveBeenCalledTimes(1);
  });

  it("should call onDismiss when Remind Later button is clicked", () => {
    render(<PermissionGuideDialog {...defaultProps} />);

    const dismissButton = screen.getByText("Remind Later");
    fireEvent.click(dismissButton);

    expect(mockOnDismiss).toHaveBeenCalledTimes(1);
  });

  it("should call onDismissPermanently when Don't Show Again button is clicked", () => {
    render(<PermissionGuideDialog {...defaultProps} />);

    const permanentDismissButton = screen.getByText("Don't Show Again");
    fireEvent.click(permanentDismissButton);

    expect(mockOnDismissPermanently).toHaveBeenCalledTimes(1);
  });

  it("should disable Check Again button when status is checking", () => {
    render(<PermissionGuideDialog {...defaultProps} status="checking" />);

    const recheckButton = screen.getByText("Check Again");
    expect(recheckButton).toBeDisabled();
  });

  it("should prevent closing when clicking outside", () => {
    render(<PermissionGuideDialog {...defaultProps} />);

    // Click outside the dialog (on the overlay)
    const overlay = document.querySelector("[role='presentation']");
    if (overlay) {
      fireEvent.pointerDown(overlay);
    }

    // onOpenChange should not be called
    expect(mockOnOpenChange).not.toHaveBeenCalled();
  });
});
