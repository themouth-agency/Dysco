// Supabase Configuration
// TODO: Move these to environment variables or secure configuration

// WARNING: These should not be hardcoded in production
// For development only - replace with your new regenerated keys
export const SUPABASE_CONFIG = {
  url: process.env.EXPO_PUBLIC_SUPABASE_URL || 'YOUR_NEW_SUPABASE_URL_HERE',
  anonKey: process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY || 'YOUR_NEW_SUPABASE_PUBLISHABLE_KEY_HERE',
};

// Validation to ensure config is set
export const validateSupabaseConfig = () => {
  if (!SUPABASE_CONFIG.url || !SUPABASE_CONFIG.anonKey) {
    throw new Error('Supabase configuration missing. Please set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY environment variables.');
  }
  
  if (SUPABASE_CONFIG.url.includes('YOUR_NEW_') || SUPABASE_CONFIG.anonKey.includes('YOUR_NEW_')) {
    throw new Error('Please replace placeholder values with actual Supabase credentials.');
  }
};