
import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Récupération sécurisée pour Vite/Vercel
const getEnv = (name: string): string => {
  try {
    // Tente de récupérer via process.env (défini dans vite.config.ts) ou import.meta.env
    // @ts-ignore
    return (typeof process !== 'undefined' && process.env && process.env[name]) || (import.meta.env && import.meta.env[name]) || "";
  } catch (e) {
    return "";
  }
};

const supabaseUrl = getEnv('VITE_SUPABASE_URL');
const supabaseAnonKey = getEnv('VITE_SUPABASE_ANON_KEY');

// Initialisation sécurisée : on ne crée le client que si l'URL est valide
let client: SupabaseClient | null = null;
if (supabaseUrl && supabaseUrl.startsWith('https://') && supabaseAnonKey) {
  try {
    client = createClient(supabaseUrl, supabaseAnonKey);
  } catch (err) {
    console.warn("Échec de l'initialisation Supabase:", err);
  }
}

export const supabase = client;

/**
 * Vérifie si la connexion Supabase est opérationnelle
 */
export const isSupabaseConfigured = (): boolean => {
  return !!supabase && !!supabaseUrl && supabaseUrl.includes('supabase.co');
};
