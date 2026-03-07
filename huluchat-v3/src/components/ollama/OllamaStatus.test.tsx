import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { OllamaStatus, OllamaStatusIndicator } from "./OllamaStatus";

describe("OllamaStatus", () => {
  const mockOnRefresh = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("OllamaStatus", () => {
    it("should render online status when available is true", () => {
      render(
        <OllamaStatus
          available={true}
          modelCount={3}
          onRefresh={mockOnRefresh}
        />
      );

      expect(screen.getByText("Ollama Online")).toBeInTheDocument();
      expect(screen.getByText("3 local models")).toBeInTheDocument();
    });

    it("should render offline status when available is false", () => {
      render(
        <OllamaStatus
          available={false}
          modelCount={0}
          onRefresh={mockOnRefresh}
        />
      );

      expect(screen.getByText("Ollama Offline")).toBeInTheDocument();
    });

    it("should display base URL when offline", () => {
      render(
        <OllamaStatus
          available={false}
          modelCount={0}
          onRefresh={mockOnRefresh}
          baseUrl="http://localhost:11434"
        />
      );

      expect(screen.getByText("http://localhost:11434")).toBeInTheDocument();
    });

    it("should display version when available", () => {
      render(
        <OllamaStatus
          available={true}
          modelCount={2}
          onRefresh={mockOnRefresh}
          version="0.1.28"
        />
      );

      expect(screen.getByText(/0\.1\.28/)).toBeInTheDocument();
    });

    it("should call onRefresh when refresh button is clicked", async () => {
      const user = userEvent.setup();
      render(
        <OllamaStatus
          available={true}
          modelCount={1}
          onRefresh={mockOnRefresh}
        />
      );

      const refreshButton = screen.getByRole("button", { name: /refresh/i });
      await user.click(refreshButton);

      expect(mockOnRefresh).toHaveBeenCalledTimes(1);
    });

    it("should disable refresh button when isRefreshing is true", () => {
      render(
        <OllamaStatus
          available={true}
          modelCount={1}
          onRefresh={mockOnRefresh}
          isRefreshing={true}
        />
      );

      const refreshButton = screen.getByRole("button", { name: /refresh/i });
      expect(refreshButton).toBeDisabled();
    });

    it("should show loading spinner when isRefreshing is true", () => {
      const { container } = render(
        <OllamaStatus
          available={true}
          modelCount={1}
          onRefresh={mockOnRefresh}
          isRefreshing={true}
        />
      );

      const spinners = container.querySelectorAll('svg.animate-spin');
      expect(spinners.length).toBeGreaterThan(0);
    });

    it("should render zero models correctly", () => {
      render(
        <OllamaStatus
          available={true}
          modelCount={0}
          onRefresh={mockOnRefresh}
        />
      );

      expect(screen.getByText("0 local models")).toBeInTheDocument();
    });

    it("should render singular form correctly", () => {
      render(
        <OllamaStatus
          available={true}
          modelCount={1}
          onRefresh={mockOnRefresh}
        />
      );

      expect(screen.getByText("1 local models")).toBeInTheDocument();
    });

    it("should render many models correctly", () => {
      render(
        <OllamaStatus
          available={true}
          modelCount={10}
          onRefresh={mockOnRefresh}
        />
      );

      expect(screen.getByText("10 local models")).toBeInTheDocument();
    });
  });

  describe("OllamaStatusIndicator", () => {
    it("should render green indicator when available", () => {
      const { container } = render(
        <OllamaStatusIndicator
          available={true}
          modelCount={3}
        />
      );

      const dot = container.querySelector(".bg-green-500");
      expect(dot).toBeInTheDocument();
      expect(screen.getByText(/3.*Online/)).toBeInTheDocument();
    });

    it("should render gray indicator when not available", () => {
      const { container } = render(
        <OllamaStatusIndicator
          available={false}
          modelCount={0}
        />
      );

      const dot = container.querySelector(".bg-muted-foreground");
      expect(dot).toBeInTheDocument();
      expect(screen.getByText(/Offline/)).toBeInTheDocument();
    });

    it("should hide text when showText is false", () => {
      render(
        <OllamaStatusIndicator
          available={true}
          modelCount={3}
          showText={false}
        />
      );

      expect(screen.queryByText(/3.*Online/)).not.toBeInTheDocument();
    });

    it("should display 'offline' text when not available", () => {
      render(
        <OllamaStatusIndicator
          available={false}
          modelCount={0}
          showText={true}
        />
      );

      expect(screen.getByText(/Offline/)).toBeInTheDocument();
    });

    it("should have pulse animation when available", () => {
      const { container } = render(
        <OllamaStatusIndicator
          available={true}
          modelCount={1}
        />
      );

      const dot = container.querySelector(".animate-pulse");
      expect(dot).toBeInTheDocument();
    });

    it("should not have pulse animation when not available", () => {
      const { container } = render(
        <OllamaStatusIndicator
          available={false}
          modelCount={0}
        />
      );

      const greenDot = container.querySelector(".bg-green-500");
      expect(greenDot).not.toBeInTheDocument();
    });
  });
});
