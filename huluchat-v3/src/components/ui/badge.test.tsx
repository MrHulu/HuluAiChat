import { describe, it, expect } from "vitest"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { Badge, badgeVariants } from "./badge"

describe("Badge", () => {
  describe("rendering", () => {
    it("renders correctly with default props", () => {
      render(<Badge>Badge Text</Badge>)
      const badge = screen.getByText("Badge Text")
      expect(badge).toBeInTheDocument()
      expect(badge).toHaveAttribute("data-slot", "badge")
    })

    it("renders children correctly", () => {
      render(
        <Badge>
          <span>Child 1</span>
          <span>Child 2</span>
        </Badge>
      )
      expect(screen.getByText("Child 1")).toBeInTheDocument()
      expect(screen.getByText("Child 2")).toBeInTheDocument()
    })

    it("applies custom className", () => {
      render(<Badge className="custom-class">Badge</Badge>)
      const badge = screen.getByText("Badge")
      expect(badge).toHaveClass("custom-class")
    })
  })

  describe("variants", () => {
    it("renders default variant", () => {
      render(<Badge variant="default">Default</Badge>)
      const badge = screen.getByText("Default")
      expect(badge).toHaveClass("bg-primary")
      expect(badge).toHaveAttribute("data-variant", "default")
    })

    it("renders secondary variant", () => {
      render(<Badge variant="secondary">Secondary</Badge>)
      const badge = screen.getByText("Secondary")
      expect(badge).toHaveClass("bg-secondary")
      expect(badge).toHaveAttribute("data-variant", "secondary")
    })

    it("renders destructive variant", () => {
      render(<Badge variant="destructive">Destructive</Badge>)
      const badge = screen.getByText("Destructive")
      expect(badge).toHaveClass("bg-destructive")
      expect(badge).toHaveAttribute("data-variant", "destructive")
    })

    it("renders outline variant", () => {
      render(<Badge variant="outline">Outline</Badge>)
      const badge = screen.getByText("Outline")
      expect(badge).toHaveClass("border-input")
      expect(badge).toHaveClass("bg-background")
      expect(badge).toHaveAttribute("data-variant", "outline")
    })

    it("defaults to default variant when variant is not specified", () => {
      render(<Badge>Default</Badge>)
      const badge = screen.getByText("Default")
      expect(badge).toHaveClass("bg-primary")
      expect(badge).not.toHaveAttribute("data-variant") // undefined variant
    })
  })

  describe("styling", () => {
    it("has base classes for layout", () => {
      render(<Badge>Badge</Badge>)
      const badge = screen.getByText("Badge")
      expect(badge).toHaveClass("inline-flex")
      expect(badge).toHaveClass("items-center")
      expect(badge).toHaveClass("rounded-full")
    })

    it("has transition classes", () => {
      render(<Badge>Badge</Badge>)
      const badge = screen.getByText("Badge")
      expect(badge).toHaveClass("transition-all")
      expect(badge).toHaveClass("duration-200")
    })

    it("has hover scale effect", () => {
      render(<Badge>Badge</Badge>)
      const badge = screen.getByText("Badge")
      expect(badge).toHaveClass("hover:scale-105")
    })

    it("has active scale effect", () => {
      render(<Badge>Badge</Badge>)
      const badge = screen.getByText("Badge")
      expect(badge).toHaveClass("active:scale-95")
    })

    it("has focus visible styles", () => {
      render(<Badge>Badge</Badge>)
      const badge = screen.getByText("Badge")
      expect(badge).toHaveClass("focus-visible:outline-none")
      expect(badge).toHaveClass("focus-visible:ring-2")
    })
  })

  describe("interactions", () => {
    it("handles click events", async () => {
      const user = userEvent.setup()
      let clicked = false
      render(<Badge onClick={() => (clicked = true)}>Clickable</Badge>)

      await user.click(screen.getByText("Clickable"))
      expect(clicked).toBe(true)
    })
  })

  describe("badgeVariants utility", () => {
    it("generates default variant classes", () => {
      const classes = badgeVariants()
      expect(classes).toContain("bg-primary")
    })

    it("generates specific variant classes", () => {
      const classes = badgeVariants({ variant: "secondary" })
      expect(classes).toContain("bg-secondary")
    })

    it("merges custom className", () => {
      const classes = badgeVariants({ className: "custom-class" })
      expect(classes).toContain("custom-class")
      expect(classes).toContain("inline-flex")
    })

    it("generates outline variant classes", () => {
      const classes = badgeVariants({ variant: "outline" })
      expect(classes).toContain("border-input")
      expect(classes).toContain("bg-background")
    })

    it("generates destructive variant classes", () => {
      const classes = badgeVariants({ variant: "destructive" })
      expect(classes).toContain("bg-destructive")
    })
  })

  describe("accessibility", () => {
    it("supports aria-label", () => {
      render(<Badge aria-label="Status badge">Active</Badge>)
      const badge = screen.getByLabelText("Status badge")
      expect(badge).toBeInTheDocument()
    })

    it("supports aria-describedby", () => {
      render(
        <>
          <Badge aria-describedby="badge-desc">Important</Badge>
          <span id="badge-desc">This is important</span>
        </>
      )
      const badge = screen.getByText("Important")
      expect(badge).toHaveAttribute("aria-describedby", "badge-desc")
    })

    it("supports role attribute", () => {
      render(<Badge role="status">Loading</Badge>)
      const badge = screen.getByRole("status")
      expect(badge).toBeInTheDocument()
    })

    it("supports data attributes", () => {
      render(<Badge data-testid="custom-badge">Test</Badge>)
      expect(screen.getByTestId("custom-badge")).toBeInTheDocument()
    })
  })

  describe("edge cases", () => {
    it("renders with empty children", () => {
      const { container } = render(<Badge></Badge>)
      expect(container.querySelector('[data-slot="badge"]')).toBeInTheDocument()
    })

    it("renders with null children", () => {
      const { container } = render(<Badge>{null}</Badge>)
      expect(container.querySelector('[data-slot="badge"]')).toBeInTheDocument()
    })

    it("renders with number content", () => {
      render(<Badge>{42}</Badge>)
      expect(screen.getByText("42")).toBeInTheDocument()
    })

    it("merges multiple class names correctly", () => {
      render(<Badge className="class-a class-b">Badge</Badge>)
      const badge = screen.getByText("Badge")
      expect(badge).toHaveClass("class-a")
      expect(badge).toHaveClass("class-b")
    })

    it("handles unknown variant gracefully", () => {
      // @ts-expect-error - testing unknown variant
      render(<Badge variant="unknown">Badge</Badge>)
      const badge = screen.getByText("Badge")
      expect(badge).toBeInTheDocument()
    })
  })

  describe("HTML attributes passthrough", () => {
    it("passes id attribute", () => {
      render(<Badge id="my-badge">Badge</Badge>)
      const badge = screen.getByText("Badge")
      expect(badge).toHaveAttribute("id", "my-badge")
    })

    it("passes title attribute", () => {
      render(<Badge title="Badge tooltip">Badge</Badge>)
      const badge = screen.getByText("Badge")
      expect(badge).toHaveAttribute("title", "Badge tooltip")
    })

    it("passes style attribute", () => {
      render(<Badge style={{ color: "red" }}>Badge</Badge>)
      const badge = screen.getByText("Badge")
      expect(badge).toHaveStyle({ color: "rgb(255, 0, 0)" })
    })

    it("passes onMouseEnter handler", async () => {
      const user = userEvent.setup()
      let entered = false
      render(<Badge onMouseEnter={() => (entered = true)}>Badge</Badge>)

      await user.hover(screen.getByText("Badge"))
      expect(entered).toBe(true)
    })

    it("passes onMouseLeave handler", async () => {
      const user = userEvent.setup()
      let left = false
      render(<Badge onMouseLeave={() => (left = true)}>Badge</Badge>)

      await user.hover(screen.getByText("Badge"))
      await user.unhover(screen.getByText("Badge"))
      expect(left).toBe(true)
    })
  })
})
