/**
 * EmptyState Component Tests
 */
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { EmptyState, EmptyStateCompact } from "./empty-state";

describe("EmptyState", () => {
  it("renders with title", () => {
    render(<EmptyState title="暂无数据" />);
    expect(screen.getByText("暂无数据")).toBeInTheDocument();
  });

  it("renders with description", () => {
    render(
      <EmptyState
        title="暂无数据"
        description="点击添加按钮创建新内容"
      />
    );
    expect(screen.getByText("暂无数据")).toBeInTheDocument();
    expect(screen.getByText("点击添加按钮创建新内容")).toBeInTheDocument();
  });

  it("renders with emoji icon", () => {
    render(<EmptyState title="暂无数据" icon="📭" />);
    expect(screen.getByText("📭")).toBeInTheDocument();
  });

  it("applies correct size classes", () => {
    const { container: smContainer } = render(
      <EmptyState title="Small" size="sm" data-testid="sm" />
    );
    const { container: lgContainer } = render(
      <EmptyState title="Large" size="lg" data-testid="lg" />
    );

    expect(smContainer.firstChild).toHaveClass("py-4");
    expect(lgContainer.firstChild).toHaveClass("p-8");
  });

  it("has correct accessibility attributes", () => {
    render(<EmptyState title="暂无数据" />);
    const status = screen.getByRole("status");
    expect(status).toHaveAttribute("aria-live", "polite");
  });

  it("applies custom className", () => {
    render(<EmptyState title="暂无数据" className="custom-class" />);
    expect(screen.getByRole("status")).toHaveClass("custom-class");
  });

  it("applies animation class when animated", () => {
    render(<EmptyState title="暂无数据" icon="📭" animated={true} />);
    expect(screen.getByText("📭")).toHaveClass("animate-bounce");
  });

  it("does not apply animation when animated is false", () => {
    render(<EmptyState title="暂无数据" icon="📭" animated={false} />);
    expect(screen.getByText("📭")).not.toHaveClass("animate-bounce");
  });
});

describe("EmptyStateCompact", () => {
  it("renders with title", () => {
    render(<EmptyStateCompact title="暂无数据" />);
    expect(screen.getByText("暂无数据")).toBeInTheDocument();
  });

  it("renders with icon", () => {
    render(<EmptyStateCompact title="暂无数据" icon="📭" />);
    expect(screen.getByText("📭")).toBeInTheDocument();
  });

  it("has correct accessibility attributes", () => {
    render(<EmptyStateCompact title="暂无数据" />);
    const status = screen.getByRole("status");
    expect(status).toHaveAttribute("aria-live", "polite");
  });

  it("applies custom className", () => {
    render(<EmptyStateCompact title="暂无数据" className="custom-class" />);
    expect(screen.getByRole("status")).toHaveClass("custom-class");
  });
});
