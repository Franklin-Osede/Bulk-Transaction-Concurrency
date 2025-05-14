# Script para Transacciones Concurrentes con Múltiples Usuarios (JSON)

Este script permite ejecutar simulaciones de compra de tokens para múltiples usuarios a la vez, utilizando un único archivo JSON de configuración que contiene los datos de todos los usuarios.

## Ventajas de este enfoque

- **Un solo archivo de configuración**: Todos los usuarios y configuraciones en un solo lugar
- **Fácil de mantener**: Añadir nuevos usuarios es tan simple como agregar una entrada en el JSON
- **Parámetros globales**: Define parámetros como URL de API, cantidad de tokens y tamaño de prueba una sola vez
- **Flexibilidad en tiempo de ejecución**: Permite sobrescribir parámetros mediante opciones de línea de comandos
- **Cantidades de tokens personalizadas**: Cada usuario puede tener su propia cantidad de tokens a comprar

## Estructura del archivo de configuración

El archivo `users-config.json` tiene la siguiente estructura:

```json
{
  "api_url": "https://redsys.api.devtop.online",
  "project_name": "1747217659342",
  "test_size": 10,
  "token_amount": 1,
  "users": [
    {
      "email": "usuario1@dominio.com",
      "id": "id_usuario1",
      "wallet": "wallet_usuario1",
      "token_amount": 1
    },
    {
      "email": "usuario2@dominio.com",
      "id": "id_usuario2",
      "wallet": "wallet_usuario2",
      "token_amount": 2
    }
  ]
}
```

El campo `token_amount` en cada usuario es opcional. Si no se proporciona, se utilizará el valor global definido en el nivel superior del archivo.

## Uso Básico

Para ejecutar el script con todos los usuarios definidos en el archivo de configuración:

```bash
node multi-users.js
```

## Opciones Disponibles

| Opción | Alias | Descripción | Valor por defecto |
|--------|-------|-------------|-------------------|
| `--config` | `-c` | Archivo JSON de configuración | `users-config.json` |
| `--project` | `-p` | ID del proyecto (sobreescribe el valor del archivo) | |
| `--tokens` | `-t` | Cantidad de tokens por compra (sobreescribe el valor global y por usuario) | |
| `--size` | `-s` | Número de compras por usuario (sobreescribe el valor del archivo) | |
| `--debug` | `-d` | Muestra información de depuración | `false` |
| `--concurrent` | `-n` | Número máximo de usuarios concurrentes (0 para todos) | `0` |
| `--help` | `-h` | Muestra la ayuda | |

## Ejemplos de Uso

### Usar un archivo de configuración diferente:

```bash
node multi-users.js --config otra-configuracion.json
```

### Sobrescribir algunos parámetros:

```bash
node multi-users.js --project 1747219717496 --tokens 2 --size 20
```

Este comando usará el archivo de configuración por defecto pero cambiará el ID del proyecto, la cantidad de tokens a comprar para todos los usuarios, y el número de compras por usuario.

### Limitar el número de usuarios concurrentes:

```bash
node multi-users.js --concurrent 2
```

Este comando ejecutará las compras para un máximo de 2 usuarios a la vez.

### Activar modo debug:

```bash
node multi-users.js --debug
```

## Configuración de cantidades personalizadas por usuario

Cada usuario puede tener su propia cantidad de tokens a comprar, definida en el campo `token_amount` de su configuración:

```json
"users": [
  {
    "email": "usuario1@dominio.com",
    "id": "id_usuario1",
    "wallet": "wallet_usuario1",
    "token_amount": 1
  },
  {
    "email": "usuario2@dominio.com",
    "id": "id_usuario2",
    "wallet": "wallet_usuario2",
    "token_amount": 3
  }
]
```

En este ejemplo, el usuario1 comprará 1 token por transacción, mientras que el usuario2 comprará 3 tokens por transacción.

**Nota**: Si utilizas la opción `--tokens` en la línea de comandos, este valor sobrescribirá las cantidades definidas en el archivo de configuración para todos los usuarios.

## Añadir Nuevos Usuarios

Para añadir nuevos usuarios, simplemente edita el archivo `users-config.json` y añade nuevas entradas en el array `users`:

```json
"users": [
  // ... usuarios existentes ...
  {
    "email": "nuevousuario@dominio.com",
    "id": "id_del_nuevo_usuario",
    "wallet": "wallet_del_nuevo_usuario",
    "token_amount": 5
  }
]
```

## Reporte Final

Al finalizar la ejecución, el script mostrará un reporte detallado con:

- Tiempo total de ejecución
- Número de usuarios procesados
- Resultados por cada usuario (transacciones exitosas y fallidas)
- Totales acumulados de transacciones
- Porcentajes de éxito y fracaso 