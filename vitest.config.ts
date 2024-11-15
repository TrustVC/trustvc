import dts from 'vite-plugin-dts';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  define: {
    'import.meta.vitest': 'undefined',
  },
  plugins: [
    dts({
      entryRoot: 'src',
      tsconfigPath: 'tsconfig.test.json',
    }),
  ],
  cacheDir: 'node_modules/.vitest',
  test: {
    include: ['**/*.test.{ts,js}'],
    server: {
      deps: {
        inline: ['@govtechsg/oa-verify', '@tradetrust-tt/tt-verify'], // Inline oa-verify package directly
      },
    },
    exclude: ['dist', 'node_modules', '*/type{s}.{ts,js}'],
    coverage: {
      enabled: true,
      provider: 'v8',
      reportsDirectory: '.coverage',
      ignoreEmptyLines: true,
      reporter: ['text', 'lcov', 'json', 'html'],
      include: ['src/**/*.{ts,js}'],
    },
  },
});
