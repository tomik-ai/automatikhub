import { getSupabase } from './supabaseClient';
import { StorageService } from './storage';
import { User } from '../types';

export const UserService = {
  getAll: async (): Promise<User[]> => {
    const supabase = getSupabase();
    if (!supabase) return [];

    const { data, error } = await supabase.from('users').select('*');
    if (error) throw error;
    return data as User[];
  },

  findOrCreate: async (email: string, name: string, avatar: string): Promise<User> => {
    const supabase = getSupabase();
    if (!supabase) throw new Error("Conexão com Supabase necessária para login.");

    const normalizedEmail = email.toLowerCase().trim();

    // 1. Tentar buscar usuário existente
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', normalizedEmail)
      .single();

    if (data && !error) {
      const user = data as User;
      StorageService.saveSession(user);
      return user;
    }

    // 2. Criar novo usuário se não existir
    const INITIAL_ADMINS = ['gabriel.amaral@tomik.ai', 'eduarda@automatiklabs.com.br'];
    const isAdmin = INITIAL_ADMINS.includes(normalizedEmail);
    
    const newUser: User = {
      name,
      email: normalizedEmail,
      avatar,
      role: isAdmin ? 'admin' : 'member',
      department: 'Geral'
    };

    const { error: insertError } = await supabase.from('users').insert([newUser]);
    
    if (insertError) {
      throw new Error("Erro ao criar usuário no banco de dados: " + insertError.message);
    }

    StorageService.saveSession(newUser);
    return newUser;
  },

  updateUser: async (user: User): Promise<void> => {
    const supabase = getSupabase();
    if (!supabase) throw new Error("Supabase desconectado");

    const { error } = await supabase
      .from('users')
      .update({
        name: user.name,
        role: user.role,
        department: user.department,
        avatar: user.avatar
      })
      .eq('email', user.email);
        
    if (error) throw error;

    // Atualiza a sessão local se for o próprio usuário
    const currentSession = StorageService.getSession();
    if (currentSession && currentSession.email === user.email) {
      StorageService.saveSession(user);
    }
  },

  deleteUser: async (email: string): Promise<void> => {
    const supabase = getSupabase();
    if (!supabase) throw new Error("Supabase desconectado");

    const { error } = await supabase
      .from('users')
      .delete()
      .eq('email', email);

    if (error) throw error;
  }
};