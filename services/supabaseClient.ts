import { createClient, SupabaseClient } from '@supabase/supabase-js';

const STORAGE_KEY_URL = 'automatik_supabase_url';
const STORAGE_KEY_KEY = 'automatik_supabase_key';

// Credenciais fornecidas pelo usuário
const DEFAULT_URL = 'https://zrcvavsbdcabmgnbpzhd.supabase.co';
const DEFAULT_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpyY3ZhdnNiZGNhYm1nbmJwemhkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk4Njk3NDMsImV4cCI6MjA4NTQ0NTc0M30.1GMSzz2BKtQFIqtFz_cEyylZNTW7IjLzCubKHhfhJRI';

const getEnv = (key: string) => {
  if (typeof process !== 'undefined' && process.env && process.env[key]) return process.env[key];
  if (typeof window !== 'undefined' && (window as any).process?.env?.[key]) return (window as any).process.env[key];
  return undefined;
};

export const getSupabaseConfig = () => {
  return {
    url: getEnv('SUPABASE_URL') || localStorage.getItem(STORAGE_KEY_URL) || DEFAULT_URL,
    key: getEnv('SUPABASE_KEY') || localStorage.getItem(STORAGE_KEY_KEY) || DEFAULT_KEY
  };
};

let supabaseInstance: SupabaseClient | null = null;

export const getSupabase = (): SupabaseClient | null => {
  if (supabaseInstance) return supabaseInstance;

  const { url, key } = getSupabaseConfig();
  
  if (url && key && url.startsWith('http')) {
    try {
      supabaseInstance = createClient(url, key, {
        auth: { persistSession: false }
      });
      return supabaseInstance;
    } catch (error) {
      console.error("Erro crítico ao inicializar Supabase:", error);
      return null;
    }
  }
  return null;
};

export const saveSupabaseConfig = (url: string, key: string) => {
  if (url) localStorage.setItem(STORAGE_KEY_URL, url);
  if (key) localStorage.setItem(STORAGE_KEY_KEY, key);
  window.location.reload();
};

export const checkConnection = async (): Promise<boolean> => {
  const sb = getSupabase();
  if (!sb) return false;
  try {
    const { error } = await sb.from('sops').select('id').limit(1);
    return !error;
  } catch {
    return false;
  }
};

export const supabase = getSupabase();