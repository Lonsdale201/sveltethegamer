/**
 * Sanitizes user input by removing/escaping dangerous characters
 * @param input - The string to sanitize
 * @returns The sanitized string
 */
export function sanitizeString(input: string): string {
  if (typeof input !== 'string') {
    return '';
  }
  
  return input
    // Remove HTML tags completely
    .replace(/<[^>]*>/g, '')
    // Remove script-related content
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '')
    // Escape remaining special characters
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;')
    // Remove control characters and non-printable characters
    .replace(/[\x00-\x1F\x7F-\x9F]/g, '')
    .trim();
}

/**
 * Validates if a string contains only safe characters for player names
 * @param input - The string to validate
 * @returns True if the string is safe
 */
export function isValidPlayerName(input: string): boolean {
  if (typeof input !== 'string' || input.trim().length === 0) {
    return false;
  }
  
  // Only allow letters, numbers, spaces, and basic punctuation
  const allowedPattern = /^[a-zA-Z0-9\s\-_\.áéíóöőúüűÁÉÍÓÖŐÚÜŰ]+$/;
  
  // Check for dangerous patterns
  const dangerousPatterns = [
    /<[^>]*>/,           // HTML tags
    /javascript:/i,       // JavaScript protocol
    /on\w+\s*=/i,        // Event handlers
    /script/i,           // Script keyword
    /eval\s*\(/i,        // Eval function
    /expression\s*\(/i,  // CSS expression
    /vbscript:/i,        // VBScript protocol
    /data:/i,            // Data protocol
    /&#/,                // HTML entities
    /&\w+;/              // Named HTML entities
  ];
  
  // Check if input matches allowed pattern and doesn't contain dangerous patterns
  return allowedPattern.test(input.trim()) && 
         !dangerousPatterns.some(pattern => pattern.test(input));
}

/**
 * Validates and sanitizes a player name with strict rules
 * @param name - The name to validate and sanitize
 * @param maxLength - Maximum allowed length (default: 12)
 * @returns The sanitized and truncated name, or empty string if invalid
 */
export function sanitizePlayerName(name: string, maxLength: number = 12): string {
  if (typeof name !== 'string') {
    return '';
  }
  
  // First sanitize the input
  const sanitized = sanitizeString(name);
  
  // Then validate if it's safe
  if (!isValidPlayerName(sanitized)) {
    return '';
  }
  
  // Truncate to max length
  const truncated = sanitized.slice(0, maxLength).trim();
  
  // Final validation after truncation
  if (!isValidPlayerName(truncated)) {
    return '';
  }
  
  return truncated;
}

/**
 * Validates player name length
 * @param name - The name to validate
 * @param maxLength - Maximum allowed length
 * @returns True if length is valid
 */
export function isValidNameLength(name: string, maxLength: number = 12): boolean {
  return typeof name === 'string' && 
         name.trim().length > 0 && 
         name.trim().length <= maxLength;
}