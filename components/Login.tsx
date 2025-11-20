import React, { useState } from 'react';
import { User } from '../types';
import { UserService } from '../services/userService';
import { StorageService } from '../services/storage';
import { APP_NAME, LOGO_URL } from '../constants';
import { ArrowRight, Mail, Lock, Loader2 } from 'lucide-react';

interface LoginProps {
  onLogin: (user: User) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      if (!email || !password) {
        throw new Error('Por favor, preencha todos os campos.');
      }

      // Backdoor for admin/admin
      if (email === 'admin' && password === 'admin') {
        const masterAdmin: User = {
            name: 'Master Admin',
            email: 'admin@automatik.local',
            avatar: 'https://ui-avatars.com/api/?name=Master+Admin&background=6366f1&color=fff',
            role: 'admin',
            department: 'Tech'
        };
        StorageService.saveSession(masterAdmin);
        onLogin(masterAdmin);
        return;
      }

      const normalizedEmail = email.toLowerCase().trim();

      if (password !== '123456') {
        throw new Error('Senha incorreta.');
      }

      // Access Control Logic
      // Since we don't have a list of all users in memory before login, we check strict allowed list OR if they already exist in DB
      // Note: We can't check DB existence easily without triggering an async call, which findOrCreate handles.
      
      // Simulating auth logic - format name from email
      const namePart = normalizedEmail.split('@')[0];
      const formattedName = namePart
        .split('.')
        .map(n => n.charAt(0).toUpperCase() + n.slice(1))
        .join(' ');

      const avatarUrl = `https://api.dicebear.com/7.x/avataaars/svg?seed=${normalizedEmail}`;

      // Retrieve or Create user in Supabase/Local
      const user = await UserService.findOrCreate(normalizedEmail, formattedName, avatarUrl);
      
      onLogin(user);

    } catch (err: any) {
      setError(err.message || 'Ocorreu um erro ao fazer login.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Blobs/Gradients to mimic brand */}
      <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-indigo-600/20 rounded-full blur-[100px]" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] bg-cyan-500/20 rounded-full blur-[100px]" />

      <div className="bg-slate-900 w-full max-w-md rounded-2xl shadow-2xl border border-slate-800 overflow-hidden flex flex-col relative z-10">
        {/* Header */}
        <div className="bg-slate-900 p-8 text-center border-b border-slate-800">
          <div className="flex justify-center mb-4">
            <img 
              src={LOGO_URL} 
              alt={APP_NAME} 
              className="w-16 h-16 rounded-xl shadow-lg shadow-indigo-500/30" 
            />
          </div>
          <h1 className="text-2xl font-bold text-white mb-1">{APP_NAME}</h1>
          <p className="text-slate-400 text-sm">Área Restrita</p>
        </div>

        {/* Form */}
        <div className="p-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
              <input
                type="text"
                placeholder="Seu e-mail corporativo"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-slate-950 border border-slate-800 text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent placeholder-slate-600"
                disabled={isLoading}
              />
            </div>

            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
              <input
                type="password"
                placeholder="Sua senha"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-slate-950 border border-slate-800 text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent placeholder-slate-600"
                disabled={isLoading}
              />
            </div>

            {error && <p className="text-red-400 text-sm text-center font-medium bg-red-900/20 p-2 rounded-lg border border-red-900/50">{error}</p>}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-indigo-900/20 flex items-center justify-center gap-2 group mt-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <Loader2 size={18} className="animate-spin" /> Entrando...
                </>
              ) : (
                <>
                  Acessar Portal
                  <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-xs text-slate-500">
              Acesso exclusivo para colaboradores autorizados.
              <br/>
              Problemas no acesso? Contate o admin.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;