# Domoblock Mass Purchase Simulator

Un simulador de Node.js para realizar múltiples compras en proyectos de Domoblock, inspirado en el SaleTest original.

## Características

- Simula múltiples transacciones de compra
- Configuración simple y directa
- Formato similar al SaleTest original

## Requisitos previos

- Node.js 14.x o superior
- npm o yarn

## Instalación

Clona el repositorio e instala las dependencias:

```bash
git clone <repository-url>
cd domoblock-mass-purchase
npm install
```

## Configuración

Edita el archivo `config.franklin.txt` o crea uno nuevo con el siguiente formato:

```
API_URL=https://domoblockfiat.devmitsoftware.com
USER_EMAIL=usuario@mail.net
PROJECT_NAME=id_del_proyecto
TEST_SIZE=10
TOKEN_AMOUNT=1
```

Dónde:
- `API_URL`: URL de la API de Domoblock
- `USER_EMAIL`: Email del usuario que realiza las compras
- `PROJECT_NAME`: ID del proyecto en el que se realizarán las compras
- `TEST_SIZE`: Número de transacciones a simular
- `TOKEN_AMOUNT`: Número de tokens por transacción

## Uso

Ejecuta el simulador con:

```bash
node index.js --config config.franklin.txt
```

### Opciones de línea de comandos

- `--config <file>`: Especifica el archivo de configuración a utilizar (requerido)
- `--checkAmount`: Verifica el saldo antes de cada compra (no implementado)
- `--checkTokens`: Verifica los tokens disponibles (no implementado)
- `--debug`: Muestra información detallada de las peticiones
- `--help`: Muestra la información de ayuda

## Ejemplo con franklin@domoblock.io

Hay un archivo de configuración listo para el usuario franklin@domoblock.io:

```bash
node index.js --config config.franklin.txt
```

Este archivo está configurado para realizar 10 compras de 1 token cada una en el proyecto con ID 1745547162924. 