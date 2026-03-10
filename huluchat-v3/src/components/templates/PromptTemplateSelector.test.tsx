import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { PromptTemplateSelector } from "./PromptTemplateSelector";
import type { PromptTemplate } from "@/api/client";

// Mock API client
const mockTemplates: PromptTemplate[] = [
  {
    id: "1",
    name: "Code Review",
    content: "Please review this code for best practices and potential issues.",
    category: "coding",
    is_builtin: true,
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
  },
  {
    id: "2",
    name: "Translate",
    content: "Translate the following text to {target_language}.",
    category: "translation",
    is_builtin: true,
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
  },
  {
    id: "3",
    name: "Custom Template",
    content: "This is my custom template.",
    category: "custom",
    is_builtin: false,
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
  },
];

const mockListTemplates = vi.fn();
const mockCreateTemplate = vi.fn();
const mockUpdateTemplate = vi.fn();
const mockDeleteTemplate = vi.fn();

vi.mock("@/api/client", () => ({
  listTemplates: () => mockListTemplates(),
  createTemplate: (name: string, content: string, category: string) =>
    mockCreateTemplate(name, content, category),
  updateTemplate: (id: string, data: { name: string; content: string }) =>
    mockUpdateTemplate(id, data),
  deleteTemplate: (id: string) => mockDeleteTemplate(id),
}));

// Mock react-i18next
vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, params?: Record<string, string>) => {
      const translations: Record<string, string> = {
        "templates.title": "Prompt Templates",
        "templates.description": "Select a template to use as your prompt",
        "templates.newTemplate": "+ New Template",
        "templates.all": "All",
        "templates.categories.writing": "Writing",
        "templates.categories.coding": "Coding",
        "templates.categories.analysis": "Analysis",
        "templates.categories.translation": "Translation",
        "templates.categories.custom": "Custom",
        "templates.categoriesLabel": "Template categories",
        "templates.name": "Name",
        "templates.namePlaceholder": "Template name",
        "templates.content": "Content",
        "templates.contentPlaceholder": "Template content...",
        "templates.templateList": "Template list",
        "templates.edit": "Edit template",
        "templates.delete": "Delete template",
        "templates.selectTemplate": params ? `Select ${params.name} template` : "Select template",
        "common.loading": "Loading...",
        "common.cancel": "Cancel",
        "common.save": "Save",
      };
      return translations[key] || key;
    },
  }),
}));

describe("PromptTemplateSelector", () => {
  const mockOnOpenChange = vi.fn();
  const mockOnSelect = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockListTemplates.mockResolvedValue(mockTemplates);
    mockCreateTemplate.mockImplementation((name, content, category) =>
      Promise.resolve({
        id: "new-id",
        name,
        content,
        category,
        is_builtin: false,
        created_at: "2024-01-01T00:00:00Z",
        updated_at: "2024-01-01T00:00:00Z",
      })
    );
    mockUpdateTemplate.mockImplementation((id, data) =>
      Promise.resolve({
        ...mockTemplates.find((t) => t.id === id)!,
        ...data,
        updated_at: "2024-01-02T00:00:00Z",
      })
    );
    mockDeleteTemplate.mockResolvedValue(undefined);
  });

  const renderComponent = (open = true) => {
    return render(
      <PromptTemplateSelector
        open={open}
        onOpenChange={mockOnOpenChange}
        onSelect={mockOnSelect}
      />
    );
  };

  it("should render dialog when open", async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText("Prompt Templates")).toBeInTheDocument();
    });
  });

  it("should not render content when closed", () => {
    renderComponent(false);

    expect(screen.queryByText("Prompt Templates")).not.toBeInTheDocument();
  });

  it("should show loading state initially", async () => {
    renderComponent();

    expect(screen.getByText("Loading...")).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.queryByText("Loading...")).not.toBeInTheDocument();
    });
  });

  it("should load templates on open", async () => {
    renderComponent();

    await waitFor(() => {
      expect(mockListTemplates).toHaveBeenCalled();
    });
  });

  it("should display templates after loading", async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText("Code Review")).toBeInTheDocument();
      expect(screen.getByText("Translate")).toBeInTheDocument();
      expect(screen.getByText("Custom Template")).toBeInTheDocument();
    });
  });

  it("should display category navigation", async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText("All")).toBeInTheDocument();
      expect(screen.getByText("Writing")).toBeInTheDocument();
      expect(screen.getByText("Coding")).toBeInTheDocument();
      expect(screen.getByText("Analysis")).toBeInTheDocument();
      expect(screen.getByText("Translation")).toBeInTheDocument();
      expect(screen.getByText("Custom")).toBeInTheDocument();
    });
  });

  it("should filter templates by category", async () => {
    const user = userEvent.setup();
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText("Code Review")).toBeInTheDocument();
    });

    // Click on Coding category button (accessible name is just "Coding", emoji is aria-hidden)
    const codingButton = screen.getByRole("button", { name: "Coding" });
    await user.click(codingButton);

    // Should still show coding template
    await waitFor(() => {
      expect(screen.getByText("Code Review")).toBeInTheDocument();
    });

    // Should not show translation template
    expect(screen.queryByText("Translate")).not.toBeInTheDocument();
  });

  it("should show all templates when All is clicked", async () => {
    const user = userEvent.setup();
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText("Code Review")).toBeInTheDocument();
    });

    // Click on Coding category first
    const codingButton = screen.getByRole("button", { name: "Coding" });
    await user.click(codingButton);

    // Then click All
    const allButton = screen.getByRole("button", { name: "All" });
    await user.click(allButton);

    // Should show all templates again
    await waitFor(() => {
      expect(screen.getByText("Code Review")).toBeInTheDocument();
      expect(screen.getByText("Translate")).toBeInTheDocument();
    });
  });

  it("should select template when clicked", async () => {
    const user = userEvent.setup();
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText("Code Review")).toBeInTheDocument();
    });

    await user.click(screen.getByText("Code Review"));

    expect(mockOnSelect).toHaveBeenCalledWith(
      "Please review this code for best practices and potential issues."
    );
    expect(mockOnOpenChange).toHaveBeenCalledWith(false);
  });

  it("should select template with keyboard", async () => {
    const user = userEvent.setup();
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText("Code Review")).toBeInTheDocument();
    });

    const templateItem = screen.getByRole("listitem", { name: /select code review/i });
    templateItem.focus();
    await user.keyboard("{Enter}");

    expect(mockOnSelect).toHaveBeenCalled();
  });

  it("should show edit and delete buttons for custom templates", async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText("Custom Template")).toBeInTheDocument();
    });

    const customTemplateItem = screen.getByRole("listitem", { name: /select custom template/i });

    // Should have edit and delete buttons
    expect(within(customTemplateItem).getByLabelText("Edit template")).toBeInTheDocument();
    expect(within(customTemplateItem).getByLabelText("Delete template")).toBeInTheDocument();
  });

  it("should not show edit and delete buttons for builtin templates", async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText("Code Review")).toBeInTheDocument();
    });

    const builtinTemplateItem = screen.getByRole("listitem", { name: /select code review/i });

    // Should not have edit and delete buttons
    expect(within(builtinTemplateItem).queryByLabelText("Edit template")).not.toBeInTheDocument();
    expect(within(builtinTemplateItem).queryByLabelText("Delete template")).not.toBeInTheDocument();
  });

  it("should delete template when delete button is clicked", async () => {
    const user = userEvent.setup();
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText("Custom Template")).toBeInTheDocument();
    });

    const deleteButton = screen.getByLabelText("Delete template");
    await user.click(deleteButton);

    expect(mockDeleteTemplate).toHaveBeenCalledWith("3");
  });

  it("should show template editor when new template button is clicked", async () => {
    const user = userEvent.setup();
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText("+ New Template")).toBeInTheDocument();
    });

    await user.click(screen.getByText("+ New Template"));

    await waitFor(() => {
      expect(screen.getByLabelText("Name")).toBeInTheDocument();
      expect(screen.getByLabelText("Content")).toBeInTheDocument();
    });
  });

  it("should create new template when save is clicked", async () => {
    const user = userEvent.setup();
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText("+ New Template")).toBeInTheDocument();
    });

    // Click new template button
    await user.click(screen.getByText("+ New Template"));

    // Fill in the form
    const nameInput = screen.getByLabelText("Name");
    const contentInput = screen.getByLabelText("Content");

    await user.type(nameInput, "My New Template");
    await user.type(contentInput, "This is my new template content.");

    // Click save
    await user.click(screen.getByText("Save"));

    expect(mockCreateTemplate).toHaveBeenCalledWith(
      "My New Template",
      "This is my new template content.",
      "custom"
    );
  });

  it("should not create template with empty content", async () => {
    const user = userEvent.setup();
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText("+ New Template")).toBeInTheDocument();
    });

    // Click new template button
    await user.click(screen.getByText("+ New Template"));

    // Leave content empty and click save
    await user.click(screen.getByText("Save"));

    expect(mockCreateTemplate).not.toHaveBeenCalled();
  });

  it("should cancel template editing", async () => {
    const user = userEvent.setup();
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText("+ New Template")).toBeInTheDocument();
    });

    // Click new template button
    await user.click(screen.getByText("+ New Template"));

    // Fill in the form
    const nameInput = screen.getByLabelText("Name");
    await user.type(nameInput, "Test");

    // Click cancel
    await user.click(screen.getByText("Cancel"));

    // Should return to template list
    await waitFor(() => {
      expect(screen.getByText("Code Review")).toBeInTheDocument();
    });
  });

  it("should show edit form when edit button is clicked", async () => {
    const user = userEvent.setup();
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText("Custom Template")).toBeInTheDocument();
    });

    const editButton = screen.getByLabelText("Edit template");
    await user.click(editButton);

    await waitFor(() => {
      expect(screen.getByDisplayValue("Custom Template")).toBeInTheDocument();
      expect(screen.getByDisplayValue("This is my custom template.")).toBeInTheDocument();
    });
  });

  it("should save edited template when save is clicked", async () => {
    // Note: Based on the component logic, editing a custom template (is_builtin: false)
    // calls handleCreateNew() which creates a new template.
    // This test verifies the save behavior for custom templates.
    const user = userEvent.setup();
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText("Custom Template")).toBeInTheDocument();
    });

    // Click edit button
    const editButton = screen.getByLabelText("Edit template");
    await user.click(editButton);

    await waitFor(() => {
      expect(screen.getByDisplayValue("Custom Template")).toBeInTheDocument();
    });

    // Get the content textarea
    const contentTextarea = screen.getByRole("textbox", { name: /content/i });

    // Clear existing content and type new content
    await user.clear(contentTextarea);
    await user.type(contentTextarea, "Updated template content.");

    // Click save button
    const saveButtons = screen.getAllByText("Save");
    await user.click(saveButtons[0]);

    // For non-builtin templates, it calls handleCreateNew which creates a new template
    await waitFor(() => {
      expect(mockCreateTemplate).toHaveBeenCalledWith(
        "Custom Template",
        "Updated template content.",
        "custom"
      );
    });
  });

  it("should display template content preview", async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText(/Please review this code/)).toBeInTheDocument();
    });
  });

  it("should have aria-pressed on category buttons", async () => {
    const user = userEvent.setup();
    renderComponent();

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "All" })).toBeInTheDocument();
    });

    const allButton = screen.getByRole("button", { name: "All" });
    expect(allButton).toHaveAttribute("aria-pressed", "true");

    // Click on Coding category
    const codingButton = screen.getByRole("button", { name: "Coding" });
    await user.click(codingButton);

    expect(codingButton).toHaveAttribute("aria-pressed", "true");
    expect(allButton).toHaveAttribute("aria-pressed", "false");
  });

  it("should have staggered animation delays on category buttons", async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "All" })).toBeInTheDocument();
    });

    const allButton = screen.getByRole("button", { name: "All" });
    expect(allButton.style.animationDelay).toBe("0ms");

    const writingButton = screen.getByRole("button", { name: "Writing" });
    expect(writingButton.style.animationDelay).toBe("50ms");

    const codingButton = screen.getByRole("button", { name: "Coding" });
    expect(codingButton.style.animationDelay).toBe("100ms");
  });

  it("should have staggered animation delays on template items", async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText("Code Review")).toBeInTheDocument();
    });

    const templateItems = screen.getAllByRole("listitem");
    expect(templateItems.length).toBeGreaterThan(0);

    // Check that items have animation delay styles
    // Each item should have a staggered delay based on its index within its category
    const delays = templateItems.map((item) => parseInt(item.style.animationDelay));

    // Verify all delays are multiples of 50
    delays.forEach((delay) => {
      expect(delay % 50).toBe(0);
    });

    // Verify delays are non-negative
    delays.forEach((delay) => {
      expect(delay).toBeGreaterThanOrEqual(0);
    });
  });

  it("should call onOpenChange when dialog is closed", async () => {
    const user = userEvent.setup();
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText("Prompt Templates")).toBeInTheDocument();
    });

    // Press Escape to close
    await user.keyboard("{Escape}");

    expect(mockOnOpenChange).toHaveBeenCalledWith(false);
  });

  it("should display category icons", async () => {
    renderComponent();

    await waitFor(() => {
      // Check for emoji icons in category navigation
      expect(screen.getByText("✍️")).toBeInTheDocument(); // writing
      expect(screen.getByText("💻")).toBeInTheDocument(); // coding
      expect(screen.getByText("📊")).toBeInTheDocument(); // analysis
      expect(screen.getByText("🌐")).toBeInTheDocument(); // translation
      expect(screen.getByText("⭐")).toBeInTheDocument(); // custom
    });
  });
});
