/* eslint-env node */
module.exports = {
  extends: ['eslint:recommended', 'plugin:@typescript-eslint/recommended'],
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint'],
  root: true,
  parserOptions: {
    project: true,
    tsconfigRootDir: __dirname,
  },
  rules: {
    // Only disabling this because this code is very old but also battle-tested,
    // and coming up with clever typings may break for consumers.
    '@typescript-eslint/no-explicit-any': 'off',
  },
  overrides: [
    {
      files: ['**/__tests__/*.test.ts'],
      rules: {
        // The tests may use an untyped library which requires (no pun intended) `require`.
        '@typescript-eslint/no-var-requires': 'off',
      },
    },
  ],
}
