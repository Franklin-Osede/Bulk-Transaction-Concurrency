#!/usr/bin/env node

const fs = require('fs').promises;
const readline = require('readline');
const { makePurchase } = require('./investments');

/**
 * Simulador Multi-Usuario con Selección de Cantidades
 * Te permite elegir cuántos tokens comprará cada usuario
 */

async function loadMultiUserConfig() {
  const data = await fs.readFile('multi-users-config.txt', 'utf8');
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
}

function createReadlineInterface() {
  return readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
}

function askQuestion(rl, question) {
  return new Promise((resolve) => {
    rl.question(question, resolve);
  });
}

async function selectUsersAndAmounts(config) {
  const rl = createReadlineInterface();
  
  console.log('\n👥 USUARIOS DISPONIBLES:');
  console.log('1. Franklin (franklondon1010@gmail.com)');
  console.log('2. Sergio (sergio@domoblock.io)');
  console.log('3. Jose Vera (javs1989@gmail.com)');
  console.log('4. Aníbal (anibal@domoblock.io)');
  console.log('5. Claire (clairebolham@hotmail.com)');
  
  const selection = await askQuestion(rl, '\n¿Qué usuarios quieres usar? (ej: 1,2,3 o "all" para todos): ');
  
  // Configurar Token Amount y Test Size globales
  console.log('\n⚙️  CONFIGURACIÓN GLOBAL:');
  const tokenAmount = await askQuestion(rl, 'Token Amount (tokens por transacción): ');
  const testSize = await askQuestion(rl, 'Test Size (número de transacciones): ');
  
  const finalTokenAmount = parseInt(tokenAmount) || 1;
  const finalTestSize = parseInt(testSize) || 1;
  const totalTokensPerUser = finalTokenAmount * finalTestSize;
  
  console.log(`\n📊 CÁLCULO:`);
  console.log(`   Token Amount: ${finalTokenAmount}`);
  console.log(`   Test Size: ${finalTestSize}`);
  console.log(`   Total tokens por usuario: ${totalTokensPerUser}`);
  
  const users = [];
  
  if (selection.toLowerCase() === 'all') {
    // Todos los usuarios
    for (let i = 1; i <= 5; i++) {
      users.push({
        email: config[`USER${i}_EMAIL`],
        id: config[`USER${i}_ID`],
        wallet: config[`USER${i}_WALLET`],
        tokenAmount: finalTokenAmount,
        testSize: finalTestSize,
        totalTokens: totalTokensPerUser,
        name: i === 1 ? 'Franklin' : i === 2 ? 'Sergio' : i === 3 ? 'Jose Vera' : i === 4 ? 'Aníbal' : 'Claire'
      });
    }
  } else {
    // Usuarios seleccionados
    const selectedNumbers = selection.split(',').map(n => parseInt(n.trim()));
    
    for (const num of selectedNumbers) {
      if (num >= 1 && num <= 5) {
        users.push({
          email: config[`USER${num}_EMAIL`],
          id: config[`USER${num}_ID`],
          wallet: config[`USER${num}_WALLET`],
          tokenAmount: finalTokenAmount,
          testSize: finalTestSize,
          totalTokens: totalTokensPerUser,
          name: num === 1 ? 'Franklin' : num === 2 ? 'Sergio' : num === 3 ? 'Jose Vera' : num === 4 ? 'Aníbal' : 'Claire'
        });
      }
    }
  }
  
  rl.close();
  return users;
}

async function selectProject(config) {
  const rl = createReadlineInterface();
  
  console.log('\n🎯 PROYECTOS DISPONIBLES:');
  console.log('1. Proyecto Franklin (1755619896909)');
  console.log('2. Proyecto Jose Vera (1747231573550)');
  console.log('3. Proyecto personalizado');
  
  const selection = await askQuestion(rl, '\n¿Qué proyecto quieres usar? (1, 2, o 3): ');
  
  let projectId;
  
  if (selection === '1') {
    projectId = '1755619896909';
  } else if (selection === '2') {
    projectId = '1747231573550';
  } else if (selection === '3') {
    projectId = await askQuestion(rl, 'Ingresa el ID del proyecto: ');
  } else {
    projectId = config.PROJECT_NAME;
  }
  
  rl.close();
  return projectId;
}

async function simulateMultipleTransactions(users, config, projectId) {
  console.log(`\n🚀 Simulando ${users.length} usuarios haciendo ${users[0].testSize} transacciones cada uno...`);
  console.log(`🎯 Proyecto: ${projectId}`);
  console.log(`🎫 Tokens por transacción: ${users[0].tokenAmount}`);
  console.log(`📊 Total tokens por usuario: ${users[0].totalTokens}\n`);
  
  users.forEach((user, index) => {
    console.log(`👤 Usuario ${index + 1}: ${user.name} - ${user.totalTokens} tokens totales (${user.testSize} × ${user.tokenAmount})`);
  });
  console.log('');
  
  const allResults = [];
  
  for (let transaction = 0; transaction < users[0].testSize; transaction++) {
    console.log(`\n📋 TRANSACCIÓN ${transaction + 1}/${users[0].testSize}`);
    console.log('='.repeat(50));
    
    const promises = users.map((user) => {
      const delay = Math.random() * 200;
      
      return new Promise((resolve) => {
        setTimeout(async () => {
          const startTime = Date.now();
          
          try {
            console.log(`🖱️  [${user.name}] Clic en botón de reserva...`);
            
            const result = await makePurchase(
              config.API_URL,
              user.email,
              projectId,
              user.tokenAmount,
              false,
              user.id,
              user.wallet
            );
            
            const endTime = Date.now();
            const responseTime = endTime - startTime;
            
            const status = result.success ? '✅' : '❌';
            console.log(`${status} [${user.name}] ${user.tokenAmount} tokens - ${responseTime}ms`);
            if (!result.success) console.log(`   Error: ${result.error}`);
            
            resolve({
              user: user.name,
              tokenAmount: user.tokenAmount,
              success: result.success,
              responseTime,
              timestamp: startTime,
              transaction: transaction + 1,
              error: result.error || null,
              data: result.data || null
            });
            
          } catch (error) {
            const endTime = Date.now();
            const responseTime = endTime - startTime;
            
            console.log(`❌ [${user.name}] Error - ${responseTime}ms`);
            console.log(`   ${error.message}`);
            
            resolve({
              user: user.name,
              tokenAmount: user.tokenAmount,
              success: false,
              responseTime,
              timestamp: startTime,
              transaction: transaction + 1,
              error: error.message,
              data: null
            });
          }
        }, delay);
      });
    });
    
    const transactionResults = await Promise.all(promises);
    allResults.push(...transactionResults);
    
    // Pausa entre transacciones
    if (transaction < users[0].testSize - 1) {
      console.log('\n⏸️  Pausa de 1 segundo entre transacciones...');
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  
  return {
    results: allResults,
    totalTime: Date.now() - allResults[0]?.timestamp || 0,
    startTime: allResults[0]?.timestamp || Date.now(),
    endTime: Date.now()
  };
}

function generateReport(simulationResult) {
  const { results, totalTime, startTime, endTime } = simulationResult;
  
  const successful = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);
  
  const totalTokens = results.reduce((sum, r) => sum + r.tokenAmount, 0);
  const successfulTokens = successful.reduce((sum, r) => sum + r.tokenAmount, 0);
  
  const responseTimes = results.map(r => r.responseTime);
  const avgResponseTime = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
  
  console.log('\n' + '='.repeat(60));
  console.log('📊 REPORTE DE SIMULACIÓN MULTI-USUARIO');
  console.log('='.repeat(60));
  console.log(`⏰ Tiempo total: ${totalTime}ms`);
  console.log(`📅 Inicio: ${new Date(startTime).toISOString()}`);
  console.log(`📅 Fin: ${new Date(endTime).toISOString()}`);
  
  console.log('\n📈 MÉTRICAS DE RENDIMIENTO:');
  console.log(`   Total usuarios: ${results.length}`);
  console.log(`   Exitosos: ${successful.length} (${(successful.length / results.length * 100).toFixed(2)}%)`);
  console.log(`   Fallidos: ${failed.length}`);
  
  console.log('\n🎫 MÉTRICAS DE TOKENS:');
  console.log(`   Tokens intentados: ${totalTokens}`);
  console.log(`   Tokens exitosos: ${successfulTokens}`);
  console.log(`   Tasa de éxito de tokens: ${(successfulTokens / totalTokens * 100).toFixed(2)}%`);
  
  console.log('\n⏱️  TIEMPOS DE RESPUESTA:');
  console.log(`   Promedio: ${Math.round(avgResponseTime)}ms`);
  console.log(`   Mínimo: ${Math.min(...responseTimes)}ms`);
  console.log(`   Máximo: ${Math.max(...responseTimes)}ms`);
  
  console.log('\n👥 DETALLE POR USUARIO:');
  results.forEach((result, index) => {
    const status = result.success ? '✅' : '❌';
    console.log(`   ${index + 1}. ${status} ${result.user} - ${result.tokenAmount} tokens - ${result.responseTime}ms`);
    if (!result.success) {
      console.log(`      Error: ${result.error}`);
    }
  });
  
  if (failed.length > 0) {
    console.log('\n❌ ERRORES ENCONTRADOS:');
    const errorGroups = {};
    failed.forEach(result => {
      const errorType = result.error || 'Unknown error';
      errorGroups[errorType] = (errorGroups[errorType] || 0) + 1;
    });
    
    Object.entries(errorGroups).forEach(([error, count]) => {
      console.log(`   "${error}": ${count} ocurrencias`);
    });
  }
  
  console.log('\n🎯 ANÁLISIS:');
  if (successful.length === results.length) {
    console.log('   🏆 ¡Perfecto! Todos los usuarios pudieron comprar exitosamente');
  } else if (successful.length >= results.length * 0.8) {
    console.log('   ✅ Bueno - La mayoría de usuarios pudieron comprar');
  } else {
    console.log('   ⚠️  Problemas detectados - Revisar disponibilidad de tokens');
  }
  
  console.log('='.repeat(60));
}

async function main() {
  try {
    console.log('🎯 SIMULADOR MULTI-USUARIO CON SELECCIÓN DE CANTIDADES');
    console.log('='.repeat(60));
    
    const config = await loadMultiUserConfig();
    
    const users = await selectUsersAndAmounts(config);
    
    if (users.length === 0) {
      console.log('❌ No se seleccionaron usuarios válidos');
      process.exit(1);
    }
    
    const projectId = await selectProject(config);
    
    const rl = createReadlineInterface();
    console.log(`\n📋 RESUMEN:`);
    console.log(`👥 Usuarios: ${users.map(u => `${u.name}(${u.totalTokens})`).join(', ')}`);
    console.log(`🎯 Proyecto: ${projectId}`);
    console.log(`🎫 Tokens por transacción: ${users[0].tokenAmount}`);
    console.log(`📊 Transacciones por usuario: ${users[0].testSize}`);
    console.log(`🎫 Tokens totales: ${users.reduce((sum, u) => sum + u.totalTokens, 0)}`);
    
    const confirm = await askQuestion(rl, '\n¿Continuar con la simulación? (y/n): ');
    rl.close();
    
    if (confirm.toLowerCase() !== 'y' && confirm.toLowerCase() !== 'yes') {
      console.log('❌ Simulación cancelada');
      process.exit(0);
    }
    
    const simulationResult = await simulateMultipleTransactions(users, config, projectId);
    generateReport(simulationResult);
    
  } catch (error) {
    console.error(`❌ Error: ${error.message}`);
    process.exit(1);
  }
}

main();
