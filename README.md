Bulk Transaction Concurrency Simulator

Execute Concurrent Bulk Purchase Transactions on Domoblock

Welcome to the Bulk Transaction Concurrency Simulator, a Node.js utility crafted to stress-test and validate bulk purchase workflows on the Domoblock platform. By leveraging concurrent API calls, this tool helps you ensure reliability and performance under high-load scenarios.

Core Features

Concurrent Transactions: Execute multiple purchase requests in parallel.

Flexible Configuration: Environment-based settings via .env or custom config files.

Command-Line Controls: Debugging flags, balance checks, and token verifications.

Extensible Architecture: Modular codebase for easy enhancements and integrations.

Why Use This Simulator?

Traditional load tests may not accurately reflect real-world usage patterns. This simulator:

Validates your API’s concurrency handling.

Identifies bottlenecks in Domoblock purchase flows.

Ensures token distribution logic remains intact under stress.

Motivation

Deepen System Resilience: Test edge cases for simultaneous transactions.

Performance Benchmarking: Measure throughput and latency under load.

Automation Ready: Integrate into CI/CD pipelines for continuous testing.

Getting Started

Follow these instructions to set up and run the simulator locally.

Prerequisites

Node.js v14 or higher

npm or yarn

Installation

# Clone the repository
git clone https://github.com/Franklin-Osede/Bulk-Transaction-Concurrency.git
cd Bulk-Transaction-Concurrency

# Install dependencies
npm install

Configuration

Create a .env file or custom config (e.g., config.env) with the following variables:

API_URL=https://domoblockfiat.devmitsoftware.com
USER_EMAIL=user@example.com
PROJECT_NAME=<project_id>
TEST_SIZE=10
TOKEN_AMOUNT=1

Variable

Description

API_URL

Base URL for the Domoblock API

USER_EMAIL

Authentication email for transactions

PROJECT_NAME

Domoblock project identifier

TEST_SIZE

Number of transactions to simulate

TOKEN_AMOUNT

Tokens per transaction

Running the Simulator

node index.js --config .env

# Or use a custom config file
node index.js --config config.sergio.txt
node index.js --config config.franklin.txt

Command-Line Options

--config <file>     : Path to configuration file (required)

--checkAmount       : Validate account balance before each purchase

--checkTokens       : Verify token availability before purchase

--debug             : Enable verbose API request logging

--help              : Display help information

Built With

Node.js for the runtime environment

Axios for HTTP requests

dotenv for environment variable management

Commander for CLI argument parsing

Contributing

Contributions are welcome! To contribute:

Fork the repository

Create a feature branch: git checkout -b feature/YourFeature

Commit your changes: `git commit -m 'Add YourFeature'

Push to the branch: git push origin feature/YourFeature

Open a Pull Request

License

Distributed under the MIT License. See LICENSE for more information.

Project Link

Bulk Transaction Concurrency on GitHub

