import { vi } from 'vitest';

// Keep the existing Jest-style test suite compatible while running on Vitest.
globalThis.jest = vi;
