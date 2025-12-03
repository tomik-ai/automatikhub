import React from 'react';
import { View, SOP, OnboardingStep } from '../types';
import { ArrowRight, Calendar, FileText, ExternalLink, MessageCircle, Target, Bot, CheckCircle } from 'lucide-react';

interface DashboardProps {
  onChangeView: (view: View) => void;
  recentSOPs: SOP[];
  pendingSteps: OnboardingStep[];
}

const Dashboard: React.FC<DashboardProps> = ({ onChangeView, recentSOPs, pendingSteps }) => {
  const incompleteSteps = pendingSteps.filter(s => !s.completed).length;
  const totalSteps = pendingSteps.length;
  const progress = totalSteps > 0 ? Math.round(((totalSteps - incompleteSteps) / totalSteps) * 100) : 0;
  const isOnboardingComplete = progress === 100;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Welcome Banner - Cyber Style */}
      <div className="relative group rounded-2xl p-px overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-cyan-500 via-violet-500 to-fuchsia-500 opacity-30 group-hover:opacity-50 transition-opacity duration-500"></div>
        <div className="relative bg-[#020617]/90 backdrop-blur-xl rounded-2xl p-8 overflow-hidden">
          {/* Grid Background Effect */}
          <div className="absolute inset-0 opacity-10 pointer-events-none" 
               style={{ backgroundImage: 'linear-gradient(#334155 1px, transparent 1px), linear-gradient(90deg, #334155 1px, transparent 1px)', backgroundSize: '40px 40px' }}>
          </div>
          
          <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold mb-2 text-white tracking-tight">
                {isOnboardingComplete ? 'Sistema Operacional Pronto.' : 'Inicializando Protocolos.'}
              </h1>
              <p className="text-slate-400 max-w-xl text-sm md:text-base leading-relaxed">
                {isOnboardingComplete 
                  ? 'Todos os módulos de onboarding foram carregados com sucesso. Acesso total liberado.' 
                  : 'Complete as etapas de verificação para liberar acesso total às ferramentas da Automatik.'}
              </p>
            </div>
            
            <button 
              onClick={() => onChangeView(isOnboardingComplete ? View.TOOLS : View.ONBOARDING)}
              className="bg-cyan-500 hover:bg-cyan-400 text-[#020617] px-6 py-3 rounded-lg font-bold shadow-[0_0_20px_rgba(6,182,212,0.3)] hover:shadow-[0_0_30px_rgba(6,182,212,0.5)] transition-all flex items-center gap-2 uppercase tracking-wide text-xs focus:outline-none focus:ring-0"
            >
              {isOnboardingComplete ? 'Acessar Ferramentas' : 'Continuar Setup'}
              <ArrowRight size={16} />
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Onboarding Progress Card */}
        <div className="bg-[#0B1120] rounded-xl border border-white/5 p-6 backdrop-blur-sm relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 to-transparent"></div>
          
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-bold text-sm text-slate-200 uppercase tracking-widest flex items-center gap-2">
              <Calendar size={16} className="text-indigo-500" />
              ONBOARDING
            </h2>
            <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded border ${isOnboardingComplete ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20'}`}>
              {progress}%
            </span>
          </div>
          
          <div className="w-full bg-slate-800/50 rounded-full h-1.5 mb-6 overflow-hidden">
            <div 
              className={`h-full shadow-[0_0_10px_currentColor] transition-all duration-1000 ease-out ${isOnboardingComplete ? 'bg-green-500 text-green-500' : 'bg-indigo-500 text-indigo-500'}`} 
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          
          {isOnboardingComplete ? (
            <div className="text-center py-6 bg-green-500/5 rounded-lg border border-green-500/10 border-dashed">
              <CheckCircle size={32} className="text-green-500 mx-auto mb-2 opacity-80" />
              <p className="text-xs text-green-400 font-bold uppercase tracking-wide">Checklist Completo</p>
            </div>
          ) : (
            <ul className="space-y-3">
              {pendingSteps.filter(s => !s.completed).map(step => (
                <li key={step.id} className="flex items-start gap-3 text-sm text-slate-400 group cursor-default">
                  <div className="min-w-[8px] h-2 mt-1.5 rounded-full bg-slate-700 group-hover:bg-indigo-500 transition-colors shadow-[0_0_5px_rgba(99,102,241,0)] group-hover:shadow-[0_0_8px_rgba(99,102,241,0.5)]" />
                  <span className="group-hover:text-slate-200 transition-colors font-medium text-xs leading-relaxed">{step.title}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Recent Updates / SOPs */}
        <div className="bg-[#0B1120] rounded-xl border border-white/5 p-6 backdrop-blur-sm lg:col-span-2 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-full h-1 bg-gradient-to-l from-cyan-500 to-transparent"></div>
          
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-bold text-sm text-slate-200 uppercase tracking-widest flex items-center gap-2">
              <FileText size={16} className="text-cyan-500" />
              Novos Arquivos
            </h2>
            <button 
              onClick={() => onChangeView(View.KNOWLEDGE_BASE)}
              className="text-[10px] font-bold uppercase tracking-wider text-cyan-500 hover:text-cyan-400 border border-cyan-500/20 hover:bg-cyan-500/10 px-3 py-1 rounded transition-all focus:outline-none focus:ring-0"
            >
              Acessar Database
            </button>
          </div>
          
          <div className="grid gap-4 sm:grid-cols-2">
            {recentSOPs.slice(0, 4).map(sop => (
              <div 
                key={sop.id} 
                className="group p-4 rounded-lg bg-white/5 border border-white/5 hover:border-cyan-500/30 hover:bg-white/10 transition-all cursor-pointer relative overflow-hidden focus:outline-none focus:ring-0"
                onClick={() => onChangeView(View.KNOWLEDGE_BASE)}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                
                <div className="flex justify-between items-start mb-2 relative z-10">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider group-hover:text-cyan-400 transition-colors">
                    [{sop.category}]
                  </span>
                  <ExternalLink size={12} className="text-slate-600 group-hover:text-cyan-400 transition-colors" />
                </div>
                <h3 className="font-semibold text-slate-200 text-sm mb-1 group-hover:text-white truncate relative z-10">{sop.title}</h3>
                <p className="text-[10px] text-slate-500 font-mono relative z-10">
                  UPDATED: {new Date(sop.lastUpdated).toLocaleDateString('pt-BR')}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
         <div 
           onClick={() => window.open('https://chat.whatsapp.com/I8s0tklYWFmEug3xtu97AS', '_blank')}
           className="bg-[#0B1120] p-4 rounded-xl border border-white/5 hover:border-green-500/50 transition-all cursor-pointer flex items-center gap-4 group backdrop-blur-sm relative overflow-hidden focus:outline-none"
         >
           <div className="absolute inset-0 bg-green-500/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
           <div className="w-10 h-10 rounded-lg bg-green-500/10 border border-green-500/20 flex items-center justify-center text-green-500 shadow-[0_0_10px_rgba(34,197,94,0.1)] group-hover:shadow-[0_0_15px_rgba(34,197,94,0.3)] transition-all">
             <MessageCircle size={20} />
           </div>
           <div className="relative z-10">
             <p className="font-bold text-sm text-slate-200 group-hover:text-white tracking-wide">WHATSAPP</p>
             <p className="text-[10px] text-slate-500 uppercase tracking-wider">Comunicação</p>
           </div>
         </div>
         
         <div 
           onClick={() => window.open('https://app.clickup.com/9013437304/home', '_blank')}
           className="bg-[#0B1120] p-4 rounded-xl border border-white/5 hover:border-violet-500/50 transition-all cursor-pointer flex items-center gap-4 group backdrop-blur-sm relative overflow-hidden focus:outline-none"
         >
           <div className="absolute inset-0 bg-violet-500/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
           <div className="w-10 h-10 rounded-lg bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-500 shadow-[0_0_10px_rgba(139,92,246,0.1)] group-hover:shadow-[0_0_15px_rgba(139,92,246,0.3)] transition-all">
             <Target size={20} />
           </div>
           <div className="relative z-10">
             <p className="font-bold text-sm text-slate-200 group-hover:text-white tracking-wide">CLICKUP</p>
             <p className="text-[10px] text-slate-500 uppercase tracking-wider">Gestão</p>
           </div>
         </div>
         
         <div 
           onClick={() => onChangeView(View.AI_ASSISTANT)}
           className="bg-[#0B1120] p-4 rounded-xl border border-white/5 hover:border-cyan-500/50 transition-all cursor-pointer flex items-center gap-4 md:col-span-2 group backdrop-blur-sm relative overflow-hidden focus:outline-none"
         >
           <div className="absolute inset-0 bg-cyan-500/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
           <div className="w-10 h-10 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.1)] group-hover:shadow-[0_0_15px_rgba(6,182,212,0.3)] transition-all">
             <Bot size={20} />
           </div>
           <div className="relative z-10">
             <p className="font-bold text-sm text-slate-200 group-hover:text-white tracking-wide">AUTOMATIK AI</p>
             <p className="text-[10px] text-slate-500 uppercase tracking-wider">Assistente Inteligente</p>
           </div>
         </div>
      </div>
    </div>
  );
};

export default Dashboard;