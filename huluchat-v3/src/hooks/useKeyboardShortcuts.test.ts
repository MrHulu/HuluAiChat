/**
 * useKeyboardShortcuts Hook Tests
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { useKeyboardShortcuts, KEYBOARD_SHORTCUTS } from "./useKeyboardShortcuts";

describe("useKeyboardShortcuts hook", () => {
  let onNewSession: () => void;
  let onToggleSidebar: () => void;
  let onOpenSettings: () => void;

  beforeEach(() => {
    onNewSession = vi.fn() as () => void;
    onToggleSidebar = vi.fn() as () => void;
    onOpenSettings = vi.fn() as () => void;
    vi.clearAllMocks();
  });

  afterEach(() => {
    // Clean up event listeners
    window.removeEventListener("keydown", () => {});
  });

  describe("KEYBOARD_SHORTCUTS constant", () => {
    it("should export keyboard shortcuts list", () => {
      expect(KEYBOARD_SHORTCUTS).toBeDefined();
      expect(KEYBOARD_SHORTCUTS.length).toBeGreaterThan(0);
    });

    it("should include common shortcuts", () => {
      const keys = KEYBOARD_SHORTCUTS.map((s) => s.key);
      expect(keys).toContain("Ctrl/Cmd + N");
      expect(keys).toContain("Ctrl/Cmd + B");
      expect(keys).toContain("Ctrl/Cmd + ,");
    });
  });

  describe("with macOS platform", () => {
    let originalPlatform: string;

    beforeEach(() => {
      originalPlatform = navigator.platform;
      Object.defineProperty(window.navigator, "platform", {
        value: "MacIntel",
        writable: true,
        configurable: true,
      });
    });

    afterEach(() => {
      Object.defineProperty(window.navigator, "platform", {
        value: originalPlatform,
        writable: true,
        configurable: true,
      });
    });

    it("should register event listener on mount", () => {
      const addSpy = vi.spyOn(window, "addEventListener");
      renderHook(() =>
        useKeyboardShortcuts({ onNewSession, onToggleSidebar, onOpenSettings })
      );
      expect(addSpy).toHaveBeenCalledWith("keydown", expect.any(Function));
      addSpy.mockRestore();
    });

    it("should remove event listener on unmount", () => {
      const removeSpy = vi.spyOn(window, "removeEventListener");
      const { unmount } = renderHook(() =>
        useKeyboardShortcuts({ onNewSession, onToggleSidebar, onOpenSettings })
      );
      unmount();
      expect(removeSpy).toHaveBeenCalledWith("keydown", expect.any(Function));
      removeSpy.mockRestore();
    });

    it("should call onNewSession on Cmd+N", () => {
      renderHook(() =>
        useKeyboardShortcuts({ onNewSession, onToggleSidebar, onOpenSettings })
      );

      const event = new KeyboardEvent("keydown", {
        key: "n",
        metaKey: true,
        bubbles: true,
      });
      const preventDefaultSpy = vi.spyOn(event, "preventDefault");

      window.dispatchEvent(event);

      expect(preventDefaultSpy).toHaveBeenCalled();
      expect(onNewSession).toHaveBeenCalled();
    });

    it("should call onToggleSidebar on Cmd+B", () => {
      renderHook(() =>
        useKeyboardShortcuts({ onNewSession, onToggleSidebar, onOpenSettings })
      );

      const event = new KeyboardEvent("keydown", {
        key: "b",
        metaKey: true,
        bubbles: true,
      });
      const preventDefaultSpy = vi.spyOn(event, "preventDefault");

      window.dispatchEvent(event);

      expect(preventDefaultSpy).toHaveBeenCalled();
      expect(onToggleSidebar).toHaveBeenCalled();
    });

    it("should call onOpenSettings on Cmd+,", () => {
      renderHook(() =>
        useKeyboardShortcuts({ onNewSession, onToggleSidebar, onOpenSettings })
      );

      const event = new KeyboardEvent("keydown", {
        key: ",",
        metaKey: true,
        bubbles: true,
      });
      const preventDefaultSpy = vi.spyOn(event, "preventDefault");

      window.dispatchEvent(event);

      expect(preventDefaultSpy).toHaveBeenCalled();
      expect(onOpenSettings).toHaveBeenCalled();
    });

    it("should NOT respond to Ctrl+N on macOS", () => {
      renderHook(() =>
        useKeyboardShortcuts({ onNewSession, onToggleSidebar, onOpenSettings })
      );

      const event = new KeyboardEvent("keydown", {
        key: "n",
        ctrlKey: true,
        bubbles: true,
      });

      window.dispatchEvent(event);

      expect(onNewSession).not.toHaveBeenCalled();
    });
  });

  describe("with non-macOS platform", () => {
    let originalPlatform: string;

    beforeEach(() => {
      originalPlatform = navigator.platform;
      Object.defineProperty(window.navigator, "platform", {
        value: "Win32",
        writable: true,
        configurable: true,
      });
    });

    afterEach(() => {
      Object.defineProperty(window.navigator, "platform", {
        value: originalPlatform,
        writable: true,
        configurable: true,
      });
    });

    it("should call onNewSession on Ctrl+N", () => {
      renderHook(() =>
        useKeyboardShortcuts({ onNewSession, onToggleSidebar, onOpenSettings })
      );

      const event = new KeyboardEvent("keydown", {
        key: "n",
        ctrlKey: true,
        bubbles: true,
      });
      const preventDefaultSpy = vi.spyOn(event, "preventDefault");

      window.dispatchEvent(event);

      expect(preventDefaultSpy).toHaveBeenCalled();
      expect(onNewSession).toHaveBeenCalled();
    });

    it("should NOT respond to Cmd+N on Windows", () => {
      renderHook(() =>
        useKeyboardShortcuts({ onNewSession, onToggleSidebar, onOpenSettings })
      );

      const event = new KeyboardEvent("keydown", {
        key: "n",
        metaKey: true,
        bubbles: true,
      });

      window.dispatchEvent(event);

      expect(onNewSession).not.toHaveBeenCalled();
    });

    it("should call onToggleSidebar on Ctrl+B", () => {
      renderHook(() =>
        useKeyboardShortcuts({ onNewSession, onToggleSidebar, onOpenSettings })
      );

      const event = new KeyboardEvent("keydown", {
        key: "b",
        ctrlKey: true,
        bubbles: true,
      });
      const preventDefaultSpy = vi.spyOn(event, "preventDefault");

      window.dispatchEvent(event);

      expect(preventDefaultSpy).toHaveBeenCalled();
      expect(onToggleSidebar).toHaveBeenCalled();
    });

    it("should call onOpenSettings on Ctrl+,", () => {
      renderHook(() =>
        useKeyboardShortcuts({ onNewSession, onToggleSidebar, onOpenSettings })
      );

      const event = new KeyboardEvent("keydown", {
        key: ",",
        ctrlKey: true,
        bubbles: true,
      });
      const preventDefaultSpy = vi.spyOn(event, "preventDefault");

      window.dispatchEvent(event);

      expect(preventDefaultSpy).toHaveBeenCalled();
      expect(onOpenSettings).toHaveBeenCalled();
    });
  });

  describe("with input focus", () => {
    it("should NOT respond to shortcuts when input is focused", () => {
      renderHook(() =>
        useKeyboardShortcuts({ onNewSession, onToggleSidebar, onOpenSettings })
      );

      const input = document.createElement("input");
      document.body.appendChild(input);

      const event = new KeyboardEvent("keydown", {
        key: "n",
        ctrlKey: true,
        bubbles: true,
      });

      Object.defineProperty(event, "target", {
        value: input,
        writable: false,
      });

      window.dispatchEvent(event);

      expect(onNewSession).not.toHaveBeenCalled();

      document.body.removeChild(input);
    });

    it("should NOT respond to shortcuts when textarea is focused", () => {
      renderHook(() =>
        useKeyboardShortcuts({ onNewSession, onToggleSidebar, onOpenSettings })
      );

      const textarea = document.createElement("textarea");
      document.body.appendChild(textarea);

      const event = new KeyboardEvent("keydown", {
        key: "b",
        ctrlKey: true,
        bubbles: true,
      });

      Object.defineProperty(event, "target", {
        value: textarea,
        writable: false,
      });

      window.dispatchEvent(event);

      expect(onToggleSidebar).not.toHaveBeenCalled();

      document.body.removeChild(textarea);
    });

    it("should NOT respond to shortcuts when contenteditable is focused", () => {
      renderHook(() =>
        useKeyboardShortcuts({ onNewSession, onToggleSidebar, onOpenSettings })
      );

      const div = document.createElement("div");
      div.contentEditable = "true";
      document.body.appendChild(div);

      const event = new KeyboardEvent("keydown", {
        key: ",",
        ctrlKey: true,
        bubbles: true,
      });

      // Mock target with isContentEditable property
      Object.defineProperty(event, "target", {
        value: {
          tagName: "DIV",
          isContentEditable: true,
        },
        writable: false,
      });

      window.dispatchEvent(event);

      expect(onOpenSettings).not.toHaveBeenCalled();

      document.body.removeChild(div);
    });
  });

  describe("with enabled option", () => {
    it("should NOT respond to shortcuts when disabled", () => {
      renderHook(() =>
        useKeyboardShortcuts({
          onNewSession,
          onToggleSidebar,
          onOpenSettings,
          enabled: false,
        })
      );

      const event = new KeyboardEvent("keydown", {
        key: "n",
        ctrlKey: true,
        bubbles: true,
      });

      window.dispatchEvent(event);

      expect(onNewSession).not.toHaveBeenCalled();
    });
  });

  describe("Escape key", () => {
    it("should NOT call callbacks on Escape", () => {
      renderHook(() =>
        useKeyboardShortcuts({ onNewSession, onToggleSidebar, onOpenSettings })
      );

      const event = new KeyboardEvent("keydown", {
        key: "Escape",
        bubbles: true,
      });

      window.dispatchEvent(event);

      expect(onNewSession).not.toHaveBeenCalled();
      expect(onToggleSidebar).not.toHaveBeenCalled();
      expect(onOpenSettings).not.toHaveBeenCalled();
    });
  });

  describe("case sensitivity", () => {
    it("should work with uppercase N", () => {
      // Set to non-macOS for Ctrl key
      Object.defineProperty(window.navigator, "platform", {
        value: "Win32",
        writable: true,
        configurable: true,
      });

      renderHook(() =>
        useKeyboardShortcuts({ onNewSession, onToggleSidebar, onOpenSettings })
      );

      const event = new KeyboardEvent("keydown", {
        key: "N",
        ctrlKey: true,
        bubbles: true,
      });

      window.dispatchEvent(event);

      expect(onNewSession).toHaveBeenCalled();
    });
  });

  describe("session switching shortcuts (Ctrl+1/2/3)", () => {
    let onSwitchSession: (index: number) => void;

    beforeEach(() => {
      onSwitchSession = vi.fn() as (index: number) => void;
    });

    describe("with non-macOS platform", () => {
      beforeEach(() => {
        Object.defineProperty(window.navigator, "platform", {
          value: "Win32",
          writable: true,
          configurable: true,
        });
      });

      it("should call onSwitchSession with index 0 on Ctrl+1", () => {
        renderHook(() =>
          useKeyboardShortcuts({
            onNewSession,
            onToggleSidebar,
            onOpenSettings,
            onSwitchSession,
          })
        );

        const event = new KeyboardEvent("keydown", {
          key: "1",
          ctrlKey: true,
          bubbles: true,
        });
        const preventDefaultSpy = vi.spyOn(event, "preventDefault");

        window.dispatchEvent(event);

        expect(preventDefaultSpy).toHaveBeenCalled();
        expect(onSwitchSession).toHaveBeenCalledWith(0);
      });

      it("should call onSwitchSession with index 1 on Ctrl+2", () => {
        renderHook(() =>
          useKeyboardShortcuts({
            onNewSession,
            onToggleSidebar,
            onOpenSettings,
            onSwitchSession,
          })
        );

        const event = new KeyboardEvent("keydown", {
          key: "2",
          ctrlKey: true,
          bubbles: true,
        });
        const preventDefaultSpy = vi.spyOn(event, "preventDefault");

        window.dispatchEvent(event);

        expect(preventDefaultSpy).toHaveBeenCalled();
        expect(onSwitchSession).toHaveBeenCalledWith(1);
      });

      it("should call onSwitchSession with index 2 on Ctrl+3", () => {
        renderHook(() =>
          useKeyboardShortcuts({
            onNewSession,
            onToggleSidebar,
            onOpenSettings,
            onSwitchSession,
          })
        );

        const event = new KeyboardEvent("keydown", {
          key: "3",
          ctrlKey: true,
          bubbles: true,
        });
        const preventDefaultSpy = vi.spyOn(event, "preventDefault");

        window.dispatchEvent(event);

        expect(preventDefaultSpy).toHaveBeenCalled();
        expect(onSwitchSession).toHaveBeenCalledWith(2);
      });

      it("should NOT respond to Ctrl+4 (only 1-3 supported)", () => {
        renderHook(() =>
          useKeyboardShortcuts({
            onNewSession,
            onToggleSidebar,
            onOpenSettings,
            onSwitchSession,
          })
        );

        const event = new KeyboardEvent("keydown", {
          key: "4",
          ctrlKey: true,
          bubbles: true,
        });

        window.dispatchEvent(event);

        expect(onSwitchSession).not.toHaveBeenCalled();
      });
    });

    describe("with macOS platform", () => {
      beforeEach(() => {
        Object.defineProperty(window.navigator, "platform", {
          value: "MacIntel",
          writable: true,
          configurable: true,
        });
      });

      it("should call onSwitchSession on Cmd+1", () => {
        renderHook(() =>
          useKeyboardShortcuts({
            onNewSession,
            onToggleSidebar,
            onOpenSettings,
            onSwitchSession,
          })
        );

        const event = new KeyboardEvent("keydown", {
          key: "1",
          metaKey: true,
          bubbles: true,
        });
        const preventDefaultSpy = vi.spyOn(event, "preventDefault");

        window.dispatchEvent(event);

        expect(preventDefaultSpy).toHaveBeenCalled();
        expect(onSwitchSession).toHaveBeenCalledWith(0);
      });
    });
  });
});
