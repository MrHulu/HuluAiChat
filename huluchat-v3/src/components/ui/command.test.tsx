import { describe, it, expect, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import React from "react"

// Mock lucide-react SearchIcon
vi.mock("lucide-react", () => ({
  SearchIcon: () => <svg data-testid="search-icon" aria-hidden="true" />,
}))

// Mock cmdk module
vi.mock("cmdk", () => {
  const React = require("react")

  // Create base Command component
  const CommandBase = React.forwardRef<
    HTMLDivElement,
    { children?: React.ReactNode; className?: string }
  >(({ children, className, ...props }, ref) => (
    <div ref={ref} className={className} data-testid="command" {...props}>
      {children}
    </div>
  ))

  // Add static sub-components
  CommandBase.Input = React.forwardRef<
    HTMLInputElement,
    { children?: React.ReactNode; className?: string; placeholder?: string }
  >(({ className, placeholder, ...props }, ref) => (
    <input
      ref={ref}
      className={className}
      placeholder={placeholder}
      data-testid="command-input-primitive"
      {...props}
    />
  ))

  CommandBase.List = React.forwardRef<
    HTMLDivElement,
    { children?: React.ReactNode; className?: string }
  >(({ children, className, ...props }, ref) => (
    <div ref={ref} className={className} data-slot="command-list" {...props}>
      {children}
    </div>
  ))

  CommandBase.Empty = React.forwardRef<
    HTMLDivElement,
    { children?: React.ReactNode; className?: string }
  >(({ children, className, ...props }, ref) => (
    <div ref={ref} className={className} data-slot="command-empty" {...props}>
      {children}
    </div>
  ))

  CommandBase.Group = React.forwardRef<
    HTMLDivElement,
    { children?: React.ReactNode; className?: string; heading?: string }
  >(({ children, className, heading, ...props }, ref) => (
    <div ref={ref} className={className} data-slot="command-group" {...props}>
      {heading && <div data-testid="group-heading">{heading}</div>}
      {children}
    </div>
  ))

  CommandBase.Item = React.forwardRef<
    HTMLDivElement,
    {
      children?: React.ReactNode
      className?: string
      disabled?: boolean
      selected?: boolean
      onSelect?: () => void
    }
  >(({ children, className, disabled, selected, onSelect, ...props }, ref) => (
    <div
      ref={ref}
      className={className}
      data-slot="command-item"
      data-disabled={disabled}
      data-selected={selected}
      onClick={onSelect}
      {...props}
    >
      {children}
    </div>
  ))

  CommandBase.Separator = React.forwardRef<
    HTMLDivElement,
    { className?: string }
  >(({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={className}
      data-testid="command-separator"
      data-slot="command-separator"
      {...props}
    />
  ))

  return { Command: CommandBase }
})

// Re-import after mock
import {
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandShortcut,
  CommandSeparator,
} from "./command"

describe("Command", () => {
  it("renders correctly", () => {
    render(<Command>Test Command</Command>)
    expect(screen.getByTestId("command")).toBeInTheDocument()
    expect(screen.getByText("Test Command")).toBeInTheDocument()
  })

  it("applies custom className", () => {
    render(<Command className="custom-class">Content</Command>)
    const command = screen.getByTestId("command")
    expect(command).toHaveClass("custom-class")
  })

  it("has data-slot attribute", () => {
    render(<Command>Content</Command>)
    expect(screen.getByTestId("command")).toHaveAttribute("data-slot", "command")
  })

  it("applies default classes", () => {
    render(<Command>Content</Command>)
    const command = screen.getByTestId("command")
    expect(command).toHaveClass("flex")
    expect(command).toHaveClass("h-full")
    expect(command).toHaveClass("w-full")
    expect(command).toHaveClass("flex-col")
    expect(command).toHaveClass("overflow-hidden")
    expect(command).toHaveClass("rounded-md")
    expect(command).toHaveClass("bg-popover")
    expect(command).toHaveClass("text-popover-foreground")
  })

  it("spreads additional props", () => {
    render(<Command data-custom="value">Content</Command>)
    expect(screen.getByTestId("command")).toHaveAttribute("data-custom", "value")
  })
})

describe("CommandInput", () => {
  it("renders correctly", () => {
    render(<CommandInput placeholder="Search..." />)
    expect(screen.getByPlaceholderText("Search...")).toBeInTheDocument()
  })

  it("renders search icon with aria-hidden", () => {
    render(<CommandInput placeholder="Search..." />)
    expect(screen.getByTestId("search-icon")).toBeInTheDocument()
  })

  it("applies custom className to input", () => {
    render(<CommandInput className="custom-input" placeholder="Search..." />)
    expect(screen.getByPlaceholderText("Search...")).toHaveClass("custom-input")
  })

  it("has input wrapper with data-slot", () => {
    render(<CommandInput placeholder="Search..." />)
    const wrapper = screen.getByPlaceholderText("Search...").parentElement
    expect(wrapper).toHaveAttribute("data-slot", "command-input-wrapper")
  })

  it("applies default wrapper classes", () => {
    render(<CommandInput placeholder="Search..." />)
    const wrapper = screen.getByPlaceholderText("Search...").parentElement
    expect(wrapper).toHaveClass("flex")
    expect(wrapper).toHaveClass("h-9")
    expect(wrapper).toHaveClass("items-center")
    expect(wrapper).toHaveClass("gap-2")
    expect(wrapper).toHaveClass("border-b")
    expect(wrapper).toHaveClass("px-3")
  })

  it("applies default input classes", () => {
    render(<CommandInput placeholder="Search..." />)
    const input = screen.getByPlaceholderText("Search...")
    expect(input).toHaveClass("flex")
    expect(input).toHaveClass("h-10")
    expect(input).toHaveClass("w-full")
    expect(input).toHaveClass("rounded-md")
    expect(input).toHaveClass("bg-transparent")
    expect(input).toHaveClass("py-3")
    expect(input).toHaveClass("text-sm")
  })

  it("handles value changes", async () => {
    const handleChange = vi.fn()
    render(<CommandInput placeholder="Search..." onChange={handleChange} />)
    const input = screen.getByPlaceholderText("Search...")
    await userEvent.type(input, "test")
    expect(handleChange).toHaveBeenCalled()
  })

  it("has outline-hidden class for focus styling", () => {
    render(<CommandInput placeholder="Search..." />)
    const input = screen.getByPlaceholderText("Search...")
    expect(input).toHaveClass("outline-hidden")
  })

  it("applies disabled styles", () => {
    render(<CommandInput placeholder="Search..." disabled />)
    const input = screen.getByPlaceholderText("Search...")
    expect(input).toHaveClass("disabled:cursor-not-allowed")
    expect(input).toHaveClass("disabled:opacity-50")
  })
})

describe("CommandList", () => {
  it("renders correctly", () => {
    render(<CommandList>Items</CommandList>)
    expect(screen.getByText("Items")).toBeInTheDocument()
  })

  it("applies custom className", () => {
    render(<CommandList className="custom-list">Items</CommandList>)
    expect(screen.getByText("Items")).toHaveClass("custom-list")
  })

  it("has data-slot attribute", () => {
    render(<CommandList>Items</CommandList>)
    expect(screen.getByText("Items")).toHaveAttribute("data-slot", "command-list")
  })

  it("applies default classes", () => {
    render(<CommandList>Items</CommandList>)
    const list = screen.getByText("Items")
    expect(list).toHaveClass("max-h-[300px]")
    expect(list).toHaveClass("scroll-py-1")
    expect(list).toHaveClass("overflow-x-hidden")
    expect(list).toHaveClass("overflow-y-auto")
  })

  it("supports custom children", () => {
    render(
      <CommandList>
        <div>Item 1</div>
        <div>Item 2</div>
      </CommandList>
    )
    expect(screen.getByText("Item 1")).toBeInTheDocument()
    expect(screen.getByText("Item 2")).toBeInTheDocument()
  })
})

describe("CommandEmpty", () => {
  it("renders correctly", () => {
    render(<CommandEmpty>No results found</CommandEmpty>)
    expect(screen.getByText("No results found")).toBeInTheDocument()
  })

  it("applies default classes", () => {
    render(<CommandEmpty>No results</CommandEmpty>)
    const empty = screen.getByText("No results")
    expect(empty).toHaveClass("py-6")
    expect(empty).toHaveClass("text-center")
    expect(empty).toHaveClass("text-sm")
  })

  it("has data-slot attribute", () => {
    render(<CommandEmpty>Empty</CommandEmpty>)
    expect(screen.getByText("Empty")).toHaveAttribute("data-slot", "command-empty")
  })

  it("supports custom empty message", () => {
    render(<CommandEmpty>Nothing to see here</CommandEmpty>)
    expect(screen.getByText("Nothing to see here")).toBeInTheDocument()
  })
})

describe("CommandGroup", () => {
  it("renders correctly", () => {
    render(<CommandGroup>Group Items</CommandGroup>)
    expect(screen.getByText("Group Items")).toBeInTheDocument()
  })

  it("applies custom className", () => {
    render(<CommandGroup className="custom-group">Items</CommandGroup>)
    expect(screen.getByText("Items")).toHaveClass("custom-group")
  })

  it("has data-slot attribute", () => {
    render(<CommandGroup>Items</CommandGroup>)
    expect(screen.getByText("Items")).toHaveAttribute("data-slot", "command-group")
  })

  it("applies default classes", () => {
    render(<CommandGroup>Items</CommandGroup>)
    const group = screen.getByText("Items")
    expect(group).toHaveClass("overflow-hidden")
    expect(group).toHaveClass("p-1")
    expect(group).toHaveClass("text-foreground")
  })

  it("supports nested items", () => {
    render(
      <CommandGroup>
        <CommandItem>Item 1</CommandItem>
        <CommandItem>Item 2</CommandItem>
      </CommandGroup>
    )
    expect(screen.getByText("Item 1")).toBeInTheDocument()
    expect(screen.getByText("Item 2")).toBeInTheDocument()
  })
})

describe("CommandItem", () => {
  it("renders correctly", () => {
    render(<CommandItem>Item 1</CommandItem>)
    expect(screen.getByText("Item 1")).toBeInTheDocument()
  })

  it("applies custom className", () => {
    render(<CommandItem className="custom-item">Item</CommandItem>)
    expect(screen.getByText("Item")).toHaveClass("custom-item")
  })

  it("has data-slot attribute", () => {
    render(<CommandItem>Item</CommandItem>)
    expect(screen.getByText("Item")).toHaveAttribute("data-slot", "command-item")
  })

  it("applies default layout classes", () => {
    render(<CommandItem>Item</CommandItem>)
    const item = screen.getByText("Item")
    expect(item).toHaveClass("relative")
    expect(item).toHaveClass("flex")
    expect(item).toHaveClass("cursor-default")
    expect(item).toHaveClass("items-center")
    expect(item).toHaveClass("gap-2")
    expect(item).toHaveClass("rounded-md")
    expect(item).toHaveClass("px-2")
    expect(item).toHaveClass("py-1.5")
    expect(item).toHaveClass("text-sm")
  })

  it("applies transition classes", () => {
    render(<CommandItem>Item</CommandItem>)
    const item = screen.getByText("Item")
    expect(item).toHaveClass("transition-all")
    expect(item).toHaveClass("duration-200")
    expect(item).toHaveClass("ease-out")
  })

  it("can be disabled", () => {
    render(<CommandItem disabled>Disabled Item</CommandItem>)
    const item = screen.getByText("Disabled Item")
    expect(item).toHaveAttribute("data-disabled", "true")
  })

  it("applies disabled state classes", () => {
    render(<CommandItem disabled>Disabled Item</CommandItem>)
    const item = screen.getByText("Disabled Item")
    expect(item).toHaveClass("data-[disabled=true]:pointer-events-none")
    expect(item).toHaveClass("data-[disabled=true]:opacity-50")
  })

  it("applies selected state classes", () => {
    render(<CommandItem>Item</CommandItem>)
    const item = screen.getByText("Item")
    expect(item).toHaveClass("data-[selected=true]:bg-accent")
    expect(item).toHaveClass("data-[selected=true]:text-accent-foreground")
    expect(item).toHaveClass("data-[selected=true]:scale-[1.01]")
  })

  it("applies dark mode selected classes", () => {
    render(<CommandItem>Item</CommandItem>)
    const item = screen.getByText("Item")
    expect(item).toHaveClass("dark:data-[selected=true]:bg-primary/20")
    expect(item).toHaveClass("dark:data-[selected=true]:text-foreground")
  })
})

describe("CommandShortcut", () => {
  it("renders correctly", () => {
    render(<CommandShortcut>⌘K</CommandShortcut>)
    expect(screen.getByText("⌘K")).toBeInTheDocument()
  })

  it("applies custom className", () => {
    render(<CommandShortcut className="custom-shortcut">Ctrl+K</CommandShortcut>)
    expect(screen.getByText("Ctrl+K")).toHaveClass("custom-shortcut")
  })

  it("has data-slot attribute", () => {
    render(<CommandShortcut>Alt+F</CommandShortcut>)
    expect(screen.getByText("Alt+F")).toHaveAttribute("data-slot", "command-shortcut")
  })

  it("applies default classes", () => {
    render(<CommandShortcut>Shift+A</CommandShortcut>)
    const shortcut = screen.getByText("Shift+A")
    expect(shortcut).toHaveClass("ml-auto")
    expect(shortcut).toHaveClass("text-xs")
    expect(shortcut).toHaveClass("tracking-widest")
    expect(shortcut).toHaveClass("text-muted-foreground")
  })

  it("supports various keyboard shortcuts", () => {
    const shortcuts = ["⌘N", "Ctrl+O", "Alt+Shift+K", "F1"]
    shortcuts.forEach((shortcut) => {
      const { unmount } = render(<CommandShortcut>{shortcut}</CommandShortcut>)
      expect(screen.getByText(shortcut)).toBeInTheDocument()
      unmount()
    })
  })
})

describe("CommandSeparator", () => {
  it("renders correctly", () => {
    render(<CommandSeparator />)
    expect(screen.getByTestId("command-separator")).toBeInTheDocument()
  })

  it("applies custom className", () => {
    render(<CommandSeparator className="custom-sep" />)
    expect(screen.getByTestId("command-separator")).toHaveClass("custom-sep")
  })

  it("has data-slot attribute", () => {
    render(<CommandSeparator />)
    expect(screen.getByTestId("command-separator")).toHaveAttribute(
      "data-slot",
      "command-separator"
    )
  })

  it("applies default classes", () => {
    render(<CommandSeparator />)
    const separator = screen.getByTestId("command-separator")
    expect(separator).toHaveClass("-mx-1")
    expect(separator).toHaveClass("h-px")
    expect(separator).toHaveClass("bg-border")
  })

  it("applies dark mode border class", () => {
    render(<CommandSeparator />)
    const separator = screen.getByTestId("command-separator")
    expect(separator).toHaveClass("dark:bg-white/8")
  })
})

describe("Command Integration", () => {
  it("renders a complete command palette", () => {
    render(
      <Command>
        <CommandInput placeholder="Search commands..." />
        <CommandList>
          <CommandEmpty>No commands found.</CommandEmpty>
          <CommandGroup>
            <CommandItem>
              New File
              <CommandShortcut>⌘N</CommandShortcut>
            </CommandItem>
            <CommandItem>
              Open File
              <CommandShortcut>⌘O</CommandShortcut>
            </CommandItem>
            <CommandSeparator />
            <CommandItem>
              Settings
              <CommandShortcut>⌘,</CommandShortcut>
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </Command>
    )

    expect(screen.getByTestId("command")).toBeInTheDocument()
    expect(screen.getByPlaceholderText("Search commands...")).toBeInTheDocument()
    expect(screen.getByText("New File")).toBeInTheDocument()
    expect(screen.getByText("Open File")).toBeInTheDocument()
    expect(screen.getByText("Settings")).toBeInTheDocument()
    expect(screen.getByTestId("command-separator")).toBeInTheDocument()
    expect(screen.getByText("⌘N")).toBeInTheDocument()
    expect(screen.getByText("⌘O")).toBeInTheDocument()
    expect(screen.getByText("⌘,")).toBeInTheDocument()
  })

  it("renders multiple groups with separators", () => {
    render(
      <Command>
        <CommandInput placeholder="Search..." />
        <CommandList>
          <CommandGroup>
            <CommandItem>File Actions</CommandItem>
          </CommandGroup>
          <CommandSeparator />
          <CommandGroup>
            <CommandItem>Edit Actions</CommandItem>
          </CommandGroup>
        </CommandList>
      </Command>
    )

    expect(screen.getByText("File Actions")).toBeInTheDocument()
    expect(screen.getByText("Edit Actions")).toBeInTheDocument()
    expect(screen.getByTestId("command-separator")).toBeInTheDocument()
  })

  it("renders with icons in items", () => {
    const FileIcon = () => <span data-testid="file-icon">📄</span>
    render(
      <Command>
        <CommandList>
          <CommandItem>
            <FileIcon />
            Open File
          </CommandItem>
        </CommandList>
      </Command>
    )

    expect(screen.getByTestId("file-icon")).toBeInTheDocument()
    expect(screen.getByText("Open File")).toBeInTheDocument()
  })

  it("renders empty state when no items match", () => {
    render(
      <Command>
        <CommandInput placeholder="Search..." />
        <CommandList>
          <CommandEmpty>No matching commands</CommandEmpty>
        </CommandList>
      </Command>
    )

    expect(screen.getByText("No matching commands")).toBeInTheDocument()
  })
})
