import { NetworkIdentifier, MCM_CURRENCY, NETWORK_IDENTIFIER, Operation, PublicKey, ResolveTagResponse, TransactionIdentifier, MempoolResponse, MempoolTransactionResponse, BalanceResponse, PreprocessResponse, MetadataResponse, PreprocessOptions, PayloadsResponse, TransactionSubmitResponse, BlockIdentifier, Block, NetworkStatus } from './types';
import { logger } from './utils/logger';

interface RosettaError {
  code: number;
  message: string;
  retriable: boolean;
}



export class MochimoApiClient {
  public baseUrl: string;
  private networkIdentifier: NetworkIdentifier;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
    this.networkIdentifier = NETWORK_IDENTIFIER;
    logger.debug('Construction initialized', { baseUrl, networkIdentifier: this.networkIdentifier });
  }

  private headersToObject(headers: Headers): Record<string, string> {
    const result: Record<string, string> = {};
    headers.forEach((value, key) => {
      result[key] = value;
    });
    return result;
  }

  private async handleResponse(response: Response) {
    const data = await response.json();
    logger.debug('API Response', { 
      status: response.status, 
      url: response.url,
      data,
      headers: this.headersToObject(response.headers)
    });
    
    if ('code' in data) {
      logger.error('API Error', {
        endpoint: response.url,
        status: response.status,
        error: data
      });
      throw new Error(`Rosetta API Error: ${data.message}`);
    }
    return data;
  }

  private async makeRequest(endpoint: string, body: any) {
    const url = `${this.baseUrl}${endpoint}`;
    logger.debug(`Making request to ${endpoint}`, {
      url,
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body
    });
    
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      
      return this.handleResponse(response);
    } catch (error) {
      logger.error(`Request failed to ${endpoint}`, {
        url,
        error: error instanceof Error ? error.message : error
      });
      throw error;
    }
  }

  async derive(publicKey: string, tag: string) {
    logger.debug('Deriving address', { publicKey, tag });
    return this.makeRequest('/construction/derive', {
      network_identifier: this.networkIdentifier,
      public_key: {
        hex_bytes: publicKey,
        curve_type: 'wotsp'
      },
      metadata: { tag }
    });
  }

  async preprocess(operations: Operation[], metadata: any): Promise<PreprocessResponse> {
    logger.debug('Preprocessing transaction', { operations, metadata });
    return this.makeRequest('/construction/preprocess', {
      network_identifier: this.networkIdentifier,
      operations,
      metadata
    });
  }

  async metadata(options: PreprocessOptions, publicKeys: PublicKey[]): Promise<MetadataResponse> {
    logger.debug('Fetching metadata', { options, publicKeys });
    return this.makeRequest('/construction/metadata', {
      network_identifier: this.networkIdentifier,
      options,
      public_keys: publicKeys
    });
  }

  async payloads(
    operations: Operation[], 
    metadata: any, 
    publicKeys: PublicKey[]
  ): Promise<PayloadsResponse> {
    logger.debug('Fetching payloads', { operations, metadata, publicKeys });
    return this.makeRequest('/construction/payloads', {
      network_identifier: this.networkIdentifier,
      operations,
      metadata,
      public_keys: publicKeys
    });
  }

  async combine(unsignedTransaction: string, signatures: any[]) {
    logger.debug('Combining transaction', { unsignedTransaction, signatures });
    return this.makeRequest('/construction/combine', {
      network_identifier: this.networkIdentifier,
      unsigned_transaction: unsignedTransaction,
      signatures
    });
  }

  async submit(signedTransaction: string): Promise<TransactionSubmitResponse> {
    logger.debug('Submitting transaction', { signedTransaction });
    return this.makeRequest('/construction/submit', {
      network_identifier: this.networkIdentifier,
      signed_transaction: signedTransaction
    });
  }
  async parse(transaction: string, signed: boolean) {
    logger.debug('Parsing transaction', { transaction, signed });
    return this.makeRequest('/construction/parse', {
      network_identifier: this.networkIdentifier,
      transaction,
      signed
    });
  }
  async resolveTag(tag: string): Promise<ResolveTagResponse> {
    return this.makeRequest('/call', {
      network_identifier: this.networkIdentifier,
      parameters: {
        tag: tag
      },
      method: "tag_resolve"
    });
  }
  
  async getAccountBalance(address: string): Promise<BalanceResponse> {
    return this.makeRequest('/account/balance', {
      network_identifier: this.networkIdentifier,
      account_identifier: { address }
    });
  }

  async getBlock(identifier: BlockIdentifier): Promise<{ block: Block }> {
    return this.makeRequest('/block', {
      network_identifier: this.networkIdentifier,
      block_identifier: identifier
    });
  }
  /**
   * Get network options (operation types, statuses, errors, etc)
   */
  async getNetworkOptions(): Promise<any> {
    return this.makeRequest('/network/options', {
      network_identifier: this.networkIdentifier
    });
  }

  /**
   * Get a transaction inside a block by block identifier and transaction hash
   * @param blockIdentifier {BlockIdentifier}
   * @param transactionHash {string}
   */
  async getBlockTransaction(blockIdentifier: BlockIdentifier, transactionHash: string): Promise<any> {
    return this.makeRequest('/block/transaction', {
      network_identifier: this.networkIdentifier,
      block_identifier: blockIdentifier,
      transaction_identifier: { hash: transactionHash }
    });
  }

  /**
   * Search transactions by account address, with optional filters
   * @param address {string}
   * @param options {object} Optional: limit, offset, max_block, status
   */
  async searchTransactionsByAddress(address: string, options?: {
    limit?: number;
    offset?: number;
    max_block?: number;
    status?: string;
  }): Promise<any> {
    const body: any = {
      network_identifier: this.networkIdentifier,
      account_identifier: { address }
    };
    if (options) {
      if (options.limit !== undefined) body.limit = options.limit;
      if (options.offset !== undefined) body.offset = options.offset;
      if (options.max_block !== undefined) body.max_block = options.max_block;
      if (options.status !== undefined) body.status = options.status;
    }
    return this.makeRequest('/search/transactions', body);
  }

  /**
   * Search transactions by block index/hash, with optional filters
   * @param blockIdentifier {BlockIdentifier}
   * @param options {object} Optional: limit, offset, status
   */
  async searchTransactionsByBlock(blockIdentifier: BlockIdentifier, options?: {
    limit?: number;
    offset?: number;
    status?: string;
  }): Promise<any> {
    const body: any = {
      network_identifier: this.networkIdentifier,
      block_identifier: blockIdentifier
    };
    if (options) {
      if (options.limit !== undefined) body.limit = options.limit;
      if (options.offset !== undefined) body.offset = options.offset;
      if (options.status !== undefined) body.status = options.status;
    }
    return this.makeRequest('/search/transactions', body);
  }

  /**
   * Search transactions by transaction hash, with optional filters
   * @param transactionHash {string}
   * @param options {object} Optional: max_block, status
   */
  async searchTransactionsByTxId(transactionHash: string, options?: {
    max_block?: number;
    status?: string;
  }): Promise<any> {
    const body: any = {
      network_identifier: this.networkIdentifier,
      transaction_identifier: { hash: transactionHash }
    };
    if (options) {
      if (options.max_block !== undefined) body.max_block = options.max_block;
      if (options.status !== undefined) body.status = options.status;
    }
    return this.makeRequest('/search/transactions', body);
  }

  /**
   * Get block events (additions/removals) with optional limit/offset
   * @param options {object} Optional: limit, offset
   */
  async getEventsBlocks(options?: {
    limit?: number;
    offset?: number;
  }): Promise<any> {
    const body: any = {
      network_identifier: this.networkIdentifier
    };
    if (options) {
      if (options.limit !== undefined) body.limit = options.limit;
      if (options.offset !== undefined) body.offset = options.offset;
    }
    return this.makeRequest('/events/blocks', body);
  }

  /**
   * Get the richlist (accounts with highest balances)
   * @param options {object} Optional: ascending, offset, limit
   */
  async getStatsRichlist(options?: {
    ascending?: boolean;
    offset?: number;
    limit?: number;
  }): Promise<any> {
    const body: any = {
      network_identifier: this.networkIdentifier
    };
    if (options) {
      if (options.ascending !== undefined) body.ascending = options.ascending;
      if (options.offset !== undefined) body.offset = options.offset;
      if (options.limit !== undefined) body.limit = options.limit;
    }
    return this.makeRequest('/stats/richlist', body);
  }
  async getNetworkStatus(): Promise<NetworkStatus> {
    return this.makeRequest('/network/status', {
      network_identifier: this.networkIdentifier
    });
  }

  /**
   * Get all transaction identifiers in the mempool
   */
  async getMempoolTransactions(): Promise<MempoolResponse> {
    logger.debug('Fetching mempool transactions');
    return this.makeRequest('/mempool', {
      network_identifier: this.networkIdentifier
    });
  }

  /**
   * Get a specific transaction from the mempool
   * @param transactionHash - The hash of the transaction to fetch
   */
  async getMempoolTransaction(transactionHash: string): Promise<MempoolTransactionResponse> {
    logger.debug('Fetching mempool transaction', { transactionHash });
    return this.makeRequest('/mempool/transaction', {
      network_identifier: this.networkIdentifier,
      transaction_identifier: {
        hash: transactionHash
      }
    });
  }

  /**
   * Monitor the mempool for a specific transaction
   * @param transactionHash - The hash of the transaction to monitor
   * @param timeout - Maximum time to wait in milliseconds
   * @param interval - Check interval in milliseconds
   */
  async waitForTransaction(
    transactionHash: string, 
    timeout: number = 60000, 
    interval: number = 1000
  ): Promise<MempoolTransactionResponse> {
    logger.debug('Monitoring mempool for transaction', { 
      transactionHash,
      timeout,
      interval 
    });

    const startTime = Date.now();
    
    while (Date.now() - startTime < timeout) {
      try {
        const response = await this.getMempoolTransaction(transactionHash);
        return response;
      } catch (error) {
        if (Date.now() - startTime >= timeout) {
          throw new Error(`Transaction ${transactionHash} not found in mempool after ${timeout}ms`);
        }
        await new Promise(resolve => setTimeout(resolve, interval));
      }
    }

    throw new Error(`Timeout waiting for transaction ${transactionHash}`);
  }
} 
