/**
 * SessionTag Component
 * Display a single tag with optional remove button
 */
import { cn } from "@/lib/utils";

export interface SessionTagProps {
  name: string;
  onRemove?: () => void;
  onClick?: () => void;
  isActive?: boolean;
  size?: "sm" | "xs";
}

export function SessionTag({
  name,
  onRemove,
  onClick,
  isActive = false,
  size = "xs",
}: SessionTagProps) {
  return (
    <span
      onClick={(e) => {
        e.stopPropagation();
        onClick?.();
      }}
      className={cn(
        "inline-flex items-center gap-1 rounded-full border",
        "transition-all duration-150 ease-out cursor-pointer",
        "active:scale-95",
        size === "xs" ? "px-1.5 py-0.5 text-[10px]" : "px-2 py-0.5 text-xs",
        isActive
          ? "bg-primary/20 border-primary/30 text-primary"
          : "bg-muted/50 border-border text-muted-foreground hover:bg-muted"
      )}
    >
      <span className="truncate max-w-[60px]">#{name}</span>
      {onRemove && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="hover:text-destructive transition-colors"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width={size === "xs" ? 10 : 12}
            height={size === "xs" ? 10 : 12}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M18 6 6 18" />
            <path d="m6 6 12 12" />
          </svg>
        </button>
      )}
    </span>
  );
}
