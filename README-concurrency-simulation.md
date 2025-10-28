# 🚀 Simulador de Concurrencia para Múltiples Usuarios

Este repositorio contiene herramientas avanzadas para simular el comportamiento real de producción donde múltiples usuarios hacen clic simultáneamente en el botón de reserva de tokens, permitiendo hacer stress testing del sistema y detectar race conditions.

## 🎯 Objetivo

Simular exactamente lo que sucede en producción cuando múltiples usuarios con diferentes cuentas hacen clic en el botón de reserva al mismo tiempo, para:
- **Stress testing** del sistema
- **Detección de race conditions**
- **Análisis de concurrencia**
- **Validación de robustez** bajo carga simultánea

## 📁 Archivos de Simulación

### 1. `simultaneous-clicks.js` - Simulación de Clics Simultáneos
Simula usuarios haciendo clic en el botón de reserva al mismo tiempo.

```bash
node simultaneous-clicks.js --config users-config.json --tokens 1 --burst 2000 --delay 100 --debug
```

**Parámetros:**
- `--burst`: Ventana de tiempo para clics "simultáneos" (ms)
- `--delay`: Delay aleatorio entre clics para simular comportamiento humano (ms)
- `--tokens`: Cantidad de tokens por compra

### 2. `stress-test.js` - Stress Testing Avanzado
Ejecuta diferentes escenarios de carga para probar el sistema.

```bash
node stress-test.js --config users-config.json --scenario burst --iterations 3 --debug
```

**Escenarios disponibles:**
- `burst`: Todos los usuarios hacen clic al mismo tiempo
- `sustained`: Carga constante durante un período
- `spike`: Incremento súbito de carga
- `gradual`: Incremento progresivo de carga

### 3. `concurrency-monitor.js` - Monitoreo de Concurrencia
Monitorea race conditions en tiempo real durante las transacciones.

```bash
node concurrency-monitor.js --config users-config.json --duration 30 --monitor-interval 1000 --debug
```

**Características:**
- Detección automática de race conditions
- Métricas de concurrencia en tiempo real
- Análisis de tiempos de respuesta
- Reporte de errores por tipo

### 4. `complete-test-suite.js` - Suite Completa
Ejecuta todos los tests y genera un reporte consolidado.

```bash
node complete-test-suite.js --config users-config.json --tokens 1 --debug
```

## 🚀 Uso Rápido

### Simulación Básica de Clics Simultáneos
```bash
# Simular 3 usuarios haciendo clic al mismo tiempo
node simultaneous-clicks.js --config users-config.json --tokens 1 --burst 1000 --delay 50
```

### Stress Testing Completo
```bash
# Ejecutar todos los escenarios de stress testing
node stress-test.js --config users-config.json --scenario burst --iterations 5
```

### Monitoreo de Concurrencia
```bash
# Monitorear por 30 segundos con updates cada 2 segundos
node concurrency-monitor.js --config users-config.json --duration 30 --monitor-interval 2000
```

### Suite Completa de Testing
```bash
# Ejecutar todos los tests y generar reporte consolidado
node complete-test-suite.js --config users-config.json --tokens 1 --debug
```

## 📊 Interpretación de Resultados

### Métricas Clave

**Tasa de Éxito:**
- `≥ 95%`: ✅ Sistema excelente para producción
- `85-94%`: ⚠️ Sistema bueno, necesita monitoreo
- `70-84%`: 🔧 Sistema aceptable, requiere optimizaciones
- `< 70%`: ❌ Sistema crítico, no listo para producción

**Race Conditions:**
- `0`: ✅ No se detectaron race conditions
- `< 2%`: ⚠️ Pocos race conditions, sistema estable
- `≥ 2%`: 🚨 Múltiples race conditions, requiere atención

**Concurrencia:**
- `Peak > 20`: 📈 Excelente escalabilidad
- `Peak 10-20`: ✅ Buena capacidad de concurrencia
- `Peak < 10`: ⚠️ Capacidad limitada de concurrencia

### Ejemplo de Reporte

```
📊 REPORTE DE SIMULACIÓN DE CLICS SIMULTÁNEOS
============================================================
⏰ Tiempo total de simulación: 2150ms
📈 MÉTRICAS DE RENDIMIENTO:
   Total requests: 3
   Exitosos: 3 (100.00%)
   Fallidos: 0
   Throughput: 1.40 requests/segundo

⏱️  TIEMPOS DE RESPUESTA:
   Promedio: 1250ms
   Mínimo: 980ms
   Máximo: 1450ms

🔄 CONCURRENCIA:
   Requests concurrentes: 3

🎯 ANÁLISIS DE STRESS TESTING:
   ✅ Sistema maneja bien la carga simultánea
```

## 🔧 Configuración

### Archivo `users-config.json`
```json
{
  "api_url": "https://redsys.api.devtop.online",
  "project_name": "1747217659342",
  "test_size": 10,
  "token_amount": 1,
  "users": [
    {
      "email": "user1@example.com",
      "id": "user_id_1",
      "wallet": "wallet_id_1",
      "token_amount": 1
    },
    {
      "email": "user2@example.com",
      "id": "user_id_2", 
      "wallet": "wallet_id_2",
      "token_amount": 2
    }
  ]
}
```

## 🎯 Escenarios de Testing

### 1. Escenario de Producción Real
```bash
# Simular exactamente lo que pasa en producción
node simultaneous-clicks.js --config users-config.json --burst 500 --delay 25 --tokens 1
```

### 2. Stress Testing Extremo
```bash
# Probar límites del sistema
node stress-test.js --config users-config.json --scenario burst --iterations 10
```

### 3. Monitoreo Continuo
```bash
# Monitorear durante 5 minutos
node concurrency-monitor.js --config users-config.json --duration 300 --monitor-interval 5000
```

## 🚨 Detección de Problemas

### Race Conditions Comunes
- **"Insufficient tokens"**: Múltiples usuarios comprando los últimos tokens
- **"Project not available"**: Proyecto bloqueado por otra transacción
- **"Concurrent modification"**: Modificación simultánea del estado

### Indicadores de Problemas
- Tasa de éxito < 90%
- Race conditions > 1%
- Tiempos de respuesta > 5 segundos
- Errores de timeout frecuentes

## 💡 Recomendaciones

### Para el Backend
1. **Implementar optimistic locking**
2. **Añadir retry logic con backoff exponencial**
3. **Usar transacciones atómicas en base de datos**
4. **Implementar rate limiting**

### Para el Frontend
1. **Deshabilitar botón durante procesamiento**
2. **Mostrar estado de carga**
3. **Implementar retry automático**
4. **Validar disponibilidad antes de enviar**

## 🔍 Troubleshooting

### Error: "No se encontraron usuarios"
- Verificar que `users-config.json` existe
- Comprobar formato JSON válido
- Asegurar que hay al menos un usuario en el array

### Error: "Connection refused"
- Verificar que la API está funcionando
- Comprobar URL en la configuración
- Revisar conectividad de red

### Tests fallan consistentemente
- Verificar que los usuarios tienen balance suficiente
- Comprobar que el proyecto tiene tokens disponibles
- Revisar logs del backend para errores

## 📈 Mejores Prácticas

1. **Ejecutar tests regularmente** en CI/CD
2. **Monitorear métricas** en producción
3. **Documentar resultados** de cada test
4. **Actualizar tests** cuando cambie la lógica de negocio
5. **Usar diferentes escenarios** para cubrir casos edge

---

**🎯 Objetivo Final:** Asegurar que el sistema puede manejar múltiples usuarios invirtiendo simultáneamente sin race conditions ni pérdida de datos.
