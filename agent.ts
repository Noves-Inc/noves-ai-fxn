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

  private async makeAndSendOffers() {
    try {
      // Get all active subscribers
      console.log('[NovesAIAgent] Getting subscribers with agent ID:', this.config.id);
      const subscribers = await this.fxnClient.getSubscribers();
      console.log('[NovesAIAgent] Found subscribers:', subscribers);

      const serviceOffer = this.makeServiceOffer();
      console.log('[NovesAIAgent] Created service offer:', {
        serviceType: serviceOffer.serviceType,
        serviceName: serviceOffer.serviceName,
        capabilities: serviceOffer.capabilities
      });

      // Create broadcast payload following FxnRequestBody schema
      const broadcastPayload: FxnRequestBody = {
        type: RequestType.OFFER,
        publicKey: this.config.id,
        signature: '', // FxnClient will add this
        payload: serviceOffer
      };

      console.log('[NovesAIAgent] Broadcasting payload:', JSON.stringify(broadcastPayload, null, 2));

      // Broadcast offer to all subscribers
      const response = await this.fxnClient.broadcastToSubscribers(
        broadcastPayload,
        subscribers
      );

      console.log('[NovesAIAgent] Broadcast response:', response);

      // Handle responses
      for (const result of response) {
        if (result.status === 'fulfilled' && result.value) {
          try {
            // Log the raw response before parsing
            const rawText = await result.value.text();
            console.log('[NovesAIAgent] Raw response text:', rawText);

            // Try to parse if it looks like JSON
            if (rawText.trim().startsWith('{')) {
              const responseData = JSON.parse(rawText);
              console.log('[NovesAIAgent] Parsed response data:', responseData);
              await this.handleOfferResponse(responseData);
            } else {
              console.error('[NovesAIAgent] Received non-JSON response:', rawText);
            }
          } catch (error) {
            console.error('[NovesAIAgent] Error handling subscriber response:', {
              error: error instanceof Error ? error.message : 'Unknown error',
              stack: error instanceof Error ? error.stack : undefined,
              result: result.value
            });
          }
        } else if (result.status === 'rejected') {
          console.error('[NovesAIAgent] Broadcast promise rejected:', result.reason);
        }
      }
    } catch (error) {
      console.error('[NovesAIAgent] Error making service offers:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      });
    }
  }

  private async handleOfferResponse(response: ServiceOfferResponse) {
    try {
      if (response.requirement) {
        // Process the requirement.payload directly since it contains the request data
        const asyncResponse: AsyncResponse = await this.processRequest(response.requirement);

        // Create response payload following FxnRequestBody schema
        const responsePayload: FxnRequestBody = {
          type: RequestType.RESPONSE,
          publicKey: this.config.id,
          signature: '', // Will be handled by fxnClient
          payload: asyncResponse
        };

        console.log('[NovesAIAgent] Preparing response payload:', responsePayload);

        if (response.requirement.responseEndpoint === '/') {
          console.log('[NovesAIAgent] Skipping POST - invalid endpoint "/"');
          return;
        }

        // Use fxnClient to send the response
        await this.fxnClient.sendResponse(
          responsePayload,
          response.requirement.responseEndpoint
        );
      }
    } catch (error) {
      console.error('[NovesAIAgent] Error in handleOfferResponse:', error);
    }
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
