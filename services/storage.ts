import { User } from '../types';

const STORAGE_KEY_URL = 'automatik_supabase_url';
const STORAGE_KEY_KEY = 'automatik_supabase_key';
const STORAGE_KEY_SESSION = 'automatik_current_session';

export const StorageService = {
  // --- CONFIGURAÇÃO SUPABASE ---
  getSupabaseConfig: () => {
    return {
      url: localStorage.getItem(STORAGE_KEY_URL) || '',
      key: localStorage.getItem(STORAGE_KEY_KEY) || ''
    };
  },

  saveSupabaseConfig: (url: string, key: string) => {
    if (url) localStorage.setItem(STORAGE_KEY_URL, url);
    else localStorage.removeItem(STORAGE_KEY_URL);
    
    if (key) localStorage.setItem(STORAGE_KEY_KEY, key);
    else localStorage.removeItem(STORAGE_KEY_KEY);
  },

  // --- SESSÃO (AUTH) ---
  // Mantemos apenas isso para o usuário não deslogar ao dar F5
  // Mas os dados dele virão do banco
  clearSession: () => {
    localStorage.removeItem(STORAGE_KEY_SESSION);
  },

  saveSession: (user: User) => {
    localStorage.setItem(STORAGE_KEY_SESSION, JSON.stringify(user));
  },

  getSession: (): User | null => {
    const session = localStorage.getItem(STORAGE_KEY_SESSION);
    return session ? JSON.parse(session) : null;
  }
};
