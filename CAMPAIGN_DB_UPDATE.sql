-- ==========================================
-- CAMPAIGN SYSTEM DATABASE UPDATE
-- Run this in your Supabase SQL Editor
-- ==========================================

-- Add campaigns table
CREATE TABLE campaigns (
  id VARCHAR(50) PRIMARY KEY,
  merchant_id VARCHAR(50) REFERENCES merchants(id),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  campaign_type VARCHAR(20) NOT NULL, -- 'qr_redeem', 'discount_code'
  discount_type VARCHAR(20) NOT NULL, -- 'percentage', 'fixed_amount', 'free_item'
  discount_value DECIMAL(10,2) NOT NULL,
  start_date TIMESTAMP NOT NULL,
  end_date TIMESTAMP NOT NULL,
  image_url TEXT,
  max_redemptions_per_user INTEGER DEFAULT 1,
  total_limit INTEGER,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Add new columns to existing nft_coupons table
ALTER TABLE nft_coupons 
  ADD COLUMN campaign_id VARCHAR(50) REFERENCES campaigns(id),
  ADD COLUMN owner_account_id VARCHAR(20),
  ADD COLUMN redemption_status VARCHAR(20) DEFAULT 'active',
  ADD COLUMN discount_code VARCHAR(50),
  ADD COLUMN redeemed_at TIMESTAMP;

-- Add performance indexes
CREATE INDEX idx_campaigns_merchant ON campaigns(merchant_id);
CREATE INDEX idx_campaigns_active ON campaigns(is_active);
CREATE INDEX idx_campaigns_dates ON campaigns(start_date, end_date);
CREATE INDEX idx_nft_campaign ON nft_coupons(campaign_id);
CREATE INDEX idx_nft_owner ON nft_coupons(owner_account_id);
CREATE INDEX idx_nft_status ON nft_coupons(redemption_status);

-- Update existing nft_coupons to have default status
UPDATE nft_coupons SET redemption_status = 'active' WHERE redemption_status IS NULL;