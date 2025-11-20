import { getSupabase } from './supabaseClient';
import { Tool } from '../types';

export const ToolsService = {
  getAll: async (): Promise<Tool[]> => {
    const supabase = getSupabase();
    if (!supabase) return [];

    const { data, error } = await supabase
      .from('tools')
      .select('*')
      .order('name', { ascending: true });

    if (error) {
      console.error('Erro ao buscar ferramentas:', error);
      return [];
    }

    return data as Tool[];
  },

  create: async (tool: Omit<Tool, 'id'>): Promise<Tool> => {
    const supabase = getSupabase();
    if (!supabase) throw new Error("Supabase não conectado");

    const { data, error } = await supabase
      .from('tools')
      .insert([tool])
      .select()
      .single();

    if (error) throw error;
    return data as Tool;
  },

  update: async (tool: Tool): Promise<Tool> => {
    const supabase = getSupabase();
    if (!supabase) throw new Error("Supabase não conectado");

    const { data, error } = await supabase
      .from('tools')
      .update({
        name: tool.name,
        description: tool.description,
        url: tool.url,
        iconUrl: tool.iconUrl,
        category: tool.category
      })
      .eq('id', tool.id)
      .select()
      .single();

    if (error) throw error;
    return data as Tool;
  },

  delete: async (id: string): Promise<void> => {
    const supabase = getSupabase();
    if (!supabase) throw new Error("Supabase não conectado");

    const { error } = await supabase
      .from('tools')
      .delete()
      .eq('id', id);

    if (error) {
      console.error("Erro ao deletar ferramenta:", error);
      if (error.code === '42501') {
        throw new Error("Permissão negada. Verifique as Policies (RLS) no Supabase para a tabela 'tools'.");
      }
      throw error;
    }
  }
};