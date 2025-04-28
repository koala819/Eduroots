// jest.config.dom.js
const nextJest = require('next/jest')

const createJestConfig = nextJest({
  dir: './',
})

const customJestConfig = {
  testEnvironment: 'jest-environment-jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
}

module.exports = createJestConfig(customJestConfig)
// import nextJest from 'next/jest'

// const createJestConfig = nextJest({
//   dir: './',
// })

// const config = {
//   setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
//   testEnvironment: 'jsdom',
//   testMatch: ['<rootDir>/app/__tests__/components/**/*.test.{jsx,tsx}'],
//   verbose: true,
// }

// export default createJestConfig(config)
