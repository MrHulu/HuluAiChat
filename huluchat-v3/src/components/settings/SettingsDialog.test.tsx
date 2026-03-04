import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SettingsDialog } from "./SettingsDialog";
import * as apiClient from "@/api/client";

// Mock API client
vi.mock("@/api/client", () => ({
  getSettings: vi.fn(),
  updateSettings: vi.fn(),
  getModels: vi.fn(),
  testConnection: vi.fn(),
}));

// Mock sonner toast
vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe("SettingsDialog", () => {
  const mockGetSettings = vi.mocked(apiClient.getSettings);
  const mockUpdateSettings = vi.mocked(apiClient.updateSettings);
  const mockGetModels = vi.mocked(apiClient.getModels);
  const mockTestConnection = vi.mocked(apiClient.testConnection);

  const defaultSettings = {
    openai_base_url: "https://api.openai.com/v1",
    openai_model: "gpt-4",
    has_api_key: true,
  };

  const defaultModels = [
    { id: "gpt-4", name: "GPT-4", description: "Most capable model" },
    { id: "gpt-3.5-turbo", name: "GPT-3.5 Turbo", description: "Fast and efficient" },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    mockGetSettings.mockResolvedValue(defaultSettings);
    mockGetModels.mockResolvedValue(defaultModels);
    mockUpdateSettings.mockResolvedValue(undefined);
    mockTestConnection.mockResolvedValue({ message: "Connection successful" });
  });

  describe("rendering", () => {
    it("should render settings button", () => {
      render(<SettingsDialog />);

      expect(screen.getByRole("button", { name: /settings/i })).toBeInTheDocument();
    });

    it("should open dialog when button is clicked", async () => {
      const user = userEvent.setup();
      render(<SettingsDialog />);

      const button = screen.getByRole("button", { name: /settings/i });
      await user.click(button);

      await waitFor(() => {
        expect(screen.getByRole("heading", { name: "Settings" })).toBeInTheDocument();
        expect(screen.getByText("Configure your API settings and preferences.")).toBeInTheDocument();
      });
    });

    it("should support controlled mode with open prop", async () => {
      render(<SettingsDialog open={true} onOpenChange={vi.fn()} />);

      await waitFor(() => {
        expect(screen.getByRole("heading", { name: "Settings" })).toBeInTheDocument();
      });
    });

    it("should load settings when dialog opens", async () => {
      render(<SettingsDialog open={true} onOpenChange={vi.fn()} />);

      await waitFor(() => {
        expect(mockGetSettings).toHaveBeenCalled();
        expect(mockGetModels).toHaveBeenCalled();
      });
    });
  });

  describe("loading state", () => {
    it("should show loading spinner while loading", async () => {
      // Create a promise that we control
      let resolvePromise: (value: typeof defaultSettings) => void;
      const controlledPromise = new Promise<typeof defaultSettings>((resolve) => {
        resolvePromise = resolve;
      });
      mockGetSettings.mockImplementation(() => controlledPromise);

      render(<SettingsDialog open={true} onOpenChange={vi.fn()} />);

      // Check for animate-spin class which indicates loading
      await waitFor(
        () => {
          const spinner = document.querySelector(".animate-spin");
          expect(spinner).toBeInTheDocument();
        },
        { timeout: 1000 }
      );

      // Resolve the promise to clean up
      resolvePromise!(defaultSettings);
    });
  });

  describe("form fields", () => {
    it("should render API key field", async () => {
      const user = userEvent.setup();
      render(<SettingsDialog />);

      const button = screen.getByRole("button", { name: /settings/i });
      await user.click(button);

      await waitFor(() => {
        expect(screen.getByLabelText("API Key")).toBeInTheDocument();
      });
    });

    it("should render Base URL field", async () => {
      const user = userEvent.setup();
      render(<SettingsDialog />);

      const button = screen.getByRole("button", { name: /settings/i });
      await user.click(button);

      await waitFor(() => {
        expect(screen.getByLabelText(/base url/i)).toBeInTheDocument();
      });
    });

    it("should render Model selection field", async () => {
      const user = userEvent.setup();
      render(<SettingsDialog />);

      const button = screen.getByRole("button", { name: /settings/i });
      await user.click(button);

      await waitFor(() => {
        // Model select doesn't have a direct label, use text content
        expect(screen.getByText("Model")).toBeInTheDocument();
      });
    });

    it("should show placeholder when API key exists", async () => {
      const user = userEvent.setup();
      render(<SettingsDialog />);

      const button = screen.getByRole("button", { name: /settings/i });
      await user.click(button);

      await waitFor(() => {
        expect(screen.getByPlaceholderText("••••••••••••••••")).toBeInTheDocument();
      });
    });

    it("should show placeholder when no API key", async () => {
      mockGetSettings.mockResolvedValue({
        ...defaultSettings,
        has_api_key: false,
      });

      const user = userEvent.setup();
      render(<SettingsDialog />);

      const button = screen.getByRole("button", { name: /settings/i });
      await user.click(button);

      await waitFor(() => {
        expect(screen.getByPlaceholderText("sk-...")).toBeInTheDocument();
      });
    });
  });

  describe("save functionality", () => {
    it("should call updateSettings with API key when provided", async () => {
      const user = userEvent.setup();
      render(<SettingsDialog />);

      const button = screen.getByRole("button", { name: /settings/i });
      await user.click(button);

      await waitFor(async () => {
        const apiKeyInput = screen.getByLabelText("API Key");
        await user.type(apiKeyInput, "sk-test-key");
      });

      const saveButton = screen.getByRole("button", { name: /save/i });
      await user.click(saveButton);

      await waitFor(() => {
        expect(mockUpdateSettings).toHaveBeenCalledWith(
          expect.objectContaining({
            openai_api_key: "sk-test-key",
          })
        );
      });
    });

    it("should call updateSettings with base URL when provided", async () => {
      const user = userEvent.setup();
      render(<SettingsDialog />);

      const button = screen.getByRole("button", { name: /settings/i });
      await user.click(button);

      await waitFor(() => {
        expect(screen.getByLabelText(/base url/i)).toBeInTheDocument();
      });

      const baseUrlInput = screen.getByLabelText(/base url/i);
      // Clear and type in the input
      await user.clear(baseUrlInput);
      await user.type(baseUrlInput, "https://custom.api.com/v1");

      const saveButton = screen.getByRole("button", { name: /save/i });
      await user.click(saveButton);

      await waitFor(() => {
        expect(mockUpdateSettings).toHaveBeenCalledWith(
          expect.objectContaining({
            openai_base_url: "https://custom.api.com/v1",
          })
        );
      });
    });

    it("should show success toast on save", async () => {
      const { toast } = await import("sonner");
      const user = userEvent.setup();
      render(<SettingsDialog />);

      const button = screen.getByRole("button", { name: /settings/i });
      await user.click(button);

      await waitFor(() => {
        expect(screen.getByRole("button", { name: /save/i })).toBeInTheDocument();
      });

      const saveButton = screen.getByRole("button", { name: /save/i });
      await user.click(saveButton);

      await waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith("Settings saved successfully");
      });
    });

    it("should show error toast on save failure", async () => {
      const { toast } = await import("sonner");
      mockUpdateSettings.mockRejectedValue(new Error("Save failed"));

      const user = userEvent.setup();
      render(<SettingsDialog />);

      const button = screen.getByRole("button", { name: /settings/i });
      await user.click(button);

      await waitFor(() => {
        expect(screen.getByRole("button", { name: /save/i })).toBeInTheDocument();
      });

      const saveButton = screen.getByRole("button", { name: /save/i });
      await user.click(saveButton);

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith("Failed to save settings");
      });
    });

    it("should call onSettingsChange after successful save", async () => {
      const onSettingsChange = vi.fn();
      const user = userEvent.setup();
      render(<SettingsDialog onSettingsChange={onSettingsChange} />);

      const button = screen.getByRole("button", { name: /settings/i });
      await user.click(button);

      await waitFor(() => {
        expect(screen.getByRole("button", { name: /save/i })).toBeInTheDocument();
      });

      const saveButton = screen.getByRole("button", { name: /save/i });
      await user.click(saveButton);

      await waitFor(() => {
        expect(onSettingsChange).toHaveBeenCalled();
      });
    });
  });

  describe("test connection functionality", () => {
    it("should call testConnection when Test button is clicked", async () => {
      const user = userEvent.setup();
      render(<SettingsDialog />);

      const button = screen.getByRole("button", { name: /settings/i });
      await user.click(button);

      await waitFor(() => {
        expect(screen.getByRole("button", { name: /test/i })).toBeInTheDocument();
      });

      const testButton = screen.getByRole("button", { name: /test/i });
      await user.click(testButton);

      await waitFor(() => {
        expect(mockTestConnection).toHaveBeenCalled();
      });
    });

    it("should show success message on successful test", async () => {
      const user = userEvent.setup();
      render(<SettingsDialog />);

      const button = screen.getByRole("button", { name: /settings/i });
      await user.click(button);

      await waitFor(() => {
        expect(screen.getByRole("button", { name: /test/i })).toBeInTheDocument();
      });

      const testButton = screen.getByRole("button", { name: /test/i });
      await user.click(testButton);

      await waitFor(() => {
        expect(screen.getByText("Connection successful")).toBeInTheDocument();
      });
    });

    it("should show error message on failed test", async () => {
      mockTestConnection.mockRejectedValue(new Error("Connection failed"));

      const user = userEvent.setup();
      render(<SettingsDialog />);

      const button = screen.getByRole("button", { name: /settings/i });
      await user.click(button);

      await waitFor(() => {
        expect(screen.getByRole("button", { name: /test/i })).toBeInTheDocument();
      });

      const testButton = screen.getByRole("button", { name: /test/i });
      await user.click(testButton);

      await waitFor(() => {
        expect(screen.getByText("Connection failed")).toBeInTheDocument();
      });
    });

    it("should disable Test button when no API key", async () => {
      mockGetSettings.mockResolvedValue({
        ...defaultSettings,
        has_api_key: false,
      });

      const user = userEvent.setup();
      render(<SettingsDialog />);

      const button = screen.getByRole("button", { name: /settings/i });
      await user.click(button);

      await waitFor(() => {
        const testButton = screen.getByRole("button", { name: /test/i });
        expect(testButton).toBeDisabled();
      });
    });
  });

  describe("model selection", () => {
    it("should display model options", async () => {
      const user = userEvent.setup();
      render(<SettingsDialog />);

      const button = screen.getByRole("button", { name: /settings/i });
      await user.click(button);

      await waitFor(async () => {
        const modelSelect = screen.getByRole("combobox");
        await user.click(modelSelect);
      });

      await waitFor(() => {
        // Use getAllByText since GPT-4 appears multiple times (selected + option)
        expect(screen.getAllByText("GPT-4").length).toBeGreaterThan(0);
        expect(screen.getByText("GPT-3.5 Turbo")).toBeInTheDocument();
      });
    });

    it("should select model on click", async () => {
      const user = userEvent.setup();
      render(<SettingsDialog />);

      const button = screen.getByRole("button", { name: /settings/i });
      await user.click(button);

      await waitFor(async () => {
        const modelSelect = screen.getByRole("combobox");
        await user.click(modelSelect);
      });

      await waitFor(async () => {
        const gpt35Option = screen.getByText("GPT-3.5 Turbo");
        await user.click(gpt35Option);
      });

      const saveButton = screen.getByRole("button", { name: /save/i });
      await user.click(saveButton);

      await waitFor(() => {
        expect(mockUpdateSettings).toHaveBeenCalledWith(
          expect.objectContaining({
            openai_model: "gpt-3.5-turbo",
          })
        );
      });
    });
  });
});
