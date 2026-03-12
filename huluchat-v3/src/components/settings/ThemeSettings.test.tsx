import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"
import React from "react"
import { ThemeProvider } from "@/components/theme-provider"
import { ThemeSettings } from "./ThemeSettings"

// Helper to render with ThemeProvider
function renderWithTheme(
  ui: React.ReactNode,
  options: { defaultTheme?: string; storageKey?: string } = {}
) {
  const { defaultTheme = "system", storageKey = "vite-ui-theme" } = options
  return render(
    <ThemeProvider defaultTheme={defaultTheme as "dark" | "light" | "system"} storageKey={storageKey}>
      {ui}
    </ThemeProvider>
  )
}

// Mock useTranslation hook
vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        "appearance.title": "Appearance",
        "appearance.theme": "Theme",
        "appearance.selectTheme": "Select theme",
        "appearance.themeLightDescription": "Use light theme for a bright interface",
        "appearance.themeDarkDescription": "Use dark theme to reduce eye strain in low light",
        "appearance.themeSystemDescription": "Automatically match your system's theme setting",
        "appearance.privacyNote": "Theme preference is stored locally and never sent to servers.",
        "theme.light": "Light",
        "theme.dark": "Dark",
        "theme.system": "System",
      }
      return translations[key] || key
    },
  }),
}))

describe("ThemeSettings", () => {
  // Mock localStorage
  const localStorageMock = (() => {
    let store: Record<string, string> = {}
    return {
      getItem: vi.fn((key: string) => store[key] || null),
      setItem: vi.fn((key: string, value: string) => {
        store[key] = value
      }),
      removeItem: vi.fn((key: string) => {
        delete store[key]
      }),
      clear: vi.fn(() => {
        store = {}
      }),
    }
  })()

  // Mock matchMedia
  const matchMediaMock = vi.fn()

  beforeEach(() => {
    vi.stubGlobal("localStorage", localStorageMock)
    localStorageMock.clear()

    matchMediaMock.mockReturnValue({
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })
    vi.stubGlobal("matchMedia", matchMediaMock)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.clearAllMocks()
  })

  describe("rendering", () => {
    it("should render the appearance title", () => {
      renderWithTheme(<ThemeSettings />)
      expect(screen.getByText("Appearance")).toBeInTheDocument()
    })

    it("should render theme label", () => {
      renderWithTheme(<ThemeSettings />)
      expect(screen.getByText("Theme")).toBeInTheDocument()
    })

    it("should render privacy note", () => {
      renderWithTheme(<ThemeSettings />)
      expect(screen.getByText(/Theme preference is stored locally/)).toBeInTheDocument()
    })

    it("should render three theme option buttons", () => {
      renderWithTheme(<ThemeSettings />)
      // Use getAllByText since "System" appears multiple times (in dropdown and button)
      expect(screen.getAllByText("Light").length).toBeGreaterThan(0)
      expect(screen.getAllByText("Dark").length).toBeGreaterThan(0)
      expect(screen.getAllByText("System").length).toBeGreaterThan(0)
    })
  })

  describe("theme selection via buttons", () => {
    it("should switch to dark theme when dark button is clicked", () => {
      renderWithTheme(<ThemeSettings />)

      const darkButton = screen.getByRole("button", { name: "Dark" })
      fireEvent.click(darkButton)

      expect(darkButton).toHaveAttribute("aria-pressed", "true")
      expect(screen.getByText(/reduce eye strain/)).toBeInTheDocument()
    })

    it("should switch to light theme when light button is clicked", () => {
      renderWithTheme(<ThemeSettings />)

      const lightButton = screen.getByRole("button", { name: "Light" })
      fireEvent.click(lightButton)

      expect(lightButton).toHaveAttribute("aria-pressed", "true")
      expect(screen.getByText(/bright interface/)).toBeInTheDocument()
    })

    it("should switch to system theme when system button is clicked", () => {
      renderWithTheme(<ThemeSettings />)

      const systemButton = screen.getByRole("button", { name: "System" })
      fireEvent.click(systemButton)

      expect(systemButton).toHaveAttribute("aria-pressed", "true")
      expect(screen.getByText(/match your system/)).toBeInTheDocument()
    })

    it("should show correct active state for current theme", () => {
      renderWithTheme(<ThemeSettings />, { defaultTheme: "dark" })

      const darkButton = screen.getByRole("button", { name: "Dark" })
      expect(darkButton).toHaveAttribute("aria-pressed", "true")
    })
  })

  describe("theme selection via dropdown", () => {
    it("should have a select dropdown for theme", () => {
      renderWithTheme(<ThemeSettings />)
      expect(screen.getByRole("combobox")).toBeInTheDocument()
    })

    it("should display current theme in select", () => {
      renderWithTheme(<ThemeSettings />, { defaultTheme: "dark" })
      expect(screen.getByRole("combobox")).toHaveTextContent("Dark")
    })
  })

  describe("accessibility", () => {
    it("should have proper aria-pressed attributes", () => {
      renderWithTheme(<ThemeSettings />)

      const buttons = screen.getAllByRole("button")
      buttons.forEach((button) => {
        expect(button).toHaveAttribute("aria-pressed")
      })
    })

    it("should have accessible theme select", () => {
      renderWithTheme(<ThemeSettings />)
      const select = screen.getByRole("combobox")
      expect(select).toBeInTheDocument()
    })
  })
})
