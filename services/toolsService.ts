import { getSupabase } from './supabaseClient';
import { Tool } from '../types';
import { MOCK_TOOLS } from '../constants';

const mapToolFromDb = (row: any): Tool => ({
  id: row.id,
  name: row.name,
  description: row.description || '',
  url: row.url,
  iconUrl: row.icon_url || '🔗', 
  category: row.category as any,
  target_department: row.target_department || 'Geral'
});

export const ToolsService = {
  getAll: async (): Promise<Tool[]> => {
    const supabase = getSupabase();
    if (!supabase) return MOCK_TOOLS;

    try {
      const { data, error } = await supabase
        .from('tools')
        .select('*')
        .order('name', { ascending: true });

      if (error) throw error;
      return (data || []).map(mapToolFromDb);
    } catch (err) {
      console.error('Erro ao buscar ferramentas:', err);
      return MOCK_TOOLS;
    }
  },

  create: async (tool: Omit<Tool, 'id'>): Promise<Tool> => {
    const supabase = getSupabase();
    if (!supabase) throw new Error("Supabase não conectado");

    const dbPayload = {
      name: tool.name,
      description: tool.description,
      url: tool.url,
      icon_url: tool.iconUrl,
      category: tool.category,
      target_department: tool.target_department || 'Geral'
    };

    const { data, error } = await supabase
      .from('tools')
      .insert([dbPayload])
      .select();

    if (error) throw error;
    return mapToolFromDb(data[0]);
  },

  update: async (tool: Tool): Promise<Tool> => {
    const supabase = getSupabase();
    if (!supabase) throw new Error("Supabase não conectado");

    const dbPayload = {
      name: tool.name,
      description: tool.description,
      url: tool.url,
      icon_url: tool.iconUrl,
      category: tool.category,
      target_department: tool.target_department
    };

    const { data, error } = await supabase
      .from('tools')
      .update(dbPayload)
      .eq('id', tool.id)
      .select();

    if (error) throw error;
    return mapToolFromDb(data[0]);
  },

  delete: async (id: string): Promise<void> => {
    const supabase = getSupabase();
    if (!supabase) throw new Error("Supabase não conectado");

    const { error } = await supabase
      .from('tools')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }
};