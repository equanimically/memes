module.exports = {
  preset: 'ts-jest',
  testMatch: ['**/?(*.)+(test).ts'],
  reporters: ['default'],
  testEnvironment: 'node',
  maxWorkers: 1,
  verbose: true,
};
