import { describe, it, expect } from "vitest";
import { cn } from "./utils";

describe("cn utility function", () => {
  it("should merge class names", () => {
    const result = cn("foo", "bar");
    expect(result).toBe("foo bar");
  });

  it("should handle conditional classes", () => {
    const result = cn("base", true && "included", false && "excluded");
    expect(result).toBe("base included");
  });

  it("should merge tailwind classes correctly", () => {
    // twMerge should handle conflicting tailwind classes
    const result = cn("px-2 py-1", "px-4");
    expect(result).toBe("py-1 px-4");
  });

  it("should handle undefined and null values", () => {
    const result = cn("base", undefined, null, "end");
    expect(result).toBe("base end");
  });

  it("should handle object notation", () => {
    const result = cn({
      active: true,
      disabled: false,
      visible: true,
    });
    expect(result).toBe("active visible");
  });

  it("should handle array notation", () => {
    const result = cn(["foo", "bar"], "baz");
    expect(result).toBe("foo bar baz");
  });

  it("should return empty string for no arguments", () => {
    const result = cn();
    expect(result).toBe("");
  });
});
