import { getSupabase } from './supabaseClient';
import { OnboardingStep } from '../types';
import { INITIAL_ONBOARDING_STEPS } from '../constants';

export const OnboardingService = {
  getUserSteps: async (email: string): Promise<OnboardingStep[]> => {
    const supabase = getSupabase();
    if (!supabase) return INITIAL_ONBOARDING_STEPS;

    // Busca apenas os IDs completados no banco
    const { data, error } = await supabase
      .from('onboarding_progress')
      .select('step_id, completed')
      .eq('user_email', email)
      .eq('completed', true);

    if (error) {
      console.error("Erro ao buscar onboarding:", error);
      return INITIAL_ONBOARDING_STEPS;
    }

    const completedStepIds = data ? data.map((row: any) => row.step_id) : [];

    // Mescla com a lista estática de passos
    return INITIAL_ONBOARDING_STEPS.map(step => ({
      ...step,
      completed: completedStepIds.includes(step.id)
    }));
  },

  toggleStep: async (email: string, stepId: string, currentStatus: boolean): Promise<void> => {
    const newStatus = !currentStatus;
    const supabase = getSupabase();

    if (!supabase) throw new Error("Supabase não conectado");

    const { error } = await supabase
      .from('onboarding_progress')
      .upsert(
        { user_email: email, step_id: stepId, completed: newStatus },
        { onConflict: 'user_email, step_id' }
      );
      
    if (error) throw error;
  }
};
