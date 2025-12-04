import React, { useState, useEffect } from 'react';
import { Training } from '../types';
import { TrainingService } from '../services/trainingService';
import { StorageService } from '../services/storage';
import { Play, Clock, Search, Video, Plus, X, Trash2, Loader2, Edit2, ExternalLink, RefreshCw } from 'lucide-react';

const TrainingHub: React.FC = () => {
  const [trainings, setTrainings] = useState<Training[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Todos');
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<Partial<Training>>({});

  const user = StorageService.getSession();
  const isAdminOrMod = user?.role === 'admin' || user?.role === 'moderator';

  useEffect(() => {
    loadTrainings();
  }, []);

  const loadTrainings = async () => {
    setLoading(true);
    try {
        const data = await TrainingService.getAll();
        setTrainings(data);
    } catch (error) {
        console.error("Failed to load trainings", error);
    } finally {
        setLoading(false);
    }
  };

  // Helper to extract YouTube ID and Thumbnail
  const getYouTubeId = (url: string) => {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  const getYouTubeThumbnail = (url: string) => {
    const id = getYouTubeId(url);
    if (id) {
        return `https://img.youtube.com/vi/${id}/maxresdefault.jpg`;
    }
    return `https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=800&q=80`;
  };

  const isYouTubeThumbnail = (url?: string) => {
    if (!url) return false;
    return url.includes('youtube.com') || url.includes('ytimg.com');
  };

  const categories = ['Todos', ...Array.from(new Set(trainings.map(t => t.category)))];

  const filteredTrainings = trainings.filter(t => {
    const matchesSearch = t.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          t.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'Todos' || t.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleOpenAdd = () => {
      setFormData({});
      setIsEditing(false);
      setIsModalOpen(true);
  };

  const handleOpenEdit = (training: Training, e: React.MouseEvent) => {
      e.stopPropagation();
      setFormData({ ...training });
      setIsEditing(true);
      setIsModalOpen(true);
  };

  const handleSave = async () => {
    if (!formData.title || !formData.videoUrl) {
        alert("Preencha título e URL do vídeo");
        return;
    }

    // Logic: auto-generate thumbnail if empty or if it looks like an old auto-generated one
    let finalThumbnail = formData.thumbnailUrl;
    const shouldUpdateThumbnail = !finalThumbnail || finalThumbnail.trim() === '' || isYouTubeThumbnail(finalThumbnail);

    if (shouldUpdateThumbnail) {
        const ytThumb = getYouTubeId(formData.videoUrl);
        if (ytThumb) {
             finalThumbnail = getYouTubeThumbnail(formData.videoUrl);
        } else if (!finalThumbnail) {
             finalThumbnail = 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?auto=format&fit=crop&w=800&q=80';
        }
    }

    try {
        if (isEditing && formData.id) {
             await TrainingService.update({
                id: formData.id,
                title: formData.title!,
                description: formData.description || '',
                videoUrl: formData.videoUrl!,
                thumbnailUrl: finalThumbnail || '',
                category: formData.category || 'Geral',
                duration: formData.duration || 'N/A',
                instructor: formData.instructor || user?.name || 'Automatik Team'
             });
        } else {
            await TrainingService.create({
                title: formData.title!,
                description: formData.description || '',
                videoUrl: formData.videoUrl!,
                thumbnailUrl: finalThumbnail || '',
                category: formData.category || 'Geral',
                duration: formData.duration || 'N/A',
                instructor: user?.name || 'Automatik Team'
            });
        }
        
        setIsModalOpen(false);
        setFormData({});
        loadTrainings();
    } catch (e: any) {
        console.error(e);
        alert("Erro ao salvar: " + (e.message || JSON.stringify(e)));
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm("Tem certeza que deseja excluir este treinamento?")) return;
    try {
        await TrainingService.delete(id);
        loadTrainings();
    } catch (e: any) {
        alert("Erro ao excluir: " + e.message);
    }
  };

  return (
    <div className="h-full flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
            <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
            <Video size={28} className="text-violet-500" />
            CENTRAL DE TREINAMENTO
            </h1>
            <p className="text-slate-400 max-w-2xl font-light">Desenvolva suas habilidades com nossos cursos e tutoriais.</p>
        </div>
        {isAdminOrMod && (
            <button 
                onClick={handleOpenAdd}
                className="bg-violet-600 hover:bg-violet-500 text-white px-5 py-2.5 rounded-lg font-bold uppercase tracking-wider text-xs flex items-center gap-2 transition-all shadow-[0_0_15px_rgba(139,92,246,0.3)] hover:shadow-[0_0_20px_rgba(139,92,246,0.5)]"
            >
                <Plus size={16} /> Novo Video
            </button>
        )}
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
      {loading ? (
        <div className="flex items-center justify-center h-64">
           <Loader2 className="animate-spin text-violet-500" size={48} />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTrainings.map(training => (
            <div 
                key={training.id}
                className="bg-[#0B1120] border border-white/5 rounded-xl overflow-hidden hover:border-violet-500/30 transition-all group cursor-pointer focus:outline-none relative"
                onClick={() => window.open(training.videoUrl, '_blank')}
            >
                {isAdminOrMod && (
                    <div className="absolute top-2 right-2 z-20 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                         <button 
                            onClick={(e) => handleOpenEdit(training, e)}
                            className="p-2 bg-black/60 hover:bg-violet-600 text-white rounded backdrop-blur-sm transition-colors shadow-lg"
                        >
                            <Edit2 size={14} />
                        </button>
                        <button 
                            onClick={(e) => handleDelete(training.id, e)}
                            className="p-2 bg-black/60 hover:bg-red-600 text-white rounded backdrop-blur-sm transition-colors shadow-lg"
                        >
                            <Trash2 size={14} />
                        </button>
                    </div>
                )}

                {/* Thumbnail Wrapper */}
                <div className="relative aspect-video bg-slate-800 overflow-hidden">
                <img 
                    src={training.thumbnailUrl || getYouTubeThumbnail(training.videoUrl)} 
                    alt={training.title} 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-80 group-hover:opacity-100" 
                    onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        // Fallback logic
                        if (target.src.includes('maxresdefault')) {
                            target.src = target.src.replace('maxresdefault', 'mqdefault');
                        } else {
                            target.src = 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?auto=format&fit=crop&w=800&q=80';
                        }
                    }}
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
                    <ExternalLink size={12} className="text-slate-600 group-hover:text-violet-400 transition-colors"/>
                </div>
                
                <h3 className="text-lg font-bold text-white mb-2 group-hover:text-violet-300 transition-colors line-clamp-2">
                    {training.title}
                </h3>
                
                <p className="text-slate-400 text-xs mb-4 line-clamp-2 leading-relaxed">
                    {training.description}
                </p>

                <div className="pt-4 border-t border-white/5 flex items-center gap-2">
                    <div className="w-5 h-5 rounded-full bg-slate-700 flex items-center justify-center text-[10px] text-white font-bold uppercase">
                        {training.instructor?.charAt(0) || 'A'}
                    </div>
                    <span className="text-xs text-slate-500 font-medium">{training.instructor}</span>
                </div>
                </div>
            </div>
            ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={() => setIsModalOpen(false)}>
          <div className="bg-[#0B1120] rounded-xl w-full max-w-lg shadow-2xl border border-white/10" onClick={e => e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between">
              <h3 className="text-lg font-bold text-white">{isEditing ? 'Editar Treinamento' : 'Adicionar Treinamento'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white"><X size={20} /></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Título</label>
                <input 
                  type="text" 
                  value={formData.title || ''}
                  onChange={e => setFormData({...formData, title: e.target.value})}
                  className="w-full bg-slate-950 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Descrição</label>
                <textarea 
                  value={formData.description || ''}
                  onChange={e => setFormData({...formData, description: e.target.value})}
                  className="w-full bg-slate-950 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-violet-500 h-24"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">URL Vídeo (YouTube)</label>
                    <input 
                        type="text" 
                        value={formData.videoUrl || ''}
                        onChange={e => setFormData({...formData, videoUrl: e.target.value})}
                        className="w-full bg-slate-950 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
                        placeholder="https://youtube.com/..."
                    />
                </div>
                <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Duração</label>
                    <input 
                        type="text" 
                        value={formData.duration || ''}
                        onChange={e => setFormData({...formData, duration: e.target.value})}
                        className="w-full bg-slate-950 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
                        placeholder="Ex: 10 min"
                    />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                 <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Categoria</label>
                    <input 
                        type="text" 
                        value={formData.category || ''}
                        onChange={e => setFormData({...formData, category: e.target.value})}
                        className="w-full bg-slate-950 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
                        placeholder="Ex: Vendas"
                    />
                 </div>
                 <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex justify-between">
                        Thumbnail (Opcional)
                         <button 
                            type="button"
                            onClick={() => {
                                if (formData.videoUrl) {
                                    setFormData({...formData, thumbnailUrl: getYouTubeThumbnail(formData.videoUrl)});
                                }
                            }}
                            className="text-[10px] text-violet-400 hover:text-white flex items-center gap-1"
                         >
                            <RefreshCw size={10} /> Auto-Gerar
                         </button>
                    </label>
                    <input 
                        type="text" 
                        value={formData.thumbnailUrl || ''}
                        onChange={e => setFormData({...formData, thumbnailUrl: e.target.value})}
                        className="w-full bg-slate-950 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
                        placeholder="Deixe vazio para usar a do YouTube"
                    />
                 </div>
              </div>

              <button 
                onClick={handleSave} 
                className="w-full bg-violet-600 hover:bg-violet-500 py-3 rounded-lg text-white font-bold mt-4 transition-colors shadow-lg"
              >
                {isEditing ? 'Salvar Alterações' : 'Adicionar Vídeo'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TrainingHub;