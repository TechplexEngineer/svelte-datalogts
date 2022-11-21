module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  // transform: {
  //   '^.+\\.ts?$': 'ts-jest',
  // },

  //https://github.com/swc-project/jest/issues/64#issuecomment-1029753225
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },

  transformIgnorePatterns: ['<rootDir>/node_modules/'],

};