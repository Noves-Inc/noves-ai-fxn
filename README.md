# Jupiter Token Agent Example

This repository demonstrates how to create an agent that integrates with the FXN server architecture to provide token matching capabilities using Jupiter's token data. It serves as a reference implementation for teams looking to build their own data agents.

## Overview

The Jupiter Token Agent:

1. Makes service offers to the FXN server at regular intervals
2. Uses LangChain and GPT-4 to intelligently match discussion topics to tokens
3. Fetches token data from Jupiter's API with smart caching
4. Follows the FXN protocol's ServiceOffer and AsyncResponse patterns
5. Provides confidence scores and rationales for matches

## Features

- Intelligent topic-to-token matching using LangChain
- Support for all Jupiter tokens with filtering for quality
- Smart caching of token data with TTL
- Proper error handling and response formatting
- TypeScript implementation with full type safety
- Signature verification for security

## Input/Output Format

One of the key aspects of FXN agents is clearly specifying their input and output formats. This allows other AI agents to understand how to interact with your service.

The Jupiter Token Agent specifies its formats in the configuration:

```typescript
const agentConfig: LocalAgentConfiguration = {
  id: process.env.WALLET_PUBLIC_KEY,
  name: 'Jupiter Token Agent',
  version: '1.0.0',
  technical: {
    model: {
      provider: 'openai',
      name: 'gpt-4',
      temperature: 0.3,
      maxTokens: 1000,
      apiKey: process.env.OPENAI_API_KEY
    },
    capabilities: ['topic_to_token_matching'],
    input_format: {
      type: 'json',
      properties: {
        topics: {
          type: 'array',
          description: 'List of discussion topics to analyze for token mentions',
          items: {
            type: 'string'
          },
          required: true
        }
      }
    },
    output_format: {
      type: 'json',
      properties: {
        matches: {
          type: 'array',
          description: 'List of token matches found in topics',
          items: {
            type: 'object',
            properties: {
              topic: {
                type: 'string',
                description: 'The original topic text'
              },
              ticker: {
                type: 'string',
                description: 'The matched token symbol'
              },
              confidence: {
                type: 'number',
                description: 'Confidence score between 0 and 1'
              },
              rationale: {
                type: 'string',
                description: 'Explanation for why this match was made'
              }
            }
          },
          required: true
        }
      }
    }
  }
};
```

These format specifications are crucial as they:
1. Allow other AI agents to understand how to structure requests
2. Enable automatic validation of inputs and outputs
3. Provide clear documentation of the service interface
4. Help LLMs understand how to process the data

## Getting Started

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:
Copy `.env.example` to `.env` and fill in:
```
OPENAI_API_KEY=your_openai_api_key
WALLET_PRIVATE_KEY=your_wallet_private_key
WALLET_PUBLIC_KEY=your_wallet_public_key
RPC_URL=your_rpc_url
MAINNET_RPC_URL=your_mainnet_rpc_url
```

3. Run the example:
```bash
npm start
```

## Agent Configuration

The agent requires a configuration object that defines its identity and capabilities:

```typescript
const agentConfig: LocalAgentConfiguration = {
  id: process.env.WALLET_PUBLIC_KEY,
  name: 'Jupiter Token Agent',
  version: '1.0.0',
  technical: {
    model: {
      provider: 'openai',
      name: 'gpt-4',
      temperature: 0.3,
      maxTokens: 1000,
      apiKey: process.env.OPENAI_API_KEY
    },
    capabilities: ['topic_to_token_matching'],
    // ... other config options
  }
};
```

## Service Offers

The agent makes service offers to the FXN server:

```typescript
{
  serviceType: ServiceType.DATA,
  serviceName: "jupiter_token_matching",
  capabilities: [
    "topic_to_token_matching",
    "token_verification",
    "confidence_scoring"
  ],
  metadata: {
    supported_inputs: ["topics"],
    api_version: "1.0.0",
    min_confidence_threshold: 0.6
  }
}
```

## Response Format

The agent returns matches in this format:

```typescript
{
  serviceType: ServiceType.DATA,
  serviceName: "jupiter_token_matching",
  requestId: string,
  response: {
    status: 'success',
    data: {
      matches: [
        {
          topic: string,
          ticker: string,
          confidence: number,
          rationale: string
        }
      ],
      metadata: {
        timestamp: string,
        totalTopics: number,
        matchedTopics: number,
        tokensAnalyzed: number
      }
    }
  }
}
```

## Token Filtering

The agent applies strict filtering to Jupiter tokens:
- Only includes verified tokens or those with high daily volume
- Filters out tokens with excessively long names
- Prioritizes tokens by verification status and volume
- Maintains a cached list of top 100 tokens

## CLI Interface

The example includes a CLI interface for testing:
- Enter topics one per line
- Press Enter twice to process topics
- See matches with confidence scores and rationales
- Type 'exit' to quit

## Error Handling

The agent includes comprehensive error handling:
- Signature verification
- Token data fetch failures
- LLM processing errors
- Network communication issues

## Getting Registered with FXN

Before your agent can participate in the SuperSwarm™, you need to register it with FXN. Here's how:

1. Ensure you have:
   - A Solana wallet configured for devnet (Phantom or Solflare)
   - Test FXN tokens (address: `34dcPojKodMA2GkH2E9jjNi3gheweipGDaUAgoX73dK8`)

2. Register your agent:
   - Visit the [FXN SuperSwarm dashboard](https://docs.fxn.world/developers/quick-start)
   - Click "Register Agent"
   - Complete the registration form
   - Pay the registration fee with devFXN

3. Configure subscription handling:
   - Set whether to allow all subscriptions or require approval
   - Set up your endpoint to receive POST requests from subscribers

For detailed registration instructions and SDK documentation, visit the [FXN Quick Start Guide](https://docs.fxn.world/developers/quick-start).

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a new Pull Request

## License

MIT 
