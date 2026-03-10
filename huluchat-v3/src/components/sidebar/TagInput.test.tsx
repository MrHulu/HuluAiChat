import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TagInput } from "./TagInput";

// Mock i18next
vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        "tags.addTag": "Add tag",
        "tags.tag": "tag",
        "tags.suggestions": "Tag suggestions",
      };
      return translations[key] || key;
    },
  }),
}));

describe("TagInput", () => {
  const mockTags = ["work", "personal"];
  const mockOnAddTag = vi.fn();
  const mockOnRemoveTag = vi.fn();
  const mockExistingTags = ["work", "personal", "important", "project", "archive"];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("rendering", () => {
    it("renders existing tags", () => {
      render(
        <TagInput
          tags={mockTags}
          onAddTag={mockOnAddTag}
          onRemoveTag={mockOnRemoveTag}
        />
      );

      expect(screen.getByText("#work")).toBeInTheDocument();
      expect(screen.getByText("#personal")).toBeInTheDocument();
    });

    it("renders add button when under max tags", () => {
      render(
        <TagInput
          tags={mockTags}
          onAddTag={mockOnAddTag}
          onRemoveTag={mockOnRemoveTag}
          maxTags={5}
        />
      );

      expect(screen.getByRole("button", { name: /add tag/i })).toBeInTheDocument();
    });

    it("does not render add button when at max tags", () => {
      render(
        <TagInput
          tags={["work", "personal", "important", "project", "archive"]}
          onAddTag={mockOnAddTag}
          onRemoveTag={mockOnRemoveTag}
          maxTags={5}
        />
      );

      expect(screen.queryByRole("button", { name: /add tag/i })).not.toBeInTheDocument();
    });

    it("renders with empty tags array", () => {
      render(
        <TagInput
          tags={[]}
          onAddTag={mockOnAddTag}
          onRemoveTag={mockOnRemoveTag}
        />
      );

      expect(screen.getByRole("button", { name: /add tag/i })).toBeInTheDocument();
    });
  });

  describe("adding tags", () => {
    it("shows input when add button is clicked", async () => {
      const user = userEvent.setup();
      render(
        <TagInput
          tags={mockTags}
          onAddTag={mockOnAddTag}
          onRemoveTag={mockOnRemoveTag}
        />
      );

      await user.click(screen.getByRole("button", { name: /add tag/i }));

      expect(screen.getByRole("textbox", { name: /add tag/i })).toBeInTheDocument();
    });

    it("calls onAddTag when Enter is pressed", async () => {
      const user = userEvent.setup();
      render(
        <TagInput
          tags={[]}
          onAddTag={mockOnAddTag}
          onRemoveTag={mockOnRemoveTag}
        />
      );

      await user.click(screen.getByRole("button", { name: /add tag/i }));
      const input = screen.getByRole("textbox");
      await user.type(input, "newtag{Enter}");

      expect(mockOnAddTag).toHaveBeenCalledWith("newtag");
    });

    it("lowercases tag before adding", async () => {
      const user = userEvent.setup();
      render(
        <TagInput
          tags={[]}
          onAddTag={mockOnAddTag}
          onRemoveTag={mockOnRemoveTag}
        />
      );

      await user.click(screen.getByRole("button", { name: /add tag/i }));
      const input = screen.getByRole("textbox");
      await user.type(input, "NEWTAG{Enter}");

      expect(mockOnAddTag).toHaveBeenCalledWith("newtag");
    });

    it("does not add duplicate tags", async () => {
      const user = userEvent.setup();
      render(
        <TagInput
          tags={["work"]}
          onAddTag={mockOnAddTag}
          onRemoveTag={mockOnRemoveTag}
        />
      );

      await user.click(screen.getByRole("button", { name: /add tag/i }));
      const input = screen.getByRole("textbox");
      await user.type(input, "work{Enter}");

      expect(mockOnAddTag).not.toHaveBeenCalled();
    });

    it("does not add empty tags", async () => {
      const user = userEvent.setup();
      render(
        <TagInput
          tags={[]}
          onAddTag={mockOnAddTag}
          onRemoveTag={mockOnRemoveTag}
        />
      );

      await user.click(screen.getByRole("button", { name: /add tag/i }));
      const input = screen.getByRole("textbox");
      await user.type(input, "{Enter}");

      expect(mockOnAddTag).not.toHaveBeenCalled();
    });

    it("accepts tags with Chinese characters", async () => {
      const user = userEvent.setup();
      render(
        <TagInput
          tags={[]}
          onAddTag={mockOnAddTag}
          onRemoveTag={mockOnRemoveTag}
        />
      );

      await user.click(screen.getByRole("button", { name: /add tag/i }));
      const input = screen.getByRole("textbox");
      await user.type(input, "中文标签{Enter}");

      expect(mockOnAddTag).toHaveBeenCalledWith("中文标签");
    });

    it("accepts tags with underscores and hyphens", async () => {
      const user = userEvent.setup();
      render(
        <TagInput
          tags={[]}
          onAddTag={mockOnAddTag}
          onRemoveTag={mockOnRemoveTag}
        />
      );

      await user.click(screen.getByRole("button", { name: /add tag/i }));
      const input = screen.getByRole("textbox");
      await user.type(input, "my-tag_name{Enter}");

      expect(mockOnAddTag).toHaveBeenCalledWith("my-tag_name");
    });

    it("rejects tags with special characters", async () => {
      const user = userEvent.setup();
      render(
        <TagInput
          tags={[]}
          onAddTag={mockOnAddTag}
          onRemoveTag={mockOnRemoveTag}
        />
      );

      await user.click(screen.getByRole("button", { name: /add tag/i }));
      const input = screen.getByRole("textbox");
      await user.type(input, "tag!@#${Enter}");

      expect(mockOnAddTag).not.toHaveBeenCalled();
    });
  });

  describe("removing tags", () => {
    it("calls onRemoveTag when remove button is clicked", async () => {
      const user = userEvent.setup();
      render(
        <TagInput
          tags={mockTags}
          onAddTag={mockOnAddTag}
          onRemoveTag={mockOnRemoveTag}
        />
      );

      const removeButtons = screen.getAllByRole("button", { name: /remove/i });
      await user.click(removeButtons[0]);

      expect(mockOnRemoveTag).toHaveBeenCalledWith("work");
    });
  });

  describe("keyboard navigation", () => {
    it("hides input when Escape is pressed", async () => {
      const user = userEvent.setup();
      render(
        <TagInput
          tags={mockTags}
          onAddTag={mockOnAddTag}
          onRemoveTag={mockOnRemoveTag}
        />
      );

      await user.click(screen.getByRole("button", { name: /add tag/i }));
      const input = screen.getByRole("textbox");
      await user.type(input, "{Escape}");

      await waitFor(() => {
        expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
      });
    });
  });

  describe("suggestions", () => {
    it("shows suggestions when typing", async () => {
      const user = userEvent.setup();
      render(
        <TagInput
          tags={[]}
          onAddTag={mockOnAddTag}
          onRemoveTag={mockOnRemoveTag}
          existingTags={mockExistingTags}
        />
      );

      await user.click(screen.getByRole("button", { name: /add tag/i }));
      const input = screen.getByRole("textbox");
      await user.type(input, "imp");

      expect(screen.getByRole("listbox", { name: /suggestions/i })).toBeInTheDocument();
      expect(screen.getByRole("option", { name: /#important/i })).toBeInTheDocument();
    });

    it("filters suggestions by input", async () => {
      const user = userEvent.setup();
      render(
        <TagInput
          tags={[]}
          onAddTag={mockOnAddTag}
          onRemoveTag={mockOnRemoveTag}
          existingTags={mockExistingTags}
        />
      );

      await user.click(screen.getByRole("button", { name: /add tag/i }));
      const input = screen.getByRole("textbox");
      await user.type(input, "pro");

      const options = screen.getAllByRole("option");
      expect(options).toHaveLength(1);
      expect(options[0]).toHaveTextContent("#project");
    });

    it("excludes already added tags from suggestions", async () => {
      const user = userEvent.setup();
      render(
        <TagInput
          tags={["work"]}
          onAddTag={mockOnAddTag}
          onRemoveTag={mockOnRemoveTag}
          existingTags={mockExistingTags}
        />
      );

      await user.click(screen.getByRole("button", { name: /add tag/i }));
      const input = screen.getByRole("textbox");
      await user.type(input, "w");

      // "work" should not appear in suggestions since it's already added
      const options = screen.queryAllByRole("option");
      options.forEach(opt => {
        expect(opt).not.toHaveTextContent("#work");
      });
    });

    it("adds tag when suggestion is clicked", async () => {
      const user = userEvent.setup();
      render(
        <TagInput
          tags={[]}
          onAddTag={mockOnAddTag}
          onRemoveTag={mockOnRemoveTag}
          existingTags={mockExistingTags}
        />
      );

      await user.click(screen.getByRole("button", { name: /add tag/i }));
      const input = screen.getByRole("textbox");
      await user.type(input, "imp");

      await user.click(screen.getByRole("option", { name: /#important/i }));

      expect(mockOnAddTag).toHaveBeenCalledWith("important");
    });

    it("does not show suggestions when input is empty", async () => {
      const user = userEvent.setup();
      render(
        <TagInput
          tags={[]}
          onAddTag={mockOnAddTag}
          onRemoveTag={mockOnRemoveTag}
          existingTags={mockExistingTags}
        />
      );

      await user.click(screen.getByRole("button", { name: /add tag/i }));

      expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
    });
  });

  describe("animation", () => {
    it("has list enter animation on tag items", () => {
      render(
        <TagInput
          tags={mockTags}
          onAddTag={mockOnAddTag}
          onRemoveTag={mockOnRemoveTag}
        />
      );

      const tagWrappers = document.querySelectorAll(".animate-list-enter");
      expect(tagWrappers).toHaveLength(2);
    });

    it("has staggered animation delay on tags", () => {
      render(
        <TagInput
          tags={mockTags}
          onAddTag={mockOnAddTag}
          onRemoveTag={mockOnRemoveTag}
        />
      );

      const tagWrappers = document.querySelectorAll(".animate-list-enter");
      expect(tagWrappers[0]).toHaveStyle({ animationDelay: "0ms" });
      expect(tagWrappers[1]).toHaveStyle({ animationDelay: "50ms" });
    });

    it("has bounce animation on input container", async () => {
      const user = userEvent.setup();
      render(
        <TagInput
          tags={mockTags}
          onAddTag={mockOnAddTag}
          onRemoveTag={mockOnRemoveTag}
        />
      );

      await user.click(screen.getByRole("button", { name: /add tag/i }));

      const inputContainer = screen.getByRole("textbox").parentElement;
      expect(inputContainer).toHaveClass("animate-bounce-in");
    });

    it("has slide animation on suggestions", async () => {
      const user = userEvent.setup();
      render(
        <TagInput
          tags={[]}
          onAddTag={mockOnAddTag}
          onRemoveTag={mockOnRemoveTag}
          existingTags={mockExistingTags}
        />
      );

      await user.click(screen.getByRole("button", { name: /add tag/i }));
      const input = screen.getByRole("textbox");
      await user.type(input, "w");

      const listbox = screen.getByRole("listbox");
      expect(listbox).toHaveClass("animate-slide-down");
    });

    it("has slide animation on suggestion items", async () => {
      const user = userEvent.setup();
      render(
        <TagInput
          tags={[]}
          onAddTag={mockOnAddTag}
          onRemoveTag={mockOnRemoveTag}
          existingTags={mockExistingTags}
        />
      );

      await user.click(screen.getByRole("button", { name: /add tag/i }));
      const input = screen.getByRole("textbox");
      await user.type(input, "w");

      const options = screen.getAllByRole("option");
      options.forEach(opt => {
        expect(opt).toHaveClass("animate-slide-right");
      });
    });
  });

  describe("accessibility", () => {
    it("input has aria-label", async () => {
      const user = userEvent.setup();
      render(
        <TagInput
          tags={mockTags}
          onAddTag={mockOnAddTag}
          onRemoveTag={mockOnRemoveTag}
        />
      );

      await user.click(screen.getByRole("button", { name: /add tag/i }));

      const input = screen.getByRole("textbox");
      expect(input).toHaveAttribute("aria-label", "Add tag");
    });

    it("suggestions listbox has aria-label", async () => {
      const user = userEvent.setup();
      render(
        <TagInput
          tags={[]}
          onAddTag={mockOnAddTag}
          onRemoveTag={mockOnRemoveTag}
          existingTags={mockExistingTags}
        />
      );

      await user.click(screen.getByRole("button", { name: /add tag/i }));
      const input = screen.getByRole("textbox");
      await user.type(input, "imp");

      const listbox = screen.getByRole("listbox");
      expect(listbox).toHaveAttribute("aria-label", "Tag suggestions");
    });

    it("suggestion options have role option", async () => {
      const user = userEvent.setup();
      render(
        <TagInput
          tags={[]}
          onAddTag={mockOnAddTag}
          onRemoveTag={mockOnRemoveTag}
          existingTags={mockExistingTags}
        />
      );

      await user.click(screen.getByRole("button", { name: /add tag/i }));
      const input = screen.getByRole("textbox");
      await user.type(input, "imp");

      const options = screen.getAllByRole("option");
      expect(options.length).toBeGreaterThan(0);
    });

    it("add button has focus visible styles", () => {
      render(
        <TagInput
          tags={mockTags}
          onAddTag={mockOnAddTag}
          onRemoveTag={mockOnRemoveTag}
        />
      );

      const addButton = screen.getByRole("button", { name: /add tag/i });
      expect(addButton).toHaveClass("focus-visible:outline-none", "focus-visible:ring-1");
    });

    it("input has focus visible styles", async () => {
      const user = userEvent.setup();
      render(
        <TagInput
          tags={mockTags}
          onAddTag={mockOnAddTag}
          onRemoveTag={mockOnRemoveTag}
        />
      );

      await user.click(screen.getByRole("button", { name: /add tag/i }));

      const input = screen.getByRole("textbox");
      expect(input).toHaveClass("focus-visible:outline-none", "focus-visible:ring-1");
    });

    it("suggestion options have focus visible styles", async () => {
      const user = userEvent.setup();
      render(
        <TagInput
          tags={[]}
          onAddTag={mockOnAddTag}
          onRemoveTag={mockOnRemoveTag}
          existingTags={mockExistingTags}
        />
      );

      await user.click(screen.getByRole("button", { name: /add tag/i }));
      const input = screen.getByRole("textbox");
      await user.type(input, "imp");

      const options = screen.getAllByRole("option");
      options.forEach(opt => {
        expect(opt).toHaveClass("focus-visible:outline-none", "focus-visible:ring-1");
      });
    });
  });

  describe("dark mode styles", () => {
    it("add button has dark mode styles", () => {
      render(
        <TagInput
          tags={mockTags}
          onAddTag={mockOnAddTag}
          onRemoveTag={mockOnRemoveTag}
        />
      );

      const addButton = screen.getByRole("button", { name: /add tag/i });
      expect(addButton).toHaveClass(
        "dark:border-muted-foreground/25",
        "dark:hover:border-muted-foreground/40"
      );
    });

    it("input has dark mode styles", async () => {
      const user = userEvent.setup();
      render(
        <TagInput
          tags={mockTags}
          onAddTag={mockOnAddTag}
          onRemoveTag={mockOnRemoveTag}
        />
      );

      await user.click(screen.getByRole("button", { name: /add tag/i }));

      const input = screen.getByRole("textbox");
      expect(input).toHaveClass(
        "dark:border-muted-foreground/40",
        "dark:hover:border-muted-foreground/60"
      );
    });

    it("suggestions dropdown has dark mode styles", async () => {
      const user = userEvent.setup();
      render(
        <TagInput
          tags={[]}
          onAddTag={mockOnAddTag}
          onRemoveTag={mockOnRemoveTag}
          existingTags={mockExistingTags}
        />
      );

      await user.click(screen.getByRole("button", { name: /add tag/i }));
      const input = screen.getByRole("textbox");
      await user.type(input, "imp");

      const listbox = screen.getByRole("listbox");
      expect(listbox).toHaveClass(
        "dark:bg-popover/95",
        "dark:backdrop-blur-sm",
        "dark:border-white/10"
      );
    });

    it("suggestion options have dark mode styles", async () => {
      const user = userEvent.setup();
      render(
        <TagInput
          tags={[]}
          onAddTag={mockOnAddTag}
          onRemoveTag={mockOnRemoveTag}
          existingTags={mockExistingTags}
        />
      );

      await user.click(screen.getByRole("button", { name: /add tag/i }));
      const input = screen.getByRole("textbox");
      await user.type(input, "imp");

      const options = screen.getAllByRole("option");
      options.forEach(opt => {
        expect(opt).toHaveClass("dark:hover:bg-muted/60");
      });
    });
  });

  describe("transitions", () => {
    it("add button has transition classes", () => {
      render(
        <TagInput
          tags={mockTags}
          onAddTag={mockOnAddTag}
          onRemoveTag={mockOnRemoveTag}
        />
      );

      const addButton = screen.getByRole("button", { name: /add tag/i });
      expect(addButton).toHaveClass("transition-all", "duration-150", "ease-out");
    });

    it("input has transition classes", async () => {
      const user = userEvent.setup();
      render(
        <TagInput
          tags={mockTags}
          onAddTag={mockOnAddTag}
          onRemoveTag={mockOnRemoveTag}
        />
      );

      await user.click(screen.getByRole("button", { name: /add tag/i }));

      const input = screen.getByRole("textbox");
      expect(input).toHaveClass("transition-all", "duration-150");
    });

    it("suggestion options have transition classes", async () => {
      const user = userEvent.setup();
      render(
        <TagInput
          tags={[]}
          onAddTag={mockOnAddTag}
          onRemoveTag={mockOnRemoveTag}
          existingTags={mockExistingTags}
        />
      );

      await user.click(screen.getByRole("button", { name: /add tag/i }));
      const input = screen.getByRole("textbox");
      await user.type(input, "imp");

      const options = screen.getAllByRole("option");
      options.forEach(opt => {
        expect(opt).toHaveClass("transition-all", "duration-100");
      });
    });

    it("add button has active scale", () => {
      render(
        <TagInput
          tags={mockTags}
          onAddTag={mockOnAddTag}
          onRemoveTag={mockOnRemoveTag}
        />
      );

      const addButton = screen.getByRole("button", { name: /add tag/i });
      expect(addButton).toHaveClass("active:scale-95");
    });

    it("suggestion options have active scale", async () => {
      const user = userEvent.setup();
      render(
        <TagInput
          tags={[]}
          onAddTag={mockOnAddTag}
          onRemoveTag={mockOnRemoveTag}
          existingTags={mockExistingTags}
        />
      );

      await user.click(screen.getByRole("button", { name: /add tag/i }));
      const input = screen.getByRole("textbox");
      await user.type(input, "imp");

      const options = screen.getAllByRole("option");
      options.forEach(opt => {
        expect(opt).toHaveClass("active:scale-[0.98]");
      });
    });
  });
});
