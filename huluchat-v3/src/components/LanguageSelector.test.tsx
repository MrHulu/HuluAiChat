import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { LanguageSelector } from "./LanguageSelector";
import { TooltipProvider } from "./ui/tooltip";

// Mock react-i18next
const mockChangeLanguage = vi.fn();
const mockI18n = {
  language: "en",
  changeLanguage: mockChangeLanguage,
};

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    i18n: mockI18n,
    t: (key: string) => {
      const translations: Record<string, string> = {
        "languageSelector.changeLanguage": "Change language",
        "languageSelector.language": "Language",
      };
      return translations[key] || key;
    },
  }),
}));

// Mock i18n module
vi.mock("@/i18n", () => ({
  supportedLanguages: [
    { code: "en", name: "English", nativeName: "English" },
    { code: "zh", name: "Chinese", nativeName: "中文" },
    { code: "ja", name: "Japanese", nativeName: "日本語" },
  ],
  changeLanguage: vi.fn().mockResolvedValue(true),
}));

// Helper to render with TooltipProvider
const renderWithProviders = (ui: React.ReactElement) => {
  return render(<TooltipProvider>{ui}</TooltipProvider>);
};

describe("LanguageSelector", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockI18n.language = "en";
  });

  it("should render language selector button", () => {
    renderWithProviders(<LanguageSelector />);

    expect(screen.getByRole("button", { name: /change language/i })).toBeInTheDocument();
  });

  it("should show globe icon", () => {
    renderWithProviders(<LanguageSelector />);

    const globeIcon = document.querySelector(".lucide-globe");
    expect(globeIcon).toBeInTheDocument();
  });

  it("should have screen reader text", () => {
    renderWithProviders(<LanguageSelector />);

    expect(screen.getByText("Language")).toBeInTheDocument();
  });

  it("should open dropdown menu when clicked", async () => {
    const user = userEvent.setup();
    renderWithProviders(<LanguageSelector />);

    const button = screen.getByRole("button", { name: /change language/i });
    await user.click(button);

    await waitFor(() => {
      expect(screen.getByText("English")).toBeInTheDocument();
      expect(screen.getByText("中文")).toBeInTheDocument();
      expect(screen.getByText("日本語")).toBeInTheDocument();
    });
  });

  it("should show checkmark for current language", async () => {
    const user = userEvent.setup();
    renderWithProviders(<LanguageSelector />);

    const button = screen.getByRole("button", { name: /change language/i });
    await user.click(button);

    await waitFor(() => {
      // Check that the current language item has aria-current
      const englishItem = screen.getByText("English").closest("[role='menuitem']");
      expect(englishItem).toHaveAttribute("aria-current", "true");
    });
  });

  it("should call changeLanguage when a different language is clicked", async () => {
    const user = userEvent.setup();
    const { changeLanguage } = await import("@/i18n");

    renderWithProviders(<LanguageSelector />);

    const button = screen.getByRole("button", { name: /change language/i });
    await user.click(button);

    await waitFor(async () => {
      const chineseOption = screen.getByText("中文");
      await user.click(chineseOption);
    });

    expect(changeLanguage).toHaveBeenCalledWith("zh");
  });

  it("should not change language when clicking current language", async () => {
    const user = userEvent.setup();
    const { changeLanguage } = await import("@/i18n");

    renderWithProviders(<LanguageSelector />);

    const button = screen.getByRole("button", { name: /change language/i });
    await user.click(button);

    await waitFor(async () => {
      const englishOption = screen.getByText("English");
      await user.click(englishOption);
    });

    // Should not call changeLanguage for current language
    expect(changeLanguage).not.toHaveBeenCalled();
  });

  it("should show loading spinner when changing language", async () => {
    const user = userEvent.setup();
    const { changeLanguage } = await import("@/i18n");

    // Make changeLanguage take some time
    vi.mocked(changeLanguage).mockImplementationOnce(
      () => new Promise((resolve) => setTimeout(() => resolve(true), 100))
    );

    renderWithProviders(<LanguageSelector />);

    const button = screen.getByRole("button", { name: /change language/i });
    await user.click(button);

    await waitFor(async () => {
      const chineseOption = screen.getByText("中文");
      await user.click(chineseOption);
    });

    // Check for loading spinner
    await waitFor(() => {
      const spinner = document.querySelector(".animate-spin");
      expect(spinner).toBeInTheDocument();
    });
  });

  it("should disable button while loading", async () => {
    const user = userEvent.setup();
    const { changeLanguage } = await import("@/i18n");

    // Make changeLanguage take some time
    vi.mocked(changeLanguage).mockImplementationOnce(
      () => new Promise((resolve) => setTimeout(() => resolve(true), 100))
    );

    renderWithProviders(<LanguageSelector />);

    const button = screen.getByRole("button", { name: /change language/i });
    await user.click(button);

    await waitFor(async () => {
      const chineseOption = screen.getByText("中文");
      await user.click(chineseOption);
    });

    // Button should be disabled while loading
    await waitFor(() => {
      expect(button).toBeDisabled();
    });
  });

  it("should have correct aria-label on button", () => {
    renderWithProviders(<LanguageSelector />);

    const button = screen.getByRole("button");
    expect(button).toHaveAttribute("aria-label", "Change language");
  });

  it("should render all supported languages in dropdown", async () => {
    const user = userEvent.setup();
    renderWithProviders(<LanguageSelector />);

    const button = screen.getByRole("button", { name: /change language/i });
    await user.click(button);

    await waitFor(() => {
      expect(screen.getByText("English")).toBeInTheDocument();
      expect(screen.getByText("中文")).toBeInTheDocument();
      expect(screen.getByText("日本語")).toBeInTheDocument();
    });
  });

  it("should have staggered animation delays on language items", async () => {
    const user = userEvent.setup();
    renderWithProviders(<LanguageSelector />);

    const button = screen.getByRole("button", { name: /change language/i });
    await user.click(button);

    await waitFor(() => {
      const menuItems = document.querySelectorAll("[role='menuitem']");
      expect(menuItems.length).toBeGreaterThan(0);

      // Check that items have animation delay styles
      menuItems.forEach((item, index) => {
        const style = item.getAttribute("style");
        expect(style).toContain(`animation-delay: ${index * 50}ms`);
      });
    });
  });

  it("should show tooltip on hover", async () => {
    const user = userEvent.setup();
    renderWithProviders(<LanguageSelector />);

    const button = screen.getByRole("button", { name: /change language/i });

    // Hover over the button
    await user.hover(button);

    // Wait for tooltip to appear (it's in a portal)
    await waitFor(() => {
      expect(screen.getByRole("tooltip")).toBeInTheDocument();
    });
  });
});
