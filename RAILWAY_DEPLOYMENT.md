# 🚂 Railway Deployment Guide for Dysco Backend

## Why Railway for Dysco?
- ✅ Long-running processes (perfect for Hedera SDK)
- ✅ No 10-second timeout limits
- ✅ Persistent Hedera client connections
- ✅ File system access for NFT metadata
- ✅ Better for blockchain operations

## 🚀 Quick Railway Deployment

### 1. Setup Railway Account
1. Go to [railway.app](https://railway.app)
2. Sign up with GitHub
3. Connect your repository

### 2. Deploy Backend
1. **Create New Project** in Railway dashboard
2. **Connect GitHub Repository** - select your Dysco repo
3. **Choose Service** - select `apps/backend` folder
4. **Auto-deployment** will start

### 3. Configure Environment Variables
In Railway dashboard → Variables tab, add:

```env
HEDERA_PRIVATE_KEY=your_hedera_private_key_here
HEDERA_ACCOUNT_ID=0.0.your_account_id
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_supabase_anon_key_here
PORT=3001
NODE_ENV=production
```

### 4. Update Mobile App API URL
Once deployed, Railway gives you a URL like: `https://dysco-backend-production.up.railway.app`

Update your mobile app to use this URL instead of localhost.

## 📱 Update Mobile App for Online Backend

### Find API Configuration
Look for API base URL in your mobile app - likely in:
- `apps/mobile/src/services/api.ts`
- `apps/mobile/App.tsx`
- Environment configuration files

### Example Update
```typescript
// Before (local development)
const API_BASE_URL = 'http://192.168.0.49:3001';

// After (Railway deployment)
const API_BASE_URL = 'https://your-app-name.up.railway.app';
```

## 🧪 Testing Flow

### 1. Deploy Backend to Railway
```bash
# Push your code to GitHub
git add .
git commit -m "Deploy to Railway"
git push origin main

# Railway auto-deploys from GitHub
```

### 2. Update Mobile App API URL
```bash
# Update API URL in mobile app
# Then restart Expo development server
cd apps/mobile
npm start
```

### 3. Test with Expo Go
- Scan QR code with Expo Go
- App now uses online backend
- Share QR code with testers
- Everyone can test without running backend locally

## 🔧 Railway Configuration Tips

### Custom Domain (Optional)
- Add custom domain in Railway dashboard
- Update mobile app API URL to use custom domain

### Monitoring
- Check logs in Railway dashboard
- Monitor API health at `/health` endpoint
- Set up uptime monitoring

### Scaling
- Railway auto-scales based on usage
- No configuration needed for basic scaling

## 💡 Development Workflow

### Local Development
```bash
# Backend locally for fast development
cd apps/backend
npm run dev

# Mobile app pointing to local backend
cd apps/mobile
npm start
```

### Testing/Sharing
```bash
# Deploy backend to Railway
git push origin main

# Update mobile app API URL to Railway
# Share Expo Go QR code with testers
```

### Production
```bash
# Backend on Railway
# Mobile app builds pointing to Railway backend
cd apps/mobile
eas build --profile production
```

## 🎯 Benefits for Your Use Case

1. **Easy Sharing**: Testers just scan QR code in Expo Go
2. **No Local Setup**: Testers don't need to run backend
3. **Persistent Backend**: Always available for testing
4. **Real Environment**: Tests actual deployment scenario
5. **Blockchain Compatible**: No timeout issues with Hedera operations

This setup gives you the best of both worlds - local development speed and online testing convenience!