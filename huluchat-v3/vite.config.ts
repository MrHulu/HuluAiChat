import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

// @ts-expect-error process is a nodejs global
const host = process.env.TAURI_DEV_HOST;

// https://vite.dev/config/
export default defineConfig(async () => ({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },

  // 代码分割优化
  build: {
    rollupOptions: {
      output: {
        // 使用函数形式的 manualChunks 以支持动态导入
        manualChunks(id) {
          // i18n 语言文件单独分割，支持懒加载
          if (id.includes("/i18n/locales/") && id.endsWith(".json")) {
            const match = id.match(/\/locales\/(\w+)\.json/);
            if (match) {
              return `i18n-${match[1]}`;
            }
          }
          // React 核心
          if (id.includes("node_modules/react/") || id.includes("node_modules/react-dom/")) {
            return "vendor-react";
          }
          // Markdown 渲染（体积大，单独分割）
          if (
            id.includes("node_modules/react-markdown/") ||
            id.includes("node_modules/remark-gfm/") ||
            id.includes("node_modules/rehype-highlight/") ||
            id.includes("node_modules/highlight.js/")
          ) {
            return "vendor-markdown";
          }
          // Mermaid 图表库（体积大，懒加载单独分割）
          if (id.includes("node_modules/mermaid/")) {
            return "vendor-mermaid";
          }
          // Radix UI 组件
          if (id.includes("node_modules/@radix-ui/")) {
            return "vendor-radix";
          }
          // 图标库
          if (id.includes("node_modules/lucide-react/")) {
            return "vendor-icons";
          }
          // i18next 相关
          if (
            id.includes("node_modules/i18next/") ||
            id.includes("node_modules/react-i18next/") ||
            id.includes("node_modules/i18next-browser-languagedetector/")
          ) {
            return "vendor-i18n";
          }
          // 工具库
          if (
            id.includes("node_modules/clsx/") ||
            id.includes("node_modules/tailwind-merge/") ||
            id.includes("node_modules/class-variance-authority/")
          ) {
            return "vendor-utils";
          }
          return undefined;
        },
      },
    },
    // 提高 chunk 大小警告阈值
    chunkSizeWarningLimit: 500,
  },

  // Vite options tailored for Tauri development and only applied in `tauri dev` or `tauri build`
  //
  // 1. prevent Vite from obscuring rust errors
  clearScreen: false,
  // 2. tauri expects a fixed port, fail if that port is not available
  server: {
    port: 1420,
    strictPort: true,
    host: host || false,
    hmr: host
      ? {
          protocol: "ws",
          host,
          port: 1421,
        }
      : undefined,
    watch: {
      // 3. tell Vite to ignore watching `src-tauri`
      ignored: ["**/src-tauri/**"],
    },
  },
}));
