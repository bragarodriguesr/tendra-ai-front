import type { FastifyInstance, FastifyRequest } from "fastify";
import type { Banco } from "../persistencia/banco.ts";
import { ORGANIZACAO_INICIAL } from "../persistencia/organizacoes.ts";
import { ErroDaRota } from "./erros.ts";

/**
 * Organização de cada pedido (fase K, cenários 69 e 72). Com login, é a da sessão; sem login (modo
 * local), a organização inicial (cenário 78). Nunca vem do corpo, da URL nem de cabeçalho.
 */

declare module "fastify" {
  interface FastifyRequest {
    /** Id da organização do pedido; vazio antes de a sessão (ou o modo local) defini-lo. */
    organizacaoId: string;
  }
}

/** Organização do pedido. Sem ela, um erro interno: nenhuma rota de dados responde sem dono. */
export function organizacaoDo(pedido: FastifyRequest): string {
  if (pedido.organizacaoId === "") throw new Error("Pedido sem organização definida.");
  return pedido.organizacaoId;
}

export const MENSAGEM_DE_TAREFA_NAO_ENCONTRADA = "Tarefa não encontrada.";

/**
 * Liga a organização aos pedidos e, antes de qualquer rota com `:id` de tarefa, confere que a tarefa é
 * da organização do pedido. A de outra organização responde 404, como a inexistente, num único ponto
 * que vale também para as rotas novas (cenário 72).
 */
export function registrarOrganizacao(servidor: FastifyInstance, opcoes: { banco: Banco; comLogin: boolean }): void {
  servidor.decorateRequest("organizacaoId", "");
  if (!opcoes.comLogin) {
    servidor.addHook("onRequest", async (pedido) => {
      pedido.organizacaoId = ORGANIZACAO_INICIAL;
    });
  }
  servidor.addHook("preHandler", async (pedido) => {
    if (!(pedido.routeOptions.url ?? "").startsWith("/api/tarefas/:id")) return;
    const { id } = pedido.params as { id: string };
    const { rows } = await opcoes.banco.query("SELECT 1 FROM tarefas WHERE id = $1 AND organizacao_id = $2", [id, organizacaoDo(pedido)]);
    if (rows.length === 0) throw new ErroDaRota(404, MENSAGEM_DE_TAREFA_NAO_ENCONTRADA);
  });
}
