import { NovesAIAgent } from './agent';
import { config } from 'dotenv';
import { LocalAgentConfiguration, ModelProvider } from './types';

// Load environment variables
config();

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
    input_format: {
      type: 'object',
      properties: {
        type: {
          type: 'string',
          enum: ['token_price', 'wallet_balance'],
          description: 'Type of data request'
        },
        params: {
          type: 'object',
          properties: {
            token: { type: 'string' },
            wallet: { type: 'string' },
            blockchain: { type: 'string' }
          }
        }
      },
      required: ['type', 'params']
    },
    output_format: {
      type: 'object',
      properties: {
        status: {
          type: 'string',
          enum: ['success', 'error']
        },
        data: {
          oneOf: [
            { $ref: '#/definitions/TokenPrice' },
            { $ref: '#/definitions/WalletBalance' }
          ]
        },
        error: { type: 'string' }
      },
      required: ['status']
    }
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
