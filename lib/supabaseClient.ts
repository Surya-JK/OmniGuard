/**
 * supabaseClient.ts
 * -----------------
 * Single source of truth for the Supabase client.
 * Keys are read from Expo's EXPO_PUBLIC_ environment variables so they
 * are never hard-coded in source files committed to git.
 *
 * HOW TO SET THEM:
 *   1. Copy `.env.example` → `.env.local`  (already git-ignored)
 *   2. Fill in your project values
 *   3. Restart the Expo dev server
 *
 * For EAS builds set them in eas.json → env (or Expo Dashboard secrets).
 */
import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// ---------------------------------------------------------------------------
// Fail loudly in dev if the env vars are missing — silent falls-through
// would result in confusing 401s at runtime.
// ---------------------------------------------------------------------------
const SUPABASE_URL: string = (process.env.EXPO_PUBLIC_SUPABASE_URL ?? '').trim();
const SUPABASE_ANON_KEY: string = (process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '').trim();

if (__DEV__ && (!SUPABASE_URL || !SUPABASE_ANON_KEY)) {
  console.warn(
    '[OmniGuard] EXPO_PUBLIC_SUPABASE_URL or EXPO_PUBLIC_SUPABASE_ANON_KEY is missing.\n' +
    'Create a .env.local file (see .env.example) and restart the dev server.'
  );
}

const customStorage = {
  getItem: async (key: string) => {
    if (Platform.OS === 'web' && typeof window === 'undefined') return null;
    return await AsyncStorage.getItem(key);
  },
  setItem: async (key: string, value: string) => {
    if (Platform.OS === 'web' && typeof window === 'undefined') return;
    await AsyncStorage.setItem(key, value);
  },
  removeItem: async (key: string) => {
    if (Platform.OS === 'web' && typeof window === 'undefined') return;
    await AsyncStorage.removeItem(key);
  },
};

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: customStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
