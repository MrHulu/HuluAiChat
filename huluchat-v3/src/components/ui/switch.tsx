import * as React from "react"
import * as SwitchPrimitives from "@radix-ui/react-switch"

import { cn } from "@/lib/utils"

const Switch = React.forwardRef<
  React.ElementRef<typeof SwitchPrimitives.Root>,
  React.ComponentPropsWithoutRef<typeof SwitchPrimitives.Root>
>(({ className, ...props }, ref) => (
  <SwitchPrimitives.Root
    data-slot="switch"
    className={cn(
      "peer inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent shadow-sm",
      "transition-all duration-200 ease-out",
      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
      "hover:scale-[1.02] active:scale-[0.98]",
      "disabled:cursor-not-allowed disabled:opacity-50",
      "data-[state=checked]:bg-primary data-[state=unchecked]:bg-input",
      // Dark mode enhancements
      "dark:shadow-none",
      "dark:data-[state=checked]:shadow-[0_0_8px_oklch(0.55_0.2_264/0.4)]",
      "dark:data-[state=unchecked]:bg-muted/60 dark:hover:data-[state=unchecked]:bg-muted/80",
      "dark:focus-visible:ring-offset-background dark:focus-visible:ring-ring",
      className
    )}
    {...props}
    ref={ref}
  >
    <SwitchPrimitives.Thumb
      className={cn(
        "pointer-events-none block h-4 w-4 rounded-full bg-background shadow-lg ring-0",
        "transition-all duration-200 ease-out",
        "data-[state=checked]:translate-x-4 data-[state=checked]:scale-100",
        "data-[state=unchecked]:translate-x-0 data-[state=unchecked]:scale-90",
        // Dark mode enhancements
        "dark:shadow-[0_2px_4px_oklch(0_0_0/0.3)]",
        "dark:data-[state=checked]:shadow-[0_2px_8px_oklch(0_0_0/0.4)]"
      )}
    />
  </SwitchPrimitives.Root>
))
Switch.displayName = SwitchPrimitives.Root.displayName

export { Switch }
