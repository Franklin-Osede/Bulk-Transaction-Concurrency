#!/usr/bin/env node

const fs = require('fs').promises;
const { makePurchase } = require('./investments');

/**
 * Simulador Multi-Usuario usando archivos de configuración individuales
 * Combina el sistema multi-usuario con los parámetros TEST_SIZE y TOKEN_AMOUNT
 * Uso: node multi-config.js config.franklin.txt [usuarios] [test-size] [token-amount]
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

function getUsers(multiConfig, userSelection) {
  const users = [];
  
  if (userSelection.includes('1')) {
    users.push({
      email: multiConfig.USER1_EMAIL,
      id: multiConfig.USER1_ID,
      wallet: multiConfig.USER1_WALLET,
      tokenAmount: parseInt(multiConfig.USER1_TOKENS),
      name: 'Franklin'
    });
  }
  if (userSelection.includes('2')) {
    users.push({
      email: multiConfig.USER2_EMAIL,
      id: multiConfig.USER2_ID,
      wallet: multiConfig.USER2_WALLET,
      tokenAmount: parseInt(multiConfig.USER2_TOKENS),
      name: 'Sergio'
    });
  }
  if (userSelection.includes('3')) {
    users.push({
      email: multiConfig.USER3_EMAIL,
      id: multiConfig.USER3_ID,
      wallet: multiConfig.USER3_WALLET,
      tokenAmount: parseInt(multiConfig.USER3_TOKENS),
      name: 'Jose Vera'
    });
  }
  if (userSelection.includes('4')) {
    users.push({
      email: multiConfig.USER4_EMAIL,
      id: multiConfig.USER4_ID,
      wallet: multiConfig.USER4_WALLET,
      tokenAmount: parseInt(multiConfig.USER4_TOKENS),
      name: 'Aníbal'
    });
  }
  if (userSelection.includes('5')) {
    users.push({
      email: multiConfig.USER5_EMAIL,
      id: multiConfig.USER5_ID,
      wallet: multiConfig.USER5_WALLET,
      tokenAmount: parseInt(multiConfig.USER5_TOKENS),
      name: 'Claire'
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
    
    const promises = users.map((user) => {
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
      console.log('🎯 SIMULADOR MULTI-USUARIO CON CONFIGURACIÓN');
      console.log('='.repeat(50));
      console.log('Uso: node multi-config.js <archivo.txt> [usuarios] [test-size] [token-amount]');
      console.log('');
      console.log('👥 USUARIOS DISPONIBLES:');
      console.log('1. Franklin (franklondon1010@gmail.com) - 1 token');
      console.log('2. Sergio (sergio@domoblock.io) - 2 tokens');
      console.log('3. Jose Vera (javs1989@gmail.com) - 1 token');
      console.log('4. Aníbal (anibal@domoblock.io) - 3 tokens');
      console.log('5. Claire (clairebolham@hotmail.com) - 2 tokens');
      console.log('');
      console.log('📝 EJEMPLOS:');
      console.log('node multi-config.js config.franklin.txt 1,2,3');
      console.log('node multi-config.js config.franklin.txt all 5');
      console.log('node multi-config.js config.sergio.txt 1,4,5 3 2');
      console.log('');
      console.log('📋 ARCHIVOS DISPONIBLES:');
      console.log('- config.franklin.txt (TEST_SIZE=10, TOKEN_AMOUNT=1)');
      console.log('- config.sergio.txt (TEST_SIZE=10, TOKEN_AMOUNT=2)');
      console.log('- config.josevera.txt (TEST_SIZE=100, TOKEN_AMOUNT=1)');
      process.exit(1);
    }
    
    const configPath = args[0];
    const userSelection = args[1] || '1,2,3';
    const testSize = parseInt(args[2]) || 10;
    const tokenAmount = parseInt(args[3]) || null; // null = usar del usuario
    
    console.log(`🎯 Cargando configuración: ${configPath}`);
    
    const config = await loadConfig(configPath);
    const multiConfig = await loadMultiUserConfig();
    
    let users;
    if (userSelection.toLowerCase() === 'all') {
      users = getUsers(multiConfig, '1,2,3,4,5');
    } else {
      users = getUsers(multiConfig, userSelection);
    }
    
    // Sobrescribir token amount si se especifica
    if (tokenAmount) {
      users.forEach(user => {
        user.tokenAmount = tokenAmount;
      });
      console.log(`🎫 Tokens sobrescritos: ${tokenAmount}`);
    }
    
    if (users.length === 0) {
      console.log('❌ No se encontraron usuarios válidos');
      process.exit(1);
    }
    
    console.log(`👥 Usuarios seleccionados: ${users.map(u => u.name).join(', ')}`);
    console.log(`📋 Transacciones por usuario: ${testSize}`);
    console.log(`🎯 Proyecto: ${config.PROJECT_NAME}\n`);
    
    const startTime = Date.now();
    const results = await simulateMultipleTransactions(users, config, testSize);
    const totalTime = Date.now() - startTime;
    
    generateReport(results, testSize);
    console.log(`\n⏰ Tiempo total de simulación: ${(totalTime / 1000).toFixed(2)} segundos`);
    
  } catch (error) {
    console.error(`❌ Error: ${error.message}`);
    process.exit(1);
  }
}

main();
