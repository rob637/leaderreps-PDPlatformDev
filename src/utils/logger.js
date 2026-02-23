// src/utils/logger.js
// PERFORMANCE FIX: Production-safe logging system
// In production, only ERROR and WARN levels are logged

const LOG_LEVELS = {
  ERROR: 0,
  WARN: 1, 
  INFO: 2,
  DEBUG: 3
};

// Check for production environment using Vite's env system
const isProduction = import.meta.env.PROD || import.meta.env.VITE_ENV === 'production';
const isDebugMode = import.meta.env.VITE_ENABLE_DEBUG_MODE === 'true';

class Logger {
  constructor() {
    // In production, only show WARN and ERROR unless debug mode is explicitly enabled
    this.level = isProduction && !isDebugMode ? LOG_LEVELS.WARN : LOG_LEVELS.DEBUG;
    this.prefix = '[LeaderReps]';
  }

  setLevel(level) {
    this.level = typeof level === 'string' ? LOG_LEVELS[level.toUpperCase()] : level;
  }

  error(message, ...args) {
    if (this.level >= LOG_LEVELS.ERROR) {
      console.error(`${this.prefix}[ERROR]`, message, ...args);
    }
  }

  warn(message, ...args) {
    if (this.level >= LOG_LEVELS.WARN) {
      console.warn(`${this.prefix}[WARN]`, message, ...args);
    }
  }

  info(message, ...args) {
    if (this.level >= LOG_LEVELS.INFO) {
      console.log(`${this.prefix}[INFO]`, message, ...args);
    }
  }

  debug(message, ...args) {
    if (this.level >= LOG_LEVELS.DEBUG) {
      console.log(`${this.prefix}[DEBUG]`, message, ...args);
    }
  }

  // Special method for user actions (always logged)
  userAction(action, context = {}) {
    console.log(`${this.prefix}[USER]`, action, context);
  }

  // Performance tracking
  time(label) {
    if (this.level >= LOG_LEVELS.DEBUG) {
      console.time(`${this.prefix}[PERF] ${label}`);
    }
  }

  timeEnd(label) {
    if (this.level >= LOG_LEVELS.DEBUG) {
      console.timeEnd(`${this.prefix}[PERF] ${label}`);
    }
  }
}

export const logger = new Logger();

// Convenience exports
export const { error, warn, info, debug, userAction, time, timeEnd } = logger;