
import { getSupabase } from './supabaseClient';
import { SOP } from '../types';
import { MOCK_SOPS } from '../constants';

const mapSopFromDb = (row: any): SOP => {
  // Helper to find a property case-insensitively or check common variants
  const lastUpdated = row.lastUpdated || row.last_updated || row.lastupdated || new Date().toISOString();
  const deletedAt = row.deleted_at || row.deletedAt || row.deleted_date || null;
  
  return {
    id: row.id,
    title: row.title,
    category: row.category,
    content: row.content,
    tags: Array.isArray(row.tags) ? row.tags : [],
    lastUpdated: lastUpdated,
    deleted_at: deletedAt,
    responsible_department: row.responsible_department || undefined,
    responsible_users: Array.isArray(row.responsible_users) ? row.responsible_users : [],
    type: row.type || 'standard',
    process_details: row.process_details || undefined
  };
};

export const SopService = {
  
  getAll: async (): Promise<SOP[]> => {
    const supabase = getSupabase();
    if (!supabase) {
        console.warn("Supabase não conectado. Retornando dados de exemplo.");
        return MOCK_SOPS;
    }

    const { data, error } = await supabase
      .from('sops')
      .select('*');
      
    if (error) {
      console.error("Erro ao buscar SOPs (usando fallback):", JSON.stringify(error, null, 2));
      return MOCK_SOPS;
    }
    
    return (data || [])
      .map(mapSopFromDb)
      .filter(sop => !sop.deleted_at)
      .sort((a, b) => new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime());
  },

  getDeleted: async (): Promise<SOP[]> => {
    const supabase = getSupabase();
    if (!supabase) return [];

    const { data, error } = await supabase
      .from('sops')
      .select('*');

    if (error) {
      console.error("Erro ao buscar SOPs deletados:", JSON.stringify(error, null, 2));
      return [];
    }

    return (data || [])
      .map(mapSopFromDb)
      .filter(sop => !!sop.deleted_at)
      .sort((a, b) => {
        const dateA = a.deleted_at ? new Date(a.deleted_at).getTime() : 0;
        const dateB = b.deleted_at ? new Date(b.deleted_at).getTime() : 0;
        return dateB - dateA;
      });
  },

  create: async (sop: Omit<SOP, 'id'>): Promise<SOP> => {
    const supabase = getSupabase();
    if (!supabase) throw new Error("Supabase não conectado");

    const dbPayload = {
      title: sop.title,
      category: sop.category,
      content: sop.content,
      tags: sop.tags,
      lastUpdated: sop.lastUpdated,
      responsible_department: sop.responsible_department,
      responsible_users: sop.responsible_users,
      type: sop.type,
      process_details: sop.process_details
    };

    const { data, error } = await supabase
      .from('sops')
      .insert([dbPayload])
      .select()
      .single();

    if (error) {
      console.error("Erro ao criar SOP:", JSON.stringify(error, null, 2));
      throw error;
    }
    return mapSopFromDb(data);
  },

  update: async (sop: SOP): Promise<SOP> => {
    const supabase = getSupabase();
    if (!supabase) throw new Error("Supabase não conectado");

    const dbPayload = {
      title: sop.title,
      category: sop.category,
      content: sop.content,
      tags: sop.tags,
      lastUpdated: new Date().toISOString(),
      responsible_department: sop.responsible_department,
      responsible_users: sop.responsible_users,
      type: sop.type,
      process_details: sop.process_details
    };

    const { data, error } = await supabase
      .from('sops')
      .update(dbPayload)
      .eq('id', sop.id)
      .select()
      .single();

    if (error) {
      console.error("Erro ao atualizar SOP:", JSON.stringify(error, null, 2));
      throw error;
    }
    return mapSopFromDb(data);
  },

  delete: async (id: string): Promise<void> => {
    const supabase = getSupabase();
    if (!supabase) throw new Error("Supabase não conectado");

    const timestamp = new Date().toISOString();

    const { error: errorSnake } = await supabase
      .from('sops')
      .update({ deleted_at: timestamp })
      .eq('id', id);
    
    if (!errorSnake) return;

    const isColumnMissing = errorSnake.message?.includes('does not exist') || 
                            errorSnake.message?.includes('Could not find') ||
                            errorSnake.code === '42703' || 
                            errorSnake.code === 'PGRST204';

    if (isColumnMissing) {
         const { error: errorCamel } = await supabase
            .from('sops')
            .update({ deletedAt: timestamp })
            .eq('id', id);
         
         if (!errorCamel) return;

         console.warn("Colunas de Lixeira (deleted_at) não encontradas. Executando exclusão permanente.");
         
         const { error: errorHard } = await supabase
            .from('sops')
            .delete()
            .eq('id', id);

         if (errorHard) {
           console.error("Erro ao deletar SOP (Hard Delete):", JSON.stringify(errorHard, null, 2));
           throw errorHard;
         }
         
    } else {
        console.error("Erro ao deletar SOP:", JSON.stringify(errorSnake, null, 2));
        throw errorSnake;
    }
  },

  restore: async (id: string): Promise<void> => {
    const supabase = getSupabase();
    if (!supabase) throw new Error("Supabase não conectado");

    let { error } = await supabase
      .from('sops')
      .update({ deleted_at: null })
      .eq('id', id);

    if (error && (error.message?.includes('does not exist') || error.code === '42703')) {
        const { error: errorCamel } = await supabase
        .from('sops')
        .update({ deletedAt: null })
        .eq('id', id);
        
        if (errorCamel) throw errorCamel;
    } else if (error) {
        throw error;
    }
  },

  permanentDelete: async (id: string): Promise<void> => {
    const supabase = getSupabase();
    if (!supabase) throw new Error("Supabase não conectado");

    const { error } = await supabase
      .from('sops')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }
};
