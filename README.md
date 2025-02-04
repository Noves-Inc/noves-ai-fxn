# Noves AI Agent

This repository demonstrates how to create an agent that integrates with the FXN protocol to provide token price and wallet balance data using Noves' APIs. It serves as a reference implementation for teams looking to build their own data agents.

## Overview

The Noves AI Agent:

1. Makes service offers to the FXN server at regular intervals
2. Provides real-time token price data across multiple blockchains
3. Fetches wallet balance information with USD valuations
4. Follows the FXN protocol's ServiceOffer and AsyncResponse patterns
5. Implements secure message signing and verification

## Features

- Real-time token price lookups across Ethereum, Solana, and Polygon
- Detailed wallet balance information with USD value calculations
- Smart error handling and response formatting
- TypeScript implementation with full type safety
- Secure message signing for all communications
- Configurable offer intervals

## Input/Output Format

The agent accepts two types of requests:

### Token Price Request
```json
{
  "type": "token_price",
  "params": {
    "token": "ETH",
    "blockchain": "ethereum"
  }
}
```

### Wallet Balance Request
```json
{
  "type": "wallet_balance",
  "params": {
    "wallet": "0x1234...5678",
    "blockchain": "ethereum"
  }
}
```

## Getting Started

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:
Copy `.env.example` to `.env` and fill in:
```
# OpenAI API Key for the LLM
OPENAI_API_KEY=your_openai_api_key

# FXN Protocol Configuration
WALLET_PRIVATE_KEY=your_wallet_private_key
WALLET_PUBLIC_KEY=your_wallet_public_key
RPC_URL=your_rpc_url
MAINNET_RPC_URL=your_mainnet_rpc_url

# Noves API Configuration
NOVES_API_KEY=your_noves_api_key
NOVES_PRICE_API=https://api.noves.com/v1/prices
NOVES_BALANCE_API=https://api.noves.com/v1/balances

# Agent Configuration
OFFER_INTERVAL_MS=30000  # 30 seconds by default
```

3. Run the example:
```bash
npm start
```

## Service Offers

The agent makes service offers to the FXN server:

```typescript
{
  serviceType: ServiceType.DATA,
  serviceName: "noves_ai",
  capabilities: [
    "token_price_lookup",
    "wallet_balance_lookup"
  ],
  metadata: {
    supported_blockchains: ["ethereum", "solana", "polygon"],
    api_version: "1.0.0",
    supported_request_types: ["token_price", "wallet_balance"]
  }
}
```

## Response Format

### Token Price Response
```typescript
{
  serviceType: ServiceType.DATA,
  serviceName: "noves_price_data",
  requestId: string,
  response: {
    status: 'success',
    data: {
      price: number,
      timestamp: string,
      blockchain: string,
      token: string
    }
  }
}
```

### Wallet Balance Response
```typescript
{
  serviceType: ServiceType.DATA,
  serviceName: "noves_balance_data",
  requestId: string,
  response: {
    status: 'success',
    data: {
      balances: [{
        token: string,
        amount: number,
        value_usd?: number
      }],
      wallet: string,
      blockchain: string,
      timestamp: string
    }
  }
}
```

## Error Handling

The agent includes comprehensive error handling for:
- API request failures
- Invalid request parameters
- Network communication issues
- Message signing/verification errors

## Project Structure

```
├── agent.ts           # Main agent implementation
├── types.ts           # TypeScript type definitions
├── example.ts         # Example usage and testing
├── utils/
│   └── signingUtils.ts # Message signing utilities
├── .env.example       # Environment variables template
└── tsconfig.json      # TypeScript configuration
```

## Getting Registered with FXN

Before your agent can participate in the FXN network, you need to register it. Follow these steps:

1. Ensure you have:
   - A Solana wallet with SOL for transactions
   - Your agent's public/private key pair

2. Register your agent:
   - Visit the [FXN documentation](https://docs.fxn.world/developers/quick-start)
   - Follow the registration process
   - Configure your agent's endpoint

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a new Pull Request

## License

MIT 
