import { createClient, SupabaseClient } from '@supabase/supabase-js';

let supabaseInstance: SupabaseClient | null = null;

export function getSupabaseConfig() {
  const envUrl = (import.meta as any).env?.VITE_SUPABASE_URL;
  const envKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY;
  
  const localUrl = localStorage.getItem('supabase_url');
  const localKey = localStorage.getItem('supabase_anon_key');
  
  return {
    url: envUrl || localUrl || 'https://vwnjrquglxxzhamgwdta.supabase.co',
    anonKey: envKey || localKey || 'sb_publishable_flG42FxyBPKxp3LQ_IXgew_-V5R21LY',
    provider: localStorage.getItem('db_provider') || 'supabase'
  };
}

export function isSupabaseConfigured(): boolean {
  const { url, anonKey } = getSupabaseConfig();
  return !!url && !!anonKey;
}

export function getSupabaseClient(): SupabaseClient | null {
  if (supabaseInstance) return supabaseInstance;
  
  const { url, anonKey } = getSupabaseConfig();
  if (!url || !anonKey) return null;
  
  try {
    supabaseInstance = createClient(url, anonKey);
    return supabaseInstance;
  } catch (error) {
    console.error('Erro ao inicializar o cliente do Supabase:', error);
    return null;
  }
}

export function resetSupabaseClient() {
  supabaseInstance = null;
}
