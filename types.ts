// Re-export needed types from main project
export {
  ServiceType,
  RequestType,
  ModelProvider,
  ModelConfig,
  Schema,
  LocalAgentConfiguration,
  ServiceOffer,
  ServiceOfferResponse,
  AsyncResponse,
  FxnRequestBody,
  FxnResponseBody
} from '@superswarm/types';

// Only keep Jupiter-specific interfaces that aren't part of the main project
export interface JupiterToken {
  address: string;
  name: string;
  symbol: string;
  decimals: number;
  logoURI: string | null;
  tags: string[];
  daily_volume: number | null;
  created_at: string;
  freeze_authority: string | null;
  mint_authority: string | null;
  permanent_delegate: string | null;
  minted_at: string | null;
  extensions: Record<string, any>;
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

// Add these new interfaces to types.ts

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
