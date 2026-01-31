import React, { useState, useEffect, useCallback } from 'react';
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
import { Menu, Loader2, AlertTriangle } from 'lucide-react';
import { LOGO_URL, MOCK_SOPS, MOCK_TOOLS } from './constants';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [currentView, setCurrentView] = useState<View>(View.DASHBOARD);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  const [onboardingSteps, setOnboardingSteps] = useState<OnboardingStep[]>([]);
  const [sops, setSops] = useState<SOP[]>([]);
  const [tools, setTools] = useState<Tool[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Carrega dados. Se o banco estiver vazio, usa os MOCKS.
      const [s, t] = await Promise.all([
        SopService.getAll().catch(() => MOCK_SOPS),
        ToolsService.getAll().catch(() => MOCK_TOOLS)
      ]);
      
      setSops(s.length > 0 ? s : MOCK_SOPS);
      setTools(t.length > 0 ? t : MOCK_TOOLS);
    } catch (err) {
      console.error("Erro crítico ao carregar dados:", err);
      setSops(MOCK_SOPS);
      setTools(MOCK_TOOLS);
      setError("Não foi possível conectar ao banco de dados. Usando modo de demonstração.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loadOnboarding = useCallback(async (email: string) => {
    try {
      const steps = await OnboardingService.getUserSteps(email);
      setOnboardingSteps(steps);
    } catch (error) {
      console.error("Erro ao carregar onboarding:", error);
    }
  }, []);

  useEffect(() => {
    const storedUser = StorageService.getSession();
    if (storedUser) {
      setUser(storedUser);
      loadOnboarding(storedUser.email);
      fetchData();
    } else {
      setIsLoading(false);
    }
  }, [fetchData, loadOnboarding]);

  const handleLogin = (newUser: User) => {
    setUser(newUser);
    loadOnboarding(newUser.email);
    fetchData();
    setCurrentView(View.DASHBOARD);
  };

  const handleLogout = () => {
    setUser(null);
    StorageService.clearSession();
    setCurrentView(View.DASHBOARD);
  };

  const renderContent = () => {
    if (!user) return null;

    switch (currentView) {
      case View.DASHBOARD:
        return <Dashboard onChangeView={setCurrentView} recentSOPs={sops} pendingSteps={onboardingSteps} />;
      case View.ONBOARDING:
        return <Onboarding steps={onboardingSteps} onToggleStep={() => {}} onChangeView={setCurrentView} />;
      case View.JOURNEY:
        return <EmployeeJourney />;
      case View.OVERVIEW:
        return <Overview sops={sops} tools={tools} />;
      case View.KNOWLEDGE_BASE:
        return <KnowledgeBase sops={sops} user={user} onAddSOP={() => {}} onEditSOP={() => {}} onDeleteSOP={async () => {}} />;
      case View.TOOLS:
        return <ToolsDirectory tools={tools} user={user} onAddTool={() => {}} onEditTool={() => {}} onDeleteTool={() => {}} />;
      case View.UTM_GENERATOR:
        return <UtmGenerator />;
      case View.TRAINING:
        return <TrainingHub />;
      case View.AI_ASSISTANT:
        return <AiAssistant />;
      case View.ADMIN:
        return <AdminPanel onChangeView={setCurrentView} />;
      default:
        return <Dashboard onChangeView={setCurrentView} recentSOPs={sops} pendingSteps={onboardingSteps} />;
    }
  };

  if (isLoading) {
    return (
      <div className="h-screen bg-[#020617] flex flex-col items-center justify-center gap-4">
        <Loader2 className="animate-spin text-cyan-500" size={48} />
        <p className="text-slate-400 font-mono text-sm animate-pulse tracking-widest uppercase">Inicializando AutomatikHub...</p>
      </div>
    );
  }

  if (!user) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <div className="flex h-screen bg-[#020617] text-slate-100 overflow-hidden font-sans">
      <Sidebar 
        currentView={currentView} 
        onChangeView={setCurrentView}
        isOpen={sidebarOpen}
        setIsOpen={setSidebarOpen}
        user={user}
        onLogout={handleLogout}
      />

      <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        {error && (
            <div className="bg-amber-900/40 border-b border-amber-500/30 p-2 text-center text-[10px] text-amber-200 flex items-center justify-center gap-2">
                <AlertTriangle size={12} /> {error}
            </div>
        )}

        <div className="md:hidden bg-[#020617]/90 backdrop-blur-md border-b border-white/5 p-4 flex items-center justify-between z-10 sticky top-0">
          <img src={LOGO_URL} alt="AutomatikHub" className="h-8 w-auto object-contain" />
          <button onClick={() => setSidebarOpen(true)} className="text-slate-300 hover:text-white">
            <Menu size={24} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 md:p-8 scroll-smooth custom-scrollbar">
          <div className="max-w-[1600px] mx-auto w-full h-full">
            {renderContent()}
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;