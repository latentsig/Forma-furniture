import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['src/**/*.test.ts'],
    exclude: ['src/**/*.node.test.ts'],
    pool: 'threads',
    maxWorkers: 1,
    minWorkers: 1
  }
});
