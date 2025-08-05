-- ==========================================
-- DATABASE SCHEMA FIX 
-- Run this in your Supabase SQL Editor
-- ==========================================

-- Step 1: Drop the existing foreign key constraint
ALTER TABLE coupon_redemptions 
DROP CONSTRAINT IF EXISTS coupon_redemptions_merchant_account_id_fkey;

-- Step 2: Change the merchant_account_id column to accommodate UUIDs
ALTER TABLE coupon_redemptions 
ALTER COLUMN merchant_account_id TYPE VARCHAR(50);

-- Step 3: Add the correct foreign key constraint referencing merchants(id)
ALTER TABLE coupon_redemptions 
ADD CONSTRAINT coupon_redemptions_merchant_account_id_fkey 
FOREIGN KEY (merchant_account_id) REFERENCES merchants(id);

-- Step 4: Add missing foreign key constraint between redemption records and NFT coupons
ALTER TABLE coupon_redemptions 
ADD CONSTRAINT coupon_redemptions_nft_id_fkey 
FOREIGN KEY (nft_id) REFERENCES nft_coupons(nft_id);

-- Step 5: Add campaign discoverability setting
ALTER TABLE campaigns 
ADD COLUMN IF NOT EXISTS is_discoverable BOOLEAN DEFAULT true;

-- Step 6: Add performance indexes for redemption history queries
CREATE INDEX IF NOT EXISTS idx_redemptions_user_date ON coupon_redemptions(user_account_id, redeemed_at DESC);
CREATE INDEX IF NOT EXISTS idx_redemptions_merchant_date ON coupon_redemptions(merchant_account_id, redeemed_at DESC);
CREATE INDEX IF NOT EXISTS idx_redemptions_nft ON coupon_redemptions(nft_id);
CREATE INDEX IF NOT EXISTS idx_campaigns_discoverable ON campaigns(is_discoverable);

-- Verify the changes
-- SELECT column_name, data_type, character_maximum_length 
-- FROM information_schema.columns 
-- WHERE table_name = 'coupon_redemptions' AND column_name = 'merchant_account_id';