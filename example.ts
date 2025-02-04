import { NovesAIAgent } from './agent';
import { config } from 'dotenv';
import { LocalAgentConfiguration, ModelProvider, Schema, SchemaProperty } from './types';

// Load environment variables
config();

// Define schema properties
const typeProperty: SchemaProperty = {
  type: 'string',
  description: 'Type of data request',
  enum: ['token_price', 'wallet_balance']
};

const paramsProperties: Record<string, SchemaProperty> = {
  token: {
    type: 'string',
    description: 'Token symbol or address'
  },
  wallet: {
    type: 'string',
    description: 'Wallet address'
  },
  blockchain: {
    type: 'string',
    description: 'Blockchain network'
  }
};

const inputFormat: Schema = {
  type: 'object',
  properties: {
    type: typeProperty,
    params: {
      type: 'object',
      description: 'Request parameters',
      properties: paramsProperties
    }
  },
  required: ['type', 'params']
};

const statusProperty: SchemaProperty = {
  type: 'string',
  description: 'Response status',
  enum: ['success', 'error']
};

const balanceItemProperties: Record<string, SchemaProperty> = {
  token: {
    type: 'string',
    description: 'Token symbol or address'
  },
  amount: {
    type: 'number',
    description: 'Token amount'
  },
  value_usd: {
    type: 'number',
    description: 'USD value of token balance'
  }
};

const outputFormat: Schema = {
  type: 'object',
  properties: {
    status: statusProperty,
    data: {
      type: 'object',
      description: 'Response data',
      properties: {
        price: {
          type: 'number',
          description: 'Token price in USD'
        },
        balances: {
          type: 'array',
          description: 'Array of token balances',
          items: {
            type: 'object',
            description: 'Token balance information',
            properties: balanceItemProperties
          }
        }
      }
    },
    error: {
      type: 'string',
      description: 'Error message if status is error'
    }
  },
  required: ['status']
};

// Create agent configuration
const agentConfig: LocalAgentConfiguration = {
  id: process.env.WALLET_PUBLIC_KEY || 'default_agent_id',
  name: 'NovesAI Agent',
  version: '1.0.0',
  created: new Date().toISOString(),
  updated: new Date().toISOString(),
  background: {
    bio: ['I provide token prices and wallet balances across multiple blockchains'],
    goals: ['Deliver accurate blockchain data through Noves APIs'],
    lore: []
  },
  technical: {
    model: {
      provider: 'openai' as ModelProvider,
      name: process.env.MODEL_NAME || 'gpt-4',
      temperature: 0.3,
      maxTokens: 1000,
      apiKey: process.env.OPENAI_API_KEY
    },
    capabilities: ['token_price_lookup', 'wallet_balance_lookup'],
    system_prompt: 'You are a blockchain data provider specialized in token prices and wallet balances.',
    input_format: inputFormat,
    output_format: outputFormat
  }
};

async function main() {
  // Create the agent
  const agent = new NovesAIAgent(agentConfig);

  // Start the agent
  await agent.start();

  // Example request handling
  const priceRequest = {
    actionId: 'test-1',
    type: 'token_price',
    payload: {
      type: 'token_price',
      params: {
        token: 'ETH',
        blockchain: 'ethereum'
      }
    }
  };

  const balanceRequest = {
    actionId: 'test-2',
    type: 'wallet_balance',
    payload: {
      type: 'wallet_balance',
      params: {
        wallet: '0x1234...5678',
        blockchain: 'ethereum'
      }
    }
  };

  // Process example requests
  const priceResponse = await agent['processRequest'](priceRequest);
  console.log('Price Response:', JSON.stringify(priceResponse, null, 2));

  const balanceResponse = await agent['processRequest'](balanceRequest);
  console.log('Balance Response:', JSON.stringify(balanceResponse, null, 2));

  // Clean shutdown after 1 minute
  setTimeout(async () => {
    await agent.stop();
    process.exit(0);
  }, 60000);
}

main().catch(console.error);
