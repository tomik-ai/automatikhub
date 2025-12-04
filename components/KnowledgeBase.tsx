
import React, { useState, useEffect, useRef } from 'react';
import { SOP, User, ProcessDetails } from '../types';
import { UserService } from '../services/userService';
import { DEPARTMENTS } from '../constants';
import { Search, Plus, FileText, Tag, X, Edit2, Trash2, Save, Loader2, Check, AlertTriangle, Building2, Users, Calendar, ArrowRight, Book, ClipboardList, ListTree, Target, Activity, Upload, Filter } from 'lucide-react';
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
  
  // States for Modals
  const [isTypeSelectionOpen, setIsTypeSelectionOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [availableUsers, setAvailableUsers] = useState<User[]>([]);
  
  // Custom Category State
  const [isCustomCategory, setIsCustomCategory] = useState(false);
  const [isCustomDepartment, setIsCustomDepartment] = useState(false);

  // New state for delete confirmation
  const [confirmingDeleteId, setConfirmingDeleteId] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState<Partial<SOP>>({});
  // Specific state for Process Details form
  const [processData, setProcessData] = useState<Partial<ProcessDetails>>({});

  // Ref for file input
  const fileInputRef = useRef<HTMLInputElement>(null);

  const categories = ['Todos', 'HR', 'Tech', 'Vendas', 'Operacional', 'Geral'];
  
  // Permissions
  const isAdminOrMod = user.role === 'admin' || user.role === 'moderator';
  // Membros podem criar processos, mas não documentos padrão. Admins/Mods podem criar ambos.
  const canCreateSomething = true; // Todos podem criar pelo menos processos

  // Load users for selection in form
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
        // Members go directly to Process creation
        startCreate('process');
    }
  };

  const startCreate = (type: 'standard' | 'process') => {
    setIsTypeSelectionOpen(false);
    setFormData({
      title: '',
      category: 'Geral',
      content: '', // For standard, this is body. For process, this is "Description"
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
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    
    // Only admins/mods can edit standard docs or others' processes generally,
    // but for now we follow the general "canEdit" rule for editing. 
    // If strict ownership is needed, we would check user.email vs sop.created_by equivalent.
    if (!isAdminOrMod) {
        // Members typically shouldn't edit approved docs, but if they created a process?
        // For simplicity based on prompt: "Documents only admin and moderators".
        // It implies editing too. 
        if (sop.type === 'standard') {
             alert("Apenas administradores e moderadores podem editar Documentos Padrão.");
             return;
        }
        // Allow members to edit processes? The prompt says "create a process". 
        // We'll allow editing processes for everyone for now to be user friendly, or restrict to Admin/Mod if strict control needed.
        // Assuming member can edit processes for collaborative work.
    }

    setFormData({
      ...sop,
      responsible_users: sop.responsible_users || []
    });
    setProcessData(sop.process_details || {
        objective: '',
        scope_includes: '',
        scope_excludes: '',
        materials: '',
        metrics: '',
        created_by: user.name
    });
    
    setIsCustomCategory(!categories.includes(sop.category));
    setIsCustomDepartment(!DEPARTMENTS.includes(sop.responsible_department as any));
    setIsEditing(true);
    setIsCreating(false);
    setSelectedSOP(null); 
  };

  const handleRequestDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setConfirmingDeleteId(id);
    setTimeout(() => {
      setConfirmingDeleteId(prev => prev === id ? null : prev);
    }, 3000);
  };

  const handleConfirmDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setConfirmingDeleteId(null);
    setDeletingId(id);
    try {
      await onDeleteSOP(id);
      if (selectedSOP?.id === id) {
        setSelectedSOP(null);
      }
    } catch (error) {
      console.error("Error deleting SOP", error);
    } finally {
      setDeletingId(null);
    }
  };

  const handleImportMarkdown = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (text) {
        setFormData(prev => {
          // If title is empty, try to grab H1 from markdown
          let newTitle = prev.title;
          if (!newTitle) {
             const firstLine = text.split('\n')[0];
             if (firstLine.startsWith('# ')) {
               newTitle = firstLine.replace('# ', '').trim();
             }
          }
          return { ...prev, content: text, title: newTitle };
        });
      }
    };
    reader.readAsText(file);
    // Reset value so same file can be selected again
    e.target.value = '';
  };

  const handleSave = () => {
    const missingFields: string[] = [];
    if (!formData.title?.trim()) missingFields.push("Título");
    if (!formData.category) missingFields.push("Categoria");
    if (!formData.content?.trim()) missingFields.push(formData.type === 'process' ? "Descrição do Processo" : "Conteúdo");
    if (!formData.responsible_department) missingFields.push("Setor Responsável");

    if (missingFields.length > 0) {
      alert(`Por favor, preencha os seguintes campos obrigatórios:\n\n- ${missingFields.join('\n- ')}`);
      return;
    }

    const timestamp = new Date().toISOString();
    
    const processedTags = typeof formData.tags === 'string' 
      ? (formData.tags as string).split(',').map((t: string) => t.trim()).filter(t => t !== '') 
      : formData.tags || [];

    const finalSOP: SOP = {
        ...(formData as SOP),
        id: formData.id || Date.now().toString(),
        lastUpdated: timestamp,
        tags: processedTags,
        type: formData.type || 'standard',
        process_details: formData.type === 'process' ? processData as ProcessDetails : undefined
    };

    if (isCreating) {
      onAddSOP(finalSOP);
    } else if (isEditing) {
       onEditSOP(finalSOP);
    }

    setIsCreating(false);
    setIsEditing(false);
    setFormData({});
    setProcessData({});
  };

  const handleCardClick = (sop: SOP, e: React.MouseEvent) => {
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
      return <button disabled className="p-2 rounded bg-slate-800 text-slate-500 cursor-not-allowed"><Loader2 size={size} className="animate-spin" /></button>;
    }
    if (isConfirming) {
      return (
        <button onClick={(e) => handleConfirmDelete(id, e)} className="p-2 rounded bg-red-600 text-white hover:bg-red-700 animate-pulse font-bold flex items-center gap-1">
          <Trash2 size={size} /> <span className="text-[10px] uppercase">Confirmar?</span>
        </button>
      );
    }
    return (
      <button onClick={(e) => handleRequestDelete(id, e)} className="p-2 bg-slate-800/80 hover:bg-red-900/30 rounded text-slate-400 hover:text-red-400 border border-slate-700/50">
        <Trash2 size={size} />
      </button>
    );
  };

  const getResponsibleUsers = (emails?: string[]) => {
    if (!emails || emails.length === 0) return [];
    if (availableUsers.length > 0) {
        return emails.map(email => availableUsers.find(u => u.email === email) || { name: email.split('@')[0], email, avatar: `https://ui-avatars.com/api/?name=${email}&background=random` });
    }
    return emails.map(email => ({ name: email.split('@')[0], email, avatar: `https://ui-avatars.com/api/?name=${email}&background=random` }));
  };

  const canEditSop = (sop: SOP) => {
      if (isAdminOrMod) return true;
      // Members can edit Processes but NOT Documents
      if (sop.type === 'process') return true;
      return false;
  };

  const markdownComponents = {
    h1: ({node, ...props}: any) => <h1 className="text-2xl md:text-3xl font-bold text-white mt-8 mb-4 pb-2 border-b border-white/10" {...props} />,
    h2: ({node, ...props}: any) => <h2 className="text-xl font-bold text-cyan-400 mt-6 mb-3 uppercase tracking-wide" {...props} />,
    h3: ({node, ...props}: any) => <h3 className="text-lg font-semibold text-violet-300 mt-5 mb-2" {...props} />,
    p: ({node, ...props}: any) => <p className="mb-4 whitespace-pre-wrap text-slate-300 leading-relaxed font-light" {...props} />,
    ul: ({node, ...props}: any) => <ul className="list-disc pl-6 space-y-1 my-4 text-slate-300" {...props} />,
    ol: ({node, ...props}: any) => <ol className="list-decimal pl-6 space-y-1 my-4 text-slate-300" {...props} />,
    li: ({node, ...props}: any) => <li className="pl-1" {...props} />,
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
          <p className="text-slate-400 max-w-2xl font-light">Repositório oficial de inteligência, procedimentos operacionais e processos.</p>
        </div>
        {canCreateSomething && (
          <button 
            onClick={handleOpenCreateClick}
            className="bg-cyan-600 hover:bg-cyan-500 text-white px-5 py-2.5 rounded-lg font-bold uppercase tracking-wider text-xs flex items-center gap-2 transition-all shadow-[0_0_15px_rgba(8,145,178,0.3)] hover:shadow-[0_0_20px_rgba(8,145,178,0.5)]"
          >
            <Plus size={16} /> {isAdminOrMod ? 'Novo Documento' : 'Novo Processo'}
          </button>
        )}
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col gap-4 mb-8">
         <div className="flex flex-col md:flex-row gap-4">
             {/* Search */}
            <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                <input
                    type="text"
                    placeholder="PESQUISAR PROTOCOLOS E PROCESSOS..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 bg-[#0B1120] border border-white/10 text-white rounded-lg focus:outline-none focus:border-cyan-500/50 placeholder-slate-600 font-mono text-sm"
                />
            </div>
            
            {/* Type Filter */}
            <div className="flex items-center gap-2 bg-[#0B1120] border border-white/10 p-1 rounded-lg">
                <button 
                    onClick={() => setSelectedType('Todos')} 
                    className={`px-3 py-2 rounded text-xs font-bold uppercase transition-all ${selectedType === 'Todos' ? 'bg-slate-800 text-white' : 'text-slate-500 hover:text-white'}`}
                >
                    Todos
                </button>
                <div className="w-px h-4 bg-white/10"></div>
                <button 
                    onClick={() => setSelectedType('standard')} 
                    className={`px-3 py-2 rounded text-xs font-bold uppercase transition-all flex items-center gap-2 ${selectedType === 'standard' ? 'bg-cyan-900/30 text-cyan-400' : 'text-slate-500 hover:text-cyan-400'}`}
                >
                    <FileText size={14}/> Documentos
                </button>
                <button 
                    onClick={() => setSelectedType('process')} 
                    className={`px-3 py-2 rounded text-xs font-bold uppercase transition-all flex items-center gap-2 ${selectedType === 'process' ? 'bg-violet-900/30 text-violet-400' : 'text-slate-500 hover:text-violet-400'}`}
                >
                    <ListTree size={14}/> Processos
                </button>
            </div>
         </div>

        {/* Categories */}
        <div className="flex overflow-x-auto pb-2 gap-2 no-scrollbar">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`
                px-5 py-2 rounded-lg text-xs font-bold uppercase tracking-wider whitespace-nowrap transition-all
                ${selectedCategory === cat 
                  ? 'bg-white/10 text-cyan-400 border border-cyan-500/30' 
                  : 'bg-[#0B1120] border border-white/5 text-slate-500 hover:text-white'}
              `}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
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
             <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>

             <div className={`h-1 w-full relative z-10 ${sop.category === 'HR' ? 'bg-pink-500' : sop.category === 'Tech' ? 'bg-blue-500' : sop.category === 'Vendas' ? 'bg-green-500' : 'bg-indigo-500'} shadow-[0_0_10px_currentColor]`} />

            <div className="p-6 flex flex-col flex-1 relative z-10">
              <div className="flex items-start justify-between mb-4">
                <div className="flex gap-2">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5 border border-white/5 px-2 py-1 rounded bg-white/5">
                    {sop.category}
                    </span>
                    {sop.type === 'process' && (
                        <span className="text-[10px] font-bold text-violet-400 uppercase tracking-widest flex items-center gap-1.5 border border-violet-500/20 px-2 py-1 rounded bg-violet-500/10">
                            <ListTree size={10} /> Processo
                        </span>
                    )}
                </div>
                {canEditSop(sop) && (
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
                    <button onClick={(e) => handleOpenEdit(sop, e)} className="p-1.5 bg-slate-800 hover:bg-slate-700 rounded text-slate-400 hover:text-indigo-400">
                      <Edit2 size={14} />
                    </button>
                    {renderDeleteButton(sop.id, 14)}
                  </div>
                )}
              </div>
              
              <h3 className="text-lg font-bold text-white mb-3 group-hover:text-cyan-400 transition-colors leading-tight">{sop.title}</h3>
              
              <p className="text-slate-400 text-sm mb-6 line-clamp-3 flex-1 leading-relaxed font-light">
                {sop.type === 'process' && sop.process_details?.objective ? sop.process_details.objective : sop.content.replace(/#/g, '').replace(/\*/g, '')}
              </p>
              
              <div className="flex flex-wrap gap-2 mb-4">
                 {sop.tags.slice(0, 3).map(tag => (
                   <span key={tag} className="px-2 py-0.5 bg-slate-900/50 text-slate-500 rounded text-[10px] border border-white/5 font-mono">#{tag}</span>
                 ))}
              </div>

              <div className="pt-4 border-t border-white/5 flex items-center justify-between text-xs text-slate-500 font-mono">
                 <div className="flex items-center gap-2"><Calendar size={12} /><span>{new Date(sop.lastUpdated).toLocaleDateString('pt-BR')}</span></div>
                 {sop.responsible_department && <span className="font-bold text-slate-400 uppercase">{sop.responsible_department}</span>}
              </div>
            </div>
          </div>
        ))}
        
        {filteredSOPs.length === 0 && (
          <div className="col-span-full py-20 text-center">
            <h3 className="text-slate-200 font-bold text-lg">Nenhum documento localizado.</h3>
          </div>
        )}
      </div>

      {/* Type Selection Modal (Only for Admin/Mod) */}
      {isTypeSelectionOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#0B1120] rounded-2xl w-full max-w-lg border border-white/10 p-8 relative">
             <button onClick={() => setIsTypeSelectionOpen(false)} className="absolute top-4 right-4 text-slate-500 hover:text-white"><X size={24} /></button>
             <h2 className="text-2xl font-bold text-white mb-6 text-center">O que você deseja criar?</h2>
             
             <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <button 
                  onClick={() => startCreate('standard')}
                  className="bg-slate-900 hover:bg-slate-800 border border-white/10 hover:border-cyan-500/50 p-6 rounded-xl flex flex-col items-center gap-4 transition-all group"
                >
                    <div className="w-16 h-16 rounded-full bg-cyan-900/20 flex items-center justify-center group-hover:bg-cyan-500/20 transition-colors">
                        <FileText size={32} className="text-cyan-500" />
                    </div>
                    <div className="text-center">
                        <h3 className="font-bold text-white text-lg mb-1">Documento Padrão</h3>
                        <p className="text-slate-400 text-xs">Políticas, manuais gerais e artigos de conhecimento.</p>
                    </div>
                </button>

                <button 
                  onClick={() => startCreate('process')}
                  className="bg-slate-900 hover:bg-slate-800 border border-white/10 hover:border-violet-500/50 p-6 rounded-xl flex flex-col items-center gap-4 transition-all group"
                >
                    <div className="w-16 h-16 rounded-full bg-violet-900/20 flex items-center justify-center group-hover:bg-violet-500/20 transition-colors">
                        <ListTree size={32} className="text-violet-500" />
                    </div>
                    <div className="text-center">
                        <h3 className="font-bold text-white text-lg mb-1">Processo Estruturado</h3>
                        <p className="text-slate-400 text-xs">Fluxos passo-a-passo, escopo definido e responsáveis.</p>
                    </div>
                </button>
             </div>
          </div>
        </div>
      )}

      {/* View SOP Modal */}
      {selectedSOP && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#020617]/90 backdrop-blur-md animate-in fade-in duration-300" onClick={() => setSelectedSOP(null)}>
          <div className="bg-[#0B1120] rounded-2xl w-full max-w-5xl max-h-[90vh] overflow-y-auto shadow-[0_0_50px_rgba(0,0,0,0.5)] border border-white/10 flex flex-col relative" onClick={e => e.stopPropagation()}>
            {/* Header */}
            <div className="sticky top-0 right-0 left-0 bg-[#0B1120]/95 backdrop-blur border-b border-white/10 px-6 py-4 flex justify-between items-center z-20">
              <div className="flex items-center gap-3">
                 <div className={`w-2.5 h-2.5 rounded-full shadow-[0_0_10px_currentColor] ${selectedSOP.category === 'HR' ? 'bg-pink-500 text-pink-500' : 'bg-cyan-500 text-cyan-500'}`}></div>
                 <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                    {selectedSOP.category} / {selectedSOP.type === 'process' ? 'PROCESS VIEW' : 'PROTOCOL VIEW'}
                 </span>
              </div>
              <div className="flex items-center gap-3">
                 {canEditSop(selectedSOP) && (
                   <div className="flex items-center gap-2 mr-4 border-r border-white/10 pr-6">
                      <button onClick={(e) => handleOpenEdit(selectedSOP, e)} className="p-2 hover:bg-white/5 rounded-lg text-slate-400 hover:text-cyan-400 transition-colors flex items-center gap-2 text-xs font-bold uppercase tracking-wider">
                        <Edit2 size={14} /> Editar
                      </button>
                      {renderDeleteButton(selectedSOP.id, 14)}
                   </div>
                 )}
                 <button onClick={() => setSelectedSOP(null)} className="p-2 hover:bg-white/10 rounded-full text-slate-400 hover:text-white transition-colors"><X size={24} /></button>
              </div>
            </div>

            {/* Content */}
            <div className="p-8 md:p-12 max-w-4xl mx-auto w-full">
              <header className="mb-12 pb-8 border-b border-white/5">
                <h1 className="text-3xl md:text-5xl font-bold text-white mb-8 leading-tight tracking-tight">{selectedSOP.title}</h1>
                
                {/* Meta Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 bg-white/5 p-6 rounded-xl border border-white/5 backdrop-blur-sm">
                  <div className="flex flex-col gap-1.5">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2"><Building2 size={12} /> Departamento</span>
                    <span className="text-cyan-400 font-bold tracking-wide">{selectedSOP.responsible_department || 'GERAL'}</span>
                  </div>
                  <div className="flex flex-col gap-1.5">
                     <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2"><Calendar size={12} /> Atualização</span>
                    <span className="text-slate-300 font-mono text-sm">{new Date(selectedSOP.lastUpdated).toLocaleDateString()}</span>
                  </div>
                  {(selectedSOP.responsible_users && selectedSOP.responsible_users.length > 0) && (
                    <div className="sm:col-span-2 flex flex-col gap-2 pt-2 border-t border-white/5 mt-2">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2"><Users size={12} /> Responsáveis</span>
                      <div className="flex flex-wrap gap-3">
                          {getResponsibleUsers(selectedSOP.responsible_users).map((u: any) => (
                            <div key={u.email} className="flex items-center gap-2 bg-[#020617] border border-white/10 pr-3 rounded-full py-1 pl-1">
                              <img src={u.avatar} alt={u.name} className="w-6 h-6 rounded-full" />
                              <span className="text-xs text-slate-300 font-medium">{u.name}</span>
                            </div>
                          ))}
                      </div>
                    </div>
                  )}
                </div>
              </header>

              {/* PROCESS SPECIFIC FIELDS */}
              {selectedSOP.type === 'process' && selectedSOP.process_details && (
                  <div className="mb-12 space-y-8">
                      <div className="bg-indigo-900/10 border border-indigo-500/20 p-6 rounded-xl">
                          <h3 className="text-sm font-bold text-indigo-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                              <Target size={16}/> Objetivo
                          </h3>
                          <p className="text-slate-300">{selectedSOP.process_details.objective}</p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="bg-slate-900/50 p-6 rounded-xl border border-white/5">
                             <h3 className="text-xs font-bold text-green-400 uppercase tracking-widest mb-3 border-b border-white/5 pb-2">O que inclui</h3>
                             <p className="text-sm text-slate-400 whitespace-pre-wrap">{selectedSOP.process_details.scope_includes}</p>
                          </div>
                          <div className="bg-slate-900/50 p-6 rounded-xl border border-white/5">
                             <h3 className="text-xs font-bold text-red-400 uppercase tracking-widest mb-3 border-b border-white/5 pb-2">O que não inclui</h3>
                             <p className="text-sm text-slate-400 whitespace-pre-wrap">{selectedSOP.process_details.scope_excludes}</p>
                          </div>
                      </div>

                      {/* Criado Por */}
                      {selectedSOP.process_details.created_by && (
                          <div className="text-xs text-slate-500 font-mono">
                              Criado originalmente por: <span className="text-slate-300">{selectedSOP.process_details.created_by}</span>
                          </div>
                      )}
                  </div>
              )}

              {/* Main Body / Step by Step */}
              <div className="min-h-[200px] text-lg">
                 {selectedSOP.type === 'process' && <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2"><ListTree className="text-cyan-500"/> Descrição do Processo (Passo a Passo)</h3>}
                 <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents} className="text-slate-300 leading-relaxed font-light">
                    {selectedSOP.content}
                 </ReactMarkdown>
              </div>

              {/* Process Extras */}
              {selectedSOP.type === 'process' && selectedSOP.process_details && (
                  <div className="mt-12 space-y-8 pt-8 border-t border-white/5">
                       {selectedSOP.process_details.materials && (
                           <div>
                               <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2"><ClipboardList className="text-violet-500"/> Materiais / Links / Arquivos</h3>
                               <div className="bg-slate-900/30 p-6 rounded-xl border border-white/5 whitespace-pre-wrap text-slate-400 text-sm">{selectedSOP.process_details.materials}</div>
                           </div>
                       )}
                       {selectedSOP.process_details.metrics && (
                           <div>
                               <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2"><Activity className="text-green-500"/> Métricas de Qualidade</h3>
                               <div className="bg-slate-900/30 p-6 rounded-xl border border-white/5 whitespace-pre-wrap text-slate-400 text-sm">{selectedSOP.process_details.metrics}</div>
                           </div>
                       )}
                  </div>
              )}

              {/* Tags */}
              {selectedSOP.tags.length > 0 && (
                <div className="mt-16 pt-8 border-t border-white/5">
                  <div className="flex items-center gap-2 mb-4 text-slate-500 text-xs font-bold uppercase tracking-wider"><Tag size={14} /><span>Keywords</span></div>
                  <div className="flex flex-wrap gap-2">
                    {selectedSOP.tags.map(tag => (
                      <span key={tag} className="px-3 py-1 bg-white/5 text-slate-400 border border-white/10 rounded text-xs font-mono">#{tag}</span>
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
          <div className="bg-[#0B1120] rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl border border-white/10 flex flex-col">
            <div className="px-6 py-5 border-b border-white/10 flex items-center justify-between bg-[#0B1120] sticky top-0 z-10">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                {isCreating ? <Plus className="text-cyan-500" /> : <Edit2 className="text-cyan-500" />}
                {isCreating ? (formData.type === 'process' ? 'NOVO PROCESSO' : 'NOVO DOCUMENTO') : (formData.type === 'process' ? 'EDITAR PROCESSO' : 'EDITAR DOCUMENTO')}
              </h2>
              <button onClick={() => { setIsCreating(false); setIsEditing(false); }} className="text-slate-500 hover:text-white"><X size={24} /></button>
            </div>
            
            <div className="p-8 space-y-8">
              {/* Common Fields */}
              <div className="space-y-6">
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Título do {formData.type === 'process' ? 'Processo' : 'Documento'} <span className="text-red-500">*</span></label>
                    <input type="text" value={formData.title || ''} onChange={e => setFormData({...formData, title: e.target.value})} className="w-full bg-[#020617] border border-white/10 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-cyan-500/50 focus:outline-none font-medium text-lg" placeholder={formData.type === 'process' ? "Ex: FLUXO DE COMPRA" : "Ex: POLÍTICA DE FÉRIAS"} />
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    <div>
                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Categoria <span className="text-red-500">*</span></label>
                        {isCustomCategory ? (
                            <div className="flex gap-2">
                                <input type="text" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value as any})} className="w-full bg-[#020617] border border-white/10 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-cyan-500/50" placeholder="Nova Categoria..." />
                                <button onClick={() => setIsCustomCategory(false)} className="px-3 bg-slate-800 rounded-lg text-slate-400 hover:text-white"><X size={16}/></button>
                            </div>
                        ) : (
                            <select value={formData.category || 'Geral'} onChange={e => e.target.value === 'new_custom' ? (setIsCustomCategory(true), setFormData({...formData, category: '' as any})) : setFormData({...formData, category: e.target.value as any})} className="w-full bg-[#020617] border border-white/10 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-cyan-500/50 appearance-none">
                                {categories.filter(c => c !== 'Todos').map(c => <option key={c} value={c}>{c}</option>)}
                                <option value="new_custom">+ Outro...</option>
                            </select>
                        )}
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Setor Responsável <span className="text-red-500">*</span></label>
                        {isCustomDepartment ? (
                            <div className="flex gap-2">
                                <input type="text" value={formData.responsible_department} onChange={e => setFormData({...formData, responsible_department: e.target.value as any})} className="w-full bg-[#020617] border border-white/10 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-cyan-500/50" placeholder="Novo Setor..." />
                                <button onClick={() => setIsCustomDepartment(false)} className="px-3 bg-slate-800 rounded-lg text-slate-400 hover:text-white"><X size={16}/></button>
                            </div>
                        ) : (
                            <select value={formData.responsible_department || 'Geral'} onChange={e => e.target.value === 'new_custom' ? (setIsCustomDepartment(true), setFormData({...formData, responsible_department: '' as any})) : setFormData({...formData, responsible_department: e.target.value as any})} className="w-full bg-[#020617] border border-white/10 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-cyan-500/50 appearance-none">
                                {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                                <option value="new_custom">+ Outro...</option>
                            </select>
                        )}
                    </div>
                  </div>
              </div>

              {/* PROCESS SPECIFIC FIELDS */}
              {formData.type === 'process' && (
                  <div className="space-y-6 pt-6 border-t border-white/10">
                      <h3 className="text-white font-bold text-sm uppercase tracking-wide flex items-center gap-2"><ListTree size={16}/> Detalhes do Processo</h3>
                      
                      <div>
                          <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Objetivo do Documento (1-2 linhas)</label>
                          <textarea value={processData.objective || ''} onChange={e => setProcessData({...processData, objective: e.target.value})} className="w-full bg-[#020617] border border-white/10 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-cyan-500/50 h-20 text-sm" placeholder="Ex: Padronizar o processo de envio de relatórios..." />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                           <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Escopo (Inclui)</label>
                                <textarea value={processData.scope_includes || ''} onChange={e => setProcessData({...processData, scope_includes: e.target.value})} className="w-full bg-[#020617] border border-white/10 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-cyan-500/50 h-24 text-sm" placeholder="O que este processo cobre..." />
                           </div>
                           <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Escopo (Não Inclui)</label>
                                <textarea value={processData.scope_excludes || ''} onChange={e => setProcessData({...processData, scope_excludes: e.target.value})} className="w-full bg-[#020617] border border-white/10 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-cyan-500/50 h-24 text-sm" placeholder="Limitações do processo..." />
                           </div>
                      </div>

                       {/* Criado Por (Visual Field) */}
                       <div>
                            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Criado Por</label>
                            <input type="text" value={processData.created_by || ''} onChange={e => setProcessData({...processData, created_by: e.target.value})} className="w-full bg-[#020617] border border-white/10 rounded-lg px-4 py-3 text-slate-300 focus:ring-2 focus:ring-cyan-500/50 text-sm" />
                       </div>
                  </div>
              )}

              {/* Responsibles Selection */}
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">{formData.type === 'process' ? 'Executores / Responsáveis' : 'Colaboradores Envolvidos'}</label>
                <div className="bg-[#020617] border border-white/10 rounded-lg p-4 max-h-48 overflow-y-auto custom-scrollbar">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                       {availableUsers.map(u => {
                         const isSelected = (formData.responsible_users || []).includes(u.email);
                         return (
                           <div key={u.email} onClick={() => toggleResponsibleUser(u.email)} className={`flex items-center gap-3 p-2 rounded cursor-pointer border transition-all select-none ${isSelected ? 'bg-cyan-900/20 border-cyan-500/50 text-white' : 'bg-[#0B1120] border-white/5 text-slate-400 hover:bg-white/5'}`}>
                             <div className={`w-4 h-4 rounded border flex items-center justify-center ${isSelected ? 'bg-cyan-500 border-cyan-500' : 'border-slate-600'}`}>{isSelected && <Check size={10} className="text-[#020617]" />}</div>
                             <img src={u.avatar} className="w-6 h-6 rounded-full" alt="" />
                             <span className="text-xs truncate flex-1 font-medium">{u.name}</span>
                           </div>
                         );
                       })}
                    </div>
                </div>
              </div>

              {/* Main Content Area */}
              <div className="flex flex-col flex-1">
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex justify-between">
                   <span>{formData.type === 'process' ? 'Descrição do Processo (Passo a Passo)' : 'Conteúdo'} <span className="text-red-500">*</span></span>
                   <div className="flex items-center gap-3">
                      <button 
                         onClick={() => fileInputRef.current?.click()}
                         className="text-[10px] text-cyan-400 hover:text-white font-normal flex items-center gap-1 bg-cyan-900/10 hover:bg-cyan-900/30 px-2 py-0.5 rounded border border-cyan-500/20 transition-colors"
                      >
                         <Upload size={10}/> IMPORTAR .MD
                      </button>
                      <input 
                         type="file" 
                         ref={fileInputRef} 
                         className="hidden" 
                         accept=".md,.txt" 
                         onChange={handleImportMarkdown} 
                      />
                      <span className="text-[10px] text-cyan-400 font-normal flex items-center gap-1 bg-cyan-900/20 px-2 py-0.5 rounded border border-cyan-500/20"><FileText size={10}/> MARKDOWN ENABLED</span>
                   </div>
                </label>
                <textarea value={formData.content || ''} onChange={e => setFormData({...formData, content: e.target.value})} className="w-full min-h-[300px] bg-[#020617] border border-white/10 rounded-lg px-5 py-4 text-slate-200 focus:ring-2 focus:ring-cyan-500/50 focus:outline-none font-mono text-sm leading-relaxed custom-scrollbar" placeholder={formData.type === 'process' ? "1. Acesse o sistema...\n2. Faça o login..." : "Escreva o documento aqui..."} />
              </div>

              {/* Process Extras (Bottom) */}
              {formData.type === 'process' && (
                  <div className="space-y-6 pt-6 border-t border-white/10">
                      <div>
                          <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Materiais / Links / Arquivos</label>
                          <textarea value={processData.materials || ''} onChange={e => setProcessData({...processData, materials: e.target.value})} className="w-full bg-[#020617] border border-white/10 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-cyan-500/50 h-24 text-sm" placeholder="Links de modelos, anexos necessários..." />
                      </div>
                      <div>
                          <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Métricas ou Critérios de Qualidade</label>
                          <textarea value={processData.metrics || ''} onChange={e => setProcessData({...processData, metrics: e.target.value})} className="w-full bg-[#020617] border border-white/10 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-cyan-500/50 h-24 text-sm" placeholder="Como saber se o processo foi feito certo? Ex: Prazo cumprido..." />
                      </div>
                  </div>
              )}

              {/* Tags */}
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Tags</label>
                <input type="text" value={Array.isArray(formData.tags) ? formData.tags.join(', ') : formData.tags || ''} onChange={e => setFormData({...formData, tags: e.target.value as any})} className="w-full bg-[#020617] border border-white/10 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-cyan-500/50 focus:outline-none font-mono text-sm" placeholder="rh, financeiro, urgente" />
              </div>

              {/* Footer Actions */}
              <div className="pt-6 flex justify-end gap-3 border-t border-white/10 mt-6 sticky bottom-0 bg-[#0B1120] py-4">
                <button onClick={() => { setIsCreating(false); setIsEditing(false); }} className="px-6 py-3 text-slate-400 hover:text-white font-bold text-xs uppercase tracking-wider transition-colors">Cancelar</button>
                <button onClick={handleSave} className="bg-cyan-600 hover:bg-cyan-500 text-white px-8 py-3 rounded-lg font-bold text-xs uppercase tracking-wider shadow-[0_0_20px_rgba(6,182,212,0.3)] hover:shadow-[0_0_30px_rgba(6,182,212,0.5)] flex items-center gap-2 transition-all">
                  <Save size={16} /> Salvar {formData.type === 'process' ? 'Processo' : 'Protocolo'}
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
