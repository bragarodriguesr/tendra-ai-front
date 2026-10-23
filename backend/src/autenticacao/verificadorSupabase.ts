/**
 * Conferência de e-mail e senha no Supabase Auth (etapa D4). O backend nunca guarda senhas: só
 * pergunta ao Supabase se o par confere e recebe o id do usuário, que é o id do perfil.
 */
export interface VerificadorDeSenha {
  /** Id do usuário quando e-mail e senha conferem; null quando não conferem. */
  conferir(email: string, senha: string): Promise<string | null>;
}

/** O Supabase Auth não respondeu como esperado: a conferência não pôde ser feita. */
export class ErroDoProvedorDeLogin extends Error {
  override name = "ErroDoProvedorDeLogin";
}

export function criarVerificadorSupabase(opcoes: { supabaseUrl: string; chaveDeServico: string; fetch?: typeof fetch }): VerificadorDeSenha {
  const buscar = opcoes.fetch ?? fetch;
  return {
    async conferir(email, senha) {
      let resposta: Response;
      try {
        resposta = await buscar(`${opcoes.supabaseUrl}/auth/v1/token?grant_type=password`, {
          method: "POST",
          headers: { apikey: opcoes.chaveDeServico, "Content-Type": "application/json" },
          body: JSON.stringify({ email, password: senha }),
        });
      } catch {
        throw new ErroDoProvedorDeLogin("Falha de comunicação com o serviço de login.");
      }
      // 400 é a resposta do Supabase para credenciais inválidas e e-mail não confirmado.
      if (resposta.status === 400) return null;
      if (!resposta.ok) throw new ErroDoProvedorDeLogin(`O serviço de login respondeu ${resposta.status}.`);
      const corpo = (await resposta.json().catch(() => null)) as { user?: { id?: unknown } } | null;
      const id = corpo?.user?.id;
      if (typeof id !== "string" || id === "") throw new ErroDoProvedorDeLogin("Resposta inesperada do serviço de login.");
      return id;
    },
  };
}
