
import React, { useState, useEffect, useRef } from 'react';
import { SOP, User, ProcessDetails } from '../types';
import { UserService } from '../services/userService';
import { transcribeAudioToDoc } from '../services/geminiService';
import { DEPARTMENTS } from '../constants';
import { Search, Plus, FileText, Tag, X, Edit2, Trash2, Save, Loader2, Check, AlertTriangle, Building2, Users, Calendar, ArrowRight, Book, ClipboardList, ListTree, Target, Activity, Upload, Filter, Lock, Clock, ChevronRight, Mic, Square, Sparkles } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface KnowledgeBaseProps {
  sops: SOP[];
  user: User;
  onAddSOP: (sop: SOP) => void;
  onEditSOP: (sop: SOP) => void;
  onDeleteSOP: (id: string) => Promise<void>;
}

const KnowledgeBase: React.FC<KnowledgeBaseProps> = ({ sops, user, onAddSOP, onEditSOP, onDeleteSOP }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('Todos');
  const [selectedType, setSelectedType] = useState<'Todos' | 'standard' | 'process'>('Todos');
  const [selectedSOP, setSelectedSOP] = useState<SOP | null>(null);
  
  const [isTypeSelectionOpen, setIsTypeSelectionOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  
  const [deletingId, setDeletingId] = useState<string | null>(null);
  
  const [formData, setFormData] = useState<Partial<SOP>>({});
  const [processData, setProcessData] = useState<Partial<ProcessDetails>>({});
  const [confirmingDeleteId, setConfirmingDeleteId] = useState<string | null>(null);

  // Audio Recording States
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);

  const categories = ['Todos', 'HR', 'Tech', 'Vendas', 'Operacional', 'Geral'];
  const isAdminOrMod = user.role === 'admin' || user.role === 'moderator';

  // Audio Logic
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        await handleProcessAudio(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);
      timerRef.current = window.setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } catch (err) {
      console.error("Erro ao acessar microfone:", err);
      alert("Não foi possível acessar o microfone. Verifique as permissões.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) clearInterval(timerRef.current);
    }
  };

  const handleProcessAudio = async (blob: Blob) => {
    setIsTranscribing(true);
    try {
      const reader = new FileReader();
      reader.readAsDataURL(blob);
      reader.onloadend = async () => {
        const base64Audio = (reader.result as string).split(',')[1];
        const transcription = await transcribeAudioToDoc(base64Audio, blob.type);
        setFormData(prev => ({
          ...prev,
          content: (prev.content ? prev.content + "\n\n" : "") + transcription
        }));
      };
    } catch (error) {
      console.error("Erro ao transcrever áudio:", error);
      alert("Erro ao processar áudio com a IA.");
    } finally {
      setIsTranscribing(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Rest of original logic...
  const filteredSOPs = sops.filter(sop => {
    const matchesSearch = sop.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          sop.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          sop.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = selectedCategory === 'Todos' || sop.category === selectedCategory;
    const matchesType = selectedType === 'Todos' || sop.type === selectedType;
    return matchesSearch && matchesCategory && matchesType;
  });

  const handleOpenCreateClick = () => {
    if (isAdminOrMod) setIsTypeSelectionOpen(true);
    else startCreate('process');
  };

  const startCreate = (type: 'standard' | 'process') => {
    setIsTypeSelectionOpen(false);
    setFormData({ title: '', category: 'Geral', content: '', tags: [], responsible_department: 'Geral', responsible_users: [], type: type });
    setProcessData({ objective: '', scope_includes: '', scope_excludes: '', materials: '', metrics: '', created_by: user.name });
    setIsCreating(true);
    setIsEditing(false);
  };

  const handleOpenEdit = (sop: SOP, e?: React.MouseEvent) => {
    if (e) { e.stopPropagation(); e.preventDefault(); }
    if (!isAdminOrMod && sop.type === 'standard') {
        alert("Apenas administradores e moderadores podem editar Documentos Padrão.");
        return;
    }
    setFormData({ ...sop, responsible_users: sop.responsible_users || [] });
    setProcessData(sop.process_details || { objective: '', scope_includes: '', scope_excludes: '', materials: '', metrics: '', created_by: user.name });
    setIsEditing(true);
    setIsCreating(false);
    setSelectedSOP(null); 
  };

  const handleRequestDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation(); e.preventDefault();
    setConfirmingDeleteId(id);
    setTimeout(() => { setConfirmingDeleteId(prev => prev === id ? null : prev); }, 3000);
  };

  const handleConfirmDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation(); e.preventDefault();
    setConfirmingDeleteId(null);
    setDeletingId(id);
    try {
      await onDeleteSOP(id);
      if (selectedSOP?.id === id) setSelectedSOP(null);
    } finally { setDeletingId(null); }
  };

  const handleSave = () => {
    if (!formData.title?.trim() || !formData.category || !formData.content?.trim()) {
      alert("Por favor, preencha os campos obrigatórios.");
      return;
    }
    const processedTags = typeof formData.tags === 'string' 
      ? (formData.tags as string).split(',').map((t: string) => t.trim()).filter(t => t !== '') 
      : formData.tags || [];

    const finalSOP: SOP = {
        ...(formData as SOP),
        id: formData.id || Date.now().toString(),
        lastUpdated: new Date().toISOString(),
        tags: processedTags,
        type: formData.type || 'standard',
        process_details: formData.type === 'process' ? processData as ProcessDetails : undefined
    };

    if (isCreating) onAddSOP(finalSOP);
    else if (isEditing) onEditSOP(finalSOP);

    setIsCreating(false); setIsEditing(false);
    setFormData({}); setProcessData({});
  };

  const markdownComponents = {
    h1: ({node, ...props}: any) => <h1 className="text-2xl font-bold text-white mt-8 mb-4 border-b border-white/10 pb-2" {...props} />,
    h2: ({node, ...props}: any) => <h2 className="text-xl font-bold text-cyan-400 mt-6 mb-3" {...props} />,
    p: ({node, ...props}: any) => <p className="mb-4 text-slate-300 leading-relaxed" {...props} />,
    ul: ({node, ...props}: any) => <ul className="list-disc pl-6 space-y-2 mb-4" {...props} />,
    li: ({node, ...props}: any) => <li className="text-slate-300" {...props} />,
    code: ({node, inline, ...props}: any) => inline 
        ? <code className="bg-white/5 text-cyan-300 px-1 rounded" {...props} /> 
        : <pre className="bg-slate-950 p-4 rounded-lg overflow-x-auto my-4 border border-white/5"><code className="text-sm text-cyan-100" {...props} /></pre>
  };

  return (
    <div className="h-full flex flex-col space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
            <Book size={28} className="text-cyan-500" />
            CENTRAL DE CONHECIMENTO
          </h1>
          <p className="text-slate-400 max-w-2xl font-light">Repositório de inteligência operacional da Automatik.</p>
        </div>
        {isAdminOrMod && (
          <button 
            onClick={handleOpenCreateClick}
            className="bg-cyan-600 hover:bg-cyan-500 text-white px-5 py-2.5 rounded-lg font-bold uppercase tracking-wider text-xs flex items-center gap-2 transition-all shadow-[0_0_15px_rgba(8,145,178,0.3)]"
          >
            <Plus size={16} /> Novo Documento
          </button>
        )}
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
          <input
            type="text"
            placeholder="Pesquisar por título, conteúdo ou tags..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-11 pr-4 py-3 bg-[#0B1120] border border-white/10 text-white rounded-lg focus:outline-none focus:border-cyan-500/50 font-mono text-sm"
          />
        </div>
        <div className="flex bg-[#0B1120] border border-white/10 p-1 rounded-lg">
           {categories.map(cat => (
             <button
               key={cat}
               onClick={() => setSelectedCategory(cat)}
               className={`px-4 py-2 rounded-md text-[10px] font-bold uppercase tracking-wider transition-all ${selectedCategory === cat ? 'bg-cyan-600 text-white' : 'text-slate-500 hover:text-slate-300'}`}
             >
               {cat}
             </button>
           ))}
        </div>
      </div>

      <div className="hidden md:grid grid-cols-12 gap-4 px-6 py-3 border-b border-white/5 text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">
        <div className="col-span-6">Protocolo / Título</div>
        <div className="col-span-2 text-center">Setor</div>
        <div className="col-span-2 text-center">Última Modificação</div>
        <div className="col-span-2 text-right pr-2">Ações</div>
      </div>

      <div className="space-y-2 flex-1 overflow-y-auto custom-scrollbar">
        {filteredSOPs.map(sop => (
          <div 
            key={sop.id}
            onClick={() => setSelectedSOP(sop)}
            className={`
              grid grid-cols-1 md:grid-cols-12 gap-4 items-center px-6 py-4 rounded-xl border border-white/5 bg-[#0B1120]/40 backdrop-blur-sm transition-all cursor-pointer group
              hover:bg-[#0B1120] hover:border-cyan-500/30 hover:shadow-[0_0_20px_rgba(6,182,212,0.05)]
              ${deletingId === sop.id ? 'opacity-40 pointer-events-none' : ''}
            `}
          >
            <div className="col-span-1 md:col-span-6 flex items-center gap-4">
               <div className={`p-2 rounded-lg shrink-0 ${sop.type === 'process' ? 'bg-violet-500/10 text-violet-400' : 'bg-cyan-500/10 text-cyan-400'}`}>
                  {sop.type === 'process' ? <ListTree size={20}/> : <FileText size={20}/>}
               </div>
               <div className="min-w-0">
                  <h3 className="text-sm font-bold text-slate-200 group-hover:text-white transition-colors truncate">{sop.title}</h3>
                  <div className="flex items-center gap-2 mt-1">
                     <span className="text-[9px] font-bold text-slate-500 uppercase px-1.5 py-0.5 rounded border border-white/5 bg-white/5">{sop.category}</span>
                     {sop.tags.slice(0, 2).map(tag => (
                        <span key={tag} className="text-[9px] text-slate-600 font-mono">#{tag}</span>
                     ))}
                  </div>
               </div>
            </div>

            <div className="col-span-2 text-center hidden md:block">
               <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-slate-800/50 px-3 py-1 rounded">
                  {sop.responsible_department || 'Geral'}
               </span>
            </div>

            <div className="col-span-2 text-center hidden md:block">
               <div className="text-[11px] text-slate-500 font-mono flex items-center justify-center gap-1.5">
                  <Clock size={12} className="text-slate-600" />
                  {new Date(sop.lastUpdated).toLocaleDateString('pt-BR')}
               </div>
            </div>

            <div className="col-span-1 md:col-span-2 flex items-center justify-end gap-4">
               <div className="hidden group-hover:flex items-center gap-3 animate-in fade-in slide-in-from-right-2 duration-300">
                  <button onClick={(e) => handleOpenEdit(sop, e)} className="text-slate-500 hover:text-cyan-400 transition-colors">
                    <Edit2 size={14} />
                  </button>
                  {confirmingDeleteId === sop.id ? (
                     <button onClick={(e) => handleConfirmDelete(sop.id, e)} className="text-red-500 font-bold text-[10px] animate-pulse">Confirmar?</button>
                  ) : (
                     <button onClick={(e) => handleRequestDelete(sop.id, e)} className="text-slate-500 hover:text-red-400"><Trash2 size={14} /></button>
                  )}
               </div>
               <ChevronRight size={16} className="text-slate-700 group-hover:text-cyan-500 transition-colors" />
            </div>
          </div>
        ))}
      </div>

      {/* View Modal */}
      {selectedSOP && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md" onClick={() => setSelectedSOP(null)}>
          <div className="bg-[#0B1120] rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden border border-white/10 flex flex-col shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-white/10 flex justify-between items-center bg-[#0B1120]/50 sticky top-0 z-10 backdrop-blur">
               <div className="flex items-center gap-3">
                  <span className={`w-2 h-2 rounded-full ${selectedSOP.type === 'process' ? 'bg-violet-500 shadow-[0_0_8px_#8b5cf6]' : 'bg-cyan-500 shadow-[0_0_8px_#06b6d4]'}`}></span>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{selectedSOP.type === 'process' ? 'Processo Operacional' : 'Protocolo Padrão'}</span>
               </div>
               <button onClick={() => setSelectedSOP(null)} className="text-slate-400 hover:text-white"><X size={24} /></button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-8 md:p-12 custom-scrollbar">
               <div className="max-w-3xl mx-auto">
                  <header className="mb-12">
                     <h1 className="text-4xl font-bold text-white mb-6 leading-tight">{selectedSOP.title}</h1>
                     <div className="flex flex-wrap gap-4 items-center text-xs text-slate-500 border-y border-white/5 py-4">
                        <div className="flex items-center gap-1.5"><Building2 size={14} /> <span className="text-slate-300 font-bold">{selectedSOP.responsible_department}</span></div>
                        <div className="w-px h-3 bg-white/10"></div>
                        <div className="flex items-center gap-1.5"><Calendar size={14} /> Atualizado em {new Date(selectedSOP.lastUpdated).toLocaleDateString()}</div>
                        <div className="w-px h-3 bg-white/10"></div>
                        <div className="flex items-center gap-1.5"><Users size={14} /> {selectedSOP.responsible_users?.length || 0} Responsáveis</div>
                     </div>
                  </header>

                  <div className="prose prose-invert prose-cyan max-w-none">
                     <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
                        {selectedSOP.content}
                     </ReactMarkdown>
                  </div>
               </div>
            </div>
          </div>
        </div>
      )}

      {/* Forms (Edit/Create) */}
      {(isCreating || isEditing) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm">
           <div className="bg-[#0B1120] rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto border border-white/10 flex flex-col shadow-2xl custom-scrollbar" onClick={e => e.stopPropagation()}>
              <div className="px-6 py-5 border-b border-white/10 flex items-center justify-between sticky top-0 bg-[#0B1120] z-10">
                 <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    {isCreating ? <Plus className="text-cyan-500" /> : <Edit2 className="text-cyan-500" />}
                    {isCreating ? 'Novo Documento' : 'Editar Documento'}
                 </h2>
                 <button onClick={() => { setIsCreating(false); setIsEditing(false); }} className="text-slate-500 hover:text-white"><X size={24} /></button>
              </div>

              <div className="p-8 space-y-6">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="md:col-span-2">
                       <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Título do Protocolo</label>
                       <input 
                         type="text" 
                         value={formData.title || ''} 
                         onChange={e => setFormData({...formData, title: e.target.value})} 
                         className="w-full bg-slate-950 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-cyan-500/50 outline-none transition-all" 
                         placeholder="Ex: Guia de Boas Vindas"
                       />
                    </div>
                    <div>
                       <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Categoria</label>
                       <select 
                         value={formData.category} 
                         onChange={e => setFormData({...formData, category: e.target.value as any})}
                         className="w-full bg-slate-950 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-cyan-500/50 outline-none"
                       >
                          {categories.filter(c => c !== 'Todos').map(c => <option key={c} value={c}>{c}</option>)}
                       </select>
                    </div>
                    <div>
                       <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Departamento Responsável</label>
                       <select 
                         value={formData.responsible_department} 
                         onChange={e => setFormData({...formData, responsible_department: e.target.value as any})}
                         className="w-full bg-slate-950 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-cyan-500/50 outline-none"
                       >
                          {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                       </select>
                    </div>
                 </div>

                 <div>
                    <div className="flex justify-between items-center mb-2">
                       <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Conteúdo (Markdown)</label>
                       <div className="flex items-center gap-3">
                          {isTranscribing && (
                             <div className="flex items-center gap-2 text-cyan-400 text-[10px] font-bold animate-pulse">
                                <Loader2 size={12} className="animate-spin" /> Processando Inteligência...
                             </div>
                          )}
                          {!isRecording ? (
                             <button 
                                onClick={startRecording}
                                disabled={isTranscribing}
                                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-slate-400 hover:text-cyan-400 hover:border-cyan-500/30 transition-all text-[10px] font-bold uppercase tracking-widest"
                             >
                                <Mic size={12} /> Narrar Documento
                             </button>
                          ) : (
                             <button 
                                onClick={stopRecording}
                                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 animate-pulse text-[10px] font-bold uppercase tracking-widest"
                             >
                                <Square size={12} /> Parar ({formatTime(recordingTime)})
                             </button>
                          )}
                       </div>
                    </div>
                    <textarea 
                      value={formData.content || ''} 
                      onChange={e => setFormData({...formData, content: e.target.value})} 
                      className="w-full min-h-[300px] bg-slate-950 border border-white/10 rounded-lg px-4 py-4 text-slate-300 font-mono text-sm focus:border-cyan-500/50 outline-none custom-scrollbar" 
                      placeholder="# Título Principal\n\nDescreva aqui o documento..."
                    />
                 </div>

                 <div className="pt-6 border-t border-white/5 flex justify-end gap-3">
                    <button onClick={() => { setIsCreating(false); setIsEditing(false); }} className="px-6 py-2 text-slate-500 hover:text-white font-bold text-[11px] uppercase tracking-widest transition-colors">Cancelar</button>
                    <button onClick={handleSave} className="bg-cyan-600 hover:bg-cyan-500 text-white px-8 py-3 rounded-lg font-bold text-[11px] uppercase tracking-widest shadow-[0_0_20px_rgba(8,145,178,0.2)]">Salvar Alterações</button>
                 </div>
              </div>
           </div>
        </div>
      )}

      {/* Type Selection Modal */}
      {isTypeSelectionOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm" onClick={() => setIsTypeSelectionOpen(false)}>
          <div className="bg-[#0B1120] rounded-2xl w-full max-w-lg border border-white/10 p-8 relative" onClick={e => e.stopPropagation()}>
             <h2 className="text-xl font-bold text-white mb-6 text-center">Selecionar Tipo de Documento</h2>
             <div className="grid grid-cols-2 gap-4">
                <button onClick={() => startCreate('standard')} className="p-6 bg-slate-900 border border-white/5 rounded-xl hover:border-cyan-500/50 transition-all flex flex-col items-center gap-4 group">
                   <FileText size={40} className="text-slate-600 group-hover:text-cyan-400 transition-colors" />
                   <span className="font-bold text-xs uppercase tracking-widest text-slate-400 group-hover:text-white">Documento Padrão</span>
                </button>
                <button onClick={() => startCreate('process')} className="p-6 bg-slate-900 border border-white/5 rounded-xl hover:border-violet-500/50 transition-all flex flex-col items-center gap-4 group">
                   <ListTree size={40} className="text-slate-600 group-hover:text-violet-400 transition-colors" />
                   <span className="font-bold text-xs uppercase tracking-widest text-slate-400 group-hover:text-white">Processo Estruturado</span>
                </button>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default KnowledgeBase;
