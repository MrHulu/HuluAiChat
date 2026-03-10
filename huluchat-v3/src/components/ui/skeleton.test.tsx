import { describe, it, expect } from "vitest"
import { render, screen } from "@testing-library/react"
import {
  Skeleton,
  SkeletonText,
  SkeletonAvatar,
  SkeletonMessage,
  SkeletonSessionItem,
  SkeletonCard,
} from "./skeleton"

describe("Skeleton", () => {
  describe("Rendering", () => {
    it("renders correctly", () => {
      render(<Skeleton />)
      const skeleton = screen.getByRole("status")
      expect(skeleton).toBeInTheDocument()
    })

    it("renders with default animate prop", () => {
      render(<Skeleton />)
      const skeleton = screen.getByRole("status")
      expect(skeleton).toHaveClass("animate-shimmer")
    })

    it("renders without animation when animate is false", () => {
      render(<Skeleton animate={false} />)
      const skeleton = screen.getByRole("status")
      expect(skeleton).not.toHaveClass("animate-shimmer")
    })

    it("renders with custom className", () => {
      render(<Skeleton className="h-4 w-full" />)
      const skeleton = screen.getByRole("status")
      expect(skeleton).toHaveClass("h-4")
      expect(skeleton).toHaveClass("w-full")
    })

    it("has role='status'", () => {
      render(<Skeleton />)
      const skeleton = screen.getByRole("status")
      expect(skeleton).toHaveAttribute("role", "status")
    })

    it("has aria-busy='true'", () => {
      render(<Skeleton />)
      const skeleton = screen.getByRole("status")
      expect(skeleton).toHaveAttribute("aria-busy", "true")
    })

    it("has aria-label='Loading'", () => {
      render(<Skeleton />)
      const skeleton = screen.getByRole("status")
      expect(skeleton).toHaveAttribute("aria-label", "Loading")
    })
  })

  describe("Styling", () => {
    it("applies default styling classes", () => {
      render(<Skeleton />)
      const skeleton = screen.getByRole("status")
      expect(skeleton).toHaveClass("rounded-md")
      expect(skeleton).toHaveClass("bg-muted")
    })

    it("applies dark mode classes", () => {
      render(<Skeleton />)
      const skeleton = screen.getByRole("status")
      expect(skeleton).toHaveClass("dark:bg-muted/40")
      expect(skeleton).toHaveClass("dark:border")
      expect(skeleton).toHaveClass("dark:border-white/5")
    })

    it("applies animation class when animate is true", () => {
      render(<Skeleton animate={true} />)
      const skeleton = screen.getByRole("status")
      expect(skeleton).toHaveClass("animate-shimmer")
    })
  })

  describe("Accessibility", () => {
    it("has screen reader text", () => {
      render(<Skeleton />)
      const srOnly = screen.getByText("Loading...")
      expect(srOnly).toBeInTheDocument()
      expect(srOnly).toHaveClass("sr-only")
    })
  })
})

describe("SkeletonText", () => {
  describe("Rendering", () => {
    it("renders correctly with default lines", () => {
      render(<SkeletonText />)
      const statuses = screen.getAllByRole("status")
      // Default is 3 lines
      expect(statuses).toHaveLength(3)
    })

    it("renders with custom number of lines", () => {
      render(<SkeletonText lines={5} />)
      const statuses = screen.getAllByRole("status")
      expect(statuses).toHaveLength(5)
    })

    it("renders with custom className", () => {
      const { container } = render(<SkeletonText className="my-4" />)
      const wrapper = container.querySelector(".space-y-2")
      expect(wrapper).toHaveClass("my-4")
    })

    it("applies space-y-2 class by default", () => {
      const { container } = render(<SkeletonText />)
      const wrapper = container.querySelector(".space-y-2")
      expect(wrapper).toBeInTheDocument()
    })
  })

  describe("Line Styling", () => {
    it("applies animation delay to each line", () => {
      const { container } = render(<SkeletonText lines={3} />)
      const lines = container.querySelectorAll(".animate-fade-in")

      expect(lines[0]).toHaveStyle({ animationDelay: "0ms" })
      expect(lines[1]).toHaveStyle({ animationDelay: "50ms" })
      expect(lines[2]).toHaveStyle({ animationDelay: "100ms" })
    })

    it("last line has reduced width", () => {
      const { container } = render(<SkeletonText lines={3} />)
      const lines = container.querySelectorAll(".animate-fade-in")
      const lastLineSkeleton = lines[2].querySelector('[role="status"]')

      expect(lastLineSkeleton).toHaveClass("w-3/4")
    })

    it("non-last lines have full width", () => {
      const { container } = render(<SkeletonText lines={3} />)
      const lines = container.querySelectorAll(".animate-fade-in")
      const firstLineSkeleton = lines[0].querySelector('[role="status"]')

      expect(firstLineSkeleton).toHaveClass("w-full")
    })
  })
})

describe("SkeletonAvatar", () => {
  describe("Rendering", () => {
    it("renders correctly", () => {
      render(<SkeletonAvatar />)
      const skeleton = screen.getByRole("status")
      expect(skeleton).toBeInTheDocument()
    })

    it("renders with default size (md)", () => {
      render(<SkeletonAvatar />)
      const skeleton = screen.getByRole("status")
      expect(skeleton).toHaveClass("h-10")
      expect(skeleton).toHaveClass("w-10")
    })

    it("renders with sm size", () => {
      render(<SkeletonAvatar size="sm" />)
      const skeleton = screen.getByRole("status")
      expect(skeleton).toHaveClass("h-8")
      expect(skeleton).toHaveClass("w-8")
    })

    it("renders with lg size", () => {
      render(<SkeletonAvatar size="lg" />)
      const skeleton = screen.getByRole("status")
      expect(skeleton).toHaveClass("h-12")
      expect(skeleton).toHaveClass("w-12")
    })

    it("renders with custom className", () => {
      render(<SkeletonAvatar className="mt-2" />)
      const skeleton = screen.getByRole("status")
      expect(skeleton).toHaveClass("mt-2")
    })
  })

  describe("Styling", () => {
    it("has rounded-full class", () => {
      render(<SkeletonAvatar />)
      const skeleton = screen.getByRole("status")
      expect(skeleton).toHaveClass("rounded-full")
    })
  })
})

describe("SkeletonMessage", () => {
  describe("Rendering", () => {
    it("renders correctly", () => {
      render(<SkeletonMessage />)
      const statuses = screen.getAllByRole("status")
      expect(statuses.length).toBeGreaterThan(0)
    })

    it("renders with custom className", () => {
      const { container } = render(<SkeletonMessage className="bg-muted" />)
      const wrapper = container.querySelector(".bg-muted")
      expect(wrapper).toBeInTheDocument()
    })
  })

  describe("Layout", () => {
    it("has avatar section", () => {
      const { container } = render(<SkeletonMessage />)
      const avatar = container.querySelector(".rounded-full")
      expect(avatar).toBeInTheDocument()
    })

    it("has text content section", () => {
      render(<SkeletonMessage />)
      const statuses = screen.getAllByRole("status")
      // Should have multiple skeleton elements (avatar + text lines)
      expect(statuses.length).toBeGreaterThanOrEqual(3)
    })
  })
})

describe("SkeletonSessionItem", () => {
  describe("Rendering", () => {
    it("renders correctly", () => {
      render(<SkeletonSessionItem />)
      const statuses = screen.getAllByRole("status")
      expect(statuses).toHaveLength(2)
    })

    it("renders with custom className", () => {
      render(<SkeletonSessionItem className="bg-muted" />)
      const container = screen.getAllByRole("status")[0].closest(".bg-muted")
      expect(container).toBeInTheDocument()
    })
  })

  describe("Layout", () => {
    it("has padding class", () => {
      render(<SkeletonSessionItem />)
      const container = screen.getAllByRole("status")[0].parentElement
      expect(container).toHaveClass("p-3")
    })

    it("has spacing class", () => {
      render(<SkeletonSessionItem />)
      const container = screen.getAllByRole("status")[0].parentElement
      expect(container).toHaveClass("space-y-2")
    })

    it("first skeleton has 3/4 width", () => {
      render(<SkeletonSessionItem />)
      const statuses = screen.getAllByRole("status")
      expect(statuses[0]).toHaveClass("w-3/4")
    })

    it("second skeleton has 1/2 width", () => {
      render(<SkeletonSessionItem />)
      const statuses = screen.getAllByRole("status")
      expect(statuses[1]).toHaveClass("w-1/2")
    })
  })
})

describe("SkeletonCard", () => {
  describe("Rendering", () => {
    it("renders correctly", () => {
      render(<SkeletonCard />)
      const statuses = screen.getAllByRole("status")
      expect(statuses.length).toBeGreaterThan(0)
    })

    it("renders with custom className", () => {
      render(<SkeletonCard className="w-80" />)
      const container = screen.getAllByRole("status")[0].closest(".w-80")
      expect(container).toBeInTheDocument()
    })
  })

  describe("Layout", () => {
    it("has card styling classes", () => {
      render(<SkeletonCard />)
      const statuses = screen.getAllByRole("status")
      const container = statuses[0].closest(".rounded-lg")
      expect(container).toBeInTheDocument()
      expect(container).toHaveClass("border")
      expect(container).toHaveClass("p-4")
    })

    it("has dark mode styling", () => {
      render(<SkeletonCard />)
      const statuses = screen.getAllByRole("status")
      const container = statuses[0].closest(".rounded-lg")
      expect(container).toHaveClass("dark:border-white/10")
    })

    it("has button placeholders", () => {
      render(<SkeletonCard />)
      const statuses = screen.getAllByRole("status")
      // Title + text lines + 2 buttons
      expect(statuses.length).toBeGreaterThanOrEqual(5)
    })
  })
})
