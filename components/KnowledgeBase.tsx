import React, { useState, useEffect } from 'react';
import { SOP, User } from '../types';
import { UserService } from '../services/userService';
import { DEPARTMENTS } from '../constants';
import { Search, Plus, FileText, Tag, X, Edit2, Trash2, Save, Loader2, Check, AlertTriangle, Building2, Users, Calendar, ArrowRight, Book } from 'lucide-react';
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
  const [selectedSOP, setSelectedSOP] = useState<SOP | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [availableUsers, setAvailableUsers] = useState<User[]>([]);
  
  // New state for delete confirmation
  const [confirmingDeleteId, setConfirmingDeleteId] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState<Partial<SOP>>({});

  const categories = ['Todos', 'HR', 'Tech', 'Vendas', 'Operacional', 'Geral'];
  
  // Permissions: Admin AND Moderator can edit
  const canEdit = user.role === 'admin' || user.role === 'moderator';

  // Load users for selection in form
  useEffect(() => {
    if (canEdit) {
      UserService.getAll().then(setAvailableUsers).catch(console.error);
    }
  }, [canEdit]);

  const filteredSOPs = sops.filter(sop => {
    const matchesSearch = sop.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          sop.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          sop.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = selectedCategory === 'Todos' || sop.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleOpenCreate = () => {
    setFormData({
      title: '',
      category: 'Geral',
      content: '',
      tags: [],
      responsible_department: 'Geral',
      responsible_users: []
    });
    setIsCreating(true);
    setIsEditing(false);
  };

  const handleOpenEdit = (sop: SOP, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    setFormData({
      ...sop,
      responsible_users: sop.responsible_users || []
    });
    setIsEditing(true);
    setIsCreating(false);
    setSelectedSOP(null); 
  };

  // Phase 1: Request Delete (Show Confirmation)
  const handleRequestDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setConfirmingDeleteId(id);
    
    // Auto-reset confirmation after 3 seconds if not clicked
    setTimeout(() => {
      setConfirmingDeleteId(prev => prev === id ? null : prev);
    }, 3000);
  };

  // Phase 2: Execute Delete
  const handleConfirmDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    
    setConfirmingDeleteId(null);
    setDeletingId(id);
    
    try {
      await onDeleteSOP(id);
      // If we are in modal view, close it
      if (selectedSOP?.id === id) {
        setSelectedSOP(null);
      }
    } catch (error) {
      console.error("Error deleting SOP", error);
    } finally {
      setDeletingId(null);
    }
  };

  const handleSave = () => {
    // Validação de campos obrigatórios
    const missingFields: string[] = [];
    if (!formData.title?.trim()) missingFields.push("Título");
    if (!formData.category) missingFields.push("Categoria");
    if (!formData.content?.trim()) missingFields.push("Conteúdo");
    if (!formData.responsible_department) missingFields.push("Setor Responsável");

    if (missingFields.length > 0) {
      alert(`Por favor, preencha os seguintes campos obrigatórios:\n\n- ${missingFields.join('\n- ')}`);
      return;
    }

    const timestamp = new Date().toISOString();
    
    // Process tags safely
    const processedTags = typeof formData.tags === 'string' 
      ? (formData.tags as string).split(',').map((t: string) => t.trim()).filter(t => t !== '') 
      : formData.tags || [];

    if (isCreating) {
      const newSOP: SOP = {
        id: Date.now().toString(), 
        title: formData.title!,
        category: formData.category as any || 'Geral',
        content: formData.content!,
        lastUpdated: timestamp,
        tags: processedTags,
        responsible_department: formData.responsible_department,
        responsible_users: formData.responsible_users
      };
      onAddSOP(newSOP);
    } else if (isEditing && formData.id) {
       const updatedSOP: SOP = {
         ...(formData as SOP),
         title: formData.title!,
         category: formData.category as any,
         content: formData.content!,
         lastUpdated: timestamp,
         tags: processedTags,
         responsible_department: formData.responsible_department,
         responsible_users: formData.responsible_users
       };
       onEditSOP(updatedSOP);
    }

    setIsCreating(false);
    setIsEditing(false);
    setFormData({});
  };

  const handleCardClick = (sop: SOP, e: React.MouseEvent) => {
    // Prevent card click if the target was a button or inside a button
    if ((e.target as HTMLElement).closest('button')) return;
    setSelectedSOP(sop);
  };

  const toggleResponsibleUser = (email: string) => {
    const current = formData.responsible_users || [];
    if (current.includes(email)) {
      setFormData({ ...formData, responsible_users: current.filter(e => e !== email) });
    } else {
      setFormData({ ...formData, responsible_users: [...current, email] });
    }
  };

  const renderDeleteButton = (id: string, size: number = 14) => {
    const isConfirming = confirmingDeleteId === id;
    const isDeleting = deletingId === id;

    if (isDeleting) {
      return (
        <button 
          disabled
          className={`p-2 rounded bg-slate-800 text-slate-500 cursor-not-allowed`}
          title="Excluindo..."
        >
          <Loader2 size={size} className="animate-spin" />
        </button>
      );
    }

    if (isConfirming) {
      return (
        <button 
          onClick={(e) => handleConfirmDelete(id, e)}
          className={`p-2 rounded bg-red-600 text-white hover:bg-red-700 transition-all animate-pulse font-bold flex items-center gap-1`}
          title="Confirmar Exclusão"
        >
          <Trash2 size={size} /> <span className="text-[10px] uppercase">Confirmar?</span>
        </button>
      );
    }

    return (
      <button 
        onClick={(e) => handleRequestDelete(id, e)} 
        className={`p-2 bg-slate-800/80 hover:bg-red-900/30 rounded text-slate-400 hover:text-red-400 transition-colors shadow-sm border border-slate-700/50`}
        title="Excluir"
      >
        <Trash2 size={size} />
      </button>
    );
  };

  // Helper to get user objects from emails in SOP
  const getResponsibleUsers = (emails?: string[]) => {
    if (!emails || emails.length === 0) return [];
    
    if (availableUsers.length > 0) {
        return emails.map(email => availableUsers.find(u => u.email === email) || { name: email.split('@')[0], email, avatar: `https://ui-avatars.com/api/?name=${email}&background=random` });
    }
    return emails.map(email => ({ name: email.split('@')[0], email, avatar: `https://ui-avatars.com/api/?name=${email}&background=random` }));
  };

  const markdownComponents = {
    h1: ({node, ...props}: any) => <h1 className="text-2xl md:text-3xl font-bold text-white mt-8 mb-4 pb-2 border-b border-white/10" {...props} />,
    h2: ({node, ...props}: any) => <h2 className="text-xl font-bold text-cyan-400 mt-6 mb-3 uppercase tracking-wide" {...props} />,
    h3: ({node, ...props}: any) => <h3 className="text-lg font-semibold text-violet-300 mt-5 mb-2" {...props} />,
    p: ({node, ...props}: any) => <p className="mb-4 whitespace-pre-wrap text-slate-300 leading-relaxed font-light" {...props} />,
    ul: ({node, ...props}: any) => <ul className="list-disc pl-6 space-y-1 my-4 text-slate-300" {...props} />,
    ol: ({node, ...props}: any) => <ol className="list-decimal pl-6 space-y-1 my-4 text-slate-300" {...props} />,
    li: ({node, ...props}: any) => <li className="pl-1" {...props} />,
    strong: ({node, ...props}: any) => <strong className="font-bold text-white" {...props} />,
    blockquote: ({node, ...props}: any) => <blockquote className="border-l-4 border-cyan-500 pl-4 italic text-slate-400 my-4 bg-slate-800/30 p-4 rounded-r-lg" {...props} />,
    code: ({node, inline, className, children, ...props}: any) => {
       return inline 
        ? <code className="bg-slate-900 border border-slate-700 text-cyan-300 px-1.5 py-0.5 rounded text-xs font-mono" {...props}>{children}</code>
        : <div className="bg-[#020617] border border-slate-800 rounded-lg p-4 my-4 overflow-x-auto"><code className="text-sm font-mono text-slate-300" {...props}>{children}</code></div>
    },
    table: ({node, ...props}: any) => <div className="overflow-x-auto my-6 rounded-lg border border-slate-700"><table className="min-w-full border-collapse" {...props} /></div>,
    thead: ({node, ...props}: any) => <thead className="bg-slate-800 text-slate-200" {...props} />,
    th: ({node, ...props}: any) => <th className="border-b border-slate-700 px-4 py-3 text-left font-bold text-xs uppercase tracking-wider" {...props} />,
    td: ({node, ...props}: any) => <td className="border-b border-slate-800 px-4 py-3 text-sm text-slate-400" {...props} />,
    a: ({node, ...props}: any) => <a className="text-cyan-400 hover:text-cyan-300 hover:underline transition-colors" target="_blank" rel="noreferrer" {...props} />,
  };

  return (
    <div className="h-full flex flex-col">
      <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
            <Book size={28} className="text-cyan-500" />
            CENTRAL DE CONHECIMENTO
          </h1>
          <p className="text-slate-400 max-w-2xl font-light">Repositório oficial de inteligência, procedimentos operacionais e políticas.</p>
        </div>
        {canEdit && (
          <button 
            onClick={handleOpenCreate}
            className="bg-cyan-600 hover:bg-cyan-500 text-white px-5 py-2.5 rounded-lg font-bold uppercase tracking-wider text-xs flex items-center gap-2 transition-all shadow-[0_0_15px_rgba(8,145,178,0.3)] hover:shadow-[0_0_20px_rgba(8,145,178,0.5)]"
          >
            <Plus size={16} /> Novo Documento
          </button>
        )}
      </div>

      {/* Search and Filter Bar */}
      <div className="flex flex-col md:flex-row gap-4 mb-8">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
          <input
            type="text"
            placeholder="PESQUISAR PROTOCOLOS..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-11 pr-4 py-3 bg-[#0B1120] border border-white/10 text-white rounded-lg focus:outline-none focus:border-cyan-500/50 focus:shadow-[0_0_15px_rgba(6,182,212,0.1)] placeholder-slate-600 font-mono text-sm transition-all"
          />
        </div>
        <div className="flex overflow-x-auto pb-2 md:pb-0 gap-2 no-scrollbar">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`
                px-5 py-2 rounded-lg text-xs font-bold uppercase tracking-wider whitespace-nowrap transition-all
                ${selectedCategory === cat 
                  ? 'bg-white/10 text-cyan-400 border border-cyan-500/30 shadow-[0_0_10px_rgba(6,182,212,0.1)]' 
                  : 'bg-[#0B1120] border border-white/5 text-slate-500 hover:text-slate-300 hover:border-white/10'}
              `}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredSOPs.map(sop => (
          <div 
            key={sop.id}
            onClick={(e) => handleCardClick(sop, e)}
            className={`
              bg-[#0B1120]/80 backdrop-blur-sm rounded-xl border border-white/5 overflow-hidden group relative flex flex-col h-full
              hover:border-cyan-500/30 hover:shadow-[0_0_20px_rgba(0,0,0,0.5)] transition-all cursor-pointer
              ${deletingId === sop.id ? 'opacity-60 pointer-events-none' : ''}
            `}
          >
             {/* Glow Effect on Hover */}
             <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>

             {/* Card Header Stripe */}
             <div className={`h-1 w-full relative z-10
                ${sop.category === 'HR' ? 'bg-pink-500 shadow-[0_0_10px_#ec4899]' : 
                  sop.category === 'Tech' ? 'bg-blue-500 shadow-[0_0_10px_#3b82f6]' :
                  sop.category === 'Vendas' ? 'bg-green-500 shadow-[0_0_10px_#22c55e]' : 'bg-indigo-500 shadow-[0_0_10px_#6366f1]'}
             `} />

            <div className="p-6 flex flex-col flex-1 relative z-10">
              <div className="flex items-start justify-between mb-4">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5 border border-white/5 px-2 py-1 rounded bg-white/5">
                  {sop.category}
                </span>
                {canEdit && (
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
                    <button 
                      onClick={(e) => handleOpenEdit(sop, e)} 
                      className="p-1.5 bg-slate-800 hover:bg-slate-700 rounded text-slate-400 hover:text-indigo-400"
                      title="Editar"
                    >
                      <Edit2 size={14} />
                    </button>
                    {renderDeleteButton(sop.id, 14)}
                  </div>
                )}
              </div>
              
              <h3 className="text-lg font-bold text-white mb-3 group-hover:text-cyan-400 transition-colors leading-tight">
                {sop.title}
              </h3>
              
              <p className="text-slate-400 text-sm mb-6 line-clamp-3 flex-1 leading-relaxed font-light">
                {sop.content.replace(/#/g, '').replace(/\*/g, '')}
              </p>
              
              <div className="flex flex-wrap gap-2 mb-4">
                 {sop.tags.slice(0, 3).map(tag => (
                   <span key={tag} className="px-2 py-0.5 bg-slate-900/50 text-slate-500 rounded text-[10px] border border-white/5 font-mono">
                     #{tag}
                   </span>
                 ))}
              </div>

              <div className="pt-4 border-t border-white/5 flex items-center justify-between text-xs text-slate-500 font-mono">
                 <div className="flex items-center gap-2">
                    <Calendar size={12} />
                    <span>{new Date(sop.lastUpdated).toLocaleDateString('pt-BR')}</span>
                 </div>
                 {sop.responsible_department && (
                   <span className="font-bold text-slate-400 uppercase">{sop.responsible_department}</span>
                 )}
              </div>
            </div>
          </div>
        ))}
        
        {filteredSOPs.length === 0 && (
          <div className="col-span-full py-20 text-center">
             <div className="bg-[#0B1120] w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 border border-white/5 shadow-2xl">
                <Search size={32} className="text-slate-600" />
             </div>
            <h3 className="text-slate-200 font-bold text-lg">Nenhum documento localizado.</h3>
            <p className="text-slate-500 text-sm mt-2">Verifique os filtros ou tente um termo diferente.</p>
          </div>
        )}
      </div>

      {/* View SOP Modal */}
      {selectedSOP && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#020617]/90 backdrop-blur-md animate-in fade-in duration-300" onClick={() => setSelectedSOP(null)}>
          <div 
            className="bg-[#0B1120] rounded-2xl w-full max-w-5xl max-h-[90vh] overflow-y-auto shadow-[0_0_50px_rgba(0,0,0,0.5)] border border-white/10 flex flex-col relative"
            onClick={e => e.stopPropagation()}
          >
            {/* Header Actions */}
            <div className="sticky top-0 right-0 left-0 bg-[#0B1120]/95 backdrop-blur border-b border-white/10 px-6 py-4 flex justify-between items-center z-20">
              <div className="flex items-center gap-3">
                 <div className={`w-2.5 h-2.5 rounded-full shadow-[0_0_10px_currentColor]
                    ${selectedSOP.category === 'HR' ? 'bg-pink-500 text-pink-500' : 
                      selectedSOP.category === 'Tech' ? 'bg-blue-500 text-blue-500' :
                      selectedSOP.category === 'Vendas' ? 'bg-green-500 text-green-500' : 'bg-indigo-500 text-indigo-500'}
                 `}></div>
                 <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">{selectedSOP.category} / PROTOCOL VIEW</span>
              </div>
              
              <div className="flex items-center gap-3">
                 {canEdit && (
                   <div className="flex items-center gap-2 mr-4 border-r border-white/10 pr-6">
                      <button 
                        onClick={(e) => handleOpenEdit(selectedSOP, e)}
                        className="p-2 hover:bg-white/5 rounded-lg text-slate-400 hover:text-cyan-400 transition-colors flex items-center gap-2 text-xs font-bold uppercase tracking-wider"
                      >
                        <Edit2 size={14} /> Editar
                      </button>
                      {renderDeleteButton(selectedSOP.id, 14)}
                   </div>
                 )}
                 <button 
                   onClick={() => setSelectedSOP(null)}
                   className="p-2 hover:bg-white/10 rounded-full text-slate-400 hover:text-white transition-colors"
                 >
                   <X size={24} />
                 </button>
              </div>
            </div>

            {/* Main Content */}
            <div className="p-8 md:p-12 max-w-4xl mx-auto w-full">
              
              {/* Document Header */}
              <header className="mb-12 pb-8 border-b border-white/5">
                <h1 className="text-3xl md:text-5xl font-bold text-white mb-8 leading-tight tracking-tight">
                  {selectedSOP.title}
                </h1>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 bg-white/5 p-6 rounded-xl border border-white/5 backdrop-blur-sm">
                  <div className="flex flex-col gap-1.5">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                      <Building2 size={12} /> Departamento
                    </span>
                    <span className="text-cyan-400 font-bold tracking-wide">
                      {selectedSOP.responsible_department || 'GERAL'}
                    </span>
                  </div>
                  
                  <div className="flex flex-col gap-1.5">
                     <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                      <Calendar size={12} /> Última Atualização
                    </span>
                    <span className="text-slate-300 font-mono text-sm">
                      {new Date(selectedSOP.lastUpdated).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
                    </span>
                  </div>

                  {(selectedSOP.responsible_users && selectedSOP.responsible_users.length > 0) && (
                    <div className="sm:col-span-2 flex flex-col gap-2 pt-2 border-t border-white/5 mt-2">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                        <Users size={12} /> Colaboradores Responsáveis
                      </span>
                      <div className="flex flex-wrap gap-3">
                          {getResponsibleUsers(selectedSOP.responsible_users).map((u: any) => (
                            <div key={u.email} className="flex items-center gap-2 bg-[#020617] border border-white/10 pr-3 rounded-full py-1 pl-1">
                              <img 
                                src={u.avatar || `https://ui-avatars.com/api/?name=${u.email}`} 
                                alt={u.name}
                                className="w-6 h-6 rounded-full"
                              />
                              <span className="text-xs text-slate-300 font-medium">{u.name}</span>
                            </div>
                          ))}
                      </div>
                    </div>
                  )}
                </div>
              </header>

              {/* Document Body */}
              <div className="min-h-[200px] text-lg">
                 <ReactMarkdown 
                    remarkPlugins={[remarkGfm]}
                    components={markdownComponents}
                    className="text-slate-300 leading-relaxed font-light"
                 >
                    {selectedSOP.content}
                 </ReactMarkdown>
              </div>

              {/* Footer Tags */}
              {selectedSOP.tags.length > 0 && (
                <div className="mt-16 pt-8 border-t border-white/5">
                  <div className="flex items-center gap-2 mb-4 text-slate-500 text-xs font-bold uppercase tracking-wider">
                    <Tag size={14} />
                    <span>Keywords / Tags</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {selectedSOP.tags.map(tag => (
                      <span key={tag} className="px-3 py-1 bg-white/5 text-slate-400 hover:text-cyan-400 hover:border-cyan-500/50 border border-white/10 rounded text-xs font-mono transition-colors cursor-default">
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Create/Edit Modal */}
      {(isCreating || isEditing) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#020617]/90 backdrop-blur-sm">
          <div className="bg-[#0B1120] rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl border border-white/10 flex flex-col">
            <div className="px-6 py-5 border-b border-white/10 flex items-center justify-between bg-[#0B1120] sticky top-0 z-10">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                {isCreating ? <Plus className="text-cyan-500" /> : <Edit2 className="text-cyan-500" />}
                {isCreating ? 'NOVO PROTOCOLO' : 'EDITAR PROTOCOLO'}
              </h2>
              <button 
                onClick={() => { setIsCreating(false); setIsEditing(false); }}
                className="text-slate-500 hover:text-white transition-colors"
              >
                <X size={24} />
              </button>
            </div>
            
            <div className="p-8 space-y-6">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Título do Documento <span className="text-red-500">*</span>
                </label>
                <input 
                  type="text" 
                  value={formData.title || ''}
                  onChange={e => setFormData({...formData, title: e.target.value})}
                  className="w-full bg-[#020617] border border-white/10 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 focus:outline-none font-medium text-lg placeholder-slate-700 transition-all"
                  placeholder="Ex: POLÍTICA DE VIAGENS 2025"
                />
              </div>

              <div className="grid grid-cols-2 gap-6">
                 <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                    Categoria <span className="text-red-500">*</span>
                  </label>
                  <select 
                    value={formData.category || 'Geral'}
                    onChange={e => setFormData({...formData, category: e.target.value as any})}
                    className="w-full bg-[#020617] border border-white/10 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-cyan-500/50 focus:outline-none appearance-none"
                  >
                    {categories.filter(c => c !== 'Todos').map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                    Setor Responsável <span className="text-red-500">*</span>
                  </label>
                  <select 
                    value={formData.responsible_department || 'Geral'}
                    onChange={e => setFormData({...formData, responsible_department: e.target.value as any})}
                    className="w-full bg-[#020617] border border-white/10 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-cyan-500/50 focus:outline-none appearance-none"
                  >
                    {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Responsáveis</label>
                <div className="bg-[#020617] border border-white/10 rounded-lg p-4 max-h-48 overflow-y-auto custom-scrollbar">
                  {availableUsers.length === 0 ? (
                    <p className="text-xs text-slate-500">Nenhum usuário disponível.</p>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                       {availableUsers.map(u => {
                         const isSelected = (formData.responsible_users || []).includes(u.email);
                         return (
                           <div 
                             key={u.email}
                             onClick={() => toggleResponsibleUser(u.email)}
                             className={`
                               flex items-center gap-3 p-2 rounded cursor-pointer border transition-all select-none
                               ${isSelected 
                                 ? 'bg-cyan-900/20 border-cyan-500/50 text-white' 
                                 : 'bg-[#0B1120] border-white/5 text-slate-400 hover:bg-white/5'}
                             `}
                           >
                             <div className={`w-4 h-4 rounded border flex items-center justify-center ${isSelected ? 'bg-cyan-500 border-cyan-500' : 'border-slate-600'}`}>
                               {isSelected && <Check size={10} className="text-[#020617]" />}
                             </div>
                             <img src={u.avatar} className="w-6 h-6 rounded-full" alt="" />
                             <span className="text-xs truncate flex-1 font-medium">{u.name}</span>
                           </div>
                         );
                       })}
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Tags</label>
                <input 
                  type="text" 
                  value={Array.isArray(formData.tags) ? formData.tags.join(', ') : formData.tags || ''}
                  onChange={e => setFormData({...formData, tags: e.target.value as any})}
                  className="w-full bg-[#020617] border border-white/10 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-cyan-500/50 focus:outline-none font-mono text-sm"
                  placeholder="rh, financeiro, urgente"
                />
              </div>

              <div className="flex flex-col flex-1 min-h-[400px]">
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex justify-between">
                   <span>Conteúdo <span className="text-red-500">*</span></span>
                   <span className="text-[10px] text-cyan-400 font-normal flex items-center gap-1 bg-cyan-900/20 px-2 py-0.5 rounded border border-cyan-500/20">
                     <FileText size={10}/> MARKDOWN ENABLED
                   </span>
                </label>
                <div className="flex-1 relative">
                  <textarea 
                    value={formData.content || ''}
                    onChange={e => setFormData({...formData, content: e.target.value})}
                    className="w-full h-full min-h-[400px] bg-[#020617] border border-white/10 rounded-lg px-5 py-4 text-slate-200 focus:ring-2 focus:ring-cyan-500/50 focus:outline-none font-mono text-sm leading-relaxed custom-scrollbar"
                    placeholder="# Título Principal&#10;&#10;## Subtítulo&#10;&#10;Escreva o procedimento aqui..."
                  />
                </div>
              </div>

              <div className="pt-6 flex justify-end gap-3 border-t border-white/10 mt-6">
                <button 
                  onClick={() => { setIsCreating(false); setIsEditing(false); }}
                  className="px-6 py-3 text-slate-400 hover:text-white font-bold text-xs uppercase tracking-wider transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  onClick={handleSave}
                  className="bg-cyan-600 hover:bg-cyan-500 text-white px-8 py-3 rounded-lg font-bold text-xs uppercase tracking-wider shadow-[0_0_20px_rgba(6,182,212,0.3)] hover:shadow-[0_0_30px_rgba(6,182,212,0.5)] flex items-center gap-2 transition-all"
                >
                  <Save size={16} />
                  Salvar Protocolo
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default KnowledgeBase;