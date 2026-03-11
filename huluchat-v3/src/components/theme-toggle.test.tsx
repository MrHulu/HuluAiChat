import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ThemeToggle } from "./theme-toggle";
import { TooltipProvider } from "./ui/tooltip";

// Mock theme-provider
const mockSetTheme = vi.fn();
vi.mock("./theme-provider", () => ({
  useTheme: () => ({
    setTheme: mockSetTheme,
    theme: "system",
  }),
}));

// Helper to render with TooltipProvider
const renderWithProviders = (ui: React.ReactElement) => {
  return render(<TooltipProvider>{ui}</TooltipProvider>);
};

describe("ThemeToggle", () => {
  beforeEach(() => {
    mockSetTheme.mockClear();
  });

  it("should render theme toggle button", () => {
    renderWithProviders(<ThemeToggle />);

    expect(screen.getByRole("button", { name: /toggle theme/i })).toBeInTheDocument();
  });

  it("should show sun icon", () => {
    renderWithProviders(<ThemeToggle />);

    const sunIcon = document.querySelector(".lucide-sun");
    expect(sunIcon).toBeInTheDocument();
  });

  it("should show moon icon", () => {
    renderWithProviders(<ThemeToggle />);

    const moonIcon = document.querySelector(".lucide-moon");
    expect(moonIcon).toBeInTheDocument();
  });

  it("should open dropdown menu when clicked", async () => {
    const user = userEvent.setup();
    renderWithProviders(<ThemeToggle />);

    const button = screen.getByRole("button", { name: /toggle theme/i });
    await user.click(button);

    await waitFor(() => {
      expect(screen.getByText("Light")).toBeInTheDocument();
      expect(screen.getByText("Dark")).toBeInTheDocument();
      expect(screen.getByText("System")).toBeInTheDocument();
    });
  });

  it("should call setTheme with 'light' when Light is clicked", async () => {
    const user = userEvent.setup();
    renderWithProviders(<ThemeToggle />);

    const button = screen.getByRole("button", { name: /toggle theme/i });
    await user.click(button);

    await waitFor(async () => {
      const lightOption = screen.getByText("Light");
      await user.click(lightOption);
    });

    expect(mockSetTheme).toHaveBeenCalledWith("light");
  });

  it("should call setTheme with 'dark' when Dark is clicked", async () => {
    const user = userEvent.setup();
    renderWithProviders(<ThemeToggle />);

    const button = screen.getByRole("button", { name: /toggle theme/i });
    await user.click(button);

    await waitFor(async () => {
      const darkOption = screen.getByText("Dark");
      await user.click(darkOption);
    });

    expect(mockSetTheme).toHaveBeenCalledWith("dark");
  });

  it("should call setTheme with 'system' when System is clicked", async () => {
    const user = userEvent.setup();
    renderWithProviders(<ThemeToggle />);

    const button = screen.getByRole("button", { name: /toggle theme/i });
    await user.click(button);

    await waitFor(async () => {
      const systemOption = screen.getByText("System");
      await user.click(systemOption);
    });

    expect(mockSetTheme).toHaveBeenCalledWith("system");
  });

  it("should have screen reader text", () => {
    renderWithProviders(<ThemeToggle />);

    expect(screen.getByText("Toggle theme")).toBeInTheDocument();
  });
});
