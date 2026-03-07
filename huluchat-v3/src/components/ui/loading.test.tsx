/**
 * Loading Component Tests
 */
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Loading, LoadingOverlay, LoadingInline } from "./loading";

describe("Loading", () => {
  it("should render spinner by default", () => {
    render(<Loading />);
    expect(document.querySelector(".animate-spin")).toBeInTheDocument();
  });

  it("should render dots variant", () => {
    render(<Loading variant="dots" />);
    const dots = document.querySelectorAll(".animate-bounce");
    expect(dots).toHaveLength(3);
  });

  it("should render pulse variant", () => {
    render(<Loading variant="pulse" />);
    expect(document.querySelector(".animate-ping")).toBeInTheDocument();
    expect(document.querySelector(".animate-pulse")).toBeInTheDocument();
  });

  it("should render ring variant", () => {
    render(<Loading variant="ring" />);
    expect(document.querySelector(".animate-spin")).toBeInTheDocument();
  });

  it("should render text when provided", () => {
    render(<Loading text="Loading..." />);
    expect(screen.getByText("Loading...")).toBeInTheDocument();
  });

  it("should apply size classes", () => {
    const { container } = render(<Loading size="lg" />);
    expect(container.querySelector(".w-8")).toBeInTheDocument();
  });

  it("should apply custom className", () => {
    const { container } = render(<Loading className="custom-class" />);
    expect(container.querySelector(".custom-class")).toBeInTheDocument();
  });

  it("should center content when center prop is true", () => {
    const { container } = render(<Loading center />);
    expect(container.querySelector(".justify-center")).toBeInTheDocument();
  });
});

describe("LoadingOverlay", () => {
  it("should render as fixed overlay", () => {
    render(<LoadingOverlay />);
    expect(document.querySelector(".fixed.inset-0")).toBeInTheDocument();
  });

  it("should render text when provided", () => {
    render(<LoadingOverlay text="Please wait..." />);
    expect(screen.getByText("Please wait...")).toBeInTheDocument();
  });
});

describe("LoadingInline", () => {
  it("should render small spinner", () => {
    render(<LoadingInline />);
    expect(document.querySelector(".w-4")).toBeInTheDocument();
  });

  it("should apply custom className", () => {
    const { container } = render(<LoadingInline className="ml-2" />);
    expect(container.querySelector(".ml-2")).toBeInTheDocument();
  });
});
