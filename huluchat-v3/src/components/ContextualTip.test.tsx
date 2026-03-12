/**
 * ContextualTip Component Tests
 * 上下文智能提示组件测试
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ContextualTip } from "./ContextualTip";
import type { ContextualTipConfig } from "@/data/contextualTips";

// Mock react-i18next
vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        "contextualTips.tips.noApiKey.title": "Configure API Key",
        "contextualTips.tips.noApiKey.description": "No API key detected. Set up your key to start chatting with AI.",
        "contextualTips.tips.noApiKey.action": "Go to Settings",
        "contextualTips.moreOptions": "More options",
        "contextualTips.dismiss": "Dismiss",
        "contextualTips.dontShowAgain": "Don't show contextual tips",
      };
      return translations[key] || key;
    },
  }),
}));

describe("ContextualTip Component", () => {
  const mockTip: ContextualTipConfig = {
    id: "no-api-key",
    titleKey: "contextualTips.tips.noApiKey.title",
    descriptionKey: "contextualTips.tips.noApiKey.description",
    actionKey: "contextualTips.tips.noApiKey.action",
    icon: "🔑",
    priority: 1,
    condition: "hasNoApiKey",
  };

  const mockOnDismiss = vi.fn();
  const mockOnDisableAll = vi.fn();
  const mockOnAction = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("应该渲染提示标题和描述", () => {
    render(
      <ContextualTip
        tip={mockTip}
        onDismiss={mockOnDismiss}
        onDisableAll={mockOnDisableAll}
      />
    );

    expect(screen.getByText("Configure API Key")).toBeInTheDocument();
    expect(
      screen.getByText("No API key detected. Set up your key to start chatting with AI.")
    ).toBeInTheDocument();
  });

  it("应该渲染图标", () => {
    render(
      <ContextualTip
        tip={mockTip}
        onDismiss={mockOnDismiss}
        onDisableAll={mockOnDisableAll}
      />
    );

    expect(screen.getByText("🔑")).toBeInTheDocument();
  });

  it("应该渲染操作按钮", () => {
    render(
      <ContextualTip
        tip={mockTip}
        onDismiss={mockOnDismiss}
        onDisableAll={mockOnDisableAll}
      />
    );

    expect(screen.getByRole("button", { name: "Go to Settings" })).toBeInTheDocument();
  });

  it("点击操作按钮应该触发回调", () => {
    render(
      <ContextualTip
        tip={mockTip}
        onDismiss={mockOnDismiss}
        onDisableAll={mockOnDisableAll}
        onAction={mockOnAction}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "Go to Settings" }));

    expect(mockOnAction).toHaveBeenCalledTimes(1);
    expect(mockOnDismiss).toHaveBeenCalledTimes(1);
  });

  it("没有 onAction 时点击操作按钮应该只触发关闭", () => {
    render(
      <ContextualTip
        tip={mockTip}
        onDismiss={mockOnDismiss}
        onDisableAll={mockOnDisableAll}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "Go to Settings" }));

    expect(mockOnDismiss).toHaveBeenCalledTimes(1);
  });

  it("应该有更多选项菜单按钮", () => {
    render(
      <ContextualTip
        tip={mockTip}
        onDismiss={mockOnDismiss}
        onDisableAll={mockOnDisableAll}
      />
    );

    const moreButton = screen.getByRole("button", { name: "More options" });
    expect(moreButton).toBeInTheDocument();
    expect(moreButton).toHaveAttribute("aria-haspopup", "menu");
  });

  it("应该有正确的无障碍属性", () => {
    render(
      <ContextualTip
        tip={mockTip}
        onDismiss={mockOnDismiss}
        onDisableAll={mockOnDisableAll}
      />
    );

    const alert = screen.getByRole("alert");
    expect(alert).toHaveAttribute("aria-live", "polite");
  });

  it("应该支持自定义类名", () => {
    const { container } = render(
      <ContextualTip
        tip={mockTip}
        onDismiss={mockOnDismiss}
        onDisableAll={mockOnDisableAll}
        className="custom-class"
      />
    );

    expect(container.firstChild).toHaveClass("custom-class");
  });

  it("应该渲染不同类型的提示", () => {
    const emptySessionTip: ContextualTipConfig = {
      id: "empty-session",
      titleKey: "contextualTips.tips.emptySession.title",
      descriptionKey: "contextualTips.tips.emptySession.description",
      actionKey: "contextualTips.tips.emptySession.action",
      icon: "💬",
      priority: 10,
      condition: "isEmptySession",
    };

    render(
      <ContextualTip
        tip={emptySessionTip}
        onDismiss={mockOnDismiss}
        onDisableAll={mockOnDisableAll}
      />
    );

    expect(screen.getByText("💬")).toBeInTheDocument();
  });
});
