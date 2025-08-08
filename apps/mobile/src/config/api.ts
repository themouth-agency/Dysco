// API Configuration
// Change this URL to switch between local development and production

// 🏠 Local Development (when running backend locally)
// const API_BASE_URL = 'http://192.168.0.49:3001';

// 🚂 Railway Production (for online testing and production)
// Note: Replace with your PUBLIC Railway URL (not the .internal one)
// const API_BASE_URL = 'https://dysco-production.up.railway.app';

// 🧪 Auto-detect environment (automatically switches between local and production)
// Temporarily using Railway for both dev and prod until local backend is configured
const API_BASE_URL = 'https://dysco-production.up.railway.app';

export { API_BASE_URL };

// Quick Setup Instructions:
// 1. Deploy backend to Railway (see RAILWAY_DEPLOYMENT.md)
// 2. Replace 'YOUR_RAILWAY_APP_NAME' with your actual Railway app URL
// 3. For testing: npm start in apps/mobile and share QR code
// 4. For local dev: uncomment the local URL above