/**
 * Template Variables System Tests
 * 提示词模板变量系统测试
 */
import { describe, it, expect } from "vitest";
import { extractVariables, getUserVariables, hasUserVariables, replaceVariables, processTemplate, PREDEFINED_VARIABLES } from "./templateVariables";

describe("extractVariables", () => {
  it("should extract variable names from template content", () => {
    const template = "Hello {{name}}, today is {{date}} and {{time}}!";
    const variables = extractVariables(template);
    expect(variables).toEqual(["name", "date", "time"]);
  });

  it("should deduplicate variables", () => {
    const template = "{{topic}} and {{topic}} and {{language}}";
    const variables = extractVariables(template);
    expect(variables).toEqual(["topic", "language"]);
  });

  it("should handle empty template", () => {
    const variables = extractVariables("");
    expect(variables).toEqual([]);
  });

  it("should handle template without variables", () => {
    const template = "No variables here, just plain text.";
    const variables = extractVariables(template);
    expect(variables).toEqual([]);
  });
});

describe("getUserVariables", () => {
  it("should return only user variables (exclude predefined)", () => {
    const template = "Hello {{name}}, today is {{date}}!";
    const variables = getUserVariables(template);
    expect(variables).toHaveLength(1);
    expect(variables[0].name).toBe("name");
  });

  it("should return empty array for template without user variables", () => {
    const template = "Today is {{date}} at {{time}}!";
    const variables = getUserVariables(template);
    expect(variables).toEqual([]);
  });

  it("should return empty array for template without any variables", () => {
    const template = "Just plain text.";
    const variables = getUserVariables(template);
    expect(variables).toEqual([]);
  });
});

describe("hasUserVariables", () => {
  it("should return true for template with user variables", () => {
    const template = "Hello {{name}}!";
    expect(hasUserVariables(template)).toBe(true);
  });

  it("should return false for template with only predefined variables", () => {
    const template = "Today is {{date}} at {{time}}!";
    expect(hasUserVariables(template)).toBe(false);
  });

  it("should return false for template without any variables", () => {
    const template = "Just plain text.";
    expect(hasUserVariables(template)).toBe(false);
  });
});

describe("replaceVariables", () => {
  it("should replace all variables with provided values", () => {
    const template = "Hello {{name}}, today is {{date}}!";
    const values = { name: "World" };
    const result = replaceVariables(template, values);
    // Predefined variable {{date}} should also be replaced
    expect(result).toMatch(/Hello World, today \.*\d{4}/);
  });

  it("should handle template with only predefined variables", () => {
    const template = "Today is {{date}} at {{time}}!";
    const result = replaceVariables(template, {});
    expect(result).toMatch(/Today is \d{4} at \d{2}:\d{2}:/);
  });

  it("should handle template without variables", () => {
    const template = "Just plain text.";
    const result = replaceVariables(template, {});
    expect(result).toBe("Just plain text.");
  });
});

describe("processTemplate", () => {
  it("should combine predefined and user variables", () => {
    const template = "Hello {{name}}, today is {{date}} at {{time}} from {{language}}!";
    const values = { name: "World", language: "TypeScript" };
    const result = processTemplate(template, values);
    expect(result).toMatch(/Hello World, today \.*\d{4}.*\d{2}:\d{2}.*TypeScript/);
  });
});
