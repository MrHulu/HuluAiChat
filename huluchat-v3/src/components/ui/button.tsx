import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Slot } from "radix-ui"

import { cn } from "@/lib/utils"
import { Ripple } from "./ripple"

const buttonVariants = cva(
  "inline-flex shrink-0 items-center justify-center gap-2 rounded-md text-sm font-medium whitespace-nowrap transition-all duration-200 ease-out outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 hover:scale-[1.02] active:scale-[0.97]",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow-xs hover:bg-primary/90 hover:shadow-sm dark:shadow-primary/5 dark:hover:shadow-primary/20 dark:hover:bg-primary/85",
        destructive:
          "bg-destructive text-white shadow-xs hover:bg-destructive/90 hover:shadow-sm focus-visible:ring-destructive/20 dark:bg-destructive/70 dark:hover:bg-destructive/80 dark:focus-visible:ring-destructive/40 dark:hover:shadow-destructive/20",
        outline:
          "border bg-background shadow-xs hover:bg-accent hover:text-accent-foreground hover:border-accent dark:border-border/80 dark:bg-transparent dark:hover:bg-accent/30 dark:hover:border-accent/50 dark:active:border-accent/60",
        secondary:
          "bg-secondary text-secondary-foreground shadow-xs hover:bg-secondary/80 hover:shadow-sm dark:bg-secondary/80 dark:hover:bg-secondary/60 dark:active:bg-secondary/50",
        ghost:
          "hover:bg-accent/60 hover:text-accent-foreground dark:hover:bg-accent/50 dark:active:bg-accent/60 dark:hover:shadow-sm dark:hover:shadow-accent/10",
        link:
          "text-primary underline-offset-4 hover:underline decoration-primary/30 hover:decoration-primary decoration-2 transition-[text-decoration-color,opacity] dark:decoration-primary/40 dark:hover:decoration-primary",
      },
      size: {
        default: "h-9 px-4 py-2 has-[>svg]:px-3",
        xs: "h-6 gap-1 rounded-md px-2 text-xs has-[>svg]:px-1.5 [&_svg:not([class*='size-'])]:size-3",
        sm: "h-8 gap-1.5 rounded-md px-3 has-[>svg]:px-2.5",
        lg: "h-10 rounded-md px-6 has-[>svg]:px-4",
        icon: "size-9",
        "icon-xs": "size-6 rounded-md [&_svg:not([class*='size-'])]:size-3",
        "icon-sm": "size-8",
        "icon-lg": "size-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  ripple = true,
  children,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
    ripple?: boolean
  }) {
  const Comp = asChild ? Slot.Root : "button"

  // Get ripple color based on variant
  const rippleColor =
    variant === "default" || variant === "destructive"
      ? "rgba(255, 255, 255, 0.3)"
      : variant === "ghost" || variant === "link"
        ? "rgba(0, 0, 0, 0.15)"
        : "rgba(0, 0, 0, 0.12)"

  // In asChild mode, don't render Ripple to avoid Slot issues
  if (asChild) {
    return (
      <Comp
        data-slot="button"
        data-variant={variant}
        data-size={size}
        className={cn(buttonVariants({ variant, size, className }))}
        {...props}
      >
        {children}
      </Comp>
    )
  }

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }), "relative overflow-hidden")}
      {...props}
    >
      {ripple && !props.disabled && <Ripple color={rippleColor} />}
      {children}
    </Comp>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export { Button, buttonVariants }
