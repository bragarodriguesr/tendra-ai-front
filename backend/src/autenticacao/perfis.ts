import type { Banco } from "../persistencia/banco.ts";

/**
 * Cadastro de perfis (etapa D4, PD2). A conta é criada no painel do Supabase (Authentication →
 * Add user, já confirmada); o perfil liga o id dela ao nome e ao papel usados no Workspace.
 */

export const PAPEIS = ["Revisor", "Aprovador"] as const;
export type Papel = (typeof PAPEIS)[number];

export class ErroDeCadastro extends Error {
  override name = "ErroDeCadastro";
}

/** Procura o id da conta pelo e-mail na API de administração do Supabase Auth. */
export async function idDaContaNoSupabase(opcoes: { supabaseUrl: string; chaveDeServico: string; email: string; fetch?: typeof fetch }): Promise<string> {
  const buscar = opcoes.fetch ?? fetch;
  const cabecalhos: Record<string, string> = { apikey: opcoes.chaveDeServico };
  if (opcoes.chaveDeServico.startsWith("eyJ")) cabecalhos.Authorization = `Bearer ${opcoes.chaveDeServico}`;
  for (let pagina = 1; pagina <= 20; pagina++) {
    const resposta = await buscar(`${opcoes.supabaseUrl}/auth/v1/admin/users?page=${pagina}&per_page=200`, { headers: cabecalhos });
    if (!resposta.ok) throw new ErroDeCadastro(`O Supabase Auth recusou a consulta das contas (${resposta.status}).`);
    const { users } = (await resposta.json()) as { users: { id: string; email?: string }[] };
    const conta = users.find((usuario) => usuario.email?.toLowerCase() === opcoes.email);
    if (conta !== undefined) return conta.id;
    if (users.length < 200) break;
  }
  throw new ErroDeCadastro(`Nenhuma conta com o e-mail ${opcoes.email} no Supabase Auth. Crie-a antes no painel (Authentication → Add user).`);
}

/** Cria ou atualiza o perfil da conta, sempre ativo. */
export async function gravarPerfil(banco: Banco, perfil: { id: string; email: string; nome: string; papel: string }): Promise<void> {
  if (!PAPEIS.some((papel) => papel === perfil.papel)) throw new ErroDeCadastro(`Papel inválido "${perfil.papel}". Use ${PAPEIS.join(" ou ")}.`);
  const nome = perfil.nome.trim();
  if (nome === "") throw new ErroDeCadastro("Informe o nome da pessoa.");
  await banco.query(
    `INSERT INTO perfis (id, email, nome, papel) VALUES ($1, $2, $3, $4)
     ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email, nome = EXCLUDED.nome, papel = EXCLUDED.papel, ativo = true`,
    [perfil.id, perfil.email, nome, perfil.papel],
  );
}
