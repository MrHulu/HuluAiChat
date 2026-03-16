/**
 * UnsavedContentDialog Component Tests
 * TASK-351: 输入内容丢失警告测试
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { UnsavedContentDialog } from "./UnsavedContentDialog";

// Mock useTranslation
vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        "unsavedContent.title": "Unsaved Content",
        "unsavedContent.description": "You have unsaved content. Are you sure you want to leave?",
        "unsavedContent.discard": "Discard",
        "common.cancel": "Cancel",
      };
      return translations[key] || key;
    },
  }),
}));

describe("UnsavedContentDialog", () => {
  const mockOnOpenChange = vi.fn();
  const mockOnConfirm = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should render when open", () => {
    render(
      <UnsavedContentDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        onConfirm={mockOnConfirm}
      />
    );

    expect(screen.getByText("Unsaved Content")).toBeInTheDocument();
    expect(screen.getByText("You have unsaved content. Are you sure you want to leave?")).toBeInTheDocument();
  });

  it("should not render when closed", () => {
    render(
      <UnsavedContentDialog
        open={false}
        onOpenChange={mockOnOpenChange}
        onConfirm={mockOnConfirm}
      />
    );

    expect(screen.queryByText("Unsaved Content")).not.toBeInTheDocument();
  });

  it("should call onConfirm and close when Discard is clicked", () => {
    render(
      <UnsavedContentDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        onConfirm={mockOnConfirm}
      />
    );

    fireEvent.click(screen.getByText("Discard"));

    expect(mockOnConfirm).toHaveBeenCalledTimes(1);
    expect(mockOnOpenChange).toHaveBeenCalledWith(false);
  });

  it("should close when Cancel is clicked", () => {
    render(
      <UnsavedContentDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        onConfirm={mockOnConfirm}
      />
    );

    fireEvent.click(screen.getByText("Cancel"));

    expect(mockOnConfirm).not.toHaveBeenCalled();
    expect(mockOnOpenChange).toHaveBeenCalledWith(false);
  });
});
