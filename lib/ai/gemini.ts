import { GoogleGenerativeAI } from "@google/generative-ai";

let _client: GoogleGenerativeAI | null = null;

function getClient(): GoogleGenerativeAI {
  if (!_client) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) throw new Error("GEMINI_API_KEY não configurada");
    _client = new GoogleGenerativeAI(key);
  }
  return _client;
}

/**
 * Gera texto via Gemini (Google AI).
 * Usa gemini-2.0-flash para custo mínimo e velocidade.
 */
export async function generateText(prompt: string): Promise<string> {
  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    console.error("[AI] GEMINI_API_KEY não encontrada nas env vars");
    throw new Error("GEMINI_API_KEY não configurada");
  }

  try {
    const client = getClient();
    const model = client.getGenerativeModel({ model: "gemini-2.0-flash" });
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    if (!text || text.trim().length === 0) {
      throw new Error("Gemini retornou resposta vazia");
    }
    return text;
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error(`[AI] Erro Gemini: ${msg}`);
    throw error;
  }
}
