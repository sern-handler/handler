// vitest.config.ts or vitest.config.js
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    setupFiles: ['./test/setup/setup-tests.ts'],
  },
})
