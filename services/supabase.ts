
import { createClient, SupabaseClient } from '@supabase/supabase-js';

/**
 * ATTENTION: Vite remplace ces chaînes littérales au moment du build.
 * NE PAS utiliser d'accès dynamique type process.env[key] car 'process' n'existe pas globalement.
 */
const supabaseUrl = process.env.VITE_SUPABASE_URL || "";
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || "";

let supabaseClient: SupabaseClient | null = null;

// On n'initialise que si les deux valeurs sont présentes et valides
if (supabaseUrl && supabaseUrl.startsWith('https://') && supabaseAnonKey) {
  try {
    supabaseClient = createClient(supabaseUrl, supabaseAnonKey);
  } catch (err) {
    console.error("Supabase Initialization Error:", err);
  }
}

export const supabase = supabaseClient;

/**
 * Vérifie si la connexion Supabase est opérationnelle
 */
export const isSupabaseConfigured = (): boolean => {
  return !!supabase && !!supabaseUrl && supabaseUrl.includes('supabase.co');
};
