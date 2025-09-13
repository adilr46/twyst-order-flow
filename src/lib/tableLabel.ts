/**
 * Utility function to normalize table labels and prevent "Table Table x" issues
 */
export function formatTableLabel(raw?: string | number): string {
  // Handle undefined/null/empty values
  if (!raw) return "Table ?";
  
  // Convert to string and trim whitespace
  let s = String(raw).trim();
  
  // Remove "Table " prefix if it exists (case-insensitive)
  s = s.replace(/^table\s+/i, '');
  
  // If it's digits-only, return "Table {digits}"
  if (/^\d+$/.test(s)) {
    return `Table ${s}`;
  }
  
  // For non-numeric labels (e.g., "A1", "Booth 7"), return "Table {label}"
  return `Table ${s}`;
}



