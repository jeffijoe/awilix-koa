import js from '@eslint/js'
import ts from 'typescript-eslint'

export default [
  js.configs.recommended,
  ...ts.configs.recommended,
  {
    languageOptions: {
      ecmaVersion: 2021,
      sourceType: 'module',

      parserOptions: {
        project: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },

    rules: {
      '@typescript-eslint/no-require-imports': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unsafe-function-type': 'off',
    },
  },
  {
    files: ['**/__tests__/*.test.ts'],

    rules: {
      '@typescript-eslint/no-unused-vars': 'off',
    },
  },
]
