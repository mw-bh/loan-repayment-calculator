import '@testing-library/jest-dom/vitest';
import { afterEach, vi } from 'vitest';

// Stop one test's fetch stub, spy or fake clock from leaking into the next.
afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  vi.useRealTimers();
});
