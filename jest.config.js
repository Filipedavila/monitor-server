module.exports = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: '.',
  testRegex: '.spec.ts$',
  transform: {
    '^.+\\.(t|j)s$': [
      '@swc/jest',
      {
        jsc: {
          parser: {
            syntax: 'typescript',
            decorators: true,
          },
          transform: {
            legacyDecorator: true,
            decoratorMetadata: true, 
          },
        },
      },
    ],
  },
  collectCoverageFrom: [
    '**/*.(t|j)s',
    '!main.(t|j)s',
    '!**/*.module.(t|j)s',
    '!**/*.dto.(t|j)s',
    '!**/*.entity.(t|j)s',
    '!**/*.args.(t|j)s',
    '!**/*.types.(t|j)s',
    '!**/node_modules/**',
  ],
  coverageDirectory: '../coverage',
  testEnvironment: 'node',
  moduleNameMapper: {
    '^src/(.*)$': '<rootDir>/src/$1',
    '^test/(.*)$': '<rootDir>/test/$1',
    '@factories/(.*)$': '<rootDir>/test/factories/$1',
    '@domains/(.*)$': '<rootDir>/src/domains/$1',
    '@common/(.*)$': '<rootDir>/src/common/$1',
    '@core/(.*)$': '<rootDir>/src/core/$1',
  },
};