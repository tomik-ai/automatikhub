export interface SOP {
  id: string;
  title: string;
  category: 'HR' | 'Tech' | 'Vendas' | 'Operacional' | 'Geral';
  content: string;
  lastUpdated: string;
  tags: string[];
  deleted_at?: string | null;
  responsible_department?: Department;
  responsible_users?: string[]; // Array of emails
}

export interface Tool {
  id: string;
  name: string;
  description: string;
  url: string;
  iconUrl: string; // Using a placeholder or emoji char for simplicity
  category: 'Produtividade' | 'Dev' | 'Comunicação' | 'Design' | 'Vendas' | 'Suporte' | 'Marketing';
  target_department?: Department | 'Geral'; // Control visibility by department
}

export interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  link?: string;
}

export interface Training {
  id: string;
  title: string;
  description: string;
  videoUrl: string; // Embed URL or Link
  thumbnailUrl: string;
  category: string;
  duration: string;
  instructor?: string;
}

export enum View {
  DASHBOARD = 'dashboard',
  ONBOARDING = 'onboarding',
  KNOWLEDGE_BASE = 'knowledge_base',
  TOOLS = 'tools',
  TRAINING = 'training',
  AI_ASSISTANT = 'ai_assistant',
  ADMIN = 'admin'
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: Date;
}

export type UserRole = 'admin' | 'moderator' | 'member';

export type Department = 'Sucesso do Cliente' | 'Comercial' | 'Marketing' | 'Suporte' | 'Tech' | 'Operacional' | 'Geral';

export interface User {
  name: string;
  email: string;
  avatar?: string;
  role: UserRole;
  department?: Department;
}