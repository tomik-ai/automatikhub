import { getSupabase } from './supabaseClient';
import { SOP, ProcessDetails } from '../types';
import { MOCK_SOPS } from '../constants';

const mapSopFromDb = (row: any): SOP => {
  return {
    id: row.id,
    title: row.title,
    category: row.category as any,
    content: row.content,
    tags: Array.isArray(row.tags) ? row.tags : [],
    lastUpdated: row.last_updated || row.lastUpdated || new Date().toISOString(),
    deleted_at: row.deleted_at || null,
    responsible_department: row.responsible_department,
    responsible_users: Array.isArray(row.responsible_users) ? row.responsible_users : [],
    type: (row.type as 'standard' | 'process') || 'standard',
    process_details: row.process_details as ProcessDetails
  };
};

export const SopService = {
  getAll: async (): Promise<SOP[]> => {
    const sb = getSupabase();
    if (!sb) return MOCK_SOPS;

    try {
      const { data, error } = await sb.from('sops').select('*').is('deleted_at', null);
      if (error) throw error;
      return (data || []).map(mapSopFromDb);
    } catch (err) {
      console.warn("Erro ao buscar SOPs, usando fallback:", err);
      return MOCK_SOPS;
    }
  },

  getDeleted: async (): Promise<SOP[]> => {
    const sb = getSupabase();
    if (!sb) return [];
    try {
      const { data, error } = await sb.from('sops').select('*').not('deleted_at', 'is', null);
      if (error) throw error;
      return (data || []).map(mapSopFromDb);
    } catch {
      return [];
    }
  },

  create: async (sop: Omit<SOP, 'id'>) => {
    const sb = getSupabase();
    if (!sb) throw new Error("Offline");
    
    const dbPayload = {
      title: sop.title,
      category: sop.category,
      content: sop.content,
      tags: sop.tags,
      responsible_department: sop.responsible_department,
      responsible_users: sop.responsible_users,
      type: sop.type,
      process_details: sop.process_details
    };

    const { data, error } = await sb.from('sops').insert([dbPayload]).select().single();
    if (error) throw error;
    return mapSopFromDb(data);
  },

  update: async (sop: SOP) => {
    const sb = getSupabase();
    if (!sb) throw new Error("Offline");

    const dbPayload = {
      title: sop.title,
      category: sop.category,
      content: sop.content,
      tags: sop.tags,
      responsible_department: sop.responsible_department,
      responsible_users: sop.responsible_users,
      type: sop.type,
      process_details: sop.process_details,
      last_updated: new Date().toISOString()
    };

    const { data, error } = await sb.from('sops').update(dbPayload).eq('id', sop.id).select().single();
    if (error) throw error;
    return mapSopFromDb(data);
  },

  delete: async (id: string) => {
    const sb = getSupabase();
    if (!sb) throw new Error("Offline");
    await sb.from('sops').update({ deleted_at: new Date().toISOString() }).eq('id', id);
  },

  restore: async (id: string) => {
    const sb = getSupabase();
    if (!sb) throw new Error("Offline");
    await sb.from('sops').update({ deleted_at: null }).eq('id', id);
  },

  permanentDelete: async (id: string) => {
    const sb = getSupabase();
    if (!sb) throw new Error("Offline");
    await sb.from('sops').delete().eq('id', id);
  }
};