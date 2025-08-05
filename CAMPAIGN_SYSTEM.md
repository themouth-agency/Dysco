# 🎯 Campaign Management System

## 🏗️ **System Overview**

The campaign management system allows merchants to organize their coupons into structured campaigns while maintaining **one NFT collection per merchant** for optimal secondary market discoverability.

### **Architecture Benefits:**
✅ **One collection per merchant** - Great for secondary market searches  
✅ **Campaign-based organization** - Easy management and analytics  
✅ **Rich NFT metadata** - Each NFT contains full campaign information  
✅ **Flexible redemption types** - QR codes or discount codes  
✅ **Bulk operations** - Mint multiple coupons, burn expired ones  
✅ **Treasury management** - Merchant account as treasury  

---

## 📋 **Database Schema**

### **New Tables Added:**

#### **`campaigns` Table**
```sql
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
```

#### **Updated `nft_coupons` Table**
```sql
CREATE TABLE nft_coupons (
  nft_id VARCHAR(30) PRIMARY KEY,
  token_id VARCHAR(20) NOT NULL,
  serial_number INTEGER NOT NULL,
  campaign_id VARCHAR(50) REFERENCES campaigns(id), -- NEW: Links to campaign
  merchant_account_id VARCHAR(20) REFERENCES merchants(hedera_account_id),
  owner_account_id VARCHAR(20), -- NEW: Current owner
  redemption_status VARCHAR(20) DEFAULT 'active', -- NEW: 'active', 'redeemed', 'expired', 'burned'
  discount_code VARCHAR(50), -- NEW: For discount_code campaigns
  metadata JSONB NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  redeemed_at TIMESTAMP -- NEW: Redemption timestamp
);
```

---

## 🔗 **API Endpoints**

### **Campaign Management:**
- `POST /api/merchants/:merchantId/campaigns` - Create campaign
- `GET /api/merchants/:merchantId/campaigns` - List merchant campaigns  
- `GET /api/campaigns/:campaignId` - Get campaign details
- `PUT /api/campaigns/:campaignId` - Update campaign
- `GET /api/campaigns/:campaignId/coupons` - List campaign coupons

### **Coupon Operations:**
- `POST /api/campaigns/:campaignId/coupons/mint` - Mint coupons for campaign
- `POST /api/campaigns/:campaignId/burn-expired` - Burn expired coupons

---

## 📱 **Mobile Screens Added**

### **1. Campaign Dashboard** (`CampaignDashboardScreen.tsx`)
- **Purpose**: Overview of all merchant campaigns
- **Features**:
  - List all campaigns with status (Active/Expired/Inactive)
  - Quick stats (minted, active, redeemed counts)
  - Create new campaign button
  - Navigate to campaign details

### **2. Create Campaign** (`CreateCampaignScreen.tsx`)
- **Purpose**: Set up new campaigns
- **Features**:
  - Campaign name, description, duration
  - Redemption type: QR redeem vs Discount code
  - Discount type: Percentage, fixed amount, or free item
  - Usage limits and restrictions
  - Sample data fill for testing

### **3. Campaign Details** (`CampaignDetailsScreen.tsx`)
- **Purpose**: Manage individual campaigns
- **Features**:
  - Campaign overview and statistics
  - List all minted coupons with status
  - Mint new coupons (bulk operation)
  - Burn expired coupons (bulk operation)
  - Real-time status tracking

---

## 🎫 **NFT Metadata Structure (HIP-412)**

Each minted coupon contains rich metadata linking it to its campaign:

```json
{
  "name": "Summer Sale - 20% Off",
  "description": "Get 20% off any item in our summer collection",
  "image": "https://storage.dysco.app/campaign-images/summer-sale.jpg",
  "type": "object",
  "attributes": [
    {
      "trait_type": "Campaign ID",
      "value": "camp_123"
    },
    {
      "trait_type": "Campaign Name", 
      "value": "Summer Sale 2024"
    },
    {
      "trait_type": "Discount Type",
      "value": "percentage"
    },
    {
      "trait_type": "Discount Value",
      "value": "20"
    },
    {
      "trait_type": "Redemption Type",
      "value": "qr_redeem"
    },
    {
      "trait_type": "Expires",
      "value": "2024-09-30T23:59:59Z"
    },
    {
      "trait_type": "Discount Code",  // Only for discount_code campaigns
      "value": "PERCENTAGE_A7B2X9K1"
    }
  ]
}
```

---

## 🔄 **Merchant Workflow**

### **1. Create Campaign**
```
Merchant Dashboard → Create Campaign → Fill Details → Submit
```
- Set campaign name, description, duration
- Choose redemption type (QR vs discount code)  
- Set discount details (%, $, free item)
- Configure limits and restrictions

### **2. Mint Coupons**
```
Campaign Dashboard → Campaign Details → Mint Coupons → Choose Quantity
```
- Bulk mint multiple coupons for the campaign
- Each NFT gets unique serial number
- Discount codes auto-generated for discount_code campaigns
- All stored in merchant's NFT collection

### **3. Monitor & Manage**
```
Campaign Details → View Statistics → Manage Expired Coupons
```
- Track minted, active, redeemed, expired counts
- Burn expired coupons to clean up collection
- View individual coupon details and codes

---

## 🎯 **Key Features**

### **Campaign Types:**
1. **QR Redeem**: Physical presence required, merchant scans QR code
2. **Discount Code**: Online/phone orders, customer enters unique code

### **Discount Types:**
1. **Percentage**: e.g., "20% off"
2. **Fixed Amount**: e.g., "$5 off"  
3. **Free Item**: e.g., "Free coffee with purchase"

### **Bulk Operations:**
- **Mint Multiple**: Create 1-100 coupons per campaign at once
- **Burn Expired**: Clean up expired coupons across entire campaign

### **Treasury Management:**
- **Merchant as Treasury**: NFTs stored in merchant's Hedera account
- **Operator Control**: Backend maintains admin/supply/wipe keys
- **Fee Abstraction**: Operator pays all Hedera transaction fees

---

## 🚀 **Setup Instructions**

### **1. Update Database Schema**
Run the SQL from `SUPABASE_SETUP.md` to add campaign tables and indexes.

### **2. Restart Backend**
The backend now includes all campaign management endpoints.

### **3. Add Navigation**
Add the new screens to your merchant navigation stack:
```typescript
// In MerchantNavigator.tsx
<Stack.Screen name="CampaignDashboard" component={CampaignDashboardScreen} />
<Stack.Screen name="CreateCampaign" component={CreateCampaignScreen} />  
<Stack.Screen name="CampaignDetails" component={CampaignDetailsScreen} />
```

### **4. Update Merchant Dashboard**
Add a "Manage Campaigns" button that navigates to the Campaign Dashboard.

---

## 📊 **Analytics & Benefits**

### **For Merchants:**
- **Organized coupon management** by campaign
- **Clear campaign performance metrics**
- **Easy bulk operations** (mint/burn)
- **Flexible redemption types** for different use cases
- **Professional campaign presentation**

### **For Users:**
- **Rich coupon metadata** with full campaign context
- **Clear expiry dates** and discount information
- **Consistent collection structure** for secondary market
- **Unique discount codes** for online redemption

### **For Secondary Market:**
- **One collection per merchant** = easier search/discovery
- **Rich metadata** = better filtering and categorization
- **Clear campaign context** = informed purchasing decisions
- **Consistent token structure** = predictable market behavior

---

## 🎉 **Ready to Use!**

The campaign management system is now fully implemented and ready for testing:

1. **Create your first campaign** with sample data
2. **Mint some coupons** to see the system in action  
3. **Test the bulk operations** and status tracking
4. **Verify the rich NFT metadata** on Hedera

This system gives merchants professional-grade campaign management while maintaining the simplicity and discoverability benefits of a single NFT collection per merchant! 🚀