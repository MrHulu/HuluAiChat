import "@testing-library/jest-dom/vitest";

// Initialize i18n for tests with English as default
import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import en from "../i18n/locales/en.json";
import zh from "../i18n/locales/zh.json";

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    zh: { translation: zh },
  },
  lng: "en",
  fallbackLng: "en",
  interpolation: {
    escapeValue: false,
  },
});

// Polyfill for Radix UI components
// https://github.com/radix-ui/primitives/issues/1822
interface MockPointerEventInit extends PointerEventInit {
  currentTarget?: EventTarget | null;
}

class MockPointerEvent extends MouseEvent {
  currentTarget: EventTarget | null;
  pointerId: number;

  constructor(type: string, props: MockPointerEventInit = {}) {
    super(type, props);
    this.currentTarget = props.currentTarget || null;
    this.pointerId = props.pointerId || 0;
  }
}

window.PointerEvent = MockPointerEvent as unknown as typeof PointerEvent;
window.HTMLElement.prototype.hasPointerCapture = () => false;
window.HTMLElement.prototype.setPointerCapture = () => {};
window.HTMLElement.prototype.releasePointerCapture = () => {};

// Polyfill scrollIntoView for Radix UI
window.HTMLElement.prototype.scrollIntoView = () => {};

// Mock ResizeObserver for Radix UI Tooltip
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};
