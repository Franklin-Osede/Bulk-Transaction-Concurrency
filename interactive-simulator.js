#!/usr/bin/env node

const fs = require('fs').promises;
const readline = require('readline');
const { makePurchase } = require('./investments');

/**
 * Simulador Interactivo de Múltiples Usuarios
 * Permite seleccionar usuarios y proyecto para simular clics simultáneos
 */

async function loadMultiUserConfig(configPath) {
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

async function selectUsers(config) {
  const rl = createReadlineInterface();
  
  console.log('\n👥 USUARIOS DISPONIBLES:');
  console.log('1. Franklin (franklondon1010@gmail.com) - 1 token');
  console.log('2. Sergio (sergio@domoblock.io) - 2 tokens');
  console.log('3. Jose Vera (javs1989@gmail.com) - 1 token');
  console.log('4. Aníbal (anibal@domoblock.io) - 3 tokens');
  console.log('5. Claire (clairebolham@hotmail.com) - 2 tokens');
  
  const selection = await askQuestion(rl, '\n¿Qué usuarios quieres usar? (ej: 1,2,3 o "all" para todos): ');
  
  rl.close();
  
  const users = [];
  
  if (selection.toLowerCase() === 'all') {
    // Todos los usuarios
    users.push({
      email: config.USER1_EMAIL,
      id: config.USER1_ID,
      wallet: config.USER1_WALLET,
      tokenAmount: parseInt(config.USER1_TOKENS),
      name: 'Franklin'
    });
    users.push({
      email: config.USER2_EMAIL,
      id: config.USER2_ID,
      wallet: config.USER2_WALLET,
      tokenAmount: parseInt(config.USER2_TOKENS),
      name: 'Sergio'
    });
    users.push({
      email: config.USER3_EMAIL,
      id: config.USER3_ID,
      wallet: config.USER3_WALLET,
      tokenAmount: parseInt(config.USER3_TOKENS),
      name: 'Jose Vera'
    });
    users.push({
      email: config.USER4_EMAIL,
      id: config.USER4_ID,
      wallet: config.USER4_WALLET,
      tokenAmount: parseInt(config.USER4_TOKENS),
      name: 'Aníbal'
    });
    users.push({
      email: config.USER5_EMAIL,
      id: config.USER5_ID,
      wallet: config.USER5_WALLET,
      tokenAmount: parseInt(config.USER5_TOKENS),
      name: 'Claire'
    });
  } else {
    // Usuarios seleccionados
    const selectedNumbers = selection.split(',').map(n => parseInt(n.trim()));
    
    if (selectedNumbers.includes(1)) {
      users.push({
        email: config.USER1_EMAIL,
        id: config.USER1_ID,
        wallet: config.USER1_WALLET,
        tokenAmount: parseInt(config.USER1_TOKENS),
        name: 'Franklin'
      });
    }
    if (selectedNumbers.includes(2)) {
      users.push({
        email: config.USER2_EMAIL,
        id: config.USER2_ID,
        wallet: config.USER2_WALLET,
        tokenAmount: parseInt(config.USER2_TOKENS),
        name: 'Sergio'
      });
    }
    if (selectedNumbers.includes(3)) {
      users.push({
        email: config.USER3_EMAIL,
        id: config.USER3_ID,
        wallet: config.USER3_WALLET,
        tokenAmount: parseInt(config.USER3_TOKENS),
        name: 'Jose Vera'
      });
    }
    if (selectedNumbers.includes(4)) {
      users.push({
        email: config.USER4_EMAIL,
        id: config.USER4_ID,
        wallet: config.USER4_WALLET,
        tokenAmount: parseInt(config.USER4_TOKENS),
        name: 'Aníbal'
      });
    }
    if (selectedNumbers.includes(5)) {
      users.push({
        email: config.USER5_EMAIL,
        id: config.USER5_ID,
        wallet: config.USER5_WALLET,
        tokenAmount: parseInt(config.USER5_TOKENS),
        name: 'Claire'
      });
    }
  }
  
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
    projectId = config.PROJECT_NAME; // Usar el por defecto
  }
  
  rl.close();
  return projectId;
}

async function simulateClicks(users, config, projectId) {
  console.log(`\n🚀 Simulando ${users.length} usuarios haciendo clic simultáneamente...`);
  console.log(`🎯 Proyecto: ${projectId}`);
  console.log(`⏱️  Ventana de clics: ${config.BURST_TIME}ms\n`);
  
  users.forEach((user, index) => {
    console.log(`👤 Usuario ${index + 1}: ${user.name} - ${user.tokenAmount} tokens`);
  });
  console.log('');
  
  const promises = users.map((user, index) => {
    const delay = Math.random() * 200; // 0-200ms delay
    
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
          
          const responseTime = Date.now() - startTime;
          const status = result.success ? '✅' : '❌';
          
          console.log(`${status} [${user.name}] ${user.tokenAmount} tokens - ${responseTime}ms`);
          if (!result.success) console.log(`   Error: ${result.error}`);
          
          resolve({ 
            success: result.success, 
            tokens: user.tokenAmount, 
            time: responseTime,
            user: user.name,
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
            error: error.message
          });
        }
      }, delay);
    });
  });
  
  const startTime = Date.now();
  const results = await Promise.all(promises);
  const totalTime = Date.now() - startTime;
  
  return { results, totalTime };
}

function generateReport(results, totalTime) {
  const successful = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);
  
  const totalTokens = results.reduce((sum, r) => sum + r.tokens, 0);
  const successfulTokens = successful.reduce((sum, r) => sum + r.tokens, 0);
  
  const responseTimes = results.map(r => r.time);
  const avgResponseTime = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
  
  console.log('\n' + '='.repeat(50));
  console.log('📊 REPORTE FINAL');
  console.log('='.repeat(50));
  console.log(`⏰ Tiempo total: ${totalTime}ms`);
  console.log(`👥 Usuarios: ${results.length}`);
  console.log(`✅ Exitosos: ${successful.length} (${(successful.length / results.length * 100).toFixed(1)}%)`);
  console.log(`❌ Fallidos: ${failed.length}`);
  console.log(`🎫 Tokens intentados: ${totalTokens}`);
  console.log(`🎫 Tokens exitosos: ${successfulTokens}`);
  console.log(`⏱️  Tiempo promedio: ${Math.round(avgResponseTime)}ms`);
  
  if (failed.length > 0) {
    console.log('\n❌ ERRORES POR USUARIO:');
    failed.forEach(result => {
      console.log(`   ${result.user}: ${result.error}`);
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
  
  console.log('='.repeat(50));
}

async function main() {
  try {
    console.log('🎯 SIMULADOR INTERACTIVO DE MÚLTIPLES USUARIOS');
    console.log('='.repeat(50));
    
    // Cargar configuración
    const config = await loadMultiUserConfig('multi-users-config.txt');
    
    // Seleccionar usuarios
    const users = await selectUsers(config);
    
    if (users.length === 0) {
      console.log('❌ No se seleccionaron usuarios válidos');
      process.exit(1);
    }
    
    // Seleccionar proyecto
    const projectId = await selectProject(config);
    
    // Confirmar simulación
    const rl = createReadlineInterface();
    console.log(`\n📋 RESUMEN:`);
    console.log(`👥 Usuarios: ${users.map(u => u.name).join(', ')}`);
    console.log(`🎯 Proyecto: ${projectId}`);
    console.log(`🎫 Tokens totales: ${users.reduce((sum, u) => sum + u.tokenAmount, 0)}`);
    
    const confirm = await askQuestion(rl, '\n¿Continuar con la simulación? (y/n): ');
    rl.close();
    
    if (confirm.toLowerCase() !== 'y' && confirm.toLowerCase() !== 'yes') {
      console.log('❌ Simulación cancelada');
      process.exit(0);
    }
    
    // Ejecutar simulación
    const simulationResult = await simulateClicks(users, config, projectId);
    
    // Generar reporte
    generateReport(simulationResult.results, simulationResult.totalTime);
    
  } catch (error) {
    console.error(`❌ Error: ${error.message}`);
    process.exit(1);
  }
}

main();
