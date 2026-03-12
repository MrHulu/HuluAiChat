/**
 * QuickActions Component Tests
 *
 * Tests for QuickActions UI component
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QuickActions } from "./QuickActions";
import type { QuickAction } from "@/data/quickActions";

// Mock i18next
vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: {
      changeLanguage: vi.fn(),
    },
  }),
}));

const mockAction1: QuickAction = {
  id: "translate",
  nameKey: "quickActions.translate.name",
  descriptionKey: "quickActions.translate.description",
  icon: "Languages",
  promptTemplate: "Translate the following text",
  category: "text",
};

const mockAction2: QuickAction = {
  id: "summarize",
  nameKey: "quickActions.summarize.name",
  descriptionKey: "quickActions.summarize.description",
  icon: "List",
  promptTemplate: "Summarize the following text",
  category: "text",
};

const mockActions = [mockAction1, mockAction2];

describe("QuickActions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should render all actions", () => {
    render(
      <QuickActions
        actions={mockActions}
        onActionSelect={vi.fn()}
      />
    );

    const buttons = screen.getAllByRole("button");
    expect(buttons).toHaveLength(2);
  });

  it("should call onActionSelect when clicked", async () => {
    const onActionSelect = vi.fn();

    render(
      <QuickActions
        actions={mockActions}
        onActionSelect={onActionSelect}
      />
    );

    const buttons = screen.getAllByRole("button");
    await userEvent.click(buttons[0]);

    expect(onActionSelect).toHaveBeenCalledWith(mockAction1);
  });

  it("should disable buttons when disabled prop is true", () => {
    render(
      <QuickActions
        actions={mockActions}
        onActionSelect={vi.fn()}
        disabled
      />
    );

    const buttons = screen.getAllByRole("button");
    buttons.forEach((btn) => {
      expect(btn).toBeDisabled();
    });
  });

  it("should show compact mode (5 actions max)", () => {
    const manyActions: QuickAction[] = [
      mockAction1,
      mockAction2,
      { id: "3", nameKey: "3", descriptionKey: "3", icon: "Star", promptTemplate: "3", category: "text" },
      { id: "4", nameKey: "4", descriptionKey: "4", icon: "Star", promptTemplate: "4", category: "text" },
      { id: "5", nameKey: "5", descriptionKey: "5", icon: "Star", promptTemplate: "5", category: "text" },
      { id: "6", nameKey: "6", descriptionKey: "6", icon: "Star", promptTemplate: "6", category: "text" },
    ];

    render(
      <QuickActions
        actions={manyActions}
        onActionSelect={vi.fn()}
        compact
      />
    );

    const buttons = screen.getAllByRole("button");
    expect(buttons).toHaveLength(5); // Only 5 shown in compact mode
  });

  it("should show all actions when not compact", () => {
    const manyActions: QuickAction[] = [
      mockAction1,
      mockAction2,
      { id: "3", nameKey: "3", descriptionKey: "3", icon: "Star", promptTemplate: "3", category: "text" },
      { id: "4", nameKey: "4", descriptionKey: "4", icon: "Star", promptTemplate: "4", category: "text" },
      { id: "5", nameKey: "5", descriptionKey: "5", icon: "Star", promptTemplate: "5", category: "text" },
      { id: "6", nameKey: "6", descriptionKey: "6", icon: "Star", promptTemplate: "6", category: "text" },
      { id: "7", nameKey: "7", descriptionKey: "7", icon: "Star", promptTemplate: "7", category: "text" },
      { id: "8", nameKey: "8", descriptionKey: "8", icon: "Star", promptTemplate: "8", category: "text" },
    ];

    render(
      <QuickActions
        actions={manyActions}
        onActionSelect={vi.fn()}
      />
    );

    const buttons = screen.getAllByRole("button");
    expect(buttons).toHaveLength(8); // All 8 shown when not compact
  });

  it("should handle empty actions", () => {
    render(
      <QuickActions
        actions={[]}
        onActionSelect={vi.fn()}
      />
    );

    expect(screen.queryByRole("button")).toBeNull();
  });
});
