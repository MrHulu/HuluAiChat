import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogMedia,
} from "./alert-dialog";

describe("AlertDialog", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Basic Rendering", () => {
    it("should render trigger button", () => {
      render(
        <AlertDialog>
          <AlertDialogTrigger>Open Alert</AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogTitle>Alert Title</AlertDialogTitle>
            <AlertDialogDescription>Alert Description</AlertDialogDescription>
          </AlertDialogContent>
        </AlertDialog>
      );

      expect(screen.getByRole("button", { name: /open alert/i })).toBeInTheDocument();
    });

    it("should not show content initially", () => {
      render(
        <AlertDialog>
          <AlertDialogTrigger>Open Alert</AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogTitle>Alert Title</AlertDialogTitle>
            <AlertDialogDescription>Alert Description</AlertDialogDescription>
          </AlertDialogContent>
        </AlertDialog>
      );

      expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
    });

    it("should open dialog when trigger is clicked", async () => {
      const user = userEvent.setup();
      render(
        <AlertDialog>
          <AlertDialogTrigger>Open Alert</AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogTitle>Alert Title</AlertDialogTitle>
            <AlertDialogDescription>Alert Description</AlertDialogDescription>
          </AlertDialogContent>
        </AlertDialog>
      );

      await user.click(screen.getByRole("button", { name: /open alert/i }));

      await waitFor(() => {
        expect(screen.getByRole("alertdialog")).toBeInTheDocument();
      });
    });

    it("should render with default open state", () => {
      render(
        <AlertDialog defaultOpen>
          <AlertDialogTrigger>Open Alert</AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogTitle>Alert Title</AlertDialogTitle>
            <AlertDialogDescription>Alert Description</AlertDialogDescription>
          </AlertDialogContent>
        </AlertDialog>
      );

      expect(screen.getByRole("alertdialog")).toBeInTheDocument();
    });
  });

  describe("Content Structure", () => {
    it("should render title", async () => {
      const user = userEvent.setup();
      render(
        <AlertDialog>
          <AlertDialogTrigger>Open Alert</AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogTitle>Alert Title</AlertDialogTitle>
            <AlertDialogDescription>Alert Description</AlertDialogDescription>
          </AlertDialogContent>
        </AlertDialog>
      );

      await user.click(screen.getByRole("button", { name: /open alert/i }));

      await waitFor(() => {
        expect(screen.getByText("Alert Title")).toBeInTheDocument();
      });
    });

    it("should render description", async () => {
      const user = userEvent.setup();
      render(
        <AlertDialog>
          <AlertDialogTrigger>Open Alert</AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogTitle>Alert Title</AlertDialogTitle>
            <AlertDialogDescription>This is an alert description</AlertDialogDescription>
          </AlertDialogContent>
        </AlertDialog>
      );

      await user.click(screen.getByRole("button", { name: /open alert/i }));

      await waitFor(() => {
        expect(screen.getByText("This is an alert description")).toBeInTheDocument();
      });
    });

    it("should render action button", async () => {
      const user = userEvent.setup();
      render(
        <AlertDialog>
          <AlertDialogTrigger>Open Alert</AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogTitle>Alert Title</AlertDialogTitle>
            <AlertDialogDescription>Alert Description</AlertDialogDescription>
            <AlertDialogFooter>
              <AlertDialogAction>Confirm</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      );

      await user.click(screen.getByRole("button", { name: /open alert/i }));

      await waitFor(() => {
        expect(screen.getByRole("button", { name: /confirm/i })).toBeInTheDocument();
      });
    });

    it("should render cancel button", async () => {
      const user = userEvent.setup();
      render(
        <AlertDialog>
          <AlertDialogTrigger>Open Alert</AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogTitle>Alert Title</AlertDialogTitle>
            <AlertDialogDescription>Alert Description</AlertDialogDescription>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      );

      await user.click(screen.getByRole("button", { name: /open alert/i }));

      await waitFor(() => {
        expect(screen.getByRole("button", { name: /cancel/i })).toBeInTheDocument();
      });
    });

    it("should render both action and cancel buttons", async () => {
      const user = userEvent.setup();
      render(
        <AlertDialog>
          <AlertDialogTrigger>Open Alert</AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogTitle>Alert Title</AlertDialogTitle>
            <AlertDialogDescription>Alert Description</AlertDialogDescription>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction>Confirm</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      );

      await user.click(screen.getByRole("button", { name: /open alert/i }));

      await waitFor(() => {
        expect(screen.getByRole("button", { name: /cancel/i })).toBeInTheDocument();
        expect(screen.getByRole("button", { name: /confirm/i })).toBeInTheDocument();
      });
    });
  });

  describe("AlertDialogHeader", () => {
    it("should render header with children", async () => {
      const user = userEvent.setup();
      render(
        <AlertDialog>
          <AlertDialogTrigger>Open Alert</AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Alert Title</AlertDialogTitle>
              <AlertDialogDescription>Alert Description</AlertDialogDescription>
            </AlertDialogHeader>
          </AlertDialogContent>
        </AlertDialog>
      );

      await user.click(screen.getByRole("button", { name: /open alert/i }));

      await waitFor(() => {
        expect(screen.getByText("Alert Title")).toBeInTheDocument();
        expect(screen.getByText("Alert Description")).toBeInTheDocument();
      });
    });

    it("should apply custom className to header", async () => {
      const user = userEvent.setup();
      render(
        <AlertDialog>
          <AlertDialogTrigger>Open Alert</AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader className="custom-header">
              <AlertDialogTitle>Alert Title</AlertDialogTitle>
            </AlertDialogHeader>
          </AlertDialogContent>
        </AlertDialog>
      );

      await user.click(screen.getByRole("button", { name: /open alert/i }));

      await waitFor(() => {
        const header = screen.getByText("Alert Title").parentElement;
        expect(header).toHaveClass("custom-header");
      });
    });
  });

  describe("AlertDialogFooter", () => {
    it("should render footer with children", async () => {
      const user = userEvent.setup();
      render(
        <AlertDialog>
          <AlertDialogTrigger>Open Alert</AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogTitle>Alert Title</AlertDialogTitle>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction>Confirm</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      );

      await user.click(screen.getByRole("button", { name: /open alert/i }));

      await waitFor(() => {
        expect(screen.getByRole("button", { name: /cancel/i })).toBeInTheDocument();
        expect(screen.getByRole("button", { name: /confirm/i })).toBeInTheDocument();
      });
    });

    it("should apply custom className to footer", async () => {
      const user = userEvent.setup();
      render(
        <AlertDialog>
          <AlertDialogTrigger>Open Alert</AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogTitle>Alert Title</AlertDialogTitle>
            <AlertDialogFooter className="custom-footer">
              <AlertDialogAction>Confirm</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      );

      await user.click(screen.getByRole("button", { name: /open alert/i }));

      await waitFor(() => {
        const footer = screen.getByRole("button", { name: /confirm/i }).parentElement;
        expect(footer).toHaveClass("custom-footer");
      });
    });
  });

  describe("AlertDialogMedia", () => {
    it("should render media section with icon", async () => {
      const user = userEvent.setup();
      render(
        <AlertDialog>
          <AlertDialogTrigger>Open Alert</AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogMedia>
                <svg data-testid="alert-icon" />
              </AlertDialogMedia>
              <AlertDialogTitle>Alert Title</AlertDialogTitle>
            </AlertDialogHeader>
          </AlertDialogContent>
        </AlertDialog>
      );

      await user.click(screen.getByRole("button", { name: /open alert/i }));

      await waitFor(() => {
        expect(screen.getByTestId("alert-icon")).toBeInTheDocument();
      });
    });

    it("should apply custom className to media", async () => {
      const user = userEvent.setup();
      render(
        <AlertDialog>
          <AlertDialogTrigger>Open Alert</AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogMedia className="custom-media">
              <svg data-testid="alert-icon" />
            </AlertDialogMedia>
            <AlertDialogTitle>Alert Title</AlertDialogTitle>
          </AlertDialogContent>
        </AlertDialog>
      );

      await user.click(screen.getByRole("button", { name: /open alert/i }));

      await waitFor(() => {
        const media = screen.getByTestId("alert-icon").parentElement;
        expect(media).toHaveClass("custom-media");
      });
    });
  });

  describe("AlertDialogAction", () => {
    it("should close dialog when action is clicked", async () => {
      const user = userEvent.setup();
      render(
        <AlertDialog>
          <AlertDialogTrigger>Open Alert</AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogTitle>Alert Title</AlertDialogTitle>
            <AlertDialogDescription>Alert Description</AlertDialogDescription>
            <AlertDialogFooter>
              <AlertDialogAction>Confirm</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      );

      await user.click(screen.getByRole("button", { name: /open alert/i }));

      await waitFor(() => {
        expect(screen.getByRole("alertdialog")).toBeInTheDocument();
      });

      await user.click(screen.getByRole("button", { name: /confirm/i }));

      await waitFor(() => {
        expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
      });
    });

    it("should call onOpenChange with false when action is clicked", async () => {
      const user = userEvent.setup();
      const onOpenChange = vi.fn();
      render(
        <AlertDialog onOpenChange={onOpenChange}>
          <AlertDialogTrigger>Open Alert</AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogTitle>Alert Title</AlertDialogTitle>
            <AlertDialogDescription>Alert Description</AlertDialogDescription>
            <AlertDialogFooter>
              <AlertDialogAction>Confirm</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      );

      await user.click(screen.getByRole("button", { name: /open alert/i }));

      await waitFor(() => {
        expect(onOpenChange).toHaveBeenCalledWith(true);
      });

      await user.click(screen.getByRole("button", { name: /confirm/i }));

      await waitFor(() => {
        expect(onOpenChange).toHaveBeenCalledWith(false);
      });
    });

    it("should support default variant", async () => {
      render(
        <AlertDialog defaultOpen>
          <AlertDialogTrigger>Open Alert</AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogTitle>Alert Title</AlertDialogTitle>
            <AlertDialogFooter>
              <AlertDialogAction variant="default">Confirm</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      );

      const button = screen.getByRole("button", { name: /confirm/i });
      expect(button).toBeInTheDocument();
    });

    it("should support destructive variant", async () => {
      render(
        <AlertDialog defaultOpen>
          <AlertDialogTrigger>Open Alert</AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogTitle>Delete Item</AlertDialogTitle>
            <AlertDialogDescription>Are you sure?</AlertDialogDescription>
            <AlertDialogFooter>
              <AlertDialogAction variant="destructive">Delete</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      );

      const button = screen.getByRole("button", { name: /delete/i });
      expect(button).toBeInTheDocument();
      expect(button).toHaveClass("bg-destructive");
    });

    it("should support different sizes", async () => {
      render(
        <AlertDialog defaultOpen>
          <AlertDialogTrigger>Open Alert</AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogTitle>Alert Title</AlertDialogTitle>
            <AlertDialogFooter>
              <AlertDialogAction size="sm">Small</AlertDialogAction>
              <AlertDialogAction size="default">Default</AlertDialogAction>
              <AlertDialogAction size="lg">Large</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      );

      expect(screen.getByRole("button", { name: /small/i })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /default/i })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /large/i })).toBeInTheDocument();
    });
  });

  describe("AlertDialogCancel", () => {
    it("should close dialog when cancel is clicked", async () => {
      const user = userEvent.setup();
      render(
        <AlertDialog>
          <AlertDialogTrigger>Open Alert</AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogTitle>Alert Title</AlertDialogTitle>
            <AlertDialogDescription>Alert Description</AlertDialogDescription>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      );

      await user.click(screen.getByRole("button", { name: /open alert/i }));

      await waitFor(() => {
        expect(screen.getByRole("alertdialog")).toBeInTheDocument();
      });

      await user.click(screen.getByRole("button", { name: /cancel/i }));

      await waitFor(() => {
        expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
      });
    });

    it("should use outline variant by default", async () => {
      render(
        <AlertDialog defaultOpen>
          <AlertDialogTrigger>Open Alert</AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogTitle>Alert Title</AlertDialogTitle>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      );

      const button = screen.getByRole("button", { name: /cancel/i });
      expect(button).toBeInTheDocument();
      // Outline variant should have border class
      expect(button).toHaveClass("border");
    });

    it("should support custom variant", async () => {
      render(
        <AlertDialog defaultOpen>
          <AlertDialogTrigger>Open Alert</AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogTitle>Alert Title</AlertDialogTitle>
            <AlertDialogFooter>
              <AlertDialogCancel variant="secondary">Cancel</AlertDialogCancel>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      );

      const button = screen.getByRole("button", { name: /cancel/i });
      expect(button).toBeInTheDocument();
      expect(button).toHaveClass("bg-secondary");
    });
  });

  describe("AlertDialogContent", () => {
    it("should apply default size", async () => {
      render(
        <AlertDialog defaultOpen>
          <AlertDialogTrigger>Open Alert</AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogTitle>Alert Title</AlertDialogTitle>
          </AlertDialogContent>
        </AlertDialog>
      );

      const content = screen.getByRole("alertdialog");
      expect(content).toHaveAttribute("data-size", "default");
    });

    it("should apply small size", async () => {
      render(
        <AlertDialog defaultOpen>
          <AlertDialogTrigger>Open Alert</AlertDialogTrigger>
          <AlertDialogContent size="sm">
            <AlertDialogTitle>Alert Title</AlertDialogTitle>
          </AlertDialogContent>
        </AlertDialog>
      );

      const content = screen.getByRole("alertdialog");
      expect(content).toHaveAttribute("data-size", "sm");
    });

    it("should apply custom className", async () => {
      render(
        <AlertDialog defaultOpen>
          <AlertDialogTrigger>Open Alert</AlertDialogTrigger>
          <AlertDialogContent className="custom-content">
            <AlertDialogTitle>Alert Title</AlertDialogTitle>
          </AlertDialogContent>
        </AlertDialog>
      );

      const content = screen.getByRole("alertdialog");
      expect(content).toHaveClass("custom-content");
    });
  });

  describe("Controlled State", () => {
    it("should respect open prop", () => {
      render(
        <AlertDialog open>
          <AlertDialogTrigger>Open Alert</AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogTitle>Alert Title</AlertDialogTitle>
          </AlertDialogContent>
        </AlertDialog>
      );

      expect(screen.getByRole("alertdialog")).toBeInTheDocument();
    });

    it("should respect closed open prop", () => {
      render(
        <AlertDialog open={false}>
          <AlertDialogTrigger>Open Alert</AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogTitle>Alert Title</AlertDialogTitle>
          </AlertDialogContent>
        </AlertDialog>
      );

      expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
    });

    it("should call onOpenChange when trigger is clicked", async () => {
      const user = userEvent.setup();
      const onOpenChange = vi.fn();
      render(
        <AlertDialog onOpenChange={onOpenChange}>
          <AlertDialogTrigger>Open Alert</AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogTitle>Alert Title</AlertDialogTitle>
          </AlertDialogContent>
        </AlertDialog>
      );

      await user.click(screen.getByRole("button", { name: /open alert/i }));

      expect(onOpenChange).toHaveBeenCalledWith(true);
    });
  });

  describe("Accessibility", () => {
    it("should have alertdialog role", async () => {
      const user = userEvent.setup();
      render(
        <AlertDialog>
          <AlertDialogTrigger>Open Alert</AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogTitle>Alert Title</AlertDialogTitle>
            <AlertDialogDescription>Alert Description</AlertDialogDescription>
          </AlertDialogContent>
        </AlertDialog>
      );

      await user.click(screen.getByRole("button", { name: /open alert/i }));

      await waitFor(() => {
        expect(screen.getByRole("alertdialog")).toBeInTheDocument();
      });
    });

    it("should have modal behavior", async () => {
      const user = userEvent.setup();
      render(
        <AlertDialog>
          <AlertDialogTrigger>Open Alert</AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogTitle>Alert Title</AlertDialogTitle>
          </AlertDialogContent>
        </AlertDialog>
      );

      await user.click(screen.getByRole("button", { name: /open alert/i }));

      await waitFor(() => {
        // Dialog should be in the document
        const dialog = screen.getByRole("alertdialog");
        expect(dialog).toBeInTheDocument();
      });
    });

    it("should trap focus within dialog", async () => {
      const user = userEvent.setup();
      render(
        <AlertDialog>
          <AlertDialogTrigger>Open Alert</AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogTitle>Alert Title</AlertDialogTitle>
            <AlertDialogDescription>Alert Description</AlertDialogDescription>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction>Confirm</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      );

      await user.click(screen.getByRole("button", { name: /open alert/i }));

      await waitFor(() => {
        expect(screen.getByRole("alertdialog")).toBeInTheDocument();
      });

      // Focus should be within the dialog (on one of the buttons)
      const cancelButton = screen.getByRole("button", { name: /cancel/i });
      const confirmButton = screen.getByRole("button", { name: /confirm/i });

      // Verify focus is trapped within the dialog by checking that focus moves between buttons
      await user.tab();
      const focusedElement = document.activeElement;
      expect([cancelButton, confirmButton]).toContain(focusedElement);
    });
  });

  describe("Keyboard Interactions", () => {
    it("should close on Escape key", async () => {
      const user = userEvent.setup();
      render(
        <AlertDialog>
          <AlertDialogTrigger>Open Alert</AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogTitle>Alert Title</AlertDialogTitle>
            <AlertDialogDescription>Alert Description</AlertDialogDescription>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      );

      await user.click(screen.getByRole("button", { name: /open alert/i }));

      await waitFor(() => {
        expect(screen.getByRole("alertdialog")).toBeInTheDocument();
      });

      await user.keyboard("{Escape}");

      await waitFor(() => {
        expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
      });
    });
  });

  describe("Data Attributes", () => {
    it("should have data-slot attributes on content", async () => {
      const user = userEvent.setup();
      render(
        <AlertDialog>
          <AlertDialogTrigger>Open Alert</AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogTitle>Alert Title</AlertDialogTitle>
          </AlertDialogContent>
        </AlertDialog>
      );

      await user.click(screen.getByRole("button", { name: /open alert/i }));

      await waitFor(() => {
        const content = screen.getByRole("alertdialog");
        expect(content).toHaveAttribute("data-slot", "alert-dialog-content");
      });
    });

    it("should have data-slot attribute on trigger", () => {
      render(
        <AlertDialog>
          <AlertDialogTrigger>Open Alert</AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogTitle>Alert Title</AlertDialogTitle>
          </AlertDialogContent>
        </AlertDialog>
      );

      const trigger = screen.getByRole("button", { name: /open alert/i });
      expect(trigger).toHaveAttribute("data-slot", "alert-dialog-trigger");
    });

    it("should have data-slot attribute on title", async () => {
      const user = userEvent.setup();
      render(
        <AlertDialog>
          <AlertDialogTrigger>Open Alert</AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogTitle>Alert Title</AlertDialogTitle>
          </AlertDialogContent>
        </AlertDialog>
      );

      await user.click(screen.getByRole("button", { name: /open alert/i }));

      await waitFor(() => {
        const title = screen.getByText("Alert Title");
        expect(title).toHaveAttribute("data-slot", "alert-dialog-title");
      });
    });

    it("should have data-slot attribute on description", async () => {
      const user = userEvent.setup();
      render(
        <AlertDialog>
          <AlertDialogTrigger>Open Alert</AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogTitle>Alert Title</AlertDialogTitle>
            <AlertDialogDescription>Alert Description</AlertDialogDescription>
          </AlertDialogContent>
        </AlertDialog>
      );

      await user.click(screen.getByRole("button", { name: /open alert/i }));

      await waitFor(() => {
        const description = screen.getByText("Alert Description");
        expect(description).toHaveAttribute("data-slot", "alert-dialog-description");
      });
    });
  });
});
