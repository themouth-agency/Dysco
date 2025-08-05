export interface Coupon {
  id: string;
  name: string;
  description: string;
  merchant: string;
  value: string;
  category: string;
  validUntil: string;
  imageUrl?: string;
  termsAndConditions?: string;
  isAvailable: boolean;
  tokenId: string;
  serialNumber: number;
  // Campaign information
  campaignType?: 'qr_redeem' | 'discount_code';
  discountType?: 'percentage' | 'fixed_amount' | 'free_item' | 'other';
  discountCode?: string;
  redemptionType?: string;
  // Legacy fields for compatibility
  discountPercent?: number;
  merchantId?: string;
  expiresAt?: string;
  status?: 'active' | 'claimed' | 'redeemed' | 'expired';
}

export interface UserWallet {
  address: string;
  privateKey: string;
  balance: number;
}

export interface Transaction {
  id: string;
  couponId: string;
  type: 'claim' | 'redeem';
  timestamp: string;
  transactionId: string;
} 