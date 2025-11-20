import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage } from '../types';
import { sendMessageToGemini } from '../services/geminiService';
import { Send, Bot, User, Sparkles, Loader2 } from 'lucide-react';

const AiAssistant: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      role: 'model',
      text: 'Olá! Sou o assistente virtual da Automatik. Posso te ajudar com dúvidas sobre SOPs, benefícios, ferramentas ou cultura da empresa. O que você gostaria de saber hoje?',
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    const responseText = await sendMessageToGemini(input);

    const botMsg: ChatMessage = {
      id: (Date.now() + 1).toString(),
      role: 'model',
      text: responseText,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, botMsg]);
    setIsLoading(false);
  };

  return (
    <div className="h-[calc(100vh-2rem)] md:h-[calc(100vh-6rem)] flex flex-col bg-slate-900 rounded-xl shadow-lg border border-slate-800 overflow-hidden">
      <div className="p-4 border-b border-slate-800 bg-slate-900 flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-cyan-600 flex items-center justify-center shadow-sm">
          <Bot className="text-white" size={24} />
        </div>
        <div>
          <h2 className="font-bold text-white flex items-center gap-2">
            Automatik AI
            <Sparkles size={14} className="text-amber-400" />
          </h2>
          <p className="text-xs text-slate-400">Inteligência conectada à Base de Conhecimento</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-950/50">
        {messages.map((msg) => (
          <div 
            key={msg.id} 
            className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {msg.role === 'model' && (
              <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center shrink-0 border border-slate-700">
                <Bot size={16} className="text-indigo-400" />
              </div>
            )}
            
            <div 
              className={`
                max-w-[80%] p-3.5 rounded-2xl text-sm leading-relaxed shadow-sm
                ${msg.role === 'user' 
                  ? 'bg-indigo-600 text-white rounded-tr-none' 
                  : 'bg-slate-800 text-slate-200 border border-slate-700 rounded-tl-none'}
              `}
            >
              <div className="whitespace-pre-wrap">{msg.text}</div>
              <div className={`text-[10px] mt-1 ${msg.role === 'user' ? 'text-indigo-200' : 'text-slate-500'}`}>
                {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>

            {msg.role === 'user' && (
              <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center shrink-0 border border-slate-700">
                <User size={16} className="text-slate-400" />
              </div>
            )}
          </div>
        ))}
        
        {isLoading && (
          <div className="flex gap-3 justify-start animate-pulse">
            <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center shrink-0 border border-slate-700">
              <Bot size={16} className="text-indigo-400" />
            </div>
            <div className="bg-slate-800 border border-slate-700 p-3 rounded-2xl rounded-tl-none flex items-center gap-2">
              <Loader2 size={16} className="animate-spin text-indigo-400" />
              <span className="text-xs text-slate-400">Automatik AI está pensando...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 bg-slate-900 border-t border-slate-800">
        <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 rounded-full px-4 py-2 focus-within:ring-2 focus-within:ring-indigo-500 focus-within:border-transparent transition-all">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Pergunte sobre reembolso, férias, setup..."
            className="flex-1 bg-transparent border-none focus:ring-0 text-sm py-1 placeholder-slate-500 text-white"
            disabled={isLoading}
          />
          <button 
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className="p-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-500 rounded-full text-white transition-colors shadow-sm"
          >
            <Send size={16} />
          </button>
        </div>
        <p className="text-[10px] text-center text-slate-500 mt-2">
          A IA pode cometer erros. Verifique informações críticas nos documentos oficiais.
        </p>
      </div>
    </div>
  );
};

export default AiAssistant;