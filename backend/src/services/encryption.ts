import crypto from 'crypto'
import os from 'os'

const ALGORITHM = 'aes-256-gcm'
const IV_LENGTH = 16
const AUTH_TAG_LENGTH = 16
const KEY_LENGTH = 32

function deriveEncryptionKey(): Buffer {
  // Derive key from environment secret + machine-specific data
  const secret = process.env.ENCRYPTION_SECRET || 'default-dev-secret-change-in-prod'
  const machineId = os.hostname() + os.userInfo().username

  // Use PBKDF2 to derive a strong key
  return crypto.pbkdf2Sync(secret, machineId, 100000, KEY_LENGTH, 'sha256')
}

export interface EncryptedData {
  encryptedData: Buffer
  iv: Buffer
  authTag: Buffer
}

export function encrypt(plaintext: string): EncryptedData {
  const key = deriveEncryptionKey()
  const iv = crypto.randomBytes(IV_LENGTH)

  const cipher = crypto.createCipheriv(ALGORITHM, key, iv)

  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()])

  const authTag = cipher.getAuthTag()

  return {
    encryptedData: encrypted,
    iv,
    authTag,
  }
}

export function decrypt(encryptedData: Buffer, iv: Buffer, authTag: Buffer): string {
  const key = deriveEncryptionKey()

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv)
  decipher.setAuthTag(authTag)

  const decrypted = Buffer.concat([decipher.update(encryptedData), decipher.final()])

  return decrypted.toString('utf8')
}

export function encryptObject<T>(obj: T): EncryptedData {
  return encrypt(JSON.stringify(obj))
}

export function decryptObject<T>(encryptedData: Buffer, iv: Buffer, authTag: Buffer): T {
  const json = decrypt(encryptedData, iv, authTag)
  return JSON.parse(json) as T
}
