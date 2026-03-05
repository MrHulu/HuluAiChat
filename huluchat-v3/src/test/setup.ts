import "@testing-library/jest-dom/vitest";

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
