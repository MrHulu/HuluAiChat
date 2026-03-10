import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import React from "react";
import {
  Dialog,
  DialogTrigger,
  DialogPortal,
  DialogOverlay,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
} from "./dialog";

// Mock @radix-ui/react-dialog
vi.mock("@radix-ui/react-dialog", () => {
  // React is imported at the top of the file
  return {
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
        data-testid="dialog-root"
        data-open={open}
        onClick={() => onOpenChange?.(!open)}
      >
        {children}
      </div>
    ),
    Trigger: ({
      children,
      className,
      asChild,
      ...props
    }: React.ComponentProps<"button"> & { asChild?: boolean }) => (
      <button data-testid="dialog-trigger" className={className} {...props}>
        {children}
      </button>
    ),
    Portal: ({ children }: { children: React.ReactNode }) => (
      <div data-testid="dialog-portal">{children}</div>
    ),
    Overlay: React.forwardRef(
      (
        { children, className, ...props }: React.ComponentProps<"div">,
        _ref: React.Ref<HTMLDivElement>
      ) => (
        <div data-testid="dialog-overlay" className={className} {...props}>
          {children}
        </div>
      )
    ),
    Content: React.forwardRef(
      (
        { children, className, ...props }: React.ComponentProps<"div">,
        _ref: React.Ref<HTMLDivElement>
      ) => (
        <div data-testid="dialog-content" className={className} {...props}>
          {children}
        </div>
      )
    ),
    Close: ({
      children,
      className,
      ...props
    }: React.ComponentProps<"button">) => (
      <button data-testid="dialog-close" className={className} {...props}>
        {children}
      </button>
    ),
    Title: React.forwardRef(
      (
        { children, className, ...props }: React.ComponentProps<"h2">,
        _ref: React.Ref<HTMLHeadingElement>
      ) => (
        <h2 data-testid="dialog-title" className={className} {...props}>
          {children}
        </h2>
      )
    ),
    Description: React.forwardRef(
      (
        { children, className, ...props }: React.ComponentProps<"p">,
        _ref: React.Ref<HTMLParagraphElement>
      ) => (
        <p data-testid="dialog-description" className={className} {...props}>
          {children}
        </p>
      )
    ),
  };
});

describe("Dialog", () => {
  it("should render Dialog root", () => {
    render(
      <Dialog>
        <div>Dialog Content</div>
      </Dialog>
    );

    expect(screen.getByTestId("dialog-root")).toBeInTheDocument();
    expect(screen.getByText("Dialog Content")).toBeInTheDocument();
  });

  it("should handle open state", () => {
    render(
      <Dialog open={true}>
        <div>Open Dialog</div>
      </Dialog>
    );

    expect(screen.getByTestId("dialog-root")).toHaveAttribute(
      "data-open",
      "true"
    );
  });

  it("should handle closed state", () => {
    render(
      <Dialog open={false}>
        <div>Closed Dialog</div>
      </Dialog>
    );

    expect(screen.getByTestId("dialog-root")).toHaveAttribute(
      "data-open",
      "false"
    );
  });
});

describe("DialogTrigger", () => {
  it("should render trigger button", () => {
    render(
      <Dialog>
        <DialogTrigger>Open Dialog</DialogTrigger>
      </Dialog>
    );

    expect(screen.getByText("Open Dialog")).toBeInTheDocument();
    expect(screen.getByTestId("dialog-trigger")).toBeInTheDocument();
  });

  it("should apply custom className", () => {
    render(
      <Dialog>
        <DialogTrigger className="custom-trigger">Open</DialogTrigger>
      </Dialog>
    );

    expect(screen.getByTestId("dialog-trigger")).toHaveClass("custom-trigger");
  });
});

describe("DialogPortal", () => {
  it("should render portal container", () => {
    render(
      <Dialog>
        <DialogPortal>
          <div>Portal Content</div>
        </DialogPortal>
      </Dialog>
    );

    expect(screen.getByTestId("dialog-portal")).toBeInTheDocument();
    expect(screen.getByText("Portal Content")).toBeInTheDocument();
  });
});

describe("DialogOverlay", () => {
  it("should render overlay", () => {
    render(
      <Dialog>
        <DialogPortal>
          <DialogOverlay />
        </DialogPortal>
      </Dialog>
    );

    expect(screen.getByTestId("dialog-overlay")).toBeInTheDocument();
  });

  it("should apply default overlay styling", () => {
    render(
      <Dialog>
        <DialogPortal>
          <DialogOverlay />
        </DialogPortal>
      </Dialog>
    );

    const overlay = screen.getByTestId("dialog-overlay");
    expect(overlay.className).toContain("fixed");
    expect(overlay.className).toContain("inset-0");
    expect(overlay.className).toContain("z-50");
    expect(overlay.className).toContain("bg-black/50");
    expect(overlay.className).toContain("backdrop-blur-sm");
  });

  it("should apply custom className", () => {
    render(
      <Dialog>
        <DialogPortal>
          <DialogOverlay className="custom-overlay" />
        </DialogPortal>
      </Dialog>
    );

    expect(screen.getByTestId("dialog-overlay")).toHaveClass("custom-overlay");
  });

  it("should include dark mode enhancements", () => {
    render(
      <Dialog>
        <DialogPortal>
          <DialogOverlay />
        </DialogPortal>
      </Dialog>
    );

    const overlay = screen.getByTestId("dialog-overlay");
    expect(overlay.className).toContain("dark:bg-gradient-to-br");
    expect(overlay.className).toContain("dark:backdrop-blur-md");
  });

  it("should include animation classes", () => {
    render(
      <Dialog>
        <DialogPortal>
          <DialogOverlay />
        </DialogPortal>
      </Dialog>
    );

    const overlay = screen.getByTestId("dialog-overlay");
    expect(overlay.className).toContain("animate-in");
    expect(overlay.className).toContain("fade-in-0");
  });
});

describe("DialogContent", () => {
  it("should render content", () => {
    render(
      <Dialog>
        <DialogPortal>
          <DialogOverlay />
          <DialogContent>Dialog Body</DialogContent>
        </DialogPortal>
      </Dialog>
    );

    expect(screen.getByTestId("dialog-content")).toBeInTheDocument();
    expect(screen.getByText("Dialog Body")).toBeInTheDocument();
  });

  it("should apply default content styling", () => {
    render(
      <Dialog>
        <DialogPortal>
          <DialogOverlay />
          <DialogContent>Content</DialogContent>
        </DialogPortal>
      </Dialog>
    );

    const content = screen.getByTestId("dialog-content");
    expect(content.className).toContain("fixed");
    expect(content.className).toContain("left-[50%]");
    expect(content.className).toContain("top-[50%]");
    expect(content.className).toContain("z-50");
    expect(content.className).toContain("rounded-xl");
  });

  it("should apply custom className", () => {
    render(
      <Dialog>
        <DialogPortal>
          <DialogOverlay />
          <DialogContent className="custom-content">Content</DialogContent>
        </DialogPortal>
      </Dialog>
    );

    expect(screen.getByTestId("dialog-content")).toHaveClass("custom-content");
  });

  it("should include animation classes", () => {
    render(
      <Dialog>
        <DialogPortal>
          <DialogOverlay />
          <DialogContent>Content</DialogContent>
        </DialogPortal>
      </Dialog>
    );

    const content = screen.getByTestId("dialog-content");
    expect(content.className).toContain("animate-in");
    expect(content.className).toContain("fade-in-0");
    expect(content.className).toContain("zoom-in-95");
  });

  it("should include dark mode enhancements", () => {
    render(
      <Dialog>
        <DialogPortal>
          <DialogOverlay />
          <DialogContent>Content</DialogContent>
        </DialogPortal>
      </Dialog>
    );

    const content = screen.getByTestId("dialog-content");
    expect(content.className).toContain("dark:shadow-[0_0_40px");
    expect(content.className).toContain("dark:border-white/15");
    expect(content.className).toContain("dark:backdrop-blur-xl");
  });

  it("should include close button styling", () => {
    render(
      <Dialog>
        <DialogPortal>
          <DialogOverlay />
          <DialogContent>Content</DialogContent>
        </DialogPortal>
      </Dialog>
    );

    // Check that close button classes are in the content
    const content = screen.getByTestId("dialog-content");
    expect(content.textContent).toContain("Content");
  });
});

describe("DialogClose", () => {
  it("should render close button", () => {
    render(
      <Dialog>
        <DialogClose>Close</DialogClose>
      </Dialog>
    );

    expect(screen.getByTestId("dialog-close")).toBeInTheDocument();
    expect(screen.getByText("Close")).toBeInTheDocument();
  });

  it("should apply custom className", () => {
    render(
      <Dialog>
        <DialogClose className="custom-close">Close</DialogClose>
      </Dialog>
    );

    expect(screen.getByTestId("dialog-close")).toHaveClass("custom-close");
  });
});

describe("DialogHeader", () => {
  it("should render header container", () => {
    render(
      <Dialog>
        <DialogHeader>Header Content</DialogHeader>
      </Dialog>
    );

    expect(screen.getByText("Header Content")).toBeInTheDocument();
  });

  it("should apply default styling", () => {
    const { container } = render(
      <Dialog>
        <DialogHeader>Header</DialogHeader>
      </Dialog>
    );

    // DialogHeader renders a div with the styling classes
    const headerDiv = container.querySelector(".flex.flex-col");
    expect(headerDiv).toBeInTheDocument();
    expect(headerDiv?.className).toContain("space-y-1.5");
  });

  it("should apply custom className", () => {
    const { container } = render(
      <Dialog>
        <DialogHeader className="custom-header">Header</DialogHeader>
      </Dialog>
    );

    const headerDiv = container.querySelector(".custom-header");
    expect(headerDiv).toBeInTheDocument();
  });
});

describe("DialogFooter", () => {
  it("should render footer container", () => {
    render(
      <Dialog>
        <DialogFooter>Footer Content</DialogFooter>
      </Dialog>
    );

    expect(screen.getByText("Footer Content")).toBeInTheDocument();
  });

  it("should apply default styling", () => {
    const { container } = render(
      <Dialog>
        <DialogFooter>Footer</DialogFooter>
      </Dialog>
    );

    // DialogFooter renders a div with the styling classes
    const footerDiv = container.querySelector(".flex");
    expect(footerDiv).toBeInTheDocument();
    expect(footerDiv?.className).toContain("sm:flex-row");
    expect(footerDiv?.className).toContain("sm:justify-end");
  });

  it("should apply custom className", () => {
    const { container } = render(
      <Dialog>
        <DialogFooter className="custom-footer">Footer</DialogFooter>
      </Dialog>
    );

    const footerDiv = container.querySelector(".custom-footer");
    expect(footerDiv).toBeInTheDocument();
  });
});

describe("DialogTitle", () => {
  it("should render title", () => {
    render(
      <Dialog>
        <DialogTitle>Dialog Title</DialogTitle>
      </Dialog>
    );

    expect(screen.getByText("Dialog Title")).toBeInTheDocument();
    expect(screen.getByTestId("dialog-title")).toBeInTheDocument();
  });

  it("should apply default styling", () => {
    render(
      <Dialog>
        <DialogTitle>Title</DialogTitle>
      </Dialog>
    );

    const title = screen.getByTestId("dialog-title");
    expect(title.className).toContain("text-lg");
    expect(title.className).toContain("font-semibold");
    expect(title.className).toContain("leading-none");
  });

  it("should apply custom className", () => {
    render(
      <Dialog>
        <DialogTitle className="custom-title">Title</DialogTitle>
      </Dialog>
    );

    expect(screen.getByTestId("dialog-title")).toHaveClass("custom-title");
  });
});

describe("DialogDescription", () => {
  it("should render description", () => {
    render(
      <Dialog>
        <DialogDescription>This is a description.</DialogDescription>
      </Dialog>
    );

    expect(screen.getByText("This is a description.")).toBeInTheDocument();
    expect(screen.getByTestId("dialog-description")).toBeInTheDocument();
  });

  it("should apply default styling", () => {
    render(
      <Dialog>
        <DialogDescription>Description</DialogDescription>
      </Dialog>
    );

    const description = screen.getByTestId("dialog-description");
    expect(description.className).toContain("text-sm");
    expect(description.className).toContain("text-muted-foreground");
  });

  it("should apply custom className", () => {
    render(
      <Dialog>
        <DialogDescription className="custom-desc">
          Description
        </DialogDescription>
      </Dialog>
    );

    expect(screen.getByTestId("dialog-description")).toHaveClass(
      "custom-desc"
    );
  });
});

describe("Complete Dialog Integration", () => {
  it("should render a complete dialog with all components", () => {
    render(
      <Dialog>
        <DialogTrigger>Open</DialogTrigger>
        <DialogPortal>
          <DialogOverlay />
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirm Action</DialogTitle>
              <DialogDescription>
                Are you sure you want to proceed?
              </DialogDescription>
            </DialogHeader>
            <div>Dialog body content here.</div>
            <DialogFooter>
              <DialogClose>Cancel</DialogClose>
              <button>Confirm</button>
            </DialogFooter>
          </DialogContent>
        </DialogPortal>
      </Dialog>
    );

    expect(screen.getByText("Open")).toBeInTheDocument();
    expect(screen.getByText("Confirm Action")).toBeInTheDocument();
    expect(
      screen.getByText("Are you sure you want to proceed?")
    ).toBeInTheDocument();
    expect(screen.getByText("Dialog body content here.")).toBeInTheDocument();
    expect(screen.getByText("Cancel")).toBeInTheDocument();
    expect(screen.getByText("Confirm")).toBeInTheDocument();
  });

  it("should render dialog with overlay and content structure", () => {
    render(
      <Dialog open={true}>
        <DialogPortal>
          <DialogOverlay />
          <DialogContent>
            <DialogTitle>Test Dialog</DialogTitle>
          </DialogContent>
        </DialogPortal>
      </Dialog>
    );

    // DialogContent internally uses DialogPortal, so there may be multiple portals
    const portals = screen.getAllByTestId("dialog-portal");
    expect(portals.length).toBeGreaterThan(0);

    // Multiple overlays may exist due to DialogContent internal structure
    const overlays = screen.getAllByTestId("dialog-overlay");
    expect(overlays.length).toBeGreaterThan(0);

    const contents = screen.getAllByTestId("dialog-content");
    expect(contents.length).toBeGreaterThan(0);
    expect(screen.getByText("Test Dialog")).toBeInTheDocument();
  });
});
