import React, { useState, useRef } from 'react';
import { View, User } from '../types';
import { UserService } from '../services/userService';
import { Home, CheckSquare, Book, Wrench, Bot, LogOut, Shield, UserCog, Video, X, Camera, Save, Lock, Upload } from 'lucide-react';
import { LOGO_URL, COMPANY_NAME } from '../constants';

interface SidebarProps {
  currentView: View;
  onChangeView: (view: View) => void;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  user: User | null;
  onLogout: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentView, onChangeView, isOpen, setIsOpen, user, onLogout }) => {
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState(user?.avatar || '');
  const [password, setPassword] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const menuItems = [
    { id: View.DASHBOARD, label: 'INÍCIO', icon: <Home size={18} /> },
    { id: View.ONBOARDING, label: 'ONBOARDING', icon: <CheckSquare size={18} /> },
    { id: View.TRAINING, label: 'TREINAMENTOS', icon: <Video size={18} /> },
    { id: View.KNOWLEDGE_BASE, label: 'DOCUMENTOS', icon: <Book size={18} /> },
    { id: View.TOOLS, label: 'FERRAMENTAS', icon: <Wrench size={18} /> },
    { id: View.AI_ASSISTANT, label: 'AUTOMATIK AI', icon: <Bot size={18} /> },
  ];

  // Add Admin item only if user is strict admin
  if (user?.role === 'admin') {
    menuItems.push({ id: View.ADMIN, label: 'ADMINISTRAÇÃO', icon: <Shield size={18} /> });
  }

  const handleUpdateProfile = async () => {
    if (!user) return;
    try {
        await UserService.updateUser({
            ...user,
            avatar: avatarUrl
        });
        alert("Perfil atualizado! Recarregue a página para ver todas as alterações.");
        setIsProfileModalOpen(false);
    } catch (e) {
        alert("Erro ao atualizar perfil.");
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Limite simples de tamanho (ex: 2MB) para não pesar o banco
    if (file.size > 2 * 1024 * 1024) {
      alert("A imagem deve ter no máximo 2MB.");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      setAvatarUrl(base64String);
    };
    reader.readAsDataURL(file);
  };

  const handleCameraClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/90 z-20 md:hidden backdrop-blur-sm"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed md:static inset-y-0 left-0 z-30
        w-64 bg-[#020617]/95 backdrop-blur-xl text-slate-100 transition-transform duration-300 ease-in-out border-r border-white/5
        ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        flex flex-col h-full shadow-[4px_0_24px_-4px_rgba(0,0,0,0.3)]
      `}>
        <div className="p-6 flex items-center justify-center border-b border-white/5 h-[88px] relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/5 to-purple-500/5 pointer-events-none"></div>
          <img src={LOGO_URL} alt={COMPANY_NAME} className="h-10 w-auto object-contain relative z-10" />
        </div>

        <nav className="flex-1 py-6 px-3 space-y-1.5 overflow-y-auto custom-scrollbar">
          {menuItems.map((item) => {
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  onChangeView(item.id);
                  setIsOpen(false); // Close on mobile when clicked
                }}
                className={`
                  w-full flex items-center gap-3 px-4 py-3 rounded-md text-xs font-bold tracking-widest transition-all duration-300 relative overflow-hidden group focus:outline-none focus:ring-0
                  ${isActive 
                    ? 'text-white bg-white/5 border border-white/10 shadow-[0_0_15px_rgba(6,182,212,0.1)]' 
                    : 'text-slate-500 hover:text-cyan-400 hover:bg-white/5'}
                `}
              >
                {/* Neon Indicator */}
                {isActive && <div className="absolute left-0 top-0 bottom-0 w-1 bg-cyan-400 shadow-[0_0_10px_#22d3ee]"></div>}
                
                <span className={`transition-transform duration-300 ${isActive ? 'translate-x-1 text-cyan-400' : 'group-hover:scale-110'}`}>
                  {item.icon}
                </span>
                <span className="relative z-10">{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-white/5 bg-[#020617]/50">
          <div 
            onClick={() => {
                setAvatarUrl(user?.avatar || '');
                setIsProfileModalOpen(true);
            }}
            className="flex items-center gap-3 px-3 py-3 mb-2 rounded-lg bg-white/5 border border-white/5 backdrop-blur-sm cursor-pointer hover:bg-white/10 transition-colors group"
          >
            <div className="relative">
              <img 
                src={user?.avatar || "https://picsum.photos/32/32"} 
                alt="User" 
                className="w-9 h-9 rounded-full border border-slate-600 object-cover group-hover:border-cyan-400 transition-colors" 
              />
              <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-[#020617] rounded-full"></div>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-white truncate flex items-center gap-1.5 tracking-wide group-hover:text-cyan-400 transition-colors">
                {user?.name || 'Colaborador'}
                {user?.role === 'admin' && <Shield size={10} className="text-amber-400" />}
                {user?.role === 'moderator' && <UserCog size={10} className="text-purple-400" />}
              </p>
              <p className="text-[10px] text-slate-500 truncate uppercase tracking-wider">{user?.department || 'Geral'}</p>
            </div>
          </div>
          <button 
            onClick={onLogout}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 text-xs font-bold uppercase tracking-wider text-red-400/80 hover:bg-red-950/20 hover:text-red-400 border border-transparent hover:border-red-900/30 rounded-lg transition-all focus:outline-none focus:ring-0"
          >
            <LogOut size={14} />
            Encerrar Sessão
          </button>
        </div>
      </aside>

       {/* Profile Modal */}
       {isProfileModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={() => setIsProfileModalOpen(false)}>
          <div className="bg-[#0B1120] rounded-xl w-full max-w-md shadow-2xl border border-white/10" onClick={e => e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between">
              <h3 className="text-lg font-bold text-white flex items-center gap-2"><UserCog size={20} className="text-cyan-500"/> Configurações de Perfil</h3>
              <button onClick={() => setIsProfileModalOpen(false)} className="text-slate-400 hover:text-white"><X size={20} /></button>
            </div>
            <div className="p-6 space-y-6">
              
              <div className="flex justify-center">
                 <div className="relative group cursor-pointer" onClick={handleCameraClick}>
                    <img src={avatarUrl || user?.avatar} className="w-24 h-24 rounded-full border-2 border-white/10 shadow-lg object-cover" alt="Profile" />
                    <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <Upload className="text-white" size={24} />
                    </div>
                    <div className="absolute bottom-0 right-0 bg-cyan-600 p-1.5 rounded-full text-white border-2 border-[#0B1120] z-10">
                        <Camera size={14} />
                    </div>
                    {/* Hidden File Input */}
                    <input 
                      type="file" 
                      ref={fileInputRef} 
                      className="hidden" 
                      accept="image/*"
                      onChange={handleFileChange}
                    />
                 </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">URL da Foto (Ou use a câmera acima)</label>
                <input 
                  type="text" 
                  value={avatarUrl}
                  onChange={e => setAvatarUrl(e.target.value)}
                  className="w-full bg-slate-950 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 text-sm"
                  placeholder="https://..."
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Alterar Senha</label>
                <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                    <input 
                    type="password" 
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="w-full bg-slate-950 border border-white/10 rounded-lg pl-10 pr-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 text-sm"
                    placeholder="Nova senha..."
                    disabled
                    title="Funcionalidade desabilitada nesta versão (Login Centralizado)"
                    />
                </div>
                <p className="text-[10px] text-slate-500 mt-1">A alteração de senha é gerenciada pelo administrador do sistema.</p>
              </div>

              <div className="pt-4 border-t border-white/10">
                <button 
                    onClick={handleUpdateProfile}
                    className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2 transition-all shadow-lg shadow-cyan-900/20"
                >
                    <Save size={16} /> Salvar Alterações
                </button>
              </div>

            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Sidebar;