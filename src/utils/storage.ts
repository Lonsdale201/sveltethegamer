/**
 * Utility functions for localStorage operations
 */

const STORAGE_KEYS = {
  PLAYER_NAME: 'shadow_games_player_name'
} as const;

/**
 * Save player name to localStorage
 * @param name - The player name to save
 */
export function savePlayerName(name: string): void {
  try {
    if (typeof Storage !== 'undefined') {
      localStorage.setItem(STORAGE_KEYS.PLAYER_NAME, name);
    }
  } catch (error) {
    console.warn('Failed to save player name to localStorage:', error);
  }
}

/**
 * Load player name from localStorage
 * @returns The saved player name or empty string if not found
 */
export function loadPlayerName(): string {
  try {
    if (typeof Storage !== 'undefined') {
      return localStorage.getItem(STORAGE_KEYS.PLAYER_NAME) || '';
    }
  } catch (error) {
    console.warn('Failed to load player name from localStorage:', error);
  }
  return '';
}

/**
 * Clear player name from localStorage
 */
export function clearPlayerName(): void {
  try {
    if (typeof Storage !== 'undefined') {
      localStorage.removeItem(STORAGE_KEYS.PLAYER_NAME);
    }
  } catch (error) {
    console.warn('Failed to clear player name from localStorage:', error);
  }
}