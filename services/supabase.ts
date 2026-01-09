
import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Récupération sécurisée des variables d'environnement
const supabaseUrl = process.env.VITE_SUPABASE_URL || "";
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || "";

// Initialisation conditionnelle du client
export const supabase: SupabaseClient | null = (supabaseUrl && supabaseAnonKey && supabaseUrl !== "" && supabaseAnonKey !== "") 
  ? createClient(supabaseUrl, supabaseAnonKey) 
  : null;

/**
 * Vérifie si la connexion Supabase est opérationnelle
 */
export const isSupabaseConfigured = (): boolean => {
  return !!supabase && supabaseUrl !== "" && supabaseAnonKey !== "";
};

