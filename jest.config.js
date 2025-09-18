export default {
  // Test environment for DOM testing
  testEnvironment: 'jsdom',
  
  // Support ES modules
  preset: 'es2022',
  transform: {},
  extensionsToTreatAsEsm: ['.js'],
  
  // Test file patterns
  testMatch: [
    '**/__tests__/**/*.js',
    '**/*.test.js',
    '**/*.spec.js'
  ],
  
  // Coverage settings
  collectCoverageFrom: [
    'static/modules/**/*.js',
    '!static/modules/**/*.test.js',
    '!static/modules/**/*.spec.js'
  ],
  
  // Setup files
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  
  // Module paths
  roots: ['<rootDir>'],
  moduleDirectories: ['node_modules', '<rootDir>'],
  
  // Global setup
  globals: {
    'ts-jest': {
      useESM: true
    }
  },
  
  // Verbose output
  verbose: true
};