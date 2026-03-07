/**
 * VoiceInputButton Component Tests
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { VoiceInputButton } from "./VoiceInputButton";

// Mock useVoiceRecognition hook
const mockStartListening = vi.fn();
const mockStopListening = vi.fn();
const mockResetTranscript = vi.fn();

vi.mock("@/hooks/useVoiceRecognition", () => ({
  useVoiceRecognition: vi.fn(() => ({
    isListening: false,
    transcript: "",
    isSupported: true,
    startListening: mockStartListening,
    stopListening: mockStopListening,
    resetTranscript: mockResetTranscript,
  })),
}));

// Mock i18n
vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        "chat.voice.startRecording": "Start voice input",
        "chat.voice.stopRecording": "Stop recording",
      };
      return translations[key] || key;
    },
  }),
}));

describe("VoiceInputButton", () => {
  const mockOnTranscript = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders when voice is supported", () => {
    render(<VoiceInputButton onTranscript={mockOnTranscript} />);

    const button = screen.getByRole("button");
    expect(button).toBeInTheDocument();
    expect(button).toHaveAttribute("aria-label", "Start voice input");
  });

  it("starts listening when clicked", () => {
    render(<VoiceInputButton onTranscript={mockOnTranscript} />);

    const button = screen.getByRole("button");
    fireEvent.click(button);

    expect(mockResetTranscript).toHaveBeenCalled();
    expect(mockStartListening).toHaveBeenCalled();
  });

  it("is disabled when disabled prop is true", () => {
    render(<VoiceInputButton onTranscript={mockOnTranscript} disabled />);

    const button = screen.getByRole("button");
    expect(button).toBeDisabled();
  });

  it("applies custom className", () => {
    render(<VoiceInputButton onTranscript={mockOnTranscript} className="custom-class" />);

    const button = screen.getByRole("button");
    expect(button).toHaveClass("custom-class");
  });
});
