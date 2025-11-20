import React, { useState, useEffect, useCallback } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import Onboarding from './components/Onboarding';
import KnowledgeBase from './components/KnowledgeBase';
import ToolsDirectory from './components/ToolsDirectory';
import AiAssistant from './components/AiAssistant';
import AdminPanel from './components/AdminPanel';
import Login from './components/Login';
import { View, OnboardingStep, User, SOP, Tool } from './types';
import { StorageService } from './services/storage';
import { SopService } from './services/sopService';
import { OnboardingService } from './services/onboardingService';
import { ToolsService } from './services/toolsService';
import { Menu, Loader2 } from 'lucide-react';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [currentView, setCurrentView] = useState<View>(View.DASHBOARD);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  // Estado dos dados
  const [onboardingSteps, setOnboardingSteps] = useState<OnboardingStep[]>([]);
  const [sops, setSops] = useState<SOP[]>([]);
  const [tools, setTools] = useState<Tool[]>([]);
  const [isLoadingSops, setIsLoadingSops] = useState(false);
  const [isLoadingTools, setIsLoadingTools] = useState(false);

  // Carregar dados com useCallback para usar no useEffect de auto-refresh
  const fetchSops = useCallback(async (isBackground = false) => {
    if (!isBackground) setIsLoadingSops(true);
    try {
      const data = await SopService.getAll();
      // Comparação simples para evitar re-render desnecessário se os dados forem idênticos poderia ser feita aqui,
      // mas o React lida bem com isso na renderização da lista.
      setSops(data);
    } catch (error) {
      console.error("Failed to fetch SOPs", error);
    } finally {
      if (!isBackground) setIsLoadingSops(false);
    }
  }, []);

  const fetchTools = useCallback(async (isBackground = false) => {
    if (!isBackground) setIsLoadingTools(true);
    try {
      const data = await ToolsService.getAll();
      setTools(data);
    } catch (error) {
      console.error("Failed to fetch Tools", error);
    } finally {
      if (!isBackground) setIsLoadingTools(false);
    }
  }, []);

  const loadUserData = async (userData: User) => {
    try {
      const steps = await OnboardingService.getUserSteps(userData.email);
      setOnboardingSteps(steps);
    } catch (error) {
      console.error("Failed to load onboarding", error);
    }
  }

  // Efeito para carregar a sessão e dados ao abrir o app
  useEffect(() => {
    const storedUser = StorageService.getSession();
    if (storedUser) {
      setUser(storedUser);
      loadUserData(storedUser);
      fetchSops();
      fetchTools();
    }
  }, [fetchSops, fetchTools]);

  // Efeito de Auto-Refresh (Polling)
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;

    if (user && currentView === View.KNOWLEDGE_BASE) {
      // Atualiza SOPs a cada 5 segundos se estiver na tela de documentos
      interval = setInterval(() => {
        fetchSops(true); // true = background refresh (sem loading spinner)
      }, 5000);
    } else if (user && currentView === View.TOOLS) {
      // Atualiza Ferramentas a cada 10 segundos se estiver na tela de ferramentas
      interval = setInterval(() => {
        fetchTools(true);
      }, 10000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [currentView, user, fetchSops, fetchTools]);

  const handleLogin = (newUser: User) => {
    setUser(newUser);
    loadUserData(newUser);
    fetchSops();
    fetchTools();
    setCurrentView(View.DASHBOARD);
  };

  const handleLogout = () => {
    setUser(null);
    StorageService.clearSession();
    setOnboardingSteps([]); 
    setSops([]);
    setTools([]);
    setCurrentView(View.DASHBOARD);
  };

  const handleToggleStep = async (id: string) => {
    if (!user) return;
    
    const step = onboardingSteps.find(s => s.id === id);
    if (!step) return;

    // Optimistic UI Update
    const newSteps = onboardingSteps.map(s => 
      s.id === id ? { ...s, completed: !s.completed } : s
    );
    setOnboardingSteps(newSteps);

    // Backend Call
    try {
      await OnboardingService.toggleStep(user.email, id, step.completed);
    } catch (error) {
      console.error("Erro ao salvar passo", error);
      // Revert on failure
      setOnboardingSteps(onboardingSteps);
    }
  };

  // SOP CRUD Operations
  const handleAddSOP = async (newSOP: SOP) => {
    try {
      setIsLoadingSops(true);
      // Omitimos o ID para que o serviço/banco gere
      const { id, ...sopPayload } = newSOP;
      await SopService.create(sopPayload as any);
      await fetchSops(); 
      setCurrentView(View.KNOWLEDGE_BASE); 
    } catch (error: any) {
      alert("Erro ao adicionar SOP: " + error.message);
    } finally {
      setIsLoadingSops(false);
    }
  };

  const handleEditSOP = async (updatedSOP: SOP) => {
    try {
      setIsLoadingSops(true);
      await SopService.update(updatedSOP);
      await fetchSops();
    } catch (error: any) {
      alert("Erro ao atualizar SOP: " + error.message);
    } finally {
      setIsLoadingSops(false);
    }
  };

  const handleDeleteSOP = async (id: string) => {
    try {
      setIsLoadingSops(true);
      await SopService.delete(id);
      await fetchSops();
    } catch (error: any) {
      alert("Erro ao deletar SOP: " + error.message);
    } finally {
      setIsLoadingSops(false);
    }
  };

  // Tools CRUD
  const handleAddTool = async (tool: Tool) => {
    try {
      setIsLoadingTools(true);
      const { id, ...toolPayload } = tool;
      await ToolsService.create(toolPayload as any);
      await fetchTools();
    } catch (error: any) {
      alert("Erro ao adicionar ferramenta: " + error.message);
    } finally {
      setIsLoadingTools(false);
    }
  };

  const handleEditTool = async (updatedTool: Tool) => {
    try {
      setIsLoadingTools(true);
      await ToolsService.update(updatedTool);
      await fetchTools();
    } catch (error: any) {
      alert("Erro ao atualizar ferramenta: " + error.message);
    } finally {
      setIsLoadingTools(false);
    }
  };

  const handleDeleteTool = async (id: string) => {
    try {
      setIsLoadingTools(true);
      await ToolsService.delete(id);
      await fetchTools();
    } catch (error: any) {
      alert("Erro ao deletar ferramenta: " + error.message);
    } finally {
      setIsLoadingTools(false);
    }
  };

  const renderContent = () => {
    if (!user) return null;

    switch (currentView) {
      case View.DASHBOARD:
        return <Dashboard 
          onChangeView={setCurrentView} 
          recentSOPs={sops}
          pendingSteps={onboardingSteps}
        />;
      case View.ONBOARDING:
        return <Onboarding 
          steps={onboardingSteps} 
          onToggleStep={handleToggleStep} 
          onChangeView={setCurrentView}
        />;
      case View.KNOWLEDGE_BASE:
        if (isLoadingSops && sops.length === 0) {
          return (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="animate-spin text-indigo-500" size={48} />
            </div>
          );
        }
        return <KnowledgeBase 
          sops={sops} 
          user={user}
          onAddSOP={handleAddSOP}
          onEditSOP={handleEditSOP}
          onDeleteSOP={handleDeleteSOP}
        />;
      case View.TOOLS:
        if (isLoadingTools && tools.length === 0) {
          return (
             <div className="flex items-center justify-center h-64">
              <Loader2 className="animate-spin text-indigo-500" size={48} />
            </div>
          );
        }
        return <ToolsDirectory 
          tools={tools} 
          user={user}
          onAddTool={handleAddTool}
          onEditTool={handleEditTool}
          onDeleteTool={handleDeleteTool}
        />;
      case View.AI_ASSISTANT:
        return <AiAssistant />;
      case View.ADMIN:
        return user.role === 'admin' ? <AdminPanel onChangeView={setCurrentView} /> : <Dashboard onChangeView={setCurrentView} recentSOPs={sops} pendingSteps={onboardingSteps} />;
      default:
        return <Dashboard 
          onChangeView={setCurrentView} 
          recentSOPs={sops}
          pendingSteps={onboardingSteps}
        />;
    }
  };

  if (!user) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <div className="flex h-screen bg-slate-950 text-slate-100 overflow-hidden">
      <Sidebar 
        currentView={currentView} 
        onChangeView={setCurrentView}
        isOpen={sidebarOpen}
        setIsOpen={setSidebarOpen}
        user={user}
        onLogout={handleLogout}
      />

      <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        {/* Mobile Header */}
        <div className="md:hidden bg-slate-900 border-b border-slate-800 p-4 flex items-center justify-between z-10">
          <div className="flex items-center text-xl tracking-tight">
            <span className="text-white font-normal">Automatik</span>
            <span className="text-[#00FEFE] font-semibold">Labs</span>
          </div>
          <button onClick={() => setSidebarOpen(true)} className="text-slate-300 hover:text-white">
            <Menu size={24} />
          </button>
        </div>

        {/* Main Content Scrollable Area */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 scroll-smooth">
          <div className="max-w-7xl mx-auto w-full">
            {renderContent()}
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;