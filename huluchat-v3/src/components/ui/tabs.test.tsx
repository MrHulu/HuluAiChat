import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "./tabs";

describe("Tabs", () => {
  describe("Tabs", () => {
    it("should render tabs with children", () => {
      render(
        <Tabs defaultValue="tab1">
          <TabsList>
            <TabsTrigger value="tab1">Tab 1</TabsTrigger>
          </TabsList>
          <TabsContent value="tab1">Content 1</TabsContent>
        </Tabs>
      );

      expect(screen.getByText("Tab 1")).toBeInTheDocument();
      expect(screen.getByText("Content 1")).toBeInTheDocument();
    });

    it("should set default value", () => {
      render(
        <Tabs defaultValue="tab1">
          <TabsList>
            <TabsTrigger value="tab1">Tab 1</TabsTrigger>
            <TabsTrigger value="tab2">Tab 2</TabsTrigger>
          </TabsList>
          <TabsContent value="tab1">Content 1</TabsContent>
          <TabsContent value="tab2">Content 2</TabsContent>
        </Tabs>
      );

      expect(screen.getByText("Content 1")).toBeVisible();
    });
  });

  describe("TabsList", () => {
    it("should render tabs list with children", () => {
      render(
        <Tabs defaultValue="tab1">
          <TabsList data-testid="tabs-list">
            <TabsTrigger value="tab1">Tab 1</TabsTrigger>
          </TabsList>
        </Tabs>
      );

      expect(screen.getByTestId("tabs-list")).toBeInTheDocument();
    });

    it("should apply default classes", () => {
      render(
        <Tabs defaultValue="tab1">
          <TabsList data-testid="tabs-list">
            <TabsTrigger value="tab1">Tab 1</TabsTrigger>
          </TabsList>
        </Tabs>
      );

      const tabsList = screen.getByTestId("tabs-list");
      expect(tabsList.className).toContain("inline-flex");
      expect(tabsList.className).toContain("h-9");
      expect(tabsList.className).toContain("rounded-lg");
    });

    it("should have dark mode classes", () => {
      render(
        <Tabs defaultValue="tab1">
          <TabsList data-testid="tabs-list">
            <TabsTrigger value="tab1">Tab 1</TabsTrigger>
          </TabsList>
        </Tabs>
      );

      const tabsList = screen.getByTestId("tabs-list");
      expect(tabsList.className).toContain("dark:bg-muted/60");
    });

    it("should apply custom className", () => {
      render(
        <Tabs defaultValue="tab1">
          <TabsList className="custom-list">
            <TabsTrigger value="tab1">Tab 1</TabsTrigger>
          </TabsList>
        </Tabs>
      );

      expect(screen.getByRole("tablist")).toHaveClass("custom-list");
    });

    it("should forward ref correctly", () => {
      const ref = { current: null as HTMLDivElement | null };
      render(
        <Tabs defaultValue="tab1">
          <TabsList ref={ref}>
            <TabsTrigger value="tab1">Tab 1</TabsTrigger>
          </TabsList>
        </Tabs>
      );

      expect(ref.current).toBeInstanceOf(HTMLDivElement);
    });

    it("should have tablist role", () => {
      render(
        <Tabs defaultValue="tab1">
          <TabsList>
            <TabsTrigger value="tab1">Tab 1</TabsTrigger>
          </TabsList>
        </Tabs>
      );

      expect(screen.getByRole("tablist")).toBeInTheDocument();
    });
  });

  describe("TabsTrigger", () => {
    it("should render trigger with text", () => {
      render(
        <Tabs defaultValue="tab1">
          <TabsList>
            <TabsTrigger value="tab1">Tab 1</TabsTrigger>
          </TabsList>
        </Tabs>
      );

      expect(screen.getByRole("tab", { name: "Tab 1" })).toBeInTheDocument();
    });

    it("should apply default classes", () => {
      render(
        <Tabs defaultValue="tab1">
          <TabsList>
            <TabsTrigger value="tab1" data-testid="trigger">
              Tab 1
            </TabsTrigger>
          </TabsList>
        </Tabs>
      );

      const trigger = screen.getByTestId("trigger");
      expect(trigger.className).toContain("inline-flex");
      expect(trigger.className).toContain("rounded-md");
      expect(trigger.className).toContain("px-3");
      expect(trigger.className).toContain("py-1");
      expect(trigger.className).toContain("text-sm");
    });

    it("should have transition classes", () => {
      render(
        <Tabs defaultValue="tab1">
          <TabsList>
            <TabsTrigger value="tab1" data-testid="trigger">
              Tab 1
            </TabsTrigger>
          </TabsList>
        </Tabs>
      );

      const trigger = screen.getByTestId("trigger");
      expect(trigger.className).toContain("transition-all");
      expect(trigger.className).toContain("duration-200");
    });

    it("should show active state when selected", () => {
      render(
        <Tabs defaultValue="tab1">
          <TabsList>
            <TabsTrigger value="tab1" data-testid="trigger">
              Tab 1
            </TabsTrigger>
          </TabsList>
        </Tabs>
      );

      const trigger = screen.getByTestId("trigger");
      expect(trigger).toHaveAttribute("data-state", "active");
    });

    it("should show inactive state when not selected", () => {
      render(
        <Tabs defaultValue="tab2">
          <TabsList>
            <TabsTrigger value="tab1" data-testid="trigger1">
              Tab 1
            </TabsTrigger>
            <TabsTrigger value="tab2">Tab 2</TabsTrigger>
          </TabsList>
        </Tabs>
      );

      const trigger = screen.getByTestId("trigger1");
      expect(trigger).toHaveAttribute("data-state", "inactive");
    });

    it("should apply custom className", () => {
      render(
        <Tabs defaultValue="tab1">
          <TabsList>
            <TabsTrigger value="tab1" className="custom-trigger">
              Tab 1
            </TabsTrigger>
          </TabsList>
        </Tabs>
      );

      expect(screen.getByRole("tab")).toHaveClass("custom-trigger");
    });

    it("should forward ref correctly", () => {
      const ref = { current: null as HTMLButtonElement | null };
      render(
        <Tabs defaultValue="tab1">
          <TabsList>
            <TabsTrigger value="tab1" ref={ref}>
              Tab 1
            </TabsTrigger>
          </TabsList>
        </Tabs>
      );

      expect(ref.current).toBeInstanceOf(HTMLButtonElement);
    });

    it("should be disabled when disabled prop is true", () => {
      render(
        <Tabs defaultValue="tab1">
          <TabsList>
            <TabsTrigger value="tab1" disabled>
              Tab 1
            </TabsTrigger>
          </TabsList>
        </Tabs>
      );

      expect(screen.getByRole("tab")).toBeDisabled();
    });
  });

  describe("TabsContent", () => {
    it("should render content with children", () => {
      render(
        <Tabs defaultValue="tab1">
          <TabsContent value="tab1">Content 1</TabsContent>
        </Tabs>
      );

      expect(screen.getByText("Content 1")).toBeInTheDocument();
    });

    it("should be visible when selected", () => {
      render(
        <Tabs defaultValue="tab1">
          <TabsContent value="tab1" data-testid="content1">
            Content 1
          </TabsContent>
          <TabsContent value="tab2" data-testid="content2">
            Content 2
          </TabsContent>
        </Tabs>
      );

      expect(screen.getByTestId("content1")).toBeVisible();
    });

    it("should be hidden when not selected", () => {
      render(
        <Tabs defaultValue="tab1">
          <TabsContent value="tab1">Content 1</TabsContent>
          <TabsContent value="tab2" data-testid="content2">
            Content 2
          </TabsContent>
        </Tabs>
      );

      const content2 = screen.getByTestId("content2");
      expect(content2).toHaveAttribute("data-state", "inactive");
    });

    it("should apply default classes", () => {
      render(
        <Tabs defaultValue="tab1">
          <TabsContent value="tab1" data-testid="content">
            Content 1
          </TabsContent>
        </Tabs>
      );

      const content = screen.getByTestId("content");
      expect(content.className).toContain("mt-2");
    });

    it("should have animation class for active state", () => {
      render(
        <Tabs defaultValue="tab1">
          <TabsContent value="tab1" data-testid="content">
            Content 1
          </TabsContent>
        </Tabs>
      );

      const content = screen.getByTestId("content");
      expect(content.className).toContain("data-[state=active]:animate-fade-in");
    });

    it("should apply custom className", () => {
      render(
        <Tabs defaultValue="tab1">
          <TabsContent value="tab1" className="custom-content">
            Content 1
          </TabsContent>
        </Tabs>
      );

      expect(screen.getByText("Content 1")).toHaveClass("custom-content");
    });

    it("should forward ref correctly", () => {
      const ref = { current: null as HTMLDivElement | null };
      render(
        <Tabs defaultValue="tab1">
          <TabsContent value="tab1" ref={ref}>
            Content 1
          </TabsContent>
        </Tabs>
      );

      expect(ref.current).toBeInstanceOf(HTMLDivElement);
    });

    it("should havetabpanel role", () => {
      render(
        <Tabs defaultValue="tab1">
          <TabsContent value="tab1">Content 1</TabsContent>
        </Tabs>
      );

      expect(screen.getByRole("tabpanel")).toBeInTheDocument();
    });
  });

  describe("Interaction", () => {
    it("should switch tabs on click", async () => {
      render(
        <Tabs defaultValue="tab1">
          <TabsList>
            <TabsTrigger value="tab1">Tab 1</TabsTrigger>
            <TabsTrigger value="tab2">Tab 2</TabsTrigger>
          </TabsList>
          <TabsContent value="tab1">Content 1</TabsContent>
          <TabsContent value="tab2">Content 2</TabsContent>
        </Tabs>
      );

      expect(screen.getByText("Content 1")).toBeVisible();

      await userEvent.click(screen.getByRole("tab", { name: "Tab 2" }));

      expect(screen.getByText("Content 2")).toBeVisible();
    });

    it("should call onValueChange when tab changes", async () => {
      const handleChange = vi.fn();
      render(
        <Tabs defaultValue="tab1" onValueChange={handleChange}>
          <TabsList>
            <TabsTrigger value="tab1">Tab 1</TabsTrigger>
            <TabsTrigger value="tab2">Tab 2</TabsTrigger>
          </TabsList>
          <TabsContent value="tab1">Content 1</TabsContent>
          <TabsContent value="tab2">Content 2</TabsContent>
        </Tabs>
      );

      await userEvent.click(screen.getByRole("tab", { name: "Tab 2" }));

      expect(handleChange).toHaveBeenCalledWith("tab2");
    });

    it("should not change tab when trigger is disabled", async () => {
      render(
        <Tabs defaultValue="tab1">
          <TabsList>
            <TabsTrigger value="tab1">Tab 1</TabsTrigger>
            <TabsTrigger value="tab2" disabled>
              Tab 2
            </TabsTrigger>
          </TabsList>
          <TabsContent value="tab1">Content 1</TabsContent>
          <TabsContent value="tab2">Content 2</TabsContent>
        </Tabs>
      );

      await userEvent.click(screen.getByRole("tab", { name: "Tab 2" }));

      expect(screen.getByText("Content 1")).toBeVisible();
    });
  });

  describe("Accessibility", () => {
    it("should have proper tab role", () => {
      render(
        <Tabs defaultValue="tab1">
          <TabsList>
            <TabsTrigger value="tab1">Tab 1</TabsTrigger>
          </TabsList>
        </Tabs>
      );

      expect(screen.getByRole("tab")).toBeInTheDocument();
    });

    it("should have proper tablist role", () => {
      render(
        <Tabs defaultValue="tab1">
          <TabsList>
            <TabsTrigger value="tab1">Tab 1</TabsTrigger>
          </TabsList>
        </Tabs>
      );

      expect(screen.getByRole("tablist")).toBeInTheDocument();
    });

    it("should have proper tabpanel role", () => {
      render(
        <Tabs defaultValue="tab1">
          <TabsContent value="tab1">Content 1</TabsContent>
        </Tabs>
      );

      expect(screen.getByRole("tabpanel")).toBeInTheDocument();
    });

    it("should be focusable", async () => {
      render(
        <Tabs defaultValue="tab1">
          <TabsList>
            <TabsTrigger value="tab1">Tab 1</TabsTrigger>
          </TabsList>
        </Tabs>
      );

      const tab = screen.getByRole("tab");
      tab.focus();

      expect(tab).toHaveFocus();
    });

    it("should have disabled attribute when disabled prop is true", () => {
      render(
        <Tabs defaultValue="tab1">
          <TabsList>
            <TabsTrigger value="tab1" disabled>
              Tab 1
            </TabsTrigger>
          </TabsList>
        </Tabs>
      );

      const tab = screen.getByRole("tab");
      expect(tab).toBeDisabled();
      expect(tab).toHaveAttribute("data-disabled", "");
    });
  });

  describe("Display Names", () => {
    it("TabsList should have displayName", () => {
      expect(TabsList.displayName).toBe("TabsList");
    });

    it("TabsTrigger should have displayName", () => {
      expect(TabsTrigger.displayName).toBe("TabsTrigger");
    });

    it("TabsContent should have displayName", () => {
      expect(TabsContent.displayName).toBe("TabsContent");
    });
  });
});
