import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { MOCK_SOPS, MOCK_TOOLS } from '../constants';

// Construct a context string from the mock SOPs to feed into the model
const SOP_CONTEXT = MOCK_SOPS.map(sop => 
  `Título: ${sop.title}\nCategoria: ${sop.category}\nConteúdo: ${sop.content}\nTags: ${sop.tags.join(', ')}`
).join('\n\n---\n\n');

// Construct a context string from the tools
const TOOLS_CONTEXT = MOCK_TOOLS.map(tool =>
  `Ferramenta: ${tool.name}\nDescrição: ${tool.description}\nCategoria: ${tool.category}\nURL: ${tool.url}`
).join('\n\n---\n\n');

export const sendMessageToGemini = async (message: string): Promise<string> => {
  if (!process.env.API_KEY) {
    return "Erro: API Key não configurada. Por favor verifique as configurações.";
  }

  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    const systemInstruction = `
      Você é o assistente virtual inteligente da AutomatikHub, o portal interno da empresa Automatik.
      Seu objetivo é ajudar colaboradores a encontrar informações sobre processos, cultura, ferramentas e regras da empresa.
      
      Use o seguinte contexto (Base de Conhecimento / SOPs):
      ${SOP_CONTEXT}
      
      Use o seguinte contexto (Ferramentas da Empresa):
      ${TOOLS_CONTEXT}
      
      Regras:
      1. Responda sempre em Português do Brasil.
      2. Seja cordial, profissional e direto.
      3. Se a informação não estiver no contexto fornecido, diga que não encontrou a informação específica nos documentos atuais e sugira contatar o RH ou o gestor.
      4. Se perguntarem sobre comunicação ou gestão de tarefas, priorize as ferramentas listadas (WhatsApp e ClickUp).
      5. Não invente informações sobre políticas da empresa que não estejam no contexto.
      6. Formate a resposta com Markdown para melhor leitura (listas, negrito, etc) se necessário.
    `;

    const response: GenerateContentResponse = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: message,
      config: {
        systemInstruction: systemInstruction,
        temperature: 0.3, // Low temperature for more factual answers based on context
      }
    });

    return response.text || "Desculpe, não consegui gerar uma resposta no momento.";
  } catch (error) {
    console.error("Error communicating with Gemini:", error);
    return "Ocorreu um erro ao tentar contatar o assistente. Tente novamente mais tarde.";
  }
};