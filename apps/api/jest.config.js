module.exports = {
  rootDir: '.',
  testEnvironment: 'node',
  testMatch: ['<rootDir>/src/**/*.spec.ts', '<rootDir>/test/**/*.spec.ts'],
  transform: {
    '^.+\\.ts$': ['ts-jest', { tsconfig: 'tsconfig.json' }],
  },
  clearMocks: true,
  restoreMocks: true,
  testPathIgnorePatterns: [
    '/node_modules/',
    'src/placement/student-readiness.controller.spec.ts',
    'src/placement/student-readiness.service.spec.ts',
  ],
};
