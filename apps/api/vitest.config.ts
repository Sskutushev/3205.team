import { resolve } from 'node:path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    alias: {
      '@url-checker/shared': resolve(
        __dirname,
        '../../packages/shared/src/index.ts',
      ),
    },
  },
  test: {
    pool: 'forks',
  },
});
