import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TagFilter } from "./TagFilter";

// Mock i18next
vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, options?: Record<string, unknown>) => {
      const translations: Record<string, string> = {
        "tags.filterByTag": "Filter by tag",
        "tags.selected": "selected",
        "tags.filterActive": `Filter active (${options?.count || 0})`,
        "tags.clearSelection": "Clear selection",
        "tags.clear": "Clear",
        "tags.selectTag": `Select #${options?.tag || ""}`,
        "tags.deselectTag": `Deselect #${options?.tag || ""}`,
      };
      return translations[key] || key;
    },
  }),
}));

describe("TagFilter", () => {
  const mockAllTags = ["work", "personal", "important"];
  const mockOnTagSelect = vi.fn();
  const mockOnClearSelection = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("rendering", () => {
    it("returns null when no tags available", () => {
      const { container } = render(
        <TagFilter
          allTags={[]}
          selectedTags={[]}
          onTagSelect={mockOnTagSelect}
          onClearSelection={mockOnClearSelection}
        />
      );
      expect(container.firstChild).toBeNull();
    });

    it("renders trigger button when tags are available", () => {
      render(
        <TagFilter
          allTags={mockAllTags}
          selectedTags={[]}
          onTagSelect={mockOnTagSelect}
          onClearSelection={mockOnClearSelection}
        />
      );
      expect(screen.getByRole("button", { name: /filter by tag/i })).toBeInTheDocument();
    });

    it("renders tag icon in trigger button", () => {
      render(
        <TagFilter
          allTags={mockAllTags}
          selectedTags={[]}
          onTagSelect={mockOnTagSelect}
          onClearSelection={mockOnClearSelection}
        />
      );
      const icon = screen.getByRole("button", { name: /filter by tag/i }).querySelector("svg");
      expect(icon).toBeInTheDocument();
      expect(icon).toHaveAttribute("aria-hidden", "true");
    });

    it("renders with default inactive styles", () => {
      render(
        <TagFilter
          allTags={mockAllTags}
          selectedTags={[]}
          onTagSelect={mockOnTagSelect}
          onClearSelection={mockOnClearSelection}
        />
      );
      const trigger = screen.getByRole("button", { name: /filter by tag/i });
      expect(trigger).toHaveClass("bg-transparent", "border-border");
    });
  });

  describe("selected state", () => {
    it("shows selected count when tags are selected", () => {
      render(
        <TagFilter
          allTags={mockAllTags}
          selectedTags={["work", "personal"]}
          onTagSelect={mockOnTagSelect}
          onClearSelection={mockOnClearSelection}
        />
      );
      expect(screen.getByText("2 selected")).toBeInTheDocument();
    });

    it("shows active styles when tags are selected", () => {
      render(
        <TagFilter
          allTags={mockAllTags}
          selectedTags={["work"]}
          onTagSelect={mockOnTagSelect}
          onClearSelection={mockOnClearSelection}
        />
      );
      const trigger = screen.getByRole("button", { name: /filter active/i });
      expect(trigger).toHaveClass("bg-primary/10", "border-primary/30");
    });

    it("updates aria-label when tags are selected", () => {
      render(
        <TagFilter
          allTags={mockAllTags}
          selectedTags={["work"]}
          onTagSelect={mockOnTagSelect}
          onClearSelection={mockOnClearSelection}
        />
      );
      expect(screen.getByRole("button", { name: /filter active \(1\)/i })).toBeInTheDocument();
    });
  });

  describe("dropdown interaction", () => {
    it("opens dropdown when trigger is clicked", async () => {
      const user = userEvent.setup();
      render(
        <TagFilter
          allTags={mockAllTags}
          selectedTags={[]}
          onTagSelect={mockOnTagSelect}
          onClearSelection={mockOnClearSelection}
        />
      );

      await user.click(screen.getByRole("button", { name: /filter by tag/i }));

      await waitFor(() => {
        expect(screen.getByText("#work")).toBeInTheDocument();
      });
    });

    it("sets aria-expanded to true when open", async () => {
      const user = userEvent.setup();
      render(
        <TagFilter
          allTags={mockAllTags}
          selectedTags={[]}
          onTagSelect={mockOnTagSelect}
          onClearSelection={mockOnClearSelection}
        />
      );

      const trigger = screen.getByRole("button", { name: /filter by tag/i });
      expect(trigger).toHaveAttribute("aria-expanded", "false");

      await user.click(trigger);

      await waitFor(() => {
        expect(trigger).toHaveAttribute("aria-expanded", "true");
      });
    });

    it("sets aria-haspopup to true", () => {
      render(
        <TagFilter
          allTags={mockAllTags}
          selectedTags={[]}
          onTagSelect={mockOnTagSelect}
          onClearSelection={mockOnClearSelection}
        />
      );

      const trigger = screen.getByRole("button", { name: /filter by tag/i });
      expect(trigger).toHaveAttribute("aria-haspopup", "true");
    });
  });

  describe("tag selection", () => {
    it("renders all tags in dropdown", async () => {
      const user = userEvent.setup();
      render(
        <TagFilter
          allTags={mockAllTags}
          selectedTags={[]}
          onTagSelect={mockOnTagSelect}
          onClearSelection={mockOnClearSelection}
        />
      );

      await user.click(screen.getByRole("button", { name: /filter by tag/i }));

      await waitFor(() => {
        expect(screen.getByRole("button", { name: /select #work/i })).toBeInTheDocument();
        expect(screen.getByRole("button", { name: /select #personal/i })).toBeInTheDocument();
        expect(screen.getByRole("button", { name: /select #important/i })).toBeInTheDocument();
      });
    });

    it("calls onTagSelect when a tag is clicked", async () => {
      const user = userEvent.setup();
      render(
        <TagFilter
          allTags={mockAllTags}
          selectedTags={[]}
          onTagSelect={mockOnTagSelect}
          onClearSelection={mockOnClearSelection}
        />
      );

      await user.click(screen.getByRole("button", { name: /filter by tag/i }));

      await waitFor(async () => {
        await user.click(screen.getByRole("button", { name: /select #work/i }));
      });

      expect(mockOnTagSelect).toHaveBeenCalledWith("work");
    });

    it("shows selected tag with active styles", async () => {
      const user = userEvent.setup();
      render(
        <TagFilter
          allTags={mockAllTags}
          selectedTags={["work"]}
          onTagSelect={mockOnTagSelect}
          onClearSelection={mockOnClearSelection}
        />
      );

      await user.click(screen.getByRole("button", { name: /filter active/i }));

      await waitFor(() => {
        const tagButton = screen.getByRole("button", { name: /deselect #work/i });
        expect(tagButton).toHaveClass("bg-primary/20", "border-primary/30");
      });
    });

    it("shows deselect aria-label for selected tags", async () => {
      const user = userEvent.setup();
      render(
        <TagFilter
          allTags={mockAllTags}
          selectedTags={["work"]}
          onTagSelect={mockOnTagSelect}
          onClearSelection={mockOnClearSelection}
        />
      );

      await user.click(screen.getByRole("button", { name: /filter active/i }));

      await waitFor(() => {
        expect(screen.getByRole("button", { name: /deselect #work/i })).toBeInTheDocument();
      });
    });

    it("sets aria-pressed on tag buttons", async () => {
      const user = userEvent.setup();
      render(
        <TagFilter
          allTags={mockAllTags}
          selectedTags={["work"]}
          onTagSelect={mockOnTagSelect}
          onClearSelection={mockOnClearSelection}
        />
      );

      await user.click(screen.getByRole("button", { name: /filter active/i }));

      await waitFor(() => {
        const tagButton = screen.getByRole("button", { name: /deselect #work/i });
        expect(tagButton).toHaveAttribute("aria-pressed", "true");
      });
    });
  });

  describe("clear selection", () => {
    it("shows clear button when tags are selected", async () => {
      const user = userEvent.setup();
      render(
        <TagFilter
          allTags={mockAllTags}
          selectedTags={["work"]}
          onTagSelect={mockOnTagSelect}
          onClearSelection={mockOnClearSelection}
        />
      );

      await user.click(screen.getByRole("button", { name: /filter active/i }));

      await waitFor(() => {
        expect(screen.getByRole("button", { name: /clear/i })).toBeInTheDocument();
      });
    });

    it("does not show clear button when no tags selected", async () => {
      const user = userEvent.setup();
      render(
        <TagFilter
          allTags={mockAllTags}
          selectedTags={[]}
          onTagSelect={mockOnTagSelect}
          onClearSelection={mockOnClearSelection}
        />
      );

      await user.click(screen.getByRole("button", { name: /filter by tag/i }));

      await waitFor(() => {
        expect(screen.getByText("#work")).toBeInTheDocument();
      });

      expect(screen.queryByRole("button", { name: /clear/i })).not.toBeInTheDocument();
    });

    it("calls onClearSelection when clear is clicked", async () => {
      const user = userEvent.setup();
      render(
        <TagFilter
          allTags={mockAllTags}
          selectedTags={["work"]}
          onTagSelect={mockOnTagSelect}
          onClearSelection={mockOnClearSelection}
        />
      );

      await user.click(screen.getByRole("button", { name: /filter active/i }));

      await waitFor(async () => {
        await user.click(screen.getByRole("button", { name: /clear/i }));
      });

      expect(mockOnClearSelection).toHaveBeenCalledTimes(1);
    });
  });

  describe("animation", () => {
    it("has list enter animation on tag buttons", async () => {
      const user = userEvent.setup();
      render(
        <TagFilter
          allTags={mockAllTags}
          selectedTags={[]}
          onTagSelect={mockOnTagSelect}
          onClearSelection={mockOnClearSelection}
        />
      );

      await user.click(screen.getByRole("button", { name: /filter by tag/i }));

      await waitFor(() => {
        const tagButton = screen.getByRole("button", { name: /select #work/i });
        expect(tagButton).toHaveClass("animate-list-enter");
      });
    });

    it("has staggered animation delay on tag buttons", async () => {
      const user = userEvent.setup();
      render(
        <TagFilter
          allTags={mockAllTags}
          selectedTags={[]}
          onTagSelect={mockOnTagSelect}
          onClearSelection={mockOnClearSelection}
        />
      );

      await user.click(screen.getByRole("button", { name: /filter by tag/i }));

      await waitFor(() => {
        const workButton = screen.getByRole("button", { name: /select #work/i });
        const personalButton = screen.getByRole("button", { name: /select #personal/i });
        const importantButton = screen.getByRole("button", { name: /select #important/i });

        expect(workButton).toHaveStyle({ animationDelay: "0ms" });
        expect(personalButton).toHaveStyle({ animationDelay: "50ms" });
        expect(importantButton).toHaveStyle({ animationDelay: "100ms" });
      });
    });

    it("has hover rotate animation on icon", () => {
      render(
        <TagFilter
          allTags={mockAllTags}
          selectedTags={[]}
          onTagSelect={mockOnTagSelect}
          onClearSelection={mockOnClearSelection}
        />
      );

      const icon = screen.getByRole("button", { name: /filter by tag/i }).querySelector("svg");
      expect(icon).toHaveClass("group-hover:rotate-12");
    });

    it("has active scale animation on trigger", () => {
      render(
        <TagFilter
          allTags={mockAllTags}
          selectedTags={[]}
          onTagSelect={mockOnTagSelect}
          onClearSelection={mockOnClearSelection}
        />
      );

      const trigger = screen.getByRole("button", { name: /filter by tag/i });
      expect(trigger).toHaveClass("active:scale-[0.97]");
    });

    it("has active scale animation on tag buttons", async () => {
      const user = userEvent.setup();
      render(
        <TagFilter
          allTags={mockAllTags}
          selectedTags={[]}
          onTagSelect={mockOnTagSelect}
          onClearSelection={mockOnClearSelection}
        />
      );

      await user.click(screen.getByRole("button", { name: /filter by tag/i }));

      await waitFor(() => {
        const tagButton = screen.getByRole("button", { name: /select #work/i });
        expect(tagButton).toHaveClass("active:scale-95");
      });
    });
  });

  describe("accessibility", () => {
    it("trigger has focus visible styles", () => {
      render(
        <TagFilter
          allTags={mockAllTags}
          selectedTags={[]}
          onTagSelect={mockOnTagSelect}
          onClearSelection={mockOnClearSelection}
        />
      );

      const trigger = screen.getByRole("button", { name: /filter by tag/i });
      expect(trigger).toHaveClass("focus-visible:outline-none", "focus-visible:ring-2");
    });

    it("tag buttons have focus visible styles", async () => {
      const user = userEvent.setup();
      render(
        <TagFilter
          allTags={mockAllTags}
          selectedTags={[]}
          onTagSelect={mockOnTagSelect}
          onClearSelection={mockOnClearSelection}
        />
      );

      await user.click(screen.getByRole("button", { name: /filter by tag/i }));

      await waitFor(() => {
        const tagButton = screen.getByRole("button", { name: /select #work/i });
        expect(tagButton).toHaveClass("focus-visible:outline-none", "focus-visible:ring-1");
      });
    });

    it("clear button has focus visible styles", async () => {
      const user = userEvent.setup();
      render(
        <TagFilter
          allTags={mockAllTags}
          selectedTags={["work"]}
          onTagSelect={mockOnTagSelect}
          onClearSelection={mockOnClearSelection}
        />
      );

      await user.click(screen.getByRole("button", { name: /filter active/i }));

      await waitFor(() => {
        const clearButton = screen.getByRole("button", { name: /clear/i });
        expect(clearButton).toHaveClass("focus-visible:outline-none", "focus-visible:ring-1");
      });
    });
  });

  describe("dark mode styles", () => {
    it("has dark mode styles for inactive trigger", () => {
      render(
        <TagFilter
          allTags={mockAllTags}
          selectedTags={[]}
          onTagSelect={mockOnTagSelect}
          onClearSelection={mockOnClearSelection}
        />
      );

      const trigger = screen.getByRole("button", { name: /filter by tag/i });
      expect(trigger).toHaveClass("dark:border-border/60", "dark:hover:bg-muted/40");
    });

    it("has dark mode styles for active trigger", () => {
      render(
        <TagFilter
          allTags={mockAllTags}
          selectedTags={["work"]}
          onTagSelect={mockOnTagSelect}
          onClearSelection={mockOnClearSelection}
        />
      );

      const trigger = screen.getByRole("button", { name: /filter active/i });
      expect(trigger).toHaveClass("dark:bg-primary/20", "dark:border-primary/40");
    });
  });

  describe("transitions", () => {
    it("has transition classes on trigger", () => {
      render(
        <TagFilter
          allTags={mockAllTags}
          selectedTags={[]}
          onTagSelect={mockOnTagSelect}
          onClearSelection={mockOnClearSelection}
        />
      );

      const trigger = screen.getByRole("button", { name: /filter by tag/i });
      expect(trigger).toHaveClass("transition-all", "duration-200", "ease-out");
    });

    it("has transition classes on tag buttons", async () => {
      const user = userEvent.setup();
      render(
        <TagFilter
          allTags={mockAllTags}
          selectedTags={[]}
          onTagSelect={mockOnTagSelect}
          onClearSelection={mockOnClearSelection}
        />
      );

      await user.click(screen.getByRole("button", { name: /filter by tag/i }));

      await waitFor(() => {
        const tagButton = screen.getByRole("button", { name: /select #work/i });
        expect(tagButton).toHaveClass("transition-all", "duration-200", "ease-out");
      });
    });
  });
});
