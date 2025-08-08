# 🚀 Quick Deploy to Railway for Online Testing

## 🎯 Goal
Deploy backend to Railway so testers can use your app via Expo Go without running backend locally.

## ⚡ Super Quick Setup (5 minutes)

### 1. Deploy Backend to Railway
1. Go to [railway.app](https://railway.app) and sign up with GitHub
2. Click **"New Project"** → **"Deploy from GitHub repo"**
3. Select your Dysco repository
4. Select the `apps/backend` folder as the service root
5. Railway will auto-deploy your backend!

### 2. Get Your Railway URL
After deployment, Railway gives you a URL like:
```
https://dysco-backend-production-abc123.up.railway.app
```

### 3. Update Mobile App Config
Edit `apps/mobile/src/config/api.ts`:
```typescript
// Replace this line:
const API_BASE_URL = 'https://YOUR_RAILWAY_APP_NAME.up.railway.app';

// With your actual Railway URL:
const API_BASE_URL = 'https://dysco-backend-production-abc123.up.railway.app';
```

### 4. Add Environment Variables in Railway
In Railway dashboard → Variables tab, add:
- `HEDERA_PRIVATE_KEY=your_key_here`
- `HEDERA_ACCOUNT_ID=0.0.your_account`
- `SUPABASE_URL=your_supabase_url`
- `SUPABASE_SECRET_KEY=your_supabase_secret_key`
- `NODE_ENV=production`

### 5. Test with Expo Go
```bash
cd apps/mobile
npm start
```
- Scan QR code with Expo Go
- App now uses your online backend!
- Share QR code with anyone for testing

## ✅ Done!
- ✅ Backend deployed to Railway (always online)
- ✅ Mobile app points to Railway backend
- ✅ Anyone can test via Expo Go QR code
- ✅ No need for local backend setup

## 🔄 For Future Updates
Just push to GitHub - Railway auto-deploys:
```bash
git add .
git commit -m "Update backend"
git push origin main
# Railway automatically deploys!
```

## 💡 Pro Tips
- Railway free tier: $5 credit monthly (plenty for testing)
- Check Railway logs if something breaks
- Use `/health` endpoint to verify backend is running
- Keep local development with localhost for faster coding

## 🆚 Railway vs Vercel Choice
You chose **Railway** because:
- ✅ No 10-second timeout (Hedera operations need time)
- ✅ Persistent connections (better for blockchain)
- ✅ File system access (for NFT metadata)
- ✅ Real server environment