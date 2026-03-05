import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";
import { ThemeProvider } from "@/components/theme-provider";
import { initI18nLazy } from "./i18n"; // Lazy i18n initialization

// Initialize i18n lazily, then render the app
initI18nLazy().then(() => {
  ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
    <React.StrictMode>
      <ThemeProvider defaultTheme="dark" storageKey="huluchat-theme">
        <App />
      </ThemeProvider>
    </React.StrictMode>,
  );
});
