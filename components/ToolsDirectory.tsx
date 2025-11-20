import React, { useState } from 'react';
import { Tool, User } from '../types';
import { ExternalLink, Plus, Trash2, X, Check } from 'lucide-react';
import { DEPARTMENTS } from '../constants';

interface ToolsDirectoryProps {
  tools: Tool[];
  user: User;
  onAddTool: (tool: Tool) => void;
  onDeleteTool: (id: string) => void;
}

const ToolsDirectory: React.FC<ToolsDirectoryProps> = ({ tools, user, onAddTool, onDeleteTool }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTool, setNewTool] = useState<Partial<Tool>>({ category: 'Produtividade', iconUrl: '🔗' });

  const canEdit = user.role === 'admin' || user.role === 'moderator';

  const handleAdd = () => {
    if (!newTool.name || !newTool.url) {
      alert("Preencha nome e URL");
      return;
    }
    const tool: Tool = {
      id: Date.now().toString(),
      name: newTool.name!,
      url: newTool.url!,
      description: newTool.description || '',
      category: newTool.category as any || 'Produtividade',
      iconUrl: newTool.iconUrl || '🔗'
    };
    onAddTool(tool);
    setIsModalOpen(false);
    setNewTool({ category: 'Produtividade', iconUrl: '🔗' });
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
            onClick={() => setIsModalOpen(true)}
            className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors"
          >
            <Plus size={18} /> Novo Link
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {tools.map(tool => (
          <div 
            key={tool.id}
            className="group bg-slate-900 p-6 rounded-xl shadow-lg border border-slate-800 hover:border-indigo-500/50 hover:shadow-indigo-500/10 transition-all flex flex-col relative"
          >
            {canEdit && (
              <button 
                onClick={() => window.confirm('Excluir ferramenta?') && onDeleteTool(tool.id)}
                className="absolute top-4 right-4 p-2 text-slate-600 hover:text-red-400 hover:bg-red-900/20 rounded transition-colors z-10"
              >
                <Trash2 size={14} />
              </button>
            )}

            <a href={tool.url} target="_blank" rel="noopener noreferrer" className="flex flex-col h-full">
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 bg-slate-800 rounded-xl flex items-center justify-center text-2xl shadow-inner border border-slate-700">
                  {tool.iconUrl}
                </div>
                <ExternalLink size={18} className="text-slate-600 group-hover:text-indigo-400 transition-colors" />
              </div>
              
              <h3 className="text-lg font-bold text-white mb-1 group-hover:text-indigo-400 transition-colors">
                {tool.name}
              </h3>
              <p className="text-sm text-slate-400 mb-4 flex-1">
                {tool.description}
              </p>
              
              <div className="pt-4 border-t border-slate-800 mt-auto">
                <span className="text-xs font-medium px-2 py-1 bg-slate-800 text-slate-400 rounded-md border border-slate-700">
                  {tool.category}
                </span>
              </div>
            </a>
          </div>
        ))}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-slate-900 rounded-xl w-full max-w-md shadow-2xl border border-slate-800">
            <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
              <h3 className="text-lg font-bold text-white">Novo Link/Ferramenta</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white"><X size={20} /></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Nome</label>
                <input 
                  type="text" 
                  value={newTool.name || ''}
                  onChange={e => setNewTool({...newTool, name: e.target.value})}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">URL</label>
                <input 
                  type="text" 
                  value={newTool.url || ''}
                  onChange={e => setNewTool({...newTool, url: e.target.value})}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Descrição</label>
                <input 
                  type="text" 
                  value={newTool.description || ''}
                  onChange={e => setNewTool({...newTool, description: e.target.value})}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                   <label className="block text-sm font-medium text-slate-400 mb-1">Categoria</label>
                   <select 
                      value={newTool.category}
                      onChange={e => setNewTool({...newTool, category: e.target.value as any})}
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
                    value={newTool.iconUrl || ''}
                    onChange={e => setNewTool({...newTool, iconUrl: e.target.value})}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-center"
                  />
                </div>
              </div>
              <button onClick={handleAdd} className="w-full bg-indigo-600 py-2 rounded-lg text-white font-bold mt-4">Salvar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ToolsDirectory;