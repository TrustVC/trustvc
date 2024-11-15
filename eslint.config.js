const typescriptEslint = require('@typescript-eslint/eslint-plugin');
const typescriptEslintParser = require('@typescript-eslint/parser');
const eslint = require('@eslint/js');
const tsEslint = require('typescript-eslint');
const prettierConfig = require('eslint-config-prettier');
const eslintPluginPrettierRecommended = require('eslint-plugin-prettier/recommended');

module.exports = [
  eslint.configs.recommended,
  ...tsEslint.configs.recommended,
  eslintPluginPrettierRecommended,
  prettierConfig,
  {
    // Global ignores:
    ignores: ['dist', 'build', 'examples', 'node_modules', '**/.*'],
  },
  {
    plugins: {
      '@typescript-eslint': typescriptEslint,
    },
    languageOptions: {
      parser: typescriptEslintParser,
    },
  },
  {
    files: ['**/*.config.js'],
    rules: {
      '@typescript-eslint/no-require-imports': 'off',
      'no-undef': 'off',
    },
  },
  // {
  //   "files": ["**/*.ts", "**/*.tsx", "**/*.js", "**/*.jsx", "**/*.mjs", "**/*.cjs"],
  //   "rules": {}
  // },
  // {
  //   "files": ["**/*.ts", "**/*.tsx"],
  //   "rules": {}
  // },
  // {
  //   "files": ["**/*.js", "**/*.jsx"],
  //   "rules": {}
  // },
  {
    files: ['**/*.spec.ts', '**/*.spec.tsx', '**/*.spec.js', '**/*.spec.jsx'],
    env: {
      jest: true,
    },
    rules: {},
  },
  {
    files: [
      'types.ts',
      '**/*.types.ts',
      '**/*.test.ts',
      '**/*.test.tsx',
      '**/*.test.js',
      '**/*.test.jsx',
    ],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
    },
  },
  {
    files: ['**/*.config.{ts,js,json}'],
    rules: {
      '@typescript-eslint/no-unused-vars': 'off',
    },
  },
];
