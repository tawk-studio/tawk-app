const js = require('@eslint/js');
const tseslint = require('typescript-eslint');
const importPlugin = require('eslint-plugin-import');
const prettierPlugin = require('eslint-plugin-prettier');

const CONFIG_FILES = ['eslint.config.js', 'babel.config.js', '*.config.js'];

module.exports = [
  {
    ignores: [
      'node_modules/**',
      'web-build/**',
      'app-example/**',
      'expo-env.d.ts',
    ],
  },

  js.configs.recommended,

  ...tseslint.configs.recommended.map((c) => ({
    ...c,
    files: ['**/*.{ts,tsx}'],
  })),

  {
    files: ['**/*.{ts,tsx,js,jsx}'],
    plugins: {
      import: importPlugin,
      prettier: prettierPlugin,
    },
    settings: {
      'import/resolver': {
        typescript: { project: './tsconfig.json' },
      },
    },
    rules: {
      'prettier/prettier': 'error',
    },
  },

  {
    files: CONFIG_FILES,
    languageOptions: {
      globals: {
        module: 'readonly',
        require: 'readonly',
        __dirname: 'readonly',
        process: 'readonly',
      },
    },
    rules: {
      '@typescript-eslint/no-require-imports': 'off',
    },
  },
];
