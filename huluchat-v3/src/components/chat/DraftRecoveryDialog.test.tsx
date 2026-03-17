/**
 * DraftRecoveryDialog Tests
 *
 * TASK-326: Context Recovery
 * Tests for draft recovery dialog component
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { DraftRecoveryDialog } from "./DraftRecoveryDialog";
import type { DraftData } from "@/hooks/useDraftRecovery";

// Mock i18next
vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, options?: Record<string, unknown>) => {
      const translations: Record<string, string> = {
        "draftRecovery.title": "Recover Draft",
        "draftRecovery.description": `Found ${options?.count ?? 0} unsent draft(s)`,
        "draftRecovery.untitledSession": "Untitled Session",
        "draftRecovery.recover": "Recover",
        "draftRecovery.dismiss": "Dismiss",
        "draftRecovery.dismissAll": "Dismiss All",
        "draftRecovery.continueWithout": "Continue Without",
        "draftRecovery.justNow": "Just now",
        "draftRecovery.minutesAgo": `${options?.count ?? 0} minutes ago`,
        "draftRecovery.hoursAgo": `${options?.count ?? 0} hours ago`,
        "draftRecovery.daysAgo": `${options?.count ?? 0} days ago`,
        "draftRecovery.images": `${options?.count ?? 0} image(s)`,
        "draftRecovery.files": `${options?.count ?? 0} file(s)`,
      };
      return translations[key] ?? key;
    },
  }),
}));

describe("DraftRecoveryDialog", () => {
  const mockDrafts: DraftData[] = [
    {
      sessionId: "session-1",
      sessionTitle: "Test Session",
      content: "This is a test draft content",
      savedAt: new Date().toISOString(),
    },
    {
      sessionId: "session-2",
      sessionTitle: "Another Session",
      content: "Another test content that is quite long and should be truncated when displayed",
      savedAt: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
      images: ["image1.png"],
      files: ["file1.pdf"],
    },
  ];

  const defaultProps = {
    open: true,
    onOpenChange: vi.fn(),
    drafts: mockDrafts,
    onRecover: vi.fn(),
    onDismiss: vi.fn(),
    onDismissAll: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("rendering", () => {
    it("should return null when no drafts", () => {
      const { container } = render(
        <DraftRecoveryDialog {...defaultProps} drafts={[]} />
      );
      expect(container.firstChild).toBeNull();
    });

    it("should render dialog with title", () => {
      render(<DraftRecoveryDialog {...defaultProps} />);
      expect(screen.getByText("Recover Draft")).toBeInTheDocument();
    });

    it("should display draft count in description", () => {
      render(<DraftRecoveryDialog {...defaultProps} />);
      expect(screen.getByText("Found 2 unsent draft(s)")).toBeInTheDocument();
    });

    it("should display session titles", () => {
      render(<DraftRecoveryDialog {...defaultProps} />);
      expect(screen.getByText("Test Session")).toBeInTheDocument();
      expect(screen.getByText("Another Session")).toBeInTheDocument();
    });

    it("should display untitled session when no title", () => {
      const draftsWithoutTitle: DraftData[] = [
        {
          sessionId: "session-3",
          content: "Test content",
          savedAt: new Date().toISOString(),
        },
      ];
      render(<DraftRecoveryDialog {...defaultProps} drafts={draftsWithoutTitle} />);
      expect(screen.getByText("Untitled Session")).toBeInTheDocument();
    });

    it("should display draft content preview", () => {
      render(<DraftRecoveryDialog {...defaultProps} />);
      expect(screen.getByText("This is a test draft content")).toBeInTheDocument();
    });

    it("should display image and file counts", () => {
      render(<DraftRecoveryDialog {...defaultProps} />);
      expect(screen.getByText("1 image(s)")).toBeInTheDocument();
      expect(screen.getByText("1 file(s)")).toBeInTheDocument();
    });
  });

  describe("actions", () => {
    it("should call onRecover when recover button clicked", () => {
      render(<DraftRecoveryDialog {...defaultProps} />);

      const recoverButtons = screen.getAllByText("Recover");
      fireEvent.click(recoverButtons[0]);

      expect(defaultProps.onRecover).toHaveBeenCalledWith("session-1");
      expect(defaultProps.onOpenChange).toHaveBeenCalledWith(false);
    });

    it("should call onDismiss when dismiss button clicked", () => {
      render(<DraftRecoveryDialog {...defaultProps} />);

      // Dismiss buttons have sr-only text
      const dismissButtons = screen.getAllByRole("button", { name: /dismiss/i });
      fireEvent.click(dismissButtons[0]);

      expect(defaultProps.onDismiss).toHaveBeenCalledWith("session-1");
    });

    it("should call onDismissAll when dismiss all button clicked", () => {
      render(<DraftRecoveryDialog {...defaultProps} />);

      fireEvent.click(screen.getByText("Dismiss All"));

      expect(defaultProps.onDismissAll).toHaveBeenCalled();
      expect(defaultProps.onOpenChange).toHaveBeenCalledWith(false);
    });

    it("should close dialog when continue without button clicked", () => {
      render(<DraftRecoveryDialog {...defaultProps} />);

      fireEvent.click(screen.getByText("Continue Without"));

      expect(defaultProps.onOpenChange).toHaveBeenCalledWith(false);
    });
  });

  describe("time formatting", () => {
    it("should display just now for recent drafts", () => {
      const recentDraft: DraftData[] = [
        {
          sessionId: "session-recent",
          content: "Recent content",
          savedAt: new Date().toISOString(),
        },
      ];
      render(<DraftRecoveryDialog {...defaultProps} drafts={recentDraft} />);
      expect(screen.getByText("Just now")).toBeInTheDocument();
    });

    it("should display minutes ago for older drafts", () => {
      const olderDraft: DraftData[] = [
        {
          sessionId: "session-minutes",
          content: "Older content",
          savedAt: new Date(Date.now() - 1800000).toISOString(), // 30 min ago
        },
      ];
      render(<DraftRecoveryDialog {...defaultProps} drafts={olderDraft} />);
      expect(screen.getByText("30 minutes ago")).toBeInTheDocument();
    });

    it("should display hours ago for drafts from hours ago", () => {
      render(<DraftRecoveryDialog {...defaultProps} />);
      expect(screen.getByText("1 hours ago")).toBeInTheDocument();
    });
  });

  describe("accessibility", () => {
    it("should have recover button with icon", () => {
      render(<DraftRecoveryDialog {...defaultProps} />);
      const recoverButtons = screen.getAllByText("Recover");
      expect(recoverButtons.length).toBeGreaterThan(0);
    });

    it("should have dialog with proper structure", () => {
      render(<DraftRecoveryDialog {...defaultProps} />);
      expect(screen.getByRole("dialog")).toBeInTheDocument();
    });
  });
});
