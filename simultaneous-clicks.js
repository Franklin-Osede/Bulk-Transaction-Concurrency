#!/usr/bin/env node

const fs = require('fs').promises;
const yargs = require('yargs/yargs');
const { hideBin } = require('yargs/helpers');
const { makePurchase } = require('./investments');
const logger = require('./logger');

/**
 * Simula el comportamiento real de producción donde múltiples usuarios
 * hacen clic en el botón de reserva al mismo tiempo
 */

/**
 * Parse command-line arguments
 */
function parseArgs() {
  return yargs(hideBin(process.argv))
    .usage('Usage: $0 --config <archivo.json> [--project <project_id>] [--tokens <token_amount>] [--users <num_users>] [--delay <ms>] [--burst <ms>] [--debug] [--help]')
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
      describe: 'Cantidad de tokens por compra',
      type: 'number',
      default: 1
    })
    .option('users', {
      alias: 'u',
      describe: 'Número de usuarios que participarán en la simulación simultánea',
      type: 'number',
      default: 0 // 0 = todos los usuarios del config
    })
    .option('delay', {
      alias: 'd',
      describe: 'Delay aleatorio entre clics (en ms) para simular comportamiento humano',
      type: 'number',
      default: 100
    })
    .option('burst', {
      alias: 'b',
      describe: 'Ventana de tiempo para clics simultáneos (en ms) - simula usuarios haciendo clic "al mismo tiempo"',
      type: 'number',
      default: 2000
    })
    .option('debug', {
      describe: 'Mostrar información de depuración detallada',
      type: 'boolean',
      default: false
    })
    .help()
    .alias('help', 'h')
    .argv;
}

/**
 * Carga la configuración de usuarios
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
 * Genera un delay aleatorio para simular comportamiento humano
 */
function getRandomDelay(maxDelay) {
  return Math.random() * maxDelay;
}

/**
 * Simula un usuario haciendo clic en el botón de reserva
 */
async function simulateUserClick(user, config, options) {
  const startTime = Date.now();
  
  try {
    if (options.debug) {
      console.log(`🖱️  [${user.email}] Haciendo clic en botón de reserva...`);
    }

    const result = await makePurchase(
      config.api_url,
      user.email,
      config.project_name,
      options.tokens,
      options.debug,
      user.id,
      user.wallet
    );

    const endTime = Date.now();
    const responseTime = endTime - startTime;

    return {
      user: user.email,
      success: result.success,
      responseTime,
      timestamp: startTime,
      error: result.error || null,
      data: result.data || null
    };

  } catch (error) {
    const endTime = Date.now();
    const responseTime = endTime - startTime;

    return {
      user: user.email,
      success: false,
      responseTime,
      timestamp: startTime,
      error: error.message,
      data: null
    };
  }
}

/**
 * Simula múltiples usuarios haciendo clic simultáneamente
 */
async function simulateSimultaneousClicks(users, config, options) {
  const results = [];
  const burstWindow = options.burst; // Ventana de tiempo para clics "simultáneos"
  const maxDelay = options.delay; // Delay máximo entre clics
  
  logger.info(`🚀 Iniciando simulación de clics simultáneos`);
  logger.info(`👥 Usuarios: ${users.length}`);
  logger.info(`⏱️  Ventana de clics simultáneos: ${burstWindow}ms`);
  logger.info(`🎯 Tokens por compra: ${options.tokens}`);
  logger.info(`📊 Proyecto: ${config.project_name}`);

  // Crear array de promesas para simular clics simultáneos
  const clickPromises = users.map((user, index) => {
    // Cada usuario hace clic en un momento ligeramente diferente dentro de la ventana
    const clickDelay = getRandomDelay(maxDelay);
    
    return new Promise((resolve) => {
      setTimeout(async () => {
        const result = await simulateUserClick(user, config, options);
        resolve(result);
      }, clickDelay);
    });
  });

  // Ejecutar todos los clics "simultáneamente" dentro de la ventana de tiempo
  const startTime = Date.now();
  logger.info(`⏰ Iniciando clics simultáneos a las ${new Date().toISOString()}`);
  
  const clickResults = await Promise.all(clickPromises);
  
  const endTime = Date.now();
  const totalTime = endTime - startTime;

  // Analizar resultados
  const analysis = analyzeResults(clickResults, totalTime);
  
  return {
    results: clickResults,
    analysis,
    totalTime,
    startTime,
    endTime
  };
}

/**
 * Analiza los resultados de la simulación
 */
function analyzeResults(results, totalTime) {
  const successful = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);
  
  const responseTimes = results.map(r => r.responseTime);
  const avgResponseTime = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
  const minResponseTime = Math.min(...responseTimes);
  const maxResponseTime = Math.max(...responseTimes);
  
  // Detectar posibles race conditions
  const concurrentRequests = results.filter(r => {
    const timeDiff = Math.abs(r.timestamp - results[0].timestamp);
    return timeDiff < 100; // Requests dentro de 100ms se consideran concurrentes
  });

  // Agrupar errores por tipo
  const errorGroups = {};
  failed.forEach(result => {
    const errorType = result.error || 'Unknown error';
    errorGroups[errorType] = (errorGroups[errorType] || 0) + 1;
  });

  return {
    total: results.length,
    successful: successful.length,
    failed: failed.length,
    successRate: (successful.length / results.length) * 100,
    avgResponseTime: Math.round(avgResponseTime),
    minResponseTime,
    maxResponseTime,
    concurrentRequests: concurrentRequests.length,
    errorGroups,
    throughput: results.length / (totalTime / 1000) // requests per second
  };
}

/**
 * Genera un reporte detallado de la simulación
 */
function generateReport(simulationResult) {
  const { analysis, totalTime, startTime, endTime } = simulationResult;
  
  console.log('\n' + '='.repeat(60));
  console.log('📊 REPORTE DE SIMULACIÓN DE CLICS SIMULTÁNEOS');
  console.log('='.repeat(60));
  
  console.log(`⏰ Tiempo total de simulación: ${totalTime}ms`);
  console.log(`📅 Inicio: ${new Date(startTime).toISOString()}`);
  console.log(`📅 Fin: ${new Date(endTime).toISOString()}`);
  
  console.log('\n📈 MÉTRICAS DE RENDIMIENTO:');
  console.log(`   Total requests: ${analysis.total}`);
  console.log(`   Exitosos: ${analysis.successful} (${analysis.successRate.toFixed(2)}%)`);
  console.log(`   Fallidos: ${analysis.failed}`);
  console.log(`   Throughput: ${analysis.throughput.toFixed(2)} requests/segundo`);
  
  console.log('\n⏱️  TIEMPOS DE RESPUESTA:');
  console.log(`   Promedio: ${analysis.avgResponseTime}ms`);
  console.log(`   Mínimo: ${analysis.minResponseTime}ms`);
  console.log(`   Máximo: ${analysis.maxResponseTime}ms`);
  
  console.log('\n🔄 CONCURRENCIA:');
  console.log(`   Requests concurrentes: ${analysis.concurrentRequests}`);
  
  if (Object.keys(analysis.errorGroups).length > 0) {
    console.log('\n❌ ERRORES ENCONTRADOS:');
    Object.entries(analysis.errorGroups).forEach(([error, count]) => {
      console.log(`   "${error}": ${count} ocurrencias`);
    });
  }
  
  console.log('\n🎯 ANÁLISIS DE STRESS TESTING:');
  if (analysis.successRate >= 95) {
    console.log('   ✅ Sistema maneja bien la carga simultánea');
  } else if (analysis.successRate >= 80) {
    console.log('   ⚠️  Sistema muestra algunos problemas bajo carga');
  } else {
    console.log('   ❌ Sistema tiene problemas serios con carga simultánea');
  }
  
  if (analysis.concurrentRequests > analysis.total * 0.5) {
    console.log('   🔥 Alta concurrencia detectada - posible race condition');
  }
  
  console.log('='.repeat(60));
}

/**
 * Función principal
 */
async function main() {
  try {
    const argv = parseArgs();
    
    // Configurar modo debug
    logger.setDebugMode(argv.debug);
    
    // Cargar configuración
    const config = await loadUserConfig(argv.config);
    
    // Sobreescribir valores si se proporcionan como argumentos
    if (argv.project) config.project_name = argv.project;
    
    // Seleccionar usuarios para la simulación
    let users = config.users;
    if (argv.users > 0 && argv.users < users.length) {
      users = users.slice(0, argv.users);
      logger.info(`Usando solo los primeros ${argv.users} usuarios para la simulación`);
    }
    
    if (!users || users.length === 0) {
      throw new Error('No se encontraron usuarios en la configuración');
    }
    
    logger.info(`🎯 Simulando clics simultáneos de ${users.length} usuarios`);
    logger.info(`📊 Proyecto: ${config.project_name}`);
    logger.info(`🎫 Tokens por compra: ${argv.tokens}`);
    
    // Ejecutar simulación
    const simulationResult = await simulateSimultaneousClicks(users, config, {
      tokens: argv.tokens,
      delay: argv.delay,
      burst: argv.burst,
      debug: argv.debug
    });
    
    // Generar reporte
    generateReport(simulationResult);
    
    process.exit(0);
    
  } catch (error) {
    logger.error(`Error en la simulación: ${error.message}`);
    if (logger.getDebugMode()) {
      console.error(error);
    }
    process.exit(1);
  }
}

// Ejecutar la función principal
main();
