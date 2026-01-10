
import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Approche sécurisée pour récupérer les variables d'environnement sur Vite/Vercel
const getEnv = (key: string): string => {
  // @ts-ignore - Tentative via import.meta.env (Vite standard)
  if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env[key]) {
    return import.meta.env[key];
  }
  // Fallback via process.env (Shimmed par vite.config.ts)
  try {
    if (typeof process !== 'undefined' && process.env && process.env[key]) {
      return process.env[key] as string;
    }
  } catch (e) {}
  
  return "";
};

const supabaseUrl = getEnv('VITE_SUPABASE_URL');
const supabaseAnonKey = getEnv('VITE_SUPABASE_ANON_KEY');

// Initialisation avec vérification de validité de l'URL
let supabaseClient: SupabaseClient | null = null;

if (supabaseUrl && supabaseUrl.startsWith('https://') && supabaseAnonKey) {
  try {
    supabaseClient = createClient(supabaseUrl, supabaseAnonKey);
  } catch (err) {
    console.warn("Erreur d'initialisation Supabase:", err);
  }
}

export const supabase = supabaseClient;

/**
 * Vérifie si la connexion Supabase est opérationnelle
 */
export const isSupabaseConfigured = (): boolean => {
  return !!supabase && !!supabaseUrl && supabaseUrl.includes('supabase.co');
};
