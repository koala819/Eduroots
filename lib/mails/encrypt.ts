import crypto from 'crypto'

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY

if (!ENCRYPTION_KEY) {
  throw new Error('ENCRYPTION_KEY is not set')
}

export function encrypt(text: string): string {
  const iv = crypto.randomBytes(16)
  const key = deriveKey(ENCRYPTION_KEY!)
  const cipher = crypto.createCipheriv('aes-256-cbc', key, iv)
  let encrypted = cipher.update(text, 'utf8', 'hex')
  encrypted += cipher.final('hex')
  return `${iv.toString('hex')}:${encrypted}`
}

export function decrypt(text: string): string {
  const parts = text.split(':')
  if (parts.length !== 2) {
    console.error('Invalid encrypted text format')
    return '[Encrypted Content]'
  }

  const [ivHex, encryptedHex] = parts
  const iv = Buffer.from(ivHex, 'hex')
  const key = deriveKey(ENCRYPTION_KEY!)

  try {
    const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv)
    let decrypted = decipher.update(encryptedHex, 'hex', 'utf8')
    decrypted += decipher.final('utf8')
    return decrypted
  } catch (error) {
    console.error('Decryption failed:', error)
    return '[Encrypted Content]'
  }
}

// Function to derive a 32-byte key from the provided key
function deriveKey(key: string): Buffer {
  return crypto.scryptSync(key, 'salt', 32)
}

export function isValidEncryptedFormat(text: string): boolean {
  const parts = text.split(':')
  return (
    parts.length === 2 &&
    /^[a-f0-9]+$/.test(parts[0]) &&
    /^[a-f0-9]+$/.test(parts[1])
  )
}
