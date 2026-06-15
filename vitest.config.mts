import { defineConfig } from 'vitest/config';

export default defineConfig({
  esbuild: {
    jsx: 'automatic',
    jsxImportSource: 'react',
  },
  test: {
    include: ['src/**/*.test.ts', 'scripts/**/*.test.mjs'],
    environment: 'node',
    setupFiles: [
      './src/test-helpers/mockReactNative.ts',
      './src/test-helpers/mockDeviceActivity.ts',
      './src/test-helpers/mockPersistedStorage.ts',
    ],
  },
});
