import { useSession } from '@clerk/clerk-react';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { useMemo } from 'react';

/**
 * Hook that creates an authenticated Supabase client with Clerk JWT token.
 * This is required for any database operations protected by RLS policies.
 *
 * IMPORTANT: Requires a JWT template named 'supabase' configured in Clerk dashboard.
 */
export function useAuthenticatedSupabase(): SupabaseClient {
  const { session } = useSession();

  return useMemo(() => {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      console.error('Missing Supabase environment variables');
    }

    return createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        fetch: async (url, options = {}) => {
          // Get fresh Clerk token for each request
          const token = await session?.getToken({ template: 'supabase' });
          const headers = new Headers(options.headers);

          if (token) {
            headers.set('Authorization', `Bearer ${token}`);
          }

          return fetch(url, { ...options, headers });
        },
      },
    });
  }, [session]);
}
