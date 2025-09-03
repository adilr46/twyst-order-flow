/**
 * Development logging utility for debugging checkout flow
 * Logs with timestamp and scope for easy tracing
 */
export function devLog(scope: string, data?: unknown): void {
  const timestamp = new Date().toISOString().split('T')[1].split('.')[0]; // HH:MM:SS
  const prefix = `[${timestamp}] [${scope}]`;
  
  if (data !== undefined) {
    console.log(prefix, data);
  } else {
    console.log(prefix);
  }
}


