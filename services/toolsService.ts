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
      console.error('Erro ao buscar ferramentas:', JSON.stringify(error, null, 2));
      return [];
    }

    // Map DB snake_case to CamelCase if necessary
    return data.map((row: any) => ({
      id: row.id,
      name: row.name,
      description: row.description,
      url: row.url,
      // Support both camelCase and snake_case from DB
      iconUrl: row.iconUrl || row.icon_url || '🔗', 
      category: row.category,
      // Support both camelCase and snake_case
      target_department: row.target_department || row.targetDepartment || 'Geral'
    })) as Tool[];
  },

  create: async (tool: Omit<Tool, 'id'>): Promise<Tool> => {
    const supabase = getSupabase();
    if (!supabase) throw new Error("Supabase não conectado");

    // Prepare payload using camelCase keys as per previous version
    const { data, error } = await supabase
      .from('tools')
      .insert([{
        name: tool.name,
        description: tool.description,
        url: tool.url,
        iconUrl: tool.iconUrl,
        category: tool.category,
        target_department: tool.target_department || 'Geral'
      }])
      .select()
      .single();

    if (error) {
      console.error('Erro ao criar ferramenta:', JSON.stringify(error, null, 2));
      throw error;
    }
    
    // Map return safely
    const row = data;
    return {
      ...tool,
      id: row.id,
      iconUrl: row.iconUrl || row.icon_url || tool.iconUrl,
      target_department: row.target_department || row.targetDepartment || tool.target_department
    } as Tool;
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
        category: tool.category,
        target_department: tool.target_department
      })
      .eq('id', tool.id)
      .select()
      .single();

    if (error) {
      console.error('Erro ao atualizar ferramenta:', JSON.stringify(error, null, 2));
      throw error;
    }
    
    // Map return safely
    const row = data;
    return {
      ...tool,
      iconUrl: row.iconUrl || row.icon_url || tool.iconUrl,
      target_department: row.target_department || row.targetDepartment || tool.target_department
    } as Tool;
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
        throw new Error("Permissão negada. Verifique as Policies (RLS) no Supabase para a tabela 'tools'.");
      }
      throw error;
    }
  }
};