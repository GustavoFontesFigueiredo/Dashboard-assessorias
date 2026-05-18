/**
 * Traduz mensagens de erro do Supabase Auth e do sistema para PT-BR.
 */
const AUTH_ERROR_MAP: Record<string, string> = {
  // Auth — credenciais
  "Invalid login credentials": "E-mail ou senha inválidos",
  "invalid login credentials": "E-mail ou senha inválidos",
  "Email not confirmed": "E-mail ainda não confirmado. Verifique sua caixa de entrada",
  "Invalid email or password": "E-mail ou senha inválidos",
  // Auth — cadastro
  "User already registered": "Este e-mail já está cadastrado",
  "Email already in use": "Este e-mail já está em uso",
  "already been registered": "Este e-mail já está cadastrado",
  "email already exists": "Este e-mail já está cadastrado",
  // Auth — token / sessão
  "JWT expired": "Sessão expirada. Faça login novamente",
  "invalid JWT": "Sessão inválida. Faça login novamente",
  "Token has expired or is invalid": "Link expirado ou inválido",
  "refresh_token_not_found": "Sessão não encontrada. Faça login novamente",
  // Auth — rate limit
  "For security purposes, you can only request this once every 60 seconds":
    "Por segurança, aguarde 60 segundos antes de tentar novamente",
  "Email rate limit exceeded": "Muitas tentativas. Aguarde alguns minutos",
  // Auth — senha
  "Password should be at least 6 characters": "A senha deve ter pelo menos 6 caracteres",
  "Password is too weak": "Senha muito fraca. Use letras, números e símbolos",
  // Auth — e-mail inválido
  "Unable to validate email address: invalid format":
    "Formato de e-mail inválido",
  // Auth — usuário não encontrado
  "User not found": "Usuário não encontrado",
  // Genéricos
  "Network request failed": "Falha de conexão. Verifique sua internet",
  "Failed to fetch": "Falha de conexão. Verifique sua internet",
  "Acesso negado": "Acesso negado",
  "Não autenticado": "Você precisa estar autenticado para realizar esta ação",
};

/**
 * Converte uma mensagem de erro (inglês ou interno) para PT-BR.
 * Se não encontrar tradução, retorna a mensagem original.
 */
export function translateError(message: string): string {
  if (!message) return "Ocorreu um erro inesperado";

  // Busca correspondência exata
  if (AUTH_ERROR_MAP[message]) return AUTH_ERROR_MAP[message];

  // Busca correspondência parcial (substring)
  for (const [key, value] of Object.entries(AUTH_ERROR_MAP)) {
    if (message.toLowerCase().includes(key.toLowerCase())) return value;
  }

  return message;
}
