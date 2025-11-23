import React, { useState, useEffect } from 'react';
import { SOP, User } from '../types';
import { UserService } from '../services/userService';
import { DEPARTMENTS } from '../constants';
import { Search, Plus, FileText, Tag, X, Edit2, Trash2, Save, Loader2, Check, AlertTriangle, Building2, Users, Calendar, ArrowRight, Upload } from 'lucide-react';
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
      // Error is handled by parent via alert, but we clear state here
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

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result;
      if (typeof text === 'string') {
        // Replace content with file content
        setFormData(prev => ({ ...prev, content: text }));
      }
    };
    reader.readAsText(file);
    
    // Reset input value to allow selecting the same file again if needed
    e.target.value = '';
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
        className={`p-2 bg-slate-800 hover:bg-red-900/30 rounded text-slate-400 hover:text-red-400 transition-colors shadow-sm border border-slate-700`}
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

  // --- COMPONENTS FOR MARKDOWN ---
  // These custom components fix the issue where Titles/Lists weren't rendering distinctly
  const markdownComponents = {
    h1: ({node, ...props}: any) => <h1 className="text-3xl font-bold text-white mt-8 mb-4 pb-2 border-b border-slate-700" {...props} />,
    h2: ({node, ...props}: any) => <h2 className="text-2xl font-semibold text-indigo-400 mt-6 mb-3" {...props} />,
    h3: ({node, ...props}: any) => <h3 className="text-xl font-medium text-slate-200 mt-5 mb-2" {...props} />,
    p: ({node, ...props}: any) => <p className="mb-4 whitespace-pre-wrap text-slate-300 leading-relaxed" {...props} />,
    ul: ({node, ...props}: any) => <ul className="list-disc pl-6 space-y-1 my-4 text-slate-300" {...props} />,
    ol: ({node, ...props}: any) => <ol className="list-decimal pl-6 space-y-1 my-4 text-slate-300" {...props} />,
    li: ({node, ...props}: any) => <li className="pl-1" {...props} />,
    strong: ({node, ...props}: any) => <strong className="font-bold text-white" {...props} />,
    blockquote: ({node, ...props}: any) => <blockquote className="border-l-4 border-indigo-500 pl-4 italic text-slate-400 my-4 bg-slate-800/30 p-2 rounded-r" {...props} />,
    code: ({node, inline, className, children, ...props}: any) => {
       return inline 
        ? <code className="bg-slate-800 text-indigo-300 px-1.5 py-0.5 rounded text-sm font-mono" {...props}>{children}</code>
        : <div className="bg-slate-950 border border-slate-800 rounded-lg p-4 my-4 overflow-x-auto"><code className="text-sm font-mono text-slate-300" {...props}>{children}</code></div>
    },
    table: ({node, ...props}: any) => <div className="overflow-x-auto my-6"><table className="min-w-full border-collapse border border-slate-700" {...props} /></div>,
    thead: ({node, ...props}: any) => <thead className="bg-slate-800 text-slate-200" {...props} />,
    th: ({node, ...props}: any) => <th className="border border-slate-700 px-4 py-2 text-left font-semibold" {...props} />,
    td: ({node, ...props}: any) => <td className="border border-slate-700 px-4 py-2 text-slate-400" {...props} />,
    a: ({node, ...props}: any) => <a className="text-indigo-400 hover:underline" target="_blank" rel="noreferrer" {...props} />,
  };

  return (
    <div className="h-full flex flex-col">
      <div className="mb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white mb-2">Central de Conhecimento</h1>
          <p className="text-slate-400">Encontre procedimentos operacionais, políticas e guias.</p>
        </div>
        {canEdit && (
          <button 
            onClick={handleOpenCreate}
            className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors shadow-lg shadow-indigo-500/20"
          >
            <Plus size={18} /> Novo Documento
          </button>
        )}
      </div>

      {/* Search and Filter Bar */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={20} />
          <input
            type="text"
            placeholder="Buscar documentos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-800 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent placeholder-slate-500"
          />
        </div>
        <div className="flex overflow-x-auto pb-2 md:pb-0 gap-2 no-scrollbar">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`
                px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors
                ${selectedCategory === cat 
                  ? 'bg-indigo-600 text-white' 
                  : 'bg-slate-900 border border-slate-800 text-slate-400 hover:bg-slate-800 hover:text-white'}
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
              bg-slate-900 rounded-xl border border-slate-800 p-0 overflow-hidden
              hover:shadow-xl hover:border-indigo-500/40 transition-all cursor-pointer flex flex-col h-full group relative
              ${deletingId === sop.id ? 'opacity-60 pointer-events-none' : ''}
            `}
          >
             {/* Card Header Stripe */}
             <div className={`h-1.5 w-full 
                ${sop.category === 'HR' ? 'bg-pink-500' : 
                  sop.category === 'Tech' ? 'bg-blue-500' :
                  sop.category === 'Vendas' ? 'bg-green-500' : 'bg-indigo-500'}
             `} />

            <div className="p-5 flex flex-col flex-1">
              <div className="flex items-start justify-between mb-3">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
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
              
              <h3 className="text-xl font-bold text-white mb-3 group-hover:text-indigo-400 transition-colors leading-tight">
                {sop.title}
              </h3>
              
              {/* Preview uses line-clamp */}
              <p className="text-slate-400 text-sm mb-4 line-clamp-3 flex-1 leading-relaxed">
                {sop.content.replace(/#/g, '').replace(/\*/g, '')}
              </p>
              
              <div className="flex flex-wrap gap-2 mb-4">
                 {sop.tags.slice(0, 3).map(tag => (
                   <span key={tag} className="px-2 py-0.5 bg-slate-800/50 text-slate-400 rounded text-[10px] border border-slate-800">
                     #{tag}
                   </span>
                 ))}
              </div>

              <div className="pt-4 border-t border-slate-800/50 flex items-center justify-between text-xs text-slate-500">
                 <div className="flex items-center gap-2">
                    <Calendar size={12} />
                    <span>{new Date(sop.lastUpdated).toLocaleDateString('pt-BR')}</span>
                 </div>
                 {sop.responsible_department && (
                   <span className="font-medium text-slate-400">{sop.responsible_department}</span>
                 )}
              </div>
            </div>
          </div>
        ))}
        
        {filteredSOPs.length === 0 && (
          <div className="col-span-full text-center py-16">
             <div className="bg-slate-900 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-800">
                <Search size={32} className="text-slate-600" />
             </div>
            <p className="text-slate-400 font-medium">Nenhum documento encontrado.</p>
            <p className="text-slate-600 text-sm mt-1">Tente buscar por outro termo ou categoria.</p>
          </div>
        )}
      </div>

      {/* View SOP Modal - REDESIGNED */}
      {selectedSOP && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setSelectedSOP(null)}>
          <div 
            className="bg-slate-950 rounded-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-800 flex flex-col relative"
            onClick={e => e.stopPropagation()}
          >
            {/* Header Actions */}
            <div className="sticky top-0 right-0 left-0 bg-slate-950/95 backdrop-blur border-b border-slate-800 px-6 py-4 flex justify-between items-center z-20">
              <div className="flex items-center gap-2">
                 <div className={`w-2 h-2 rounded-full 
                    ${selectedSOP.category === 'HR' ? 'bg-pink-500' : 
                      selectedSOP.category === 'Tech' ? 'bg-blue-500' :
                      selectedSOP.category === 'Vendas' ? 'bg-green-500' : 'bg-indigo-500'}
                 `}></div>
                 <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">{selectedSOP.category}</span>
              </div>
              
              <div className="flex items-center gap-2">
                 {canEdit && (
                   <div className="flex items-center gap-1 mr-2 border-r border-slate-800 pr-3">
                      <button 
                        onClick={(e) => handleOpenEdit(selectedSOP, e)}
                        className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-indigo-400 transition-colors flex items-center gap-2 text-sm font-medium"
                      >
                        <Edit2 size={16} /> Editar
                      </button>
                      {renderDeleteButton(selectedSOP.id, 16)}
                   </div>
                 )}
                 <button 
                   onClick={() => setSelectedSOP(null)}
                   className="p-2 hover:bg-slate-800 rounded-full text-slate-400 hover:text-white transition-colors"
                 >
                   <X size={24} />
                 </button>
              </div>
            </div>

            {/* Main Scrollable Content */}
            <div className="p-8 md:p-12 max-w-3xl mx-auto w-full">
              
              {/* Document Header Section */}
              <header className="mb-10 pb-8 border-b border-slate-800">
                <h1 className="text-3xl md:text-4xl font-bold text-white mb-6 leading-tight">
                  {selectedSOP.title}
                </h1>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 bg-slate-900/50 p-6 rounded-xl border border-slate-800/50">
                  <div className="flex flex-col gap-1">
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-2">
                      <Building2 size={14} /> Departamento
                    </span>
                    <span className="text-slate-200 font-medium">
                      {selectedSOP.responsible_department || 'Geral'}
                    </span>
                  </div>
                  
                  <div className="flex flex-col gap-1">
                     <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-2">
                      <Calendar size={14} /> Última Atualização
                    </span>
                    <span className="text-slate-200 font-medium">
                      {new Date(selectedSOP.lastUpdated).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
                    </span>
                  </div>

                  {(selectedSOP.responsible_users && selectedSOP.responsible_users.length > 0) && (
                    <div className="sm:col-span-2 flex flex-col gap-2">
                      <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                        <Users size={14} /> Colaboradores Responsáveis
                      </span>
                      <div className="flex flex-wrap gap-3">
                          {getResponsibleUsers(selectedSOP.responsible_users).map((u: any) => (
                            <div key={u.email} className="flex items-center gap-2 bg-slate-800 pr-3 rounded-full">
                              <img 
                                src={u.avatar || `https://ui-avatars.com/api/?name=${u.email}`} 
                                alt={u.name}
                                className="w-8 h-8 rounded-full"
                              />
                              <span className="text-sm text-slate-300 font-medium">{u.name}</span>
                            </div>
                          ))}
                      </div>
                    </div>
                  )}
                </div>
              </header>

              {/* Document Body */}
              <div className="min-h-[200px]">
                 {/* Using Custom Markdown Components for better rendering */}
                 <ReactMarkdown 
                    remarkPlugins={[remarkGfm]}
                    components={markdownComponents}
                    className="text-slate-300 leading-relaxed"
                 >
                    {selectedSOP.content}
                 </ReactMarkdown>
              </div>

              {/* Footer Tags */}
              {selectedSOP.tags.length > 0 && (
                <div className="mt-16 pt-6 border-t border-slate-800">
                  <div className="flex items-center gap-2 mb-3 text-slate-500 text-sm">
                    <Tag size={16} />
                    <span>Tags Relacionadas</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {selectedSOP.tags.map(tag => (
                      <span key={tag} className="px-3 py-1 bg-slate-900 text-slate-400 hover:text-indigo-400 hover:border-indigo-500/50 border border-slate-800 rounded-full text-sm transition-colors cursor-default">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Create/Edit SOP Modal */}
      {(isCreating || isEditing) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-slate-900 rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-800 flex flex-col">
            <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900 sticky top-0 z-10">
              <h2 className="text-xl font-bold text-white">{isCreating ? 'Novo Documento' : 'Editar Documento'}</h2>
              <button 
                onClick={() => { setIsCreating(false); setIsEditing(false); }}
                className="text-slate-400 hover:text-white"
              >
                <X size={24} />
              </button>
            </div>
            
            <div className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">
                  Título <span className="text-red-500">*</span>
                </label>
                <input 
                  type="text" 
                  value={formData.title || ''}
                  onChange={e => setFormData({...formData, title: e.target.value})}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none font-medium text-lg"
                  placeholder="Ex: Política de Viagens"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                 <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1">
                    Categoria <span className="text-red-500">*</span>
                  </label>
                  <select 
                    value={formData.category || 'Geral'}
                    onChange={e => setFormData({...formData, category: e.target.value as any})}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  >
                    {categories.filter(c => c !== 'Todos').map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1">
                    Setor Responsável <span className="text-red-500">*</span>
                  </label>
                  <select 
                    value={formData.responsible_department || 'Geral'}
                    onChange={e => setFormData({...formData, responsible_department: e.target.value as any})}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  >
                    {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">Responsáveis pelo SOP</label>
                <div className="bg-slate-950 border border-slate-800 rounded-lg p-3 max-h-40 overflow-y-auto">
                  {availableUsers.length === 0 ? (
                    <p className="text-xs text-slate-500 p-2">Nenhum usuário encontrado para selecionar.</p>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                       {availableUsers.map(u => {
                         const isSelected = (formData.responsible_users || []).includes(u.email);
                         return (
                           <div 
                             key={u.email}
                             onClick={() => toggleResponsibleUser(u.email)}
                             className={`
                               flex items-center gap-2 p-2 rounded cursor-pointer border transition-all
                               ${isSelected 
                                 ? 'bg-indigo-900/30 border-indigo-500/50 text-white' 
                                 : 'bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-800'}
                             `}
                           >
                             <div className={`w-4 h-4 rounded border flex items-center justify-center ${isSelected ? 'bg-indigo-500 border-indigo-500' : 'border-slate-600'}`}>
                               {isSelected && <Check size={12} className="text-white" />}
                             </div>
                             <img src={u.avatar} className="w-6 h-6 rounded-full" alt="" />
                             <span className="text-xs truncate flex-1">{u.name}</span>
                           </div>
                         );
                       })}
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Tags (separadas por vírgula)</label>
                <input 
                  type="text" 
                  value={Array.isArray(formData.tags) ? formData.tags.join(', ') : formData.tags || ''}
                  onChange={e => setFormData({...formData, tags: e.target.value as any})}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  placeholder="rh, financeiro, urgente"
                />
              </div>

              <div className="flex flex-col flex-1 min-h-[300px]">
                <div className="flex justify-between items-end mb-2">
                   <label className="text-sm font-medium text-slate-400">
                     Conteúdo <span className="text-red-500">*</span>
                   </label>
                   
                   {/* File Upload Button */}
                   <div>
                     <input 
                       type="file" 
                       id="file-upload" 
                       accept=".md,.txt" 
                       className="hidden" 
                       onChange={handleFileUpload}
                     />
                     <label 
                       htmlFor="file-upload" 
                       className="cursor-pointer text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition-colors px-2 py-1 hover:bg-indigo-900/20 rounded"
                     >
                       <Upload size={12}/> Importar Markdown (.md)
                     </label>
                   </div>
                </div>

                <div className="flex-1 relative">
                  <textarea 
                    value={formData.content || ''}
                    onChange={e => setFormData({...formData, content: e.target.value})}
                    className="w-full h-full min-h-[300px] bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none font-mono text-sm leading-relaxed"
                    placeholder="# Título Principal&#10;&#10;## Subtítulo&#10;&#10;- Item 1&#10;- Item 2"
                  />
                </div>
                <div className="flex justify-between items-center mt-2">
                   <p className="text-[10px] text-slate-500">
                     Dica: Use # para títulos grandes, ## para subtítulos, - para listas, **texto** para negrito.
                   </p>
                   <span className="text-[10px] text-slate-500 flex items-center gap-1"><FileText size={10}/> Markdown Suportado</span>
                </div>
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t border-slate-800 mt-4">
                <button 
                  onClick={() => { setIsCreating(false); setIsEditing(false); }}
                  className="px-4 py-2 text-slate-400 hover:text-white font-medium transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  onClick={handleSave}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-2 rounded-lg font-bold shadow-lg shadow-indigo-900/20 flex items-center gap-2"
                >
                  <Save size={18} />
                  Salvar Documento
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