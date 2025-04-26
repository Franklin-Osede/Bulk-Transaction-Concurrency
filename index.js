#!/usr/bin/env node

const path = require('path');
const yargs = require('yargs/yargs');
const { hideBin } = require('yargs/helpers');
const { loadConfig } = require('./config');
const { runSimulation } = require('./investments');
const logger = require('./logger');
const dotenv = require('dotenv');

/**
 * Parse command-line arguments
 */
function parseArgs() {
  return yargs(hideBin(process.argv))
    .usage('Usage: $0 --config <archivo> [--checkAmount] [--checkTokens] [--debug] [--multiUser] [--help]')
    .option('config', {
      alias: 'c',
      describe: 'Specifies the configuration file to use',
      type: 'string',
      demandOption: true
    })
    .option('checkAmount', {
      alias: 'a',
      describe: 'Verifies the account balance before each investment',
      type: 'boolean',
      default: false
    })
    .option('checkTokens', {
      alias: 't',
      describe: 'Verifies the available tokens in the project before each investment',
      type: 'boolean',
      default: false
    })
    .option('--debug', {
      describe: 'Show error traces for requests',
      type: 'boolean',
      default: false
    })
    .option('multiUser', {
      alias: 'm',
      describe: 'Simulates different users for each purchase (for testing only)',
      type: 'boolean',
      default: false
    })
    .help()
    .alias('help', 'h')
    .argv;
}

/**
 * Main function
 */
async function main() {
  try {
    const argv = parseArgs();
    const configPath = argv.config;

    // Set debug mode in logger
    logger.setDebugMode(argv.debug);

    // Load configuration
    const config = await loadConfig(configPath);
    logger.debug(`Loaded configuration: ${configPath}`, logger.getDebugMode());
    logger.debug(config, logger.getDebugMode());

    // Set environment variables from config
    if (config.MANGOPAY_CLIENT_ID) {
      process.env.MANGOPAY_CLIENT_ID = config.MANGOPAY_CLIENT_ID;
      process.env.MANGOPAY_APIKEY = config.MANGOPAY_APIKEY;
      process.env.MANGOPAY_BASE_URL = config.MANGOPAY_BASE_URL;
    }

    // Set Basic Auth environment variables
    if (config.BASIC_USER) {
      process.env.BASIC_USER = config.BASIC_USER;
      process.env.BASIC_PASSWORD = config.BASIC_PASSWORD;
    }

    // Mostrar advertencia si se usa multiUser
    if (argv.multiUser) {
      logger.warn('Multi-user mode activated: generating random user IDs for each purchase. This is for testing only!');
    }

    // Before running the simulation
    logger.debug(`Starting simulation with parameters: checkAmount=${argv.checkAmount}, checkTokens=${argv.checkTokens}, multiUser=${argv.multiUser}`, logger.getDebugMode());

    // Run simulation
    const options = {
      checkAmount: argv.checkAmount,
      checkTokens: argv.checkTokens,
      debug: argv.debug,
      multiUser: argv.multiUser
    };

    await runSimulation(config, options);

    process.exit(0);
  } catch (error) {
    logger.error(`Failed to run simulation: ${error.message}`);
    if (logger.getDebugMode()) {
      console.error(error);
    }
    process.exit(1);
  }
}

// Run the main function
main(); 