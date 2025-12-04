import React, { useEffect, useState } from 'react';
import { SOP, Tool, User, Department } from '../types';
import { UserService } from '../services/userService';
import { TrainingService } from '../services/trainingService';
import { Activity, Users, FileText, Wrench, Video, Network, Globe, Layers } from 'lucide-react';

interface OverviewProps {
  sops: SOP[];
  tools: Tool[];
}

const Overview: React.FC<OverviewProps> = ({ sops, tools }) => {
  const [userCount, setUserCount] = useState(0);
  const [trainingCount, setTrainingCount] = useState(0);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);

  // Stats calculation
  const totalSops = sops.length;
  const totalTools = tools.length;
  const totalProcesses = sops.filter(s => s.type === 'process').length;
  const totalStandards = sops.filter(s => s.type === 'standard').length;

  // Grouping for the 2D visualization
  const departments: Department[] = ['Comercial', 'Tech', 'Marketing', 'Sucesso do Cliente', 'Suporte', 'Operacional'];
  
  const getDeptStats = (dept: string) => {
    const deptSops = sops.filter(s => s.responsible_department === dept).length;
    const deptTools = tools.filter(t => t.target_department === dept).length;
    return { sops: deptSops, tools: deptTools };
  };

  useEffect(() => {
    UserService.getAll().then(users => setUserCount(users.length));
    TrainingService.getAll().then(trainings => setTrainingCount(trainings.length));
  }, []);

  // SVG Configuration
  const centerX = 400;
  const centerY = 300;
  const radius = 200;

  return (
    <div className="animate-in fade-in duration-700 h-full flex flex-col">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white mb-2 flex items-center gap-2">
          <Activity className="text-cyan-500" />
          VISÃO GERAL DO NEGÓCIO
        </h1>
        <p className="text-slate-400">Mapeamento em tempo real de recursos e conexões da organização.</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 flex-1 min-h-0">
        
        {/* Left Column: Metrics Cards */}
        <div className="lg:w-1/4 space-y-4 flex flex-col">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-4">
                <div className="bg-[#0B1120] border border-white/5 p-4 rounded-xl flex items-center gap-4 hover:border-cyan-500/30 transition-all group">
                    <div className="w-12 h-12 rounded-lg bg-cyan-900/20 flex items-center justify-center text-cyan-500 group-hover:scale-110 transition-transform">
                        <Users size={24} />
                    </div>
                    <div>
                        <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Colaboradores</p>
                        <p className="text-2xl font-bold text-white">{userCount}</p>
                    </div>
                </div>

                <div className="bg-[#0B1120] border border-white/5 p-4 rounded-xl flex items-center gap-4 hover:border-violet-500/30 transition-all group">
                    <div className="w-12 h-12 rounded-lg bg-violet-900/20 flex items-center justify-center text-violet-500 group-hover:scale-110 transition-transform">
                        <FileText size={24} />
                    </div>
                    <div>
                        <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Documentos</p>
                        <div className="flex items-baseline gap-2">
                             <p className="text-2xl font-bold text-white">{totalSops}</p>
                             <p className="text-[10px] text-slate-500">({totalProcesses} Processos)</p>
                        </div>
                    </div>
                </div>

                <div className="bg-[#0B1120] border border-white/5 p-4 rounded-xl flex items-center gap-4 hover:border-indigo-500/30 transition-all group">
                    <div className="w-12 h-12 rounded-lg bg-indigo-900/20 flex items-center justify-center text-indigo-500 group-hover:scale-110 transition-transform">
                        <Wrench size={24} />
                    </div>
                    <div>
                        <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Ferramentas</p>
                        <p className="text-2xl font-bold text-white">{totalTools}</p>
                    </div>
                </div>

                <div className="bg-[#0B1120] border border-white/5 p-4 rounded-xl flex items-center gap-4 hover:border-pink-500/30 transition-all group">
                    <div className="w-12 h-12 rounded-lg bg-pink-900/20 flex items-center justify-center text-pink-500 group-hover:scale-110 transition-transform">
                        <Video size={24} />
                    </div>
                    <div>
                        <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Treinamentos</p>
                        <p className="text-2xl font-bold text-white">{trainingCount}</p>
                    </div>
                </div>
            </div>

            {/* Recent Activity List (Simulated) */}
            <div className="flex-1 bg-[#0B1120] border border-white/5 rounded-xl p-5 overflow-hidden flex flex-col">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                    <Layers size={14} /> Distribuição de Recursos
                </h3>
                <div className="flex-1 overflow-y-auto custom-scrollbar space-y-3">
                    {departments.map(dept => {
                        const stats = getDeptStats(dept);
                        const total = stats.sops + stats.tools;
                        const percentage = total > 0 ? (total / (totalSops + totalTools)) * 100 : 0;
                        
                        return (
                            <div key={dept} className="group cursor-default">
                                <div className="flex justify-between items-center mb-1">
                                    <span className="text-sm text-slate-300 group-hover:text-cyan-400 transition-colors">{dept}</span>
                                    <span className="text-xs text-slate-500">{total} itens</span>
                                </div>
                                <div className="w-full bg-slate-800 h-1 rounded-full overflow-hidden">
                                    <div className="h-full bg-cyan-600 group-hover:bg-cyan-400 transition-all duration-500" style={{ width: `${Math.max(percentage, 5)}%` }}></div>
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>
        </div>

        {/* Right Column: 2D Panel Visualization */}
        <div className="lg:w-3/4 bg-[#020617] border border-slate-800 rounded-xl relative overflow-hidden shadow-2xl flex items-center justify-center">
             
             {/* Background Grid */}
             <div className="absolute inset-0 opacity-20" style={{ 
                 backgroundImage: 'linear-gradient(#1e293b 1px, transparent 1px), linear-gradient(90deg, #1e293b 1px, transparent 1px)', 
                 backgroundSize: '40px 40px' 
             }}></div>
             
             {/* Radial Gradient Glow */}
             <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/5 via-violet-500/5 to-transparent rounded-full blur-3xl transform scale-75"></div>

             {/* SVG Graph */}
             <svg width="100%" height="100%" viewBox="0 0 800 600" className="relative z-10 pointer-events-auto">
                <defs>
                    <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
                        <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
                        <feMerge>
                            <feMergeNode in="coloredBlur"/>
                            <feMergeNode in="SourceGraphic"/>
                        </feMerge>
                    </filter>
                    <linearGradient id="lineGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#0891b2" stopOpacity="0.2" />
                        <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.2" />
                    </linearGradient>
                </defs>

                {/* Connecting Lines */}
                {departments.map((dept, i) => {
                    const angle = (i * (360 / departments.length)) * (Math.PI / 180);
                    const x = centerX + radius * Math.cos(angle);
                    const y = centerY + radius * Math.sin(angle);
                    
                    return (
                        <g key={`line-${i}`}>
                            <line 
                                x1={centerX} 
                                y1={centerY} 
                                x2={x} 
                                y2={y} 
                                stroke="url(#lineGrad)" 
                                strokeWidth="1" 
                                className="transition-all duration-1000 ease-out"
                            />
                            {/* Animated Pulse on Line */}
                            <circle r="2" fill="#22d3ee">
                                <animateMotion dur={`${3 + i}s`} repeatCount="indefinite" path={`M${centerX},${centerY} L${x},${y}`} />
                            </circle>
                        </g>
                    );
                })}

                {/* Central Hub Node */}
                <g 
                    onMouseEnter={() => setHoveredNode('Hub')} 
                    onMouseLeave={() => setHoveredNode(null)}
                    className="cursor-pointer"
                >
                    <circle cx={centerX} cy={centerY} r="50" fill="#0f172a" stroke="#0891b2" strokeWidth="2" filter="url(#glow)" />
                    <Globe x={centerX - 16} y={centerY - 16} size={32} className="text-cyan-400" />
                    <text x={centerX} y={centerY + 70} textAnchor="middle" fill="#94a3b8" fontSize="12" letterSpacing="2">HUB CENTRAL</text>
                    {hoveredNode === 'Hub' && (
                        <foreignObject x={centerX + 60} y={centerY - 50} width="160" height="100">
                             <div className="bg-slate-900/90 border border-cyan-500/50 p-3 rounded-lg text-xs text-white shadow-xl backdrop-blur-sm">
                                 <p className="font-bold text-cyan-400 mb-1">AUTOMATIK LABS</p>
                                 <p>Conexões Ativas: {departments.length}</p>
                                 <p>Status: Operacional</p>
                             </div>
                        </foreignObject>
                    )}
                </g>

                {/* Department Nodes */}
                {departments.map((dept, i) => {
                    const angle = (i * (360 / departments.length)) * (Math.PI / 180);
                    const x = centerX + radius * Math.cos(angle);
                    const y = centerY + radius * Math.sin(angle);
                    const stats = getDeptStats(dept);
                    const size = 25 + Math.min(stats.sops * 1.5, 20); // Dynamic size based on content

                    return (
                        <g 
                            key={dept} 
                            className="transition-all duration-300 hover:scale-110 cursor-pointer"
                            onMouseEnter={() => setHoveredNode(dept)} 
                            onMouseLeave={() => setHoveredNode(null)}
                        >
                            {/* Outer Orbit Ring for Node */}
                            <circle cx={x} cy={y} r={size + 5} fill="none" stroke="#475569" strokeWidth="1" strokeDasharray="4 4" className="opacity-50 animate-spin-slow" />
                            
                            {/* Main Dept Node */}
                            <circle cx={x} cy={y} r={size} fill="#1e293b" stroke={stats.sops > 0 ? "#8b5cf6" : "#64748b"} strokeWidth="2" filter="url(#glow)" />
                            
                            {/* Icon inside Node */}
                            <Network x={x - 10} y={y - 10} size={20} className={stats.sops > 0 ? "text-violet-400" : "text-slate-500"} />

                            {/* Label */}
                            <text x={x} y={y + size + 20} textAnchor="middle" fill="#e2e8f0" fontSize="10" fontWeight="bold" className="uppercase">{dept}</text>

                            {/* Orbiting Satellite Dots (Simulating Resources) */}
                            {Array.from({ length: Math.min(stats.sops, 5) }).map((_, idx) => (
                                <circle key={idx} r="3" fill="#38bdf8" filter="url(#glow)">
                                    <animateTransform 
                                        attributeName="transform" 
                                        type="rotate" 
                                        from={`0 ${x} ${y}`} 
                                        to={`360 ${x} ${y}`} 
                                        dur={`${3 + idx}s`} 
                                        repeatCount="indefinite" 
                                    />
                                    <animateTransform 
                                        attributeName="transform" 
                                        type="translate" 
                                        values={`${x} ${y - size - 8}; ${x} ${y - size - 8}`} 
                                        additive="sum"
                                    />
                                </circle>
                            ))}

                            {/* Hover Tooltip */}
                            {hoveredNode === dept && (
                                <foreignObject x={x + 30} y={y - 50} width="150" height="120">
                                     <div className="bg-slate-900/90 border border-violet-500/50 p-3 rounded-lg text-xs text-white shadow-xl backdrop-blur-sm z-50">
                                         <p className="font-bold text-violet-400 mb-1 border-b border-white/10 pb-1">{dept}</p>
                                         <div className="space-y-1 mt-1">
                                            <div className="flex justify-between"><span>SOPs:</span> <span className="font-mono">{stats.sops}</span></div>
                                            <div className="flex justify-between"><span>Tools:</span> <span className="font-mono">{stats.tools}</span></div>
                                         </div>
                                     </div>
                                </foreignObject>
                            )}
                        </g>
                    );
                })}
             </svg>

             {/* Legend Overlay */}
             <div className="absolute bottom-4 right-4 bg-black/60 backdrop-blur-md p-3 rounded-lg border border-white/10 text-[10px] text-slate-400">
                <div className="flex items-center gap-2 mb-1">
                    <span className="w-2 h-2 rounded-full bg-cyan-500"></span> Hub Central
                </div>
                <div className="flex items-center gap-2 mb-1">
                    <span className="w-2 h-2 rounded-full bg-violet-500"></span> Departamentos Ativos
                </div>
                <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-slate-600"></span> Sem Recursos
                </div>
             </div>
        </div>
      </div>
    </div>
  );
};

export default Overview;