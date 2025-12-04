import React, { useState } from 'react';
import { Rocket, Flag, Target, Award, CheckCircle2, ChevronDown, ChevronUp, Lock } from 'lucide-react';

interface JourneyPhase {
  id: string;
  title: string;
  duration: string;
  description: string;
  status: 'completed' | 'current' | 'locked';
  tasks: string[];
  kpis?: string[];
}

const EmployeeJourney: React.FC = () => {
  const [expandedPhase, setExpandedPhase] = useState<string | null>('phase-1');

  // Hardcoded roadmap for now - can be moved to database later
  const phases: JourneyPhase[] = [
    {
      id: 'phase-1',
      title: 'Decolagem & Cultura',
      duration: 'Semana 1',
      description: 'Imersão total na cultura Automatik, configuração de ferramentas e entendimento dos rituais básicos.',
      status: 'current',
      tasks: [
        'Configurar e-mail, Slack/Discord e acessos do ClickUp.',
        'Ler o documento "Cultura e Valores" na Base de Conhecimento.',
        'Agendar reuniões de 1:1 com o gestor imediato e pares.',
        'Participar da reunião semanal de All-Hands (se houver).'
      ]
    },
    {
      id: 'phase-2',
      title: 'Processos & Ferramentas',
      duration: 'Semanas 2-3',
      description: 'Domínio das ferramentas operacionais e entendimento profundo dos fluxos de trabalho do seu setor.',
      status: 'locked',
      tasks: [
        'Completar os treinamentos em vídeo obrigatórios no Hub.',
        'Realizar shadow (acompanhamento) em 3 tarefas de colegas experientes.',
        'Executar a primeira tarefa simples supervisionada.',
        'Configurar seu próprio dashboard no ClickUp.'
      ],
      kpis: ['100% dos Treinamentos Assistidos', '1ª Entrega realizada']
    },
    {
      id: 'phase-3',
      title: 'Execução Assistida',
      duration: 'Semanas 4-6',
      description: 'Começar a operar com autonomia parcial, entregando resultados mensuráveis e buscando feedback constante.',
      status: 'locked',
      tasks: [
        'Assumir responsabilidade por um micro-projeto ou OKR trimestral.',
        'Participar ativamente das dailies/sprints sem necessidade de briefing detalhado.',
        'Solicitar feedback formal de 30 dias para o gestor.'
      ],
      kpis: ['NPS Interno > 9', 'Cumprimento de prazos > 90%']
    },
    {
      id: 'phase-4',
      title: 'Autonomia & Ramp-up Total',
      duration: 'Mês 2 (Dia 45-60)',
      description: 'Atingir a performance esperada de um colaborador pleno, propondo melhorias e operando sozinho.',
      status: 'locked',
      tasks: [
        'Apresentar uma proposta de melhoria de processo.',
        'Executar tarefas de complexidade média/alta sem supervisão direta.',
        'Revisão de performance de 60 dias (Ramp-up Check).'
      ],
      kpis: ['Atingimento de meta do setor', 'Autonomia validada']
    }
  ];

  const togglePhase = (id: string) => {
    if (expandedPhase === id) {
      setExpandedPhase(null);
    } else {
      setExpandedPhase(id);
    }
  };

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'completed': return 'bg-green-500 text-white border-green-500 shadow-[0_0_15px_rgba(34,197,94,0.4)]';
      case 'current': return 'bg-cyan-500 text-[#020617] border-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.4)]';
      default: return 'bg-slate-800 text-slate-500 border-slate-700';
    }
  };

  const getLineColor = (index: number) => {
    // Logic to color the line based on if the NEXT phase is unlocked/current
    if (index === 0) return 'bg-cyan-500'; // First line active
    return 'bg-slate-800';
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-5xl mx-auto pb-12">
      <div className="mb-10 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-cyan-500 to-indigo-600 mb-4 shadow-[0_0_30px_rgba(6,182,212,0.3)] border border-white/20">
          <Rocket size={32} className="text-white" />
        </div>
        <h1 className="text-4xl font-bold text-white mb-3">Jornada do Colaborador</h1>
        <p className="text-slate-400 max-w-2xl mx-auto text-lg leading-relaxed">
          Seu plano de voo para atingir performance máxima em <span className="text-cyan-400 font-bold">60 dias</span>. 
          Siga a trilha para desbloquear sua autonomia.
        </p>
      </div>

      <div className="relative">
        {/* Vertical Line Container */}
        <div className="absolute left-[28px] md:left-1/2 top-0 bottom-0 w-1 bg-slate-800/50 -translate-x-1/2 rounded-full hidden md:block"></div>
        <div className="absolute left-[28px] top-0 bottom-0 w-1 bg-slate-800/50 -translate-x-1/2 rounded-full md:hidden"></div>

        <div className="space-y-12">
          {phases.map((phase, index) => {
            const isLeft = index % 2 === 0;
            const isLocked = phase.status === 'locked';

            return (
              <div key={phase.id} className={`relative flex flex-col md:flex-row items-start ${isLeft ? 'md:flex-row-reverse' : ''} gap-8 md:gap-0 group`}>
                
                {/* Timeline Dot & Icon */}
                <div className="absolute left-[28px] md:left-1/2 -translate-x-1/2 top-0 z-10 flex flex-col items-center">
                   <div className={`w-14 h-14 rounded-full border-4 flex items-center justify-center transition-all duration-500 ${getStatusColor(phase.status)}`}>
                      {phase.status === 'locked' ? <Lock size={20} /> : phase.status === 'completed' ? <CheckCircle2 size={24} /> : <Flag size={24} />}
                   </div>
                   {/* Active Line Segment */}
                   {!isLocked && index < phases.length - 1 && (
                      <div className="w-1 h-full bg-cyan-500/50 absolute top-14 left-1/2 -translate-x-1/2 shadow-[0_0_10px_rgba(6,182,212,0.3)]"></div>
                   )}
                </div>

                {/* Content Spacer for Desktop */}
                <div className="hidden md:block w-1/2"></div>

                {/* Content Card */}
                <div className={`w-full md:w-1/2 pl-16 md:pl-0 ${isLeft ? 'md:pr-12' : 'md:pl-12'}`}>
                  <div 
                    onClick={() => !isLocked && togglePhase(phase.id)}
                    className={`
                      relative bg-[#0B1120] border rounded-2xl p-6 transition-all duration-300 cursor-pointer overflow-hidden
                      ${phase.status === 'current' ? 'border-cyan-500/50 shadow-[0_0_20px_rgba(6,182,212,0.1)]' : 'border-white/5 hover:border-white/10'}
                      ${isLocked ? 'opacity-70 cursor-not-allowed grayscale-[0.5]' : ''}
                    `}
                  >
                    {/* Header */}
                    <div className="flex justify-between items-start mb-2 relative z-10">
                        <div>
                             <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded mb-2 inline-block ${phase.status === 'current' ? 'bg-cyan-900/30 text-cyan-400' : 'bg-slate-800 text-slate-500'}`}>
                                {phase.duration}
                             </span>
                             <h3 className={`text-xl font-bold ${phase.status === 'current' ? 'text-white' : 'text-slate-300'}`}>{phase.title}</h3>
                        </div>
                        {!isLocked && (
                             <div className="text-slate-500">
                                 {expandedPhase === phase.id ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                             </div>
                        )}
                    </div>
                    
                    <p className="text-sm text-slate-400 leading-relaxed mb-4">{phase.description}</p>

                    {/* Progress Bar (Visual) */}
                    {!isLocked && (
                        <div className="w-full bg-slate-800 h-1.5 rounded-full mb-4 overflow-hidden">
                            <div className={`h-full ${phase.status === 'completed' ? 'w-full bg-green-500' : phase.status === 'current' ? 'w-1/3 bg-cyan-500' : 'w-0'}`}></div>
                        </div>
                    )}

                    {/* Expandable Content */}
                    <div className={`space-y-4 overflow-hidden transition-all duration-500 ${expandedPhase === phase.id && !isLocked ? 'max-h-[500px] opacity-100 pt-4 border-t border-white/5' : 'max-h-0 opacity-0'}`}>
                        
                        <div>
                            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-2">
                                <Target size={14} className="text-indigo-400"/> Objetivos da Fase
                            </h4>
                            <ul className="space-y-2">
                                {phase.tasks.map((task, i) => (
                                    <li key={i} className="flex items-start gap-3 text-sm text-slate-400">
                                        <div className="w-4 h-4 rounded border border-slate-600 flex items-center justify-center shrink-0 mt-0.5"></div>
                                        <span>{task}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {phase.kpis && (
                            <div className="bg-slate-900/50 p-3 rounded-lg border border-white/5">
                                <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-2">
                                    <Award size={12} className="text-amber-400"/> KPIs de Sucesso
                                </h4>
                                <div className="flex flex-wrap gap-2">
                                    {phase.kpis.map((kpi, i) => (
                                        <span key={i} className="text-xs text-indigo-300 bg-indigo-900/20 px-2 py-1 rounded border border-indigo-500/20">
                                            {kpi}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}

                    </div>
                  </div>
                </div>

              </div>
            );
          })}
        </div>
        
        {/* End Mark */}
        <div className="absolute left-[28px] md:left-1/2 -translate-x-1/2 bottom-[-40px] flex flex-col items-center">
             <div className="w-2 h-2 rounded-full bg-slate-700 mb-1"></div>
             <div className="w-1.5 h-1.5 rounded-full bg-slate-800 mb-1"></div>
             <div className="w-1 h-1 rounded-full bg-slate-900"></div>
        </div>

      </div>
    </div>
  );
};

export default EmployeeJourney;
