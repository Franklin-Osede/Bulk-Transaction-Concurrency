/**
 * Enhanced logging utility with configurable options
 */
const fs = require('fs');
const path = require('path');

const LOG_LEVELS = {
  ERROR: 0,
  WARN: 1,
  INFO: 2,
  DEBUG: 3
};

const LOG_LEVEL_NAMES = {
  0: 'ERROR',
  1: 'WARN',
  2: 'INFO',
  3: 'DEBUG'
};

// Default configuration
const DEFAULT_CONFIG = {
  level: LOG_LEVELS.INFO,
  enableConsole: true,
  enableFile: false,
  logFilePath: 'logs/app.log',
  logRotationSize: 5 * 1024 * 1024, // 5MB
  maxLogFiles: 5
};

// Current configuration
let config = { ...DEFAULT_CONFIG };

// Global debug flag
let isDebugMode = false;

/**
 * Get timestamp for log entry
 * @returns {string} - Formatted timestamp
 */
function getTimestamp() {
  return new Date().toISOString();
}

/**
 * Format a log message
 * @param {string} levelName - Log level name
 * @param {string} message - Log message
 * @returns {string} - Formatted log message
 */
function formatLogMessage(levelName, message) {
  return `[${getTimestamp()}] [${levelName}] ${message}`;
}

/**
 * Write log to file if file logging is enabled
 * @param {string} formattedMessage - Formatted log message
 */
function writeToLogFile(formattedMessage) {
  if (!config.enableFile) return;

  try {
    // Create directory if it doesn't exist
    const logDir = path.dirname(config.logFilePath);
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }

    // Append to log file with newline
    fs.appendFileSync(config.logFilePath, formattedMessage + '\n');

    // Check file size and rotate if needed
    const stats = fs.statSync(config.logFilePath);
    if (stats.size > config.logRotationSize) {
      rotateLogFiles();
    }
  } catch (err) {
    console.error(`Failed to write to log file: ${err.message}`);
  }
}

/**
 * Rotate log files
 */
function rotateLogFiles() {
  try {
    // Delete oldest log file if exists
    const oldestLog = `${config.logFilePath}.${config.maxLogFiles - 1}`;
    if (fs.existsSync(oldestLog)) {
      fs.unlinkSync(oldestLog);
    }

    // Shift all other log files
    for (let i = config.maxLogFiles - 2; i >= 0; i--) {
      const oldFile = i === 0 ? config.logFilePath : `${config.logFilePath}.${i}`;
      const newFile = `${config.logFilePath}.${i + 1}`;

      if (fs.existsSync(oldFile)) {
        fs.renameSync(oldFile, newFile);
      }
    }

    // Create new empty log file
    fs.writeFileSync(config.logFilePath, '');
  } catch (err) {
    console.error(`Failed to rotate log files: ${err.message}`);
  }
}

/**
 * Log a message at a specific level
 * @param {number} level - Log level
 * @param {string|object} messageOrObject - Log message or object
 */
function log(level, messageOrObject) {
  // Skip if log level is higher than configured level
  if (level > config.level) return;

  const levelName = LOG_LEVEL_NAMES[level];

  if (typeof messageOrObject === 'string') {
    const formattedMessage = formatLogMessage(levelName, messageOrObject);

    if (config.enableConsole) {
      switch (level) {
        case LOG_LEVELS.ERROR:
          console.error(formattedMessage);
          break;
        case LOG_LEVELS.WARN:
          console.warn(formattedMessage);
          break;
        case LOG_LEVELS.INFO:
          console.info(formattedMessage);
          break;
        case LOG_LEVELS.DEBUG:
          console.debug(formattedMessage);
          break;
      }
    }

    writeToLogFile(formattedMessage);
  } else {
    const formattedMessage = formatLogMessage(levelName, 'Detailed object information:');

    if (config.enableConsole) {
      switch (level) {
        case LOG_LEVELS.ERROR:
          console.error(formattedMessage);
          console.error(messageOrObject);
          break;
        case LOG_LEVELS.WARN:
          console.warn(formattedMessage);
          console.warn(messageOrObject);
          break;
        case LOG_LEVELS.INFO:
          console.info(formattedMessage);
          console.info(messageOrObject);
          break;
        case LOG_LEVELS.DEBUG:
          console.debug(formattedMessage);
          console.debug(messageOrObject);
          break;
      }
    }

    writeToLogFile(formattedMessage);
    writeToLogFile(JSON.stringify(messageOrObject, null, 2));
  }
}

/**
 * Log an error message
 * @param {string|object} messageOrObject - Error message or object
 */
function error(messageOrObject) {
  log(LOG_LEVELS.ERROR, messageOrObject);
}

/**
 * Log a warning message
 * @param {string|object} messageOrObject - Warning message or object
 */
function warn(messageOrObject) {
  log(LOG_LEVELS.WARN, messageOrObject);
}

/**
 * Log an info message
 * @param {string|object} messageOrObject - Info message or object
 */
function info(messageOrObject) {
  log(LOG_LEVELS.INFO, messageOrObject);
}

/**
 * Log a debug message or object
 * @param {string|object} messageOrObject - Debug message or object to log
 */
function debug(messageOrObject) {
  log(LOG_LEVELS.DEBUG, messageOrObject);
}

/**
 * Set global debug mode
 * @param {boolean} debugMode - Whether debug mode is enabled
 */
function setDebugMode(debugMode) {
  isDebugMode = !!debugMode;
  if (isDebugMode) {
    config.level = LOG_LEVELS.DEBUG;
  }
}

/**
 * Get current debug mode status
 * @returns {boolean} - Current debug mode status
 */
function getDebugMode() {
  return isDebugMode;
}

/**
 * Configure the logger
 * @param {Object} userConfig - User configuration
 */
function configure(userConfig = {}) {
  config = {
    ...DEFAULT_CONFIG,
    ...userConfig
  };

  // If level is provided as string, convert to number
  if (typeof config.level === 'string') {
    config.level = LOG_LEVELS[config.level.toUpperCase()] || DEFAULT_CONFIG.level;
  }

  debug(`Logger configured with: ${JSON.stringify(config)}`);
}

module.exports = {
  LOG_LEVELS,
  LOG_LEVEL_NAMES,
  error,
  warn,
  info,
  debug,
  setDebugMode,
  getDebugMode,
  configure
}; 