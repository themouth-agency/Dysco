// API Configuration
// Change this URL to switch between local development and production

// 🏠 Local Development (when running backend locally)
// const API_BASE_URL = 'http://192.168.0.49:3001';

// 🚂 Railway Production (for online testing and production)
// Note: Replace with your PUBLIC Railway URL (not the .internal one)
const API_BASE_URL = 'https://dysco-production.up.railway.app';

// 🧪 Auto-detect environment (optional - uncomment if you want auto-switching)
// const API_BASE_URL = __DEV__ 
//   ? 'http://192.168.0.49:3001'  // Local when debugging
//   : 'https://YOUR_RAILWAY_APP_NAME.up.railway.app';  // Railway when released

export { API_BASE_URL };

// Quick Setup Instructions:
// 1. Deploy backend to Railway (see RAILWAY_DEPLOYMENT.md)
// 2. Replace 'YOUR_RAILWAY_APP_NAME' with your actual Railway app URL
// 3. For testing: npm start in apps/mobile and share QR code
// 4. For local dev: uncomment the local URL above