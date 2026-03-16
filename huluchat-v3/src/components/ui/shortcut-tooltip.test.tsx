import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ShortcutTooltip } from "./shortcut-tooltip";
import { TooltipProvider } from "./tooltip";
import { Button } from "./button";

// Helper to render with TooltipProvider
const renderWithProvider = (ui: React.ReactElement) => {
  return render(<TooltipProvider>{ui}</TooltipProvider>);
};

describe("ShortcutTooltip", () => {
  it("should render children", () => {
    renderWithProvider(
      <ShortcutTooltip
        label="Test Label"
        shortcutMac="⌘K"
        shortcutWindows="Ctrl+K"
      >
        <Button>Click me</Button>
      </ShortcutTooltip>
    );

    expect(screen.getByRole("button", { name: "Click me" })).toBeInTheDocument();
  });

  it("should show label and Mac shortcut on hover (Mac environment)", async () => {
    // Mock macOS
    vi.spyOn(navigator, "platform", "get").mockReturnValue("MacIntel");

    const user = userEvent.setup();

    renderWithProvider(
      <ShortcutTooltip
        label="New Chat"
        shortcutMac="⌘N"
        shortcutWindows="Ctrl+N"
        translateLabel={false}
      >
        <Button>Click</Button>
      </ShortcutTooltip>
    );

    const button = screen.getByRole("button", { name: "Click" });
    await user.hover(button);

    // Wait for tooltip to appear
    await waitFor(() => {
      const tooltip = screen.getByRole("tooltip");
      expect(tooltip).toHaveTextContent("New Chat");
      expect(tooltip).toHaveTextContent("⌘N");
    });
  });

  it("should show Windows shortcut on Windows environment", async () => {
    // Mock Windows
    vi.spyOn(navigator, "platform", "get").mockReturnValue("Win32");

    const user = userEvent.setup();

    renderWithProvider(
      <ShortcutTooltip
        label="settings"
        shortcutMac="⌘,"
        shortcutWindows="Ctrl+,"
        translateLabel={false}
      >
        <Button>Settings</Button>
      </ShortcutTooltip>
    );

    const button = screen.getByRole("button", { name: "Settings" });
    await user.hover(button);

    await waitFor(() => {
      const tooltip = screen.getByRole("tooltip");
      expect(tooltip).toHaveTextContent("settings");
      expect(tooltip).toHaveTextContent("Ctrl+,");
    });
  });

  it("should not show tooltip when disabled", async () => {
    const user = userEvent.setup();

    renderWithProvider(
      <ShortcutTooltip
        label="Test"
        shortcutMac="⌘T"
        shortcutWindows="Ctrl+T"
        disabled={true}
      >
        <Button>Test Button</Button>
      </ShortcutTooltip>
    );

    const button = screen.getByRole("button", { name: "Test Button" });
    await user.hover(button);

    // Wait a bit and check tooltip does not appear
    await waitFor(
      () => {
        expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
      },
      { timeout: 1000 }
    );
  });

  it("should render kbd element with correct aria-label", async () => {
    const user = userEvent.setup();

    renderWithProvider(
      <ShortcutTooltip
        label="Toggle Sidebar"
        shortcutMac="⌘B"
        shortcutWindows="Ctrl+B"
        translateLabel={false}
      >
        <Button>Sidebar</Button>
      </ShortcutTooltip>
    );

    const button = screen.getByRole("button", { name: "Sidebar" });
    await user.hover(button);

    await waitFor(() => {
      // Find kbd element within tooltip
      const tooltip = screen.getByRole("tooltip");
      const kbd = tooltip.querySelector("kbd");
      expect(kbd).toBeInTheDocument();
      expect(kbd).toHaveAttribute("aria-label");
    });
  });
});
