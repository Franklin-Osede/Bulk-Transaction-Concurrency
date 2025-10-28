#!/usr/bin/env node

const fs = require('fs').promises;
const { makePurchase } = require('./investments');

/**
 * Simulador Multi-Usuario usando valores del archivo multi-users-config.txt
 * Uso: node multi-users-simple.js [usuarios] [test-size] [token-amount]
 * Ejemplo: node multi-users-simple.js 1,2,3 100 2
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

function getUsers(config, userSelection) {
  const users = [];
  
  if (userSelection.includes('1')) {
    const tokenAmount = parseInt(config.USER1_TOKEN_AMOUNT);
    const testSize = parseInt(config.USER1_TEST_SIZE);
    users.push({
      email: config.USER1_EMAIL,
      id: config.USER1_ID,
      wallet: config.USER1_WALLET,
      tokenAmount: tokenAmount,
      testSize: testSize,
      totalTokens: tokenAmount * testSize,
      name: 'Franklin'
    });
  }
  if (userSelection.includes('2')) {
    const tokenAmount = parseInt(config.USER2_TOKEN_AMOUNT);
    const testSize = parseInt(config.USER2_TEST_SIZE);
    users.push({
      email: config.USER2_EMAIL,
      id: config.USER2_ID,
      wallet: config.USER2_WALLET,
      tokenAmount: tokenAmount,
      testSize: testSize,
      totalTokens: tokenAmount * testSize,
      name: 'Sergio'
    });
  }
  if (userSelection.includes('3')) {
    const tokenAmount = parseInt(config.USER3_TOKEN_AMOUNT);
    const testSize = parseInt(config.USER3_TEST_SIZE);
    users.push({
      email: config.USER3_EMAIL,
      id: config.USER3_ID,
      wallet: config.USER3_WALLET,
      tokenAmount: tokenAmount,
      testSize: testSize,
      totalTokens: tokenAmount * testSize,
      name: 'Jose Vera'
    });
  }
  if (userSelection.includes('4')) {
    const tokenAmount = parseInt(config.USER4_TOKEN_AMOUNT);
    const testSize = parseInt(config.USER4_TEST_SIZE);
    users.push({
      email: config.USER4_EMAIL,
      id: config.USER4_ID,
      wallet: config.USER4_WALLET,
      tokenAmount: tokenAmount,
      testSize: testSize,
      totalTokens: tokenAmount * testSize,
      name: 'Aníbal'
    });
  }
  if (userSelection.includes('5')) {
    const tokenAmount = parseInt(config.USER5_TOKEN_AMOUNT);
    const testSize = parseInt(config.USER5_TEST_SIZE);
    users.push({
      email: config.USER5_EMAIL,
      id: config.USER5_ID,
      wallet: config.USER5_WALLET,
      tokenAmount: tokenAmount,
      testSize: testSize,
      totalTokens: tokenAmount * testSize,
      name: 'Claire'
    });
  }
  
  return users;
}

async function simulateMultipleTransactions(users, config) {
  console.log(`🚀 Simulando ${users.length} usuarios con diferentes configuraciones...`);
  console.log(`🎯 Proyecto: ${config.PROJECT_NAME}\n`);
  
  users.forEach((user, index) => {
    console.log(`👤 Usuario ${index + 1}: ${user.name} - ${user.totalTokens} tokens totales (${user.testSize} × ${user.tokenAmount})`);
  });
  console.log('');
  
  const allResults = [];
  
  // Encontrar el máximo test size para saber cuántas rondas hacer
  const maxTestSize = Math.max(...users.map(u => u.testSize));
  
  for (let transaction = 0; transaction < maxTestSize; transaction++) {
    console.log(`\n📋 TRANSACCIÓN ${transaction + 1}/${maxTestSize}`);
    console.log('='.repeat(50));
    
    // Solo incluir usuarios que aún tienen transacciones pendientes
    const activeUsers = users.filter(user => transaction < user.testSize);
    
    if (activeUsers.length === 0) {
      console.log('✅ Todos los usuarios han completado sus transacciones');
      break;
    }
    
    const promises = activeUsers.map((user) => {
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
    if (transaction < maxTestSize - 1) {
      console.log('\n⏸️  Pausa de 1 segundo entre transacciones...');
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  
  return allResults;
}

function generateReport(results, testSize) {
  const successful = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);
  
  const totalTokens = results.reduce((sum, r) => sum + r.tokens, 0);
  const successfulTokens = successful.reduce((sum, r) => sum + r.tokens, 0);
  
  const responseTimes = results.map(r => r.time);
  const avgResponseTime = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
  
  console.log('\n' + '='.repeat(60));
  console.log('📊 REPORTE DE SIMULACIÓN MULTI-USUARIO');
  console.log('='.repeat(60));
  console.log(`📋 Transacciones ejecutadas: ${testSize}`);
  console.log(`👥 Usuarios por transacción: ${results.length / testSize}`);
  console.log(`⏰ Tiempo promedio: ${Math.round(avgResponseTime)}ms`);
  console.log(`✅ Exitosos: ${successful.length} (${(successful.length / results.length * 100).toFixed(1)}%)`);
  console.log(`❌ Fallidos: ${failed.length}`);
  console.log(`🎫 Tokens intentados: ${totalTokens}`);
  console.log(`🎫 Tokens exitosos: ${successfulTokens}`);
  
  if (failed.length > 0) {
    console.log('\n❌ ERRORES POR USUARIO:');
    const userErrors = {};
    failed.forEach(result => {
      if (!userErrors[result.user]) {
        userErrors[result.user] = [];
      }
      userErrors[result.user].push(result.error);
    });
    
    Object.entries(userErrors).forEach(([user, errors]) => {
      console.log(`   ${user}: ${errors.length} errores`);
      const errorCounts = {};
      errors.forEach(error => {
        errorCounts[error] = (errorCounts[error] || 0) + 1;
      });
      Object.entries(errorCounts).forEach(([error, count]) => {
        console.log(`     - "${error}": ${count} veces`);
      });
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
      console.log('🎯 SIMULADOR MULTI-USUARIO CON CONFIGURACIÓN INDIVIDUAL');
      console.log('='.repeat(60));
      console.log('Uso: node multi-users-simple.js [usuarios]');
      console.log('');
      console.log('👥 USUARIOS DISPONIBLES:');
      console.log('1. Franklin - 10 transacciones × 1 token = 10 tokens totales');
      console.log('2. Sergio - 5 transacciones × 2 tokens = 10 tokens totales');
      console.log('3. Jose Vera - 100 transacciones × 1 token = 100 tokens totales');
      console.log('4. Aníbal - 20 transacciones × 3 tokens = 60 tokens totales');
      console.log('5. Claire - 15 transacciones × 2 tokens = 30 tokens totales');
      console.log('');
      console.log('📝 EJEMPLOS:');
      console.log('node multi-users-simple.js 1,2,3');
      console.log('node multi-users-simple.js all');
      console.log('node multi-users-simple.js 1,4,5');
      console.log('');
      console.log('📋 CONFIGURACIÓN INDIVIDUAL (del archivo multi-users-config.txt):');
      console.log('- Cada usuario tiene su propio TOKEN_AMOUNT y TEST_SIZE');
      console.log('- PROJECT_NAME: 1755619896909');
      process.exit(1);
    }
    
    const userSelection = args[0].toLowerCase();
    
    console.log(`🎯 Cargando configuración multi-usuario...`);
    
    const config = await loadMultiUserConfig();
    
    let users;
    if (userSelection === 'all') {
      users = getUsers(config, '1,2,3,4,5');
    } else {
      users = getUsers(config, userSelection);
    }
    
    if (users.length === 0) {
      console.log('❌ No se encontraron usuarios válidos');
      process.exit(1);
    }
    
    console.log(`👥 Usuarios seleccionados: ${users.map(u => u.name).join(', ')}`);
    console.log(`🎯 Proyecto: ${config.PROJECT_NAME}`);
    console.log(`📊 Configuración por usuario:`);
    users.forEach(user => {
      console.log(`   ${user.name}: ${user.testSize} transacciones × ${user.tokenAmount} tokens = ${user.totalTokens} tokens totales`);
    });
    console.log('');
    
    const startTime = Date.now();
    const results = await simulateMultipleTransactions(users, config);
    const totalTime = Date.now() - startTime;
    
    const maxTestSize = Math.max(...users.map(u => u.testSize));
    generateReport(results, maxTestSize);
    console.log(`\n⏰ Tiempo total de simulación: ${(totalTime / 1000).toFixed(2)} segundos`);
    
  } catch (error) {
    console.error(`❌ Error: ${error.message}`);
    process.exit(1);
  }
}

main();
