/**
 * 错误码数据测试
 */
import { describe, it, expect } from "vitest";
import {
  ERROR_CODES,
  ERROR_CATEGORIES,
  matchErrorCode,
  getErrorsByCategory,
  getErrorById,
} from "./errorCodes";

describe("errorCodes", () => {
  describe("ERROR_CODES", () => {
    it("should have at least one error code defined", () => {
      expect(ERROR_CODES.length).toBeGreaterThan(0);
    });

    it("should have all required fields for each error", () => {
      for (const error of ERROR_CODES) {
        expect(error.id).toBeDefined();
        expect(error.category).toBeDefined();
        expect(error.titleKey).toBeDefined();
        expect(error.descriptionKey).toBeDefined();
        expect(Array.isArray(error.symptoms)).toBe(true);
        expect(Array.isArray(error.solutions)).toBe(true);
        expect(error.solutions.length).toBeGreaterThan(0);
      }
    });

    it("should have unique error IDs", () => {
      const ids = ERROR_CODES.map((e) => e.id);
      const uniqueIds = new Set(ids);
      expect(ids.length).toBe(uniqueIds.size);
    });

    it("should have ERR_UNKNOWN as fallback", () => {
      const unknown = ERROR_CODES.find((e) => e.id === "ERR_UNKNOWN");
      expect(unknown).toBeDefined();
      expect(unknown?.category).toBe("general");
    });
  });

  describe("ERROR_CATEGORIES", () => {
    it("should have all category IDs used in ERROR_CODES", () => {
      const categoryIds = new Set(ERROR_CATEGORIES.map((c) => c.id));
      for (const error of ERROR_CODES) {
        expect(categoryIds.has(error.category)).toBe(true);
      }
    });

    it("should have icon and titleKey for each category", () => {
      for (const category of ERROR_CATEGORIES) {
        expect(category.id).toBeDefined();
        expect(category.titleKey).toBeDefined();
        expect(category.icon).toBeDefined();
      }
    });
  });

  describe("matchErrorCode", () => {
    it("should match API key missing error", () => {
      const result = matchErrorCode("OpenAI API key not configured");
      expect(result.id).toBe("ERR_API_KEY_MISSING");
    });

    it("should match invalid API key error", () => {
      const result = matchErrorCode("Invalid API key provided");
      expect(result.id).toBe("ERR_API_KEY_INVALID");
    });

    it("should match connection error", () => {
      const result = matchErrorCode("ECONNREFUSED connection failed");
      expect(result.category).toBe("connection");
    });

    it("should match timeout error", () => {
      const result = matchErrorCode("Request timed out after 30s");
      expect(result.id).toBe("ERR_TIMEOUT");
    });

    it("should match Ollama not running error", () => {
      const result = matchErrorCode("Ollama service unavailable on port 11434");
      expect(result.id).toBe("ERR_OLLAMA_NOT_RUNNING");
    });

    it("should match rate limit error", () => {
      const result = matchErrorCode("429 Too Many Requests");
      expect(result.id).toBe("ERR_RATE_LIMIT");
    });

    it("should return ERR_UNKNOWN for unmatched errors", () => {
      const result = matchErrorCode("Some random error message that doesn't match anything");
      expect(result.id).toBe("ERR_UNKNOWN");
    });

    it("should be case insensitive", () => {
      const result = matchErrorCode("API KEY NOT CONFIGURED");
      expect(result.category).toBe("api_key");
    });

    it("should match partial error messages", () => {
      const result = matchErrorCode("Error: timeout while processing request");
      expect(result.id).toBe("ERR_TIMEOUT");
    });
  });

  describe("getErrorsByCategory", () => {
    it("should return errors for api_key category", () => {
      const errors = getErrorsByCategory("api_key");
      expect(errors.length).toBeGreaterThan(0);
      expect(errors.every((e) => e.category === "api_key")).toBe(true);
    });

    it("should return errors for ollama category", () => {
      const errors = getErrorsByCategory("ollama");
      expect(errors.length).toBeGreaterThan(0);
      expect(errors.every((e) => e.category === "ollama")).toBe(true);
    });

    it("should return empty array for empty category", () => {
      // All categories should have at least one error
      for (const category of ERROR_CATEGORIES) {
        const errors = getErrorsByCategory(category.id);
        expect(errors.length).toBeGreaterThan(0);
      }
    });
  });

  describe("getErrorById", () => {
    it("should return error for known ID", () => {
      const error = getErrorById("ERR_API_KEY_MISSING");
      expect(error).toBeDefined();
      expect(error?.id).toBe("ERR_API_KEY_MISSING");
    });

    it("should return undefined for unknown ID", () => {
      const error = getErrorById("NONEXISTENT_ERROR");
      expect(error).toBeUndefined();
    });

    it("should return ERR_UNKNOWN error", () => {
      const error = getErrorById("ERR_UNKNOWN");
      expect(error).toBeDefined();
      expect(error?.category).toBe("general");
    });
  });
});
