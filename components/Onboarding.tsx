import React from 'react';
import { OnboardingStep, View } from '../types';
import { CheckCircle2, Circle, ArrowRight, ExternalLink } from 'lucide-react';

interface OnboardingProps {
  steps: OnboardingStep[];
  onToggleStep: (id: string) => void;
  onChangeView: (view: View) => void;
}

const Onboarding: React.FC<OnboardingProps> = ({ steps, onToggleStep, onChangeView }) => {
  const completedCount = steps.filter(s => s.completed).length;
  const totalCount = steps.length;
  const progress = Math.round((completedCount / totalCount) * 100);

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white mb-2">Onboarding Checklist</h1>
        <p className="text-slate-400">Complete estas etapas essenciais para configurar sua conta e ferramentas.</p>
      </div>

      <div className="bg-slate-900 rounded-xl shadow-lg border border-slate-800 p-6 mb-8">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-semibold text-slate-300">Seu Progresso</span>
          <span className="text-sm font-bold text-indigo-400">{progress}%</span>
        </div>
        <div className="w-full bg-slate-800 rounded-full h-3">
          <div 
            className="bg-indigo-500 h-3 rounded-full transition-all duration-500" 
            style={{ width: `${progress}%` }}
          ></div>
        </div>
      </div>

      <div className="space-y-4">
        {steps.map((step) => (
          <div 
            key={step.id}
            className={`
              relative p-6 rounded-xl border transition-all duration-200
              ${step.completed 
                ? 'bg-slate-950 border-slate-800 opacity-75' 
                : 'bg-slate-900 border-slate-800 shadow-lg hover:border-indigo-500/50'}
            `}
          >
            <div className="flex items-start gap-4">
              <button 
                onClick={() => onToggleStep(step.id)}
                className={`mt-1 transition-colors ${step.completed ? 'text-green-500' : 'text-slate-600 hover:text-indigo-500'}`}
              >
                {step.completed ? <CheckCircle2 size={28} className="fill-green-900/20" /> : <Circle size={28} />}
              </button>
              
              <div className="flex-1">
                <h3 className={`font-semibold text-lg ${step.completed ? 'text-slate-500 line-through' : 'text-slate-200'}`}>
                  {step.title}
                </h3>
                <p className={`text-slate-400 mt-1 ${step.completed ? 'text-slate-600' : ''}`}>
                  {step.description}
                </p>
                
                {step.link && !step.completed && (
                  <button 
                    onClick={() => onChangeView(View.KNOWLEDGE_BASE)}
                    className="mt-3 text-indigo-400 hover:text-indigo-300 text-sm font-medium inline-flex items-center gap-1"
                  >
                    Acessar Documento <ArrowRight size={14} />
                  </button>
                )}

                {step.externalLink && !step.completed && (
                   <button 
                    onClick={() => window.open(step.externalLink, '_blank')}
                    className="mt-3 bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded-lg text-sm font-bold inline-flex items-center gap-2 transition-colors shadow-lg shadow-green-900/20"
                  >
                    Entrar no Grupo <ExternalLink size={14} />
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {progress === 100 && (
        <div className="mt-8 p-6 bg-green-900/20 border border-green-900/50 rounded-xl text-center animate-fade-in">
          <h3 className="text-xl font-bold text-green-400 mb-2">Parabéns! 🎉</h3>
          <p className="text-green-200/80">Você completou todo o processo inicial de onboarding.</p>
        </div>
      )}
    </div>
  );
};

export default Onboarding;