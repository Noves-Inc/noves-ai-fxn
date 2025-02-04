// Define basic enums
export enum ServiceType {
  DATA = 'DATA',
  REMOTE_ACTION = 'REMOTE_ACTION',
  LOCAL_ACTION = 'LOCAL_ACTION'
}

export enum RequestType {
  OFFER = 'OFFER',
  RESPONSE = 'RESPONSE'
}

export type ModelProvider = 'openai' | 'anthropic' | 'ollama' | 'custom';

// Define basic interfaces
export interface ModelConfig {
  provider: ModelProvider;
  name: string;
  temperature?: number;
  maxTokens?: number;
  baseUrl?: string;
  apiKey?: string;
}

export interface Schema {
  type: string;
  properties: Record<string, SchemaProperty>;
  required?: string[];
}

export interface SchemaProperty {
  type: string;
  description: string;
  required?: boolean;
  items?: SchemaProperty | Schema;
  properties?: Record<string, SchemaProperty>;
  enum?: string[] | number[];
}

export interface LocalAgentConfiguration {
  id: string;
  name: string;
  version: string;
  created: string;
  updated: string;
  background: {
    bio: string[];
    lore: string[];
    goals: string[];
  };
  technical: {
    model: ModelConfig;
    capabilities: string[];
    input_format: Schema;
    output_format: Schema;
    system_prompt: string;
  };
}

export interface ServiceOffer {
  serviceType: ServiceType;
  serviceName: string;
  capabilities: string[];
  metadata?: Record<string, any>;
  publicKey: string;
  requestId?: string;
}

export interface ServiceOfferResponse {
  status: 'success';
  requestId: string;
  requirement?: {
    actionId: string;
    teamId: string;
    type: string;
    payload: any;
    responseEndpoint: string;
  };
  message?: string;
}

export interface AsyncResponse {
  serviceType: ServiceType;
  serviceName: string;
  requestId: string;
  response: {
    status: 'success' | 'error';
    data?: Record<string, any>;
    error?: string;
  };
}

export interface FxnRequestBody {
  type: RequestType;
  publicKey: string;
  signature: string;
  payload: ServiceOffer | AsyncResponse;
}

export interface FxnResponseBody {
  status: 'success' | 'error';
  requestId?: string;
  requirement?: {
    actionId: string;
    teamId: string;
    type: string;
    payload: any;
    responseEndpoint: string;
  };
  message?: string;
  error?: string;
}

// Noves specific interfaces
export interface TokenPrice {
  price: number;
  timestamp: string;
  blockchain: string;
  token: string;
}

export interface TokenBalance {
  token: string;
  amount: number;
  value_usd?: number;
}

export interface WalletBalance {
  balances: TokenBalance[];
  wallet: string;
  blockchain: string;
  timestamp: string;
}

export interface FxnClientConfig {
  rpcUrl: string;
  walletPrivateKey: string;
  mainnetRpcUrl: string;
}

export interface FxnSubscriber {
  subscription?: {
    recipient: string;
  };
  status: string;
}
