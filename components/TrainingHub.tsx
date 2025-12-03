import React, { useState } from 'react';
import { MOCK_TRAININGS } from '../constants';
import { Play, Clock, Search, Video } from 'lucide-react';

const TrainingHub: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Todos');

  const categories = ['Todos', ...Array.from(new Set(MOCK_TRAININGS.map(t => t.category)))];

  const filteredTrainings = MOCK_TRAININGS.filter(t => {
    const matchesSearch = t.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          t.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'Todos' || t.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="h-full flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
          <Video size={28} className="text-violet-500" />
          CENTRAL DE TREINAMENTO
        </h1>
        <p className="text-slate-400 max-w-2xl font-light">Desenvolva suas habilidades com nossos cursos e tutoriais.</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4 mb-8">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
          <input
            type="text"
            placeholder="BUSCAR TREINAMENTO..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-11 pr-4 py-3 bg-[#0B1120] border border-white/10 text-white rounded-lg focus:outline-none focus:border-violet-500/50 focus:shadow-[0_0_15px_rgba(139,92,246,0.1)] placeholder-slate-600 font-mono text-sm transition-all"
          />
        </div>
        <div className="flex overflow-x-auto pb-2 md:pb-0 gap-2 no-scrollbar">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`
                px-5 py-2 rounded-lg text-xs font-bold uppercase tracking-wider whitespace-nowrap transition-all focus:outline-none focus:ring-0
                ${selectedCategory === cat 
                  ? 'bg-white/10 text-violet-400 border border-violet-500/30 shadow-[0_0_10px_rgba(139,92,246,0.1)]' 
                  : 'bg-[#0B1120] border border-white/5 text-slate-500 hover:text-slate-300 hover:border-white/10'}
              `}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Videos Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTrainings.map(training => (
          <div 
            key={training.id}
            className="bg-[#0B1120] border border-white/5 rounded-xl overflow-hidden hover:border-violet-500/30 transition-all group cursor-pointer focus:outline-none"
            onClick={() => window.open(training.videoUrl, '_blank')}
          >
            {/* Thumbnail Wrapper */}
            <div className="relative aspect-video bg-slate-800 overflow-hidden">
              <img 
                src={training.thumbnailUrl} 
                alt={training.title} 
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-80 group-hover:opacity-100" 
              />
              <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                <div className="w-12 h-12 bg-violet-600/90 rounded-full flex items-center justify-center shadow-lg shadow-violet-500/20 group-hover:scale-110 transition-transform">
                  <Play size={20} className="text-white ml-1" fill="white" />
                </div>
              </div>
              <div className="absolute bottom-3 right-3 bg-black/80 text-white text-[10px] font-bold px-2 py-0.5 rounded flex items-center gap-1">
                <Clock size={10} /> {training.duration}
              </div>
            </div>

            <div className="p-5">
              <div className="flex justify-between items-start mb-2">
                <span className="text-[10px] font-bold text-violet-400 uppercase tracking-widest bg-violet-500/10 px-2 py-1 rounded border border-violet-500/20">
                  {training.category}
                </span>
              </div>
              
              <h3 className="text-lg font-bold text-white mb-2 group-hover:text-violet-300 transition-colors line-clamp-2">
                {training.title}
              </h3>
              
              <p className="text-slate-400 text-xs mb-4 line-clamp-2 leading-relaxed">
                {training.description}
              </p>

              <div className="pt-4 border-t border-white/5 flex items-center gap-2">
                 <div className="w-5 h-5 rounded-full bg-slate-700 flex items-center justify-center text-[10px] text-white font-bold">
                    {training.instructor?.charAt(0)}
                 </div>
                 <span className="text-xs text-slate-500 font-medium">{training.instructor}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TrainingHub;