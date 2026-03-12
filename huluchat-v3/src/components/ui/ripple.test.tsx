import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, fireEvent, act } from "@testing-library/react";
import { Ripple } from "./ripple";

describe("Ripple", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("should render without crashing", () => {
    const { container } = render(<Ripple />);

    expect(container.firstChild).toBeInTheDocument();
  });

  it("should have correct default className", () => {
    const { container } = render(<Ripple />);

    const rippleContainer = container.firstChild as HTMLElement;
    expect(rippleContainer).toHaveClass("pointer-events-none");
    expect(rippleContainer).toHaveClass("absolute");
    expect(rippleContainer).toHaveClass("inset-0");
    expect(rippleContainer).toHaveClass("overflow-hidden");
  });

  it("should merge custom className", () => {
    const { container } = render(<Ripple className="custom-class" />);

    const rippleContainer = container.firstChild as HTMLElement;
    expect(rippleContainer).toHaveClass("custom-class");
    expect(rippleContainer).toHaveClass("pointer-events-none");
  });

  it("should create ripple on mouse down", async () => {
    const { container } = render(<Ripple />);

    const rippleContainer = container.firstChild as HTMLElement;

    // Simulate mouse down event
    fireEvent.mouseDown(rippleContainer, {
      clientX: 50,
      clientY: 50,
    });

    // Should have created a ripple element
    const ripple = container.querySelector(".animate-ripple");
    expect(ripple).toBeInTheDocument();
  });

  it("should apply custom color to ripple", async () => {
    const customColor = "rgba(255, 0, 0, 0.5)";
    const { container } = render(<Ripple color={customColor} />);

    const rippleContainer = container.firstChild as HTMLElement;

    fireEvent.mouseDown(rippleContainer, {
      clientX: 50,
      clientY: 50,
    });

    const ripple = container.querySelector(".animate-ripple") as HTMLElement;
    expect(ripple).toHaveStyle({ backgroundColor: customColor });
  });

  it("should remove ripple after animation duration", async () => {
    const duration = 600;
    const { container } = render(<Ripple duration={duration} />);

    const rippleContainer = container.firstChild as HTMLElement;

    fireEvent.mouseDown(rippleContainer, {
      clientX: 50,
      clientY: 50,
    });

    // Ripple should exist
    expect(container.querySelector(".animate-ripple")).toBeInTheDocument();

    // Advance timers past duration
    await act(async () => {
      vi.advanceTimersByTime(duration + 100);
    });

    // Ripple should be removed
    expect(container.querySelector(".animate-ripple")).not.toBeInTheDocument();
  });

  it("should handle multiple rapid clicks", async () => {
    const { container } = render(<Ripple />);

    const rippleContainer = container.firstChild as HTMLElement;

    // Click multiple times rapidly
    fireEvent.mouseDown(rippleContainer, { clientX: 10, clientY: 10 });
    fireEvent.mouseDown(rippleContainer, { clientX: 20, clientY: 20 });
    fireEvent.mouseDown(rippleContainer, { clientX: 30, clientY: 30 });

    // Should have multiple ripples
    const ripples = container.querySelectorAll(".animate-ripple");
    expect(ripples.length).toBe(3);
  });

  it("should have aria-hidden attribute", () => {
    const { container } = render(<Ripple />);

    const rippleContainer = container.firstChild as HTMLElement;
    expect(rippleContainer).toHaveAttribute("aria-hidden", "true");
  });

  it("should have rounded-inherit class", () => {
    const { container } = render(<Ripple />);

    const rippleContainer = container.firstChild as HTMLElement;
    expect(rippleContainer).toHaveClass("rounded-inherit");
  });

  it("should use custom duration", async () => {
    const customDuration = 1000;
    const { container } = render(<Ripple duration={customDuration} />);

    const rippleContainer = container.firstChild as HTMLElement;

    fireEvent.mouseDown(rippleContainer, {
      clientX: 50,
      clientY: 50,
    });

    const ripple = container.querySelector(".animate-ripple") as HTMLElement;
    expect(ripple).toHaveStyle({ animationDuration: `${customDuration}ms` });
  });

  it("should create ripple element with rounded-full class", async () => {
    const { container } = render(<Ripple />);

    const rippleContainer = container.firstChild as HTMLElement;

    fireEvent.mouseDown(rippleContainer, {
      clientX: 50,
      clientY: 50,
    });

    const ripple = container.querySelector(".animate-ripple") as HTMLElement;
    // Check that the ripple has the rounded-full class for circular shape
    expect(ripple).toHaveClass("rounded-full");
  });
});
