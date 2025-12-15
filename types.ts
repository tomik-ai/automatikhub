

export interface SOP {
  id: string;
  title: string;
  category: 'HR' | 'Tech' | 'Vendas' | 'Operacional' | 'Geral';
  content: string; // For Processes, this is the "Step by Step Description"
  lastUpdated: string;
  tags: string[];
  deleted_at?: string | null;
  responsible_department?: Department;
  responsible_users?: string[]; // Array of emails
  
  // New fields for Process Management
  type: 'standard' | 'process';
  process_details?: ProcessDetails;
}

export interface ProcessDetails {
  objective: string;
  scope_includes: string;
  scope_excludes: string;
  materials: string;
  metrics: string;
  created_by?: string; // Manual text field or auto-filled
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
  externalLink?: string; // New field for direct external links (e.g. WhatsApp)
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
  OVERVIEW = 'overview',
  ONBOARDING = 'onboarding',
  JOURNEY = 'journey',
  KNOWLEDGE_BASE = 'knowledge_base',
  TOOLS = 'tools',
  UTM_GENERATOR = 'utm_generator', // Novo Item
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