// jest.setup.js
import '@testing-library/jest-dom'

// Mock fetch globalement
global.fetch = jest.fn()

// Mise en place de TextEncoder/TextDecoder pour Node.js
const { TextEncoder, TextDecoder } = require('util')
global.TextEncoder = TextEncoder
global.TextDecoder = TextDecoder

// Mock des objets Request/Response
global.Request = class {}
global.Response = class {}

// Fonction utilitaire pour nettoyer les mocks après chaque test
afterEach(() => {
  jest.clearAllMocks()
})
