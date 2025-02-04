import { EventEmitter } from "events";
import { SolanaAdapter } from 'fxn-protocol-sdk';
import { AnchorProvider, Wallet } from '@coral-xyz/anchor';
import { Connection, Keypair, PublicKey } from '@solana/web3.js';
import bs58 from 'bs58';
import { FxnClientConfig, FxnSubscriber, FxnRequestBody, RequestType } from './types';
import { signMessage } from "./utils/signingUtils";
import axios from 'axios';

export class FxnClient extends EventEmitter {
  private solanaAdapter: SolanaAdapter;
  private config: FxnClientConfig;

  constructor(config: FxnClientConfig) {
    super();
    this.config = config;
    const provider = this.createAnchorProvider();
    this.solanaAdapter = new SolanaAdapter(provider);
  }

  /**
   * Broadcast content to all active subscribers
   */
  public async broadcastToSubscribers(content: FxnRequestBody, subscribers: FxnSubscriber[]) {
    console.log('FxnClient: Broadcasting content:', JSON.stringify(content, null, 2));

    // Create keypair from private key
    const privateKeyUint8Array = bs58.decode(this.config.walletPrivateKey);
    const keypair = Keypair.fromSecretKey(privateKeyUint8Array);

    // Sign the content
    const { signature } = await signMessage(keypair, content.payload);

    // Update the signature in the request body
    const signedContent: FxnRequestBody = {
      ...content,
      signature
    };

    console.log('FxnClient: Signed content:', JSON.stringify(signedContent, null, 2));

    const promises = subscribers.map(async (subscriber) => {
      try {
        const recipient = subscriber.subscription?.recipient;

        if (recipient && subscriber.status === 'active') {
          console.log('FxnClient: Sending to recipient:', recipient);
          return fetch(recipient, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(signedContent)
          });
        }
      } catch (error) {
        console.error('FxnClient: Error in broadcast:', error);
        if (error instanceof Error) {
          console.error('FxnClient: Error stack:', error.stack);
        }
        throw error;
      }
    });

    return Promise.allSettled(promises);
  }

  /**
   * Get all subscribers for the agent's public key
   */
  public async getSubscribers(): Promise<FxnSubscriber[]> {
    try {
      const privateKeyUint8Array = bs58.decode(this.config.walletPrivateKey);
      const keypair = Keypair.fromSecretKey(privateKeyUint8Array);
      const agentId = keypair.publicKey;

      return this.solanaAdapter.getSubscriptionsForProvider(agentId);
    } catch (error) {
      console.error('FxnClient: Error getting subscribers:', error);
      if (error instanceof Error) {
        console.error('FxnClient: Error stack:', error.stack);
      }
      throw error;
    }
  }

  private createAnchorProvider(): AnchorProvider {
    const privateKeyUint8Array = bs58.decode(this.config.walletPrivateKey);
    const keypair = Keypair.fromSecretKey(privateKeyUint8Array);
    const connection = new Connection(this.config.rpcUrl, 'confirmed');
    const wallet = new Wallet(keypair);

    return new AnchorProvider(
      connection,
      wallet,
      { commitment: 'confirmed' }
    );
  }

  public async sendResponse(payload: FxnRequestBody, endpoint: string) {
    try {
        // Create keypair from private key
        const privateKeyUint8Array = bs58.decode(this.config.walletPrivateKey);
        const keypair = Keypair.fromSecretKey(privateKeyUint8Array);

        // Sign the payload using our signing utils
        const { signature } = await signMessage(keypair, payload.payload);

        // Create the final request body
        const requestBody: FxnRequestBody = {
            type: RequestType.RESPONSE,
            publicKey: keypair.publicKey.toBase58(),
            signature,
            payload: payload.payload
        };

        console.log('[FxnClient] Sending signed response:', requestBody);

        const response = await axios.post(endpoint, requestBody);
        return response.data;
    } catch (error) {
        console.error('[FxnClient] Error sending response:', error);
        throw error;
    }
  }
}
