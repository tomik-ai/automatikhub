
import React, { useState, useEffect, useRef } from 'react';
import { SOP, User, ProcessDetails } from '../types';
import { UserService } from '../services/userService';
import { DEPARTMENTS } from '../constants';
import { Search, Plus, FileText, Tag, X, Edit2, Trash2, Save, Loader2, Check, AlertTriangle, Building2, Users, Calendar, ArrowRight, Book, ClipboardList, ListTree, Target, Activity, Upload, Filter, Lock, Clock, ChevronRight } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface KnowledgeBaseProps {
  sops: SOP[];
  user: User;
  onAddSOP: (sop: SOP) => void;
  onEditSOP: (sop: SOP) => void;
  onDeleteSOP: (id: string) => Promise<void>;
}

const KnowledgeBase: React.FC<KnowledgeBaseProps> = ({ sops, user, onAddSOP, onEditSOP, onDeleteSOP }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('Todos');
  const [selectedType, setSelectedType] = useState<'Todos' | 'standard' | 'process'>('Todos');
  const [selectedSOP, setSelectedSOP] = useState<SOP | null>(null);
  
  const [isTypeSelectionOpen, setIsTypeSelectionOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [availableUsers, setAvailableUsers] = useState<User[]>([]);
  
  const [isCustomCategory, setIsCustomCategory] = useState(false);
  const [isCustomDepartment, setIsCustomDepartment] = useState(false);
  const [confirmingDeleteId, setConfirmingDeleteId] = useState<string | null>(null);

  const [formData, setFormData] = useState<Partial<SOP>>({});
  const [processData, setProcessData] = useState<Partial<ProcessDetails>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  const categories = ['Todos', 'HR', 'Tech', 'Vendas', 'Operacional', 'Geral'];
  const isAdminOrMod = user.role === 'admin' || user.role === 'moderator';

  useEffect(() => {
     UserService.getAll().then(setAvailableUsers).catch(console.error);
  }, []);

  const filteredSOPs = sops.filter(sop => {
    const matchesSearch = sop.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          sop.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          sop.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = selectedCategory === 'Todos' || sop.category === selectedCategory;
    const matchesType = selectedType === 'Todos' || sop.type === selectedType;
    return matchesSearch && matchesCategory && matchesType;
  });

  const handleOpenCreateClick = () => {
    if (isAdminOrMod) {
        setIsTypeSelectionOpen(true);
    } else {
        startCreate('process');
    }
  };

  const startCreate = (type: 'standard' | 'process') => {
    setIsTypeSelectionOpen(false);
    setFormData({
      title: '',
      category: 'Geral',
      content: '',
      tags: [],
      responsible_department: 'Geral',
      responsible_users: [],
      type: type
    });
    setProcessData({
        objective: '',
        scope_includes: '',
        scope_excludes: '',
        materials: '',
        metrics: '',
        created_by: user.name
    });
    setIsCustomCategory(false);
    setIsCustomDepartment(false);
    setIsCreating(true);
    setIsEditing(false);
  };

  const handleOpenEdit = (sop: SOP, e?: React.MouseEvent) => {
    if (e) { e.stopPropagation(); e.preventDefault(); }
    if (!isAdminOrMod && sop.type === 'standard') {
        alert("Apenas administradores e moderadores podem editar Documentos Padrão.");
        return;
    }
    setFormData({ ...sop, responsible_users: sop.responsible_users || [] });
    setProcessData(sop.process_details || { objective: '', scope_includes: '', scope_excludes: '', materials: '', metrics: '', created_by: user.name });
    setIsCustomCategory(!categories.includes(sop.category));
    setIsCustomDepartment(!DEPARTMENTS.includes(sop.responsible_department as any));
    setIsEditing(true);
    setIsCreating(false);
    setSelectedSOP(null); 
  };

  const handleRequestDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation(); e.preventDefault();
    setConfirmingDeleteId(id);
    setTimeout(() => { setConfirmingDeleteId(prev => prev === id ? null : prev); }, 3000);
  };

  const handleConfirmDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation(); e.preventDefault();
    setConfirmingDeleteId(null);
    setDeletingId(id);
    try {
      await onDeleteSOP(id);
      if (selectedSOP?.id === id) setSelectedSOP(null);
    } catch (error) {
      console.error("Error deleting SOP", error);
    } finally {
      setDeletingId(null);
    }
  };

  const handleSave = () => {
    if (!formData.title?.trim() || !formData.category || !formData.content?.trim()) {
      alert("Por favor, preencha os campos obrigatórios.");
      return;
    }
    const processedTags = typeof formData.tags === 'string' 
      ? (formData.tags as string).split(',').map((t: string) => t.trim()).filter(t => t !== '') 
      : formData.tags || [];

    const finalSOP: SOP = {
        ...(formData as SOP),
        id: formData.id || Date.now().toString(),
        lastUpdated: new Date().toISOString(),
        tags: processedTags,
        type: formData.type || 'standard',
        process_details: formData.type === 'process' ? processData as ProcessDetails : undefined
    };

    if (isCreating) onAddSOP(finalSOP);
    else if (isEditing) onEditSOP(finalSOP);

    setIsCreating(false); setIsEditing(false);
    setFormData({}); setProcessData({});
  };

  const renderDeleteButton = (id: string, size: number = 14) => {
    const isConfirming = confirmingDeleteId === id;
    const isDeleting = deletingId === id;
    if (isDeleting) return <Loader2 size={size} className="animate-spin text-slate-500" />;
    if (isConfirming) return <button onClick={(e) => handleConfirmDelete(id, e)} className="text-red-500 hover:text-red-400 font-bold text-[10px] animate-pulse uppercase">Confirmar?</button>;
    return <button onClick={(e) => handleRequestDelete(id, e)} className="text-slate-500 hover:text-red-400 transition-colors"><Trash2 size={size} /></button>;
  };

  const markdownComponents = {
    h1: ({node, ...props}: any) => <h1 className="text-2xl font-bold text-white mt-8 mb-4 border-b border-white/10 pb-2" {...props} />,
    h2: ({node, ...props}: any) => <h2 className="text-xl font-bold text-cyan-400 mt-6 mb-3" {...props} />,
    p: ({node, ...props}: any) => <p className="mb-4 text-slate-300 leading-relaxed" {...props} />,
    ul: ({node, ...props}: any) => <ul className="list-disc pl-6 space-y-2 mb-4" {...props} />,
    li: ({node, ...props}: any) => <li className="text-slate-300" {...props} />,
    code: ({node, inline, ...props}: any) => inline 
        ? <code className="bg-white/5 text-cyan-300 px-1 rounded" {...props} /> 
        : <pre className="bg-slate-950 p-4 rounded-lg overflow-x-auto my-4 border border-white/5"><code className="text-sm text-cyan-100" {...props} /></pre>
  };

  return (
    <div className="h-full flex flex-col space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
            <Book size={28} className="text-cyan-500" />
            CENTRAL DE CONHECIMENTO
          </h1>
          <p className="text-slate-400 max-w-2xl font-light">Repositório de inteligência operacional da Automatik.</p>
        </div>
        {isAdminOrMod && (
          <button 
            onClick={handleOpenCreateClick}
            className="bg-cyan-600 hover:bg-cyan-500 text-white px-5 py-2.5 rounded-lg font-bold uppercase tracking-wider text-xs flex items-center gap-2 transition-all shadow-[0_0_15px_rgba(8,145,178,0.3)]"
          >
            <Plus size={16} /> Novo Documento
          </button>
        )}
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
          <input
            type="text"
            placeholder="Pesquisar por título, conteúdo ou tags..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-11 pr-4 py-3 bg-[#0B1120] border border-white/10 text-white rounded-lg focus:outline-none focus:border-cyan-500/50 font-mono text-sm"
          />
        </div>
        <div className="flex bg-[#0B1120] border border-white/10 p-1 rounded-lg">
           {categories.map(cat => (
             <button
               key={cat}
               onClick={() => setSelectedCategory(cat)}
               className={`px-4 py-2 rounded-md text-[10px] font-bold uppercase tracking-wider transition-all ${selectedCategory === cat ? 'bg-cyan-600 text-white' : 'text-slate-500 hover:text-slate-300'}`}
             >
               {cat}
             </button>
           ))}
        </div>
      </div>

      {/* List Header (Desktop Only) */}
      <div className="hidden md:grid grid-cols-12 gap-4 px-6 py-3 border-b border-white/5 text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">
        <div className="col-span-6">Protocolo / Título</div>
        <div className="col-span-2 text-center">Setor</div>
        <div className="col-span-2 text-center">Última Modificação</div>
        <div className="col-span-2 text-right pr-2">Ações</div>
      </div>

      {/* Document List */}
      <div className="space-y-2 flex-1 overflow-y-auto custom-scrollbar">
        {filteredSOPs.map(sop => (
          <div 
            key={sop.id}
            onClick={() => setSelectedSOP(sop)}
            className={`
              grid grid-cols-1 md:grid-cols-12 gap-4 items-center px-6 py-4 rounded-xl border border-white/5 bg-[#0B1120]/40 backdrop-blur-sm transition-all cursor-pointer group
              hover:bg-[#0B1120] hover:border-cyan-500/30 hover:shadow-[0_0_20px_rgba(6,182,212,0.05)]
              ${deletingId === sop.id ? 'opacity-40 pointer-events-none' : ''}
            `}
          >
            {/* Title & Type Icon */}
            <div className="col-span-1 md:col-span-6 flex items-center gap-4">
               <div className={`p-2 rounded-lg shrink-0 ${sop.type === 'process' ? 'bg-violet-500/10 text-violet-400' : 'bg-cyan-500/10 text-cyan-400'}`}>
                  {sop.type === 'process' ? <ListTree size={20}/> : <FileText size={20}/>}
               </div>
               <div className="min-w-0">
                  <h3 className="text-sm font-bold text-slate-200 group-hover:text-white transition-colors truncate">{sop.title}</h3>
                  <div className="flex items-center gap-2 mt-1">
                     <span className="text-[9px] font-bold text-slate-500 uppercase px-1.5 py-0.5 rounded border border-white/5 bg-white/5">{sop.category}</span>
                     {sop.tags.slice(0, 2).map(tag => (
                        <span key={tag} className="text-[9px] text-slate-600 font-mono">#{tag}</span>
                     ))}
                  </div>
               </div>
            </div>

            {/* Department */}
            <div className="col-span-2 text-center hidden md:block">
               <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-slate-800/50 px-3 py-1 rounded">
                  {sop.responsible_department || 'Geral'}
               </span>
            </div>

            {/* Date */}
            <div className="col-span-2 text-center hidden md:block">
               <div className="text-[11px] text-slate-500 font-mono flex items-center justify-center gap-1.5">
                  <Clock size={12} className="text-slate-600" />
                  {new Date(sop.lastUpdated).toLocaleDateString('pt-BR')}
               </div>
            </div>

            {/* Actions */}
            <div className="col-span-1 md:col-span-2 flex items-center justify-end gap-4">
               <div className="hidden group-hover:flex items-center gap-3 animate-in fade-in slide-in-from-right-2 duration-300">
                  <button 
                    onClick={(e) => handleOpenEdit(sop, e)}
                    className="text-slate-500 hover:text-cyan-400 transition-colors"
                  >
                    <Edit2 size={14} />
                  </button>
                  {renderDeleteButton(sop.id)}
               </div>
               <ChevronRight size={16} className="text-slate-700 group-hover:text-cyan-500 transition-colors" />
            </div>
          </div>
        ))}

        {filteredSOPs.length === 0 && (
          <div className="py-20 text-center">
            <Search size={48} className="text-slate-800 mx-auto mb-4" />
            <p className="text-slate-500 font-medium">Nenhum protocolo encontrado com os termos atuais.</p>
          </div>
        )}
      </div>

      {/* View Modal */}
      {selectedSOP && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md" onClick={() => setSelectedSOP(null)}>
          <div className="bg-[#0B1120] rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden border border-white/10 flex flex-col shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-white/10 flex justify-between items-center bg-[#0B1120]/50 sticky top-0 z-10 backdrop-blur">
               <div className="flex items-center gap-3">
                  <span className={`w-2 h-2 rounded-full ${selectedSOP.type === 'process' ? 'bg-violet-500 shadow-[0_0_8px_#8b5cf6]' : 'bg-cyan-500 shadow-[0_0_8px_#06b6d4]'}`}></span>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{selectedSOP.type === 'process' ? 'Processo Operacional' : 'Protocolo Padrão'}</span>
               </div>
               <button onClick={() => setSelectedSOP(null)} className="text-slate-500 hover:text-white p-1"><X size={24} /></button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-8 md:p-12 custom-scrollbar">
               <div className="max-w-3xl mx-auto">
                  <header className="mb-12">
                     <h1 className="text-4xl font-bold text-white mb-6 leading-tight">{selectedSOP.title}</h1>
                     <div className="flex flex-wrap gap-4 items-center text-xs text-slate-500 border-y border-white/5 py-4">
                        <div className="flex items-center gap-1.5"><Building2 size={14} /> <span className="text-slate-300 font-bold">{selectedSOP.responsible_department}</span></div>
                        <div className="w-px h-3 bg-white/10"></div>
                        <div className="flex items-center gap-1.5"><Calendar size={14} /> Atualizado em {new Date(selectedSOP.lastUpdated).toLocaleDateString()}</div>
                        <div className="w-px h-3 bg-white/10"></div>
                        <div className="flex items-center gap-1.5"><Users size={14} /> {selectedSOP.responsible_users?.length || 0} Responsáveis</div>
                     </div>
                  </header>

                  {selectedSOP.type === 'process' && selectedSOP.process_details && (
                     <div className="mb-10 p-6 bg-violet-500/5 border border-violet-500/20 rounded-xl space-y-4">
                        <h3 className="text-sm font-bold text-violet-400 uppercase tracking-widest flex items-center gap-2"><Target size={16}/> Objetivo do Processo</h3>
                        <p className="text-slate-300 italic">"{selectedSOP.process_details.objective}"</p>
                     </div>
                  )}

                  <div className="prose prose-invert prose-cyan max-w-none">
                     <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
                        {selectedSOP.content}
                     </ReactMarkdown>
                  </div>

                  {selectedSOP.tags.length > 0 && (
                     <div className="mt-16 pt-8 border-t border-white/5 flex gap-2">
                        {selectedSOP.tags.map(tag => (
                           <span key={tag} className="text-[10px] text-slate-500 font-mono bg-white/5 px-2 py-1 rounded border border-white/5">#{tag}</span>
                        ))}
                     </div>
                  )}
               </div>
            </div>
          </div>
        </div>
      )}

      {/* Forms (Edit/Create) - Reuse logic from existing code but keep consistency */}
      {(isCreating || isEditing) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm">
           <div className="bg-[#0B1120] rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto border border-white/10 flex flex-col shadow-2xl custom-scrollbar" onClick={e => e.stopPropagation()}>
              <div className="px-6 py-5 border-b border-white/10 flex items-center justify-between sticky top-0 bg-[#0B1120] z-10">
                 <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    {isCreating ? <Plus className="text-cyan-500" /> : <Edit2 className="text-cyan-500" />}
                    {isCreating ? 'Novo Documento' : 'Editar Documento'}
                 </h2>
                 <button onClick={() => { setIsCreating(false); setIsEditing(false); }} className="text-slate-500 hover:text-white"><X size={24} /></button>
              </div>

              <div className="p-8 space-y-6">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="md:col-span-2">
                       <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Título do Protocolo</label>
                       <input 
                         type="text" 
                         value={formData.title || ''} 
                         onChange={e => setFormData({...formData, title: e.target.value})} 
                         className="w-full bg-slate-950 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-cyan-500/50 outline-none transition-all" 
                         placeholder="Ex: Guia de Boas Vindas"
                       />
                    </div>
                    <div>
                       <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Categoria</label>
                       <select 
                         value={formData.category} 
                         onChange={e => setFormData({...formData, category: e.target.value as any})}
                         className="w-full bg-slate-950 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-cyan-500/50 outline-none"
                       >
                          {categories.filter(c => c !== 'Todos').map(c => <option key={c} value={c}>{c}</option>)}
                       </select>
                    </div>
                    <div>
                       <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Departamento Responsável</label>
                       <select 
                         value={formData.responsible_department} 
                         onChange={e => setFormData({...formData, responsible_department: e.target.value as any})}
                         className="w-full bg-slate-950 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-cyan-500/50 outline-none"
                       >
                          {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                       </select>
                    </div>
                 </div>

                 <div>
                    <div className="flex justify-between items-center mb-2">
                       <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Conteúdo (Markdown)</label>
                       <span className="text-[9px] text-cyan-500 font-mono">SUPORTA FORMATAÇÃO MD</span>
                    </div>
                    <textarea 
                      value={formData.content || ''} 
                      onChange={e => setFormData({...formData, content: e.target.value})} 
                      className="w-full min-h-[300px] bg-slate-950 border border-white/10 rounded-lg px-4 py-4 text-slate-300 font-mono text-sm focus:border-cyan-500/50 outline-none custom-scrollbar" 
                      placeholder="# Título Principal\n\nDescreva aqui o documento..."
                    />
                 </div>

                 <div className="pt-6 border-t border-white/5 flex justify-end gap-3">
                    <button onClick={() => { setIsCreating(false); setIsEditing(false); }} className="px-6 py-2 text-slate-500 hover:text-white font-bold text-[11px] uppercase tracking-widest transition-colors">Cancelar</button>
                    <button onClick={handleSave} className="bg-cyan-600 hover:bg-cyan-500 text-white px-8 py-3 rounded-lg font-bold text-[11px] uppercase tracking-widest shadow-[0_0_20px_rgba(8,145,178,0.2)]">Salvar Alterações</button>
                 </div>
              </div>
           </div>
        </div>
      )}

      {/* Type Selection Modal */}
      {isTypeSelectionOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm" onClick={() => setIsTypeSelectionOpen(false)}>
          <div className="bg-[#0B1120] rounded-2xl w-full max-w-lg border border-white/10 p-8 relative" onClick={e => e.stopPropagation()}>
             <h2 className="text-xl font-bold text-white mb-6 text-center">Selecionar Tipo de Documento</h2>
             <div className="grid grid-cols-2 gap-4">
                <button onClick={() => startCreate('standard')} className="p-6 bg-slate-900 border border-white/5 rounded-xl hover:border-cyan-500/50 transition-all flex flex-col items-center gap-4 group">
                   <FileText size={40} className="text-slate-600 group-hover:text-cyan-400 transition-colors" />
                   <span className="font-bold text-xs uppercase tracking-widest text-slate-400 group-hover:text-white">Documento Padrão</span>
                </button>
                <button onClick={() => startCreate('process')} className="p-6 bg-slate-900 border border-white/5 rounded-xl hover:border-violet-500/50 transition-all flex flex-col items-center gap-4 group">
                   <ListTree size={40} className="text-slate-600 group-hover:text-violet-400 transition-colors" />
                   <span className="font-bold text-xs uppercase tracking-widest text-slate-400 group-hover:text-white">Processo Estruturado</span>
                </button>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default KnowledgeBase;
