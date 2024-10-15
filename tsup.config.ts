import cpy from 'cpy';
import { execa } from 'execa';
import { rimraf } from 'rimraf';
import { defineConfig } from 'tsup';

const outExtension = ({ options, format }) => {
  const formatMap = {
    cjs: '.cjs',
    esm: '.mjs',
  };
  return {
    js: formatMap[format],
    dts: `.d.ts`,
  };
};

const onSuccess = async (): Promise<void> => {
  // await cpy(['package.json'], 'dist', {
  //   dot: true,
  //   overwrite: true,
  // });

  // await Promise.all(
  //   ['dist/w3c-vc/', 'dist/esm/w3c-vc'].map(async (path) => {
  //     const r = await new Promise((resolve) => {
  //       const r = rimraf(path);
  //       rimraf.moveRemoveSync(path);
  //       resolve(r);
  //     });
  //   }),
  // );

  // await execa({
  //   stdout: process.stdout,
  //   stderr: process.stderr,
  // })`npx resolve-tspaths -p tsconfig.build.json -s ./dist/cjs -o ./dist/cjs --verbose`;

  // Copy all json files
  await cpy(['src/**/*.json'], 'dist', {
    overwrite: true,
  });
  await cpy(['src/**/*.json'], 'dist/esm', {
    overwrite: true,
  });
};

export default defineConfig([
  {
    dts: true,
    sourcemap: false,
    treeshake: true,
    splitting: false,
    clean: true,
    legacyOutput: true,
    outDir: 'dist',
    platform: 'node',
    entry: ['src/**/*.ts', '!src/**/*.{test,spec}.ts', '!src/__tests__/**'],
    format: ['cjs', 'esm'],
    tsconfig: 'tsconfig.build.json',
    shims: true,
    bundle: false,
    minify: false,
    keepNames: true,
    // outExtension,
    onSuccess,
  },
]);
