module.exports = {
  root: true,
  extends: [
    'eslint:recommended',
    'plugin:react/recommended',
    'plugin:react-native/all'
  ],
  parser: '@typescript-eslint/parser',
  plugins: [
    'react',
    'react-native',
    '@typescript-eslint'
  ],
  parserOptions: {
    ecmaFeatures: {
      jsx: true
    },
    ecmaVersion: 2021,
    sourceType: 'module'
  },
  rules: {
    'react-native/no-raw-text': 2,
    'react/prop-types': 'off',
    'no-constant-binary-expression': 'error'
  },
  settings: {
    react: {
      version: 'detect'
    }
  }
};
