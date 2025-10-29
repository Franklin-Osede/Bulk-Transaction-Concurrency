#!/usr/bin/env node

const fs = require('fs').promises;
const { makePurchase } = require('./investments');

/**
 * Simulador Simple usando archivos de configuración individuales
 * Uso: node config-simple.js config.franklin.txt
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

function generateUsers(baseConfig, numUsers) {
  const users = [];
  
  for (let i = 0; i < numUsers; i++) {
    const baseEmail = baseConfig.USER_EMAIL;
    const emailParts = baseEmail.split('@');
    const simulatedEmail = `${emailParts[0]}+sim${i + 1}@${emailParts[1]}`;
    
    users.push({
      email: simulatedEmail,
      id: `${baseConfig.USER_ID}_sim${i + 1}`,
      wallet: `${baseConfig.USER_WALLET}_sim${i + 1}`,
      tokenAmount: parseInt(baseConfig.TOKEN_AMOUNT),
      name: `Usuario ${i + 1}`
    });
  }
  
  return users;
}

async function simulateClicks(users, config) {
  console.log(`🚀 ${users.length} usuarios haciendo clic simultáneamente...`);
  console.log(`🎯 Proyecto: ${config.PROJECT_NAME}`);
  console.log(`🎫 Tokens por usuario: ${users[0].tokenAmount}\n`);
  
  users.forEach((user, index) => {
    console.log(`👤 Usuario ${index + 1}: ${user.tokenAmount} tokens`);
  });
  console.log('');
  
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
            user: user.name
          });
          
        } catch (error) {
          const responseTime = Date.now() - startTime;
          console.log(`❌ [${user.name}] Error - ${responseTime}ms`);
          console.log(`   ${error.message}`);
          
          resolve({ 
            success: false, 
            tokens: user.tokenAmount, 
            time: responseTime,
            user: user.name
          });
        }
      }, delay);
    });
  });
  
  const startTime = Date.now();
  const results = await Promise.all(promises);
  const totalTime = Date.now() - startTime;
  
  const successful = results.filter(r => r.success);
  const totalTokens = results.reduce((sum, r) => sum + r.tokens, 0);
  const successfulTokens = successful.reduce((sum, r) => sum + r.tokens, 0);
  
  console.log('\n' + '='.repeat(40));
  console.log('📊 RESULTADO');
  console.log('='.repeat(40));
  console.log(`⏰ Tiempo: ${totalTime}ms`);
  console.log(`👥 Usuarios: ${results.length}`);
  console.log(`✅ Exitosos: ${successful.length}`);
  console.log(`🎫 Tokens: ${successfulTokens}/${totalTokens}`);
  console.log(`📈 Éxito: ${(successful.length / results.length * 100).toFixed(1)}%`);
  console.log('='.repeat(40));
}

async function main() {
  try {
    const args = process.argv.slice(2);
    
    if (args.length === 0) {
      console.log('🎯 SIMULADOR SIMPLE CON ARCHIVOS DE CONFIGURACIÓN');
      console.log('='.repeat(50));
      console.log('Uso: node config-simple.js <archivo.txt> [usuarios]');
      console.log('');
      console.log('📝 EJEMPLOS:');
      console.log('node config-simple.js config.franklin.txt');
      console.log('node config-simple.js config.franklin.txt 5');
      console.log('');
      console.log('📋 ARCHIVOS DISPONIBLES:');
      console.log('- config.franklin.txt (TEST_SIZE=10, TOKEN_AMOUNT=1)');
      console.log('- config.sergio.txt (TEST_SIZE=10, TOKEN_AMOUNT=2)');
      console.log('- config.josevera.txt (TEST_SIZE=100, TOKEN_AMOUNT=1)');
      process.exit(1);
    }
    
    const configPath = args[0];
    const numUsers = parseInt(args[1]) || 3;
    
    console.log(`🎯 Cargando configuración: ${configPath}`);
    
    const config = await loadConfig(configPath);
    
    console.log(`👥 Usuarios a simular: ${numUsers}`);
    console.log(`🎫 Tokens por usuario: ${config.TOKEN_AMOUNT}`);
    console.log(`🎯 Proyecto: ${config.PROJECT_NAME}`);
    console.log(`👤 Usuario base: ${config.USER_EMAIL}\n`);
    
    const users = generateUsers(config, numUsers);
    
    await simulateClicks(users, config);
    
  } catch (error) {
    console.error(`❌ Error: ${error.message}`);
    process.exit(1);
  }
}

main();
