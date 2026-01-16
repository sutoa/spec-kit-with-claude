import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['tests/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts}'],
    env: {
      NODE_ENV: 'test',
      DATABASE_PATH: './data/test-financial-hub.db',
    },
    // Run tests sequentially to avoid database conflicts
    fileParallelism: false,
  },
})
