
import { MOCK_SOPS, MOCK_TOOLS } from '../constants';

const GROQ_API_URL = "https://api.groq.com/openai/v1";

const SOP_CONTEXT = MOCK_SOPS.map(sop => 
  `Título: ${sop.title}\nCategoria: ${sop.category}\nConteúdo: ${sop.content}\nTags: ${sop.tags.join(', ')}`
).join('\n\n---\n\n');

const TOOLS_CONTEXT = MOCK_TOOLS.map(tool =>
  `Ferramenta: ${tool.name}\nDescrição: ${tool.description}\nCategoria: ${tool.category}\nURL: ${tool.url}`
).join('\n\n---\n\n');

/**
 * Auxiliar para converter base64 em Blob para envio de arquivos
 */
const base64ToBlob = (base64: string, mimeType: string): Blob => {
  const byteCharacters = atob(base64);
  const byteNumbers = new Array(byteCharacters.length);
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }
  const byteArray = new Uint8Array(byteNumbers);
  return new Blob([byteArray], { type: mimeType });
};

export const sendMessageToGemini = async (message: string): Promise<string> => {
  if (!process.env.API_KEY) {
    return "Erro: Groq API Key não configurada no ambiente.";
  }

  try {
    const response = await fetch(`${GROQ_API_URL}/chat/completions`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          {
            role: "system",
            content: `Você é o assistente virtual da AutomatikHub. Responda em PT-BR de forma direta usando Markdown. 
            Contexto da empresa: ${SOP_CONTEXT} | ${TOOLS_CONTEXT}`
          },
          { role: "user", content: message }
        ],
        temperature: 0.5,
        max_tokens: 1024
      })
    });

    const data = await response.json();
    return data.choices?.[0]?.message?.content || "Não foi possível gerar uma resposta via Groq.";
  } catch (error) {
    console.error("Erro na comunicação com Groq:", error);
    return "Ocorreu um erro ao tentar contatar o assistente via Groq API.";
  }
};

/**
 * Transcreve um áudio usando Whisper no Groq e depois formata o texto com Llama 3.
 */
export const transcribeAudioToDoc = async (base64Audio: string, mimeType: string): Promise<string> => {
  if (!process.env.API_KEY) throw new Error("API Key não configurada.");

  try {
    // 1. Converter Base64 para Blob para o FormData
    const audioBlob = base64ToBlob(base64Audio, mimeType);
    const formData = new FormData();
    formData.append("file", audioBlob, "recording.webm");
    formData.append("model", "whisper-large-v3");
    formData.append("language", "pt");
    formData.append("response_format", "json");

    // 2. Transcrição com Whisper
    const transcriptionRes = await fetch(`${GROQ_API_URL}/audio/transcriptions`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.API_KEY}`
      },
      body: formData
    });

    const transcriptionData = await transcriptionRes.json();
    const rawText = transcriptionData.text;

    if (!rawText) return "";

    // 3. Formatação do texto transcrito em Markdown usando Llama 3
    const formattingRes = await fetch(`${GROQ_API_URL}/chat/completions`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          {
            role: "system",
            content: "Você é um especialista em documentação técnica da Automatik. Sua tarefa é pegar a transcrição bruta de um áudio e transformá-la em um documento Markdown profissional, organizado com títulos (#), listas e negrito."
          },
          {
            role: "user",
            content: `Transcrição bruta: "${rawText}". Transforme isso em um documento estruturado.`
          }
        ],
        temperature: 0.3
      })
    });

    const formattingData = await formattingRes.json();
    return formattingData.choices?.[0]?.message?.content || rawText;

  } catch (error) {
    console.error("Erro na transcrição/formatação via Groq:", error);
    throw error;
  }
};
