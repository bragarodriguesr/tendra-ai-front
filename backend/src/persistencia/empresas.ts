import { normalizarCnpj } from "../regras/cnpj.ts";
import type { Banco } from "./banco.ts";
import type { DadosDaTarefa } from "./tarefas.ts";

/**
 * Empresas e contatos da Nova RFP numa estrutura própria (cenário 63): a empresa é a mesma quando
 * o CNPJ é igual ou, sem CNPJ, quando o nome é igual; o contato com e-mail é o mesmo em todas as
 * tarefas da empresa e fica com os dados mais recentes. Nunca vão à IA (cenário 6).
 */

type Transacao = Parameters<Parameters<Banco["transaction"]>[0]>[0];

export interface EmpresaDaTarefa {
  empresa: { nome: string; cnpj: string | null } | null;
  contatos: { nome: string; cargo: string; telefone: string; email: string }[];
}

const limpo = (valor: string | undefined) => (valor ?? "").trim();

/**
 * Grava (ou atualiza) a empresa e os contatos informados e liga-os à tarefa. A empresa é procurada só
 * na organização da tarefa: o mesmo CNPJ em outra organização é outra empresa (cenário 73).
 */
export async function gravarEmpresaDaTarefa(transacao: Transacao, tarefa: { tarefaId: string; organizacaoId: string }, dados: DadosDaTarefa): Promise<void> {
  const { tarefaId, organizacaoId } = tarefa;
  const nome = limpo(dados.empresa);
  if (nome === "") return;
  // Numérico ou alfanumérico, sem máscara e em maiúsculas.
  const cnpj = normalizarCnpj(dados.cnpj);

  const existente = await transacao.query<{ id: number }>(
    cnpj === null
      ? "SELECT id FROM empresas WHERE organizacao_id = $1 AND cnpj IS NULL AND lower(trim(nome)) = lower($2)"
      : "SELECT id FROM empresas WHERE organizacao_id = $1 AND cnpj = $2",
    [organizacaoId, cnpj ?? nome],
  );
  let empresaId = existente.rows[0]?.id;
  if (empresaId === undefined) {
    const nova = await transacao.query<{ id: number }>("INSERT INTO empresas (nome, cnpj, organizacao_id) VALUES ($1, $2, $3) RETURNING id", [nome, cnpj, organizacaoId]);
    empresaId = nova.rows[0]?.id;
    if (empresaId === undefined) throw new Error("Falha ao gravar a empresa.");
  } else {
    await transacao.query("UPDATE empresas SET nome = $2, atualizada_em = now() WHERE id = $1", [empresaId, nome]);
  }
  await transacao.query("UPDATE tarefas SET empresa_id = $2 WHERE id = $1", [tarefaId, empresaId]);

  const contatos = (dados.contatos ?? [])
    .map((contato) => ({ nome: limpo(contato.nome), cargo: limpo(contato.cargo), telefone: limpo(contato.telefone), email: limpo(contato.email) }))
    .filter((contato) => contato.nome !== "" || contato.cargo !== "" || contato.telefone !== "" || contato.email !== "");
  for (const [posicao, contato] of contatos.entries()) {
    const gravado = await transacao.query<{ id: number }>(
      contato.email === ""
        ? "INSERT INTO contatos (empresa_id, nome, cargo, telefone, email) VALUES ($1, $2, $3, $4, $5) RETURNING id"
        : `INSERT INTO contatos (empresa_id, nome, cargo, telefone, email) VALUES ($1, $2, $3, $4, $5)
           ON CONFLICT (empresa_id, lower(email)) WHERE email <> ''
           DO UPDATE SET nome = EXCLUDED.nome, cargo = EXCLUDED.cargo, telefone = EXCLUDED.telefone, email = EXCLUDED.email, atualizado_em = now()
           RETURNING id`,
      [empresaId, contato.nome, contato.cargo, contato.telefone, contato.email],
    );
    const contatoId = gravado.rows[0]?.id;
    if (contatoId === undefined) throw new Error("Falha ao gravar o contato.");
    await transacao.query("INSERT INTO tarefa_contatos (tarefa_id, contato_id, posicao) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING", [tarefaId, contatoId, posicao + 1]);
  }
}

/** Empresa e contatos de uma tarefa, na ordem em que foram informados. */
export async function obterEmpresaDaTarefa(banco: Banco, tarefaId: string): Promise<EmpresaDaTarefa> {
  const empresa = await banco.query<{ nome: string; cnpj: string | null }>(
    "SELECT e.nome, e.cnpj FROM tarefas t JOIN empresas e ON e.id = t.empresa_id WHERE t.id = $1",
    [tarefaId],
  );
  const contatos = await banco.query<EmpresaDaTarefa["contatos"][number]>(
    "SELECT c.nome, c.cargo, c.telefone, c.email FROM tarefa_contatos tc JOIN contatos c ON c.id = tc.contato_id WHERE tc.tarefa_id = $1 ORDER BY tc.posicao",
    [tarefaId],
  );
  return { empresa: empresa.rows[0] ?? null, contatos: contatos.rows };
}
