/**
 * Text utility functions for consistent formatting
 */

/**
 * Converts a string to Title Case
 * @param s - The string to convert
 * @returns The string in Title Case
 */
export const toTitleCase = (s: string): string => {
  return s.replace(/\w\S*/g, (txt) => 
    txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
  );
};

/**
 * Truncates text to a specified length with ellipsis
 * @param text - The text to truncate
 * @param maxLength - Maximum length before truncation
 * @returns Truncated text with ellipsis if needed
 */
export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength).trim() + '...';
};

