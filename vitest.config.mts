import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['src/**/*.test.ts'],
    environment: 'node',
    setupFiles: [
      './src/test-helpers/mockDeviceActivity.ts',
      './src/test-helpers/mockPersistedStorage.ts',
    ],
  },
});
