import { SOP, Tool, OnboardingStep, Department } from './types';

export const COMPANY_NAME = "AutomatikLabs";
export const APP_NAME = "AutomatikLabs";

// TODO: Substitua esta URL pelo link direto da sua imagem de logo (PNG/JPG/SVG)
export const LOGO_URL = "https://ui-avatars.com/api/?name=A+L&background=6366f1&color=fff&size=128&rounded=true&bold=true&font-size=0.33";

export const DEPARTMENTS: Department[] = [
  'Sucesso do Cliente',
  'Comercial',
  'Marketing',
  'Suporte',
  'Tech',
  'Operacional',
  'Geral'
];

export const ALLOWED_EMAILS = [
  'gabriel.amaral@tomik.ai',
  'alexlemos@automatiklabs.com.br',
  'apolo@automatiklabs.com.br',
  'carine@automatiklabs.com.br',
  'eduarda@automatiklabs.com.br',
  'gloria@automatiklabs.com.br',
  'vitor@vitormontenegro.com.br',
  'gabrielacampos@automatiklabs.com.br',
  'luizguerra@automatiklabs.com.br',
  'pedrolucas@automatiklabs.com.br',
  'rafael@automatiklabs.com.br',
  'viniciussantos@automatiklabs.com.br'
];

export const MOCK_SOPS: SOP[] = [
  {
    id: '1',
    title: 'Cultura e Valores',
    category: 'Geral',
    content: 'Na Automatik, valorizamos a autonomia com responsabilidade. Somos Remote-First, o que significa que você pode trabalhar de onde quiser, desde que tenha uma conexão estável e cumpra seus compromissos. A comunicação assíncrona é prioridade.',
    lastUpdated: '2023-10-15',
    tags: ['cultura', 'remoto', 'valores']
  },
  {
    id: '2',
    title: 'Política de Reembolso',
    category: 'HR',
    content: 'Reembolsos devem ser solicitados até o dia 20 de cada mês através do sistema Expensify. Despesas acima de R$ 500,00 precisam de aprovação prévia do gestor direto. O reembolso cai na conta salário junto com o pagamento mensal.',
    lastUpdated: '2024-01-10',
    tags: ['financeiro', 'reembolso', 'benefícios']
  },
  {
    id: '3',
    title: 'Setup de Ambiente de Desenvolvimento',
    category: 'Tech',
    content: 'Todos os engenheiros devem utilizar MacBooks fornecidos pela empresa. O setup inicial inclui: VS Code, Docker, Node.js LTS e acesso aos repositórios da organização. O VPN é obrigatório para acesso aos bancos de dados de produção.',
    lastUpdated: '2024-02-01',
    tags: ['dev', 'setup', 'engenharia']
  },
  {
    id: '4',
    title: 'Processo de Vendas Outbound',
    category: 'Vendas',
    content: 'O processo de vendas segue o fluxo: Prospecção (LinkedIn Sales Nav) -> Conexão (Email/Cold Call) -> Discovery -> Demo -> Proposta. Utilize o CRM HubSpot para registrar todas as interações.',
    lastUpdated: '2023-11-20',
    tags: ['vendas', 'crm', 'processo']
  },
  {
    id: '5',
    title: 'Solicitação de Férias',
    category: 'HR',
    content: 'As férias devem ser solicitadas com no mínimo 30 dias de antecedência via plataforma de RH. O período mínimo é de 10 dias. Converse com seu time antes para alinhar a cobertura durante sua ausência.',
    lastUpdated: '2024-03-05',
    tags: ['rh', 'férias', 'descanso']
  }
];

export const MOCK_TOOLS: Tool[] = [
  { 
    id: '1', 
    name: 'WhatsApp', 
    description: 'Canal Geral da empresa e comunicação rápida.', 
    url: 'https://chat.whatsapp.com/I8s0tklYWFmEug3xtu97AS', 
    iconUrl: '📱', 
    category: 'Comunicação' 
  },
  { 
    id: '2', 
    name: 'ClickUp', 
    description: 'Gestão de projetos, tarefas e sprints.', 
    url: 'https://app.clickup.com/9013437304/home', 
    iconUrl: '🎯', 
    category: 'Produtividade' 
  },
  { 
    id: '5', 
    name: 'Figma', 
    description: 'Design de interfaces e protótipos.', 
    url: '#', 
    iconUrl: '🎨', 
    category: 'Design' 
  },
  { 
    id: '6', 
    name: 'Google Meet', 
    description: 'Videochamadas e reuniões.', 
    url: '#', 
    iconUrl: '🎥', 
    category: 'Comunicação' 
  },
];

export const INITIAL_ONBOARDING_STEPS: OnboardingStep[] = [
  { id: '1', title: 'Configurar E-mail Corporativo', description: 'Acesse o Gmail com as credenciais enviadas pelo RH.', completed: true },
  { id: '2', title: 'Entrar no Grupo do WhatsApp', description: 'Acesse o link na aba de Ferramentas para entrar no grupo geral.', completed: false },
  { id: '3', title: 'Ler a Cultura e Valores', description: 'Leia o SOP "Cultura e Valores" na base de conhecimento.', completed: false, link: 'knowledge_base' },
  { id: '4', title: 'Configurar Assinatura de E-mail', description: 'Use o gerador de assinaturas da Automatik.', completed: false },
  { id: '5', title: 'Primeira Reunião 1:1', description: 'Agende uma conversa inicial com seu gestor.', completed: false },
];