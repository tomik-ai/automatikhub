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
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-indigo-600 to-cyan-600 rounded-2xl p-6 md:p-8 text-white shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
        
        {isOnboardingComplete ? (
          <>
            <h1 className="text-2xl md:text-3xl font-bold mb-2 relative z-10">Onboarding Concluído! 🚀</h1>
            <p className="text-indigo-100 max-w-2xl mb-6 relative z-10">
              Parabéns! Você completou todas as etapas iniciais com sucesso. 
              Agora você está pronto para explorar nossas ferramentas, documentos e mergulhar na cultura da Automatik.
            </p>
            <button 
              onClick={() => onChangeView(View.TOOLS)}
              className="relative z-10 bg-white text-indigo-600 px-5 py-2.5 rounded-lg font-semibold shadow-sm hover:bg-indigo-50 transition-colors inline-flex items-center gap-2"
            >
              Explorar Ferramentas
              <ArrowRight size={18} />
            </button>
          </>
        ) : (
          <>
            <h1 className="text-2xl md:text-3xl font-bold mb-2 relative z-10">Olá, bem-vindo à Automatik! 👋</h1>
            <p className="text-indigo-100 max-w-2xl mb-6 relative z-10">
              Estamos felizes em ter você no time. Este é o seu centro de comando. 
              Aqui você encontra tudo para começar sua jornada com o pé direito.
            </p>
            <button 
              onClick={() => onChangeView(View.ONBOARDING)}
              className="relative z-10 bg-white text-indigo-600 px-5 py-2.5 rounded-lg font-semibold shadow-sm hover:bg-indigo-50 transition-colors inline-flex items-center gap-2"
            >
              Continuar Onboarding
              <ArrowRight size={18} />
            </button>
          </>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Onboarding Progress Card */}
        <div className="bg-slate-900 rounded-xl shadow-lg border border-slate-800 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-lg text-white flex items-center gap-2">
              <Calendar size={20} className="text-indigo-400" />
              Seu Progresso
            </h2>
            <span className={`text-xs font-bold px-2 py-1 rounded-full border ${isOnboardingComplete ? 'bg-green-500/20 text-green-300 border-green-500/30' : 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30'}`}>
              {progress}%
            </span>
          </div>
          <div className="w-full bg-slate-800 rounded-full h-2.5 mb-4">
            <div 
              className={`h-2.5 rounded-full transition-all duration-1000 ${isOnboardingComplete ? 'bg-green-500' : 'bg-indigo-500'}`} 
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          
          {isOnboardingComplete ? (
            <div className="text-center py-4">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-green-900/20 text-green-400 mb-2">
                <CheckCircle size={24} />
              </div>
              <p className="text-sm text-slate-300 font-medium">Todas as tarefas concluídas!</p>
            </div>
          ) : (
            <>
              <p className="text-sm text-slate-400 mb-4">
                Você completou {totalSteps - incompleteSteps} de {totalSteps} tarefas essenciais.
              </p>
              <ul className="space-y-3">
                {pendingSteps.filter(s => !s.completed).slice(0, 3).map(step => (
                  <li key={step.id} className="flex items-start gap-3 text-sm text-slate-300">
                    <div className="min-w-[16px] h-4 mt-0.5 rounded-full border-2 border-slate-600" />
                    <span className="line-clamp-1">{step.title}</span>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>

        {/* Recent Updates / SOPs */}
        <div className="bg-slate-900 rounded-xl shadow-lg border border-slate-800 p-6 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-lg text-white flex items-center gap-2">
              <FileText size={20} className="text-indigo-400" />
              Documentos Recentes
            </h2>
            <button 
              onClick={() => onChangeView(View.KNOWLEDGE_BASE)}
              className="text-sm text-indigo-400 hover:text-indigo-300 font-medium"
            >
              Ver todos
            </button>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {recentSOPs.slice(0, 4).map(sop => (
              <div 
                key={sop.id} 
                className="p-4 rounded-lg border border-slate-800 bg-slate-950 hover:border-indigo-500/50 hover:shadow-lg hover:shadow-indigo-500/10 transition-all cursor-pointer group"
                onClick={() => onChangeView(View.KNOWLEDGE_BASE)}
              >
                <div className="flex justify-between items-start mb-2">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider group-hover:text-indigo-400 transition-colors">{sop.category}</span>
                  <ExternalLink size={14} className="text-slate-600 group-hover:text-indigo-400" />
                </div>
                <h3 className="font-medium text-slate-200 mb-1 group-hover:text-white">{sop.title}</h3>
                <p className="text-xs text-slate-500">Atualizado em {new Date(sop.lastUpdated).toLocaleDateString('pt-BR')}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
         <div 
           onClick={() => window.open('https://chat.whatsapp.com/I8s0tklYWFmEug3xtu97AS', '_blank')}
           className="bg-slate-900 p-4 rounded-xl shadow-lg border border-slate-800 hover:border-green-500/50 hover:shadow-green-500/10 transition-all cursor-pointer flex items-center gap-3 group"
         >
           <div className="w-10 h-10 rounded-lg bg-green-900/20 flex items-center justify-center text-green-500 group-hover:text-green-400 group-hover:bg-green-900/30 transition-colors">
             <MessageCircle size={24} />
           </div>
           <div>
             <p className="font-semibold text-slate-200 group-hover:text-white">WhatsApp</p>
             <p className="text-xs text-slate-500">Grupo Geral</p>
           </div>
         </div>
         <div 
           onClick={() => window.open('https://app.clickup.com/9013437304/home', '_blank')}
           className="bg-slate-900 p-4 rounded-xl shadow-lg border border-slate-800 hover:border-purple-500/50 hover:shadow-purple-500/10 transition-all cursor-pointer flex items-center gap-3 group"
         >
           <div className="w-10 h-10 rounded-lg bg-purple-900/20 flex items-center justify-center text-purple-500 group-hover:text-purple-400 group-hover:bg-purple-900/30 transition-colors">
             <Target size={24} />
           </div>
           <div>
             <p className="font-semibold text-slate-200 group-hover:text-white">ClickUp</p>
             <p className="text-xs text-slate-500">Gestão de Projetos</p>
           </div>
         </div>
         <div 
           onClick={() => onChangeView(View.AI_ASSISTANT)}
           className="bg-slate-900 p-4 rounded-xl shadow-lg border border-slate-800 hover:border-indigo-500/50 hover:shadow-indigo-500/10 transition-all cursor-pointer flex items-center gap-3 md:col-span-2 group"
         >
           <div className="w-10 h-10 rounded-lg bg-indigo-900/20 flex items-center justify-center text-indigo-500 group-hover:text-indigo-400 group-hover:bg-indigo-900/30 transition-colors">
             <Bot size={24} />
           </div>
           <div>
             <p className="font-semibold text-slate-200 group-hover:text-white">Precisa de ajuda?</p>
             <p className="text-xs text-slate-500">Pergunte ao Automatik AI sobre processos</p>
           </div>
         </div>
      </div>
    </div>
  );
};

export default Dashboard;