import bcrypt from 'bcryptjs';

const SALT_ROUNDS = 10;

/**
 * Hash password using bcryptjs
 * @param password - Plain text password
 * @returns Hashed password
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

/**
 * Compare plain text password with hashed password
 * @param password - Plain text password
 * @param hashedPassword - Hashed password to compare against
 * @returns Boolean indicating if password matches
 */
export async function comparePassword(
  password: string,
  hashedPassword: string
): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword);
}

/**
 * Check if a string is a valid bcrypt hash
 * @param hash - String to check
 * @returns Boolean indicating if string is a bcrypt hash
 */
export function isBcryptHash(hash: string): boolean {
  if (!hash || typeof hash !== 'string') {
    return false;
  }
  // Bcrypt hashes start with $2a$, $2b$, $2x$, or $2y$ and are at least 60 characters
  return /^\$2[aby]\$\d{2}\$.{53}$/.test(hash);
}
