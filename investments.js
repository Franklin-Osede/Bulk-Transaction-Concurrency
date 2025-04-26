const axios = require('axios');
const logger = require('./logger');

/**
 * Realiza una compra de tokens
 * @param {string} apiUrl - URL base de la API
 * @param {string} userEmail - Email del usuario
 * @param {string} projectName - ID del proyecto
 * @param {number} tokenAmount - Cantidad de tokens a comprar
 * @param {boolean} debug - Mostrar información de depuración
 * @param {string} userId - ID del usuario
 * @param {string} userWallet - ID del wallet del usuario
 * @returns {Promise<Object>} - Resultado de la compra
 */
async function makePurchase(apiUrl, userEmail, projectName, tokenAmount, debug = false, userId, userWallet) {
  // Endpoint correcto probado en Postman
  const url = `${apiUrl}/projects/reserve`;

  try {
    // Formato correcto probado en Postman
    const data = {
      isExternal: false,
      projectId: projectName,
      totalAmount: tokenAmount * 10000, // Multiplicado por 10000 como en el ejemplo
      totalTokens: tokenAmount,
      userId: userId,
      userWallet: userWallet
    };

    if (debug) {
      console.log('=========== DEBUG INFO ===========');
      console.log('URL:', url);
      console.log('Data:', JSON.stringify(data, null, 2));
      console.log('Headers:', JSON.stringify({
        'Content-Type': 'application/json',
        'User-Email': userEmail
      }, null, 2));
      console.log('==================================');
    }

    const response = await axios.post(url, data, {
      headers: {
        'Content-Type': 'application/json',
        'User-Email': userEmail
      }
    });

    if (debug && response.data) {
      console.log('========= RESPONSE INFO ==========');
      console.log('Status:', response.status);
      console.log('Data:', JSON.stringify(response.data, null, 2));
      console.log('==================================');
    }

    return { success: true, data: response.data };
  } catch (error) {
    if (debug) {
      console.log('=========== ERROR INFO ===========');
      console.log('URL:', url);
      console.log('Error:', error.message);

      if (error.response) {
        console.log('Status:', error.response.status);
        console.log('Status Text:', error.response.statusText);
        console.log('Headers:', JSON.stringify(error.response.headers, null, 2));
        if (error.response.data) {
          console.log('Data:', JSON.stringify(error.response.data, null, 2));
        }
      }

      console.log('==================================');
    }

    const errorMsg = error.response?.data?.message || error.message;
    return { success: false, error: errorMsg };
  }
}

/**
 * Ejecuta una simulación de compras
 * @param {Object} config - Configuración
 * @param {Object} options - Opciones de simulación
 * @returns {Promise<Object>} - Resultados de la simulación
 */
async function runSimulation(config, options = {}) {
  const { checkAmount, checkTokens, debug } = options;
  const results = {
    total: parseInt(config.TEST_SIZE, 10),
    successful: 0,
    failed: 0,
    errors: []
  };

  logger.info(`Iniciando simulación para proyecto: ${config.PROJECT_NAME}`);
  logger.info(`Total inversiones: ${results.total}, Tokens por inversión: ${config.TOKEN_AMOUNT}`);

  if (debug) {
    console.log('======== CONFIG INFO ==========');
    console.log('API URL:', config.API_URL);
    console.log('User Email:', config.USER_EMAIL);
    console.log('User ID:', config.USER_ID);
    console.log('User Wallet:', config.USER_WALLET);
    console.log('Project:', config.PROJECT_NAME);
    console.log('Test Size:', config.TEST_SIZE);
    console.log('Token Amount:', config.TOKEN_AMOUNT);
    console.log('===============================');
  }

  // Realizar compras secuencialmente
  for (let i = 0; i < results.total; i++) {
    try {
      if (debug) {
        console.log(`\n\n=========== COMPRA ${i + 1}/${results.total} ===========`);
      }

      const result = await makePurchase(
        config.API_URL,
        config.USER_EMAIL,
        config.PROJECT_NAME,
        parseInt(config.TOKEN_AMOUNT, 10),
        debug,
        config.USER_ID,
        config.USER_WALLET
      );

      if (result.success) {
        results.successful++;
        logger.info(`Compra ${i + 1}/${results.total}: Éxito`);
      } else {
        results.failed++;
        results.errors.push({ index: i + 1, error: result.error });
        logger.error(`Compra ${i + 1}/${results.total}: Fallida - ${result.error}`);
      }

      // Añadir un pequeño retraso entre compras para evitar sobrecarga
      await new Promise(resolve => setTimeout(resolve, 500));
    } catch (error) {
      results.failed++;
      results.errors.push({ index: i + 1, error: error.message });
      logger.error(`Compra ${i + 1}/${results.total}: Error - ${error.message}`);
    }
  }

  // Reporte final
  logger.info(`Simulación completada: ${results.successful} exitosas, ${results.failed} fallidas`);

  return results;
}

module.exports = {
  makePurchase,
  runSimulation
}; 