import React from 'react';
import { View, User } from '../types';
import { Home, CheckSquare, Book, Wrench, Bot, LogOut, X, Shield, UserCog, Video } from 'lucide-react';
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
          <div className="flex items-center gap-3 px-3 py-3 mb-2 rounded-lg bg-white/5 border border-white/5 backdrop-blur-sm">
            <div className="relative">
              <img 
                src={user?.avatar || "https://picsum.photos/32/32"} 
                alt="User" 
                className="w-9 h-9 rounded-full border border-slate-600 object-cover" 
              />
              <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-[#020617] rounded-full"></div>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-white truncate flex items-center gap-1.5 tracking-wide">
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
    </>
  );
};

export default Sidebar;