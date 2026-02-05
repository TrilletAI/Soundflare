// src/lib/trillet-evals-crypto.ts
import crypto from 'crypto'

// Lazy-loaded encryption key (generated on first use, not at import time)
let _key: Buffer | null = null

function getKey(): Buffer {
  if (_key) return _key

  const TRILLET_EVALS_MASTER_KEY = process.env.TRILLET_EVALS_MASTER_KEY
  if (!TRILLET_EVALS_MASTER_KEY) {
    throw new Error('TRILLET_EVALS_MASTER_KEY environment variable is required')
  }

  // Generate the encryption key using scrypt
  // Using 'trillet_evals_salt' to ensure uniqueness for the new brand
  _key = crypto.scryptSync(TRILLET_EVALS_MASTER_KEY, 'trillet_evals_salt', 32)
  return _key
}

/**
 * Encrypts a string using AES-256-GCM with TRILLET_EVALS_MASTER_KEY
 * @param text - The text to encrypt
 * @returns The encrypted text with IV and auth tag (format: iv:authTag:encryptedData)
 */
export function encryptWithTrilletKey(text: string): string {
  try {
    // Generate a random initialization vector
    const iv = crypto.randomBytes(16)
    
    // Create cipher
    const cipher = crypto.createCipheriv('aes-256-gcm', getKey(), iv)
    
    // Encrypt the text
    let encrypted = cipher.update(text, 'utf8', 'hex')
    encrypted += cipher.final('hex')
    
    // Get the authentication tag
    const authTag = cipher.getAuthTag()
    
    // Combine IV, auth tag, and encrypted data
    return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`
  } catch (error) {
    console.error('❌ SoundFlare encryption error:', error)
    throw new Error('Failed to encrypt data with SoundFlare master key')
  }
}

/**
 * Decrypts a string that was encrypted with encryptWithTrilletKey
 * @param encryptedText - The encrypted text (format: iv:authTag:encryptedData)
 * @returns The decrypted plain text
 */
export function decryptWithTrilletKey(encryptedText: string): string {
  try {
    // Split the encrypted text into its components
    const parts = encryptedText.split(':')
    
    if (parts.length !== 3) {
      throw new Error('Invalid encrypted text format')
    }
    
    const [ivHex, authTagHex, encrypted] = parts
    
    // Convert hex strings back to buffers
    const iv = Buffer.from(ivHex, 'hex')
    const authTag = Buffer.from(authTagHex, 'hex')
    
    // Create decipher
    const decipher = crypto.createDecipheriv('aes-256-gcm', getKey(), iv)
    decipher.setAuthTag(authTag)
    
    // Decrypt the text
    let decrypted = decipher.update(encrypted, 'hex', 'utf8')
    decrypted += decipher.final('utf8')
    
    return decrypted
  } catch (error) {
    console.error('❌ SoundFlare decryption error:', error)
    throw new Error('Failed to decrypt data with SoundFlare master key - invalid key or corrupted data')
  }
}
