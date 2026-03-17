/**
 * VariableInputDialog Tests
 *
 * Tests for variable input dialog component
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { VariableInputDialog } from "./VariableInputDialog";

// Mock templateVariables utils
vi.mock("@/utils/templateVariables", () => ({
  getUserVariables: vi.fn(),
  getVariableInfo: vi.fn(),
  PREDEFINED_VARIABLES: {
    date: () => "2024-01-15",
    time: () => "10:30",
  },
}));

// Mock i18next
vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, options?: Record<string, unknown>) => {
      const translations: Record<string, string> = {
        "variables.dialogTitle": "Fill in Variables",
        "variables.dialogDescription": "Please fill in the following variables:",
        "variables.dialogDescriptionWithTemplate": `Please fill in the variables for ${options?.template}:`,
        "variables.autoFilledVariables": "Auto-filled variables",
        "variables.enterValue": "Enter value",
        "variables.preview": "Preview",
        "variables.apply": "Apply",
        "common.cancel": "Cancel",
      };
      return translations[key] ?? key;
    },
  }),
}));

import {
  getUserVariables,
  getVariableInfo,
} from "@/utils/templateVariables";

describe("VariableInputDialog", () => {
  const defaultProps = {
    open: true,
    onOpenChange: vi.fn(),
    templateContent: "Hello {{name}}, today is {{date}}!",
    templateName: "Test Template",
    onSubmit: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("with user variables", () => {
    beforeEach(() => {
      vi.mocked(getUserVariables).mockReturnValue([
        {
          name: "name",
          label: "Name",
          placeholder: "Enter your name",
          defaultValue: "",
        },
      ]);
      vi.mocked(getVariableInfo).mockReturnValue({
        name: "date",
        label: "Date",
        description: "Current date",
      });
    });

    it("should render dialog with title", () => {
      render(<VariableInputDialog {...defaultProps} />);
      expect(screen.getByText("Fill in Variables")).toBeInTheDocument();
    });

    it("should display template name in description", () => {
      render(<VariableInputDialog {...defaultProps} />);
      expect(screen.getByText(/Test Template/)).toBeInTheDocument();
    });

    it("should display variable input field", () => {
      render(<VariableInputDialog {...defaultProps} />);
      expect(screen.getByLabelText(/{{name}}/)).toBeInTheDocument();
    });

    it("should display auto-filled variables section", () => {
      render(<VariableInputDialog {...defaultProps} />);
      expect(screen.getByText("Auto-filled variables")).toBeInTheDocument();
    });

    it("should have apply button initially disabled when required field empty", () => {
      render(<VariableInputDialog {...defaultProps} />);
      expect(screen.getByText("Apply")).toBeDisabled();
    });

    it("should enable apply button when required field filled", async () => {
      render(<VariableInputDialog {...defaultProps} />);

      const input = screen.getByLabelText(/{{name}}/);
      fireEvent.change(input, { target: { value: "John" } });

      await waitFor(() => {
        expect(screen.getByText("Apply")).not.toBeDisabled();
      });
    });

    it("should call onSubmit with processed content when apply clicked", async () => {
      render(<VariableInputDialog {...defaultProps} />);

      const input = screen.getByLabelText(/{{name}}/);
      fireEvent.change(input, { target: { value: "John" } });

      const applyButton = screen.getByText("Apply");
      fireEvent.click(applyButton);

      await waitFor(() => {
        expect(defaultProps.onSubmit).toHaveBeenCalledWith(
          "Hello John, today is 2024-01-15!"
        );
      });
    });

    it("should call onOpenChange with false when cancel clicked", () => {
      render(<VariableInputDialog {...defaultProps} />);

      fireEvent.click(screen.getByText("Cancel"));

      expect(defaultProps.onOpenChange).toHaveBeenCalledWith(false);
    });

    it("should display preview section", () => {
      render(<VariableInputDialog {...defaultProps} />);
      expect(screen.getByText("Preview")).toBeInTheDocument();
    });
  });

  describe("without user variables", () => {
    beforeEach(() => {
      vi.mocked(getUserVariables).mockReturnValue([]);
      vi.mocked(getVariableInfo).mockReturnValue({
        name: "date",
        label: "Date",
        description: "Current date",
      });
    });

    it("should return null when no user variables", () => {
      const { container } = render(<VariableInputDialog {...defaultProps} />);
      expect(container.firstChild).toBeNull();
    });

    it("should auto-submit when no user variables", async () => {
      render(<VariableInputDialog {...defaultProps} />);

      await waitFor(() => {
        expect(defaultProps.onSubmit).toHaveBeenCalled();
      });
    });
  });

  describe("with default values", () => {
    beforeEach(() => {
      vi.mocked(getUserVariables).mockReturnValue([
        {
          name: "name",
          label: "Name",
          placeholder: "Enter your name",
          defaultValue: "Default Name",
        },
      ]);
      vi.mocked(getVariableInfo).mockReturnValue({
        name: "date",
        label: "Date",
        description: "Current date",
      });
    });

    it("should pre-fill input with default value", () => {
      render(<VariableInputDialog {...defaultProps} />);
      const input = screen.getByLabelText(/{{name}}/);
      expect(input).toHaveValue("Default Name");
    });

    it("should enable apply button when default value provided", () => {
      render(<VariableInputDialog {...defaultProps} />);
      expect(screen.getByText("Apply")).not.toBeDisabled();
    });
  });
});
