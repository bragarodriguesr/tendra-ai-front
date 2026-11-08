import type { Banco } from "../persistencia/banco.ts";
import { ErroDeArea, validarAreasDoPerfil } from "../regras/areas.ts";

/**
 * Cadastro de perfis (etapa D4, PD2). A conta é criada no painel do Supabase (Authentication →
 * Add user, já confirmada); o perfil liga o id dela ao nome e ao papel usados no Workspace.
 */

export const PAPEIS = ["Revisor", "Aprovador"] as const;
export type Papel = (typeof PAPEIS)[number];

export class ErroDeCadastro extends Error {
  override name = "ErroDeCadastro";
}

/** O Supabase Auth não respondeu como esperado: a consulta das contas não pôde ser feita (fase Q, Q13). */
export class ErroDoProvedorDeContas extends ErroDeCadastro {
  override name = "ErroDoProvedorDeContas";
}

/**
 * Id da conta com esse e-mail na API de administração do Supabase Auth, ou null quando não há conta.
 * Percorre até 20 páginas de 200 contas (pendência PQ3 da fase Q).
 */
export async function procurarContaNoSupabase(opcoes: { supabaseUrl: string; chaveDeServico: string; email: string; fetch?: typeof fetch }): Promise<string | null> {
  const buscar = opcoes.fetch ?? fetch;
  const cabecalhos: Record<string, string> = { apikey: opcoes.chaveDeServico };
  if (opcoes.chaveDeServico.startsWith("eyJ")) cabecalhos.Authorization = `Bearer ${opcoes.chaveDeServico}`;
  for (let pagina = 1; pagina <= 20; pagina++) {
    let resposta: Response;
    try {
      resposta = await buscar(`${opcoes.supabaseUrl}/auth/v1/admin/users?page=${pagina}&per_page=200`, { headers: cabecalhos });
    } catch {
      throw new ErroDoProvedorDeContas("Falha de comunicação com o Supabase Auth.");
    }
    if (!resposta.ok) throw new ErroDoProvedorDeContas(`O Supabase Auth recusou a consulta das contas (${resposta.status}).`);
    const { users } = (await resposta.json()) as { users: { id: string; email?: string }[] };
    const conta = users.find((usuario) => usuario.email?.toLowerCase() === opcoes.email);
    if (conta !== undefined) return conta.id;
    if (users.length < 200) break;
  }
  return null;
}

/** Procura o id da conta pelo e-mail na API de administração do Supabase Auth (comando cadastrar-perfil). */
export async function idDaContaNoSupabase(opcoes: { supabaseUrl: string; chaveDeServico: string; email: string; fetch?: typeof fetch }): Promise<string> {
  const id = await procurarContaNoSupabase(opcoes);
  if (id === null) throw new ErroDeCadastro(`Nenhuma conta com o e-mail ${opcoes.email} no Supabase Auth. Crie-a antes no painel (Authentication → Add user).`);
  return id;
}

/**
 * Cria ou atualiza o perfil da conta, sempre ativo, na organização informada (cenário 67). Um perfil
 * nunca muda de organização (PK5): a conta já ligada a outra é recusada, e a pessoa usa outra conta.
 * `areas` (fase N, cenário N1): só do Aprovador. Sem `areas`, um perfil novo fica sem área e um
 * existente mantém as suas; o Revisor sempre fica sem área.
 */
export async function gravarPerfil(
  banco: Banco,
  perfil: { id: string; email: string; nome: string; papel: string; organizacaoId: string; areas?: string[] },
): Promise<void> {
  if (!PAPEIS.some((papel) => papel === perfil.papel)) throw new ErroDeCadastro(`Papel inválido "${perfil.papel}". Use ${PAPEIS.join(" ou ")}.`);
  let areas: string[] | null;
  try {
    areas = perfil.areas === undefined ? (perfil.papel === "Aprovador" ? null : []) : validarAreasDoPerfil(perfil.papel, perfil.areas);
  } catch (erro) {
    if (erro instanceof ErroDeArea) throw new ErroDeCadastro(erro.message);
    throw erro;
  }
  const nome = perfil.nome.trim();
  if (nome === "") throw new ErroDeCadastro("Informe o nome da pessoa.");
  const { rows } = await banco.query<{ organizacao_id: string }>("SELECT organizacao_id FROM perfis WHERE id = $1 OR email = $2", [perfil.id, perfil.email]);
  if (rows.some((linha) => linha.organizacao_id !== perfil.organizacaoId)) {
    throw new ErroDeCadastro(`A conta ${perfil.email} já pertence a outra organização. Um perfil não muda de organização: crie outra conta para esta.`);
  }
  await banco.query(
    `INSERT INTO perfis (id, email, nome, papel, organizacao_id, areas) VALUES ($1, $2, $3, $4, $5, COALESCE($6::text[], '{}'))
     ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email, nome = EXCLUDED.nome, papel = EXCLUDED.papel, ativo = true,
       areas = COALESCE($6::text[], perfis.areas)`,
    [perfil.id, perfil.email, nome, perfil.papel, perfil.organizacaoId, areas],
  );
}

/**
 * Usuários ativos da organização, só nome e papel, nunca o e-mail (cenários 62 e 74). Base do campo
 * "Responsável" da Nova RFP e da validação dele.
 */
export async function listarUsuarios(banco: Banco, organizacaoId: string): Promise<{ nome: string; papel: string }[]> {
  const { rows } = await banco.query<{ nome: string; papel: string }>("SELECT nome, papel FROM perfis WHERE ativo AND organizacao_id = $1 ORDER BY nome", [organizacaoId]);
  return rows;
}
