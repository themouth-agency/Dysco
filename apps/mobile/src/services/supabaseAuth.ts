import { createClient, SupabaseClient, User, Session } from '@supabase/supabase-js';

// Supabase configuration - these should match backend credentials
const SUPABASE_URL = 'https://fyhwypwrlgzrosbhccnp.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ5aHd5cHdybGd6cm9zYmhjY25wIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM3MzczNDQsImV4cCI6MjA2OTMxMzM0NH0.TSP5FmaGgARt50WB1TvJ2p8JPt-fWyUhQ8YI3SeyqXs';

export interface MerchantProfile {
  id: string;
  email: string;
  name?: string;
  business_name?: string;
  business_type?: string;
  hedera_account_id?: string;
  nft_collection_id?: string;
  onboarding_status?: 'pending' | 'account_created' | 'collection_created' | 'active';
  created_at: string;
  updated_at: string;
}

export interface AuthResult {
  success: boolean;
  user?: User | null;
  session?: Session | null;
  error?: string;
}

class SupabaseAuthService {
  private supabase: SupabaseClient;

  constructor() {
    this.supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  }

  /**
   * Check if Supabase is properly configured
   */
  isConfigured(): boolean {
    return SUPABASE_URL && SUPABASE_ANON_KEY && 
           SUPABASE_URL.length > 0 && SUPABASE_ANON_KEY.length > 0;
  }

  /**
   * Get current session
   */
  async getCurrentSession(): Promise<Session | null> {
    try {
      const { data: { session } } = await this.supabase.auth.getSession();
      return session;
    } catch (error) {
      console.error('Error getting current session:', error);
      return null;
    }
  }

  /**
   * Get current user
   */
  async getCurrentUser(): Promise<User | null> {
    try {
      const { data: { user } } = await this.supabase.auth.getUser();
      return user;
    } catch (error) {
      console.error('Error getting current user:', error);
      return null;
    }
  }

  /**
   * Sign up with email and password
   */
  async signUpWithEmail(email: string, password: string, merchantData?: {
    name: string;
    businessName: string;
    businessType: string;
  }): Promise<AuthResult> {
    try {
      const { data, error } = await this.supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name: merchantData?.name,
            business_name: merchantData?.businessName,
            business_type: merchantData?.businessType,
          }
        }
      });

      if (error) {
        return { success: false, error: error.message };
      }

      return {
        success: true,
        user: data.user,
        session: data.session
      };
    } catch (error) {
      console.error('Error signing up:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to sign up'
      };
    }
  }

  /**
   * Sign in with email and password
   */
  async signInWithEmail(email: string, password: string): Promise<AuthResult> {
    try {
      const { data, error } = await this.supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        return { success: false, error: error.message };
      }

      return {
        success: true,
        user: data.user,
        session: data.session
      };
    } catch (error) {
      console.error('Error signing in:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to sign in'
      };
    }
  }

  /**
   * Sign in with Google (OAuth)
   */
  async signInWithGoogle(): Promise<AuthResult> {
    try {
      const { data, error } = await this.supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: 'exp://localhost:8081' // For Expo development
        }
      });

      if (error) {
        return { success: false, error: error.message };
      }

      // OAuth redirects, so we need to listen for session changes
      return { success: true };
    } catch (error) {
      console.error('Error signing in with Google:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to sign in with Google'
      };
    }
  }

  /**
   * Sign in with Apple (OAuth)
   */
  async signInWithApple(): Promise<AuthResult> {
    try {
      const { data, error } = await this.supabase.auth.signInWithOAuth({
        provider: 'apple',
        options: {
          redirectTo: 'exp://localhost:8081' // For Expo development
        }
      });

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error('Error signing in with Apple:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to sign in with Apple'
      };
    }
  }

  /**
   * Sign out
   */
  async signOut(): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await this.supabase.auth.signOut();
      
      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error('Error signing out:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to sign out'
      };
    }
  }

  /**
   * Get merchant profile
   */
  async getMerchantProfile(userId: string): Promise<MerchantProfile | null> {
    try {
      const { data, error } = await this.supabase
        .from('merchants')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error getting merchant profile:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error getting merchant profile:', error);
      return null;
    }
  }

  /**
   * Create or update merchant profile
   */
  async upsertMerchantProfile(profile: Partial<MerchantProfile>): Promise<{
    success: boolean;
    profile?: MerchantProfile;
    error?: string;
  }> {
    try {
      const { data, error } = await this.supabase
        .from('merchants')
        .upsert(profile)
        .select()
        .single();

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, profile: data };
    } catch (error) {
      console.error('Error upserting merchant profile:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to save profile'
      };
    }
  }

  /**
   * Listen for auth state changes
   */
  onAuthStateChange(callback: (event: string, session: Session | null) => void) {
    return this.supabase.auth.onAuthStateChange(callback);
  }

  /**
   * Send password reset email
   */
  async resetPassword(email: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await this.supabase.auth.resetPasswordForEmail(email);
      
      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error('Error sending password reset:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to send reset email'
      };
    }
  }

  /**
   * Check if user is authenticated
   */
  async isAuthenticated(): Promise<boolean> {
    const session = await this.getCurrentSession();
    return !!session;
  }
}

// Export singleton instance
export const supabaseAuthService = new SupabaseAuthService(); 