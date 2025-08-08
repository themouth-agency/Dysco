# 🗄️ Supabase Database Setup Guide

## 📋 Prerequisites
- Supabase account (free tier works perfectly!)
- Backend environment variables configured

## 🚀 Quick Setup

### 1. Create Supabase Project
1. Go to [supabase.com](https://supabase.com)
2. Click **"New Project"**
3. Choose organization and enter:
   - **Name**: `Dysco`
   - **Database Password**: Generate or create a secure password
   - **Region**: Choose closest to your location

### 2. Get Database Credentials
1. In your Supabase project dashboard
2. Go to **Settings** → **API**
3. Copy these values:
   - **Project URL** (looks like: `https://your-project.supabase.co`)
   - **Anon public key** (starts with `eyJ...`)

### 3. Update Environment Variables
Add to your `Dysco/apps/backend/.env` file:

```bash
# Supabase database credentials
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SECRET_KEY=sb_secret_...
```

### 4. Create Database Tables
1. In Supabase dashboard, go to **SQL Editor**
2. Click **"New Query"**
3. Copy and paste this SQL:

```sql
-- Merchants table (using Hedera Account ID as primary key)
CREATE TABLE merchants (
  hedera_account_id VARCHAR(20) PRIMARY KEY,
  id VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  business_type VARCHAR(100) NOT NULL,
  hedera_public_key VARCHAR(128) NOT NULL,
  nft_collection_id VARCHAR(20),
  fiat_payment_status VARCHAR(20) DEFAULT 'pending',
  onboarding_status VARCHAR(20) DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT NOW(),
  activated_at TIMESTAMP
);

-- Campaigns table (for organizing coupons)
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

-- NFT Coupons table
CREATE TABLE nft_coupons (
  nft_id VARCHAR(30) PRIMARY KEY,
  token_id VARCHAR(20) NOT NULL,
  serial_number INTEGER NOT NULL,
  campaign_id VARCHAR(50) REFERENCES campaigns(id),
  merchant_account_id VARCHAR(20) REFERENCES merchants(hedera_account_id),
  owner_account_id VARCHAR(20),
  redemption_status VARCHAR(20) DEFAULT 'active', -- 'active', 'redeemed', 'expired', 'burned'
  discount_code VARCHAR(50), -- For discount_code type campaigns
  metadata JSONB NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  redeemed_at TIMESTAMP
);

-- Coupon Redemptions table
CREATE TABLE coupon_redemptions (
  id SERIAL PRIMARY KEY,
  nft_id VARCHAR(30) NOT NULL,
  user_account_id VARCHAR(20) NOT NULL,
  merchant_account_id VARCHAR(20) REFERENCES merchants(hedera_account_id),
  redemption_transaction_id VARCHAR(100) NOT NULL,
  scanned_at TIMESTAMP DEFAULT NOW(),
  redeemed_at TIMESTAMP DEFAULT NOW(),
  redemption_method VARCHAR(20) DEFAULT 'qr_scan'
);

-- User Wallet Activity table (for tracking user actions)
CREATE TABLE user_wallet_activity (
  id SERIAL PRIMARY KEY,
  user_account_id VARCHAR(20) NOT NULL,
  activity_type VARCHAR(20) NOT NULL, -- 'claim', 'redeem', 'transfer'
  nft_id VARCHAR(30),
  transaction_id VARCHAR(100),
  details JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_merchants_email ON merchants(email);
CREATE INDEX idx_merchants_public_key ON merchants(hedera_public_key);
CREATE INDEX idx_campaigns_merchant ON campaigns(merchant_id);
CREATE INDEX idx_campaigns_active ON campaigns(is_active);
CREATE INDEX idx_campaigns_dates ON campaigns(start_date, end_date);
CREATE INDEX idx_nft_campaign ON nft_coupons(campaign_id);
CREATE INDEX idx_nft_merchant ON nft_coupons(merchant_account_id);
CREATE INDEX idx_nft_owner ON nft_coupons(owner_account_id);
CREATE INDEX idx_nft_status ON nft_coupons(redemption_status);
CREATE INDEX idx_nft_token_serial ON nft_coupons(token_id, serial_number);
CREATE INDEX idx_redemptions_user ON coupon_redemptions(user_account_id);
CREATE INDEX idx_redemptions_merchant ON coupon_redemptions(merchant_account_id);
CREATE INDEX idx_redemptions_nft ON coupon_redemptions(nft_id);
CREATE INDEX idx_activity_user ON user_wallet_activity(user_account_id);
CREATE INDEX idx_activity_type ON user_wallet_activity(activity_type);
```

4. Click **"Run"** to execute

### 5. Verify Setup
1. Start your backend: `npm run dev`
2. Look for: `✅ Connected to Supabase database`
3. Check: `✅ Database tables are ready`

## 🎯 Database Schema Explained

### **merchants table**
- **Primary Key**: `hedera_account_id` (e.g., "0.0.6458626")
- **Unique network identifier** across all of Hedera
- **Contains**: Business info, Hedera keys, onboarding status

### **nft_coupons table** 
- **Primary Key**: `nft_id` (e.g., "0.0.6458627:1")
- **Foreign Key**: Links to merchant via `merchant_account_id`
- **Contains**: NFT metadata, creation timestamps

## 🔍 Benefits Achieved

### ✅ **Production Ready**
- **Persistent storage** - survives server restarts
- **ACID compliance** - data integrity guaranteed
- **Scalable** - handles growth and multiple server instances

### ✅ **Analytics Ready**
- **SQL queries** - complex business intelligence
- **Real-time dashboards** - Supabase built-in charts
- **Data exports** - CSV, JSON for external tools

### ✅ **Hackathon Impressive**
- **Professional architecture** - like real startups
- **Database design** - shows backend expertise
- **Supabase integration** - modern, trending technology

## 🚨 Troubleshooting

### "Database not connected"
- Check `.env` file has correct `SUPABASE_URL` and `SUPABASE_SECRET_KEY`
- Verify no trailing spaces in environment variables
- Restart backend server after adding variables

### "Tables need to be created"
- Run the SQL setup in Supabase SQL Editor
- Check for any SQL execution errors
- Verify table names match exactly (case-sensitive)

### "Failed to create merchant"
- Check network connection to Supabase
- Verify Supabase project is not paused (free tier limitation)
- Check database permissions in Supabase dashboard

## 🎉 You're Ready!

Your Dysco backend now has:
- ✅ **Professional database** with PostgreSQL
- ✅ **Persistent merchant storage** 
- ✅ **NFT coupon tracking**
- ✅ **Analytics capabilities**
- ✅ **Production-ready architecture**

Perfect for impressing hackathon judges! 🏆 