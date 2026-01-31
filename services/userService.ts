import { getSupabase } from './supabaseClient';
import { StorageService } from './storage';
import { User } from '../types';

export const UserService = {
  getAll: async (): Promise<User[]> => {
    const sb = getSupabase();
    if (!sb) return [];
    try {
      const { data, error } = await sb.from('users').select('*');
      if (error) throw error;
      return data as User[];
    } catch {
      return [];
    }
  },

  findOrCreate: async (email: string, name: string, avatar: string): Promise<User> => {
    const normalizedEmail = email.toLowerCase().trim();
    const sb = getSupabase();
    
    // Fallback para login local se o Supabase falhar
    if (!sb) {
      const guestUser: User = { name, email: normalizedEmail, avatar, role: 'member', department: 'Geral' };
      StorageService.saveSession(guestUser);
      return guestUser;
    }

    try {
      const { data, error } = await sb.from('users').select('*').eq('email', normalizedEmail).single();
      if (data && !error) {
        StorageService.saveSession(data as User);
        return data as User;
      }

      const newUser: User = {
        name,
        email: normalizedEmail,
        avatar,
        role: email.includes('gabriel.amaral') ? 'admin' : 'member',
        department: 'Geral'
      };

      await sb.from('users').insert([newUser]);
      StorageService.saveSession(newUser);
      return newUser;
    } catch (err) {
      console.error("Erro no UserService, usando fallback local:", err);
      const fallbackUser: User = { name, email: normalizedEmail, avatar, role: 'member', department: 'Geral' };
      StorageService.saveSession(fallbackUser);
      return fallbackUser;
    }
  },

  updateUser: async (user: User) => {
    const sb = getSupabase();
    if (sb) {
      await sb.from('users').update(user).eq('email', user.email);
    }
    StorageService.saveSession(user);
  },

  deleteUser: async (email: string) => {
    const sb = getSupabase();
    if (sb) await sb.from('users').delete().eq('email', email);
  }
};