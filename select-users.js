#!/usr/bin/env node

const fs = require('fs').promises;
const { makePurchase } = require('./investments');

/**
 * Simulador Simple con Selección de Usuarios
 * Uso: node select-users.js [usuarios] [proyecto]
 * Ejemplo: node select-users.js 1,2,3 1755619896909
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
    users.push({
      email: config.USER1_EMAIL,
      id: config.USER1_ID,
      wallet: config.USER1_WALLET,
      tokenAmount: parseInt(config.USER1_TOKENS),
      name: 'Franklin'
    });
  }
  if (userSelection.includes('2')) {
    users.push({
      email: config.USER2_EMAIL,
      id: config.USER2_ID,
      wallet: config.USER2_WALLET,
      tokenAmount: parseInt(config.USER2_TOKENS),
      name: 'Sergio'
    });
  }
  if (userSelection.includes('3')) {
    users.push({
      email: config.USER3_EMAIL,
      id: config.USER3_ID,
      wallet: config.USER3_WALLET,
      tokenAmount: parseInt(config.USER3_TOKENS),
      name: 'Jose Vera'
    });
  }
  if (userSelection.includes('4')) {
    users.push({
      email: config.USER4_EMAIL,
      id: config.USER4_ID,
      wallet: config.USER4_WALLET,
      tokenAmount: parseInt(config.USER4_TOKENS),
      name: 'Aníbal'
    });
  }
  if (userSelection.includes('5')) {
    users.push({
      email: config.USER5_EMAIL,
      id: config.USER5_ID,
      wallet: config.USER5_WALLET,
      tokenAmount: parseInt(config.USER5_TOKENS),
      name: 'Claire'
    });
  }
  
  return users;
}

async function simulateClicks(users, config, projectId) {
  console.log(`🚀 ${users.length} usuarios haciendo clic simultáneamente...`);
  console.log(`🎯 Proyecto: ${projectId}\n`);
  
  users.forEach((user, index) => {
    console.log(`👤 Usuario ${index + 1}: ${user.name} - ${user.tokenAmount} tokens`);
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
            projectId,
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
      console.log('🎯 SIMULADOR DE MÚLTIPLES USUARIOS');
      console.log('='.repeat(40));
      console.log('Uso: node select-users.js [usuarios] [proyecto]');
      console.log('');
      console.log('👥 USUARIOS DISPONIBLES:');
      console.log('1. Franklin (franklondon1010@gmail.com) - 1 token');
      console.log('2. Sergio (sergio@domoblock.io) - 2 tokens');
      console.log('3. Jose Vera (javs1989@gmail.com) - 1 token');
      console.log('4. Aníbal (anibal@domoblock.io) - 3 tokens');
      console.log('5. Claire (clairebolham@hotmail.com) - 2 tokens');
      console.log('');
      console.log('🎯 PROYECTOS DISPONIBLES:');
      console.log('1755619896909 (Proyecto Franklin)');
      console.log('1747231573550 (Proyecto Jose Vera)');
      console.log('');
      console.log('📝 EJEMPLOS:');
      console.log('node select-users.js 1,2,3 1755619896909');
      console.log('node select-users.js all 1747231573550');
      console.log('node select-users.js 1,4 1755619896909');
      process.exit(1);
    }
    
    const userSelection = args[0].toLowerCase();
    const projectId = args[1] || '1755619896909';
    
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
    
    await simulateClicks(users, config, projectId);
    
  } catch (error) {
    console.error(`❌ Error: ${error.message}`);
    process.exit(1);
  }
}

main();
