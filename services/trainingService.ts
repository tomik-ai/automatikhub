import { getSupabase } from './supabaseClient';
import { Training } from '../types';
import { MOCK_TRAININGS } from '../constants';

const mapTrainingFromDb = (row: any): Training => ({
  id: row.id,
  title: row.title,
  description: row.description,
  // Tenta ler snake_case (banco) ou camelCase (legado/memória)
  videoUrl: row.video_url || row.videoUrl,
  thumbnailUrl: row.thumbnail_url || row.thumbnailUrl || 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=800&q=80',
  category: row.category || 'Geral',
  duration: row.duration || 'N/A',
  instructor: row.instructor || 'Automatik Team'
});

export const TrainingService = {
  getAll: async (): Promise<Training[]> => {
    const supabase = getSupabase();
    if (!supabase) {
        console.warn("Supabase não conectado. Retornando treinamentos de exemplo.");
        return MOCK_TRAININGS;
    }

    const { data, error } = await supabase
      .from('trainings')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Erro ao buscar treinamentos:', JSON.stringify(error, null, 2));
      return MOCK_TRAININGS;
    }

    if (!data || data.length === 0) {
        return [];
    }

    return data.map(mapTrainingFromDb);
  },

  create: async (training: Omit<Training, 'id'>): Promise<Training> => {
    const supabase = getSupabase();
    if (!supabase) throw new Error("Supabase não conectado");

    // Mapeando explicitamente para snake_case para o Postgres
    const dbPayload = {
      title: training.title,
      description: training.description,
      video_url: training.videoUrl,
      thumbnail_url: training.thumbnailUrl,
      category: training.category,
      duration: training.duration,
      instructor: training.instructor
    };

    // Usamos select() simples em vez de single() para evitar crash se a policy falhar silenciosamente
    const { data, error } = await supabase
      .from('trainings')
      .insert([dbPayload])
      .select();

    if (error) {
      console.error('Erro ao criar treinamento:', JSON.stringify(error, null, 2));
      throw error;
    }

    if (!data || data.length === 0) {
       throw new Error("Erro desconhecido ao criar: nenhum dado retornado.");
    }
    
    return mapTrainingFromDb(data[0]);
  },

  update: async (training: Training): Promise<Training> => {
    const supabase = getSupabase();
    if (!supabase) throw new Error("Supabase não conectado");

    const dbPayload = {
      title: training.title,
      description: training.description,
      video_url: training.videoUrl,
      thumbnail_url: training.thumbnailUrl,
      category: training.category,
      duration: training.duration,
      instructor: training.instructor
    };

    // CORREÇÃO PGRST116: Removido .single()
    const { data, error } = await supabase
      .from('trainings')
      .update(dbPayload)
      .eq('id', training.id)
      .select();

    if (error) {
      console.error('Erro ao atualizar treinamento:', JSON.stringify(error, null, 2));
      throw error;
    }
    
    // Verificação manual se houve retorno
    if (!data || data.length === 0) {
      throw new Error("Treinamento não encontrado ou permissão negada pelo Banco de Dados. Verifique as Policies (RLS) no Supabase.");
    }
    
    return mapTrainingFromDb(data[0]);
  },

  delete: async (id: string): Promise<void> => {
    const supabase = getSupabase();
    if (!supabase) throw new Error("Supabase não conectado");

    const { error } = await supabase
      .from('trainings')
      .delete()
      .eq('id', id);

    if (error) {
      console.error("Erro ao deletar treinamento:", JSON.stringify(error, null, 2));
      throw error;
    }
  }
};