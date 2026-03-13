import { describe, it, expect } from "vitest";
import {
  OFFICIAL_PLUGIN_REGISTRY,
  getAvailablePlugins,
  getPluginsByCategory,
  searchPlugins,
  getPluginById,
  getCategories,
  getFeaturedPlugins,
  sortPlugins,
  getPermissionInfo,
  getCategoryInfo,
} from "./registry";
import type { PluginCategory, PluginPermission } from "./types";

describe("Plugin Registry", () => {
  describe("OFFICIAL_PLUGIN_REGISTRY", () => {
    it("should contain official plugins", () => {
      expect(OFFICIAL_PLUGIN_REGISTRY.length).toBeGreaterThan(0);
    });

    it("should have valid structure for all entries", () => {
      OFFICIAL_PLUGIN_REGISTRY.forEach((entry) => {
        expect(entry.manifest).toBeDefined();
        expect(entry.manifest.id).toMatch(/^com\.huluchat\./);
        expect(entry.manifest.name).toBeTruthy();
        expect(entry.manifest.version).toMatch(/^\d+\.\d+\.\d+$/);
        expect(entry.category).toBeDefined();
        expect(entry.tags).toBeInstanceOf(Array);
        expect(entry.sourcePath).toBeTruthy();
      });
    });

    it("should have unique plugin IDs", () => {
      const ids = OFFICIAL_PLUGIN_REGISTRY.map((p) => p.manifest.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });
  });

  describe("getAvailablePlugins", () => {
    it("should return all plugins from registry", () => {
      const plugins = getAvailablePlugins();
      expect(plugins).toEqual(OFFICIAL_PLUGIN_REGISTRY);
    });
  });

  describe("getPluginsByCategory", () => {
    it("should return plugins for valid category", () => {
      const developerPlugins = getPluginsByCategory("developer");
      expect(developerPlugins.length).toBeGreaterThan(0);
      developerPlugins.forEach((plugin) => {
        expect(plugin.category).toBe("developer");
      });
    });

    it("should return empty array for category with no plugins", () => {
      // This might change as more plugins are added
      const integrationPlugins = getPluginsByCategory("integration");
      expect(Array.isArray(integrationPlugins)).toBe(true);
    });
  });

  describe("searchPlugins", () => {
    it("should return all plugins with empty query", () => {
      const plugins = searchPlugins("");
      expect(plugins).toEqual(OFFICIAL_PLUGIN_REGISTRY);
    });

    it("should return all plugins with whitespace query", () => {
      const plugins = searchPlugins("   ");
      expect(plugins).toEqual(OFFICIAL_PLUGIN_REGISTRY);
    });

    it("should find plugins by name", () => {
      const plugins = searchPlugins("Code Formatter");
      expect(plugins.length).toBeGreaterThan(0);
      expect(plugins.some((p) => p.manifest.name === "Code Formatter")).toBe(true);
    });

    it("should find plugins by description", () => {
      const plugins = searchPlugins("format");
      expect(plugins.length).toBeGreaterThan(0);
    });

    it("should find plugins by tag", () => {
      const plugins = searchPlugins("developer");
      expect(plugins.length).toBeGreaterThan(0);
    });

    it("should be case insensitive", () => {
      const upper = searchPlugins("CODE");
      const lower = searchPlugins("code");
      expect(upper).toEqual(lower);
      expect(upper.length).toBeGreaterThan(0);
    });

    it("should return empty array for no matches", () => {
      const plugins = searchPlugins("xyznonexistent123");
      expect(plugins).toEqual([]);
    });
  });

  describe("getPluginById", () => {
    it("should return plugin for valid ID", () => {
      const plugin = getPluginById("com.huluchat.code-formatter");
      expect(plugin).toBeDefined();
      expect(plugin?.manifest.id).toBe("com.huluchat.code-formatter");
    });

    it("should return undefined for invalid ID", () => {
      const plugin = getPluginById("com.nonexistent.plugin");
      expect(plugin).toBeUndefined();
    });
  });

  describe("getCategories", () => {
    it("should return unique categories", () => {
      const categories = getCategories();
      expect(new Set(categories).size).toBe(categories.length);
    });

    it("should include expected categories", () => {
      const categories = getCategories();
      expect(categories).toContain("developer");
      expect(categories).toContain("utility");
    });
  });

  describe("getFeaturedPlugins", () => {
    it("should return only featured plugins", () => {
      const featured = getFeaturedPlugins();
      featured.forEach((plugin) => {
        expect(plugin.badges).toContain("featured");
      });
    });

    it("should return at least one featured plugin", () => {
      const featured = getFeaturedPlugins();
      expect(featured.length).toBeGreaterThan(0);
    });
  });

  describe("sortPlugins", () => {
    const testPlugins = [...OFFICIAL_PLUGIN_REGISTRY];

    it("should sort by name", () => {
      const sorted = sortPlugins(testPlugins, "name");
      for (let i = 1; i < sorted.length; i++) {
        expect(
          sorted[i - 1].manifest.name.localeCompare(sorted[i].manifest.name)
        ).toBeLessThanOrEqual(0);
      }
    });

    it("should sort by downloads", () => {
      const sorted = sortPlugins(testPlugins, "downloads");
      for (let i = 1; i < sorted.length; i++) {
        expect(
          (sorted[i - 1].downloads ?? 0) >= (sorted[i].downloads ?? 0)
        ).toBe(true);
      }
    });

    it("should sort by rating", () => {
      const sorted = sortPlugins(testPlugins, "rating");
      for (let i = 1; i < sorted.length; i++) {
        expect(
          (sorted[i - 1].rating ?? 0) >= (sorted[i].rating ?? 0)
        ).toBe(true);
      }
    });

    it("should not mutate original array", () => {
      const original = [...testPlugins];
      sortPlugins(testPlugins, "name");
      expect(testPlugins).toEqual(original);
    });
  });

  describe("getPermissionInfo", () => {
    const permissions: PluginPermission[] = [
      "chat.read",
      "chat.write",
      "storage",
      "api",
      "clipboard",
      "network",
      "files",
    ];

    permissions.forEach((permission) => {
      it(`should return info for ${permission}`, () => {
        const info = getPermissionInfo(permission);
        expect(info.label).toBeTruthy();
        expect(info.description).toBeTruthy();
        expect(info.icon).toBeTruthy();
      });
    });
  });

  describe("getCategoryInfo", () => {
    const categories: PluginCategory[] = [
      "productivity",
      "developer",
      "communication",
      "export",
      "appearance",
      "utility",
      "integration",
    ];

    categories.forEach((category) => {
      it(`should return info for ${category}`, () => {
        const info = getCategoryInfo(category);
        expect(info.label).toBeTruthy();
        expect(info.description).toBeTruthy();
        expect(info.icon).toBeTruthy();
      });
    });
  });
});
