import { ChatOpenAI } from "@langchain/openai";
import { ChatPromptTemplate, SystemMessagePromptTemplate } from "@langchain/core/prompts";
import { JsonOutputParser } from "@langchain/core/output_parsers";
import { RunnableSequence } from "@langchain/core/runnables";
import { z } from "zod";
import axios from 'axios';
import {
  LocalAgentConfiguration,
  ServiceOffer,
  AsyncResponse,
  ServiceType,
  ServiceOfferResponse,
  RequestType,
  FxnRequestBody,
  TokenPrice,
  WalletBalance
} from './types';
import { FxnClient } from './fxnClient';

// Define the response schemas
const tokenPriceSchema = z.object({
  price: z.number(),
  timestamp: z.string(),
  blockchain: z.string(),
  token: z.string()
});

const walletBalanceSchema = z.object({
  balances: z.array(z.object({
    token: z.string(),
    amount: z.number(),
    value_usd: z.number().optional()
  })),
  wallet: z.string(),
  blockchain: z.string(),
  timestamp: z.string()
});

export class NovesAIAgent {
  private chain!: RunnableSequence;
  private model!: ChatOpenAI;
  private config: LocalAgentConfiguration;
  private offerInterval: NodeJS.Timeout | null = null;
  private readonly offerIntervalMs: number;
  private fxnClient: FxnClient;
  private readonly NOVES_PRICE_API: string;
  private readonly NOVES_BALANCE_API: string;
  private readonly API_KEY: string;

  constructor(config: LocalAgentConfiguration) {
    this.config = config;
    this.offerIntervalMs = parseInt(process.env.OFFER_INTERVAL_MS || '30000', 10);
    this.NOVES_PRICE_API = process.env.NOVES_PRICE_API!;
    this.NOVES_BALANCE_API = process.env.NOVES_BALANCE_API!;
    this.API_KEY = process.env.NOVES_API_KEY!;

    const fxnConfig = {
      rpcUrl: process.env.RPC_URL!,
      walletPrivateKey: process.env.WALLET_PRIVATE_KEY!,
      mainnetRpcUrl: process.env.MAINNET_RPC_URL!
    };
    this.fxnClient = new FxnClient(fxnConfig);
  }

  public async start() {
    console.log(`Starting NovesAI Agent (offer interval: ${this.offerIntervalMs}ms)...`);
    await this.makeAndSendOffers();

    this.offerInterval = setInterval(async () => {
      await this.makeAndSendOffers();
    }, this.offerIntervalMs);
  }

  public async stop() {
    console.log('Stopping NovesAI Agent...');
    if (this.offerInterval) {
      clearInterval(this.offerInterval);
      this.offerInterval = null;
    }
  }

  private async getTokenPrice(token: string, blockchain: string): Promise<TokenPrice> {
    try {
      const response = await axios.get(`${this.NOVES_PRICE_API}`, {
        params: { token, blockchain },
        headers: { 'X-API-KEY': this.API_KEY }
      });
      
      return {
        price: response.data.price,
        timestamp: new Date().toISOString(),
        blockchain,
        token
      };
    } catch (error) {
      console.error('Error fetching token price:', error);
      throw error;
    }
  }

  private async getWalletBalance(wallet: string, blockchain: string): Promise<WalletBalance> {
    try {
      const response = await axios.get(`${this.NOVES_BALANCE_API}`, {
        params: { wallet, blockchain },
        headers: { 'X-API-KEY': this.API_KEY }
      });

      return {
        balances: response.data.balances,
        wallet,
        blockchain,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error fetching wallet balance:', error);
      throw error;
    }
  }

  private async processRequest(request: any): Promise<AsyncResponse> {
    try {
      const { type, params } = request.payload;

      switch (type) {
        case 'token_price':
          const priceData = await this.getTokenPrice(params.token, params.blockchain);
          return {
            serviceType: ServiceType.DATA,
            serviceName: "noves_price_data",
            requestId: request.actionId || request.requestId,
            response: {
              status: 'success',
              data: priceData
            }
          };

        case 'wallet_balance':
          const balanceData = await this.getWalletBalance(params.wallet, params.blockchain);
          return {
            serviceType: ServiceType.DATA,
            serviceName: "noves_balance_data",
            requestId: request.actionId || request.requestId,
            response: {
              status: 'success',
              data: balanceData
            }
          };

        default:
          throw new Error(`Unsupported request type: ${type}`);
      }
    } catch (error) {
      console.error('Error in processRequest:', error);
      return {
        serviceType: ServiceType.DATA,
        serviceName: "noves_ai",
        requestId: request.actionId || request.requestId,
        response: {
          status: 'error',
          error: error instanceof Error ? error.message : 'Unknown error occurred'
        }
      };
    }
  }

  private makeServiceOffer(): ServiceOffer {
    return {
      serviceType: ServiceType.DATA,
      serviceName: "noves_ai",
      capabilities: [
        "token_price_lookup",
        "wallet_balance_lookup"
      ],
      metadata: {
        supported_blockchains: ["ethereum", "solana", "polygon"],
        api_version: "1.0.0",
        supported_request_types: ["token_price", "wallet_balance"],
        input_format: this.config.technical.input_format,
        output_format: this.config.technical.output_format
      },
      publicKey: this.config.id
    };
  }

  // Helper methods
  public getId(): string {
    return this.config.id;
  }

  public getName(): string {
    return this.config.name;
  }

  public getCapabilities(): string[] {
    return this.config.technical.capabilities;
  }
}
