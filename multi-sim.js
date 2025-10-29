#!/usr/bin/env node

const fs = require('fs').promises;
const { makePurchase } = require('./investments');

/**
 * Simulador Directo de Múltiples Usuarios
 * Uso directo: node config.franklin.txt
 * Con parámetros: node config.franklin.txt 5 2-4 1500
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

function generateUsers(baseConfig, numUsers, tokenRange) {
  const users = [];
  
  let minTokens, maxTokens;
  if (tokenRange.includes('-')) {
    [minTokens, maxTokens] = tokenRange.split('-').map(n => parseInt(n.trim()));
  } else {
    minTokens = maxTokens = parseInt(tokenRange);
  }
  
  for (let i = 0; i < numUsers; i++) {
    const baseEmail = baseConfig.USER_EMAIL;
    const emailParts = baseEmail.split('@');
    const simulatedEmail = `${emailParts[0]}+sim${i + 1}@${emailParts[1]}`;
    
    const tokenAmount = Math.floor(Math.random() * (maxTokens - minTokens + 1)) + minTokens;
    
    users.push({
      email: simulatedEmail,
      id: `${baseConfig.USER_ID}_sim${i + 1}`,
      wallet: `${baseConfig.USER_WALLET}_sim${i + 1}`,
      tokenAmount: tokenAmount
    });
  }
  
  return users;
}

async function simulateClicks(users, config) {
  console.log(`🚀 ${users.length} usuarios haciendo clic simultáneamente...`);
  console.log(`🎯 Proyecto: ${config.PROJECT_NAME}\n`);
  
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
          
          console.log(`${status} ${user.tokenAmount} tokens - ${responseTime}ms`);
          if (!result.success) console.log(`   Error: ${result.error}`);
          
          resolve({ success: result.success, tokens: user.tokenAmount, time: responseTime });
          
        } catch (error) {
          const responseTime = Date.now() - startTime;
          console.log(`❌ Error - ${responseTime}ms`);
          console.log(`   ${error.message}`);
          
          resolve({ success: false, tokens: user.tokenAmount, time: responseTime });
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
    const configPath = args[0];
    
    if (!configPath) {
      console.log('Uso: node config.franklin.txt [usuarios] [tokens] [burst-time]');
      console.log('Ejemplo: node config.franklin.txt 5 2-4');
      process.exit(1);
    }
    
    const numUsers = parseInt(args[1]) || 3;
    const tokenRange = args[2] || '1';
    
    const config = await loadConfig(configPath);
    const users = generateUsers(config, numUsers, tokenRange);
    
    await simulateClicks(users, config);
    
  } catch (error) {
    console.error(`❌ Error: ${error.message}`);
    process.exit(1);
  }
}

main();
