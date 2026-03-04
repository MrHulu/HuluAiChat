import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { render, screen, fireEvent, act } from "@testing-library/react"
import React from "react"
import { ThemeProvider, useTheme } from "./theme-provider"

// Helper component to test useTheme hook
function ThemeConsumer() {
  const { theme, setTheme } = useTheme()
  return (
    <div>
      <span data-testid="current-theme">{theme}</span>
      <button onClick={() => setTheme("dark")} data-testid="set-dark">
        Dark
      </button>
      <button onClick={() => setTheme("light")} data-testid="set-light">
        Light
      </button>
      <button onClick={() => setTheme("system")} data-testid="set-system">
        System
      </button>
    </div>
  )
}

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

describe("ThemeProvider", () => {
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

  describe("default behavior", () => {
    it("should render children", () => {
      renderWithTheme(<div data-testid="child">Hello</div>)
      expect(screen.getByTestId("child")).toBeInTheDocument()
    })

    it("should use 'system' as default theme", () => {
      renderWithTheme(<ThemeConsumer />)
      expect(screen.getByTestId("current-theme")).toHaveTextContent("system")
    })

    it("should use custom defaultTheme when localStorage is empty", () => {
      renderWithTheme(<ThemeConsumer />, { defaultTheme: "dark" })
      expect(screen.getByTestId("current-theme")).toHaveTextContent("dark")
    })
  })

  describe("localStorage integration", () => {
    it("should restore theme from localStorage", () => {
      localStorageMock.getItem = vi.fn(() => "light")

      renderWithTheme(<ThemeConsumer />)

      expect(screen.getByTestId("current-theme")).toHaveTextContent("light")
      expect(localStorageMock.getItem).toHaveBeenCalledWith("vite-ui-theme")
    })

    it("should use custom storageKey", () => {
      const customKey = "my-app-theme"
      localStorageMock.getItem = vi.fn(() => "dark")

      renderWithTheme(<ThemeConsumer />, { storageKey: customKey })

      expect(localStorageMock.getItem).toHaveBeenCalledWith(customKey)
    })

    it("should persist theme to localStorage when setTheme is called", () => {
      renderWithTheme(<ThemeConsumer />)

      fireEvent.click(screen.getByTestId("set-dark"))

      expect(localStorageMock.setItem).toHaveBeenCalledWith("vite-ui-theme", "dark")
      expect(screen.getByTestId("current-theme")).toHaveTextContent("dark")
    })
  })

  describe("theme switching", () => {
    it("should switch to dark theme", () => {
      renderWithTheme(<ThemeConsumer />)

      fireEvent.click(screen.getByTestId("set-dark"))

      expect(screen.getByTestId("current-theme")).toHaveTextContent("dark")
    })

    it("should switch to light theme", () => {
      renderWithTheme(<ThemeConsumer />)

      fireEvent.click(screen.getByTestId("set-light"))

      expect(screen.getByTestId("current-theme")).toHaveTextContent("light")
    })

    it("should switch to system theme", () => {
      renderWithTheme(<ThemeConsumer />)

      fireEvent.click(screen.getByTestId("set-system"))

      expect(screen.getByTestId("current-theme")).toHaveTextContent("system")
    })
  })

  describe("DOM class manipulation", () => {
    it("should add 'dark' class to documentElement when theme is dark", () => {
      renderWithTheme(<ThemeConsumer />)

      act(() => {
        fireEvent.click(screen.getByTestId("set-dark"))
      })

      expect(document.documentElement.classList.contains("dark")).toBe(true)
      expect(document.documentElement.classList.contains("light")).toBe(false)
    })

    it("should add 'light' class to documentElement when theme is light", () => {
      renderWithTheme(<ThemeConsumer />)

      act(() => {
        fireEvent.click(screen.getByTestId("set-light"))
      })

      expect(document.documentElement.classList.contains("light")).toBe(true)
      expect(document.documentElement.classList.contains("dark")).toBe(false)
    })

    it("should remove previous theme class when switching themes", () => {
      renderWithTheme(<ThemeConsumer />)

      act(() => {
        fireEvent.click(screen.getByTestId("set-dark"))
      })
      expect(document.documentElement.classList.contains("dark")).toBe(true)

      act(() => {
        fireEvent.click(screen.getByTestId("set-light"))
      })
      expect(document.documentElement.classList.contains("dark")).toBe(false)
      expect(document.documentElement.classList.contains("light")).toBe(true)
    })

    it("should apply system theme when theme is 'system' (dark mode)", () => {
      matchMediaMock.mockReturnValue({
        matches: true, // System prefers dark
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      })

      renderWithTheme(<ThemeConsumer />)

      act(() => {
        fireEvent.click(screen.getByTestId("set-system"))
      })

      expect(document.documentElement.classList.contains("dark")).toBe(true)
    })

    it("should apply system theme when theme is 'system' (light mode)", () => {
      matchMediaMock.mockReturnValue({
        matches: false, // System prefers light
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      })

      renderWithTheme(<ThemeConsumer />)

      act(() => {
        fireEvent.click(screen.getByTestId("set-system"))
      })

      expect(document.documentElement.classList.contains("light")).toBe(true)
    })
  })

  describe("useTheme hook", () => {
    it("should return default context when used outside ThemeProvider", () => {
      // Note: The current implementation provides a default context value,
      // so it won't throw an error but will return the default state
      render(<ThemeConsumer />)

      expect(screen.getByTestId("current-theme")).toHaveTextContent("system")
    })

    it("should return theme and setTheme", () => {
      renderWithTheme(<ThemeConsumer />)

      expect(screen.getByTestId("current-theme")).toBeInTheDocument()
      expect(screen.getByTestId("set-dark")).toBeInTheDocument()
      expect(screen.getByTestId("set-light")).toBeInTheDocument()
      expect(screen.getByTestId("set-system")).toBeInTheDocument()
    })
  })

  describe("multiple providers", () => {
    it("should support nested providers with different storage keys", () => {
      const NestedConsumer = () => {
        const { theme } = useTheme()
        return <span data-testid="nested-theme">{theme}</span>
      }

      localStorageMock.getItem = vi.fn((key: string) => {
        if (key === "outer-theme") return "light"
        if (key === "inner-theme") return "dark"
        return null
      })

      render(
        <ThemeProvider storageKey="outer-theme">
          <div data-testid="outer">
            <ThemeProvider storageKey="inner-theme">
              <NestedConsumer />
            </ThemeProvider>
          </div>
        </ThemeProvider>
      )

      // Inner provider should use its own theme
      expect(screen.getByTestId("nested-theme")).toHaveTextContent("dark")
    })
  })
})
