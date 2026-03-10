import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import React from "react";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from "./tooltip";

// Mock radix-ui Tooltip
vi.mock("radix-ui", () => {
  // React is imported at the top of the file
  return {
    Tooltip: {
      Provider: ({
        children,
        delayDuration,
      }: {
        children: React.ReactNode;
        delayDuration?: number;
      }) => (
        <div
          data-testid="tooltip-provider"
          data-slot="tooltip-provider"
          data-delay-duration={delayDuration}
        >
          {children}
        </div>
      ),
      Root: ({
        children,
        open,
        delayDuration,
      }: {
        children: React.ReactNode;
        open?: boolean;
        delayDuration?: number;
      }) => (
        <div
          data-testid="tooltip-root"
          data-slot="tooltip"
          data-open={open}
          data-delay-duration={delayDuration}
        >
          {children}
        </div>
      ),
      Trigger: ({
        children,
        className,
        ...props
      }: React.ComponentProps<"button"> & { asChild?: boolean }) => (
        <button data-testid="tooltip-trigger" data-slot="tooltip-trigger" className={className} {...props}>
          {children}
        </button>
      ),
      Portal: ({ children }: { children: React.ReactNode }) => (
        <div data-testid="tooltip-portal">{children}</div>
      ),
      Content: React.forwardRef(
        (
          {
            children,
            className,
            sideOffset,
            ...props
          }: React.ComponentProps<"div"> & { sideOffset?: number },
          _ref: React.Ref<HTMLDivElement>
        ) => (
          <div
            data-testid="tooltip-content"
            data-slot="tooltip-content"
            data-side-offset={sideOffset}
            className={className}
            {...props}
          >
            {children}
          </div>
        )
      ),
      Arrow: ({ className }: { className?: string }) => (
        <div data-testid="tooltip-arrow" className={className} />
      ),
    },
  };
});

describe("TooltipProvider", () => {
  it("should render provider", () => {
    render(
      <TooltipProvider>
        <div>Content</div>
      </TooltipProvider>
    );

    expect(screen.getByTestId("tooltip-provider")).toBeInTheDocument();
    expect(screen.getByText("Content")).toBeInTheDocument();
  });

  it("should have default delayDuration of 0", () => {
    render(
      <TooltipProvider>
        <div>Content</div>
      </TooltipProvider>
    );

    expect(screen.getByTestId("tooltip-provider")).toHaveAttribute(
      "data-delay-duration",
      "0"
    );
  });

  it("should accept custom delayDuration", () => {
    render(
      <TooltipProvider delayDuration={500}>
        <div>Content</div>
      </TooltipProvider>
    );

    expect(screen.getByTestId("tooltip-provider")).toHaveAttribute(
      "data-delay-duration",
      "500"
    );
  });

  it("should have data-slot attribute", () => {
    render(
      <TooltipProvider>
        <div>Content</div>
      </TooltipProvider>
    );

    expect(screen.getByTestId("tooltip-provider")).toHaveAttribute(
      "data-slot",
      "tooltip-provider"
    );
  });
});

describe("Tooltip", () => {
  it("should render tooltip root", () => {
    render(
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger>Hover me</TooltipTrigger>
          <TooltipContent>Tooltip text</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );

    expect(screen.getByTestId("tooltip-root")).toBeInTheDocument();
  });

  it("should handle open state", () => {
    render(
      <TooltipProvider>
        <Tooltip open={true}>
          <TooltipTrigger>Hover me</TooltipTrigger>
          <TooltipContent>Tooltip text</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );

    expect(screen.getByTestId("tooltip-root")).toHaveAttribute(
      "data-open",
      "true"
    );
  });

  it("should have data-slot attribute", () => {
    render(
      <TooltipProvider>
        <Tooltip>
          <div>Content</div>
        </Tooltip>
      </TooltipProvider>
    );

    expect(screen.getByTestId("tooltip-root")).toHaveAttribute(
      "data-slot",
      "tooltip"
    );
  });
});

describe("TooltipTrigger", () => {
  it("should render trigger", () => {
    render(
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger>Hover me</TooltipTrigger>
        </Tooltip>
      </TooltipProvider>
    );

    expect(screen.getByTestId("tooltip-trigger")).toBeInTheDocument();
    expect(screen.getByText("Hover me")).toBeInTheDocument();
  });

  it("should have data-slot attribute", () => {
    render(
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger>Hover me</TooltipTrigger>
        </Tooltip>
      </TooltipProvider>
    );

    expect(screen.getByTestId("tooltip-trigger")).toHaveAttribute(
      "data-slot",
      "tooltip-trigger"
    );
  });

  it("should apply custom className", () => {
    render(
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger className="custom-trigger">Hover me</TooltipTrigger>
        </Tooltip>
      </TooltipProvider>
    );

    expect(screen.getByTestId("tooltip-trigger")).toHaveClass("custom-trigger");
  });
});

describe("TooltipContent", () => {
  it("should render content with portal", () => {
    render(
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger>Hover me</TooltipTrigger>
          <TooltipContent>Tooltip text</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );

    expect(screen.getByTestId("tooltip-portal")).toBeInTheDocument();
    expect(screen.getByTestId("tooltip-content")).toBeInTheDocument();
    expect(screen.getByText("Tooltip text")).toBeInTheDocument();
  });

  it("should apply default sideOffset of 4", () => {
    render(
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger>Hover me</TooltipTrigger>
          <TooltipContent>Tooltip text</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );

    expect(screen.getByTestId("tooltip-content")).toHaveAttribute(
      "data-side-offset",
      "4"
    );
  });

  it("should accept custom sideOffset", () => {
    render(
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger>Hover me</TooltipTrigger>
          <TooltipContent sideOffset={10}>Tooltip text</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );

    expect(screen.getByTestId("tooltip-content")).toHaveAttribute(
      "data-side-offset",
      "10"
    );
  });

  it("should apply default styling classes", () => {
    render(
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger>Hover me</TooltipTrigger>
          <TooltipContent>Tooltip text</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );

    const content = screen.getByTestId("tooltip-content");
    expect(content.className).toContain("z-50");
    expect(content.className).toContain("rounded-lg");
    expect(content.className).toContain("bg-foreground");
    expect(content.className).toContain("text-background");
  });

  it("should apply custom className", () => {
    render(
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger>Hover me</TooltipTrigger>
          <TooltipContent className="custom-tooltip">Tooltip text</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );

    expect(screen.getByTestId("tooltip-content")).toHaveClass("custom-tooltip");
  });

  it("should include animation classes", () => {
    render(
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger>Hover me</TooltipTrigger>
          <TooltipContent>Tooltip text</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );

    const content = screen.getByTestId("tooltip-content");
    expect(content.className).toContain("animate-in");
    expect(content.className).toContain("fade-in-0");
    expect(content.className).toContain("zoom-in-95");
  });

  it("should include dark mode enhancements", () => {
    render(
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger>Hover me</TooltipTrigger>
          <TooltipContent>Tooltip text</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );

    const content = screen.getByTestId("tooltip-content");
    expect(content.className).toContain("dark:shadow-[0_4px_12px");
    expect(content.className).toContain("dark:bg-foreground/95");
    expect(content.className).toContain("dark:backdrop-blur-sm");
  });

  it("should include closed state animations", () => {
    render(
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger>Hover me</TooltipTrigger>
          <TooltipContent>Tooltip text</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );

    const content = screen.getByTestId("tooltip-content");
    expect(content.className).toContain("data-[state=closed]:animate-out");
    expect(content.className).toContain("data-[state=closed]:fade-out-0");
    expect(content.className).toContain("data-[state=closed]:zoom-out-95");
  });

  it("should include slide-in animations for different sides", () => {
    render(
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger>Hover me</TooltipTrigger>
          <TooltipContent>Tooltip text</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );

    const content = screen.getByTestId("tooltip-content");
    expect(content.className).toContain("data-[side=bottom]:slide-in-from-top-2");
    expect(content.className).toContain("data-[side=left]:slide-in-from-right-2");
    expect(content.className).toContain("data-[side=right]:slide-in-from-left-2");
    expect(content.className).toContain("data-[side=top]:slide-in-from-bottom-2");
  });

  it("should render arrow", () => {
    render(
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger>Hover me</TooltipTrigger>
          <TooltipContent>Tooltip text</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );

    expect(screen.getByTestId("tooltip-arrow")).toBeInTheDocument();
  });

  it("should have data-slot attribute", () => {
    render(
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger>Hover me</TooltipTrigger>
          <TooltipContent>Tooltip text</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );

    expect(screen.getByTestId("tooltip-content")).toHaveAttribute(
      "data-slot",
      "tooltip-content"
    );
  });
});

describe("Complete Tooltip Integration", () => {
  it("should render a complete tooltip with all components", () => {
    render(
      <TooltipProvider delayDuration={200}>
        <Tooltip>
          <TooltipTrigger>Hover for info</TooltipTrigger>
          <TooltipContent sideOffset={8}>
            This is additional information
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );

    expect(screen.getByTestId("tooltip-provider")).toHaveAttribute(
      "data-delay-duration",
      "200"
    );
    expect(screen.getByText("Hover for info")).toBeInTheDocument();
    expect(screen.getByText("This is additional information")).toBeInTheDocument();
    expect(screen.getByTestId("tooltip-content")).toHaveAttribute(
      "data-side-offset",
      "8"
    );
  });

  it("should render multiple tooltips", () => {
    render(
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger>First</TooltipTrigger>
          <TooltipContent>First tooltip</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger>Second</TooltipTrigger>
          <TooltipContent>Second tooltip</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );

    expect(screen.getByText("First")).toBeInTheDocument();
    expect(screen.getByText("Second")).toBeInTheDocument();
    expect(screen.getByText("First tooltip")).toBeInTheDocument();
    expect(screen.getByText("Second tooltip")).toBeInTheDocument();
  });
});
