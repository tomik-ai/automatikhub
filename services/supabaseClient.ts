import { createClient, SupabaseClient } from '@supabase/supabase-js';

const STORAGE_KEY_URL = 'automatik_supabase_url';
const STORAGE_KEY_KEY = 'automatik_supabase_key';

// Default credentials provided by user
const DEFAULT_URL = 'https://vjkqrotltxotdrsnwrco.supabase.co';
const DEFAULT_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZqa3Fyb3RsdHhvdGRyc253cmNvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM1OTk3MzEsImV4cCI6MjA3OTE3NTczMX0.RYTtbuyBojbtxSgPGJJSv8sLkwkwOJczomRu75k50Fw';

// Helper seguro para ler env vars sem crashar o navegador
const getEnv = (key: string) => {
  if (typeof process !== 'undefined' && process.env) {
    return process.env[key];
  }
  return undefined;
};

export const getSupabaseConfig = () => {
  // Priority: Environment Var -> Local Storage -> Default Hardcoded
  return {
    url: getEnv('SUPABASE_URL') || localStorage.getItem(STORAGE_KEY_URL) || DEFAULT_URL,
    key: getEnv('SUPABASE_KEY') || localStorage.getItem(STORAGE_KEY_KEY) || DEFAULT_KEY
  };
};

export const saveSupabaseConfig = (url: string, key: string) => {
  if (url) localStorage.setItem(STORAGE_KEY_URL, url);
  else localStorage.removeItem(STORAGE_KEY_URL);
  
  if (key) localStorage.setItem(STORAGE_KEY_KEY, key);
  else localStorage.removeItem(STORAGE_KEY_KEY);
  
  // Force reload to re-initialize client with new settings
  window.location.reload();
};

let supabaseInstance: SupabaseClient | null = null;

export const getSupabase = (): SupabaseClient | null => {
  if (supabaseInstance) return supabaseInstance;

  const { url, key } = getSupabaseConfig();
  
  // Basic validation to ensure URL is valid before attempting connection
  if (url && key && url.startsWith('http')) {
    try {
      supabaseInstance = createClient(url, key);
      return supabaseInstance;
    } catch (error) {
      console.error("Error initializing Supabase client:", error);
      return null;
    }
  }
  return null;
};

export const isSupabaseConnected = (): boolean => {
  return !!getSupabase();
};

export const checkConnection = async (): Promise<boolean> => {
  const supabase = getSupabase();
  if (!supabase) return false;

  try {
    // Tenta buscar uma linha qualquer da tabela sops apenas para testar a conexão
    const { data, error } = await supabase.from('sops').select('id').limit(1);
    if (error) throw error;
    return true;
  } catch (err) {
    console.error("Supabase connection check failed:", err);
    return false;
  }
};

export const supabase = getSupabase();