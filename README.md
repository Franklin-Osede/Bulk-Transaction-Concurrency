# Bulk Transaction Concurrency – Concurrency Simulator for Bulk Transactions

Concurrency simulation and testing system to validate the robustness of the Domoblock platform under simultaneous load conditions. This repository contains tools for stress testing, race condition detection, and performance analysis in real production scenarios.

**Node.js** **Axios** **Yargs** **Firebase Admin**

---

## Table of Contents

- [Overview](#overview)
- [Key Features](#key-features)
- [Project Architecture](#project-architecture)
- [Project Structure](#project-structure)
- [Installation](#installation)
- [Configuration](#configuration)
- [Usage](#usage)
- [Simulation Tools](#simulation-tools)
- [Testing Scenarios](#testing-scenarios)
- [Monitoring and Metrics](#monitoring-and-metrics)
- [Troubleshooting](#troubleshooting)
- [Best Practices](#best-practices)
- [Contributing](#contributing)
- [License](#license)

---

## Overview

**Bulk Transaction Concurrency** is a suite of tools designed to simulate and analyze the behavior of the Domoblock platform when multiple users perform simultaneous transactions. The system replicates real production scenarios where multiple users click the token reservation button at the same time, enabling:

- **Stress Testing**: Test system limits under different loads
- **Race Condition Detection**: Identify concurrency conflicts
- **Performance Analysis**: Measure response times and throughput
- **Robustness Validation**: Ensure the system correctly handles concurrent transactions
- **Continuous Testing**: Integration into CI/CD pipelines

### Use Cases

- Validate concurrency handling in token reservations  
- Detect race conditions before production  
- Measure performance under simultaneous load  
- Test different real-world usage scenarios  
- Identify system bottlenecks  
- Validate data integrity under concurrency  

---

## Key Features

### Simulations

- **Simultaneous Clicks Simulation**: Replicates users clicking at the same time
- **Multi-User**: Support for multiple users with individual configurations
- **Stress Testing**: Different load scenarios (burst, sustained, spike, gradual)
- **Real-Time Monitoring**: Concurrency analysis and race condition detection
- **Complete Test Suite**: Automated execution of all scenarios

### Analysis and Reports

- **Detailed Metrics**: Success rate, response times, throughput
- **Automatic Race Condition Detection**: Identification of concurrency conflicts
- **Consolidated Reports**: Analysis of each simulation
- **Logging**: Configurable logging system with levels and rotation

### Flexible Configuration

- **Multiple Formats**: `.txt`, `.json` files and environment variables
- **Per-User Configuration**: Custom tokens and parameters per user
- **Command-Line Overrides**: Override configuration without editing files
- **Interactive Mode**: Interactive selection of users and projects

### Development Tools

- **CLI**: Command-line interface with multiple options
- **Debug Mode**: Detailed information for troubleshooting
- **Configuration Validation**: Automatic verification of required parameters
- **Error Handling**: Error management with descriptive messages

---

## Project Architecture

### Simulation Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    Configuration File                        │
│  (users-config.json / config.txt / .env)                     │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│              Configuration Loading and Validation            │
│                    (config.js)                               │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│              Simulation Tool                                 │
│  (index.js / multi-users.js / simultaneous-clicks.js / etc) │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│              Investments Module                             │
│                    (investments.js)                          │
│  - makePurchase() - Performs individual purchase            │
│  - runSimulation() - Executes simulation                  │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│              Domoblock API                                  │
│         POST /projects/reserve                              │
│  (https://redsys.api.devtop.online)                         │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│              Logging System                                 │
│                    (logger.js)                              │
│  - Structured logs                                          │
│  - Automatic rotation                                       │
│  - Configurable levels                                      │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│              Results Report                                  │
│  - Performance metrics                                      │
│  - Error analysis                                           │
│  - Race condition detection                                 │
└─────────────────────────────────────────────────────────────┘
```

### Main Components

**Core Modules:**
- `investments.js`: Token purchase logic and simulation
- `config.js`: Configuration loading and validation
- `logger.js`: Logging system

**Simulation Tools:**
- `index.js`: Basic sequential transactions simulator
- `multi-users.js`: Multi-user simulation with JSON
- `simultaneous-clicks.js`: Simultaneous clicks simulation
- `stress-test.js`: Stress testing with multiple scenarios
- `concurrency-monitor.js`: Real-time monitoring
- `complete-test-suite.js`: Complete test suite

**Interactive Tools:**
- `interactive-simulator.js`: Interactive simulator
- `interactive-multi-user.js`: Interactive multi-user
- `select-users.js`: Interactive user selection

---

## Project Structure

```
Bulk-Transaction-Concurrency/
├── index.js                      # Main simulator (sequential transactions)
├── investments.js                 # Core module: purchase logic
├── config.js                      # Configuration loading and validation
├── logger.js                      # Logging system
│
├── multi-users.js                 # Multi-user simulation (JSON)
├── simultaneous-clicks.js         # Simultaneous clicks simulation
├── stress-test.js                 # Stress testing
├── concurrency-monitor.js         # Concurrency monitoring
├── complete-test-suite.js         # Complete test suite
│
├── interactive-simulator.js      # Interactive simulator
├── interactive-multi-user.js     # Interactive multi-user
├── select-users.js               # Interactive selection
│
├── multi-user-simulator.js       # Multi-user simulator (config .txt)
├── multi-users-simple.js          # Simplified version
├── simple-multi-user.js           # Simple version
│
├── config.js                     # Alternative configuration
├── config-simple.js              # Simple configuration
├── config-sim.js                 # Simulation configuration
├── multi-config.js               # Multi-user configuration
│
├── config.franklin.txt           # Individual config: Franklin
├── config.josevera.txt           # Individual config: Jose Vera
├── config.sergio.txt             # Individual config: Sergio
├── config.sergio2.txt            # Alternative config: Sergio
├── multi-users-config.txt        # Multi-user config (format .txt)
│
├── users-config.json             # Multi-user configuration (JSON)
│
├── package.json                  # Dependencies and scripts
├── package-lock.json             # Dependency lock file
│
├── README.md                     # This file
├── README-concurrency-simulation.md  # Concurrency simulation docs
└── README-users-config.md        # User configuration docs
```

---

## Installation

### Prerequisites

- **Node.js**: v14 or higher (v18+ recommended)
- **npm**: v6 or higher
- **API Access**: Valid Domoblock credentials

### Installing Dependencies

```bash
# Clone the repository
git clone <repository-url>
cd Bulk-Transaction-Concurrency

# Install dependencies
npm install
```

### Main Dependencies

- **axios**: ^1.9.0 - HTTP client for API calls
- **dotenv**: ^16.5.0 - Environment variable management
- **yargs**: ^17.7.2 - Command-line argument parsing
- **firebase-admin**: ^13.3.0 - Firebase integration (if required)

---

## Configuration

### Format 1: JSON File (Recommended for Multi-User)

File: `users-config.json`

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

### Format 2: Text File (.txt)

File: `config.user.txt`

```txt
# User Configuration
API_URL=https://redsys.api.devtop.online
USER_EMAIL=user@example.com
USER_ID=user_id_123
USER_WALLET=wallet_id_456
PROJECT_NAME=1747217659342
TEST_SIZE=10
TOKEN_AMOUNT=1
```

### Format 3: Environment Variables (.env)

File: `.env`

```env
API_URL=https://redsys.api.devtop.online
USER_EMAIL=user@example.com
USER_ID=user_id_123
USER_WALLET=wallet_id_456
PROJECT_NAME=1747217659342
TEST_SIZE=10
TOKEN_AMOUNT=1
```

### Configuration Parameters

| Parameter | Description | Required | Example |
|-----------|-------------|-----------|---------|
| `API_URL` | Base URL of the Domoblock API | Required | `https://redsys.api.devtop.online` |
| `USER_EMAIL` | User email for authentication | Required | `user@example.com` |
| `USER_ID` | Unique user ID | Required | `user_id_123` |
| `USER_WALLET` | User wallet ID | Required | `wallet_id_456` |
| `PROJECT_NAME` | Domoblock project ID | Required | `1747217659342` |
| `TEST_SIZE` | Number of transactions to execute | Optional | `10` (default: 1) |
| `TOKEN_AMOUNT` | Number of tokens per transaction | Optional | `1` (default: 1) |

---

## Usage

### Basic Simulation (Sequential Transactions)

```bash
# Use .txt configuration file
node index.js --config config.user.txt

# With additional options
node index.js --config config.user.txt --checkAmount --checkTokens --debug
```

**Available options:**
- `--config, -c`: Configuration file (required)
- `--checkAmount, -a`: Check balance before each purchase
- `--checkTokens, -t`: Check available tokens before purchase
- `--debug`: Show detailed debugging information
- `--multiUser, -m`: Multi-user mode (testing)

### Multi-User Simulation (JSON)

```bash
# Use default JSON configuration
node multi-users.js

# Specify configuration file
node multi-users.js --config users-config.json

# Override parameters
node multi-users.js --project 1747219717496 --tokens 2 --size 20

# Limit concurrent users
node multi-users.js --concurrent 2

# Debug mode
node multi-users.js --debug
```

**Available options:**
- `--config, -c`: JSON configuration file (default: `users-config.json`)
- `--project, -p`: Project ID (overrides configuration)
- `--tokens, -t`: Tokens per purchase (overrides configuration)
- `--size, -s`: Number of purchases per user (overrides configuration)
- `--concurrent, -n`: Maximum concurrent users (0 = all)
- `--debug, -d`: Debug mode

### Simultaneous Clicks Simulation

```bash
# Basic simulation
node simultaneous-clicks.js --config users-config.json

# Customize parameters
node simultaneous-clicks.js \
  --config users-config.json \
  --tokens 1 \
  --users 3 \
  --burst 2000 \
  --delay 100 \
  --debug
```

**Available options:**
- `--config, -c`: JSON configuration file
- `--project, -p`: Project ID
- `--tokens, -t`: Tokens per purchase
- `--users, -u`: Number of users (0 = all)
- `--delay, -d`: Random delay between clicks (ms)
- `--burst, -b`: Time window for simultaneous clicks (ms)
- `--debug`: Debug mode

### Stress Testing

```bash
# Burst scenario (all users at the same time)
node stress-test.js --config users-config.json --scenario burst --iterations 3

# Sustained scenario (constant load)
node stress-test.js --config users-config.json --scenario sustained --iterations 5

# Spike scenario (sudden increase)
node stress-test.js --config users-config.json --scenario spike

# Gradual scenario (progressive increase)
node stress-test.js --config users-config.json --scenario gradual
```

**Available scenarios:**
- `burst`: All users click simultaneously
- `sustained`: Constant load over a period
- `spike`: Sudden load increase
- `gradual`: Progressive load increase

### Concurrency Monitoring

```bash
# Monitor for 30 seconds
node concurrency-monitor.js --config users-config.json --duration 30

# Extended monitoring with custom interval
node concurrency-monitor.js \
  --config users-config.json \
  --duration 60 \
  --monitor-interval 2000 \
  --debug
```

**Available options:**
- `--config, -c`: JSON configuration file
- `--duration, -d`: Monitoring duration (seconds)
- `--monitor-interval, -i`: Update interval (ms)
- `--debug`: Debug mode

### Complete Test Suite

```bash
# Run all tests
node complete-test-suite.js --config users-config.json --tokens 1 --debug
```

### Interactive Simulator

```bash
# Basic interactive simulator
node interactive-simulator.js

# Interactive multi-user
node interactive-multi-user.js
```

---

## Simulation Tools

### 1. `index.js` - Main Simulator

Simulates sequential transactions for a single user. Ideal for basic testing and functionality validation.

**Features:**
- Sequential transactions with configurable delay
- Balance and token validation (optional)
- Detailed results report
- Support for `.txt` configuration files

### 2. `multi-users.js` - Multi-User Simulation

Executes simulations for multiple users defined in a JSON file. Supports individual configuration per user.

**Features:**
- Multiple simultaneous users
- Individual token configuration per user
- Concurrency control
- Consolidated report per user

### 3. `simultaneous-clicks.js` - Simultaneous Clicks

Simulates real production behavior where multiple users click at the same time.

**Features:**
- Simultaneous clicks simulation with configurable time window
- Random delay for realistic human behavior
- Concurrency and race condition analysis
- Throughput and response time metrics

### 4. `stress-test.js` - Stress Testing

Executes different load scenarios to test system limits.

**Scenarios:**
- **Burst**: All users simultaneously
- **Sustained**: Constant load over extended period
- **Spike**: Sudden load increase
- **Gradual**: Progressive load increase

### 5. `concurrency-monitor.js` - Real-Time Monitoring

Monitors and analyzes concurrency during transactions, automatically detecting race conditions.

**Features:**
- Real-time monitoring of concurrent requests
- Automatic race condition detection
- Real-time performance metrics
- Error analysis by type

### 6. `complete-test-suite.js` - Complete Suite

Executes all testing scenarios and generates a consolidated report.

**Features:**
- Automated execution of all tests
- Consolidated report with aggregated metrics
- Comparative scenario analysis
- Systematic problem identification

---

## Testing Scenarios

### Scenario 1: Real Production

Simulates exactly what happens in production when users click simultaneously.

```bash
node simultaneous-clicks.js \
  --config users-config.json \
  --burst 500 \
  --delay 25 \
  --tokens 1
```

### Scenario 2: Stress Testing

Tests system limits under high load.

```bash
node stress-test.js \
  --config users-config.json \
  --scenario burst \
  --iterations 10
```

### Scenario 3: Continuous Monitoring

Monitors the system over an extended period.

```bash
node concurrency-monitor.js \
  --config users-config.json \
  --duration 300 \
  --monitor-interval 5000
```

### Scenario 4: Integrity Validation

Verifies that no race conditions or data loss occur.

```bash
node complete-test-suite.js \
  --config users-config.json \
  --tokens 1 \
  --debug
```

---

## Monitoring and Metrics

### Key Metrics

**Success Rate:**
- `≥ 95%`: Ready for production
- `85-94%`: Needs monitoring
- `70-84%`: Requires optimizations
- `< 70%`: Not ready for production

**Race Conditions:**
- `0`: No race conditions detected
- `< 2%`: Stable system
- `≥ 2%`: Requires attention

**Concurrency:**
- `Peak > 20`: High scalability
- `Peak 10-20`: Good concurrency capacity
- `Peak < 10`: Limited concurrency capacity

### Sample Report

```
SIMULTANEOUS CLICKS SIMULATION REPORT
============================================================
Total simulation time: 2150ms
Start: 2024-01-15T10:30:00.000Z
End: 2024-01-15T10:30:02.150Z

PERFORMANCE METRICS:
   Total simulated users: 3
   Successful: 3 (100.00%)
   Failed: 0
   Throughput: 1.40 users/second

TOKEN METRICS:
   Tokens attempted: 3
   Successful tokens: 3
   Token success rate: 100.00%

RESPONSE TIMES:
   Average: 1250ms
   Minimum: 980ms
   Maximum: 1450ms

CONCURRENCY:
   Concurrent requests: 3
   Peak concurrency: 3

USER DETAILS:
   1. user1@example.com - 1 tokens - 1200ms
   2. user2@example.com - 1 tokens - 1100ms
   3. user3@example.com - 1 tokens - 1450ms

STRESS TESTING ANALYSIS:
   System handles simultaneous load well
```

---

## Troubleshooting

### Error: "No users found"

**Cause:** The configuration file does not contain valid users.

**Solution:**
- Verify that `users-config.json` exists and has valid JSON format
- Ensure the `users` array contains at least one user
- Verify that each user has `email`, `id`, and `wallet` defined

### Error: "Connection refused" or "Network Error"

**Cause:** Connectivity issues with the API.

**Solution:**
- Verify that the API is running
- Check the URL in the configuration (`API_URL`)
- Review network connectivity and firewall
- Verify authentication credentials

### Error: "Missing required configuration values"

**Cause:** Required fields are missing in the configuration.

**Solution:**
- Verify that all required fields are present:
  - `API_URL`
  - `USER_EMAIL` (or users in JSON)
  - `PROJECT_NAME`
- Review the configuration file format

### Tests consistently fail

**Cause:** Issues with balance, available tokens, or configuration.

**Solution:**
- Verify that users have sufficient balance
- Check that the project has available tokens
- Review backend logs for specific errors
- Use `--checkAmount` and `--checkTokens` to validate before purchasing

### Race Conditions Detected

**Cause:** Multiple users competing for the same resources.

**Solution:**
- Implement optimistic locking in the backend
- Add retry logic with exponential backoff
- Use atomic transactions in the database
- Implement rate limiting

---

## Best Practices

### For Testing

1. **Run tests regularly** in CI/CD
2. **Monitor metrics** in production
3. **Document results** of each test
4. **Update tests** when business logic changes
5. **Use different scenarios** to cover edge cases

### For the Backend

1. **Implement optimistic locking** to prevent race conditions
2. **Add retry logic** with exponential backoff
3. **Use atomic transactions** in the database
4. **Implement rate limiting** to prevent abuse
5. **Validate availability** before processing transactions

### For the Frontend

1. **Disable button** during processing
2. **Show loading state** to the user
3. **Implement automatic retry** for transient errors
4. **Validate availability** before sending request
5. **Handle errors** in a user-friendly way

### Configuration

1. **Use JSON files** for multi-user configurations
2. **Keep configurations separate** by environment (dev, staging, prod)
3. **Don't commit sensitive credentials**
4. **Document configuration** parameters
5. **Validate configuration** before running tests

---

## Contributing

This is a private repository. For contributions, please contact the project maintainers.

### Contribution Process

1. Create a branch for the new functionality
2. Implement changes with appropriate tests
3. Document changes in the README if necessary
4. Create a Pull Request with detailed description
5. Wait for review and approval

---

## License

**Private – Domoblock**

All rights reserved. This software is proprietary and confidential.

---

## Support

For technical support or questions:

- **Documentation**: See README files in the directory
- **Issues**: Review logs and detailed error messages
- **Configuration**: Check example files in the repository


