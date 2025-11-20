import React, { useState } from 'react';
import { Tool, User } from '../types';
import { Plus, Trash2, X, ExternalLink, Edit2 } from 'lucide-react';
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
  const [formData, setFormData] = useState<Partial<Tool>>({ category: 'Produtividade', iconUrl: '🔗' });
  
  // Estado para controlar qual item está em processo de exclusão
  const [confirmingDeleteId, setConfirmingDeleteId] = useState<string | null>(null);

  const canEdit = user.role === 'admin' || user.role === 'moderator';

  const handleOpenAdd = () => {
    setFormData({ category: 'Produtividade', iconUrl: '🔗' });
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

    if (isEditing && formData.id) {
       const updatedTool: Tool = {
         ...(formData as Tool),
         // Garante que os campos obrigatórios estejam presentes
         id: formData.id,
         name: formData.name!,
         url: formData.url!,
         description: formData.description || '',
         category: formData.category || 'Produtividade',
         iconUrl: formData.iconUrl || '🔗'
       };
       onEditTool(updatedTool);
    } else {
        const tool: Tool = {
          id: Date.now().toString(),
          name: formData.name!,
          url: formData.url!,
          description: formData.description || '',
          category: formData.category as any || 'Produtividade',
          iconUrl: formData.iconUrl || '🔗'
        };
        onAddTool(tool);
    }
    
    setIsModalOpen(false);
    setFormData({ category: 'Produtividade', iconUrl: '🔗' });
  };

  // Fase 1: Solicitar exclusão (muda o botão)
  const handleRequestDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setConfirmingDeleteId(id);
    
    // Reseta a confirmação após 3 segundos se não clicar
    setTimeout(() => {
      setConfirmingDeleteId(prev => prev === id ? null : prev);
    }, 3000);
  };

  // Fase 2: Confirmar e executar
  const handleConfirmDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onDeleteTool(id);
    setConfirmingDeleteId(null);
  };

  return (
    <div>
       <div className="mb-8 flex items-end justify-between">
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

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {tools.map(tool => (
          <div 
            key={tool.id}
            className="group bg-slate-900 rounded-xl shadow-lg border border-slate-800 hover:border-indigo-500/50 hover:shadow-indigo-500/10 transition-all flex flex-col relative"
          >
            {/* Botões de Ação (Editar / Excluir) */}
            {canEdit && (
              <div className="absolute top-3 right-3 z-20 flex gap-2">
                <button 
                  onClick={(e) => handleOpenEdit(tool, e)}
                  className="p-2 bg-slate-950/80 text-slate-400 hover:text-indigo-400 hover:bg-indigo-900/20 border border-slate-700 hover:border-indigo-500/50 rounded-lg transition-all shadow-sm backdrop-blur-sm"
                  title="Editar Ferramenta"
                >
                  <Edit2 size={16} />
                </button>

                {confirmingDeleteId === tool.id ? (
                  <button 
                    type="button"
                    onClick={(e) => handleConfirmDelete(tool.id, e)}
                    className="flex items-center gap-2 px-3 py-2 bg-red-600 text-white hover:bg-red-700 border border-red-500 rounded-lg transition-all shadow-md animate-in fade-in zoom-in duration-200"
                    title="Confirmar Exclusão"
                  >
                    <Trash2 size={14} />
                    <span className="text-xs font-bold uppercase">Confirmar?</span>
                  </button>
                ) : (
                  <button 
                    type="button"
                    onClick={(e) => handleRequestDelete(tool.id, e)}
                    className="p-2 bg-slate-950/80 text-slate-400 hover:text-red-400 hover:bg-red-900/20 border border-slate-700 hover:border-red-500/50 rounded-lg transition-all shadow-sm backdrop-blur-sm"
                    title="Remover Ferramenta"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            )}

            {/* Área clicável do card (Conteúdo) */}
            <div 
              onClick={() => window.open(tool.url, '_blank')}
              className="flex flex-col h-full p-6 cursor-pointer"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 bg-slate-800 rounded-xl flex items-center justify-center text-2xl shadow-inner border border-slate-700">
                  {tool.iconUrl}
                </div>
              </div>
              
              {/* Padding right para o texto não ficar embaixo dos botões de ação */}
              <h3 className={`text-lg font-bold text-white mb-1 group-hover:text-indigo-400 transition-colors ${canEdit ? 'pr-28' : ''}`}>
                {tool.name}
              </h3>
              <p className="text-sm text-slate-400 mb-4 flex-1 line-clamp-2">
                {tool.description}
              </p>
              
              <div className="pt-4 border-t border-slate-800 mt-auto flex items-center justify-between">
                <span className="text-xs font-medium px-2 py-1 bg-slate-800 text-slate-400 rounded-md border border-slate-700">
                  {tool.category}
                </span>
                <ExternalLink size={14} className="text-slate-600 group-hover:text-indigo-400 transition-colors" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-slate-900 rounded-xl w-full max-w-md shadow-2xl border border-slate-800">
            <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
              <h3 className="text-lg font-bold text-white">{isEditing ? 'Editar Ferramenta' : 'Nova Ferramenta'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white"><X size={20} /></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Nome</label>
                <input 
                  type="text" 
                  value={formData.name || ''}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Ex: Jira, Slack, etc"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">URL</label>
                <input 
                  type="text" 
                  value={formData.url || ''}
                  onChange={e => setFormData({...formData, url: e.target.value})}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="https://..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Descrição</label>
                <input 
                  type="text" 
                  value={formData.description || ''}
                  onChange={e => setFormData({...formData, description: e.target.value})}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Breve descrição"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                   <label className="block text-sm font-medium text-slate-400 mb-1">Categoria</label>
                   <select 
                      value={formData.category}
                      onChange={e => setFormData({...formData, category: e.target.value as any})}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                      <option value="Produtividade">Produtividade</option>
                      <option value="Dev">Dev</option>
                      <option value="Comunicação">Comunicação</option>
                      <option value="Design">Design</option>
                    </select>
                </div>
                <div>
                   <label className="block text-sm font-medium text-slate-400 mb-1">Ícone (Emoji)</label>
                   <input 
                    type="text" 
                    maxLength={2}
                    value={formData.iconUrl || ''}
                    onChange={e => setFormData({...formData, iconUrl: e.target.value})}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-center"
                    placeholder="🔗"
                  />
                </div>
              </div>
              <button 
                onClick={handleSave} 
                className="w-full bg-indigo-600 hover:bg-indigo-500 py-2.5 rounded-lg text-white font-bold mt-4 transition-colors shadow-lg"
              >
                {isEditing ? 'Salvar Alterações' : 'Salvar Ferramenta'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ToolsDirectory;