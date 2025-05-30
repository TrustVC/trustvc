import cpy from 'cpy';
import { defineConfig } from 'tsup';

export default defineConfig([
  {
    // CJS build
    dts: false, // No .d.ts files from this build
    sourcemap: false,
    treeshake: true,
    splitting: false,
    clean: true, // Clean the entire dist directory once at the beginning
    outDir: 'dist/cjs',
    platform: 'node',
    target: 'esnext',
    entry: ['src/**/*.ts', '!src/**/*.{test,spec}.ts', '!src/__tests__/**'],
    format: ['cjs'],
    tsconfig: 'tsconfig.build.json',
    shims: true,
    bundle: false,
    minify: false,
    keepNames: true,
    onSuccess: async () => {
      console.log('CJS build successful, copying JSON files to dist/cjs...');
      await cpy(['src/**/*.json'], 'dist/cjs', {
        overwrite: true,
      });
      console.log('JSON files copied to dist/cjs.');
    },
  },
  {
    // ESM build
    dts: false, // No .d.ts files from this build
    sourcemap: false,
    treeshake: true,
    splitting: false,
    clean: false, // CJS build already cleaned
    legacyOutput: true,
    outDir: 'dist',
    platform: 'node',
    target: 'esnext',
    entry: ['src/**/*.ts', '!src/**/*.{test,spec}.ts', '!src/__tests__/**'],
    format: ['esm'],
    tsconfig: 'tsconfig.build.json',
    shims: true,
    bundle: false,
    minify: false,
    keepNames: true,
    onSuccess: async () => {
      console.log('ESM build successful, copying JSON files to dist/esm...');
      await cpy(['src/**/*.json'], 'dist/esm', {
        overwrite: true,
      });
      console.log('JSON files copied to dist/esm.');
    },
  },
  {
    // DTS only build
    dts: {
      only: true,
    },
    sourcemap: false, // Not applicable for dts only
    treeshake: false, // Not applicable for dts only
    splitting: false, // Crucial: Keep false to avoid chunked/hashed .d.ts names
    clean: false, // Other builds ran, don't clean their output
    outDir: 'dist/types',
    platform: 'node',
    target: 'esnext',
    entry: ['src/**/*.ts', '!src/**/*.{test,spec}.ts', '!src/__tests__/**'],
    tsconfig: 'tsconfig.build.json', // This tsconfig must have "declaration": true
    shims: false, // Not applicable for dts only
    bundle: false, // IMPORTANT: Transpile files individually to maintain structure
    minify: false, // Not applicable
    keepNames: true, // Generally not critical for dts-only
    // No onSuccess usually needed for DTS, unless you have specific post-processing for types
  },
]);
