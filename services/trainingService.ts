import { getSupabase } from './supabaseClient';
import { Training } from '../types';
import { MOCK_TRAININGS } from '../constants';

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

    return data.map((row: any) => ({
      id: row.id,
      title: row.title,
      description: row.description,
      videoUrl: row.videoUrl || row.video_url,
      thumbnailUrl: row.thumbnailUrl || row.thumbnail_url || 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=800&q=80',
      category: row.category,
      duration: row.duration,
      instructor: row.instructor
    })) as Training[];
  },

  create: async (training: Omit<Training, 'id'>): Promise<Training> => {
    const supabase = getSupabase();
    if (!supabase) throw new Error("Supabase não conectado");

    const { data, error } = await supabase
      .from('trainings')
      .insert([{
        title: training.title,
        description: training.description,
        videoUrl: training.videoUrl,
        thumbnailUrl: training.thumbnailUrl,
        category: training.category,
        duration: training.duration,
        instructor: training.instructor
      }])
      .select()
      .single();

    if (error) {
      console.error('Erro ao criar treinamento:', JSON.stringify(error, null, 2));
      throw error;
    }
    
    const row = data;
    return {
      ...training,
      id: row.id,
    } as Training;
  },

  update: async (training: Training): Promise<Training> => {
    const supabase = getSupabase();
    if (!supabase) throw new Error("Supabase não conectado");

    const { data, error } = await supabase
      .from('trainings')
      .update({
        title: training.title,
        description: training.description,
        videoUrl: training.videoUrl,
        thumbnailUrl: training.thumbnailUrl,
        category: training.category,
        duration: training.duration,
        instructor: training.instructor
      })
      .eq('id', training.id)
      .select()
      .single();

    if (error) {
      console.error('Erro ao atualizar treinamento:', JSON.stringify(error, null, 2));
      throw error;
    }
    
    const row = data;
    return {
      ...training,
      thumbnailUrl: row.thumbnailUrl || row.thumbnail_url,
      videoUrl: row.videoUrl || row.video_url
    } as Training;
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