import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"
import React from "react"
import { UpdateNotification } from "./UpdateNotification"

// Mock useUpdater hook
const mockUseUpdater = vi.fn()

vi.mock("@/hooks", () => ({
  useUpdater: () => mockUseUpdater(),
}))

describe("UpdateNotification", () => {
  const defaultMockReturn = {
    updateAvailable: false,
    updateInfo: null,
    isDownloading: false,
    downloadProgress: 0,
    isChecking: false,
    downloadAndInstall: vi.fn(),
    dismissUpdate: vi.fn(),
    checkForUpdates: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
    mockUseUpdater.mockReturnValue(defaultMockReturn)
  })

  describe("rendering conditions", () => {
    it("should not render when no update available and not checking", () => {
      mockUseUpdater.mockReturnValue({
        ...defaultMockReturn,
        updateAvailable: false,
        isChecking: false,
      })

      const { container } = render(<UpdateNotification />)

      expect(container.firstChild).toBeNull()
    })

    it("should render when update is available", () => {
      mockUseUpdater.mockReturnValue({
        ...defaultMockReturn,
        updateAvailable: true,
        updateInfo: { version: "1.0.0", body: "Release notes" },
      })

      render(<UpdateNotification />)

      expect(screen.getByText("New version available")).toBeInTheDocument()
    })

    it("should render when checking for updates", () => {
      mockUseUpdater.mockReturnValue({
        ...defaultMockReturn,
        isChecking: true,
      })

      render(<UpdateNotification />)

      expect(screen.getByText("Checking for updates...")).toBeInTheDocument()
    })
  })

  describe("checking state", () => {
    it("should show spinning RefreshCw icon when checking", () => {
      mockUseUpdater.mockReturnValue({
        ...defaultMockReturn,
        isChecking: true,
      })

      render(<UpdateNotification />)

      const container = document.querySelector(".animate-spin")
      expect(container).toBeInTheDocument()
    })
  })

  describe("download progress state", () => {
    it("should show download progress when downloading", () => {
      mockUseUpdater.mockReturnValue({
        ...defaultMockReturn,
        updateAvailable: true,
        isDownloading: true,
        downloadProgress: 50,
        updateInfo: { version: "1.0.0", body: "Release notes" },
      })

      render(<UpdateNotification />)

      expect(screen.getByText("Downloading update...")).toBeInTheDocument()
      expect(screen.getByText(/v1.0.0 - 50%/)).toBeInTheDocument()
    })

    it("should show progress bar with correct width", () => {
      mockUseUpdater.mockReturnValue({
        ...defaultMockReturn,
        updateAvailable: true,
        isDownloading: true,
        downloadProgress: 75,
        updateInfo: { version: "1.0.0", body: "Release notes" },
      })

      render(<UpdateNotification />)

      const progressBar = document.querySelector('[style*="width: 75%"]')
      expect(progressBar).toBeInTheDocument()
    })

    it("should show bouncing Download icon when downloading", () => {
      mockUseUpdater.mockReturnValue({
        ...defaultMockReturn,
        updateAvailable: true,
        isDownloading: true,
        downloadProgress: 50,
        updateInfo: { version: "1.0.0" },
      })

      render(<UpdateNotification />)

      const bouncingIcon = document.querySelector(".animate-bounce")
      expect(bouncingIcon).toBeInTheDocument()
    })
  })

  describe("update available state", () => {
    beforeEach(() => {
      mockUseUpdater.mockReturnValue({
        ...defaultMockReturn,
        updateAvailable: true,
        updateInfo: { version: "2.0.0", body: "New features and bug fixes" },
      })
    })

    it("should display update version", () => {
      render(<UpdateNotification />)

      expect(screen.getByText(/v2.0.0 available/)).toBeInTheDocument()
    })

    it("should display update body if available", () => {
      render(<UpdateNotification />)

      expect(screen.getByText("New features and bug fixes")).toBeInTheDocument()
    })

    it("should not display update body if not available", () => {
      mockUseUpdater.mockReturnValue({
        ...defaultMockReturn,
        updateAvailable: true,
        updateInfo: { version: "2.0.0" },
      })

      render(<UpdateNotification />)

      expect(screen.queryByText("New features and bug fixes")).not.toBeInTheDocument()
    })

    it("should have dismiss button", () => {
      render(<UpdateNotification />)

      const dismissButton = screen.getByRole("button", { name: "" }) // X button has no text
      expect(dismissButton).toBeInTheDocument()
    })

    it("should call dismissUpdate when dismiss button clicked", () => {
      const dismissUpdate = vi.fn()
      mockUseUpdater.mockReturnValue({
        ...defaultMockReturn,
        updateAvailable: true,
        updateInfo: { version: "2.0.0" },
        dismissUpdate,
      })

      render(<UpdateNotification />)

      // Click the X button (first button, which is the dismiss button)
      const buttons = screen.getAllByRole("button")
      fireEvent.click(buttons[0])

      expect(dismissUpdate).toHaveBeenCalled()
    })

    it("should have download and install button", () => {
      render(<UpdateNotification />)

      expect(screen.getByText("Update Now")).toBeInTheDocument()
    })

    it("should call downloadAndInstall when update button clicked", () => {
      const downloadAndInstall = vi.fn()
      mockUseUpdater.mockReturnValue({
        ...defaultMockReturn,
        updateAvailable: true,
        updateInfo: { version: "2.0.0" },
        downloadAndInstall,
      })

      render(<UpdateNotification />)

      fireEvent.click(screen.getByText("Update Now"))

      expect(downloadAndInstall).toHaveBeenCalled()
    })

    it("should have later button", () => {
      render(<UpdateNotification />)

      expect(screen.getByText("Later")).toBeInTheDocument()
    })

    it("should call checkForUpdates with false when later button clicked", () => {
      const checkForUpdates = vi.fn()
      mockUseUpdater.mockReturnValue({
        ...defaultMockReturn,
        updateAvailable: true,
        updateInfo: { version: "2.0.0" },
        checkForUpdates,
      })

      render(<UpdateNotification />)

      fireEvent.click(screen.getByText("Later"))

      expect(checkForUpdates).toHaveBeenCalledWith(false)
    })
  })

  describe("styling", () => {
    it("should have fixed positioning at bottom right", () => {
      mockUseUpdater.mockReturnValue({
        ...defaultMockReturn,
        updateAvailable: true,
        updateInfo: { version: "1.0.0" },
      })

      render(<UpdateNotification />)

      const container = document.querySelector(".fixed.bottom-4.right-4")
      expect(container).toBeInTheDocument()
    })

    it("should have proper z-index", () => {
      mockUseUpdater.mockReturnValue({
        ...defaultMockReturn,
        updateAvailable: true,
        updateInfo: { version: "1.0.0" },
      })

      render(<UpdateNotification />)

      const container = document.querySelector(".z-50")
      expect(container).toBeInTheDocument()
    })
  })
})
