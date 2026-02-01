// @ts-check
import globals from 'globals';
import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import prettierConfig from 'eslint-config-prettier';

export default tseslint.config(
  {
    // Optionally add an ESLint Flat Config "root" property.
    // If you don't root, ESLint will look in the parent directories for more config files.
    // root: true,
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        ...globals.browser,
        ...globals.es2021,
      },
    },
  },
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  {
    // enable the "react" plugin
    plugins: {
      react,
      'react-hooks': reactHooks,
    },
    rules: {
      ...react.configs.recommended.rules,
      ...reactHooks.configs.recommended.rules,
    },
    settings: {
      react: {
        version: 'detect', // Automatically detect the React version
      },
    },
  },
  prettierConfig,
  {
    // Specific overrides for files
    files: ['**/*.{js,jsx,mjs,cjs,ts,tsx}'],
    rules: {
      // Disable prop-types as we use TypeScript
      'react/prop-types': 'off',
      // React 17+ doesn't require React to be in scope
      'react/react-in-jsx-scope': 'off',
    },
  },
  {
    // Ignore files and directories
    ignores: [
      'node_modules/',
      '.output/',
      '.wxt/',
      'pnpm-lock.yaml',
      '.prettierrc.cjs',
    ],
  }
);
