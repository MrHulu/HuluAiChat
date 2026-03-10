import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SessionTag } from "./SessionTag";

/**
 * Helper to get the outer tag span (the one with aria-label)
 * The structure is: <span aria-label> <span> #text </span> </span>
 */
function getOuterTag(name: string) {
  return screen.getByRole("generic", { name });
}

describe("SessionTag", () => {
  describe("rendering", () => {
    it("renders tag name with hash prefix", () => {
      render(<SessionTag name="work" />);
      expect(screen.getByText("#work")).toBeInTheDocument();
    });

    it("renders with xs size by default", () => {
      render(<SessionTag name="test" />);
      const tag = getOuterTag("#test");
      expect(tag).toHaveClass("text-[10px]");
    });

    it("renders with sm size when specified", () => {
      render(<SessionTag name="test" size="sm" />);
      const tag = getOuterTag("#test");
      expect(tag).toHaveClass("text-xs");
    });

    it("truncates long tag names", () => {
      render(<SessionTag name="very-long-tag-name-that-should-be-truncated" />);
      const tagText = screen.getByText(/#very-long-tag/);
      expect(tagText).toHaveClass("truncate", "max-w-[60px]");
    });
  });

  describe("active state", () => {
    it("does not show active state by default", () => {
      render(<SessionTag name="work" />);
      const tag = getOuterTag("#work");
      expect(tag).toHaveClass("bg-muted/50");
      expect(tag).not.toHaveClass("bg-primary/20");
    });

    it("shows active state when isActive is true", () => {
      render(<SessionTag name="work" isActive />);
      const tag = getOuterTag(/#work.*active/i);
      expect(tag).toHaveClass("bg-primary/20", "border-primary/30");
    });

    it("includes active state in aria-label", () => {
      render(<SessionTag name="work" isActive />);
      const tag = screen.getByRole("generic", { name: /#work.*active/i });
      expect(tag).toBeInTheDocument();
    });

    it("sets aria-pressed when active", () => {
      render(<SessionTag name="work" isActive onClick={() => {}} />);
      const tag = screen.getByRole("button", { name: /#work/ });
      expect(tag).toHaveAttribute("aria-pressed", "true");
    });

    it("sets aria-pressed to false when not active", () => {
      render(<SessionTag name="work" onClick={() => {}} />);
      const tag = screen.getByRole("button", { name: /#work/ });
      expect(tag).toHaveAttribute("aria-pressed", "false");
    });
  });

  describe("click handling", () => {
    it("does not have button role without onClick", () => {
      render(<SessionTag name="work" />);
      expect(screen.queryByRole("button")).not.toBeInTheDocument();
    });

    it("has button role when onClick is provided", () => {
      render(<SessionTag name="work" onClick={() => {}} />);
      expect(screen.getByRole("button", { name: /#work/i })).toBeInTheDocument();
    });

    it("has tabIndex when onClick is provided", () => {
      render(<SessionTag name="work" onClick={() => {}} />);
      const tag = screen.getByRole("button");
      expect(tag).toHaveAttribute("tabIndex", "0");
    });

    it("does not have tabIndex without onClick", () => {
      render(<SessionTag name="work" />);
      const tag = getOuterTag("#work");
      expect(tag).not.toHaveAttribute("tabIndex");
    });

    it("calls onClick when clicked", async () => {
      const user = userEvent.setup();
      const handleClick = vi.fn();
      render(<SessionTag name="work" onClick={handleClick} />);

      await user.click(screen.getByRole("button"));
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it("stops propagation on click", async () => {
      const user = userEvent.setup();
      const handleParentClick = vi.fn();
      const handleTagClick = vi.fn();

      render(
        <div onClick={handleParentClick}>
          <SessionTag name="work" onClick={handleTagClick} />
        </div>
      );

      await user.click(screen.getByRole("button"));
      expect(handleTagClick).toHaveBeenCalled();
      expect(handleParentClick).not.toHaveBeenCalled();
    });

    it("has hover scale class when clickable", () => {
      render(<SessionTag name="work" onClick={() => {}} />);
      const tag = screen.getByRole("button");
      expect(tag).toHaveClass("hover:scale-105", "active:scale-95");
    });

    it("does not have hover scale class when not clickable", () => {
      render(<SessionTag name="work" />);
      const tag = getOuterTag("#work");
      expect(tag).not.toHaveClass("hover:scale-105");
    });
  });

  describe("keyboard navigation", () => {
    it("handles Enter key when clickable", async () => {
      const user = userEvent.setup();
      const handleClick = vi.fn();
      render(<SessionTag name="work" onClick={handleClick} />);

      const tag = screen.getByRole("button");
      tag.focus();
      await user.keyboard("{Enter}");

      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it("handles Space key when clickable", async () => {
      const user = userEvent.setup();
      const handleClick = vi.fn();
      render(<SessionTag name="work" onClick={handleClick} />);

      const tag = screen.getByRole("button");
      tag.focus();
      await user.keyboard(" ");

      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it("does not respond to keyboard without onClick", async () => {
      const user = userEvent.setup();
      render(<SessionTag name="work" />);

      const tag = getOuterTag("#work");
      tag.focus();
      await user.keyboard("{Enter}");

      // No error should occur
    });
  });

  describe("remove button", () => {
    it("does not show remove button without onRemove", () => {
      render(<SessionTag name="work" />);
      expect(screen.queryByRole("button", { name: /remove/i })).not.toBeInTheDocument();
    });

    it("shows remove button when onRemove is provided", () => {
      render(<SessionTag name="work" onRemove={() => {}} />);
      expect(screen.getByRole("button", { name: /remove tag work/i })).toBeInTheDocument();
    });

    it("calls onRemove when remove button is clicked", async () => {
      const user = userEvent.setup();
      const handleRemove = vi.fn();
      render(<SessionTag name="work" onRemove={handleRemove} />);

      await user.click(screen.getByRole("button", { name: /remove/i }));
      expect(handleRemove).toHaveBeenCalledTimes(1);
    });

    it("stops propagation on remove click", async () => {
      const user = userEvent.setup();
      const handleTagClick = vi.fn();
      const handleRemove = vi.fn();

      render(
        <SessionTag
          name="work"
          onClick={handleTagClick}
          onRemove={handleRemove}
        />
      );

      await user.click(screen.getByRole("button", { name: /remove/i }));
      expect(handleRemove).toHaveBeenCalled();
      expect(handleTagClick).not.toHaveBeenCalled();
    });

    it("has correct aria-label for remove button", () => {
      render(<SessionTag name="important" onRemove={() => {}} />);
      const removeButton = screen.getByRole("button", { name: /remove tag important/i });
      expect(removeButton).toBeInTheDocument();
    });

    it("has transition classes on remove button", () => {
      render(<SessionTag name="work" onRemove={() => {}} />);
      const removeButton = screen.getByRole("button", { name: /remove/i });
      expect(removeButton).toHaveClass("transition-all", "duration-200");
    });

    it("has active scale class on remove button", () => {
      render(<SessionTag name="work" onRemove={() => {}} />);
      const removeButton = screen.getByRole("button", { name: /remove/i });
      expect(removeButton).toHaveClass("active:scale-90");
    });
  });

  describe("accessibility", () => {
    it("has correct aria-label for tag", () => {
      render(<SessionTag name="work" />);
      const tag = screen.getByRole("generic", { name: "#work" });
      expect(tag).toBeInTheDocument();
    });

    it("has focus visible styles when clickable", () => {
      render(<SessionTag name="work" onClick={() => {}} />);
      const tag = screen.getByRole("button");
      expect(tag).toHaveClass("focus-visible:outline-none", "focus-visible:ring-1");
    });

    it("remove button has focus visible styles", () => {
      render(<SessionTag name="work" onRemove={() => {}} />);
      const removeButton = screen.getByRole("button", { name: /remove/i });
      expect(removeButton).toHaveClass("focus-visible:outline-none", "focus-visible:ring-1");
    });

    it("X icon has aria-hidden", () => {
      render(<SessionTag name="work" onRemove={() => {}} />);
      const xIcon = screen.getByRole("button", { name: /remove/i }).querySelector("svg");
      expect(xIcon).toHaveAttribute("aria-hidden", "true");
    });
  });

  describe("transition and animation", () => {
    it("has transition classes", () => {
      render(<SessionTag name="work" />);
      const tag = getOuterTag("#work");
      expect(tag).toHaveClass("transition-all", "duration-200", "ease-out");
    });

    it("remove button has rotate animation on hover", () => {
      render(<SessionTag name="work" onRemove={() => {}} />);
      const xIcon = screen.getByRole("button", { name: /remove/i }).querySelector("svg");
      expect(xIcon).toHaveClass("group-hover/remove:rotate-90");
    });
  });

  describe("dark mode styles", () => {
    it("has dark mode styles for inactive tag", () => {
      render(<SessionTag name="work" />);
      const tag = getOuterTag("#work");
      expect(tag).toHaveClass("dark:border-white/10", "dark:hover:bg-white/10");
    });

    it("has dark mode styles for active tag", () => {
      render(<SessionTag name="work" isActive />);
      const tag = getOuterTag(/#work.*active/i);
      expect(tag).toHaveClass("dark:bg-primary/25", "dark:border-primary/40");
    });
  });
});
