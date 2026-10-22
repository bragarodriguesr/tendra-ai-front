import type { FastifyInstance } from "fastify";
import type { Pessoa } from "../config/pessoas.ts";
import type { Banco } from "../persistencia/banco.ts";
import {
  aprovarItem,
  avaliarItem,
  editarTexto,
  listarAvaliacoes,
  listarEventos,
  MOTIVOS_DE_AVALIACAO_NEGATIVA,
  reconhecerPessoa,
  relatorioDeAceitacao,
  restaurarSugestao,
} from "../revisao/revisao.ts";

/**
 * Rotas da revisão (etapa B5). Toda ação recebe `pessoa` (o id na lista de configuração, exceção
 * E1) e usa a data e hora do backend. O reconhecimento de alerta continua só na tela.
 */

const PARAMETROS = {
  type: "object",
  properties: {
    id: { type: "string", pattern: "^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$" },
    numero: { type: "string", pattern: "^[1-9][0-9]{0,5}$" },
  },
} as const;
// `pessoa` não é obrigatória no esquema: sem ela, a resposta é "Pessoa não reconhecida" (cenário 41).
const COM_PESSOA = { type: "object", additionalProperties: false, properties: { pessoa: { type: "string" } } } as const;

type Parametros = { id: string; numero: string };
type ComPessoa = { pessoa?: string };

export function registrarRotasDeRevisao(servidor: FastifyInstance, opcoes: { banco: Banco; pessoas: Pessoa[] }): void {
  const { banco, pessoas } = opcoes;
  const alvo = (parametros: Parametros, pessoa: string | undefined) => ({
    tarefaId: parametros.id,
    numero: Number(parametros.numero),
    pessoa: reconhecerPessoa(pessoas, pessoa),
  });

  servidor.get("/api/pessoas", async () => ({ pessoas }));

  servidor.put<{ Params: Parametros; Body: ComPessoa & { texto: string } }>(
    "/api/tarefas/:id/itens/:numero/texto",
    {
      schema: {
        params: PARAMETROS,
        body: { type: "object", required: ["texto"], additionalProperties: false, properties: { pessoa: { type: "string" }, texto: { type: "string", maxLength: 20_000 } } },
      },
    },
    async (pedido) => ({ item: await editarTexto(banco, { ...alvo(pedido.params, pedido.body.pessoa), texto: pedido.body.texto }) }),
  );

  servidor.post<{ Params: Parametros; Body: ComPessoa }>(
    "/api/tarefas/:id/itens/:numero/restaurar",
    { schema: { params: PARAMETROS, body: COM_PESSOA } },
    async (pedido) => ({ item: await restaurarSugestao(banco, alvo(pedido.params, pedido.body.pessoa)) }),
  );

  servidor.post<{ Params: Parametros; Body: ComPessoa }>(
    "/api/tarefas/:id/itens/:numero/aprovar",
    { schema: { params: PARAMETROS, body: COM_PESSOA } },
    async (pedido) => ({ item: await aprovarItem(banco, alvo(pedido.params, pedido.body.pessoa)) }),
  );

  servidor.put<{ Params: Parametros; Body: ComPessoa & { valor: "positiva" | "negativa"; motivo?: string } }>(
    "/api/tarefas/:id/itens/:numero/avaliacao",
    {
      schema: {
        params: PARAMETROS,
        body: {
          type: "object",
          required: ["valor"],
          additionalProperties: false,
          properties: {
            pessoa: { type: "string" },
            valor: { type: "string", enum: ["positiva", "negativa"] },
            motivo: { type: "string", enum: [...MOTIVOS_DE_AVALIACAO_NEGATIVA] },
          },
        },
      },
    },
    async (pedido) => ({
      avaliacao: await avaliarItem(banco, { ...alvo(pedido.params, pedido.body.pessoa), valor: pedido.body.valor, ...(pedido.body.motivo === undefined ? {} : { motivo: pedido.body.motivo }) }),
    }),
  );

  servidor.get<{ Params: { id: string } }>("/api/tarefas/:id/eventos", { schema: { params: PARAMETROS } }, async (pedido) => ({
    eventos: await listarEventos(banco, pedido.params.id),
  }));

  servidor.get<{ Params: { id: string } }>("/api/tarefas/:id/avaliacoes", { schema: { params: PARAMETROS } }, async (pedido) => ({
    avaliacoes: await listarAvaliacoes(banco, pedido.params.id),
  }));

  servidor.get<{ Params: { id: string } }>("/api/tarefas/:id/aceitacao", { schema: { params: PARAMETROS } }, async (pedido) => ({
    aceitacao: await relatorioDeAceitacao(banco, pedido.params.id),
  }));
}
