/**
 * Global debug configuration
 * Set DEBUG_MODE to true to enable console logging throughout the application
 * Set DEBUG_MODE to false to disable all debug output for production
 */
export const DEBUG_MODE = false;

/**
 * Debug logger that respects the global DEBUG_MODE setting
 * @param message - The message to log
 * @param data - Optional data to log with the message
 */
export function debugLog(message: string, data?: any): void {
  if (DEBUG_MODE) {
    if (data !== undefined) {
      console.log(message, data);
    } else {
      console.log(message);
    }
  }
}

/**
 * Debug error logger that respects the global DEBUG_MODE setting
 * @param message - The error message to log
 * @param error - Optional error object to log
 */
export function debugError(message: string, error?: any): void {
  if (DEBUG_MODE) {
    if (error !== undefined) {
      console.error(message, error);
    } else {
      console.error(message);
    }
  }
}

/**
 * Debug warning logger that respects the global DEBUG_MODE setting
 * @param message - The warning message to log
 * @param data - Optional data to log with the warning
 */
export function debugWarn(message: string, data?: any): void {
  if (DEBUG_MODE) {
    if (data !== undefined) {
      console.warn(message, data);
    } else {
      console.warn(message);
    }
  }
}