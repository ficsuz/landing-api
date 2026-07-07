import js from '@eslint/js';
import tseslint from '@typescript-eslint/eslint-plugin';
import tsparser from '@typescript-eslint/parser';
import prettier from 'eslint-plugin-prettier';

export default [
  js.configs.recommended,
  {
    files: ['**/*.ts', '**/*.tsx'],
    languageOptions: {
      parser: tsparser,
      parserOptions: {
        project: './tsconfig.json',
        sourceType: 'module',
      },
      globals: {
        process: 'readonly',
        Buffer: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
        console: 'readonly',
        global: 'readonly',
        module: 'readonly',
        require: 'readonly',
        exports: 'readonly',
      },
    },
    plugins: {
      '@typescript-eslint': tseslint,
      prettier: prettier,
    },
    rules: {
      // Extend recommended TypeScript rules
      ...tseslint.configs.recommended.rules,
      
      // TypeScript specific rules
      '@typescript-eslint/interface-name-prefix': 'off',
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      // `any` is banned project-wide; use `unknown` + narrowing or a real type.
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unused-vars': [
        'warn',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
        },
      ],

      // General rules
      'no-console': ['warn', { allow: ['log', 'warn', 'error'] }],
      'no-debugger': 'warn',
      'no-duplicate-imports': 'error',
      'no-unused-vars': 'off', // Using TypeScript's no-unused-vars instead
      'prefer-const': 'warn',
      'no-var': 'error',

      // Async/Promise rules
      'no-return-await': 'warn',
      'require-await': 'warn',

      // Code style
      'prettier/prettier': [
        'error',
        {
          singleQuote: true,
          trailingComma: 'all',
          printWidth: 100,
          tabWidth: 2,
          semi: true,
        },
      ],
    },
  },
  {
    // Relaxed rules for database files
    files: [
      '**/database/**/*.ts',
      '**/migrations/**/*.ts',
      '**/seeds/**/*.ts',
      '**/repositories/**/*.ts',
    ],
    rules: {
      'require-await': 'off',
      '@typescript-eslint/explicit-function-return-type': 'off',
    },
  },
  {
    // Stricter rules for services and controllers. Matches the flat module
    // layout (`users.service.ts`, `users.controller.ts` at the module root) as
    // well as any nested `services/` infra — by file suffix, not folder.
    files: ['**/*.service.ts', '**/*.controller.ts'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'error',
      'require-await': 'error',
    },
  },
  {
    // Test files configuration
    files: ['**/*.spec.ts', '**/*.test.ts', '**/test/**/*.ts'],
    languageOptions: {
      globals: {
        describe: 'readonly',
        it: 'readonly',
        test: 'readonly',
        expect: 'readonly',
        beforeEach: 'readonly',
        afterEach: 'readonly',
        beforeAll: 'readonly',
        afterAll: 'readonly',
        jest: 'readonly',
      },
    },
    rules: {
      'require-await': 'off',
    },
  },
  {
    ignores: ['dist/**', 'node_modules/**', '.eslintrc.js'],
  },
];
