/**
 * Healthcare App Logger
 * 
 * A centralized logging utility that provides enhanced logging capabilities
 * with features like log levels, timestamps, and contextual information.
 */

// Log levels (in order of severity)
export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

// Configure the minimum log level (can be overridden by env vars)
const DEFAULT_LOG_LEVEL = LogLevel.DEBUG;

// Define colors for console output
const LOG_COLORS: Record<string, string> = {
  DEBUG: '\x1b[36m', // Cyan
  INFO: '\x1b[32m',  // Green
  WARN: '\x1b[33m',  // Yellow
  ERROR: '\x1b[31m', // Red
  RESET: '\x1b[0m',  // Reset
};

// Interface for log entry
interface LogEntry {
  timestamp: string;
  level: LogLevel;
  module: string;
  message: string;
  data?: any;
}

// Keep a history of recent logs in memory
const logHistory: LogEntry[] = [];
const MAX_LOG_HISTORY = 100;

/**
 * Get the minimum log level from environment variables or use default
 */
function getMinLogLevel(): LogLevel {
  if (typeof window !== 'undefined') {
    const envLevel = localStorage.getItem('LOG_LEVEL');
    if (envLevel && !isNaN(Number(envLevel))) {
      return Number(envLevel) as LogLevel;
    }
  }
  return DEFAULT_LOG_LEVEL;
}

/**
 * Format a log message with timestamp, level, and module
 */
function formatLogMessage(level: string, module: string, message: string): string {
  const timestamp = new Date().toISOString();
  const color = LOG_COLORS[level] || LOG_COLORS.RESET;
  return `${color}[${timestamp}] [${level}] [${module}] ${message}${LOG_COLORS.RESET}`;
}

/**
 * Add an entry to the log history
 */
function addToLogHistory(entry: LogEntry) {
  logHistory.push(entry);
  if (logHistory.length > MAX_LOG_HISTORY) {
    logHistory.shift(); // Remove oldest log
  }
}

/**
 * Create a logger instance for a specific module
 */
export function createLogger(module: string) {
  return {
    /**
     * Log a debug message
     */
    debug: (message: string, data?: any) => {
      if (getMinLogLevel() <= LogLevel.DEBUG) {
        const entry: LogEntry = {
          timestamp: new Date().toISOString(),
          level: LogLevel.DEBUG,
          module,
          message,
          data
        };
        addToLogHistory(entry);
        console.debug(formatLogMessage('DEBUG', module, message), data ? data : '');
      }
    },

    /**
     * Log an info message
     */
    info: (message: string, data?: any) => {
      if (getMinLogLevel() <= LogLevel.INFO) {
        const entry: LogEntry = {
          timestamp: new Date().toISOString(),
          level: LogLevel.INFO,
          module,
          message,
          data
        };
        addToLogHistory(entry);
        console.info(formatLogMessage('INFO', module, message), data ? data : '');
      }
    },

    /**
     * Log a warning message
     */
    warn: (message: string, data?: any) => {
      if (getMinLogLevel() <= LogLevel.WARN) {
        const entry: LogEntry = {
          timestamp: new Date().toISOString(),
          level: LogLevel.WARN,
          module,
          message,
          data
        };
        addToLogHistory(entry);
        console.warn(formatLogMessage('WARN', module, message), data ? data : '');
      }
    },

    /**
     * Log an error message
     */
    error: (message: string, error?: any) => {
      if (getMinLogLevel() <= LogLevel.ERROR) {
        const entry: LogEntry = {
          timestamp: new Date().toISOString(),
          level: LogLevel.ERROR,
          module,
          message,
          data: error
        };
        addToLogHistory(entry);
        console.error(formatLogMessage('ERROR', module, message), error ? error : '');
      }
    },
  };
}

/**
 * Get the log history
 */
export function getLogHistory(): LogEntry[] {
  return [...logHistory];
}

/**
 * Clear the log history
 */
export function clearLogHistory(): void {
  logHistory.length = 0;
}

/**
 * Set the minimum log level
 */
export function setLogLevel(level: LogLevel): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem('LOG_LEVEL', level.toString());
  }
}

/**
 * Export a default logger for quick access
 */
export default createLogger('app');
