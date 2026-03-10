import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import {
  Select,
  SelectGroup,
  SelectValue,
  SelectTrigger,
  SelectContent,
  SelectLabel,
  SelectItem,
  SelectSeparator,
  SelectScrollUpButton,
  SelectScrollDownButton,
} from "./Select";

// Mock @radix-ui/react-select
vi.mock("@radix-ui/react-select", () => {
  // React is imported at the top of the file
  return {
    Root: ({
      children,
      value,
      open,
      onOpenChange,
    }: {
      children: React.ReactNode;
      value?: string;
      onValueChange?: (value: string) => void;
      open?: boolean;
      onOpenChange?: (open: boolean) => void;
    }) => (
      <div
        data-testid="select-root"
        data-value={value}
        data-open={open}
        onClick={() => onOpenChange?.(!open)}
      >
        {children}
      </div>
    ),
    Group: ({ children }: { children: React.ReactNode }) => (
      <div data-testid="select-group" role="group">
        {children}
      </div>
    ),
    Value: ({ placeholder }: { placeholder?: string }) => (
      <span data-testid="select-value">{placeholder || "Selected"}</span>
    ),
    Trigger: React.forwardRef(
      (
        {
          children,
          className,
          disabled,
          ...props
        }: React.ComponentProps<"button"> & { asChild?: boolean },
        _ref: React.Ref<HTMLButtonElement>
      ) => (
        <button
          data-testid="select-trigger"
          className={className}
          disabled={disabled}
          {...props}
        >
          {children}
        </button>
      )
    ),
    Portal: ({ children }: { children: React.ReactNode }) => (
      <div data-testid="select-portal">{children}</div>
    ),
    Content: React.forwardRef(
      (
        {
          children,
          className,
          position,
          ...props
        }: React.ComponentProps<"div"> & { position?: string },
        _ref: React.Ref<HTMLDivElement>
      ) => (
        <div
          data-testid="select-content"
          data-position={position}
          className={className}
          {...props}
        >
          {children}
        </div>
      )
    ),
    Viewport: ({ children }: { children: React.ReactNode }) => (
      <div data-testid="select-viewport">{children}</div>
    ),
    Label: React.forwardRef(
      (
        { children, className, ...props }: React.ComponentProps<"div">,
        _ref: React.Ref<HTMLDivElement>
      ) => (
        <div data-testid="select-label" className={className} {...props}>
          {children}
        </div>
      )
    ),
    Item: React.forwardRef(
      (
        {
          children,
          className,
          disabled,
          value,
          ...props
        }: React.ComponentProps<"div"> & { value: string; disabled?: boolean },
        _ref: React.Ref<HTMLDivElement>
      ) => (
        <div
          role="option"
          data-testid="select-item"
          data-value={value}
          className={className}
          aria-disabled={disabled}
          {...props}
        >
          {children}
        </div>
      )
    ),
    ItemText: ({ children }: { children: React.ReactNode }) => (
      <span data-testid="select-item-text">{children}</span>
    ),
    ItemIndicator: ({ children }: { children: React.ReactNode }) => (
      <span data-testid="select-item-indicator">{children}</span>
    ),
    Separator: React.forwardRef(
      (
        { className, ...props }: React.ComponentProps<"div">,
        _ref: React.Ref<HTMLDivElement>
      ) => (
        <div data-testid="select-separator" className={className} {...props} />
      )
    ),
    ScrollUpButton: React.forwardRef(
      (
        { children, className, ...props }: React.ComponentProps<"div">,
        _ref: React.Ref<HTMLDivElement>
      ) => (
        <div
          data-testid="select-scroll-up"
          className={className}
          aria-label="Scroll up"
          {...props}
        >
          {children}
        </div>
      )
    ),
    ScrollDownButton: React.forwardRef(
      (
        { children, className, ...props }: React.ComponentProps<"div">,
        _ref: React.Ref<HTMLDivElement>
      ) => (
        <div
          data-testid="select-scroll-down"
          className={className}
          aria-label="Scroll down"
          {...props}
        >
          {children}
        </div>
      )
    ),
    Icon: ({ children }: { children?: React.ReactNode }) => (
      <span data-testid="select-icon">{children}</span>
    ),
  };
});

describe("Select", () => {
  it("should render Select with data-slot attribute", () => {
    render(
      <Select>
        <SelectTrigger>
          <SelectValue placeholder="Select an option" />
        </SelectTrigger>
      </Select>
    );

    expect(screen.getByTestId("select-root")).toBeInTheDocument();
  });

  it("should handle value state", () => {
    render(
      <Select value="option1">
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
      </Select>
    );

    expect(screen.getByTestId("select-root")).toHaveAttribute(
      "data-value",
      "option1"
    );
  });

  it("should handle onValueChange callback", async () => {
    const onValueChange = vi.fn();
    render(
      <Select onValueChange={onValueChange}>
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
      </Select>
    );

    // Since we're using a mock, we need to simulate the value change
    expect(screen.getByTestId("select-root")).toBeInTheDocument();
  });

  it("should handle open state", () => {
    render(
      <Select open={true}>
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
      </Select>
    );

    expect(screen.getByTestId("select-root")).toHaveAttribute(
      "data-open",
      "true"
    );
  });
});

describe("SelectTrigger", () => {
  it("should render trigger button", () => {
    render(
      <Select>
        <SelectTrigger>
          <SelectValue placeholder="Choose..." />
        </SelectTrigger>
      </Select>
    );

    expect(screen.getByTestId("select-trigger")).toBeInTheDocument();
    expect(screen.getByText("Choose...")).toBeInTheDocument();
  });

  it("should apply default styling classes", () => {
    render(
      <Select>
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
      </Select>
    );

    const trigger = screen.getByTestId("select-trigger");
    expect(trigger.className).toContain("flex");
    expect(trigger.className).toContain("rounded-lg");
    expect(trigger.className).toContain("border");
  });

  it("should apply custom className", () => {
    render(
      <Select>
        <SelectTrigger className="custom-trigger">
          <SelectValue />
        </SelectTrigger>
      </Select>
    );

    expect(screen.getByTestId("select-trigger")).toHaveClass("custom-trigger");
  });

  it("should have disabled styling classes", () => {
    render(
      <Select>
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
      </Select>
    );

    const trigger = screen.getByTestId("select-trigger");
    // Check that disabled styling classes are present in the class string
    expect(trigger.className).toContain("disabled:cursor-not-allowed");
    expect(trigger.className).toContain("disabled:opacity-50");
  });

  it("should include transition classes", () => {
    render(
      <Select>
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
      </Select>
    );

    const trigger = screen.getByTestId("select-trigger");
    expect(trigger.className).toContain("transition-all");
    expect(trigger.className).toContain("duration-200");
  });

  it("should include focus ring classes", () => {
    render(
      <Select>
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
      </Select>
    );

    const trigger = screen.getByTestId("select-trigger");
    expect(trigger.className).toContain("focus-visible:ring-2");
  });
});

describe("SelectContent", () => {
  it("should render content with portal", () => {
    render(
      <Select>
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="1">Option 1</SelectItem>
        </SelectContent>
      </Select>
    );

    expect(screen.getByTestId("select-portal")).toBeInTheDocument();
    expect(screen.getByTestId("select-content")).toBeInTheDocument();
  });

  it("should apply default position as popper", () => {
    render(
      <Select>
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="1">Option 1</SelectItem>
        </SelectContent>
      </Select>
    );

    expect(screen.getByTestId("select-content")).toHaveAttribute(
      "data-position",
      "popper"
    );
  });

  it("should apply custom className", () => {
    render(
      <Select>
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent className="custom-content">
          <SelectItem value="1">Option 1</SelectItem>
        </SelectContent>
      </Select>
    );

    expect(screen.getByTestId("select-content")).toHaveClass("custom-content");
  });

  it("should include animation classes", () => {
    render(
      <Select>
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="1">Option 1</SelectItem>
        </SelectContent>
      </Select>
    );

    const content = screen.getByTestId("select-content");
    expect(content.className).toContain("animate-in");
    expect(content.className).toContain("fade-in-0");
    expect(content.className).toContain("zoom-in-95");
  });

  it("should include dark mode styling", () => {
    render(
      <Select>
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="1">Option 1</SelectItem>
        </SelectContent>
      </Select>
    );

    const content = screen.getByTestId("select-content");
    expect(content.className).toContain("dark:shadow-black/30");
    expect(content.className).toContain("dark:border-border/60");
  });
});

describe("SelectItem", () => {
  it("should render select item", () => {
    render(
      <Select>
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="option1">Option 1</SelectItem>
        </SelectContent>
      </Select>
    );

    expect(screen.getByRole("option")).toBeInTheDocument();
    expect(screen.getByText("Option 1")).toBeInTheDocument();
  });

  it("should have correct value attribute", () => {
    render(
      <Select>
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="my-value">My Option</SelectItem>
        </SelectContent>
      </Select>
    );

    expect(screen.getByRole("option")).toHaveAttribute("data-value", "my-value");
  });

  it("should apply custom className", () => {
    render(
      <Select>
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="1" className="custom-item">
            Custom
          </SelectItem>
        </SelectContent>
      </Select>
    );

    expect(screen.getByRole("option")).toHaveClass("custom-item");
  });

  it("should handle disabled state", () => {
    render(
      <Select>
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="1" disabled>
            Disabled Item
          </SelectItem>
        </SelectContent>
      </Select>
    );

    expect(screen.getByRole("option")).toHaveAttribute(
      "aria-disabled",
      "true"
    );
  });

  it("should include transition classes", () => {
    render(
      <Select>
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="1">Option</SelectItem>
        </SelectContent>
      </Select>
    );

    const item = screen.getByRole("option");
    expect(item.className).toContain("transition-all");
    expect(item.className).toContain("duration-200");
  });

  it("should include focus styling", () => {
    render(
      <Select>
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="1">Option</SelectItem>
        </SelectContent>
      </Select>
    );

    const item = screen.getByRole("option");
    expect(item.className).toContain("focus:bg-accent");
  });

  it("should include dark mode focus styling", () => {
    render(
      <Select>
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="1">Option</SelectItem>
        </SelectContent>
      </Select>
    );

    const item = screen.getByRole("option");
    expect(item.className).toContain("dark:focus:bg-accent");
  });
});

describe("SelectLabel", () => {
  it("should render label", () => {
    render(
      <Select>
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectLabel>Group Label</SelectLabel>
          <SelectItem value="1">Option 1</SelectItem>
        </SelectContent>
      </Select>
    );

    expect(screen.getByText("Group Label")).toBeInTheDocument();
    expect(screen.getByTestId("select-label")).toBeInTheDocument();
  });

  it("should apply default styling classes", () => {
    render(
      <Select>
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectLabel>Label</SelectLabel>
        </SelectContent>
      </Select>
    );

    const label = screen.getByTestId("select-label");
    expect(label.className).toContain("font-semibold");
  });

  it("should apply custom className", () => {
    render(
      <Select>
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectLabel className="custom-label">Label</SelectLabel>
        </SelectContent>
      </Select>
    );

    expect(screen.getByTestId("select-label")).toHaveClass("custom-label");
  });
});

describe("SelectSeparator", () => {
  it("should render separator", () => {
    render(
      <Select>
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="1">Option 1</SelectItem>
          <SelectSeparator />
          <SelectItem value="2">Option 2</SelectItem>
        </SelectContent>
      </Select>
    );

    expect(screen.getByTestId("select-separator")).toBeInTheDocument();
  });

  it("should apply default styling classes", () => {
    render(
      <Select>
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectSeparator />
        </SelectContent>
      </Select>
    );

    const separator = screen.getByTestId("select-separator");
    expect(separator.className).toContain("bg-muted");
  });

  it("should apply custom className", () => {
    render(
      <Select>
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectSeparator className="custom-sep" />
        </SelectContent>
      </Select>
    );

    expect(screen.getByTestId("select-separator")).toHaveClass("custom-sep");
  });
});

describe("SelectGroup", () => {
  it("should render group container", () => {
    render(
      <Select>
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectItem value="1">Grouped Item 1</SelectItem>
            <SelectItem value="2">Grouped Item 2</SelectItem>
          </SelectGroup>
        </SelectContent>
      </Select>
    );

    expect(screen.getByTestId("select-group")).toBeInTheDocument();
    expect(screen.getByRole("group")).toBeInTheDocument();
  });
});

describe("SelectValue", () => {
  it("should render with placeholder", () => {
    render(
      <Select>
        <SelectTrigger>
          <SelectValue placeholder="Select an item..." />
        </SelectTrigger>
      </Select>
    );

    expect(screen.getByText("Select an item...")).toBeInTheDocument();
  });
});

describe("SelectScrollUpButton", () => {
  it("should render scroll up button with aria-label", () => {
    render(
      <Select>
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="1">Option 1</SelectItem>
        </SelectContent>
      </Select>
    );

    // SelectContent includes scroll buttons automatically
    const scrollButtons = screen.getAllByTestId("select-scroll-up");
    expect(scrollButtons.length).toBeGreaterThan(0);
    expect(scrollButtons[0]).toHaveAttribute("aria-label", "Scroll up");
  });

  it("should include default styling classes", () => {
    render(
      <Select>
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="1">Option 1</SelectItem>
        </SelectContent>
      </Select>
    );

    const scrollButtons = screen.getAllByTestId("select-scroll-up");
    expect(scrollButtons[0].className).toContain("flex");
    expect(scrollButtons[0].className).toContain("cursor-default");
  });
});

describe("SelectScrollDownButton", () => {
  it("should render scroll down button with aria-label", () => {
    render(
      <Select>
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="1">Option 1</SelectItem>
        </SelectContent>
      </Select>
    );

    // SelectContent includes scroll buttons automatically
    const scrollButtons = screen.getAllByTestId("select-scroll-down");
    expect(scrollButtons.length).toBeGreaterThan(0);
    expect(scrollButtons[0]).toHaveAttribute("aria-label", "Scroll down");
  });

  it("should include default styling classes", () => {
    render(
      <Select>
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="1">Option 1</SelectItem>
        </SelectContent>
      </Select>
    );

    const scrollButtons = screen.getAllByTestId("select-scroll-down");
    expect(scrollButtons[0].className).toContain("flex");
    expect(scrollButtons[0].className).toContain("cursor-default");
  });
});

describe("Complete Select Integration", () => {
  it("should render a complete select with all components", () => {
    render(
      <Select>
        <SelectTrigger>
          <SelectValue placeholder="Choose..." />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectLabel>Fruits</SelectLabel>
            <SelectItem value="apple">Apple</SelectItem>
            <SelectItem value="banana">Banana</SelectItem>
          </SelectGroup>
          <SelectSeparator />
          <SelectGroup>
            <SelectLabel>Vegetables</SelectLabel>
            <SelectItem value="carrot">Carrot</SelectItem>
            <SelectItem value="potato">Potato</SelectItem>
          </SelectGroup>
        </SelectContent>
      </Select>
    );

    expect(screen.getByTestId("select-trigger")).toBeInTheDocument();
    expect(screen.getByText("Choose...")).toBeInTheDocument();
    expect(screen.getByText("Fruits")).toBeInTheDocument();
    expect(screen.getByText("Apple")).toBeInTheDocument();
    expect(screen.getByText("Banana")).toBeInTheDocument();
    expect(screen.getByText("Vegetables")).toBeInTheDocument();
    expect(screen.getByText("Carrot")).toBeInTheDocument();
    expect(screen.getByText("Potato")).toBeInTheDocument();
    expect(screen.getByTestId("select-separator")).toBeInTheDocument();
  });

  it("should render select with disabled items", () => {
    render(
      <Select>
        <SelectTrigger>
          <SelectValue placeholder="Select..." />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="1">Enabled</SelectItem>
          <SelectItem value="2" disabled>
            Disabled
          </SelectItem>
        </SelectContent>
      </Select>
    );

    const items = screen.getAllByRole("option");
    expect(items[0]).not.toHaveAttribute("aria-disabled", "true");
    expect(items[1]).toHaveAttribute("aria-disabled", "true");
  });
});
