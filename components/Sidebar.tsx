import React from 'react';
import { View, User } from '../types';
import { APP_NAME, LOGO_URL } from '../constants';
import { Home, CheckSquare, Book, Wrench, Bot, LogOut, X, Shield, UserCog } from 'lucide-react';

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
    { id: View.DASHBOARD, label: 'Início', icon: <Home size={20} /> },
    { id: View.ONBOARDING, label: 'Onboarding', icon: <CheckSquare size={20} /> },
    { id: View.KNOWLEDGE_BASE, label: 'Documentos & SOPs', icon: <Book size={20} /> },
    { id: View.TOOLS, label: 'Ferramentas', icon: <Wrench size={20} /> },
    { id: View.AI_ASSISTANT, label: 'Automatik AI', icon: <Bot size={20} /> },
  ];

  // Add Admin item only if user is strict admin
  if (user?.role === 'admin') {
    menuItems.push({ id: View.ADMIN, label: 'Administração', icon: <Shield size={20} /> });
  }

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/80 z-20 md:hidden backdrop-blur-sm"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed md:static inset-y-0 left-0 z-30
        w-64 bg-slate-900 text-slate-100 transition-transform duration-300 ease-in-out border-r border-slate-800
        ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        flex flex-col h-full
      `}>
        <div className="p-6 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <img 
              src={LOGO_URL} 
              alt={APP_NAME} 
              className="w-8 h-8 rounded-lg shadow-sm" 
            />
            <span className="font-bold text-xl tracking-tight text-white">{APP_NAME}</span>
          </div>
          <button onClick={() => setIsOpen(false)} className="md:hidden text-slate-400 hover:text-white">
            <X size={24} />
          </button>
        </div>

        <nav className="flex-1 py-6 px-3 space-y-1 overflow-y-auto">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                onChangeView(item.id);
                setIsOpen(false); // Close on mobile when clicked
              }}
              className={`
                w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors
                ${currentView === item.id 
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/20' 
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'}
              `}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-800">
          <div className="flex items-center gap-3 px-4 py-3 mb-2">
            <img 
              src={user?.avatar || "https://picsum.photos/32/32"} 
              alt="User" 
              className="w-8 h-8 rounded-full border border-slate-600" 
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate flex items-center gap-2">
                {user?.name || 'Colaborador'}
                {user?.role === 'admin' && <Shield size={12} className="text-amber-400" />}
                {user?.role === 'moderator' && <UserCog size={12} className="text-purple-400" />}
              </p>
              <p className="text-xs text-slate-500 truncate">{user?.department || 'Geral'}</p>
            </div>
          </div>
          <button 
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-4 py-2 text-sm font-medium text-red-400 hover:bg-slate-800 hover:text-red-300 rounded-lg transition-colors"
          >
            <LogOut size={18} />
            Sair
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;