import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: (globalThis as any).process?.env?.BASE_PATH ?? '/',
  test: {
    environment: 'node',
  },
})
