import '@testing-library/jest-dom';
import '@testing-library/react';
import { vi } from 'vitest';

if (typeof window !== 'undefined') {
  // @ts-expect-error: JSDOM não implementa PointerEvent nativamente.
  window.PointerEvent = class PointerEvent extends Event {};

  window.HTMLElement.prototype.scrollIntoView = vi.fn();
  window.HTMLElement.prototype.hasPointerCapture = vi.fn();
  window.HTMLElement.prototype.releasePointerCapture = vi.fn();

  window.ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
}
