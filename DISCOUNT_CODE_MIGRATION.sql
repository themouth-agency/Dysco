-- ==========================================
-- DISCOUNT CODE SYSTEM - DATABASE MIGRATION
-- Run this in your Supabase SQL Editor
-- ==========================================

-- 1. Add missing columns to coupon_redemptions table
ALTER TABLE coupon_redemptions 
  ADD COLUMN IF NOT EXISTS discount_code VARCHAR(100),
  ADD COLUMN IF NOT EXISTS campaign_id VARCHAR(50);

-- 2. Add foreign key relationship to campaigns
-- First, let's make sure the campaigns table exists with proper structure
CREATE TABLE IF NOT EXISTS campaigns (
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
  is_discoverable BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 3. Update nft_coupons table to ensure all required columns exist
ALTER TABLE nft_coupons 
  ADD COLUMN IF NOT EXISTS campaign_id VARCHAR(50),
  ADD COLUMN IF NOT EXISTS owner_account_id VARCHAR(20),
  ADD COLUMN IF NOT EXISTS redemption_status VARCHAR(20) DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS discount_code VARCHAR(50),
  ADD COLUMN IF NOT EXISTS redeemed_at TIMESTAMP;

-- 4. Add foreign key constraints (only if they don't exist)
DO $$ 
BEGIN
    -- Add campaign foreign key to nft_coupons if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'nft_coupons_campaign_id_fkey'
    ) THEN
        ALTER TABLE nft_coupons 
        ADD CONSTRAINT nft_coupons_campaign_id_fkey 
        FOREIGN KEY (campaign_id) REFERENCES campaigns(id);
    END IF;

    -- Add campaign foreign key to coupon_redemptions if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'coupon_redemptions_campaign_id_fkey'
    ) THEN
        ALTER TABLE coupon_redemptions 
        ADD CONSTRAINT coupon_redemptions_campaign_id_fkey 
        FOREIGN KEY (campaign_id) REFERENCES campaigns(id);
    END IF;
END $$;

-- 5. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_campaigns_merchant ON campaigns(merchant_id);
CREATE INDEX IF NOT EXISTS idx_campaigns_active ON campaigns(is_active);
CREATE INDEX IF NOT EXISTS idx_campaigns_discoverable ON campaigns(is_discoverable);
CREATE INDEX IF NOT EXISTS idx_campaigns_dates ON campaigns(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_nft_campaign ON nft_coupons(campaign_id);
CREATE INDEX IF NOT EXISTS idx_nft_owner ON nft_coupons(owner_account_id);
CREATE INDEX IF NOT EXISTS idx_nft_status ON nft_coupons(redemption_status);
CREATE INDEX IF NOT EXISTS idx_redemptions_campaign ON coupon_redemptions(campaign_id);
CREATE INDEX IF NOT EXISTS idx_redemptions_discount_code ON coupon_redemptions(discount_code);
CREATE INDEX IF NOT EXISTS idx_redemptions_method ON coupon_redemptions(redemption_method);

-- 6. Update existing data to ensure consistency
-- Set default redemption status for existing NFT coupons
UPDATE nft_coupons 
SET redemption_status = 'active' 
WHERE redemption_status IS NULL;

-- 7. Populate campaign_id in coupon_redemptions from nft_coupons
UPDATE coupon_redemptions 
SET campaign_id = nft_coupons.campaign_id
FROM nft_coupons 
WHERE coupon_redemptions.nft_id = nft_coupons.nft_id 
AND coupon_redemptions.campaign_id IS NULL;

-- 8. Create a view for easier discount code queries
CREATE OR REPLACE VIEW user_discount_codes AS
SELECT 
  cr.id,
  cr.nft_id,
  cr.user_account_id,
  cr.discount_code,
  cr.redeemed_at,
  cr.redemption_transaction_id,
  c.name as campaign_name,
  c.description as campaign_description,
  c.discount_type,
  c.discount_value,
  c.merchant_id
FROM coupon_redemptions cr
JOIN campaigns c ON cr.campaign_id = c.id
WHERE cr.redemption_method = 'discount_code'
AND cr.discount_code IS NOT NULL
ORDER BY cr.redeemed_at DESC;

-- ==========================================
-- VERIFICATION QUERIES
-- Run these to verify the migration worked:
-- ==========================================

-- Check if all tables exist
SELECT tablename FROM pg_tables WHERE schemaname = 'public' 
AND tablename IN ('merchants', 'campaigns', 'nft_coupons', 'coupon_redemptions');

-- Check if all required columns exist
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'coupon_redemptions' 
AND column_name IN ('discount_code', 'campaign_id');

-- Check foreign key relationships
SELECT conname as constraint_name, conrelid::regclass as table_name, confrelid::regclass as foreign_table
FROM pg_constraint 
WHERE contype = 'f' 
AND (conrelid::regclass::text = 'coupon_redemptions' OR conrelid::regclass::text = 'nft_coupons');

-- Test the view
SELECT COUNT(*) as discount_codes_count FROM user_discount_codes;

-- ==========================================
-- SUCCESS MESSAGE
-- ==========================================
DO $$
BEGIN
    RAISE NOTICE '✅ DISCOUNT CODE MIGRATION COMPLETED SUCCESSFULLY!';
    RAISE NOTICE '🎯 Features now available:';
    RAISE NOTICE '   - Secure discount code storage';
    RAISE NOTICE '   - Campaign-redemption relationships';
    RAISE NOTICE '   - User discount code history';
    RAISE NOTICE '   - Performance optimized indexes';
    RAISE NOTICE '🚀 Your app should now work without database errors!';
END $$;