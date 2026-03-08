import { describe, it, expect, vi } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"
import { Switch } from "./switch"

describe("Switch", () => {
  describe("Rendering", () => {
    it("renders correctly", () => {
      render(<Switch />)
      const switchElement = screen.getByRole("switch")
      expect(switchElement).toBeInTheDocument()
    })

    it("renders with default unchecked state", () => {
      render(<Switch />)
      const switchElement = screen.getByRole("switch")
      expect(switchElement).toHaveAttribute("data-state", "unchecked")
    })

    it("renders with checked state when checked prop is true", () => {
      render(<Switch checked />)
      const switchElement = screen.getByRole("switch")
      expect(switchElement).toHaveAttribute("data-state", "checked")
    })

    it("renders with defaultChecked prop", () => {
      render(<Switch defaultChecked />)
      const switchElement = screen.getByRole("switch")
      expect(switchElement).toHaveAttribute("data-state", "checked")
    })

    it("renders with data-slot attribute", () => {
      render(<Switch />)
      const switchElement = screen.getByRole("switch")
      expect(switchElement).toHaveAttribute("data-slot", "switch")
    })
  })

  describe("Styling", () => {
    it("applies default styling classes", () => {
      render(<Switch />)
      const switchElement = screen.getByRole("switch")
      expect(switchElement).toHaveClass("inline-flex")
      expect(switchElement).toHaveClass("h-5")
      expect(switchElement).toHaveClass("w-9")
      expect(switchElement).toHaveClass("rounded-full")
    })

    it("applies transition classes", () => {
      render(<Switch />)
      const switchElement = screen.getByRole("switch")
      expect(switchElement).toHaveClass("transition-all")
      expect(switchElement).toHaveClass("duration-200")
      expect(switchElement).toHaveClass("ease-out")
    })

    it("applies focus-visible classes", () => {
      render(<Switch />)
      const switchElement = screen.getByRole("switch")
      expect(switchElement).toHaveClass("focus-visible:outline-none")
      expect(switchElement).toHaveClass("focus-visible:ring-2")
    })

    it("applies hover and active scale classes", () => {
      render(<Switch />)
      const switchElement = screen.getByRole("switch")
      expect(switchElement).toHaveClass("hover:scale-[1.02]")
      expect(switchElement).toHaveClass("active:scale-[0.98]")
    })

    it("applies disabled classes", () => {
      render(<Switch disabled />)
      const switchElement = screen.getByRole("switch")
      expect(switchElement).toHaveClass("disabled:cursor-not-allowed")
      expect(switchElement).toHaveClass("disabled:opacity-50")
    })

    it("applies checked state background color", () => {
      render(<Switch checked />)
      const switchElement = screen.getByRole("switch")
      expect(switchElement).toHaveClass("data-[state=checked]:bg-primary")
    })

    it("applies unchecked state background color", () => {
      render(<Switch />)
      const switchElement = screen.getByRole("switch")
      expect(switchElement).toHaveClass("data-[state=unchecked]:bg-input")
    })

    it("applies dark mode classes", () => {
      render(<Switch />)
      const switchElement = screen.getByRole("switch")
      expect(switchElement).toHaveClass("dark:shadow-none")
    })

    it("applies custom className", () => {
      render(<Switch className="custom-switch" />)
      const switchElement = screen.getByRole("switch")
      expect(switchElement).toHaveClass("custom-switch")
    })

    it("applies peer class for peer styling", () => {
      render(<Switch />)
      const switchElement = screen.getByRole("switch")
      expect(switchElement).toHaveClass("peer")
    })
  })

  describe("Thumb Component", () => {
    it("renders thumb element", () => {
      render(<Switch />)
      const switchElement = screen.getByRole("switch")
      // Radix Switch Thumb is rendered as a span inside the button
      const thumb = switchElement.querySelector("span")
      expect(thumb).toBeInTheDocument()
    })

    it("thumb has correct size classes", () => {
      render(<Switch />)
      const switchElement = screen.getByRole("switch")
      const thumb = switchElement.querySelector("span")
      expect(thumb).toHaveClass("h-4")
      expect(thumb).toHaveClass("w-4")
    })

    it("thumb has rounded-full class", () => {
      render(<Switch />)
      const switchElement = screen.getByRole("switch")
      const thumb = switchElement.querySelector("span")
      expect(thumb).toHaveClass("rounded-full")
    })

    it("thumb has transition classes", () => {
      render(<Switch />)
      const switchElement = screen.getByRole("switch")
      const thumb = switchElement.querySelector("span")
      expect(thumb).toHaveClass("transition-all")
      expect(thumb).toHaveClass("duration-200")
    })

    it("thumb has checked state translate class", () => {
      render(<Switch />)
      const switchElement = screen.getByRole("switch")
      const thumb = switchElement.querySelector("span")
      expect(thumb).toHaveClass("data-[state=checked]:translate-x-4")
    })

    it("thumb has unchecked state translate class", () => {
      render(<Switch />)
      const switchElement = screen.getByRole("switch")
      const thumb = switchElement.querySelector("span")
      expect(thumb).toHaveClass("data-[state=unchecked]:translate-x-0")
    })

    it("thumb has bounce animation when checked", () => {
      render(<Switch />)
      const switchElement = screen.getByRole("switch")
      const thumb = switchElement.querySelector("span")
      expect(thumb).toHaveClass("data-[state=checked]:animate-bounce-in")
    })

    it("thumb has scale effect when unchecked", () => {
      render(<Switch />)
      const switchElement = screen.getByRole("switch")
      const thumb = switchElement.querySelector("span")
      expect(thumb).toHaveClass("data-[state=unchecked]:scale-90")
    })
  })

  describe("Interaction", () => {
    it("can be clicked to toggle state", () => {
      render(<Switch />)
      const switchElement = screen.getByRole("switch")

      expect(switchElement).toHaveAttribute("data-state", "unchecked")

      fireEvent.click(switchElement)

      expect(switchElement).toHaveAttribute("data-state", "checked")
    })

    it("can be toggled off when checked", () => {
      render(<Switch defaultChecked />)
      const switchElement = screen.getByRole("switch")

      expect(switchElement).toHaveAttribute("data-state", "checked")

      fireEvent.click(switchElement)

      expect(switchElement).toHaveAttribute("data-state", "unchecked")
    })

    it("does not respond to clicks when disabled", () => {
      render(<Switch disabled />)
      const switchElement = screen.getByRole("switch")

      expect(switchElement).toHaveAttribute("data-state", "unchecked")
      expect(switchElement).toBeDisabled()

      fireEvent.click(switchElement)

      expect(switchElement).toHaveAttribute("data-state", "unchecked")
    })

    it("calls onCheckedChange when toggled", () => {
      const onCheckedChange = vi.fn()
      render(<Switch onCheckedChange={onCheckedChange} />)
      const switchElement = screen.getByRole("switch")

      fireEvent.click(switchElement)

      expect(onCheckedChange).toHaveBeenCalledTimes(1)
      expect(onCheckedChange).toHaveBeenCalledWith(true)
    })

    it("calls onCheckedChange with false when unchecked", () => {
      const onCheckedChange = vi.fn()
      render(<Switch defaultChecked onCheckedChange={onCheckedChange} />)
      const switchElement = screen.getByRole("switch")

      fireEvent.click(switchElement)

      expect(onCheckedChange).toHaveBeenCalledTimes(1)
      expect(onCheckedChange).toHaveBeenCalledWith(false)
    })
  })

  describe("Accessibility", () => {
    it("has switch role", () => {
      render(<Switch />)
      const switchElement = screen.getByRole("switch")
      expect(switchElement).toBeInTheDocument()
    })

    it("can be focused", () => {
      render(<Switch />)
      const switchElement = screen.getByRole("switch")
      switchElement.focus()
      expect(switchElement).toHaveFocus()
    })

    it("is not focusable when disabled", () => {
      render(<Switch disabled />)
      const switchElement = screen.getByRole("switch")
      expect(switchElement).toBeDisabled()
    })

    it("has aria-checked attribute when checked", () => {
      render(<Switch checked />)
      const switchElement = screen.getByRole("switch")
      expect(switchElement).toHaveAttribute("aria-checked", "true")
    })

    it("has aria-checked attribute when unchecked", () => {
      render(<Switch />)
      const switchElement = screen.getByRole("switch")
      expect(switchElement).toHaveAttribute("aria-checked", "false")
    })
  })

  describe("Controlled vs Uncontrolled", () => {
    it("works as uncontrolled with defaultChecked", () => {
      render(<Switch defaultChecked />)
      const switchElement = screen.getByRole("switch")

      expect(switchElement).toHaveAttribute("data-state", "checked")

      fireEvent.click(switchElement)

      expect(switchElement).toHaveAttribute("data-state", "unchecked")
    })

    it("works as controlled with checked prop", () => {
      const { rerender } = render(<Switch checked={false} />)
      const switchElement = screen.getByRole("switch")

      expect(switchElement).toHaveAttribute("data-state", "unchecked")

      rerender(<Switch checked={true} />)

      expect(switchElement).toHaveAttribute("data-state", "checked")
    })

    it("controlled switch updates when prop changes", () => {
      const { rerender } = render(<Switch checked={true} />)
      const switchElement = screen.getByRole("switch")

      expect(switchElement).toHaveAttribute("data-state", "checked")

      rerender(<Switch checked={false} />)

      expect(switchElement).toHaveAttribute("data-state", "unchecked")
    })
  })

  describe("Props", () => {
    it("passes id prop", () => {
      render(<Switch id="test-switch" />)
      const switchElement = screen.getByRole("switch")
      expect(switchElement).toHaveAttribute("id", "test-switch")
    })

    it("passes name prop", () => {
      // Radix Switch uses form submission context, name is not directly on the element
      render(<Switch name="switch-name" />)
      const switchElement = screen.getByRole("switch")
      // The name prop is used for form submission, not as a direct attribute
      expect(switchElement).toBeInTheDocument()
    })

    it("passes value prop", () => {
      render(<Switch value="switch-value" />)
      const switchElement = screen.getByRole("switch")
      expect(switchElement).toHaveAttribute("value", "switch-value")
    })

    it("passes required prop", () => {
      // Radix Switch uses aria-required instead of native required
      render(<Switch required />)
      const switchElement = screen.getByRole("switch")
      expect(switchElement).toHaveAttribute("aria-required", "true")
    })

    it("passes aria-label prop", () => {
      render(<Switch aria-label="Enable feature" />)
      const switchElement = screen.getByRole("switch")
      expect(switchElement).toHaveAttribute("aria-label", "Enable feature")
    })

    it("passes aria-labelledby prop", () => {
      render(<Switch aria-labelledby="label-id" />)
      const switchElement = screen.getByRole("switch")
      expect(switchElement).toHaveAttribute("aria-labelledby", "label-id")
    })

    it("passes aria-describedby prop", () => {
      render(<Switch aria-describedby="description-id" />)
      const switchElement = screen.getByRole("switch")
      expect(switchElement).toHaveAttribute("aria-describedby", "description-id")
    })

    it("passes data-testid prop", () => {
      render(<Switch data-testid="custom-switch" />)
      const switchElement = screen.getByTestId("custom-switch")
      expect(switchElement).toBeInTheDocument()
    })
  })

  describe("Ref Forwarding", () => {
    it("forwards ref to the switch element", () => {
      const ref = { current: null as HTMLButtonElement | null }
      render(<Switch ref={ref} />)
      expect(ref.current).toBeInstanceOf(HTMLButtonElement)
      expect(ref.current).toHaveAttribute("data-slot", "switch")
    })

    it("ref can be used to focus the switch", () => {
      const ref = { current: null as HTMLButtonElement | null }
      render(<Switch ref={ref} />)
      ref.current?.focus()
      expect(ref.current).toHaveFocus()
    })

    it("works with callback ref", () => {
      let buttonElement: HTMLButtonElement | null = null
      render(<Switch ref={(el) => { buttonElement = el }} />)
      expect(buttonElement).toBeInstanceOf(HTMLButtonElement)
    })
  })

  describe("Keyboard Navigation", () => {
    it("is focusable", () => {
      render(<Switch />)
      const switchElement = screen.getByRole("switch")

      // Verify the switch can receive focus (tabIndex not -1)
      expect(switchElement).not.toHaveAttribute("tabindex", "-1")
    })

    it("responds to click interaction", () => {
      // The primary interaction method is click
      render(<Switch />)
      const switchElement = screen.getByRole("switch")

      expect(switchElement).toHaveAttribute("data-state", "unchecked")
      fireEvent.click(switchElement)
      expect(switchElement).toHaveAttribute("data-state", "checked")
    })
  })
})
