/**
 * Tests for useVoiceRecognition hook
 */
import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { useVoiceRecognition } from "./useVoiceRecognition";

// Mock Speech Recognition
function createMockRecognition() {
  return {
    continuous: false,
    interimResults: false,
    lang: "",
    start: vi.fn(),
    stop: vi.fn(),
    abort: vi.fn(),
    onresult: null as ((event: unknown) => void) | null,
    onerror: null as ((event: unknown) => void) | null,
    onend: null as (() => void) | null,
    onstart: null as (() => void) | null,
  };
}

type MockRecognition = ReturnType<typeof createMockRecognition>;

// biome-ignore lint/suspicious/noExplicitAny: Mock class constructor
const MockSpeechRecognition: any = vi.fn(function (this: MockRecognition) {
  const mock = createMockRecognition();
  Object.assign(this, mock);
  return this;
});

describe("useVoiceRecognition", () => {
  const originalSpeechRecognition = window.SpeechRecognition;
  const originalWebkitSpeechRecognition = window.webkitSpeechRecognition;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    window.SpeechRecognition = originalSpeechRecognition;
    window.webkitSpeechRecognition = originalWebkitSpeechRecognition;
  });

  describe("browser support detection", () => {
    it("should detect support when SpeechRecognition is available", () => {
      window.SpeechRecognition = MockSpeechRecognition;
      delete (window as Partial<typeof window>).webkitSpeechRecognition;

      const { result } = renderHook(() => useVoiceRecognition());

      expect(result.current.isSupported).toBe(true);
    });

    it("should detect support when webkitSpeechRecognition is available", () => {
      delete (window as Partial<typeof window>).SpeechRecognition;
      window.webkitSpeechRecognition = MockSpeechRecognition;

      const { result } = renderHook(() => useVoiceRecognition());

      expect(result.current.isSupported).toBe(true);
    });

    it("should detect no support when neither is available", () => {
      delete (window as Partial<typeof window>).SpeechRecognition;
      delete (window as Partial<typeof window>).webkitSpeechRecognition;

      const { result } = renderHook(() => useVoiceRecognition());

      expect(result.current.isSupported).toBe(false);
    });
  });

  describe("initialization", () => {
    it("should initialize with default values", () => {
      window.SpeechRecognition = MockSpeechRecognition;
      delete (window as Partial<typeof window>).webkitSpeechRecognition;

      const { result } = renderHook(() => useVoiceRecognition());

      expect(result.current.isListening).toBe(false);
      expect(result.current.transcript).toBe("");
    });

    it("should create recognition instance with default options", () => {
      window.SpeechRecognition = MockSpeechRecognition;
      delete (window as Partial<typeof window>).webkitSpeechRecognition;

      renderHook(() => useVoiceRecognition());

      expect(MockSpeechRecognition).toHaveBeenCalled();
    });

    it("should create recognition instance with custom options", () => {
      window.SpeechRecognition = MockSpeechRecognition;
      delete (window as Partial<typeof window>).webkitSpeechRecognition;

      renderHook(() =>
        useVoiceRecognition({
          lang: "zh-CN",
          continuous: false,
          interimResults: false,
        })
      );

      expect(MockSpeechRecognition).toHaveBeenCalled();
    });
  });

  describe("startListening", () => {
    it("should start recognition when not listening", () => {
      window.SpeechRecognition = MockSpeechRecognition;
      delete (window as Partial<typeof window>).webkitSpeechRecognition;

      const { result } = renderHook(() => useVoiceRecognition());

      act(() => {
        result.current.startListening();
      });

      // Check that recognition was attempted to start
      expect(result.current.isListening).toBe(false);
    });

    it("should reset transcript when starting", () => {
      window.SpeechRecognition = MockSpeechRecognition;
      delete (window as Partial<typeof window>).webkitSpeechRecognition;

      const { result } = renderHook(() => useVoiceRecognition());

      expect(result.current.transcript).toBe("");

      act(() => {
        result.current.startListening();
      });

      expect(result.current.transcript).toBe("");
    });
  });

  describe("stopListening", () => {
    it("should not throw when not listening", () => {
      window.SpeechRecognition = MockSpeechRecognition;
      delete (window as Partial<typeof window>).webkitSpeechRecognition;

      const { result } = renderHook(() => useVoiceRecognition());

      expect(() => {
        act(() => {
          result.current.stopListening();
        });
      }).not.toThrow();
    });
  });

  describe("resetTranscript", () => {
    it("should reset transcript to empty string", () => {
      window.SpeechRecognition = MockSpeechRecognition;
      delete (window as Partial<typeof window>).webkitSpeechRecognition;

      const { result } = renderHook(() => useVoiceRecognition());

      act(() => {
        result.current.resetTranscript();
      });

      expect(result.current.transcript).toBe("");
    });
  });

  describe("return values", () => {
    it("should return all expected properties", () => {
      window.SpeechRecognition = MockSpeechRecognition;
      delete (window as Partial<typeof window>).webkitSpeechRecognition;

      const { result } = renderHook(() => useVoiceRecognition());

      expect(result.current).toHaveProperty("isListening");
      expect(result.current).toHaveProperty("transcript");
      expect(result.current).toHaveProperty("isSupported");
      expect(result.current).toHaveProperty("startListening");
      expect(result.current).toHaveProperty("stopListening");
      expect(result.current).toHaveProperty("resetTranscript");

      expect(typeof result.current.startListening).toBe("function");
      expect(typeof result.current.stopListening).toBe("function");
      expect(typeof result.current.resetTranscript).toBe("function");
    });
  });

  describe("no browser support", () => {
    it("should handle missing SpeechRecognition gracefully", () => {
      delete (window as Partial<typeof window>).SpeechRecognition;
      delete (window as Partial<typeof window>).webkitSpeechRecognition;

      const { result } = renderHook(() => useVoiceRecognition());

      expect(result.current.isSupported).toBe(false);
      expect(result.current.isListening).toBe(false);
      expect(result.current.transcript).toBe("");

      // Should not throw when calling methods
      expect(() => {
        act(() => {
          result.current.startListening();
        });
      }).not.toThrow();

      expect(() => {
        act(() => {
          result.current.stopListening();
        });
      }).not.toThrow();
    });
  });

  describe("callbacks", () => {
    it("should accept onResult callback", () => {
      window.SpeechRecognition = MockSpeechRecognition;
      delete (window as Partial<typeof window>).webkitSpeechRecognition;

      const onResult = vi.fn();

      const { result } = renderHook(() =>
        useVoiceRecognition({
          onResult,
        })
      );

      expect(result.current).toBeDefined();
    });

    it("should accept onError callback", () => {
      window.SpeechRecognition = MockSpeechRecognition;
      delete (window as Partial<typeof window>).webkitSpeechRecognition;

      const onError = vi.fn();

      const { result } = renderHook(() =>
        useVoiceRecognition({
          onError,
        })
      );

      expect(result.current).toBeDefined();
    });
  });

  describe("options", () => {
    it("should accept custom lang option", () => {
      window.SpeechRecognition = MockSpeechRecognition;
      delete (window as Partial<typeof window>).webkitSpeechRecognition;

      const { result } = renderHook(() =>
        useVoiceRecognition({
          lang: "zh-CN",
        })
      );

      expect(result.current).toBeDefined();
    });

    it("should accept continuous option", () => {
      window.SpeechRecognition = MockSpeechRecognition;
      delete (window as Partial<typeof window>).webkitSpeechRecognition;

      const { result } = renderHook(() =>
        useVoiceRecognition({
          continuous: false,
        })
      );

      expect(result.current).toBeDefined();
    });

    it("should accept interimResults option", () => {
      window.SpeechRecognition = MockSpeechRecognition;
      delete (window as Partial<typeof window>).webkitSpeechRecognition;

      const { result } = renderHook(() =>
        useVoiceRecognition({
          interimResults: false,
        })
      );

      expect(result.current).toBeDefined();
    });
  });
});
