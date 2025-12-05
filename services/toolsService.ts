import { getSupabase } from './supabaseClient';
import { Tool } from '../types';
import { MOCK_TOOLS } from '../constants';

// Helper function to map DB row to Tool type
const mapToolFromDb = (row: any): Tool => ({
  id: row.id,
  name: row.name,
  description: row.description,
  url: row.url,
  // Support both camelCase (legacy) and snake_case (standard) from DB
  iconUrl: row.icon_url || row.iconUrl || '🔗', 
  category: row.category,
  // Support both camelCase and snake_case
  target_department: row.target_department || row.targetDepartment || 'Geral'
});

export const ToolsService = {
  getAll: async (): Promise<Tool[]> => {
    const supabase = getSupabase();
    if (!supabase) {
        console.warn("Supabase não conectado. Retornando ferramentas de exemplo.");
        return MOCK_TOOLS;
    }

    const { data, error } = await supabase
      .from('tools')
      .select('*')
      .order('name', { ascending: true });

    if (error) {
      console.error('Erro ao buscar ferramentas (usando fallback):', JSON.stringify(error, null, 2));
      return MOCK_TOOLS;
    }

    if (!data || data.length === 0) {
        return [];
    }

    return data.map(mapToolFromDb);
  },

  create: async (tool: Omit<Tool, 'id'>): Promise<Tool> => {
    const supabase = getSupabase();
    if (!supabase) throw new Error("Supabase não conectado");

    // Explicitly map to snake_case for the database
    const dbPayload = {
      name: tool.name,
      description: tool.description,
      url: tool.url,
      icon_url: tool.iconUrl, // Ensure snake_case
      category: tool.category,
      target_department: tool.target_department || 'Geral' // Ensure snake_case
    };

    const { data, error } = await supabase
      .from('tools')
      .insert([dbPayload])
      .select();

    if (error) {
      console.error('Erro ao criar ferramenta:', JSON.stringify(error, null, 2));
      throw error;
    }
    
    if (!data || data.length === 0) {
       throw new Error("Erro desconhecido ao criar ferramenta.");
    }

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

    // Removed .single() to avoid PGRST116 if RLS policies are strict or row count varies
    const { data, error } = await supabase
      .from('tools')
      .update(dbPayload)
      .eq('id', tool.id)
      .select();

    if (error) {
      console.error('Erro ao atualizar ferramenta:', JSON.stringify(error, null, 2));
      throw error;
    }
    
    if (!data || data.length === 0) {
      throw new Error("Ferramenta não encontrada ou erro de permissão.");
    }
    
    return mapToolFromDb(data[0]);
  },

  delete: async (id: string): Promise<void> => {
    const supabase = getSupabase();
    if (!supabase) throw new Error("Supabase não conectado");

    const { error } = await supabase
      .from('tools')
      .delete()
      .eq('id', id);

    if (error) {
      console.error("Erro ao deletar ferramenta:", JSON.stringify(error, null, 2));
      if (error.code === '42501') {
        throw new Error("Permissão negada. Verifique as Policies (RLS) no Supabase.");
      }
      throw error;
    }
  }
};