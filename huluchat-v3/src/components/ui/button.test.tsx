import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Button, buttonVariants } from "./button";

describe("Button", () => {
  describe("Rendering", () => {
    it("should render button with text", () => {
      render(<Button>Click me</Button>);

      expect(screen.getByRole("button", { name: "Click me" })).toBeInTheDocument();
    });

    it("should render button with data-slot attribute", () => {
      render(<Button>Button</Button>);

      expect(screen.getByRole("button")).toHaveAttribute("data-slot", "button");
    });

    it("should apply default variant and size", () => {
      render(<Button>Default</Button>);

      const button = screen.getByRole("button");
      expect(button).toHaveAttribute("data-variant", "default");
      expect(button).toHaveAttribute("data-size", "default");
    });

    it("should apply custom className", () => {
      render(<Button className="custom-class">Custom</Button>);

      expect(screen.getByRole("button")).toHaveClass("custom-class");
    });

    it("should render as child component when asChild is true", () => {
      render(
        <Button asChild>
          <a href="/test">Link Button</a>
        </Button>
      );

      const link = screen.getByRole("link", { name: "Link Button" });
      expect(link).toBeInTheDocument();
      expect(link).toHaveAttribute("href", "/test");
    });
  });

  describe("Variants", () => {
    it("should apply default variant", () => {
      render(<Button variant="default">Default</Button>);

      expect(screen.getByRole("button")).toHaveAttribute("data-variant", "default");
    });

    it("should apply destructive variant", () => {
      render(<Button variant="destructive">Delete</Button>);

      expect(screen.getByRole("button")).toHaveAttribute("data-variant", "destructive");
    });

    it("should apply outline variant", () => {
      render(<Button variant="outline">Outline</Button>);

      expect(screen.getByRole("button")).toHaveAttribute("data-variant", "outline");
    });

    it("should apply secondary variant", () => {
      render(<Button variant="secondary">Secondary</Button>);

      expect(screen.getByRole("button")).toHaveAttribute("data-variant", "secondary");
    });

    it("should apply ghost variant", () => {
      render(<Button variant="ghost">Ghost</Button>);

      expect(screen.getByRole("button")).toHaveAttribute("data-variant", "ghost");
    });

    it("should apply link variant", () => {
      render(<Button variant="link">Link</Button>);

      expect(screen.getByRole("button")).toHaveAttribute("data-variant", "link");
    });
  });

  describe("Sizes", () => {
    it("should apply default size", () => {
      render(<Button size="default">Default</Button>);

      expect(screen.getByRole("button")).toHaveAttribute("data-size", "default");
    });

    it("should apply xs size", () => {
      render(<Button size="xs">Extra Small</Button>);

      expect(screen.getByRole("button")).toHaveAttribute("data-size", "xs");
    });

    it("should apply sm size", () => {
      render(<Button size="sm">Small</Button>);

      expect(screen.getByRole("button")).toHaveAttribute("data-size", "sm");
    });

    it("should apply lg size", () => {
      render(<Button size="lg">Large</Button>);

      expect(screen.getByRole("button")).toHaveAttribute("data-size", "lg");
    });

    it("should apply icon size", () => {
      render(<Button size="icon">Icon</Button>);

      expect(screen.getByRole("button")).toHaveAttribute("data-size", "icon");
    });

    it("should apply icon-xs size", () => {
      render(<Button size="icon-xs">Icon XS</Button>);

      expect(screen.getByRole("button")).toHaveAttribute("data-size", "icon-xs");
    });

    it("should apply icon-sm size", () => {
      render(<Button size="icon-sm">Icon SM</Button>);

      expect(screen.getByRole("button")).toHaveAttribute("data-size", "icon-sm");
    });

    it("should apply icon-lg size", () => {
      render(<Button size="icon-lg">Icon LG</Button>);

      expect(screen.getByRole("button")).toHaveAttribute("data-size", "icon-lg");
    });
  });

  describe("States", () => {
    it("should be disabled when disabled prop is true", () => {
      render(<Button disabled>Disabled</Button>);

      expect(screen.getByRole("button")).toBeDisabled();
    });

    it("should handle click events", async () => {
      const handleClick = vi.fn();
      render(<Button onClick={handleClick}>Click me</Button>);

      await userEvent.click(screen.getByRole("button"));

      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it("should not trigger click when disabled", async () => {
      const handleClick = vi.fn();
      render(
        <Button disabled onClick={handleClick}>
          Disabled
        </Button>
      );

      await userEvent.click(screen.getByRole("button"));

      expect(handleClick).not.toHaveBeenCalled();
    });
  });

  describe("Accessibility", () => {
    it("should have correct role", () => {
      render(<Button>Button</Button>);

      expect(screen.getByRole("button")).toBeInTheDocument();
    });

    it("should be focusable", async () => {
      render(<Button>Focus me</Button>);

      const button = screen.getByRole("button");
      button.focus();

      expect(button).toHaveFocus();
    });

    it("should not be focusable when disabled", () => {
      render(<Button disabled>Disabled</Button>);

      const button = screen.getByRole("button");
      button.focus();

      // Disabled buttons should not receive focus
      expect(button).not.toHaveFocus();
    });
  });

  describe("Animation Classes", () => {
    it("should have transition classes", () => {
      render(<Button>Animated</Button>);

      const button = screen.getByRole("button");
      expect(button.className).toContain("transition-all");
      expect(button.className).toContain("duration-200");
    });

    it("should have hover scale class", () => {
      render(<Button>Hover</Button>);

      const button = screen.getByRole("button");
      expect(button.className).toContain("hover:scale-[1.02]");
    });

    it("should have active scale class", () => {
      render(<Button>Active</Button>);

      const button = screen.getByRole("button");
      expect(button.className).toContain("active:scale-[0.97]");
    });
  });

  describe("buttonVariants", () => {
    it("should generate class names for default variant", () => {
      const className = buttonVariants();

      expect(className).toContain("inline-flex");
      expect(className).toContain("bg-primary");
    });

    it("should generate class names for specific variant", () => {
      const className = buttonVariants({ variant: "destructive" });

      expect(className).toContain("bg-destructive");
    });

    it("should generate class names for specific size", () => {
      const className = buttonVariants({ size: "lg" });

      expect(className).toContain("h-10");
    });

    it("should merge custom className", () => {
      const className = buttonVariants({ className: "custom-class" });

      expect(className).toContain("custom-class");
    });
  });

  describe("With Icons", () => {
    it("should render button with icon", () => {
      render(
        <Button>
          <svg data-testid="icon" />
          With Icon
        </Button>
      );

      expect(screen.getByTestId("icon")).toBeInTheDocument();
      expect(screen.getByText("With Icon")).toBeInTheDocument();
    });

    it("should render icon-only button", () => {
      render(
        <Button size="icon" aria-label="Settings">
          <svg data-testid="settings-icon" />
        </Button>
      );

      expect(screen.getByTestId("settings-icon")).toBeInTheDocument();
      expect(screen.getByRole("button")).toHaveAttribute("aria-label", "Settings");
    });
  });
});
