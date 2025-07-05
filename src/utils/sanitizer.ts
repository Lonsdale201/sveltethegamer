/**
 * Sanitizes user input by escaping HTML entities to prevent XSS attacks
 * @param input - The string to sanitize
 * @returns The sanitized string with HTML entities escaped
 */
export function sanitizeString(input: string): string {
  if (typeof input !== 'string') {
    return '';
  }
  
  return input
    .replace(/&/g, '&amp;')    // Must be first to avoid double-escaping
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;')
    .trim(); // Remove leading/trailing whitespace
}

/**
 * Validates and sanitizes a player name
 * @param name - The name to validate and sanitize
 * @param maxLength - Maximum allowed length (default: 12)
 * @returns The sanitized and truncated name
 */
export function sanitizePlayerName(name: string, maxLength: number = 12): string {
  const sanitized = sanitizeString(name);
  return sanitized.slice(0, maxLength);
}