import * as React from "react"

import { cn } from "@/lib/utils"

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-sm",
          "transition-all duration-200 ease-out",
          "file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground",
          "placeholder:text-muted-foreground",
          "hover:border-muted-foreground/50 dark:hover:border-muted-foreground/30",
          "hover:shadow-none dark:hover:bg-input/30",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:ring-offset-1 focus-visible:border-transparent",
          "focus-visible:bg-background",
          "disabled:cursor-not-allowed disabled:opacity-50",
          "md:text-sm",
          "[&[type='range']]:h-2 [&[type='range']]:cursor-pointer [&[type='range']]:shadow-none [&[type='range']]:bg-muted",
          "[&[type='range']]:hover:bg-muted/80",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }
