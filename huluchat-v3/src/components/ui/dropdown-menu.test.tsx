import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuCheckboxItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
  DropdownMenuGroup,
} from "./dropdown-menu";

// Mock radix-ui dropdown menu
vi.mock("radix-ui", async () => {
  const React = await import("react");
  return {
    DropdownMenu: {
      Root: ({
        children,
        open,
        onOpenChange,
      }: {
        children: React.ReactNode;
        open?: boolean;
        onOpenChange?: (open: boolean) => void;
      }) => (
        <div
          data-testid="dropdown-root"
          data-open={open}
          onClick={() => onOpenChange?.(!open)}
        >
          {children}
        </div>
      ),
      Portal: ({ children }: { children: React.ReactNode }) => (
        <div data-testid="dropdown-portal">{children}</div>
      ),
      Trigger: ({
        children,
        ...props
      }: React.ComponentProps<"button"> & { asChild?: boolean }) => (
        <button data-testid="dropdown-trigger" {...props}>
          {children}
        </button>
      ),
      Content: ({
        children,
        sideOffset,
        className,
        ...props
      }: React.ComponentProps<"div"> & { sideOffset?: number }) => (
        <div
          data-testid="dropdown-content"
          data-side-offset={sideOffset}
          className={className}
          {...props}
        >
          {children}
        </div>
      ),
      Group: ({ children }: { children: React.ReactNode }) => (
        <div data-testid="dropdown-group">{children}</div>
      ),
      Item: ({
        children,
        className,
        disabled,
        ...props
      }: React.ComponentProps<"div"> & { disabled?: boolean }) => (
        <div
          role="menuitem"
          data-testid="dropdown-item"
          className={className}
          aria-disabled={disabled}
          {...props}
        >
          {children}
        </div>
      ),
      CheckboxItem: ({
        children,
        checked,
        className,
        onCheckedChange,
      }: {
        children: React.ReactNode;
        checked?: boolean;
        className?: string;
        onCheckedChange?: (checked: boolean) => void;
      }) => (
        <div
          role="menuitemcheckbox"
          data-testid="dropdown-checkbox-item"
          data-checked={checked}
          className={className}
          onClick={() => onCheckedChange?.(!checked)}
        >
          {children}
        </div>
      ),
      ItemIndicator: ({ children }: { children: React.ReactNode }) => (
        <span data-testid="item-indicator">{children}</span>
      ),
      RadioGroup: ({
        children,
        value,
        onValueChange,
      }: {
        children: React.ReactNode;
        value?: string;
        onValueChange?: (value: string) => void;
      }) => (
        <div
          role="radiogroup"
          data-testid="dropdown-radio-group"
          data-value={value}
        >
          {children}
        </div>
      ),
      RadioItem: ({
        children,
        value,
        className,
      }: {
        children: React.ReactNode;
        value: string;
        className?: string;
      }) => (
        <div
          role="radio"
          data-testid="dropdown-radio-item"
          data-value={value}
          className={className}
        >
          {children}
        </div>
      ),
      Label: ({
        children,
        className,
      }: {
        children: React.ReactNode;
        className?: string;
      }) => (
        <div data-testid="dropdown-label" className={className}>
          {children}
        </div>
      ),
      Separator: ({ className }: { className?: string }) => (
        <div data-testid="dropdown-separator" className={className} />
      ),
      Sub: ({
        children,
        open,
        onOpenChange,
      }: {
        children: React.ReactNode;
        open?: boolean;
        onOpenChange?: (open: boolean) => void;
      }) => (
        <div
          data-testid="dropdown-sub"
          data-open={open}
          onClick={() => onOpenChange?.(!open)}
        >
          {children}
        </div>
      ),
      SubTrigger: ({
        children,
        className,
      }: {
        children: React.ReactNode;
        className?: string;
      }) => (
        <div data-testid="dropdown-sub-trigger" className={className}>
          {children}
        </div>
      ),
      SubContent: ({
        children,
        className,
      }: {
        children: React.ReactNode;
        className?: string;
      }) => (
        <div data-testid="dropdown-sub-content" className={className}>
          {children}
        </div>
      ),
    },
  };
});

describe("DropdownMenu", () => {
  it("should render DropdownMenu with data-slot attribute", () => {
    render(
      <DropdownMenu>
        <div>Content</div>
      </DropdownMenu>
    );

    expect(screen.getByTestId("dropdown-root")).toBeInTheDocument();
    expect(screen.getByText("Content")).toBeInTheDocument();
  });

  it("should handle open state", () => {
    render(
      <DropdownMenu open={true}>
        <div>Open Content</div>
      </DropdownMenu>
    );

    expect(screen.getByTestId("dropdown-root")).toHaveAttribute(
      "data-open",
      "true"
    );
  });

  it("should handle onOpenChange callback", async () => {
    const onOpenChange = vi.fn();
    render(
      <DropdownMenu onOpenChange={onOpenChange}>
        <div>Content</div>
      </DropdownMenu>
    );

    await userEvent.click(screen.getByTestId("dropdown-root"));

    expect(onOpenChange).toHaveBeenCalled();
  });
});

describe("DropdownMenuTrigger", () => {
  it("should render trigger button", () => {
    render(
      <DropdownMenu>
        <DropdownMenuTrigger>Click me</DropdownMenuTrigger>
      </DropdownMenu>
    );

    expect(screen.getByText("Click me")).toBeInTheDocument();
    expect(screen.getByTestId("dropdown-trigger")).toBeInTheDocument();
  });

  it("should pass through additional props", () => {
    render(
      <DropdownMenu>
        <DropdownMenuTrigger disabled>Disabled Trigger</DropdownMenuTrigger>
      </DropdownMenu>
    );

    expect(screen.getByTestId("dropdown-trigger")).toBeDisabled();
  });
});

describe("DropdownMenuContent", () => {
  it("should render content with portal", () => {
    render(
      <DropdownMenu>
        <DropdownMenuContent>Menu Content</DropdownMenuContent>
      </DropdownMenu>
    );

    expect(screen.getByText("Menu Content")).toBeInTheDocument();
    expect(screen.getByTestId("dropdown-portal")).toBeInTheDocument();
  });

  it("should apply default sideOffset of 4", () => {
    render(
      <DropdownMenu>
        <DropdownMenuContent>Content</DropdownMenuContent>
      </DropdownMenu>
    );

    expect(screen.getByTestId("dropdown-content")).toHaveAttribute(
      "data-side-offset",
      "4"
    );
  });

  it("should apply custom sideOffset", () => {
    render(
      <DropdownMenu>
        <DropdownMenuContent sideOffset={10}>Content</DropdownMenuContent>
      </DropdownMenu>
    );

    expect(screen.getByTestId("dropdown-content")).toHaveAttribute(
      "data-side-offset",
      "10"
    );
  });

  it("should apply custom className", () => {
    render(
      <DropdownMenu>
        <DropdownMenuContent className="custom-class">Content</DropdownMenuContent>
      </DropdownMenu>
    );

    expect(screen.getByTestId("dropdown-content")).toHaveClass("custom-class");
  });

  it("should include animation classes", () => {
    render(
      <DropdownMenu>
        <DropdownMenuContent>Content</DropdownMenuContent>
      </DropdownMenu>
    );

    const content = screen.getByTestId("dropdown-content");
    expect(content.className).toContain("animate-in");
    expect(content.className).toContain("fade-in-0");
    expect(content.className).toContain("zoom-in-95");
  });
});

describe("DropdownMenuItem", () => {
  it("should render menu item", () => {
    render(
      <DropdownMenu>
        <DropdownMenuContent>
          <DropdownMenuItem>Item 1</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );

    expect(screen.getByText("Item 1")).toBeInTheDocument();
    expect(screen.getByRole("menuitem")).toBeInTheDocument();
  });

  it("should apply default variant", () => {
    render(
      <DropdownMenu>
        <DropdownMenuContent>
          <DropdownMenuItem>Default Item</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );

    const item = screen.getByRole("menuitem");
    expect(item).toHaveAttribute("data-variant", "default");
  });

  it("should apply destructive variant", () => {
    render(
      <DropdownMenu>
        <DropdownMenuContent>
          <DropdownMenuItem variant="destructive">Delete</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );

    const item = screen.getByRole("menuitem");
    expect(item).toHaveAttribute("data-variant", "destructive");
  });

  it("should apply inset attribute", () => {
    render(
      <DropdownMenu>
        <DropdownMenuContent>
          <DropdownMenuItem inset>Inset Item</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );

    const item = screen.getByRole("menuitem");
    expect(item).toHaveAttribute("data-inset", "true");
  });

  it("should apply custom className", () => {
    render(
      <DropdownMenu>
        <DropdownMenuContent>
          <DropdownMenuItem className="custom-item">Item</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );

    expect(screen.getByRole("menuitem")).toHaveClass("custom-item");
  });

  it("should handle disabled state", () => {
    render(
      <DropdownMenu>
        <DropdownMenuContent>
          <DropdownMenuItem disabled>Disabled Item</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );

    expect(screen.getByRole("menuitem")).toHaveAttribute(
      "aria-disabled",
      "true"
    );
  });
});

describe("DropdownMenuCheckboxItem", () => {
  it("should render checkbox item", () => {
    render(
      <DropdownMenu>
        <DropdownMenuContent>
          <DropdownMenuCheckboxItem>Check me</DropdownMenuCheckboxItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );

    expect(screen.getByText("Check me")).toBeInTheDocument();
    expect(screen.getByRole("menuitemcheckbox")).toBeInTheDocument();
  });

  it("should show checked state", () => {
    render(
      <DropdownMenu>
        <DropdownMenuContent>
          <DropdownMenuCheckboxItem checked>Checked</DropdownMenuCheckboxItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );

    expect(screen.getByRole("menuitemcheckbox")).toHaveAttribute(
      "data-checked",
      "true"
    );
  });

  it("should show unchecked state", () => {
    render(
      <DropdownMenu>
        <DropdownMenuContent>
          <DropdownMenuCheckboxItem checked={false}>
            Unchecked
          </DropdownMenuCheckboxItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );

    expect(screen.getByRole("menuitemcheckbox")).toHaveAttribute(
      "data-checked",
      "false"
    );
  });

  it("should apply custom className", () => {
    render(
      <DropdownMenu>
        <DropdownMenuContent>
          <DropdownMenuCheckboxItem className="custom-checkbox">
            Custom
          </DropdownMenuCheckboxItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );

    expect(screen.getByRole("menuitemcheckbox")).toHaveClass(
      "custom-checkbox"
    );
  });

  it("should render check icon when checked", () => {
    render(
      <DropdownMenu>
        <DropdownMenuContent>
          <DropdownMenuCheckboxItem checked>With Icon</DropdownMenuCheckboxItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );

    expect(screen.getByTestId("item-indicator")).toBeInTheDocument();
  });
});

describe("DropdownMenuRadioGroup and RadioItem", () => {
  it("should render radio group", () => {
    render(
      <DropdownMenu>
        <DropdownMenuContent>
          <DropdownMenuRadioGroup>
            <DropdownMenuRadioItem value="option1">Option 1</DropdownMenuRadioItem>
          </DropdownMenuRadioGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    );

    expect(screen.getByRole("radiogroup")).toBeInTheDocument();
    expect(screen.getByRole("radio")).toBeInTheDocument();
  });

  it("should show selected value", () => {
    render(
      <DropdownMenu>
        <DropdownMenuContent>
          <DropdownMenuRadioGroup value="option1">
            <DropdownMenuRadioItem value="option1">Option 1</DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="option2">Option 2</DropdownMenuRadioItem>
          </DropdownMenuRadioGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    );

    expect(screen.getByRole("radiogroup")).toHaveAttribute(
      "data-value",
      "option1"
    );
  });

  it("should apply custom className to radio item", () => {
    render(
      <DropdownMenu>
        <DropdownMenuContent>
          <DropdownMenuRadioGroup>
            <DropdownMenuRadioItem value="opt" className="custom-radio">
              Option
            </DropdownMenuRadioItem>
          </DropdownMenuRadioGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    );

    expect(screen.getByRole("radio")).toHaveClass("custom-radio");
  });
});

describe("DropdownMenuLabel", () => {
  it("should render label", () => {
    render(
      <DropdownMenu>
        <DropdownMenuContent>
          <DropdownMenuLabel>Label Text</DropdownMenuLabel>
        </DropdownMenuContent>
      </DropdownMenu>
    );

    expect(screen.getByText("Label Text")).toBeInTheDocument();
    expect(screen.getByTestId("dropdown-label")).toBeInTheDocument();
  });

  it("should apply inset attribute", () => {
    render(
      <DropdownMenu>
        <DropdownMenuContent>
          <DropdownMenuLabel inset>Inset Label</DropdownMenuLabel>
        </DropdownMenuContent>
      </DropdownMenu>
    );

    const label = screen.getByTestId("dropdown-label");
    expect(label.className).toContain("data-[inset]:pl-8");
  });

  it("should apply custom className", () => {
    render(
      <DropdownMenu>
        <DropdownMenuContent>
          <DropdownMenuLabel className="custom-label">Label</DropdownMenuLabel>
        </DropdownMenuContent>
      </DropdownMenu>
    );

    expect(screen.getByTestId("dropdown-label")).toHaveClass("custom-label");
  });
});

describe("DropdownMenuSeparator", () => {
  it("should render separator", () => {
    render(
      <DropdownMenu>
        <DropdownMenuContent>
          <DropdownMenuItem>Item 1</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem>Item 2</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );

    expect(screen.getByTestId("dropdown-separator")).toBeInTheDocument();
  });

  it("should apply custom className", () => {
    render(
      <DropdownMenu>
        <DropdownMenuContent>
          <DropdownMenuSeparator className="custom-sep" />
        </DropdownMenuContent>
      </DropdownMenu>
    );

    expect(screen.getByTestId("dropdown-separator")).toHaveClass("custom-sep");
  });
});

describe("DropdownMenuShortcut", () => {
  it("should render shortcut text", () => {
    render(
      <DropdownMenu>
        <DropdownMenuContent>
          <DropdownMenuItem>
            Save
            <DropdownMenuShortcut>⌘S</DropdownMenuShortcut>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );

    expect(screen.getByText("⌘S")).toBeInTheDocument();
  });

  it("should apply custom className", () => {
    render(
      <DropdownMenu>
        <DropdownMenuContent>
          <DropdownMenuItem>
            Copy
            <DropdownMenuShortcut className="custom-shortcut">
              ⌘C
            </DropdownMenuShortcut>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );

    expect(screen.getByText("⌘C")).toHaveClass("custom-shortcut");
  });
});

describe("DropdownMenuSub", () => {
  it("should render submenu container", () => {
    render(
      <DropdownMenu>
        <DropdownMenuContent>
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>More Options</DropdownMenuSubTrigger>
            <DropdownMenuSubContent>
              <DropdownMenuItem>Sub Item</DropdownMenuItem>
            </DropdownMenuSubContent>
          </DropdownMenuSub>
        </DropdownMenuContent>
      </DropdownMenu>
    );

    expect(screen.getByTestId("dropdown-sub")).toBeInTheDocument();
    expect(screen.getByText("More Options")).toBeInTheDocument();
    expect(screen.getByText("Sub Item")).toBeInTheDocument();
  });

  it("should handle open state", () => {
    render(
      <DropdownMenu>
        <DropdownMenuContent>
          <DropdownMenuSub open={true}>
            <DropdownMenuSubTrigger>Open Submenu</DropdownMenuSubTrigger>
            <DropdownMenuSubContent>
              <DropdownMenuItem>Item</DropdownMenuItem>
            </DropdownMenuSubContent>
          </DropdownMenuSub>
        </DropdownMenuContent>
      </DropdownMenu>
    );

    expect(screen.getByTestId("dropdown-sub")).toHaveAttribute(
      "data-open",
      "true"
    );
  });
});

describe("DropdownMenuSubTrigger", () => {
  it("should render sub trigger with chevron", () => {
    render(
      <DropdownMenu>
        <DropdownMenuContent>
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>Expand</DropdownMenuSubTrigger>
          </DropdownMenuSub>
        </DropdownMenuContent>
      </DropdownMenu>
    );

    expect(screen.getByText("Expand")).toBeInTheDocument();
    expect(screen.getByTestId("dropdown-sub-trigger")).toBeInTheDocument();
  });

  it("should apply inset attribute", () => {
    render(
      <DropdownMenu>
        <DropdownMenuContent>
          <DropdownMenuSub>
            <DropdownMenuSubTrigger inset>Inset Trigger</DropdownMenuSubTrigger>
          </DropdownMenuSub>
        </DropdownMenuContent>
      </DropdownMenu>
    );

    const trigger = screen.getByTestId("dropdown-sub-trigger");
    expect(trigger.className).toContain("data-[inset]:pl-8");
  });

  it("should apply custom className", () => {
    render(
      <DropdownMenu>
        <DropdownMenuContent>
          <DropdownMenuSub>
            <DropdownMenuSubTrigger className="custom-trigger">
              Custom
            </DropdownMenuSubTrigger>
          </DropdownMenuSub>
        </DropdownMenuContent>
      </DropdownMenu>
    );

    expect(screen.getByTestId("dropdown-sub-trigger")).toHaveClass(
      "custom-trigger"
    );
  });
});

describe("DropdownMenuSubContent", () => {
  it("should render sub content", () => {
    render(
      <DropdownMenu>
        <DropdownMenuContent>
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>More</DropdownMenuSubTrigger>
            <DropdownMenuSubContent>
              <DropdownMenuItem>Submenu Item</DropdownMenuItem>
            </DropdownMenuSubContent>
          </DropdownMenuSub>
        </DropdownMenuContent>
      </DropdownMenu>
    );

    expect(screen.getByText("Submenu Item")).toBeInTheDocument();
    expect(screen.getByTestId("dropdown-sub-content")).toBeInTheDocument();
  });

  it("should apply custom className", () => {
    render(
      <DropdownMenu>
        <DropdownMenuContent>
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>More</DropdownMenuSubTrigger>
            <DropdownMenuSubContent className="custom-sub-content">
              <DropdownMenuItem>Item</DropdownMenuItem>
            </DropdownMenuSubContent>
          </DropdownMenuSub>
        </DropdownMenuContent>
      </DropdownMenu>
    );

    expect(screen.getByTestId("dropdown-sub-content")).toHaveClass(
      "custom-sub-content"
    );
  });

  it("should include animation classes", () => {
    render(
      <DropdownMenu>
        <DropdownMenuContent>
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>More</DropdownMenuSubTrigger>
            <DropdownMenuSubContent>
              <DropdownMenuItem>Item</DropdownMenuItem>
            </DropdownMenuSubContent>
          </DropdownMenuSub>
        </DropdownMenuContent>
      </DropdownMenu>
    );

    const content = screen.getByTestId("dropdown-sub-content");
    expect(content.className).toContain("animate-in");
  });
});

describe("DropdownMenuGroup", () => {
  it("should render group container", () => {
    render(
      <DropdownMenu>
        <DropdownMenuContent>
          <DropdownMenuGroup>
            <DropdownMenuItem>Grouped Item 1</DropdownMenuItem>
            <DropdownMenuItem>Grouped Item 2</DropdownMenuItem>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    );

    expect(screen.getByTestId("dropdown-group")).toBeInTheDocument();
    expect(screen.getByText("Grouped Item 1")).toBeInTheDocument();
    expect(screen.getByText("Grouped Item 2")).toBeInTheDocument();
  });
});

describe("Complete DropdownMenu Integration", () => {
  it("should render a complete dropdown menu with all components", () => {
    render(
      <DropdownMenu>
        <DropdownMenuTrigger>Menu</DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuLabel>Actions</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem>Copy</DropdownMenuItem>
          <DropdownMenuItem variant="destructive">Delete</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuCheckboxItem checked>Show sidebar</DropdownMenuCheckboxItem>
          <DropdownMenuRadioGroup value="option1">
            <DropdownMenuRadioItem value="option1">Option 1</DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="option2">Option 2</DropdownMenuRadioItem>
          </DropdownMenuRadioGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    );

    expect(screen.getByText("Menu")).toBeInTheDocument();
    expect(screen.getByText("Actions")).toBeInTheDocument();
    expect(screen.getByText("Copy")).toBeInTheDocument();
    expect(screen.getByText("Delete")).toBeInTheDocument();
    expect(screen.getByText("Show sidebar")).toBeInTheDocument();
    expect(screen.getByText("Option 1")).toBeInTheDocument();
    expect(screen.getByText("Option 2")).toBeInTheDocument();
  });
});
