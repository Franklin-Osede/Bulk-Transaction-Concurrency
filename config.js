const fs = require('fs');
const path = require('path');

/**
 * Loads and validates configuration from a file
 * @param {string} configPath - Path to the configuration file
 * @returns {Object} - Configuration object
 */
function loadConfig(configPath) {
  try {
    const content = fs.readFileSync(configPath, 'utf8');
    const config = {};

    // Parse config file content
    content.split('\n').forEach(line => {
      const trimmedLine = line.trim();
      if (trimmedLine && !trimmedLine.startsWith('#')) {
        const [key, value] = trimmedLine.split('=');
        if (key && value) {
          config[key.trim()] = value.trim();
        }
      }
    });

    // Validate required config values
    validateConfig(config);

    // Apply defaults
    config.TEST_SIZE = config.TEST_SIZE ? parseInt(config.TEST_SIZE, 10) : 1;
    config.TOKEN_AMOUNT = config.TOKEN_AMOUNT ? parseInt(config.TOKEN_AMOUNT, 10) : 1;

    return config;
  } catch (error) {
    throw new Error(`Error loading configuration: ${error.message}`);
  }
}

/**
 * Validates that required configuration values are present
 * @param {Object} config - Configuration object
 */
function validateConfig(config) {
  const requiredFields = ['API_URL', 'USER_EMAIL', 'PROJECT_NAME'];
  const missing = requiredFields.filter(field => !config[field]);

  if (missing.length > 0) {
    throw new Error(`Missing required configuration values: ${missing.join(', ')}`);
  }
}

module.exports = { loadConfig }; 