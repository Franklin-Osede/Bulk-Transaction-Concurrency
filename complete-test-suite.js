#!/usr/bin/env node

const fs = require('fs').promises;
const { spawn } = require('child_process');
const yargs = require('yargs/yargs');
const { hideBin } = require('yargs/helpers');
const logger = require('./logger');

/**
 * Suite Completa de Testing de Concurrencia
 * Ejecuta todos los tests y genera un reporte consolidado
 */

/**
 * Parse command-line arguments
 */
function parseArgs() {
  return yargs(hideBin(process.argv))
    .usage('Usage: $0 --config <archivo.json> [--project <project_id>] [--tokens <token_amount>] [--debug] [--help]')
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
 * Ejecuta un script y retorna los resultados
 */
function runScript(scriptPath, args) {
  return new Promise((resolve, reject) => {
    const child = spawn('node', [scriptPath, ...args], {
      stdio: ['pipe', 'pipe', 'pipe']
    });
    
    let stdout = '';
    let stderr = '';
    
    child.stdout.on('data', (data) => {
      stdout += data.toString();
    });
    
    child.stderr.on('data', (data) => {
      stderr += data.toString();
    });
    
    child.on('close', (code) => {
      resolve({
        code,
        stdout,
        stderr,
        success: code === 0
      });
    });
    
    child.on('error', (error) => {
      reject(error);
    });
  });
}

/**
 * Extrae métricas del output de un script
 */
function extractMetrics(output, testType) {
  const metrics = {
    testType,
    timestamp: new Date().toISOString()
  };
  
  // Extraer métricas comunes
  const totalMatch = output.match(/Total requests?: (\d+)/i);
  if (totalMatch) metrics.totalRequests = parseInt(totalMatch[1]);
  
  const successfulMatch = output.match(/Exitosos?: (\d+)/i);
  if (successfulMatch) metrics.successfulRequests = parseInt(successfulMatch[1]);
  
  const failedMatch = output.match(/Fallidos?: (\d+)/i);
  if (failedMatch) metrics.failedRequests = parseInt(failedMatch[1]);
  
  const successRateMatch = output.match(/\((\d+\.?\d*)%\)/i);
  if (successRateMatch) metrics.successRate = parseFloat(successRateMatch[1]);
  
  const avgResponseMatch = output.match(/Promedio: (\d+)ms/i);
  if (avgResponseMatch) metrics.avgResponseTime = parseInt(avgResponseMatch[1]);
  
  const peakConcurrencyMatch = output.match(/Peak concurrencia: (\d+)/i);
  if (peakConcurrencyMatch) metrics.peakConcurrency = parseInt(peakConcurrencyMatch[1]);
  
  const raceConditionsMatch = output.match(/Detectados: (\d+)/i);
  if (raceConditionsMatch) metrics.raceConditions = parseInt(raceConditionsMatch[1]);
  
  const throughputMatch = output.match(/Throughput: (\d+\.?\d*) requests\/segundo/i);
  if (throughputMatch) metrics.throughput = parseFloat(throughputMatch[1]);
  
  return metrics;
}

/**
 * Ejecuta la suite completa de tests
 */
async function runCompleteTestSuite(config, options) {
  const results = [];
  const startTime = Date.now();
  
  logger.info('🚀 Iniciando Suite Completa de Testing de Concurrencia');
  logger.info('='.repeat(60));
  
  // Test 1: Clics Simultáneos
  logger.info('\n📋 Test 1: Simulación de Clics Simultáneos');
  logger.info('Simulando usuarios haciendo clic en el botón de reserva al mismo tiempo...');
  
  try {
    const args = [
      '--config', options.config,
      '--tokens', options.tokens.toString(),
      '--burst', '2000',
      '--delay', '100'
    ];
    
    if (options.project) args.push('--project', options.project);
    if (options.debug) args.push('--debug');
    
    const clickResult = await runScript('./simultaneous-clicks.js', args);
    const clickMetrics = extractMetrics(clickResult.stdout, 'simultaneous-clicks');
    clickMetrics.success = clickResult.success;
    results.push(clickMetrics);
    
    if (clickResult.success) {
      logger.info('✅ Test de clics simultáneos completado exitosamente');
    } else {
      logger.error('❌ Test de clics simultáneos falló');
    }
  } catch (error) {
    logger.error(`Error en test de clics simultáneos: ${error.message}`);
    results.push({
      testType: 'simultaneous-clicks',
      success: false,
      error: error.message
    });
  }
  
  // Pausa entre tests
  await new Promise(resolve => setTimeout(resolve, 3000));
  
  // Test 2: Stress Testing - Burst
  logger.info('\n📋 Test 2: Stress Testing - Escenario Burst');
  logger.info('Probando carga súbita de requests simultáneas...');
  
  try {
    const args = [
      '--config', options.config,
      '--scenario', 'burst',
      '--iterations', '3'
    ];
    
    if (options.project) args.push('--project', options.project);
    if (options.debug) args.push('--debug');
    
    const burstResult = await runScript('./stress-test.js', args);
    const burstMetrics = extractMetrics(burstResult.stdout, 'stress-burst');
    burstMetrics.success = burstResult.success;
    results.push(burstMetrics);
    
    if (burstResult.success) {
      logger.info('✅ Test de stress burst completado exitosamente');
    } else {
      logger.error('❌ Test de stress burst falló');
    }
  } catch (error) {
    logger.error(`Error en test de stress burst: ${error.message}`);
    results.push({
      testType: 'stress-burst',
      success: false,
      error: error.message
    });
  }
  
  // Pausa entre tests
  await new Promise(resolve => setTimeout(resolve, 3000));
  
  // Test 3: Stress Testing - Sustained
  logger.info('\n📋 Test 3: Stress Testing - Escenario Sustained');
  logger.info('Probando carga constante durante un período...');
  
  try {
    const args = [
      '--config', options.config,
      '--scenario', 'sustained',
      '--iterations', '2'
    ];
    
    if (options.project) args.push('--project', options.project);
    if (options.debug) args.push('--debug');
    
    const sustainedResult = await runScript('./stress-test.js', args);
    const sustainedMetrics = extractMetrics(sustainedResult.stdout, 'stress-sustained');
    sustainedMetrics.success = sustainedResult.success;
    results.push(sustainedMetrics);
    
    if (sustainedResult.success) {
      logger.info('✅ Test de stress sustained completado exitosamente');
    } else {
      logger.error('❌ Test de stress sustained falló');
    }
  } catch (error) {
    logger.error(`Error en test de stress sustained: ${error.message}`);
    results.push({
      testType: 'stress-sustained',
      success: false,
      error: error.message
    });
  }
  
  // Pausa entre tests
  await new Promise(resolve => setTimeout(resolve, 3000));
  
  // Test 4: Monitoreo de Concurrencia
  logger.info('\n📋 Test 4: Monitoreo de Concurrencia');
  logger.info('Monitoreando race conditions en tiempo real...');
  
  try {
    const args = [
      '--config', options.config,
      '--duration', '15',
      '--monitor-interval', '2000'
    ];
    
    if (options.project) args.push('--project', options.project);
    if (options.debug) args.push('--debug');
    
    const monitorResult = await runScript('./concurrency-monitor.js', args);
    const monitorMetrics = extractMetrics(monitorResult.stdout, 'concurrency-monitor');
    monitorMetrics.success = monitorResult.success;
    results.push(monitorMetrics);
    
    if (monitorResult.success) {
      logger.info('✅ Test de monitoreo de concurrencia completado exitosamente');
    } else {
      logger.error('❌ Test de monitoreo de concurrencia falló');
    }
  } catch (error) {
    logger.error(`Error en test de monitoreo: ${error.message}`);
    results.push({
      testType: 'concurrency-monitor',
      success: false,
      error: error.message
    });
  }
  
  const endTime = Date.now();
  const totalDuration = endTime - startTime;
  
  return {
    results,
    totalDuration,
    timestamp: new Date().toISOString()
  };
}

/**
 * Genera reporte consolidado
 */
function generateConsolidatedReport(testResults, config) {
  console.log('\n' + '='.repeat(80));
  console.log('📊 REPORTE CONSOLIDADO DE TESTING DE CONCURRENCIA');
  console.log('='.repeat(80));
  
  console.log(`📅 Fecha: ${testResults.timestamp}`);
  console.log(`⏰ Duración total: ${(testResults.totalDuration / 1000).toFixed(2)} segundos`);
  console.log(`👥 Usuarios configurados: ${config.users.length}`);
  console.log(`🎯 Proyecto: ${config.project_name}`);
  
  console.log('\n📋 RESULTADOS POR TEST:');
  console.log('-'.repeat(80));
  
  let totalRequests = 0;
  let totalSuccessful = 0;
  let totalFailed = 0;
  let totalRaceConditions = 0;
  let peakConcurrency = 0;
  
  testResults.results.forEach((result, index) => {
    console.log(`\n${index + 1}. ${result.testType.toUpperCase()}`);
    console.log(`   Estado: ${result.success ? '✅ Exitoso' : '❌ Fallido'}`);
    
    if (result.success) {
      if (result.totalRequests) {
        console.log(`   Total requests: ${result.totalRequests}`);
        totalRequests += result.totalRequests;
      }
      
      if (result.successfulRequests) {
        console.log(`   Exitosos: ${result.successfulRequests}`);
        totalSuccessful += result.successfulRequests;
      }
      
      if (result.failedRequests) {
        console.log(`   Fallidos: ${result.failedRequests}`);
        totalFailed += result.failedRequests;
      }
      
      if (result.successRate) {
        console.log(`   Tasa de éxito: ${result.successRate}%`);
      }
      
      if (result.avgResponseTime) {
        console.log(`   Tiempo promedio: ${result.avgResponseTime}ms`);
      }
      
      if (result.peakConcurrency) {
        console.log(`   Peak concurrencia: ${result.peakConcurrency}`);
        if (result.peakConcurrency > peakConcurrency) {
          peakConcurrency = result.peakConcurrency;
        }
      }
      
      if (result.raceConditions) {
        console.log(`   Race conditions: ${result.raceConditions}`);
        totalRaceConditions += result.raceConditions;
      }
      
      if (result.throughput) {
        console.log(`   Throughput: ${result.throughput} req/s`);
      }
    } else {
      console.log(`   Error: ${result.error || 'Error desconocido'}`);
    }
  });
  
  console.log('\n📊 MÉTRICAS CONSOLIDADAS:');
  console.log('-'.repeat(80));
  console.log(`Total requests ejecutadas: ${totalRequests}`);
  console.log(`Total exitosas: ${totalSuccessful}`);
  console.log(`Total fallidas: ${totalFailed}`);
  console.log(`Tasa de éxito general: ${totalRequests > 0 ? (totalSuccessful / totalRequests * 100).toFixed(2) : 0}%`);
  console.log(`Peak concurrencia máximo: ${peakConcurrency}`);
  console.log(`Total race conditions detectados: ${totalRaceConditions}`);
  
  console.log('\n🎯 EVALUACIÓN FINAL:');
  console.log('-'.repeat(80));
  
  const overallSuccessRate = totalRequests > 0 ? (totalSuccessful / totalRequests * 100) : 0;
  
  if (overallSuccessRate >= 95 && totalRaceConditions === 0) {
    console.log('🏆 EXCELENTE: Sistema completamente preparado para producción');
    console.log('   ✅ Maneja perfectamente la concurrencia simultánea');
    console.log('   ✅ No se detectaron race conditions');
    console.log('   ✅ Alta tasa de éxito bajo carga');
  } else if (overallSuccessRate >= 85 && totalRaceConditions < totalRequests * 0.02) {
    console.log('✅ BUENO: Sistema listo para producción con monitoreo');
    console.log('   ✅ Maneja bien la concurrencia en la mayoría de casos');
    console.log('   ⚠️  Algunos race conditions menores detectados');
    console.log('   💡 Recomendación: Implementar monitoreo adicional');
  } else if (overallSuccessRate >= 70) {
    console.log('⚠️  ACEPTABLE: Sistema necesita optimizaciones');
    console.log('   ⚠️  Problemas de concurrencia detectados');
    console.log('   🔧 Requiere mejoras antes de producción');
    console.log('   💡 Recomendación: Revisar locks y transacciones');
  } else {
    console.log('❌ CRÍTICO: Sistema no está listo para producción');
    console.log('   🚨 Problemas serios de concurrencia');
    console.log('   🚨 Alta tasa de fallos bajo carga');
    console.log('   💡 Recomendación: Rediseñar manejo de concurrencia');
  }
  
  console.log('\n💡 RECOMENDACIONES:');
  console.log('-'.repeat(80));
  
  if (totalRaceConditions > 0) {
    console.log('🔒 Implementar optimistic locking en el backend');
    console.log('🔄 Añadir retry logic con backoff exponencial');
    console.log('📊 Monitorear métricas de concurrencia en producción');
  }
  
  if (overallSuccessRate < 90) {
    console.log('⚡ Optimizar tiempos de respuesta de la API');
    console.log('🗄️  Revisar configuración de base de datos');
    console.log('🌐 Considerar load balancing si es necesario');
  }
  
  if (peakConcurrency > 20) {
    console.log('📈 Sistema maneja alta concurrencia - excelente escalabilidad');
  }
  
  console.log('='.repeat(80));
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
    
    if (!config.users || config.users.length === 0) {
      throw new Error('No se encontraron usuarios en la configuración');
    }
    
    logger.info(`🎯 Iniciando Suite Completa de Testing de Concurrencia`);
    logger.info(`👥 Usuarios: ${config.users.length}`);
    logger.info(`🎫 Tokens por compra: ${argv.tokens}`);
    logger.info(`📊 Proyecto: ${config.project_name}`);
    
    // Ejecutar suite completa
    const testResults = await runCompleteTestSuite(config, {
      config: argv.config,
      project: argv.project,
      tokens: argv.tokens,
      debug: argv.debug
    });
    
    // Generar reporte consolidado
    generateConsolidatedReport(testResults, config);
    
    process.exit(0);
    
  } catch (error) {
    logger.error(`Error en la suite de testing: ${error.message}`);
    if (logger.getDebugMode()) {
      console.error(error);
    }
    process.exit(1);
  }
}

// Ejecutar la función principal
main();
