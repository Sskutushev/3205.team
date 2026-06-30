import { resolve } from 'node:path';
import swc from 'unplugin-swc';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  // SWC (not esbuild) so decorator metadata is emitted in tests, exactly as in
  // the production `nest build --builder swc`. Without it, Nest's ValidationPipe
  // cannot read the DTO metatype and class-validator rules would silently skip.
  plugins: [
    swc.vite({
      jsc: {
        parser: { syntax: 'typescript', decorators: true },
        transform: { legacyDecorator: true, decoratorMetadata: true },
        target: 'es2022',
      },
    }),
  ],
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
