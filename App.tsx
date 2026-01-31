
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import Onboarding from './components/Onboarding';
import EmployeeJourney from './components/EmployeeJourney';
import KnowledgeBase from './components/KnowledgeBase';
import ToolsDirectory from './components/ToolsDirectory';
import AiAssistant from './components/AiAssistant';
import AdminPanel from './components/AdminPanel';
import TrainingHub from './components/TrainingHub';
import Overview from './components/Overview';
import UtmGenerator from './components/UtmGenerator';
import Login from './components/Login';
import { View, OnboardingStep, User, SOP, Tool } from './types';
import { StorageService } from './services/storage';
import { SopService } from './services/sopService';
import { OnboardingService } from './services/onboardingService';
import { ToolsService } from './services/toolsService';
import { Menu, Loader2, AlertTriangle, Ghost, Home } from 'lucide-react';
import { LOGO_URL, MOCK_SOPS, MOCK_TOOLS } from './constants';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [currentView, setCurrentView] = useState<View>(View.LOGIN);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  const [onboardingSteps, setOnboardingSteps] = useState<OnboardingStep[]>([]);
  const [sops, setSops] = useState<SOP[]>([]);
  const [tools, setTools] = useState<Tool[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const routeMap = useMemo(() => ({
    '/login': View.LOGIN,
    '/panel': View.DASHBOARD,
    '/panel/onboarding': View.ONBOARDING,
    '/panel/journey': View.JOURNEY,
    '/panel/knowledge': View.KNOWLEDGE_BASE,
    '/panel/tools': View.TOOLS,
    '/panel/training': View.TRAINING,
    '/panel/utm': View.UTM_GENERATOR,
    '/panel/ai': View.AI_ASSISTANT,
    '/panel/admin': View.ADMIN,
    '/panel/overview': View.OVERVIEW
  }), []);

  const getPathFromView = useCallback((view: View): string => {
    return Object.keys(routeMap).find(key => routeMap[key as keyof typeof routeMap] === view) || '/panel';
  }, [routeMap]);

  const safeNavigate = useCallback((view: View, replace = false) => {
    setCurrentView(view);
    setSidebarOpen(false);
    const path = getPathFromView(view);
    try {
      if (replace) window.history.replaceState({ view }, '', path);
      else window.history.pushState({ view }, '', path);
    } catch (e) {
      console.warn("History API bloqueada. Navegando via estado interno:", path);
    }
  }, [getPathFromView]);

  const fetchData = useCallback(async () => {
    try {
      const [s, t] = await Promise.all([
        SopService.getAll().catch(() => MOCK_SOPS),
        ToolsService.getAll().catch(() => MOCK_TOOLS)
      ]);
      setSops(s || MOCK_SOPS);
      setTools(t || MOCK_TOOLS);
    } catch (err) {
      console.error("Erro ao carregar dados:", err);
      setSops(MOCK_SOPS);
      setTools(MOCK_TOOLS);
    }
  }, []);

  const handleAddSOP = async (newSop: SOP) => {
    try {
      const savedSop = await SopService.create(newSop);
      setSops(prev => [savedSop, ...prev]);
    } catch (e) {
      console.error("Erro ao criar documento:", e);
      alert("Erro ao salvar documento no banco.");
    }
  };

  const handleEditSOP = async (updatedSop: SOP) => {
    try {
      const savedSop = await SopService.update(updatedSop);
      setSops(prev => prev.map(s => s.id === savedSop.id ? savedSop : s));
    } catch (e) {
      console.error("Erro ao atualizar documento:", e);
      alert("Erro ao atualizar documento no banco.");
    }
  };

  const handleDeleteSOP = async (id: string) => {
    try {
      await SopService.delete(id);
      setSops(prev => prev.filter(s => s.id !== id));
    } catch (e) {
      console.error("Erro ao deletar documento:", e);
      alert("Erro ao excluir documento.");
    }
  };

  const handleAddTool = async (newTool: Tool) => {
    try {
      const saved = await ToolsService.create(newTool);
      setTools(prev => [saved, ...prev]);
    } catch (e) { console.error(e); }
  };

  const handleEditTool = async (tool: Tool) => {
    try {
      const saved = await ToolsService.update(tool);
      setTools(prev => prev.map(t => t.id === saved.id ? saved : t));
    } catch (e) { console.error(e); }
  };

  const handleDeleteTool = async (id: string) => {
    try {
      await ToolsService.delete(id);
      setTools(prev => prev.filter(t => t.id !== id));
    } catch (e) { console.error(e); }
  };

  const loadOnboarding = useCallback(async (email: string) => {
    try {
      const steps = await OnboardingService.getUserSteps(email);
      setOnboardingSteps(steps || []);
    } catch (error) { console.error(error); }
  }, []);

  useEffect(() => {
    const initApp = async () => {
      setIsLoading(true);
      const storedUser = StorageService.getSession();
      if (storedUser) {
        setUser(storedUser);
        await Promise.all([loadOnboarding(storedUser.email), fetchData()]);
        const path = window.location.pathname;
        const matchedView = routeMap[path as keyof typeof routeMap];
        if (matchedView && matchedView !== View.LOGIN) {
          if ((matchedView === View.ADMIN || matchedView === View.OVERVIEW) && storedUser.role !== 'admin') {
            safeNavigate(View.DASHBOARD, true);
          } else {
            setCurrentView(matchedView);
          }
        } else {
          safeNavigate(View.DASHBOARD, true);
        }
      } else {
        setUser(null);
        setCurrentView(View.LOGIN);
        try { window.history.replaceState({ view: View.LOGIN }, '', '/login'); } catch(e) {}
      }
      setIsLoading(false);
    };
    initApp();
  }, [fetchData, loadOnboarding, safeNavigate, routeMap]);

  const handleLogin = (newUser: User) => {
    setUser(newUser);
    loadOnboarding(newUser.email);
    fetchData();
    safeNavigate(View.DASHBOARD, true);
  };

  const handleLogout = () => {
    setUser(null);
    StorageService.clearSession();
    safeNavigate(View.LOGIN, true);
  };

  const renderContent = () => {
    if (!user) return <Login onLogin={handleLogin} />;
    switch (currentView) {
      case View.DASHBOARD:
        return <Dashboard onChangeView={safeNavigate} recentSOPs={sops} pendingSteps={onboardingSteps} />;
      case View.ONBOARDING:
        return <Onboarding steps={onboardingSteps} onToggleStep={() => {}} onChangeView={safeNavigate} />;
      case View.OVERVIEW:
        return <Overview sops={sops} tools={tools} />;
      case View.KNOWLEDGE_BASE:
        return (
          <KnowledgeBase 
            sops={sops} 
            user={user} 
            onAddSOP={handleAddSOP} 
            onEditSOP={handleEditSOP} 
            onDeleteSOP={handleDeleteSOP} 
          />
        );
      case View.TOOLS:
        return (
          <ToolsDirectory 
            tools={tools} 
            user={user} 
            onAddTool={handleAddTool} 
            onEditTool={handleEditTool} 
            onDeleteTool={handleDeleteTool} 
          />
        );
      case View.UTM_GENERATOR: return <UtmGenerator />;
      case View.TRAINING: return <TrainingHub />;
      case View.ADMIN: return <AdminPanel onChangeView={safeNavigate} />;
      default: return <Dashboard onChangeView={safeNavigate} recentSOPs={sops} pendingSteps={onboardingSteps} />;
    }
  };

  if (isLoading) {
    return (
      <div className="h-screen bg-[#020617] flex flex-col items-center justify-center gap-6">
        <Loader2 className="animate-spin text-cyan-500" size={64} />
        <p className="text-slate-500 font-mono text-xs uppercase tracking-widest">Acessando Camada Segura...</p>
      </div>
    );
  }

  const showSidebar = user && currentView !== View.LOGIN;

  return (
    <div className="flex h-screen bg-[#020617] text-slate-100 overflow-hidden font-sans">
      {showSidebar && (
        <Sidebar 
          currentView={currentView} 
          onChangeView={safeNavigate}
          isOpen={sidebarOpen}
          setIsOpen={setSidebarOpen}
          user={user}
          onLogout={handleLogout}
        />
      )}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        {showSidebar && (
          <div className="md:hidden bg-[#020617]/95 backdrop-blur-md border-b border-white/5 p-4 flex items-center justify-between z-40">
            <img src={LOGO_URL} alt="AutomatikHub" className="h-8 w-auto object-contain" />
            <button onClick={() => setSidebarOpen(true)} className="text-slate-300 p-2"><Menu size={24} /></button>
          </div>
        )}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar">
          <div className="max-w-[1600px] mx-auto w-full h-full">
            {renderContent()}
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;
