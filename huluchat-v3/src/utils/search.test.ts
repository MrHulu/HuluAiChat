/**
 * Search utilities tests - TASK-202
 */
import { describe, it, expect } from "vitest";
import {
  highlightMatches,
  findMatchPositions,
  findMatchingMessages,
  countMatches,
} from "./search";

describe("search utilities", () => {
  describe("highlightMatches", () => {
    it("should return original text when query is empty", () => {
      const result = highlightMatches("Hello world", "");
      expect(result).toEqual(["Hello world"]);
    });

    it("should highlight single match", () => {
      const result = highlightMatches("Hello world", "world");
      expect(result).toHaveLength(2);
      expect(result[0]).toBe("Hello ");
      expect(result[1]).toEqual({ type: "highlight", text: "world", key: "hl-0" });
    });

    it("should highlight multiple matches", () => {
      const result = highlightMatches("hello hello hello", "hello");
      expect(result).toHaveLength(5);
      expect(result[0]).toEqual({ type: "highlight", text: "hello", key: "hl-0" });
      expect(result[1]).toBe(" ");
      expect(result[2]).toEqual({ type: "highlight", text: "hello", key: "hl-1" });
    });

    it("should be case insensitive by default", () => {
      const result = highlightMatches("Hello World", "hello");
      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({ type: "highlight", text: "Hello", key: "hl-0" });
    });

    it("should be case sensitive when specified", () => {
      const result = highlightMatches("Hello World", "hello", true);
      expect(result).toEqual(["Hello World"]);
    });

    it("should handle special regex characters", () => {
      const result = highlightMatches("Hello (world)", "(world)");
      expect(result).toHaveLength(2);
      expect(result[0]).toBe("Hello ");
      expect(result[1]).toEqual({ type: "highlight", text: "(world)", key: "hl-0" });
    });
  });

  describe("findMatchPositions", () => {
    it("should return empty array when query is empty", () => {
      const result = findMatchPositions("Hello world", "");
      expect(result).toEqual([]);
    });

    it("should find single match position", () => {
      const result = findMatchPositions("Hello world", "world");
      expect(result).toEqual([6]);
    });

    it("should find multiple match positions", () => {
      const result = findMatchPositions("hello hello hello", "hello");
      expect(result).toEqual([0, 6, 12]);
    });

    it("should be case insensitive by default", () => {
      const result = findMatchPositions("Hello HELLO", "hello");
      expect(result).toEqual([0, 6]);
    });

    it("should be case sensitive when specified", () => {
      const result = findMatchPositions("Hello HELLO", "hello", true);
      expect(result).toEqual([]);
    });
  });

  describe("findMatchingMessages", () => {
    const messages = [
      { id: "1", content: "Hello world" },
      { id: "2", content: "Goodbye world" },
      { id: "3", content: "Hello again" },
    ];

    it("should return empty array when query is empty", () => {
      const result = findMatchingMessages(messages, "");
      expect(result).toEqual([]);
    });

    it("should find matching messages", () => {
      const result = findMatchingMessages(messages, "Hello");
      expect(result).toEqual(["1", "3"]);
    });

    it("should find messages with partial match", () => {
      const result = findMatchingMessages(messages, "world");
      expect(result).toEqual(["1", "2"]);
    });

    it("should return empty array when no matches", () => {
      const result = findMatchingMessages(messages, "nonexistent");
      expect(result).toEqual([]);
    });
  });

  describe("countMatches", () => {
    it("should return 0 when query is empty", () => {
      const result = countMatches("Hello world", "");
      expect(result).toBe(0);
    });

    it("should count single match", () => {
      const result = countMatches("Hello world", "world");
      expect(result).toBe(1);
    });

    it("should count multiple matches", () => {
      const result = countMatches("hello hello hello", "hello");
      expect(result).toBe(3);
    });

    it("should be case insensitive by default", () => {
      const result = countMatches("Hello HELLO", "hello");
      expect(result).toBe(2);
    });

    it("should be case sensitive when specified", () => {
      const result = countMatches("Hello HELLO", "hello", true);
      expect(result).toBe(0);
    });
  });
});
