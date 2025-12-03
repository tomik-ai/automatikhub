import React, { useState } from 'react';
import { User } from '../types';
import { UserService } from '../services/userService';
import { StorageService } from '../services/storage';
import { ArrowRight, Mail, Lock, Loader2, AlertCircle } from 'lucide-react';
import { LOGO_URL, COMPANY_NAME } from '../constants';

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

      // Simulating auth logic
      const namePart = normalizedEmail.split('@')[0];
      const formattedName = namePart
        .split('.')
        .map(n => n.charAt(0).toUpperCase() + n.slice(1))
        .join(' ');

      const avatarUrl = `https://api.dicebear.com/7.x/avataaars/svg?seed=${normalizedEmail}`;

      const user = await UserService.findOrCreate(normalizedEmail, formattedName, avatarUrl);
      onLogin(user);

    } catch (err: any) {
      setError(err.message || 'Ocorreu um erro ao fazer login.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#020617] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Cyber Background Effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-[-10%] left-[-10%] w-[600px] h-[600px] bg-cyan-500/10 rounded-full blur-[120px] mix-blend-screen animate-pulse" style={{ animationDuration: '4s' }} />
          <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-violet-600/10 rounded-full blur-[120px] mix-blend-screen animate-pulse" style={{ animationDuration: '7s' }} />
          <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)', backgroundSize: '50px 50px' }}></div>
      </div>

      <div className="w-full max-w-[400px] relative z-10 perspective-1000">
        <div className="bg-[#0B1120]/60 backdrop-blur-xl rounded-2xl border border-white/10 shadow-[0_0_50px_-10px_rgba(0,0,0,0.5)] overflow-hidden">
          
          {/* Header */}
          <div className="p-10 pb-6 text-center border-b border-white/5 bg-white/5 relative">
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent"></div>
            <div className="flex justify-center mb-6">
              <img 
                src={LOGO_URL} 
                alt={COMPANY_NAME} 
                className="w-[300px] h-auto object-contain drop-shadow-[0_0_15px_rgba(6,182,212,0.3)]" 
              />
            </div>
            <p className="text-cyan-400/80 text-xs font-bold uppercase tracking-[0.2em]">Restricted Access</p>
          </div>

          {/* Form */}
          <div className="p-8">
            <form onSubmit={handleSubmit} className="space-y-5">
              
              <div className="space-y-1.5">
                <label className="text-xs text-slate-400 font-bold uppercase tracking-wider ml-1">Identity</label>
                <div className="relative group">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-cyan-400 transition-colors" size={18} />
                  <input
                    type="text"
                    placeholder="E-mail corporativo"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-[#020617]/50 border border-white/10 text-white rounded-lg focus:outline-none focus:border-cyan-500/50 focus:shadow-[0_0_20px_-5px_rgba(6,182,212,0.2)] placeholder-slate-600 transition-all font-mono text-sm"
                    disabled={isLoading}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs text-slate-400 font-bold uppercase tracking-wider ml-1">Passcode</label>
                <div className="relative group">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-cyan-400 transition-colors" size={18} />
                  <input
                    type="password"
                    placeholder="Senha de acesso"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-[#020617]/50 border border-white/10 text-white rounded-lg focus:outline-none focus:border-cyan-500/50 focus:shadow-[0_0_20px_-5px_rgba(6,182,212,0.2)] placeholder-slate-600 transition-all font-mono text-sm"
                    disabled={isLoading}
                  />
                </div>
              </div>

              {error && (
                <div className="flex items-center gap-2 text-red-400 text-xs font-bold bg-red-950/30 p-3 rounded-lg border border-red-500/20">
                  <AlertCircle size={14} className="shrink-0" />
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-3 rounded-lg transition-all shadow-[0_0_20px_-5px_rgba(8,145,178,0.4)] hover:shadow-[0_0_30px_-5px_rgba(8,145,178,0.6)] flex items-center justify-center gap-2 group mt-4 uppercase tracking-wide text-xs disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" /> Authenticating...
                  </>
                ) : (
                  <>
                    Connect to Portal
                    <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            </form>

            <div className="mt-8 text-center">
              <p className="text-[10px] text-slate-600 font-mono">
                SECURE CONNECTION ESTABLISHED v2.1.0
                <br/>
                AUTOMATIK LABS © {new Date().getFullYear()}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;