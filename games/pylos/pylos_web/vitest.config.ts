import { defineConfig } from 'vitest/config'

// Vitest config is separate from Vite config to avoid type conflicts.
export default defineConfig({
  test: {
    environment: 'jsdom',
    include: ['src/**/*.spec.ts', 'src/**/*.spec.tsx'],
    coverage: {
      provider: 'v8',
      reportsDirectory: 'coverage',
    },
  },
})
