/**
 * FeatureDiscoveryTip Component Tests
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { FeatureDiscoveryTip } from "./FeatureDiscoveryTip";
import type { FeatureConfig } from "@/hooks/useFeatureDiscovery";

// Mock react-i18next
vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        "featureDiscovery.features.commandPalette.title": "Command Palette",
        "featureDiscovery.features.commandPalette.description":
          "Quickly access features with Ctrl+K",
        "featureDiscovery.features.commandPalette.action": "Try Now",
        "featureDiscovery.moreOptions": "More options",
        "featureDiscovery.dismiss": "Dismiss",
        "featureDiscovery.dontShowAgain": "Don't show tips again",
      };
      return translations[key] || key;
    },
  }),
}));

describe("FeatureDiscoveryTip Component", () => {
  const mockFeature: FeatureConfig = {
    id: "command-palette",
    titleKey: "featureDiscovery.features.commandPalette.title",
    descriptionKey: "featureDiscovery.features.commandPalette.description",
    actionKey: "featureDiscovery.features.commandPalette.action",
    icon: "⌘",
  };

  const mockOnDismiss = vi.fn();
  const mockOnDisableAll = vi.fn();
  const mockOnAction = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("应该渲染功能标题和描述", () => {
    render(
      <FeatureDiscoveryTip
        feature={mockFeature}
        onDismiss={mockOnDismiss}
        onDisableAll={mockOnDisableAll}
      />
    );

    expect(screen.getByText("Command Palette")).toBeInTheDocument();
    expect(screen.getByText("Quickly access features with Ctrl+K")).toBeInTheDocument();
  });

  it("应该渲染图标", () => {
    render(
      <FeatureDiscoveryTip
        feature={mockFeature}
        onDismiss={mockOnDismiss}
        onDisableAll={mockOnDisableAll}
      />
    );

    expect(screen.getByText("⌘")).toBeInTheDocument();
  });

  it("应该渲染操作按钮", () => {
    render(
      <FeatureDiscoveryTip
        feature={mockFeature}
        onDismiss={mockOnDismiss}
        onDisableAll={mockOnDisableAll}
      />
    );

    expect(screen.getByRole("button", { name: "Try Now" })).toBeInTheDocument();
  });

  it("点击操作按钮应该触发回调", () => {
    render(
      <FeatureDiscoveryTip
        feature={mockFeature}
        onDismiss={mockOnDismiss}
        onDisableAll={mockOnDisableAll}
        onAction={mockOnAction}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "Try Now" }));

    expect(mockOnAction).toHaveBeenCalledTimes(1);
    expect(mockOnDismiss).toHaveBeenCalledTimes(1);
  });

  it("没有 onAction 时点击操作按钮应该只触发关闭", () => {
    render(
      <FeatureDiscoveryTip
        feature={mockFeature}
        onDismiss={mockOnDismiss}
        onDisableAll={mockOnDisableAll}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "Try Now" }));

    expect(mockOnDismiss).toHaveBeenCalledTimes(1);
  });

  it("应该有更多选项菜单", () => {
    render(
      <FeatureDiscoveryTip
        feature={mockFeature}
        onDismiss={mockOnDismiss}
        onDisableAll={mockOnDisableAll}
      />
    );

    // 查找更多选项按钮
    const moreButton = screen.getByRole("button", { name: "More options" });
    expect(moreButton).toBeInTheDocument();
  });

  it("应该有更多选项菜单按钮", () => {
    render(
      <FeatureDiscoveryTip
        feature={mockFeature}
        onDismiss={mockOnDismiss}
        onDisableAll={mockOnDisableAll}
      />
    );

    // 验证更多选项按钮存在
    const moreButton = screen.getByRole("button", { name: "More options" });
    expect(moreButton).toBeInTheDocument();
    expect(moreButton).toHaveAttribute("aria-haspopup", "menu");
  });

  it("应该有正确的无障碍属性", () => {
    render(
      <FeatureDiscoveryTip
        feature={mockFeature}
        onDismiss={mockOnDismiss}
        onDisableAll={mockOnDisableAll}
      />
    );

    const alert = screen.getByRole("alert");
    expect(alert).toHaveAttribute("aria-live", "polite");
  });

  it("应该支持自定义类名", () => {
    const { container } = render(
      <FeatureDiscoveryTip
        feature={mockFeature}
        onDismiss={mockOnDismiss}
        onDisableAll={mockOnDisableAll}
        className="custom-class"
      />
    );

    expect(container.firstChild).toHaveClass("custom-class");
  });
});
