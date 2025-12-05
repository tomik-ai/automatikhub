import React, { useState, useEffect } from 'react';
import { Tool, User, Department } from '../types';
import { Plus, Trash2, X, ExternalLink, Edit2, Eye, Lock, Search, Github, Trello, MessageCircle, Figma, Video, FileText, Mail, Hash, Gamepad2, CheckSquare, Terminal, Palette, TrendingUp, Headphones, Target, Globe, Smartphone, Code2, PenTool, Layout, Database, Slack, Chrome, MessagesSquare } from 'lucide-react';
import { DEPARTMENTS } from '../constants';

interface ToolsDirectoryProps {
  tools: Tool[];
  user: User;
  onAddTool: (tool: Tool) => void;
  onEditTool: (tool: Tool) => void;
  onDeleteTool: (id: string) => void;
}

const ToolsDirectory: React.FC<ToolsDirectoryProps> = ({ tools, user, onAddTool, onEditTool, onDeleteTool }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('Todos');
  
  // Form data includes target_department now
  const [formData, setFormData] = useState<Partial<Tool>>({ 
    category: 'Produtividade', 
    iconUrl: 'default', // Changed default
    target_department: 'Geral' 
  });
  
  // Estado para controlar qual item está em processo de exclusão
  const [confirmingDeleteId, setConfirmingDeleteId] = useState<string | null>(null);

  const canEdit = user.role === 'admin' || user.role === 'moderator';
  
  const categories = ['Todos', 'Produtividade', 'Dev', 'Comunicação', 'Design', 'Vendas', 'Suporte', 'Marketing'];

  // --- ICON LOGIC ---

  // Detects the best icon key based on name and category
  const detectIconKey = (name: string = '', category: string = ''): string => {
    const n = name.toLowerCase();
    
    // Brand/Specific mappings
    if (n.includes('github') || n.includes('git')) return 'github';
    if (n.includes('slack')) return 'slack';
    if (n.includes('whatsapp') || n.includes('whats')) return 'whatsapp';
    if (n.includes('discord')) return 'discord';
    if (n.includes('trello') || n.includes('jira') || n.includes('clickup') || n.includes('linear') || n.includes('asana')) return 'kanban';
    if (n.includes('figma') || n.includes('adobe') || n.includes('canva') || n.includes('photoshop')) return 'design_tool';
    if (n.includes('meet') || n.includes('zoom') || n.includes('teams')) return 'video_conf';
    if (n.includes('notion') || n.includes('docs') || n.includes('sheet') || n.includes('confluence')) return 'doc_tool';
    if (n.includes('mail') || n.includes('gmail') || n.includes('outlook')) return 'email';
    if (n.includes('chatgpt') || n.includes('ai') || n.includes('gemini') || n.includes('claude')) return 'ai';
    if (n.includes('hubspot') || n.includes('crm') || n.includes('salesforce') || n.includes('pipedrive')) return 'crm';
    if (n.includes('aws') || n.includes('cloud') || n.includes('azure') || n.includes('vercel') || n.includes('supabase')) return 'cloud';

    // Category Fallbacks
    if (category === 'Dev') return 'code';
    if (category === 'Design') return 'palette';
    if (category === 'Comunicação') return 'message';
    if (category === 'Vendas') return 'sales';
    if (category === 'Suporte') return 'support';
    if (category === 'Marketing') return 'marketing';
    
    return 'default';
  };

  // Renders the actual component based on the key
  const renderIcon = (iconKey: string, size: number = 24, className: string = '') => {
    // If it's a legacy emoji (length <= 2), render as text
    if (iconKey && iconKey.length <= 2 && !iconKey.match(/[a-z]/i)) {
       return <span style={{ fontSize: size }} className={className}>{iconKey}</span>;
    }

    const props = { size, className };

    switch (iconKey) {
      case 'github': return <Github {...props} />;
      case 'slack': return <Slack {...props} />;
      case 'whatsapp': return <Smartphone {...props} />;
      case 'discord': return <Gamepad2 {...props} />;
      case 'kanban': return <Trello {...props} />;
      case 'design_tool': return <Figma {...props} />;
      case 'video_conf': return <Video {...props} />;
      case 'doc_tool': return <FileText {...props} />;
      case 'email': return <Mail {...props} />;
      case 'code': return <Terminal {...props} />;
      case 'palette': return <Palette {...props} />;
      case 'message': return <MessageCircle {...props} />;
      case 'sales': return <TrendingUp {...props} />;
      case 'crm': return <Database {...props} />;
      case 'support': return <Headphones {...props} />;
      case 'marketing': return <Target {...props} />;
      case 'cloud': return <Globe {...props} />;
      case 'ai': return <MessagesSquare {...props} />;
      default: return <Layout {...props} />;
    }
  };

  // Auto-update icon when name or category changes in modal
  useEffect(() => {
    if (isModalOpen) {
      const key = detectIconKey(formData.name, formData.category);
      setFormData(prev => ({ ...prev, iconUrl: key }));
    }
  }, [formData.name, formData.category, isModalOpen]);


  // --- VISIBILITY LOGIC ---
  const allowedTools = tools.filter(tool => {
    const isAdmin = user.role === 'admin';
    if (isAdmin) return true;
    if (!tool.target_department || tool.target_department === 'Geral') {
      return true;
    }
    return user.department === tool.target_department;
  });

  const filteredTools = allowedTools.filter(tool => {
    if (selectedCategory === 'Todos') return true;
    return tool.category === selectedCategory;
  });

  const handleOpenAdd = () => {
    setFormData({ category: 'Produtividade', iconUrl: 'default', target_department: 'Geral', name: '', url: '', description: '' });
    setIsEditing(false);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (tool: Tool, e: React.MouseEvent) => {
    e.stopPropagation();
    setFormData({ ...tool });
    setIsEditing(true);
    setIsModalOpen(true);
  };

  const handleSave = () => {
    if (!formData.name || !formData.url) {
      alert("Preencha nome e URL");
      return;
    }

    // Force icon refresh one last time to ensure it matches
    const finalIcon = detectIconKey(formData.name, formData.category);

    const commonData = {
       name: formData.name!,
       url: formData.url!,
       description: formData.description || '',
       category: formData.category || 'Produtividade',
       iconUrl: finalIcon,
       target_department: formData.target_department || 'Geral'
    };

    if (isEditing && formData.id) {
       onEditTool({ ...commonData, id: formData.id } as Tool);
    } else {
       onAddTool({ ...commonData, id: Date.now().toString() } as Tool);
    }
    
    setIsModalOpen(false);
  };

  const handleRequestDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setConfirmingDeleteId(id);
    setTimeout(() => {
      setConfirmingDeleteId(prev => prev === id ? null : prev);
    }, 3000);
  };

  const handleConfirmDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onDeleteTool(id);
    setConfirmingDeleteId(null);
  };

  return (
    <div>
       <div className="mb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white mb-2">Ferramentas & Links</h1>
          <p className="text-slate-400">Acesso rápido aos softwares e links úteis para {user.department || 'a empresa'}.</p>
        </div>
        {canEdit && (
          <button 
            onClick={handleOpenAdd}
            className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors shadow-lg shadow-indigo-500/20"
          >
            <Plus size={18} /> Novo Link
          </button>
        )}
      </div>

      {/* Category Filter Tabs */}
      <div className="flex overflow-x-auto pb-2 md:pb-0 gap-2 mb-8 no-scrollbar">
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

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTools.map(tool => (
          <div 
            key={tool.id}
            className="group bg-slate-900 rounded-xl shadow-lg border border-slate-800 hover:border-indigo-500/50 hover:shadow-indigo-500/10 transition-all flex flex-col relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 p-20 bg-indigo-500/5 rounded-full blur-3xl -mr-10 -mt-10 transition-opacity opacity-0 group-hover:opacity-100"></div>

            {/* Buttons */}
            {canEdit && (
              <div className="absolute top-3 right-3 z-20 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button 
                  onClick={(e) => handleOpenEdit(tool, e)}
                  className="p-1.5 bg-black/50 text-slate-300 hover:text-white hover:bg-indigo-600 rounded-md transition-all backdrop-blur-md"
                >
                  <Edit2 size={14} />
                </button>
                {confirmingDeleteId === tool.id ? (
                  <button 
                    onClick={(e) => handleConfirmDelete(tool.id, e)}
                    className="p-1.5 bg-red-600 text-white rounded-md transition-all animate-pulse"
                  >
                    <Trash2 size={14} />
                  </button>
                ) : (
                  <button 
                    onClick={(e) => handleRequestDelete(tool.id, e)}
                    className="p-1.5 bg-black/50 text-slate-300 hover:text-white hover:bg-red-600 rounded-md transition-all backdrop-blur-md"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            )}

            <div 
              onClick={() => window.open(tool.url, '_blank')}
              className="flex flex-col h-full p-6 cursor-pointer relative z-10"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 bg-slate-800/50 rounded-xl flex items-center justify-center shadow-inner border border-slate-700/50 group-hover:border-indigo-500/30 group-hover:bg-indigo-500/10 transition-all text-slate-400 group-hover:text-indigo-400">
                  {renderIcon(tool.iconUrl, 24)}
                </div>
                {canEdit && tool.target_department && tool.target_department !== 'Geral' && (
                   <div className="absolute top-4 right-4 bg-slate-800/80 border border-slate-700 px-2 py-1 rounded text-[10px] text-slate-300 flex items-center gap-1">
                     <Lock size={10} /> {tool.target_department}
                   </div>
                )}
              </div>
              
              <h3 className="text-lg font-bold text-white mb-1 group-hover:text-indigo-400 transition-colors pr-8">
                {tool.name}
              </h3>
              <p className="text-sm text-slate-400 mb-4 flex-1 line-clamp-2 leading-relaxed">
                {tool.description}
              </p>
              
              <div className="pt-4 border-t border-slate-800/50 mt-auto flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-1 bg-slate-800/50 text-slate-500 rounded border border-slate-700/50 group-hover:border-indigo-500/20 group-hover:text-indigo-300 transition-colors">
                  {tool.category}
                </span>
                <ExternalLink size={14} className="text-slate-600 group-hover:text-indigo-400 transition-colors" />
              </div>
            </div>
          </div>
        ))}

        {filteredTools.length === 0 && (
          <div className="col-span-full py-12 text-center">
            <div className="bg-slate-900 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-800">
               <Search size={24} className="text-slate-600" />
            </div>
            <p className="text-slate-400">Nenhuma ferramenta encontrada.</p>
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#0B1120] rounded-xl w-full max-w-md shadow-2xl border border-white/10">
            <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between">
              <h3 className="text-lg font-bold text-white">{isEditing ? 'Editar Ferramenta' : 'Nova Ferramenta'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white"><X size={20} /></button>
            </div>
            <div className="p-6 space-y-5">
              
              {/* Header with Icon Preview */}
              <div className="flex items-center gap-4 bg-slate-900/50 p-4 rounded-lg border border-white/5">
                 <div className="w-14 h-14 bg-indigo-500/10 border border-indigo-500/20 rounded-xl flex items-center justify-center text-indigo-400 shadow-inner">
                    {renderIcon(formData.iconUrl || 'default', 28)}
                 </div>
                 <div className="flex-1">
                    <p className="text-xs text-slate-500 uppercase font-bold tracking-wider mb-1">Ícone Automático</p>
                    <p className="text-sm text-slate-300">Detectado pelo nome/categoria</p>
                 </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Nome da Ferramenta</label>
                <input 
                  type="text" 
                  value={formData.name || ''}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  className="w-full bg-slate-950 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder-slate-600"
                  placeholder="Ex: Jira, Slack, Figma..."
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">URL de Acesso</label>
                <input 
                  type="text" 
                  value={formData.url || ''}
                  onChange={e => setFormData({...formData, url: e.target.value})}
                  className="w-full bg-slate-950 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder-slate-600"
                  placeholder="https://..."
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Descrição Curta</label>
                <input 
                  type="text" 
                  value={formData.description || ''}
                  onChange={e => setFormData({...formData, description: e.target.value})}
                  className="w-full bg-slate-950 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder-slate-600"
                  placeholder="Para que serve esta ferramenta?"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                   <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Categoria</label>
                   <select 
                      value={formData.category}
                      onChange={e => setFormData({...formData, category: e.target.value as any})}
                      className="w-full bg-slate-950 border border-white/10 rounded-lg px-3 py-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                    >
                      {categories.filter(c => c !== 'Todos').map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Acesso (Setor)</label>
                  <select 
                      value={formData.target_department || 'Geral'}
                      onChange={e => setFormData({...formData, target_department: e.target.value as any})}
                      className="w-full bg-slate-950 border border-white/10 rounded-lg px-3 py-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                    >
                      <option value="Geral">Geral (Todos)</option>
                      {DEPARTMENTS