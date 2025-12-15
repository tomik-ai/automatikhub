import React, { useState, useEffect } from 'react';
import { Link, Copy, RefreshCw, Check, AlertCircle, ExternalLink } from 'lucide-react';

const UtmGenerator: React.FC = () => {
  const [url, setUrl] = useState('');
  const [source, setSource] = useState('');
  const [medium, setMedium] = useState('');
  const [campaign, setCampaign] = useState('');
  const [term, setTerm] = useState('');
  const [content, setContent] = useState('');
  
  const [generatedUrl, setGeneratedUrl] = useState('');
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    generateLink();
  }, [url, source, medium, campaign, term, content]);

  const generateLink = () => {
    setError('');
    if (!url) {
      setGeneratedUrl('');
      return;
    }

    try {
      // Ensure URL has protocol
      let formattedUrl = url;
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        formattedUrl = 'https://' + url;
      }

      const urlObj = new URL(formattedUrl);
      
      if (source) urlObj.searchParams.set('utm_source', source);
      if (medium) urlObj.searchParams.set('utm_medium', medium);
      if (campaign) urlObj.searchParams.set('utm_campaign', campaign);
      if (term) urlObj.searchParams.set('utm_term', term);
      if (content) urlObj.searchParams.set('utm_content', content);

      setGeneratedUrl(urlObj.toString());
    } catch (e) {
      // Invalid URL
      setGeneratedUrl('');
    }
  };

  const handleCopy = () => {
    if (!generatedUrl) return;
    navigator.clipboard.writeText(generatedUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClear = () => {
    setUrl('');
    setSource('');
    setMedium('');
    setCampaign('');
    setTerm('');
    setContent('');
    setGeneratedUrl('');
    setError('');
  };

  const handleBlurUrl = () => {
     if (url && !url.startsWith('http')) {
        setUrl('https://' + url);
     }
  }

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
          <Link size={28} className="text-cyan-500" />
          GERADOR DE LINKS (UTM)
        </h1>
        <p className="text-slate-400">Crie URLs rastreáveis para campanhas de marketing, e-mails e redes sociais.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Form Column */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-[#0B1120] border border-white/5 p-6 rounded-xl">
            <h3 className="text-white font-bold text-sm uppercase tracking-wide mb-6 border-b border-white/5 pb-2">Parâmetros Principais</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                  URL do Site <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <ExternalLink className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                  <input 
                    type="text" 
                    value={url}
                    onChange={e => setUrl(e.target.value)}
                    onBlur={handleBlurUrl}
                    className="w-full pl-10 pr-4 py-3 bg-[#020617] border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50 placeholder-slate-600 font-mono text-sm"
                    placeholder="https://automatik.ai/landing-page"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                    Origem (utm_source) <span className="text-red-500">*</span>
                  </label>
                  <input 
                    type="text" 
                    value={source}
                    onChange={e => setSource(e.target.value)}
                    className="w-full px-4 py-3 bg-[#020617] border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50 placeholder-slate-600 text-sm"
                    placeholder="google, newsletter, linkedin"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                    Meio (utm_medium) <span className="text-red-500">*</span>
                  </label>
                  <input 
                    type="text" 
                    value={medium}
                    onChange={e => setMedium(e.target.value)}
                    className="w-full px-4 py-3 bg-[#020617] border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50 placeholder-slate-600 text-sm"
                    placeholder="cpc, banner, email"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Nome da Campanha (utm_campaign) <span className="text-red-500">*</span>
                </label>
                <input 
                  type="text" 
                  value={campaign}
                  onChange={e => setCampaign(e.target.value)}
                  className="w-full px-4 py-3 bg-[#020617] border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50 placeholder-slate-600 text-sm"
                  placeholder="black_friday_2024, lancamento_produto"
                />
              </div>
            </div>
          </div>

          <div className="bg-[#0B1120] border border-white/5 p-6 rounded-xl">
             <h3 className="text-white font-bold text-sm uppercase tracking-wide mb-6 border-b border-white/5 pb-2">Parâmetros Opcionais</h3>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                    Termo (utm_term)
                  </label>
                  <input 
                    type="text" 
                    value={term}
                    onChange={e => setTerm(e.target.value)}
                    className="w-full px-4 py-3 bg-[#020617] border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50 placeholder-slate-600 text-sm"
                    placeholder="palavra-chave paga"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                    Conteúdo (utm_content)
                  </label>
                  <input 
                    type="text" 
                    value={content}
                    onChange={e => setContent(e.target.value)}
                    className="w-full px-4 py-3 bg-[#020617] border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50 placeholder-slate-600 text-sm"
                    placeholder="logo_link, text_link"
                  />
                </div>
             </div>
          </div>

          <div className="flex justify-end">
            <button 
              onClick={handleClear}
              className="flex items-center gap-2 px-4 py-2 text-slate-500 hover:text-white transition-colors text-xs font-bold uppercase tracking-wider"
            >
              <RefreshCw size={14} /> Limpar Campos
            </button>
          </div>
        </div>

        {/* Result Column */}
        <div className="lg:col-span-1">
          <div className="sticky top-6 space-y-4">
            <div className="bg-gradient-to-br from-cyan-900/20 to-indigo-900/20 border border-cyan-500/30 p-6 rounded-xl backdrop-blur-sm">
              <h3 className="text-cyan-400 font-bold text-sm uppercase tracking-wide mb-4 flex items-center gap-2">
                <Check size={16} /> Link Gerado
              </h3>
              
              <div className="bg-[#020617] border border-white/10 rounded-lg p-4 mb-4 min-h-[100px] break-all">
                {generatedUrl ? (
                  <span className="text-slate-300 font-mono text-sm leading-relaxed">{generatedUrl}</span>
                ) : (
                  <span className="text-slate-600 italic text-sm">Preencha os campos obrigatórios para gerar o link...</span>
                )}
              </div>

              <button 
                onClick={handleCopy}
                disabled={!generatedUrl}
                className={`
                  w-full py-3 rounded-lg font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-lg
                  ${generatedUrl 
                    ? copied 
                        ? 'bg-green-600 text-white shadow-green-900/20' 
                        : 'bg-cyan-600 hover:bg-cyan-500 text-white shadow-cyan-900/20' 
                    : 'bg-slate-800 text-slate-500 cursor-not-allowed'}
                `}
              >
                {copied ? <Check size={18} /> : <Copy size={18} />}
                {copied ? 'Copiado!' : 'Copiar Link'}
              </button>

              {(!source || !medium || !campaign) && url && (
                <div className="mt-4 flex items-start gap-2 text-amber-400 text-xs bg-amber-900/20 p-3 rounded border border-amber-500/20">
                  <AlertCircle size={14} className="shrink-0 mt-0.5" />
                  <span>Para um rastreamento eficaz, recomenda-se preencher Source, Medium e Campaign.</span>
                </div>
              )}
            </div>

            <div className="bg-[#0B1120] border border-white/5 p-4 rounded-xl">
               <h4 className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">Exemplo de Uso</h4>
               <p className="text-xs text-slate-500 leading-relaxed mb-2">
                 Se você vai postar no LinkedIn sobre a Black Friday:
               </p>
               <ul className="text-xs text-slate-500 space-y-1 font-mono">
                 <li><span className="text-cyan-500">source:</span> linkedin</li>
                 <li><span className="text-cyan-500">medium:</span> social</li>
                 <li><span className="text-cyan-500">campaign:</span> black_friday</li>
               </ul>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default UtmGenerator;