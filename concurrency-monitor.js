#!/usr/bin/env node

const fs = require('fs').promises;
const yargs = require('yargs/yargs');
const { hideBin } = require('yargs/helpers');
const { makePurchase } = require('./investments');
const logger = require('./logger');

/**
 * Monitor de Concurrencia en Tiempo Real
 * Detecta y analiza race conditions durante las transacciones simultáneas
 */

/**
 * Parse command-line arguments
 */
function parseArgs() {
  return yargs(hideBin(process.argv))
    .usage('Usage: $0 --config <archivo.json> [--duration <seconds>] [--monitor-interval <ms>] [--debug] [--help]')
    .option('config', {
      alias: 'c',
      describe: 'Archivo JSON de configuración con múltiples usuarios',
      type: 'string',
      default: 'users-config.json'
    })
    .option('duration', {
      alias: 'd',
      describe: 'Duración del monitoreo en segundos',
      type: 'number',
      default: 30
    })
    .option('monitor-interval', {
      alias: 'i',
      describe: 'Intervalo de monitoreo en milisegundos',
      type: 'number',
      default: 1000
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
 * Clase para monitorear métricas de concurrencia
 */
class ConcurrencyMonitor {
  constructor() {
    this.metrics = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      concurrentRequests: 0,
      raceConditions: 0,
      responseTimes: [],
      errors: new Map(),
      requestTimeline: [],
      peakConcurrency: 0
    };
    
    this.activeRequests = new Set();
    this.requestHistory = [];
  }

  /**
   * Registra el inicio de una nueva request
   */
  startRequest(requestId, userEmail) {
    const timestamp = Date.now();
    const request = {
      id: requestId,
      user: userEmail,
      startTime: timestamp,
      status: 'active'
    };
    
    this.activeRequests.add(request);
    this.metrics.totalRequests++;
    this.metrics.concurrentRequests = this.activeRequests.size;
    
    // Actualizar peak de concurrencia
    if (this.metrics.concurrentRequests > this.metrics.peakConcurrency) {
      this.metrics.peakConcurrency = this.metrics.concurrentRequests;
    }
    
    // Registrar en timeline
    this.metrics.requestTimeline.push({
      timestamp,
      type: 'start',
      requestId,
      user: userEmail,
      concurrentCount: this.metrics.concurrentRequests
    });
    
    return request;
  }

  /**
   * Registra el fin de una request
   */
  endRequest(requestId, success, responseTime, error = null) {
    const timestamp = Date.now();
    const request = Array.from(this.activeRequests).find(r => r.id === requestId);
    
    if (request) {
      this.activeRequests.delete(request);
      this.metrics.concurrentRequests = this.activeRequests.size;
      
      if (success) {
        this.metrics.successfulRequests++;
      } else {
        this.metrics.failedRequests++;
        
        // Registrar error
        const errorKey = error || 'Unknown error';
        this.metrics.errors.set(errorKey, (this.metrics.errors.get(errorKey) || 0) + 1);
      }
      
      // Registrar tiempo de respuesta
      this.metrics.responseTimes.push(responseTime);
      
      // Registrar en timeline
      this.metrics.requestTimeline.push({
        timestamp,
        type: 'end',
        requestId,
        user: request.user,
        success,
        responseTime,
        concurrentCount: this.metrics.concurrentRequests
      });
      
      // Detectar posibles race conditions
      this.detectRaceCondition(request, success, error);
    }
  }

  /**
   * Detecta posibles race conditions
   */
  detectRaceCondition(request, success, error) {
    // Buscar requests concurrentes que puedan haber causado conflictos
    const concurrentRequests = this.metrics.requestTimeline.filter(event => {
      return event.type === 'start' && 
             Math.abs(event.timestamp - request.startTime) < 100 && // Dentro de 100ms
             event.requestId !== request.id;
    });
    
    if (concurrentRequests.length > 0 && !success) {
      // Verificar si el error parece ser de concurrencia
      const concurrencyErrors = [
        'insufficient tokens',
        'project not available',
        'concurrent modification',
        'race condition',
        'conflict'
      ];
      
      const isConcurrencyError = concurrencyErrors.some(errorType => 
        error && error.toLowerCase().includes(errorType)
      );
      
      if (isConcurrencyError) {
        this.metrics.raceConditions++;
        
        if (this.debug) {
          console.log(`🚨 Race condition detectado:`);
          console.log(`   Usuario: ${request.user}`);
          console.log(`   Requests concurrentes: ${concurrentRequests.length}`);
          console.log(`   Error: ${error}`);
        }
      }
    }
  }

  /**
   * Obtiene métricas actuales
   */
  getMetrics() {
    const avgResponseTime = this.metrics.responseTimes.length > 0 
      ? this.metrics.responseTimes.reduce((a, b) => a + b, 0) / this.metrics.responseTimes.length
      : 0;
    
    const successRate = this.metrics.totalRequests > 0 
      ? (this.metrics.successfulRequests / this.metrics.totalRequests) * 100
      : 0;
    
    return {
      ...this.metrics,
      avgResponseTime: Math.round(avgResponseTime),
      successRate: Math.round(successRate * 100) / 100,
      currentConcurrency: this.activeRequests.size
    };
  }

  /**
   * Genera reporte de concurrencia
   */
  generateConcurrencyReport() {
    const metrics = this.getMetrics();
    
    console.log('\n' + '='.repeat(60));
    console.log('🔍 REPORTE DE CONCURRENCIA Y RACE CONDITIONS');
    console.log('='.repeat(60));
    
    console.log(`📊 MÉTRICAS GENERALES:`);
    console.log(`   Total requests: ${metrics.totalRequests}`);
    console.log(`   Exitosos: ${metrics.successfulRequests} (${metrics.successRate}%)`);
    console.log(`   Fallidos: ${metrics.failedRequests}`);
    console.log(`   Peak concurrencia: ${metrics.peakConcurrency} requests simultáneas`);
    
    console.log(`\n⏱️  TIEMPOS DE RESPUESTA:`);
    console.log(`   Promedio: ${metrics.avgResponseTime}ms`);
    if (metrics.responseTimes.length > 0) {
      console.log(`   Mínimo: ${Math.min(...metrics.responseTimes)}ms`);
      console.log(`   Máximo: ${Math.max(...metrics.responseTimes)}ms`);
    }
    
    console.log(`\n🚨 RACE CONDITIONS:`);
    console.log(`   Detectados: ${metrics.raceConditions}`);
    console.log(`   Tasa: ${metrics.totalRequests > 0 ? (metrics.raceConditions / metrics.totalRequests * 100).toFixed(2) : 0}%`);
    
    if (metrics.errors.size > 0) {
      console.log(`\n❌ ERRORES MÁS FRECUENTES:`);
      const sortedErrors = Array.from(metrics.errors.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5);
      
      sortedErrors.forEach(([error, count]) => {
        console.log(`   "${error}": ${count} ocurrencias`);
      });
    }
    
    console.log(`\n🎯 ANÁLISIS:`);
    if (metrics.raceConditions === 0) {
      console.log(`   ✅ No se detectaron race conditions`);
    } else if (metrics.raceConditions < metrics.totalRequests * 0.05) {
      console.log(`   ⚠️  Pocos race conditions detectados - sistema estable`);
    } else {
      console.log(`   🚨 Múltiples race conditions - requiere atención`);
    }
    
    if (metrics.peakConcurrency > 10) {
      console.log(`   🔥 Alta concurrencia detectada (${metrics.peakConcurrency} requests simultáneas)`);
    }
    
    console.log('='.repeat(60));
  }
}

/**
 * Simula requests concurrentes con monitoreo
 */
async function simulateConcurrentRequests(users, config, monitor, options) {
  const requestPromises = users.map(async (user, index) => {
    const requestId = `req_${Date.now()}_${index}`;
    
    // Iniciar monitoreo de request
    const request = monitor.startRequest(requestId, user.email);
    
    try {
      const startTime = Date.now();
      
      const result = await makePurchase(
        config.api_url,
        user.email,
        config.project_name,
        1,
        options.debug,
        user.id,
        user.wallet
      );
      
      const endTime = Date.now();
      const responseTime = endTime - startTime;
      
      // Finalizar monitoreo
      monitor.endRequest(requestId, result.success, responseTime, result.error);
      
      return {
        user: user.email,
        success: result.success,
        responseTime,
        error: result.error
      };
      
    } catch (error) {
      const endTime = Date.now();
      const responseTime = endTime - startTime;
      
      // Finalizar monitoreo con error
      monitor.endRequest(requestId, false, responseTime, error.message);
      
      return {
        user: user.email,
        success: false,
        responseTime,
        error: error.message
      };
    }
  });
  
  return Promise.all(requestPromises);
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
    
    logger.info(`🔍 Iniciando monitoreo de concurrencia`);
    logger.info(`⏰ Duración: ${argv.duration} segundos`);
    logger.info(`👥 Usuarios: ${config.users.length}`);
    logger.info(`📊 Intervalo de monitoreo: ${argv.monitorInterval}ms`);
    
    const monitor = new ConcurrencyMonitor();
    monitor.debug = argv.debug;
    
    // Configurar intervalo de monitoreo
    const monitorInterval = setInterval(() => {
      const metrics = monitor.getMetrics();
      console.log(`📊 [${new Date().toISOString()}] Requests activas: ${metrics.currentConcurrency}, Total: ${metrics.totalRequests}, Exitosos: ${metrics.successfulRequests}`);
    }, argv.monitorInterval);
    
    // Ejecutar requests concurrentes durante el tiempo especificado
    const startTime = Date.now();
    const endTime = startTime + (argv.duration * 1000);
    
    logger.info(`🚀 Iniciando simulación de requests concurrentes...`);
    
    // Ejecutar múltiples rondas de requests concurrentes
    while (Date.now() < endTime) {
      await simulateConcurrentRequests(config.users, config, monitor, argv);
      
      // Pequeña pausa entre rondas
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    // Limpiar intervalo de monitoreo
    clearInterval(monitorInterval);
    
    // Generar reporte final
    monitor.generateConcurrencyReport();
    
    process.exit(0);
    
  } catch (error) {
    logger.error(`Error en el monitoreo: ${error.message}`);
    if (logger.getDebugMode()) {
      console.error(error);
    }
    process.exit(1);
  }
}

// Ejecutar la función principal
main();
