// Richlist account entry
export interface StatsRichlistAccount {
  account_identifier: AccountIdentifier;
  balance: Amount;
}

// Response for /stats/richlist
export interface StatsRichlistResponse {
  block_identifier: BlockIdentifier;
  last_updated: string;
  accounts: StatsRichlistAccount[];
  total_accounts: number;
  circulating_supply?: Amount;
}
// Transaction search result (for /search/transactions)
export interface TransactionSearchResult {
  block_identifier: BlockIdentifier;
  transaction_identifier: TransactionIdentifier;
  operations: Operation[];
  metadata: Record<string, any>;
  timestamp: number;
}

// Response for /search/transactions
export interface TransactionSearchResponse {
  transactions: TransactionSearchResult[];
  total_count: number;
  next_offset?: number;
}
// Basic types used across the API
export interface NetworkIdentifier {
  blockchain: string;
  network: string;
}

export interface Currency {
  symbol: string;
  decimals: number;
}

export const MCM_CURRENCY: Currency = {
  symbol: "MCM",
  decimals: 9
};

export const NETWORK_IDENTIFIER: NetworkIdentifier = {
  blockchain: "mochimo",
  network: "mainnet"
};

export interface Amount {
  value: string;
  currency: Currency;
}

export interface AccountIdentifier {
  address: string;
}

export interface PublicKey {
  hex_bytes: string;
  curve_type: string;
}

export interface Operation {
  operation_identifier: { index: number };
  type: string;
  status: string;
  account: AccountIdentifier;
  amount: Amount;
  metadata?: Record<string, any>;
}
export type ResolveTagResponse = {
  result: {
    address: string;
    amount: string;
  },
  idempotent: boolean;
}

// Add these interfaces for mempool operations
export interface TransactionIdentifier {
  hash: string;
}

export interface MempoolResponse {
  transaction_identifiers: TransactionIdentifier[];
}

export interface MempoolTransactionResponse {
  transaction: {
    transaction_identifier: TransactionIdentifier;
    operations: Operation[];
    metadata?: Record<string, any>;
  };
  metadata?: Record<string, any>;
}
export interface BalanceResponse {
  balances: {
    currency: {
      decimals: number;
      symbol: string;
    };
    value: string;
  }[];
  block_identifier: {
    hash: string;
    index: number;
  };
}

export interface RequiredPublicKey {
  address: string;
}

export interface PreprocessOptions {
  block_to_live: number;
  change_pk: string;
  source_addr: string;
}

export interface PreprocessResponse {
  options: PreprocessOptions;
  required_public_keys: RequiredPublicKey[];
}

export interface MetadataResponse {
  metadata: {
    block_to_live: number;
    change_pk: string;
    source_balance: number;
  };
  suggested_fee: {
    value: string;
    currency: Currency;
  }[];
}

export interface SigningPayload {
  account_identifier: AccountIdentifier;
  hex_bytes: string;
  signature_type: string;
}

export interface PayloadsResponse {
  unsigned_transaction: string;
  payloads: SigningPayload[];
}
export interface TransactionSubmitResponse {
  transaction_identifier: { hash: string };
}

export interface BlockIdentifier {
  index?: number;
  hash?: string;
}
export interface Operation {
  operation_identifier: {
    index: number;
  };
  type: string;
  status: string;
  account: AccountIdentifier;
  amount: {
    value: string;  // Changed from number to string
    currency: {
      symbol: string;
      decimals: number;
    };
  };
}

export interface Transaction {
  transaction_identifier: TransactionIdentifier;
  operations: Operation[];
}

export interface Block {
  block_identifier: BlockIdentifier;
  parent_block_identifier: BlockIdentifier;
  timestamp: number;
  transactions: Transaction[];
}
export interface NetworkStatus {
  current_block_identifier: BlockIdentifier;
  genesis_block_identifier: BlockIdentifier;
  current_block_timestamp: number;
}