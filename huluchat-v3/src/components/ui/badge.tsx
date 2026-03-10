import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-all duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 hover:scale-105 active:scale-95",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground shadow-xs dark:shadow-primary/10 hover:bg-primary/85 hover:shadow-sm dark:hover:bg-primary/80 dark:hover:shadow-primary/25",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground shadow-xs dark:shadow-secondary/10 dark:bg-secondary/80 hover:bg-secondary/85 hover:shadow-sm dark:hover:bg-secondary/65 dark:hover:shadow-secondary/20",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground shadow-xs dark:shadow-destructive/15 dark:bg-destructive/85 hover:bg-destructive/85 hover:shadow-sm dark:hover:bg-destructive/75 dark:hover:shadow-destructive/25",
        outline:
          "border-input bg-background hover:bg-muted/60 dark:hover:bg-muted/50 hover:border-muted-foreground/50 dark:border-white/15 dark:hover:border-white/25 dark:hover:shadow-sm dark:hover:shadow-white/5 dark:focus-visible:shadow-[0_0_12px_oklch(0.4_0.1_264/0.2)]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div
      data-slot="badge"
      data-variant={variant}
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  )
}

export { Badge, badgeVariants }
