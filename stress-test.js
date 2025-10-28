#!/usr/bin/env node

const fs = require('fs').promises;
const yargs = require('yargs/yargs');
const { hideBin } = require('yargs/helpers');
const { makePurchase } = require('./investments');
const logger = require('./logger');

/**
 * Stress Testing Avanzado - Simula diferentes escenarios de carga
 * para probar cómo reacciona el sistema bajo diferentes condiciones
 */

/**
 * Parse command-line arguments
 */
function parseArgs() {
  return yargs(hideBin(process.argv))
    .usage('Usage: $0 --config <archivo.json> [--scenario <scenario_name>] [--iterations <num>] [--debug] [--help]')
    .option('config', {
      alias: 'c',
      describe: 'Archivo JSON de configuración con múltiples usuarios',
      type: 'string',
      default: 'users-config.json'
    })
    .option('scenario', {
      alias: 's',
      describe: 'Escenario de stress testing: burst, sustained, spike, gradual',
      type: 'string',
      choices: ['burst', 'sustained', 'spike', 'gradual'],
      default: 'burst'
    })
    .option('iterations', {
      alias: 'i',
      describe: 'Número de iteraciones del escenario',
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
 * Escenario 1: Burst - Todos los usuarios hacen clic al mismo tiempo
 */
async function burstScenario(users, config, options) {
  logger.info('🔥 Ejecutando escenario BURST - Clics simultáneos');
  
  const promises = users.map(user => 
    makePurchase(
      config.api_url,
      user.email,
      config.project_name,
      1,
      options.debug,
      user.id,
      user.wallet
    )
  );
  
  const startTime = Date.now();
  const results = await Promise.all(promises);
  const endTime = Date.now();
  
  return {
    scenario: 'burst',
    duration: endTime - startTime,
    results,
    concurrentUsers: users.length
  };
}

/**
 * Escenario 2: Sustained - Carga constante durante un período
 */
async function sustainedScenario(users, config, options) {
  logger.info('⏰ Ejecutando escenario SUSTAINED - Carga constante');
  
  const duration = 10000; // 10 segundos
  const interval = 500; // Cada 500ms
  const results = [];
  const startTime = Date.now();
  
  const intervalId = setInterval(async () => {
    if (Date.now() - startTime >= duration) {
      clearInterval(intervalId);
      return;
    }
    
    // Seleccionar usuario aleatorio
    const randomUser = users[Math.floor(Math.random() * users.length)];
    
    try {
      const result = await makePurchase(
        config.api_url,
        randomUser.email,
        config.project_name,
        1,
        options.debug,
        randomUser.id,
        randomUser.wallet
      );
      
      results.push({
        ...result,
        timestamp: Date.now(),
        user: randomUser.email
      });
    } catch (error) {
      results.push({
        success: false,
        error: error.message,
        timestamp: Date.now(),
        user: randomUser.email
      });
    }
  }, interval);
  
  // Esperar a que termine el escenario
  await new Promise(resolve => setTimeout(resolve, duration + 1000));
  
  return {
    scenario: 'sustained',
    duration,
    results,
    requestsPerSecond: results.length / (duration / 1000)
  };
}

/**
 * Escenario 3: Spike - Incremento súbito de carga
 */
async function spikeScenario(users, config, options) {
  logger.info('📈 Ejecutando escenario SPIKE - Incremento súbito');
  
  const phases = [
    { users: Math.ceil(users.length * 0.2), duration: 2000 }, // 20% usuarios por 2s
    { users: users.length, duration: 1000 },                  // 100% usuarios por 1s (spike)
    { users: Math.ceil(users.length * 0.3), duration: 3000 } // 30% usuarios por 3s
  ];
  
  const allResults = [];
  
  for (const phase of phases) {
    logger.info(`   Fase: ${phase.users} usuarios por ${phase.duration}ms`);
    
    const phaseUsers = users.slice(0, phase.users);
    const promises = phaseUsers.map(user => 
      makePurchase(
        config.api_url,
        user.email,
        config.project_name,
        1,
        options.debug,
        user.id,
        user.wallet
      )
    );
    
    const startTime = Date.now();
    const results = await Promise.all(promises);
    const endTime = Date.now();
    
    allResults.push({
      phase: phases.indexOf(phase) + 1,
      users: phase.users,
      duration: endTime - startTime,
      results
    });
  }
  
  return {
    scenario: 'spike',
    phases: allResults,
    totalDuration: allResults.reduce((sum, phase) => sum + phase.duration, 0)
  };
}

/**
 * Escenario 4: Gradual - Incremento gradual de carga
 */
async function gradualScenario(users, config, options) {
  logger.info('📊 Ejecutando escenario GRADUAL - Incremento progresivo');
  
  const steps = 5;
  const stepDuration = 2000; // 2 segundos por paso
  const allResults = [];
  
  for (let step = 1; step <= steps; step++) {
    const userCount = Math.ceil((users.length * step) / steps);
    logger.info(`   Paso ${step}/${steps}: ${userCount} usuarios`);
    
    const stepUsers = users.slice(0, userCount);
    const promises = stepUsers.map(user => 
      makePurchase(
        config.api_url,
        user.email,
        config.project_name,
        1,
        options.debug,
        user.id,
        user.wallet
      )
    );
    
    const startTime = Date.now();
    const results = await Promise.all(promises);
    const endTime = Date.now();
    
    allResults.push({
      step,
      users: userCount,
      duration: endTime - startTime,
      results
    });
    
    // Pausa entre pasos
    if (step < steps) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  
  return {
    scenario: 'gradual',
    steps: allResults,
    totalDuration: allResults.reduce((sum, step) => sum + step.duration, 0)
  };
}

/**
 * Analiza los resultados de cualquier escenario
 */
function analyzeScenarioResults(scenarioResult) {
  let allResults = [];
  
  if (scenarioResult.scenario === 'burst') {
    allResults = scenarioResult.results;
  } else if (scenarioResult.scenario === 'sustained') {
    allResults = scenarioResult.results;
  } else if (scenarioResult.scenario === 'spike') {
    allResults = scenarioResult.phases.flatMap(phase => phase.results);
  } else if (scenarioResult.scenario === 'gradual') {
    allResults = scenarioResult.steps.flatMap(step => step.results);
  }
  
  const successful = allResults.filter(r => r.success);
  const failed = allResults.filter(r => !r.success);
  
  const errorGroups = {};
  failed.forEach(result => {
    const errorType = result.error || 'Unknown error';
    errorGroups[errorType] = (errorGroups[errorType] || 0) + 1;
  });
  
  return {
    total: allResults.length,
    successful: successful.length,
    failed: failed.length,
    successRate: (successful.length / allResults.length) * 100,
    errorGroups,
    scenario: scenarioResult.scenario
  };
}

/**
 * Genera reporte del stress test
 */
function generateStressTestReport(scenarioResults) {
  console.log('\n' + '='.repeat(70));
  console.log('🚀 REPORTE DE STRESS TESTING');
  console.log('='.repeat(70));
  
  scenarioResults.forEach((result, index) => {
    const analysis = analyzeScenarioResults(result);
    
    console.log(`\n📊 ESCENARIO ${index + 1}: ${result.scenario.toUpperCase()}`);
    console.log(`   Duración: ${result.duration || result.totalDuration}ms`);
    console.log(`   Total requests: ${analysis.total}`);
    console.log(`   Exitosos: ${analysis.successful} (${analysis.successRate.toFixed(2)}%)`);
    console.log(`   Fallidos: ${analysis.failed}`);
    
    if (Object.keys(analysis.errorGroups).length > 0) {
      console.log(`   Errores principales:`);
      Object.entries(analysis.errorGroups).forEach(([error, count]) => {
        console.log(`     - "${error}": ${count} ocurrencias`);
      });
    }
    
    // Evaluación del rendimiento
    if (analysis.successRate >= 95) {
      console.log(`   ✅ Excelente rendimiento bajo carga`);
    } else if (analysis.successRate >= 80) {
      console.log(`   ⚠️  Rendimiento aceptable con algunos problemas`);
    } else {
      console.log(`   ❌ Problemas serios de rendimiento`);
    }
  });
  
  console.log('\n🎯 CONCLUSIONES:');
  const avgSuccessRate = scenarioResults.reduce((sum, result) => {
    return sum + analyzeScenarioResults(result).successRate;
  }, 0) / scenarioResults.length;
  
  console.log(`   Tasa de éxito promedio: ${avgSuccessRate.toFixed(2)}%`);
  
  if (avgSuccessRate >= 95) {
    console.log('   🏆 Sistema está preparado para producción');
  } else if (avgSuccessRate >= 80) {
    console.log('   🔧 Sistema necesita optimizaciones menores');
  } else {
    console.log('   🚨 Sistema requiere mejoras importantes antes de producción');
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
    const config = await loadUserConfig(argv.config);
    
    if (!config.users || config.users.length === 0) {
      throw new Error('No se encontraron usuarios en la configuración');
    }
    
    logger.info(`🎯 Iniciando stress testing con escenario: ${argv.scenario}`);
    logger.info(`👥 Usuarios disponibles: ${config.users.length}`);
    logger.info(`🔄 Iteraciones: ${argv.iterations}`);
    
    const scenarioResults = [];
    
    // Ejecutar el escenario las veces especificadas
    for (let i = 0; i < argv.iterations; i++) {
      logger.info(`\n🚀 Ejecutando iteración ${i + 1}/${argv.iterations}`);
      
      let result;
      switch (argv.scenario) {
        case 'burst':
          result = await burstScenario(config.users, config, argv);
          break;
        case 'sustained':
          result = await sustainedScenario(config.users, config, argv);
          break;
        case 'spike':
          result = await spikeScenario(config.users, config, argv);
          break;
        case 'gradual':
          result = await gradualScenario(config.users, config, argv);
          break;
        default:
          throw new Error(`Escenario no soportado: ${argv.scenario}`);
      }
      
      scenarioResults.push(result);
      
      // Pausa entre iteraciones
      if (i < argv.iterations - 1) {
        logger.info('⏸️  Pausa de 3 segundos entre iteraciones...');
        await new Promise(resolve => setTimeout(resolve, 3000));
      }
    }
    
    // Generar reporte final
    generateStressTestReport(scenarioResults);
    
    process.exit(0);
    
  } catch (error) {
    logger.error(`Error en el stress testing: ${error.message}`);
    if (logger.getDebugMode()) {
      console.error(error);
    }
    process.exit(1);
  }
}

// Ejecutar la función principal
main();
