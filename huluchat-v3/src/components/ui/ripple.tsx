import { cn } from "@/lib/utils"
import { memo, useCallback, useEffect, useRef, useState } from "react"

interface RippleProps {
  className?: string
  duration?: number
  color?: string
}

interface RippleEffect {
  id: number
  x: number
  y: number
  size: number
}

/**
 * Ripple component for button click feedback
 * Usage: Wrap button content with <Ripple>...</Ripple>
 */
export const Ripple = memo(function Ripple({
  className,
  duration = 600,
  color = "rgba(255, 255, 255, 0.35)",
}: RippleProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [ripples, setRipples] = useState<RippleEffect[]>([])
  const rippleIdRef = useRef(0)

  const addRipple = useCallback((event: React.MouseEvent) => {
    const container = containerRef.current
    if (!container) return

    const rect = container.getBoundingClientRect()
    const size = Math.max(rect.width, rect.height) * 2
    const x = event.clientX - rect.left - size / 2
    const y = event.clientY - rect.top - size / 2

    const newRipple: RippleEffect = {
      id: rippleIdRef.current++,
      x,
      y,
      size,
    }

    setRipples((prev) => [...prev, newRipple])
  }, [])

  useEffect(() => {
    // Clean up ripples after animation
    if (ripples.length === 0) return

    const timeoutId = setTimeout(() => {
      setRipples((prev) => prev.slice(1))
    }, duration)

    return () => clearTimeout(timeoutId)
  }, [ripples, duration])

  return (
    <span
      ref={containerRef}
      className={cn(
        "pointer-events-none absolute inset-0 overflow-hidden rounded-inherit",
        className
      )}
      onMouseDown={addRipple}
      aria-hidden="true"
    >
      {ripples.map((ripple) => (
        <span
          key={ripple.id}
          className="absolute animate-ripple rounded-full"
          style={{
            left: ripple.x,
            top: ripple.y,
            width: ripple.size,
            height: ripple.size,
            backgroundColor: color,
            animationDuration: `${duration}ms`,
          }}
        />
      ))}
    </span>
  )
})
