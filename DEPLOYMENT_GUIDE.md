# 🚀 Dysco Deployment Guide

## Overview
Dysco uses Expo for the mobile app and can be deployed to various cloud platforms for the backend. This guide covers the complete deployment strategy for easy testing and production use.

## 📱 Mobile App Deployment (Expo)

### Prerequisites
1. Install Expo CLI globally:
```bash
npm install -g @expo/cli
npm install -g eas-cli
```

2. Create an Expo account at [expo.dev](https://expo.dev)

3. Login to Expo:
```bash
expo login
eas login
```

### Development & Testing

#### 1. **Expo Go Development (Fastest for Testing)**
```bash
cd apps/mobile
npm start
```
- Scan QR code with Expo Go app
- Perfect for quick testing and demos
- Hot reload enabled
- Works on any device with Expo Go installed

#### 2. **Development Build (For Native Features)**
```bash
cd apps/mobile
eas build --profile development --platform ios
eas build --profile development --platform android
```
- Download and install the development build
- Required for native features like biometric authentication
- Better performance than Expo Go

#### 3. **Tunnel Mode (Remote Testing)**
```bash
cd apps/mobile
npm run start:tunnel
```
- Share your development server with anyone
- Great for testing with team members
- Works across different networks

### Production Builds

#### 1. **Preview Builds (Beta Testing)**
```bash
cd apps/mobile
eas build --profile preview --platform all
```
- Internal distribution
- Share with testers via TestFlight (iOS) or internal distribution (Android)

#### 2. **Production Builds (App Store)**
```bash
cd apps/mobile
eas build --profile production --platform all
```
- Optimized for app stores
- Submit to Apple App Store and Google Play Store

#### 3. **Over-the-Air Updates**
```bash
cd apps/mobile
eas update --branch production
```
- Update app without going through app stores
- Instant updates for JavaScript changes

## 🖥️ Backend Deployment

### Option 1: Vercel (Recommended for Simplicity)

#### Setup
1. Install Vercel CLI:
```bash
npm install -g vercel
```

2. Deploy:
```bash
cd apps/backend
vercel --prod
```

#### Environment Variables
Set in Vercel dashboard:
- `HEDERA_PRIVATE_KEY`
- `HEDERA_ACCOUNT_ID`
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `NODE_ENV=production`

### Option 2: Railway

1. Connect your GitHub repository to Railway
2. Set environment variables in Railway dashboard
3. Deploy automatically on git push

### Option 3: Heroku

1. Create Heroku app:
```bash
heroku create dysco-backend
```

2. Set environment variables:
```bash
heroku config:set HEDERA_PRIVATE_KEY="your_key_here"
heroku config:set HEDERA_ACCOUNT_ID="0.0.your_account"
heroku config:set SUPABASE_URL="your_supabase_url"
heroku config:set SUPABASE_ANON_KEY="your_supabase_key"
```

3. Deploy:
```bash
git push heroku main
```

## 🔧 Configuration

### Mobile App Environment Configuration

Update `apps/mobile/App.tsx` with your deployed backend URL:

```typescript
// Replace the local development URL
const API_BASE_URL = 'https://your-backend-url.vercel.app';
```

### Backend CORS Configuration

Update `apps/backend/src/server.ts` CORS settings for production:

```typescript
app.use(cors({
  origin: [
    'https://your-frontend-domain.com',
    'exp://localhost:19000',
    /^https:\/\/.*\.exp\.direct$/,
    /^https:\/\/.*\.expo\.dev$/
  ]
}));
```

## 🧪 Testing Workflows

### 1. **Development Testing**
```bash
# Start backend locally
cd apps/backend
npm run dev

# Start mobile app
cd apps/mobile
npm start
```
- Use Expo Go for quick iterations
- Backend runs on localhost
- Perfect for feature development

### 2. **Integration Testing**
```bash
# Deploy backend to staging
cd apps/backend
vercel

# Create preview build
cd apps/mobile
eas build --profile preview
```
- Test with real backend deployment
- Share with team for testing
- Validate API integrations

### 3. **Production Testing**
```bash
# Deploy backend to production
cd apps/backend
vercel --prod

# Create production build
cd apps/mobile
eas build --profile production
```
- Final testing before app store submission
- Performance validation
- End-to-end testing

## 📋 Deployment Checklist

### Pre-Deployment
- [ ] Environment variables configured
- [ ] Supabase database set up
- [ ] Hedera testnet/mainnet accounts configured
- [ ] App icons and splash screens ready
- [ ] App store assets prepared (screenshots, descriptions)

### Mobile App
- [ ] Update `app.json` with correct bundle identifiers
- [ ] Configure EAS project ID
- [ ] Set up app store connect (iOS) / Google Play Console (Android)
- [ ] Test on physical devices
- [ ] Validate biometric authentication

### Backend
- [ ] Environment variables set in deployment platform
- [ ] Database migrations run
- [ ] API endpoints tested
- [ ] CORS configured for production domains
- [ ] SSL/HTTPS enabled

### Post-Deployment
- [ ] Monitor logs for errors
- [ ] Test complete user flows
- [ ] Verify NFT creation and redemption
- [ ] Test QR code scanning
- [ ] Validate wallet functionality

## 🔄 Continuous Deployment

### Automatic Deployments

#### Backend (Vercel)
- Connect GitHub repository to Vercel
- Automatic deployments on push to main branch
- Preview deployments for pull requests

#### Mobile App (EAS Updates)
Set up automatic updates:
```bash
# In GitHub Actions or CI/CD pipeline
eas update --branch production --message "Auto update: $COMMIT_MESSAGE"
```

## 🛠️ Troubleshooting

### Common Issues

#### Expo Build Failures
- Check `eas.json` configuration
- Verify all dependencies are compatible
- Clear cache: `expo r -c`

#### Backend Deployment Issues
- Verify environment variables
- Check function timeout limits
- Monitor logs in deployment platform

#### API Connection Issues
- Verify CORS configuration
- Check backend URL in mobile app
- Test API endpoints independently

### Performance Optimization

#### Mobile App
- Use Expo Updates for JavaScript changes
- Optimize image assets
- Implement proper caching strategies

#### Backend
- Enable compression middleware
- Implement proper error handling
- Use connection pooling for database

## 📞 Support

For deployment issues:
1. Check Expo documentation: [docs.expo.dev](https://docs.expo.dev)
2. Vercel documentation: [vercel.com/docs](https://vercel.com/docs)
3. Supabase documentation: [supabase.com/docs](https://supabase.com/docs)

## 🎯 Quick Start Commands

### Development
```bash
# Backend
cd apps/backend && npm run dev

# Mobile (new terminal)
cd apps/mobile && npm start
```

### Production Deployment
```bash
# Backend
cd apps/backend && vercel --prod

# Mobile
cd apps/mobile && eas build --profile production --platform all
```

### Testing Distribution
```bash
# Create preview build for testing
cd apps/mobile && eas build --profile preview --platform all
```

This deployment strategy ensures easy testing with Expo Go during development and smooth production deployment to app stores when ready!