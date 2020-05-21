module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  moduleNameMapper: {
    '^main$': '<rootDir>/src/main/index.ts',
    '^main/(.*)$': '<rootDir>/src/main/$1',
  },
  testPathIgnorePatterns: ["/build/", "/node_modules/"]
};