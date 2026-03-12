/**
 * ErrorSolutions 组件测试
 */
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ErrorSolutions } from "./ErrorSolutions";

// Mock i18next
vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, params?: Record<string, unknown>) => {
      // 简单翻译模拟
      if (key.includes(".title")) return `Title: ${key.split(".")[0]}`;
      if (key.includes(".description")) return `Description: ${key.split(".")[0]}`;
      if (key.includes(".step1")) return "Step 1";
      if (key.includes(".step2")) return "Step 2";
      if (key.includes(".step3")) return "Step 3";
      if (key === "errors.title") return "Error Solutions";
      if (key === "errors.searchPlaceholder") return "Search errors...";
      if (key === "errors.searchResults") return `Found ${params?.count || 0} results`;
      if (key === "errors.noResults") return "No matching errors found";
      if (key === "errors.solutions") return "Solutions";
      if (key === "errors.relatedSettings") return "Related Settings";
      if (key === "errors.items") return "items";
      if (key.includes("categories.")) return key.split(".")[1] || key;
      if (key.includes("settings.categories.")) return key.split(".")[2] || "Settings";
      return key;
    },
    i18n: {
      language: "en",
    },
  }),
}));

describe("ErrorSolutions", () => {
  it("should render title", () => {
    render(<ErrorSolutions />);
    // 标题组件渲染
    expect(screen.getByText(/Title: errors/)).toBeInTheDocument();
  });

  it("should render search input", () => {
    render(<ErrorSolutions />);
    const searchInput = screen.getByPlaceholderText("Search errors...");
    expect(searchInput).toBeInTheDocument();
  });

  it("should render all categories", () => {
    render(<ErrorSolutions />);
    // 检查分类图标存在
    expect(screen.getByText("🔑")).toBeInTheDocument(); // API Key
    expect(screen.getByText("🌐")).toBeInTheDocument(); // Connection
    expect(screen.getByText("🤖")).toBeInTheDocument(); // Model
    expect(screen.getByText("💻")).toBeInTheDocument(); // Ollama
    expect(screen.getByText("📄")).toBeInTheDocument(); // RAG
    // 使用 getAllByText 处理重复元素
    expect(screen.getAllByText("⚠️").length).toBeGreaterThan(0); // General
  });

  it("should filter errors based on search query", () => {
    render(<ErrorSolutions />);
    const searchInput = screen.getByPlaceholderText("Search errors...");

    // 输入搜索词
    fireEvent.change(searchInput, { target: { value: "api" } });

    // 应该显示搜索结果
    expect(screen.getByText(/Found \d+ results/)).toBeInTheDocument();
  });

  it("should show no results message for unmatched search", () => {
    render(<ErrorSolutions />);
    const searchInput = screen.getByPlaceholderText("Search errors...");

    // 输入不存在的搜索词
    fireEvent.change(searchInput, { target: { value: "xyznonexistent123" } });

    // 应该显示无结果消息
    expect(screen.getByText("No matching errors found")).toBeInTheDocument();
  });

  it("should apply custom className", () => {
    const { container } = render(<ErrorSolutions className="custom-class" />);
    expect(container.firstChild).toHaveClass("custom-class");
  });

  it("should clear search when input is cleared", () => {
    render(<ErrorSolutions />);
    const searchInput = screen.getByPlaceholderText("Search errors...");

    // 输入搜索词
    fireEvent.change(searchInput, { target: { value: "api" } });
    expect(screen.getByText(/Found \d+ results/)).toBeInTheDocument();

    // 清空搜索
    fireEvent.change(searchInput, { target: { value: "" } });

    // 应该显示分类列表而不是搜索结果
    expect(screen.getByText("🔑")).toBeInTheDocument();
  });
});
