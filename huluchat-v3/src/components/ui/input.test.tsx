import { describe, it, expect, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { Input } from "./input"

describe("Input", () => {
  describe("rendering", () => {
    it("renders correctly with default props", () => {
      render(<Input />)
      const input = screen.getByRole("textbox")
      expect(input).toBeInTheDocument()
    })

    it("renders with placeholder text", () => {
      render(<Input placeholder="Enter text" />)
      const input = screen.getByPlaceholderText("Enter text")
      expect(input).toBeInTheDocument()
    })

    it("renders with initial value", () => {
      render(<Input defaultValue="Initial value" />)
      const input = screen.getByDisplayValue("Initial value")
      expect(input).toBeInTheDocument()
    })

    it("applies custom className", () => {
      render(<Input className="custom-class" />)
      const input = screen.getByRole("textbox")
      expect(input).toHaveClass("custom-class")
    })

    it("forwards ref correctly", () => {
      const ref = vi.fn()
      render(<Input ref={ref} />)
      expect(ref).toHaveBeenCalled()
    })
  })

  describe("input types", () => {
    it("renders text input by default", () => {
      render(<Input />)
      const input = screen.getByRole("textbox")
      // Default type is text (implicitly)
      expect(input.tagName).toBe("INPUT")
    })

    it("renders password input", () => {
      render(<Input type="password" placeholder="Password" />)
      const input = screen.getByPlaceholderText("Password")
      expect(input).toHaveAttribute("type", "password")
    })

    it("renders email input", () => {
      render(<Input type="email" />)
      const input = screen.getByRole("textbox")
      expect(input).toHaveAttribute("type", "email")
    })

    it("renders number input", () => {
      render(<Input type="number" />)
      const input = screen.getByRole("spinbutton")
      expect(input).toHaveAttribute("type", "number")
    })

    it("renders search input", () => {
      render(<Input type="search" />)
      const input = screen.getByRole("searchbox")
      expect(input).toHaveAttribute("type", "search")
    })

    it("renders range input", () => {
      render(<Input type="range" />)
      const input = document.querySelector('input[type="range"]')
      expect(input).toBeInTheDocument()
    })
  })

  describe("styling", () => {
    it("has base classes for layout", () => {
      render(<Input />)
      const input = screen.getByRole("textbox")
      expect(input).toHaveClass("flex")
      expect(input).toHaveClass("h-9")
      expect(input).toHaveClass("w-full")
      expect(input).toHaveClass("rounded-md")
      expect(input).toHaveClass("border")
    })

    it("has transition classes", () => {
      render(<Input />)
      const input = screen.getByRole("textbox")
      expect(input).toHaveClass("transition-all")
      expect(input).toHaveClass("duration-200")
    })

    it("has hover classes", () => {
      render(<Input />)
      const input = screen.getByRole("textbox")
      expect(input).toHaveClass("hover:border-muted-foreground/50")
    })

    it("has focus visible classes", () => {
      render(<Input />)
      const input = screen.getByRole("textbox")
      expect(input).toHaveClass("focus-visible:outline-none")
      expect(input).toHaveClass("focus-visible:ring-2")
    })

    it("has range input specific classes", () => {
      render(<Input type="range" />)
      const input = document.querySelector('input[type="range"]')!
      expect(input).toHaveClass("[&[type='range']]:h-2")
    })
  })

  describe("disabled state", () => {
    it("renders disabled input", () => {
      render(<Input disabled />)
      const input = screen.getByRole("textbox")
      expect(input).toBeDisabled()
    })

    it("has disabled styling", () => {
      render(<Input disabled />)
      const input = screen.getByRole("textbox")
      expect(input).toHaveClass("disabled:cursor-not-allowed")
      expect(input).toHaveClass("disabled:opacity-50")
    })
  })

  describe("aria-invalid state", () => {
    it("supports aria-invalid attribute", () => {
      render(<Input aria-invalid="true" />)
      const input = screen.getByRole("textbox")
      expect(input).toHaveAttribute("aria-invalid", "true")
    })

    it("has invalid state styling when aria-invalid is true", () => {
      render(<Input aria-invalid="true" />)
      const input = screen.getByRole("textbox")
      expect(input).toHaveClass("aria-invalid:border-destructive")
    })

    it("applies false aria-invalid as string", () => {
      render(<Input aria-invalid="false" />)
      const input = screen.getByRole("textbox")
      // aria-invalid="false" is passed as-is
      expect(input).toHaveAttribute("aria-invalid", "false")
    })
  })

  describe("aria-errormessage", () => {
    it("sets aria-errormessage when aria-invalid is true", () => {
      render(<Input aria-invalid="true" aria-errormessage="error-msg" />)
      const input = screen.getByRole("textbox")
      expect(input).toHaveAttribute("aria-errormessage", "error-msg")
    })

    it("does not set aria-errormessage when aria-invalid is not provided", () => {
      render(<Input aria-errormessage="error-msg" />)
      const input = screen.getByRole("textbox")
      // aria-errormessage is only set when aria-invalid is truthy
      expect(input).not.toHaveAttribute("aria-errormessage")
    })
  })

  describe("interactions", () => {
    it("handles text input", async () => {
      const user = userEvent.setup()
      render(<Input />)
      const input = screen.getByRole("textbox")

      await user.type(input, "Hello World")
      expect(input).toHaveValue("Hello World")
    })

    it("handles onChange event", async () => {
      const user = userEvent.setup()
      const handleChange = vi.fn()
      render(<Input onChange={handleChange} />)

      await user.type(screen.getByRole("textbox"), "test")
      expect(handleChange).toHaveBeenCalled()
    })

    it("handles focus and blur events", async () => {
      const user = userEvent.setup()
      const handleFocus = vi.fn()
      const handleBlur = vi.fn()
      render(<Input onFocus={handleFocus} onBlur={handleBlur} />)

      const input = screen.getByRole("textbox")
      await user.click(input)
      expect(handleFocus).toHaveBeenCalled()

      await user.tab()
      expect(handleBlur).toHaveBeenCalled()
    })

    it("does not accept input when disabled", async () => {
      const user = userEvent.setup()
      render(<Input disabled />)
      const input = screen.getByRole("textbox")

      expect(input).toBeDisabled()
      await user.click(input)
      // Should not throw or type
    })
  })

  describe("accessibility", () => {
    it("supports aria-label", () => {
      render(<Input aria-label="Search" />)
      const input = screen.getByLabelText("Search")
      expect(input).toBeInTheDocument()
    })

    it("supports aria-labelledby", () => {
      render(
        <>
          <label id="name-label">Name</label>
          <Input aria-labelledby="name-label" />
        </>
      )
      const input = screen.getByLabelText("Name")
      expect(input).toBeInTheDocument()
    })

    it("supports aria-describedby", () => {
      render(
        <>
          <Input aria-describedby="input-hint" />
          <span id="input-hint">Enter your name</span>
        </>
      )
      const input = screen.getByRole("textbox")
      expect(input).toHaveAttribute("aria-describedby", "input-hint")
    })

    it("supports required attribute", () => {
      render(<Input required />)
      const input = screen.getByRole("textbox")
      expect(input).toBeRequired()
    })

    it("supports readOnly attribute", () => {
      render(<Input readOnly />)
      const input = screen.getByRole("textbox")
      expect(input).toHaveAttribute("readonly")
    })
  })

  describe("HTML attributes passthrough", () => {
    it("passes id attribute", () => {
      render(<Input id="my-input" />)
      const input = screen.getByRole("textbox")
      expect(input).toHaveAttribute("id", "my-input")
    })

    it("passes name attribute", () => {
      render(<Input name="username" />)
      const input = screen.getByRole("textbox")
      expect(input).toHaveAttribute("name", "username")
    })

    it("passes maxLength attribute", () => {
      render(<Input maxLength={10} />)
      const input = screen.getByRole("textbox")
      expect(input).toHaveAttribute("maxlength", "10")
    })

    it("passes min and max for number input", () => {
      render(<Input type="number" min={0} max={100} />)
      const input = screen.getByRole("spinbutton")
      expect(input).toHaveAttribute("min", "0")
      expect(input).toHaveAttribute("max", "100")
    })

    it("passes step for number input", () => {
      render(<Input type="number" step={5} />)
      const input = screen.getByRole("spinbutton")
      expect(input).toHaveAttribute("step", "5")
    })

    it("passes autoComplete attribute", () => {
      render(<Input autoComplete="email" />)
      const input = screen.getByRole("textbox")
      expect(input).toHaveAttribute("autocomplete", "email")
    })

    it("passes autoFocus attribute", () => {
      render(<Input autoFocus />)
      const input = screen.getByRole("textbox")
      expect(input).toHaveFocus()
    })

    it("passes pattern attribute", () => {
      render(<Input pattern="[0-9]*" />)
      const input = screen.getByRole("textbox")
      expect(input).toHaveAttribute("pattern", "[0-9]*")
    })
  })

  describe("file input", () => {
    it("renders file input", () => {
      render(<Input type="file" />)
      const input = document.querySelector('input[type="file"]')
      expect(input).toBeInTheDocument()
    })

    it("has file input styling", () => {
      render(<Input type="file" />)
      const input = document.querySelector('input[type="file"]')!
      expect(input).toHaveClass("file:border-0")
      expect(input).toHaveClass("file:bg-transparent")
    })

    it("accepts multiple files", () => {
      render(<Input type="file" multiple />)
      const input = document.querySelector('input[type="file"]')!
      expect(input).toHaveAttribute("multiple")
    })
  })

  describe("edge cases", () => {
    it("handles empty string value", () => {
      render(<Input value="" onChange={() => {}} />)
      const input = screen.getByRole("textbox")
      expect(input).toHaveValue("")
    })

    it("handles long text input", () => {
      // Test controlled input with long text
      const longText = "a".repeat(100)
      render(<Input value={longText} onChange={() => {}} />)
      const input = screen.getByRole("textbox")
      expect(input).toHaveValue(longText)
    })

    it("handles special characters in controlled input", () => {
      const specialChars = "!@#$%^&*()"
      render(<Input value={specialChars} onChange={() => {}} />)
      const input = screen.getByRole("textbox")
      expect(input).toHaveValue(specialChars)
    })

    it("handles unicode characters in controlled input", () => {
      const unicodeText = "你好世界"
      render(<Input value={unicodeText} onChange={() => {}} />)
      const input = screen.getByRole("textbox")
      expect(input).toHaveValue(unicodeText)
    })

    it("handles emoji in controlled input", () => {
      const emojiText = "😀🎉"
      render(<Input value={emojiText} onChange={() => {}} />)
      const input = screen.getByRole("textbox")
      expect(input).toHaveValue(emojiText)
    })
  })
})
