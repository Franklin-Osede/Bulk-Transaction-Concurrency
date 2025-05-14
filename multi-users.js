#!/usr/bin/env node

const fs = require('fs').promises;
const path = require('path');
const yargs = require('yargs/yargs');
const { hideBin } = require('yargs/helpers');
const { makePurchase } = require('./investments');
const logger = require('./logger');

/**
 * Parse command-line arguments
 */
function parseArgs() {
  return yargs(hideBin(process.argv))
    .usage('Usage: $0 --config <archivo.json> [--project <project_id>] [--tokens <token_amount>] [--size <test_size>] [--debug] [--concurrent <num>] [--help]')
    .option('config', {
      alias: 'c',
      describe: 'Archivo JSON de configuración con múltiples usuarios',
      type: 'string',
      default: 'users-config.json'
    })
    .option('project', {
      alias: 'p',
      describe: 'ID del proyecto (sobreescribe el valor en el archivo de configuración)',
      type: 'string'
    })
    .option('tokens', {
      alias: 't',
      describe: 'Cantidad de tokens por compra (sobreescribe el valor en el archivo de configuración)',
      type: 'number'
    })
    .option('size', {
      alias: 's',
      describe: 'Número de compras por usuario (sobreescribe el valor en el archivo de configuración)',
      type: 'number'
    })
    .option('debug', {
      alias: 'd',
      describe: 'Mostrar información de depuración',
      type: 'boolean',
      default: false
    })
    .option('concurrent', {
      alias: 'n',
      describe: 'Número máximo de usuarios concurrentes (0 para todos)',
      type: 'number',
      default: 0
    })
    .help()
    .alias('help', 'h')
    .argv;
}

/**
 * Carga la configuración de usuarios desde un archivo JSON
 * @param {string} configPath - Ruta al archivo de configuración
 * @returns {Promise<Object>} - Configuración cargada
 */
async function loadUserConfig(configPath) {
  try {
    const data = await fs.readFile(configPath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    throw new Error(`Error al cargar la configuración: ${error.message}`);
  }
}

/**
 * Realiza compras para un usuario específico
 * @param {Object} user - Datos del usuario
 * @param {Object} config - Configuración general
 * @param {Object} options - Opciones adicionales
 * @returns {Promise<Object>} - Resultados de las compras
 */
async function processUserPurchases(user, config, options) {
  const results = {
    email: user.email,
    total: config.test_size,
    successful: 0,
    failed: 0,
    errors: []
  };

  // Usar el token_amount específico del usuario si existe, o el global si no
  const tokenAmount = user.token_amount !== undefined ? user.token_amount : config.token_amount;

  logger.info(`Iniciando compras para usuario: ${user.email}`);
  logger.info(`Total compras: ${results.total}, Tokens por compra: ${tokenAmount}`);

  // Realizar compras secuencialmente para este usuario
  for (let i = 0; i < results.total; i++) {
    try {
      if (options.debug) {
        console.log(`\n\n=========== ${user.email}: COMPRA ${i + 1}/${results.total} ===========`);
        console.log(`Token amount: ${tokenAmount}`);
      }

      const result = await makePurchase(
        config.api_url,
        user.email,
        config.project_name,
        tokenAmount,
        options.debug,
        user.id,
        user.wallet
      );

      if (result.success) {
        results.successful++;
        logger.info(`[${user.email}] Compra ${i + 1}/${results.total}: Éxito (${tokenAmount} tokens)`);
      } else {
        results.failed++;
        results.errors.push({ index: i + 1, error: result.error });
        logger.error(`[${user.email}] Compra ${i + 1}/${results.total}: Fallida - ${result.error}`);
      }

      // Añadir un pequeño retraso entre compras para evitar sobrecarga
      await new Promise(resolve => setTimeout(resolve, 300));
    } catch (error) {
      results.failed++;
      results.errors.push({ index: i + 1, error: error.message });
      logger.error(`[${user.email}] Compra ${i + 1}/${results.total}: Error - ${error.message}`);
    }
  }

  return results;
}

/**
 * Ejecuta compras para múltiples usuarios en paralelo con límite de concurrencia
 * @param {Array} users - Lista de usuarios
 * @param {Object} config - Configuración general
 * @param {Object} options - Opciones adicionales
 * @returns {Promise<Array>} - Resultados por usuario
 */
async function runParallelPurchases(users, config, options) {
  const results = [];
  const maxConcurrent = options.concurrent > 0 ? options.concurrent : users.length;

  // Procesar usuarios en lotes
  for (let i = 0; i < users.length; i += maxConcurrent) {
    const batch = users.slice(i, i + maxConcurrent);
    logger.info(`Procesando lote de ${batch.length} usuarios (${i + 1}-${Math.min(i + maxConcurrent, users.length)} de ${users.length})`);

    // Ejecutar compras para cada usuario del lote en paralelo
    const batchResults = await Promise.all(
      batch.map(user => processUserPurchases(user, config, options))
    );

    results.push(...batchResults);
  }

  return results;
}

/**
 * Función principal
 */
async function main() {
  try {
    const argv = parseArgs(); B

    // Configurar modo debug
    logger.setDebugMode(argv.debug);

    // Cargar configuración de usuarios
    const config = await loadUserConfig(argv.config);

    // Sobreescribir valores si se proporcionan como argumentos
    if (argv.project) config.project_name = argv.project;
    if (argv.tokens) {
      // Si se especifica --tokens, actualizar el valor global
      config.token_amount = argv.tokens;

      // Si se especifica --tokens y no es 0, sobrescribir todos los valores específicos de usuario
      if (argv.tokens > 0) {
        config.users.forEach(user => {
          user.token_amount = argv.tokens;
        });
        logger.info(`Sobrescribiendo token_amount para todos los usuarios: ${argv.tokens}`);
      }
    }
    if (argv.size) config.test_size = argv.size;

    if (!config.users || !Array.isArray(config.users) || config.users.length === 0) {
      throw new Error('No se encontraron usuarios en la configuración');
    }

    logger.info(`Cargados ${config.users.length} usuarios del archivo ${argv.config}`);
    logger.info(`Proyecto: ${config.project_name}, Token amount global: ${config.token_amount}, Compras por usuario: ${config.test_size}`);

    // Mostrar token_amount de cada usuario
    if (argv.debug) {
      config.users.forEach(user => {
        const tokenAmount = user.token_amount !== undefined ? user.token_amount : config.token_amount;
        logger.info(`Usuario ${user.email}: ${tokenAmount} tokens por compra`);
      });
    }

    // Ejecutar compras para todos los usuarios
    const startTime = Date.now();
    const results = await runParallelPurchases(config.users, config, {
      debug: argv.debug,
      concurrent: argv.concurrent
    });
    const totalTime = (Date.now() - startTime) / 1000;

    // Reporte final
    logger.info(`\n======= REPORTE FINAL =======`);
    logger.info(`Tiempo total: ${totalTime.toFixed(2)} segundos`);
    logger.info(`Usuarios procesados: ${results.length}`);

    let totalPurchases = 0;
    let totalSuccessful = 0;
    let totalFailed = 0;

    results.forEach(result => {
      const userTotal = result.successful + result.failed;
      totalPurchases += userTotal;
      totalSuccessful += result.successful;
      totalFailed += result.failed;

      logger.info(`${result.email}: ${result.successful} exitosas, ${result.failed} fallidas (${userTotal} total)`);
    });

    logger.info(`\nTotal transacciones: ${totalPurchases}`);
    logger.info(`Exitosas: ${totalSuccessful} (${(totalSuccessful / totalPurchases * 100).toFixed(2)}%)`);
    logger.info(`Fallidas: ${totalFailed} (${(totalFailed / totalPurchases * 100).toFixed(2)}%)`);
    logger.info(`============================`);

    process.exit(0);
  } catch (error) {
    logger.error(`Error en la ejecución: ${error.message}`);
    if (logger.getDebugMode()) {
      console.error(error);
    }
    process.exit(1);
  }
}

// Ejecutar la función principal
main(); 