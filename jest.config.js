module.exports = {
  testMatch: ['**/tests/**/*.test.ts'],
  transform: {
    '^.+\\.ts$': ['ts-jest', { tsconfig: { module: 'commonjs', esModuleInterop: true, resolveJsonModule: true } }],
  },
  moduleFileExtensions: ['ts', 'js', 'json'],
};
