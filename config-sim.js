#!/usr/bin/env node

const fs = require('fs').promises;
const { makePurchase } = require('./investments');

/**
 * Simulador usando archivos de configuración individuales
 * Uso: node config-sim.js config.franklin.txt [usuarios] [test-size] [token-amount]
 * Ejemplo: node config-sim.js config.franklin.txt 3 5 2
 */

async function loadConfig(configPath) {
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
}

function generateUsers(baseConfig, numUsers, tokenAmount) {
  const users = [];
  
  for (let i = 0; i < numUsers; i++) {
    const baseEmail = baseConfig.USER_EMAIL;
    const emailParts = baseEmail.split('@');
    const simulatedEmail = `${emailParts[0]}+sim${i + 1}@${emailParts[1]}`;
    
    users.push({
      email: simulatedEmail,
      id: `${baseConfig.USER_ID}_sim${i + 1}`,
      wallet: `${baseConfig.USER_WALLET}_sim${i + 1}`,
      tokenAmount: tokenAmount,
      name: `Usuario ${i + 1}`
    });
  }
  
  return users;
}

async function simulateMultipleTransactions(users, config, testSize) {
  console.log(`🚀 Simulando ${users.length} usuarios haciendo ${testSize} transacciones cada uno...`);
  console.log(`🎯 Proyecto: ${config.PROJECT_NAME}`);
  console.log(`🎫 Tokens por transacción: ${users[0].tokenAmount}\n`);
  
  const allResults = [];
  
  for (let transaction = 0; transaction < testSize; transaction++) {
    console.log(`\n📋 TRANSACCIÓN ${transaction + 1}/${testSize}`);
    console.log('='.repeat(40));
    
    const promises = users.map((user, index) => {
      const delay = Math.random() * 200;
      
      return new Promise((resolve) => {
        setTimeout(async () => {
          const startTime = Date.now();
          
          try {
            const result = await makePurchase(
              config.API_URL,
              user.email,
              config.PROJECT_NAME,
              user.tokenAmount,
              false,
              user.id,
              user.wallet
            );
            
            const responseTime = Date.now() - startTime;
            const status = result.success ? '✅' : '❌';
            
            console.log(`${status} [${user.name}] ${user.tokenAmount} tokens - ${responseTime}ms`);
            if (!result.success) console.log(`   Error: ${result.error}`);
            
            resolve({ 
              success: result.success, 
              tokens: user.tokenAmount, 
              time: responseTime,
              user: user.name,
              transaction: transaction + 1,
              error: result.error
            });
            
          } catch (error) {
            const responseTime = Date.now() - startTime;
            console.log(`❌ [${user.name}] Error - ${responseTime}ms`);
            console.log(`   ${error.message}`);
            
            resolve({ 
              success: false, 
              tokens: user.tokenAmount, 
              time: responseTime,
              user: user.name,
              transaction: transaction + 1,
              error: error.message
            });
          }
        }, delay);
      });
    });
    
    const transactionResults = await Promise.all(promises);
    allResults.push(...transactionResults);
    
    // Pausa entre transacciones
    if (transaction < testSize - 1) {
      console.log('\n⏸️  Pausa de 1 segundo entre transacciones...');
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  
  return allResults;
}

function generateDetailedReport(results, testSize) {
  const successful = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);
  
  const totalTokens = results.reduce((sum, r) => sum + r.tokens, 0);
  const successfulTokens = successful.reduce((sum, r) => sum + r.tokens, 0);
  
  const responseTimes = results.map(r => r.time);
  const avgResponseTime = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
  
  // Agrupar por transacción
  const transactions = {};
  results.forEach(result => {
    if (!transactions[result.transaction]) {
      transactions[result.transaction] = [];
    }
    transactions[result.transaction].push(result);
  });
  
  console.log('\n' + '='.repeat(60));
  console.log('📊 REPORTE DETALLADO DE SIMULACIÓN');
  console.log('='.repeat(60));
  console.log(`📋 Transacciones ejecutadas: ${testSize}`);
  console.log(`👥 Usuarios por transacción: ${Object.keys(transactions).length > 0 ? transactions[1].length : 0}`);
  console.log(`⏰ Tiempo promedio: ${Math.round(avgResponseTime)}ms`);
  console.log(`✅ Exitosos: ${successful.length} (${(successful.length / results.length * 100).toFixed(1)}%)`);
  console.log(`❌ Fallidos: ${failed.length}`);
  console.log(`🎫 Tokens intentados: ${totalTokens}`);
  console.log(`🎫 Tokens exitosos: ${successfulTokens}`);
  
  console.log('\n📈 RESULTADOS POR TRANSACCIÓN:');
  console.log('-'.repeat(60));
  
  Object.keys(transactions).forEach(transactionNum => {
    const transactionResults = transactions[transactionNum];
    const transactionSuccessful = transactionResults.filter(r => r.success).length;
    const transactionFailed = transactionResults.filter(r => !r.success).length;
    
    console.log(`Transacción ${transactionNum}: ${transactionSuccessful} exitosas, ${transactionFailed} fallidas`);
  });
  
  if (failed.length > 0) {
    console.log('\n❌ ERRORES MÁS FRECUENTES:');
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
    console.log('   🏆 ¡Perfecto! Todas las transacciones fueron exitosas');
  } else if (successful.length >= results.length * 0.8) {
    console.log('   ✅ Bueno - La mayoría de transacciones fueron exitosas');
  } else {
    console.log('   ⚠️  Problemas detectados - Revisar disponibilidad de tokens');
  }
  
  console.log('='.repeat(60));
}

async function main() {
  try {
    const args = process.argv.slice(2);
    
    if (args.length === 0) {
      console.log('🎯 SIMULADOR CON ARCHIVOS DE CONFIGURACIÓN');
      console.log('='.repeat(50));
      console.log('Uso: node config-sim.js <archivo.txt> [usuarios] [test-size] [token-amount]');
      console.log('');
      console.log('📝 EJEMPLOS:');
      console.log('node config-sim.js config.franklin.txt');
      console.log('node config-sim.js config.franklin.txt 3');
      console.log('node config-sim.js config.franklin.txt 3 5');
      console.log('node config-sim.js config.franklin.txt 3 5 2');
      console.log('');
      console.log('📋 ARCHIVOS DISPONIBLES:');
      console.log('- config.franklin.txt');
      console.log('- config.sergio.txt');
      console.log('- config.josevera.txt');
      process.exit(1);
    }
    
    const configPath = args[0];
    const numUsers = parseInt(args[1]) || 3;
    const testSize = parseInt(args[2]) || 10; // Usar TEST_SIZE del archivo si no se especifica
    const tokenAmount = parseInt(args[3]) || 1; // Usar TOKEN_AMOUNT del archivo si no se especifica
    
    console.log(`🎯 Cargando configuración: ${configPath}`);
    
    const config = await loadConfig(configPath);
    
    // Usar valores del archivo si no se especifican parámetros
    const finalTestSize = args[2] ? testSize : parseInt(config.TEST_SIZE) || testSize;
    const finalTokenAmount = args[3] ? tokenAmount : parseInt(config.TOKEN_AMOUNT) || tokenAmount;
    
    console.log(`👥 Usuarios a simular: ${numUsers}`);
    console.log(`📋 Transacciones por usuario: ${finalTestSize}`);
    console.log(`🎫 Tokens por transacción: ${finalTokenAmount}`);
    console.log(`🎯 Proyecto: ${config.PROJECT_NAME}`);
    console.log(`👤 Usuario base: ${config.USER_EMAIL}\n`);
    
    const users = generateUsers(config, numUsers, finalTokenAmount);
    
    const startTime = Date.now();
    const results = await simulateMultipleTransactions(users, config, finalTestSize);
    const totalTime = Date.now() - startTime;
    
    generateDetailedReport(results, finalTestSize);
    console.log(`\n⏰ Tiempo total de simulación: ${(totalTime / 1000).toFixed(2)} segundos`);
    
  } catch (error) {
    console.error(`❌ Error: ${error.message}`);
    process.exit(1);
  }
}

main();
