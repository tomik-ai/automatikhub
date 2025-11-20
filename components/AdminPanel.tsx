import React, { useState, useEffect } from 'react';
import { User, UserRole, Department, SOP, View } from '../types';
import { UserService } from '../services/userService';
import { SopService } from '../services/sopService';
import { getSupabaseConfig, saveSupabaseConfig, checkConnection } from '../services/supabaseClient';
import { Shield, Users, CheckCircle, XCircle, AlertTriangle, Search, Database, Save, RefreshCw, Wifi, WifiOff, UserPlus, UserCog, Trash2, FileText, Clock, RotateCcw, X } from 'lucide-react';

interface AdminPanelProps {
  onChangeView?: (view: View) => void;
}

const AdminPanel: React.FC<AdminPanelProps> = ({ onChangeView }) => {
  // Tabs State
  const [activeTab, setActiveTab] = useState<'users' | 'trash'>('users');

  // User Management State
  const [users, setUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  
  // Trash/Recovery State
  const [deletedSops, setDeletedSops] = useState<SOP[]>([]);
  const [isLoadingTrash, setIsLoadingTrash] = useState(false);

  // Database Config State
  const [supabaseUrl, setSupabaseUrl] = useState('');
  const [supabaseKey, setSupabaseKey] = useState('');
  const [connectionStatus, setConnectionStatus] = useState<'checking' | 'connected' | 'disconnected'>('checking');

  // Add/Edit User Modal State
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false); 
  const [newUser, setNewUser] = useState({ name: '', email: '', role: 'member' as UserRole, department: 'Geral' as Department });

  useEffect(() => {
    loadUsers();
    const config = getSupabaseConfig();
    setSupabaseUrl(config.url);
    setSupabaseKey(config.key);
    testConnection();
  }, []);

  // Carregar lixeira quando a aba for ativada
  useEffect(() => {
    if (activeTab === 'trash') {
      loadDeletedSops();
    }
  }, [activeTab]);

  const loadUsers = async () => {
    setIsLoadingUsers(true);
    try {
      const allUsers = await UserService.getAll();
      setUsers(allUsers);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoadingUsers(false);
    }
  };

  const loadDeletedSops = async () => {
    setIsLoadingTrash(true);
    try {
      const trash = await SopService.getDeleted();
      setDeletedSops(trash);
    } catch (e) {
      console.error("Erro ao carregar lixeira", e);
    } finally {
      setIsLoadingTrash(false);
    }
  };

  const handleRestoreSop = async (id: string) => {
    try {
      await SopService.restore(id);
      alert("Documento restaurado com sucesso! Redirecionando para a Base de Conhecimento.");
      
      if (onChangeView) {
        onChangeView(View.KNOWLEDGE_BASE);
      } else {
        await loadDeletedSops();
      }
    } catch (e: any) {
      alert("Erro ao restaurar: " + e.message);
    }
  };

  const handlePermanentDelete = async (id: string) => {
    if (!window.confirm("Tem certeza? Isso apagará o documento para sempre e não poderá ser desfeito.")) {
      return;
    }
    try {
      await SopService.permanentDelete(id);
      await loadDeletedSops();
    } catch (e: any) {
      alert("Erro ao excluir permanentemente: " + e.message);
    }
  };

  const testConnection = async () => {
    setConnectionStatus('checking');
    const isOnline = await checkConnection();
    setConnectionStatus(isOnline ? 'connected' : 'disconnected');
  };

  const handleSaveConfig = () => {
    saveSupabaseConfig(supabaseUrl, supabaseKey);
  };

  const formatNameFromEmail = (email: string) => {
    const namePart = email.split('@')[0];
    return namePart
      .split('.')
      .map(n => n.charAt(0).toUpperCase() + n.slice(1))
      .join(' ');
  };

  const openEditUser = (user: User) => {
    setNewUser({
      name: user.name,
      email: user.email,
      role: user.role,
      department: user.department || 'Geral'
    });
    setIsEditing(true);
    setIsUserModalOpen(true);
  }

  const openAddUser = () => {
    setNewUser({ name: '', email: '', role: 'member', department: 'Geral' }); 
    setIsEditing(false);
    setIsUserModalOpen(true);
  }

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUser.name || !newUser.email) return;

    try {
      const normalizedEmail = newUser.email.toLowerCase().trim();
      
      if (isEditing) {
        await UserService.updateUser({ 
          name: newUser.name,
          email: normalizedEmail,
          role: newUser.role,
          department: newUser.department,
          avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${normalizedEmail}` 
        });
        alert(`Usuário atualizado com sucesso!`);
      } else {
        const existingUser = users.find(u => u.email === normalizedEmail);
        if (existingUser) {
          alert("Este usuário já existe. Use o botão de editar.");
          return;
        }
        const avatarUrl = `https://api.dicebear.com/7.x/avataaars/svg?seed=${normalizedEmail}`;
        await UserService.findOrCreate(normalizedEmail, newUser.name, avatarUrl);
        await UserService.updateUser({
          name: newUser.name,
          email: normalizedEmail,
          avatar: avatarUrl,
          role: newUser.role,
          department: newUser.department
        });
        alert('Novo usuário adicionado com sucesso!');
      }

      await loadUsers();
      setIsUserModalOpen(false);
    } catch (error: any) {
      alert(error.message);
    }
  };

  const handleDeleteUser = async (email: string) => {
    if (!window.confirm(`Tem certeza que deseja remover o usuário ${email}? Esta ação não pode ser desfeita.`)) {
      return;
    }
    try {
      await UserService.deleteUser(email);
      setUsers(users.filter(u => u.email !== email));
    } catch (error: any) {
      alert("Erro ao remover usuário: " + error.message);
    }
  };

  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    u.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Helper to check if within 15 days
  const isRecoverable = (deletedAt: string) => {
    const deletedDate = new Date(deletedAt);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - deletedDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 15;
  };

  const getDaysRemaining = (deletedAt: string) => {
    const deletedDate = new Date(deletedAt);
    const deadline = new Date(deletedDate);
    deadline.setDate(deletedDate.getDate() + 15);
    const now = new Date();
    const diffTime = deadline.getTime() - now.getTime();
    const daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, daysLeft);
  };

  return (
    <div className="space-y-8 pb-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white mb-2 flex items-center gap-2">
            <Shield className="text-indigo-500" /> Painel Administrativo
          </h1>
          <p className="text-slate-400">Gerencie usuários e recupere documentos deletados.</p>
        </div>
        
        {/* Navigation Tabs */}
        <div className="flex bg-slate-900 p-1 rounded-lg border border-slate-800">
          <button
            onClick={() => setActiveTab('users')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${activeTab === 'users' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
          >
            <Users size={16} /> Usuários
          </button>
          <button
            onClick={() => setActiveTab('trash')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${activeTab === 'trash' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
          >
            <Trash2 size={16} /> Lixeira SOPs
          </button>
        </div>
      </div>

      {/* Content Area */}
      {activeTab === 'users' ? (
        <>
          {/* Database Configuration */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-bold text-white flex items-center gap-2">
                <Database size={18} className={connectionStatus === 'connected' ? "text-green-400" : "text-slate-400"} />
                Conexão com Banco de Dados (Supabase)
              </h3>
              
              <div className="flex items-center gap-3">
                {connectionStatus === 'checking' && (
                  <span className="text-xs font-bold text-indigo-400 bg-indigo-900/20 px-3 py-1 rounded-full flex items-center gap-1 animate-pulse">
                    <RefreshCw size={12} className="animate-spin" /> Verificando...
                  </span>
                )}
                {connectionStatus === 'connected' && (
                  <span className="text-xs font-bold text-green-400 bg-green-900/20 px-3 py-1 rounded-full flex items-center gap-1">
                    <Wifi size={12} /> Conectado (Online)
                  </span>
                )}
                {connectionStatus === 'disconnected' && (
                  <span className="text-xs font-bold text-red-400 bg-red-900/20 px-3 py-1 rounded-full flex items-center gap-1">
                    <WifiOff size={12} /> Desconectado / Erro
                  </span>
                )}
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Supabase URL</label>
                <input 
                  type="text" 
                  value={supabaseUrl}
                  onChange={(e) => setSupabaseUrl(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-indigo-500 text-sm font-mono"
                  placeholder="https://xyz.supabase.co"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Supabase Anon Key</label>
                <input 
                  type="password" 
                  value={supabaseKey}
                  onChange={(e) => setSupabaseKey(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-indigo-500 text-sm font-mono"
                  placeholder="eyJhbGciOiJIUzI1NiIsInR..."
                />
              </div>
            </div>
            <div className="flex justify-end">
              <button 
                onClick={handleSaveConfig}
                className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg font-medium text-sm flex items-center gap-2 transition-colors"
              >
                <Save size={16} /> Salvar e Conectar
              </button>
            </div>
          </div>

          {/* User Management */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden mt-6">
            <div className="p-6 border-b border-slate-800 flex flex-col md:flex-row justify-between items-center gap-4">
              <h3 className="font-bold text-white">Usuários Cadastrados ({users.length})</h3>
              
              <div className="flex items-center gap-3 w-full md:w-auto">
                 <div className="relative flex-1 md:w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                  <input
                    type="text"
                    placeholder="Buscar usuário..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
                <button 
                  onClick={openAddUser}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg font-medium text-sm flex items-center gap-2 transition-colors whitespace-nowrap"
                >
                  <UserPlus size={16} />
                  Adicionar Colaborador
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              {isLoadingUsers ? (
                <div className="p-8 text-center text-slate-500 flex items-center justify-center gap-2">
                   <RefreshCw className="animate-spin" size={16} /> Carregando usuários...
                </div>
              ) : (
                <table className="w-full text-left text-sm text-slate-400">
                  <thead className="bg-slate-950 text-slate-200 uppercase font-semibold">
                    <tr>
                      <th className="px-6 py-4">Usuário</th>
                      <th className="px-6 py-4">Setor</th>
                      <th className="px-6 py-4 text-center">Função</th>
                      <th className="px-6 py-4 text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {filteredUsers.map(u => (
                      <tr key={u.email} className="hover:bg-slate-800/50 transition-colors">
                        <td className="px-6 py-4 flex items-center gap-3">
                          <img src={u.avatar} alt="" className="w-8 h-8 rounded-full bg-slate-800" />
                          <div>
                            <div className="font-medium text-white">{u.name}</div>
                            <div className="text-xs text-slate-500">{u.email}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center px-2 py-1 rounded bg-slate-800 text-slate-300 text-xs border border-slate-700">
                            {u.department || 'Geral'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className={`
                            inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold border
                            ${u.role === 'admin' 
                              ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' 
                              : u.role === 'moderator' 
                                ? 'bg-purple-500/10 text-purple-400 border-purple-500/20'
                                : 'bg-slate-700/30 text-slate-400 border-slate-700'}
                          `}>
                            {u.role === 'admin' && <Shield size={10} />}
                            {u.role === 'moderator' && <UserCog size={10} />}
                            {u.role.toUpperCase()}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button 
                              onClick={() => openEditUser(u)}
                              className="text-indigo-400 hover:text-white p-2 rounded hover:bg-indigo-900/30 transition-colors"
                              title="Editar Colaborador"
                            >
                              <UserCog size={18} />
                            </button>
                            <button 
                              onClick={() => handleDeleteUser(u.email)}
                              className="text-red-400 hover:text-white p-2 rounded hover:bg-red-900/30 transition-colors"
                              title="Remover Colaborador"
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </>
      ) : (
        /* TRASH / RECOVERY TAB */
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
            <div className="p-6 border-b border-slate-800">
              <h3 className="font-bold text-white flex items-center gap-2">
                <Trash2 size={20} className="text-red-400" />
                Lixeira de Documentos
              </h3>
              <p className="text-sm text-slate-400 mt-1">
                Documentos deletados ficam disponíveis para recuperação por até 15 dias. Após esse período, a recuperação é bloqueada.
              </p>
            </div>

            <div className="overflow-x-auto">
              {isLoadingTrash ? (
                <div className="p-12 text-center text-slate-500 flex items-center justify-center gap-2">
                   <RefreshCw className="animate-spin" size={20} /> Carregando itens deletados...
                </div>
              ) : deletedSops.length === 0 ? (
                <div className="p-12 text-center text-slate-500">
                  <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Trash2 size={32} className="text-slate-600" />
                  </div>
                  <p>A lixeira está vazia.</p>
                  <p className="text-xs mt-1 opacity-70">Se você deletou algo e não apareceu aqui, verifique a configuração do banco acima.</p>
                </div>
              ) : (
                <table className="w-full text-left text-sm text-slate-400">
                  <thead className="bg-slate-950 text-slate-200 uppercase font-semibold">
                    <tr>
                      <th className="px-6 py-4">Documento</th>
                      <th className="px-6 py-4">Categoria</th>
                      <th className="px-6 py-4">Deletado em</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4 text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {deletedSops.map(sop => {
                      const recoverable = sop.deleted_at ? isRecoverable(sop.deleted_at) : false;
                      const daysLeft = sop.deleted_at ? getDaysRemaining(sop.deleted_at) : 0;
                      
                      return (
                        <tr key={sop.id} className="hover:bg-slate-800/50 transition-colors group">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="p-2 bg-slate-800 rounded text-slate-500 group-hover:text-indigo-400 transition-colors">
                                <FileText size={18} />
                              </div>
                              <div>
                                <div className="font-medium text-white">{sop.title}</div>
                                <div className="text-xs text-slate-500 line-clamp-1 max-w-[200px]">{sop.content}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className="bg-slate-800 text-slate-300 px-2 py-1 rounded text-xs border border-slate-700">
                              {sop.category}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            {sop.deleted_at ? new Date(sop.deleted_at).toLocaleDateString() : '-'}
                            <div className="text-xs text-slate-600">
                              {sop.deleted_at ? new Date(sop.deleted_at).toLocaleTimeString() : ''}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                             {recoverable ? (
                               <span className="flex items-center gap-1 text-green-400 text-xs font-medium bg-green-900/20 px-2 py-1 rounded border border-green-900/30 w-fit">
                                 <Clock size={12} /> Restam {daysLeft} dias
                               </span>
                             ) : (
                               <span className="flex items-center gap-1 text-red-400 text-xs font-medium bg-red-900/20 px-2 py-1 rounded border border-red-900/30 w-fit">
                                 <XCircle size={12} /> Expirado
                               </span>
                             )}
                          </td>
                          <td className="px-6 py-4 text-right">
                             <div className="flex items-center justify-end gap-2">
                               {recoverable && (
                                 <button 
                                   onClick={() => handleRestoreSop(sop.id)}
                                   className="flex items-center gap-1 bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1.5 rounded text-xs font-medium transition-colors shadow-lg shadow-indigo-900/20"
                                 >
                                   <RotateCcw size={14} /> Restaurar
                                 </button>
                               )}
                               <button 
                                 onClick={() => handlePermanentDelete(sop.id)}
                                 className="text-slate-500 hover:text-red-400 p-1.5 rounded hover:bg-slate-800 transition-colors"
                                 title="Excluir Permanentemente"
                               >
                                 <X size={16} />
                               </button>
                             </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit User Modal */}
      {isUserModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-slate-900 rounded-xl w-full max-w-md shadow-2xl border border-slate-800">
            <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
              <h3 className="text-lg font-bold text-white">{isEditing ? 'Editar Usuário' : 'Novo Usuário'}</h3>
              <button onClick={() => setIsUserModalOpen(false)} className="text-slate-400 hover:text-white">
                <X size={20} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Nome Completo</label>
                <input 
                  type="text" 
                  value={newUser.name}
                  onChange={e => setNewUser({...newUser, name: e.target.value})}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Ex: João Silva"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">E-mail Corporativo</label>
                <input 
                  type="email" 
                  value={newUser.email}
                  onChange={e => setNewUser({...newUser, email: e.target.value})}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
                  placeholder="nome@empresa.com"
                  disabled={isEditing}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1">Departamento</label>
                  <select 
                    value={newUser.department}
                    onChange={e => setNewUser({...newUser, department: e.target.value as any})}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                  >
                    <option value="Geral">Geral</option>
                    <option value="Tech">Tech</option>
                    <option value="Comercial">Comercial</option>
                    <option value="Sucesso do Cliente">Sucesso do Cliente</option>
                    <option value="Marketing">Marketing</option>
                    <option value="Suporte">Suporte</option>
                    <option value="Operacional">Operacional</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1">Permissão</label>
                  <select 
                    value={newUser.role}
                    onChange={e => setNewUser({...newUser, role: e.target.value as any})}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                  >
                    <option value="member">Member (Básico)</option>
                    <option value="moderator">Moderator (Editor)</option>
                    <option value="admin">Admin (Total)</option>
                  </select>
                </div>
              </div>

              <button 
                onClick={handleSaveUser}
                className="w-full bg-indigo-600 hover:bg-indigo-500 py-2.5 rounded-lg text-white font-bold mt-4 transition-colors shadow-lg shadow-indigo-900/20"
              >
                {isEditing ? 'Salvar Alterações' : 'Adicionar Usuário'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPanel;