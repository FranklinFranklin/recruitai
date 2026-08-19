import crypto from 'crypto';

// The master encryption key must be exactly 32 bytes (256 bits) for AES-256
// In production, this should be injected via environment variables (e.g., from AWS KMS or Vercel Secrets)
const getMasterKey = () => {
  const key = process.env.ENCRYPTION_KEY;
  if (!key || key.length !== 64) { // 64 hex chars = 32 bytes
    if (process.env.NODE_ENV === 'production') {
      throw new Error('CRITICAL: ENCRYPTION_KEY is missing or invalid in production environment.');
    }
    // Fallback for local development ONLY
    return crypto.createHash('sha256').update('local-dev-fallback-key-do-not-use').digest();
  }
  return Buffer.from(key, 'hex');
};

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const SALT_LENGTH = 64;
const TAG_LENGTH = 16;

/**
 * Encrypts a plain text string (like an OAuth token) using AES-256-GCM.
 * Returns a base64 encoded string containing the IV, ciphertext, and auth tag.
 */
export function encryptToken(text: string): string {
  if (!text) return text;
  
  const iv = crypto.randomBytes(IV_LENGTH);
  const salt = crypto.randomBytes(SALT_LENGTH);
  
  // We use pbkdf2 to derive the actual encryption key from the master key + salt
  const key = crypto.pbkdf2Sync(getMasterKey(), salt, 100000, 32, 'sha512');
  
  const cipher = crypto.createCipheriv(ALGORITHM, iv, key);
  
  let encrypted = cipher.update(text, 'utf8', 'base64');
  encrypted += cipher.final('base64');
  
  const authTag = cipher.getAuthTag();
  
  // Format: base64(salt) : base64(iv) : base64(authTag) : base64(ciphertext)
  return `${salt.toString('base64')}:${iv.toString('base64')}:${authTag.toString('base64')}:${encrypted}`;
}

/**
 * Decrypts a previously encrypted token string back to plain text.
 */
export function decryptToken(encryptedData: string): string {
  if (!encryptedData) return encryptedData;
  
  try {
    const parts = encryptedData.split(':');
    if (parts.length !== 4) throw new Error('Invalid encrypted token format');
    
    const salt = Buffer.from(parts[0], 'base64');
    const iv = Buffer.from(parts[1], 'base64');
    const authTag = Buffer.from(parts[2], 'base64');
    const encryptedText = parts[3];
    
    const key = crypto.pbkdf2Sync(getMasterKey(), salt, 100000, 32, 'sha512');
    
    const decipher = crypto.createDecipheriv(ALGORITHM, iv, key);
    decipher.setAuthTag(authTag);
    
    let decrypted = decipher.update(encryptedText, 'base64', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (error) {
    throw new Error('Failed to decrypt token. The master key may have changed or data is corrupted.');
  }
}
