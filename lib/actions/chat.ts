"use server";

import { getSupabaseServerClient } from "@/lib/supabase/server";
import { generateText } from "@/lib/ai/gemini";
import { translateError } from "@/lib/utils/errors";

/**
 * Busca todo o contexto do cliente para injetar no prompt do chat.
 */
async function buildClientContext(clientId: string) {
  const supabase = await getSupabaseServerClient();

  const [clientRes, casesRes, costsRes, receiptsRes, updatesRes] =
    await Promise.all([
      supabase
        .from("clients")
        .select("razao_social, cnpj")
        .eq("id", clientId)
        .single(),
      supabase
        .from("cases")
        .select(
          "numero_processo, descricao, fase, status, valor_pleiteado_contra, valor_condenado_contra, valor_condenacao_favoravel, valor_acordo_recebido",
        )
        .eq("client_id", clientId),
      supabase
        .from("case_costs")
        .select("tipo, descricao, valor, data_competencia")
        .eq("client_id", clientId)
        .order("data_competencia", { ascending: false })
        .limit(20),
      supabase
        .from("case_receipts")
        .select("descricao, valor, data")
        .eq("client_id", clientId)
        .order("data", { ascending: false })
        .limit(20),
      supabase
        .from("case_updates")
        .select("tipo, descricao_tecnica, narrativa_ai, created_at")
        .eq("client_id", clientId)
        .order("created_at", { ascending: false })
        .limit(15),
    ]);

  const client = clientRes.data;
  const cases = casesRes.data || [];
  const costs = costsRes.data || [];
  const receipts = receiptsRes.data || [];
  const updates = updatesRes.data || [];

  const fmt = (v: number) =>
    new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(v);

  const totalCustos = costs.reduce((s, c) => s + Number(c.valor), 0);
  const totalEvitadas = cases.reduce(
    (s, c) =>
      s +
      Math.max(
        0,
        Number(c.valor_pleiteado_contra) - Number(c.valor_condenado_contra),
      ),
    0,
  );
  const totalRecebidos =
    receipts.reduce((s, r) => s + Number(r.valor), 0) +
    cases.reduce((s, c) => s + Number(c.valor_condenacao_favoravel), 0);

  const processosText = cases
    .map(
      (c) =>
        `- ${c.numero_processo}: ${c.descricao || "Sem descrição"} | Fase: ${c.fase} | Status: ${c.status} | Pleiteado: ${fmt(c.valor_pleiteado_contra)} | Condenado: ${fmt(c.valor_condenado_contra)} | Favorável: ${fmt(c.valor_condenacao_favoravel)} | Acordo: ${fmt(c.valor_acordo_recebido)}`,
    )
    .join("\n");

  const updatesText = updates
    .map(
      (u) =>
        `- ${new Date(u.created_at).toLocaleDateString("pt-BR")}: [${u.tipo}] ${u.descricao_tecnica}`,
    )
    .join("\n");

  return `DADOS DO CLIENTE:
Empresa: ${client?.razao_social || "Desconhecida"}
CNPJ: ${client?.cnpj || "N/A"}

KPIs CONSOLIDADOS:
- Total de custos da assessoria: ${fmt(totalCustos)}
- Total de condenações evitadas: ${fmt(totalEvitadas)}
- Total de valores recebidos: ${fmt(totalRecebidos)}
- ROI: ${totalCustos > 0 ? ((totalEvitadas + totalRecebidos) / totalCustos * 100).toFixed(1) + "%" : "∞"}

PROCESSOS (${cases.length} no total):
${processosText || "Nenhum processo registrado."}

ÚLTIMAS ATUALIZAÇÕES:
${updatesText || "Nenhuma atualização recente."}`;
}

/**
 * Envia mensagem do cliente e recebe resposta da IA.
 */
export async function sendChatMessage(message: string) {
  try {
    const supabase = await getSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { error: "Não autenticado" };

    // Buscar client_id do perfil
    const { data: profile } = await supabase
      .from("profiles")
      .select("client_id, role")
      .eq("id", user.id)
      .single();

    if (!profile?.client_id) return { error: "Perfil de cliente não encontrado" };

    const clientId = profile.client_id;

    // Salvar mensagem do usuário
    await supabase.from("chat_messages").insert({
      client_id: clientId,
      user_id: user.id,
      role: "user",
      content: message,
    });

    // Buscar histórico recente
    const { data: history } = await supabase
      .from("chat_messages")
      .select("role, content")
      .eq("client_id", clientId)
      .order("created_at", { ascending: false })
      .limit(10);

    const historyText = (history || [])
      .reverse()
      .map((m) => `${m.role === "user" ? "Cliente" : "Assistente"}: ${m.content}`)
      .join("\n");

    // Contexto do cliente (RAG)
    const context = await buildClientContext(clientId);

    const prompt = `Você é o assistente virtual do escritório Fontes Figueiredo Advogados, integrado ao portal do cliente.

REGRAS:
- Responda SEMPRE em português brasileiro
- Use linguagem simples e acessível (o cliente não é advogado)
- Baseie-se EXCLUSIVAMENTE nos dados abaixo — nunca invente informações
- Se não souber a resposta, diga: "Não tenho essa informação no momento. Vou encaminhar sua dúvida ao advogado responsável."
- Seja cordial, profissional e objetivo (2-4 frases por resposta)
- Destaque valores financeiros quando relevante
- Nunca revele informações técnicas internas ou sobre outros clientes
- Quando falar de processos, cite o número (ex: "processo 0001234-89.2023...")

${context}

HISTÓRICO DA CONVERSA:
${historyText}

MENSAGEM DO CLIENTE: ${message}

Responda como o assistente:`;

    let aiResponse: string;
    try {
      aiResponse = (await generateText(prompt)).trim();
    } catch {
      aiResponse =
        "Desculpe, estou com dificuldades técnicas no momento. Por favor, tente novamente em alguns instantes.";
    }

    // Salvar resposta da IA
    await supabase.from("chat_messages").insert({
      client_id: clientId,
      user_id: null,
      role: "assistant",
      content: aiResponse,
    });

    return { success: true, response: aiResponse };
  } catch (err) {
    if (err instanceof Error) return { error: translateError(err.message) };
    return { error: "Erro ao processar mensagem" };
  }
}

/**
 * Busca histórico de mensagens do chat.
 */
export async function getChatHistory(limit = 50) {
  try {
    const supabase = await getSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { error: "Não autenticado" };

    const { data: profile } = await supabase
      .from("profiles")
      .select("client_id")
      .eq("id", user.id)
      .single();

    if (!profile?.client_id) return { error: "Perfil não encontrado" };

    const { data, error } = await supabase
      .from("chat_messages")
      .select("id, role, content, created_at")
      .eq("client_id", profile.client_id)
      .order("created_at", { ascending: true })
      .limit(limit);

    if (error) return { error: translateError(error.message) };
    return { success: true, data: data || [] };
  } catch (err) {
    if (err instanceof Error) return { error: translateError(err.message) };
    return { error: "Erro ao carregar histórico" };
  }
}
