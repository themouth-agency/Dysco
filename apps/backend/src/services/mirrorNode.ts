const MIRROR_NODE_BASE_URL = 'https://testnet.mirrornode.hedera.com/api/v1';

export interface MirrorNodeAccount {
  account: string;
  balance: {
    balance: number;
    tokens: any[];
  };
  expiry_timestamp: string;
  auto_renew_period: number;
  key: {
    _type: string;
    key: string;
  };
}

export interface MirrorNodeToken {
  token_id: string;
  name: string;
  symbol: string;
  total_supply: string;
  treasury_account_id: string;
  admin_key: any;
  freeze_key: any;
  wipe_key: any;
  supply_key: any;
  kyc_key: any;
  pause_key: any;
  custom_fees: any[];
  pause_status: string;
  deleted: boolean;
  type: string;
  supply_type: string;
  max_supply: string;
  fee_schedule_key: any;
  freeze_default: boolean;
  initial_supply: string;
  decimals: number;
  auto_renew_account: string;
  auto_renew_period: number;
  expiry_timestamp: string;
  memo: string;
  created_timestamp: string;
  modified_timestamp: string;
  metadata: string;
  metadata_key: any;
}

export class MirrorNodeService {
  /**
   * Get account information from Mirror Node
   */
  static async getAccount(accountId: string): Promise<MirrorNodeAccount> {
    const response = await fetch(`${MIRROR_NODE_BASE_URL}/accounts/${accountId}`);
    
    if (!response.ok) {
      throw new Error(`Mirror Node responded with status: ${response.status}`);
    }
    
    return (await response.json()) as MirrorNodeAccount;
  }

  /**
   * Get account balance from Mirror Node
   */
  static async getAccountBalance(accountId: string): Promise<{
    balance: number;
    balanceInHbar: number;
    tokens: any[];
  }> {
    const account = await this.getAccount(accountId);
    const balance = account.balance?.balance || 0;
    const balanceInHbar = balance / 100000000; // Convert tinybars to HBAR
    
    return {
      balance,
      balanceInHbar,
      tokens: account.balance?.tokens || []
    };
  }

  /**
   * Get token information from Mirror Node
   */
  static async getToken(tokenId: string): Promise<MirrorNodeToken> {
    const response = await fetch(`${MIRROR_NODE_BASE_URL}/tokens/${tokenId}`);
    
    if (!response.ok) {
      throw new Error(`Mirror Node responded with status: ${response.status}`);
    }
    
    return (await response.json()) as MirrorNodeToken;
  }

  /**
   * Get NFTs owned by an account
   */
  static async getAccountNFTs(accountId: string): Promise<any[]> {
    const response = await fetch(`${MIRROR_NODE_BASE_URL}/accounts/${accountId}/nfts`);
    
    if (!response.ok) {
      throw new Error(`Mirror Node responded with status: ${response.status}`);
    }
    
    const data = await response.json() as any;
    return data.nfts || [];
  }

  /**
   * Get transaction information from Mirror Node
   */
  static async getTransaction(transactionId: string): Promise<any> {
    const response = await fetch(`${MIRROR_NODE_BASE_URL}/transactions/${transactionId}`);
    
    if (!response.ok) {
      throw new Error(`Mirror Node responded with status: ${response.status}`);
    }
    
    return response.json();
  }
} 