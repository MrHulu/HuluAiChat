/**
 * DateSeparator Component Tests
 */
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { DateSeparator } from "./DateSeparator";

// Mock react-i18next
vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: "en" },
  }),
}));

describe("DateSeparator", () => {
  it("renders with today label", () => {
    const today = new Date().toISOString();
    render(<DateSeparator date={today} />);
    expect(screen.getByText("Today")).toBeInTheDocument();
  });

  it("renders with yesterday label", () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    render(<DateSeparator date={yesterday.toISOString()} />);
    expect(screen.getByText("Yesterday")).toBeInTheDocument();
  });

  it("renders with custom className", () => {
    const today = new Date().toISOString();
    render(<DateSeparator date={today} className="custom-class" />);
    const separator = screen.getByRole("separator");
    expect(separator).toHaveClass("custom-class");
  });

  it("has proper accessibility attributes", () => {
    const today = new Date().toISOString();
    render(<DateSeparator date={today} />);
    const separator = screen.getByRole("separator");
    expect(separator).toHaveAttribute("aria-label", "Today");
  });
});
