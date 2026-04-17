import type { Config } from 'jest';

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src', '<rootDir>/__tests__'],
  moduleNameMapper: {
    '^@conecta2/shared$': '<rootDir>/../shared/src',
    '^@conecta2/shared/(.*)$': '<rootDir>/../shared/src/$1',
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node', 'd.ts'],
  testMatch: ['**/*.test.ts'],
};

export default config;
