/**
 * Accordion UI Component
 * Collapsible content panels for FAQ and similar use cases
 */
import * as React from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface AccordionContextValue {
  openItems: string[];
  toggleItem: (id: string) => void;
  type: "single" | "multiple";
}

const AccordionContext = React.createContext<AccordionContextValue | null>(null);

interface AccordionProps {
  type?: "single" | "multiple";
  defaultValue?: string | string[];
  className?: string;
  children: React.ReactNode;
}

export function Accordion({
  type = "single",
  defaultValue,
  className,
  children,
}: AccordionProps) {
  const [openItems, setOpenItems] = React.useState<string[]>(() => {
    if (defaultValue) {
      return Array.isArray(defaultValue) ? defaultValue : [defaultValue];
    }
    return [];
  });

  const toggleItem = React.useCallback(
    (id: string) => {
      setOpenItems((prev) => {
        if (type === "single") {
          return prev.includes(id) ? [] : [id];
        }
        return prev.includes(id)
          ? prev.filter((item) => item !== id)
          : [...prev, id];
      });
    },
    [type]
  );

  return (
    <AccordionContext.Provider value={{ openItems, toggleItem, type }}>
      <div className={cn("space-y-2", className)}>{children}</div>
    </AccordionContext.Provider>
  );
}

interface AccordionItemProps {
  id: string;
  className?: string;
  children: React.ReactNode;
}

export function AccordionItem({ id, className, children }: AccordionItemProps) {
  return (
    <div
      data-state={
        React.useContext(AccordionContext)?.openItems.includes(id)
          ? "open"
          : "closed"
      }
      className={cn(
        "border rounded-lg overflow-hidden",
        "dark:border-white/10",
        className
      )}
    >
      {React.Children.map(children, (child) => {
        if (React.isValidElement(child)) {
          return React.cloneElement(child as React.ReactElement<{ itemId?: string }>, { itemId: id });
        }
        return child;
      })}
    </div>
  );
}

interface AccordionTriggerProps {
  itemId?: string;
  className?: string;
  children: React.ReactNode;
}

export function AccordionTrigger({
  itemId,
  className,
  children,
}: AccordionTriggerProps) {
  const context = React.useContext(AccordionContext);
  if (!context || !itemId) return null;

  const isOpen = context.openItems.includes(itemId);

  return (
    <button
      type="button"
      onClick={() => context.toggleItem(itemId)}
      className={cn(
        "flex w-full items-center justify-between p-4 text-left",
        "hover:bg-muted/50 transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        className
      )}
      aria-expanded={isOpen}
    >
      <span className="font-medium">{children}</span>
      <ChevronDown
        className={cn(
          "size-4 shrink-0 text-muted-foreground transition-transform duration-200",
          isOpen && "rotate-180"
        )}
      />
    </button>
  );
}

interface AccordionContentProps {
  itemId?: string;
  className?: string;
  children: React.ReactNode;
}

export function AccordionContent({
  itemId,
  className,
  children,
}: AccordionContentProps) {
  const context = React.useContext(AccordionContext);
  if (!context || !itemId) return null;

  const isOpen = context.openItems.includes(itemId);

  if (!isOpen) return null;

  return (
    <div
      className={cn(
        "px-4 pb-4 pt-0 text-sm text-muted-foreground",
        "animate-accordion-down",
        className
      )}
    >
      {children}
    </div>
  );
}
