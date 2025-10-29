#!/usr/bin/env node

const fs = require('fs').promises;
const path = require('path');
const yargs = require('yargs/yargs');
const { hideBin } = require('yargs/helpers');
const { makePurchase } = require('./investments');
const logger = require('./logger');

/**
 * Simulador de Múltiples Usuarios con Configuración Individual
 * Permite usar archivos de configuración individuales pero simular múltiples usuarios
 * comprando simultáneamente con diferentes cantidades de tokens
 */

/**
 * Parse command-line arguments
 */
function parseArgs() {
  return yargs(hideBin(process.argv))
    .usage('Usage: $0 --config <archivo.txt> [--simulate-users <num>] [--tokens-per-user <amount>] [--burst-time <ms>] [--debug] [--help]')
    .option('config', {
      alias: 'c',
      describe: 'Archivo de configuración individual (ej: config.franklin.txt)',
      type: 'string',
      demandOption: true
    })
    .option('simulate-users', {
      alias: 'u',
      describe: 'Número de usuarios a simular haciendo clic simultáneamente',
      type: 'number',
      default: 3
    })
    .option('tokens-per-user', {
      alias: 't',
      describe: 'Cantidad de tokens que comprará cada usuario (puede ser un rango: min-max)',
      type: 'string',
      default: '1'
    })
    .option('burst-time', {
      alias: 'b',
      describe: 'Ventana de tiempo para clics simultáneos (en ms)',
      type: 'number',
      default: 2000
    })
    .option('debug', {
      alias: 'd',
      describe: 'Mostrar información de depuración',
      type: 'boolean',
      default: false
    })
    .help()
    .alias('help', 'h')
    .argv;
}

/**
 * Carga configuración desde archivo .txt
 */
async function loadConfig(configPath) {
  try {
    const data = await fs.readFile(configPath, 'utf8');
    const config = {};
    
    data.split('\n').forEach(line => {
      const trimmedLine = line.trim();
      if (trimmedLine && !trimmedLine.startsWith('#')) {
        const [key, ...valueParts] = trimmedLine.split('=');
        if (key && valueParts.length > 0) {
          config[key.trim()] = valueParts.join('=').trim();
        }
      }
    });
    
    return config;
  } catch (error) {
    throw new Error(`Error al cargar la configuración: ${error.message}`);
  }
}

/**
 * Genera usuarios simulados basados en la configuración base
 */
function generateSimulatedUsers(baseConfig, numUsers, tokenRange) {
  const users = [];
  
  // Parsear rango de tokens (ej: "1-3" o "2")
  let minTokens, maxTokens;
  if (tokenRange.includes('-')) {
    [minTokens, maxTokens] = tokenRange.split('-').map(n => parseInt(n.trim()));
  } else {
    minTokens = maxTokens = parseInt(tokenRange);
  }
  
  for (let i = 0; i < numUsers; i++) {
    // Generar email único para cada usuario simulado
    const baseEmail = baseConfig.USER_EMAIL;
    const emailParts = baseEmail.split('@');
    const simulatedEmail = `${emailParts[0]}+sim${i + 1}@${emailParts[1]}`;
    
    // Generar ID y wallet únicos
    const simulatedId = `${baseConfig.USER_ID}_sim${i + 1}`;
    const simulatedWallet = `${baseConfig.USER_WALLET}_sim${i + 1}`;
    
    // Generar cantidad de tokens aleatoria dentro del rango
    const tokenAmount = Math.floor(Math.random() * (maxTokens - minTokens + 1)) + minTokens;
    
    users.push({
      email: simulatedEmail,
      id: simulatedId,
      wallet: simulatedWallet,
      tokenAmount: tokenAmount,
      originalUser: baseConfig.USER_EMAIL
    });
  }
  
  return users;
}

/**
 * Simula múltiples usuarios haciendo clic simultáneamente
 */
async function simulateSimultaneousClicks(users, config, options) {
  const results = [];
  const burstWindow = options.burstTime;
  
  logger.info(`🚀 Simulando ${users.length} usuarios haciendo clic simultáneamente`);
  logger.info(`⏱️  Ventana de clics: ${burstWindow}ms`);
  logger.info(`🎯 Proyecto: ${config.PROJECT_NAME}`);
  
  // Mostrar información de cada usuario simulado
  if (options.debug) {
    console.log('\n👥 USUARIOS SIMULADOS:');
    users.forEach((user, index) => {
      console.log(`   ${index + 1}. ${user.email} - ${user.tokenAmount} tokens`);
    });
    console.log('');
  }
  
  // Crear promesas para simular clics simultáneos
  const clickPromises = users.map((user, index) => {
    // Cada usuario hace clic en un momento ligeramente diferente
    const clickDelay = Math.random() * 200; // Delay aleatorio de 0-200ms
    
    return new Promise((resolve) => {
      setTimeout(async () => {
        const startTime = Date.now();
        
        try {
          if (options.debug) {
            console.log(`🖱️  [${user.email}] Haciendo clic en botón de reserva...`);
          }
          
          const result = await makePurchase(
            config.API_URL,
            user.email,
            config.PROJECT_NAME,
            user.tokenAmount,
            options.debug,
            user.id,
            user.wallet
          );
          
          const endTime = Date.now();
          const responseTime = endTime - startTime;
          
          resolve({
            user: user.email,
            originalUser: user.originalUser,
            tokenAmount: user.tokenAmount,
            success: result.success,
            responseTime,
            timestamp: startTime,
            error: result.error || null,
            data: result.data || null
          });
          
        } catch (error) {
          const endTime = Date.now();
          const responseTime = endTime - startTime;
          
          resolve({
            user: user.email,
            originalUser: user.originalUser,
            tokenAmount: user.tokenAmount,
            success: false,
            responseTime,
            timestamp: startTime,
            error: error.message,
            data: null
          });
        }
      }, clickDelay);
    });
  });
  
  // Ejecutar todos los clics "simultáneamente"
  const startTime = Date.now();
  logger.info(`⏰ Iniciando clics simultáneos a las ${new Date().toISOString()}`);
  
  const clickResults = await Promise.all(clickPromises);
  
  const endTime = Date.now();
  const totalTime = endTime - startTime;
  
  return {
    results: clickResults,
    totalTime,
    startTime,
    endTime
  };
}

/**
 * Analiza los resultados de la simulación
 */
function analyzeResults(results) {
  const successful = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);
  
  const responseTimes = results.map(r => r.responseTime);
  const avgResponseTime = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
  const minResponseTime = Math.min(...responseTimes);
  const maxResponseTime = Math.max(...responseTimes);
  
  // Detectar requests concurrentes (dentro de 100ms)
  const concurrentRequests = results.filter(r => {
    const timeDiff = Math.abs(r.timestamp - results[0].timestamp);
    return timeDiff < 100;
  });
  
  // Agrupar errores por tipo
  const errorGroups = {};
  failed.forEach(result => {
    const errorType = result.error || 'Unknown error';
    errorGroups[errorType] = (errorGroups[errorType] || 0) + 1;
  });
  
  // Calcular tokens totales intentados vs exitosos
  const totalTokensAttempted = results.reduce((sum, r) => sum + r.tokenAmount, 0);
  const totalTokensSuccessful = successful.reduce((sum, r) => sum + r.tokenAmount, 0);
  
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
    totalTokensAttempted,
    totalTokensSuccessful,
    tokenSuccessRate: (totalTokensSuccessful / totalTokensAttempted) * 100,
    throughput: results.length / (results[0] ? (results[results.length - 1].timestamp - results[0].timestamp) / 1000 : 1)
  };
}

/**
 * Genera reporte detallado
 */
function generateReport(simulationResult) {
  const { results, totalTime, startTime, endTime } = simulationResult;
  const analysis = analyzeResults(results);
  
  console.log('\n' + '='.repeat(70));
  console.log('📊 REPORTE DE SIMULACIÓN DE MÚLTIPLES USUARIOS');
  console.log('='.repeat(70));
  
  console.log(`⏰ Tiempo total de simulación: ${totalTime}ms`);
  console.log(`📅 Inicio: ${new Date(startTime).toISOString()}`);
  console.log(`📅 Fin: ${new Date(endTime).toISOString()}`);
  
  console.log('\n📈 MÉTRICAS DE RENDIMIENTO:');
  console.log(`   Total usuarios simulados: ${analysis.total}`);
  console.log(`   Exitosos: ${analysis.successful} (${analysis.successRate.toFixed(2)}%)`);
  console.log(`   Fallidos: ${analysis.failed}`);
  console.log(`   Throughput: ${analysis.throughput.toFixed(2)} usuarios/segundo`);
  
  console.log('\n🎫 MÉTRICAS DE TOKENS:');
  console.log(`   Tokens intentados: ${analysis.totalTokensAttempted}`);
  console.log(`   Tokens exitosos: ${analysis.totalTokensSuccessful}`);
  console.log(`   Tasa de éxito de tokens: ${analysis.tokenSuccessRate.toFixed(2)}%`);
  
  console.log('\n⏱️  TIEMPOS DE RESPUESTA:');
  console.log(`   Promedio: ${analysis.avgResponseTime}ms`);
  console.log(`   Mínimo: ${analysis.minResponseTime}ms`);
  console.log(`   Máximo: ${analysis.maxResponseTime}ms`);
  
  console.log('\n🔄 CONCURRENCIA:');
  console.log(`   Requests concurrentes: ${analysis.concurrentRequests}`);
  
  console.log('\n👥 DETALLE POR USUARIO:');
  results.forEach((result, index) => {
    const status = result.success ? '✅' : '❌';
    console.log(`   ${index + 1}. ${status} ${result.user} - ${result.tokenAmount} tokens - ${result.responseTime}ms`);
    if (!result.success) {
      console.log(`      Error: ${result.error}`);
    }
  });
  
  if (Object.keys(analysis.errorGroups).length > 0) {
    console.log('\n❌ ERRORES ENCONTRADOS:');
    Object.entries(analysis.errorGroups).forEach(([error, count]) => {
      console.log(`   "${error}": ${count} ocurrencias`);
    });
  }
  
  console.log('\n🎯 ANÁLISIS DE STRESS TESTING:');
  if (analysis.successRate >= 95) {
    console.log('   ✅ Sistema maneja perfectamente la carga simultánea');
  } else if (analysis.successRate >= 80) {
    console.log('   ⚠️  Sistema maneja bien la carga con algunos problemas menores');
  } else {
    console.log('   ❌ Sistema tiene problemas serios con carga simultánea');
  }
  
  if (analysis.concurrentRequests > analysis.total * 0.7) {
    console.log('   🔥 Alta concurrencia detectada - posible race condition');
  }
  
  if (analysis.tokenSuccessRate < analysis.successRate) {
    console.log('   ⚠️  Algunos usuarios compraron menos tokens de los solicitados');
  }
  
  console.log('='.repeat(70));
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
    const config = await loadConfig(argv.config);
    
    if (!config.API_URL || !config.USER_EMAIL || !config.PROJECT_NAME) {
      throw new Error('Configuración incompleta. Faltan campos requeridos.');
    }
    
    logger.info(`🎯 Simulando ${argv.simulateUsers} usuarios basados en: ${argv.config}`);
    logger.info(`📊 Usuario base: ${config.USER_EMAIL}`);
    logger.info(`🎫 Rango de tokens por usuario: ${argv.tokensPerUser}`);
    logger.info(`⏱️  Ventana de clics simultáneos: ${argv.burstTime}ms`);
    
    // Generar usuarios simulados
    const simulatedUsers = generateSimulatedUsers(config, argv.simulateUsers, argv.tokensPerUser);
    
    // Ejecutar simulación
    const simulationResult = await simulateSimultaneousClicks(simulatedUsers, config, {
      burstTime: argv.burstTime,
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
