#!/usr/bin/env node

const fs = require('fs').promises;
const path = require('path');
const { makePurchase } = require('./investments');
const logger = require('./logger');

/**
 * Simulador Simple de Múltiples Usuarios
 * Uso: node config.franklin.txt [usuarios] [tokens] [burst-time]
 * Ejemplo: node config.franklin.txt 5 2-4 1500
 */

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
 * Genera usuarios simulados
 */
function generateUsers(baseConfig, numUsers, tokenRange) {
  const users = [];
  
  // Parsear rango de tokens
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

/**
 * Simula clics simultáneos
 */
async function simulateClicks(users, config, burstTime) {
  console.log(`🚀 Simulando ${users.length} usuarios haciendo clic simultáneamente...`);
  console.log(`⏱️  Ventana de clics: ${burstTime}ms`);
  console.log(`🎯 Proyecto: ${config.PROJECT_NAME}\n`);
  
  // Mostrar usuarios
  users.forEach((user, index) => {
    console.log(`👤 Usuario ${index + 1}: ${user.email} - ${user.tokenAmount} tokens`);
  });
  console.log('');
  
  const promises = users.map((user, index) => {
    const delay = Math.random() * 200; // 0-200ms delay
    
    return new Promise((resolve) => {
      setTimeout(async () => {
        const startTime = Date.now();
        
        try {
          console.log(`🖱️  [${user.email}] Clic en botón de reserva...`);
          
          const result = await makePurchase(
            config.API_URL,
            user.email,
            config.PROJECT_NAME,
            user.tokenAmount,
            false, // debug off por defecto
            user.id,
            user.wallet
          );
          
          const endTime = Date.now();
          const responseTime = endTime - startTime;
          
          const status = result.success ? '✅' : '❌';
          console.log(`${status} [${user.email}] ${user.tokenAmount} tokens - ${responseTime}ms`);
          
          if (!result.success) {
            console.log(`   Error: ${result.error}`);
          }
          
          resolve({
            user: user.email,
            tokenAmount: user.tokenAmount,
            success: result.success,
            responseTime,
            error: result.error
          });
          
        } catch (error) {
          const endTime = Date.now();
          const responseTime = endTime - startTime;
          
          console.log(`❌ [${user.email}] Error - ${responseTime}ms`);
          console.log(`   Error: ${error.message}`);
          
          resolve({
            user: user.email,
            tokenAmount: user.tokenAmount,
            success: false,
            responseTime,
            error: error.message
          });
        }
      }, delay);
    });
  });
  
  const startTime = Date.now();
  const results = await Promise.all(promises);
  const endTime = Date.now();
  
  return {
    results,
    totalTime: endTime - startTime
  };
}

/**
 * Genera reporte simple
 */
function generateSimpleReport(results, totalTime) {
  const successful = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);
  
  const totalTokensAttempted = results.reduce((sum, r) => sum + r.tokenAmount, 0);
  const totalTokensSuccessful = successful.reduce((sum, r) => sum + r.tokenAmount, 0);
  
  const responseTimes = results.map(r => r.responseTime);
  const avgResponseTime = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
  
  console.log('\n' + '='.repeat(50));
  console.log('📊 REPORTE FINAL');
  console.log('='.repeat(50));
  console.log(`⏰ Tiempo total: ${totalTime}ms`);
  console.log(`👥 Usuarios: ${results.length}`);
  console.log(`✅ Exitosos: ${successful.length} (${(successful.length / results.length * 100).toFixed(1)}%)`);
  console.log(`❌ Fallidos: ${failed.length}`);
  console.log(`🎫 Tokens intentados: ${totalTokensAttempted}`);
  console.log(`🎫 Tokens exitosos: ${totalTokensSuccessful}`);
  console.log(`⏱️  Tiempo promedio: ${Math.round(avgResponseTime)}ms`);
  
  if (failed.length > 0) {
    console.log('\n❌ ERRORES:');
    failed.forEach(result => {
      console.log(`   ${result.user}: ${result.error}`);
    });
  }
  
  console.log('='.repeat(50));
}

/**
 * Función principal
 */
async function main() {
  try {
    const args = process.argv.slice(2);
    
    if (args.length === 0) {
      console.log('Uso: node config.franklin.txt [usuarios] [tokens] [burst-time]');
      console.log('Ejemplo: node config.franklin.txt 5 2-4 1500');
      console.log('Ejemplo: node config.franklin.txt 3 1 1000');
      process.exit(1);
    }
    
    const configPath = args[0];
    const numUsers = parseInt(args[1]) || 3;
    const tokenRange = args[2] || '1';
    const burstTime = parseInt(args[3]) || 2000;
    
    console.log(`🎯 Cargando configuración: ${configPath}`);
    console.log(`👥 Usuarios a simular: ${numUsers}`);
    console.log(`🎫 Rango de tokens: ${tokenRange}`);
    console.log(`⏱️  Ventana de clics: ${burstTime}ms\n`);
    
    // Cargar configuración
    const config = await loadConfig(configPath);
    
    if (!config.API_URL || !config.USER_EMAIL || !config.PROJECT_NAME) {
      throw new Error('Configuración incompleta');
    }
    
    // Generar usuarios
    const users = generateUsers(config, numUsers, tokenRange);
    
    // Ejecutar simulación
    const simulationResult = await simulateClicks(users, config, burstTime);
    
    // Generar reporte
    generateSimpleReport(simulationResult.results, simulationResult.totalTime);
    
  } catch (error) {
    console.error(`❌ Error: ${error.message}`);
    process.exit(1);
  }
}

// Ejecutar
main();
