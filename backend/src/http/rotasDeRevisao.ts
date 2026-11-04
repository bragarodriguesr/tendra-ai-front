import type { FastifyInstance, FastifyRequest } from "fastify";
import type { Pessoa } from "../config/pessoas.ts";
import type { Banco } from "../persistencia/banco.ts";
import { exigirAprovador } from "./rotasDeAutenticacao.ts";
import { listarUsuarios } from "../autenticacao/perfis.ts";
import { organizacaoDo } from "./organizacao.ts";
import {
  aprovarItem,
  avaliarItem,
  editarTexto,
  escolherFonte,
  listarAvaliacoes,
  listarEventos,
  marcarComoRevisado,
  MOTIVOS_DE_AVALIACAO_NEGATIVA,
  reconhecerAlerta,
  reconhecerPessoa,
  relatorioDeAceitacao,
  restaurarSugestao,
  trocarArea,
} from "../revisao/revisao.ts";
import type { TipoDeAlerta } from "../rastreabilidade/montarItem.ts";

/**
 * Rotas da revisão (etapa B5). No modo local, toda ação recebe `pessoa` (o id na lista de
 * configuração, exceção E1); com login, a pessoa é a da sessão e o campo é ignorado (cenário D4).
 * Usam a data e hora do backend. Reconhecer alerta, escolher fonte e marcar como revisado são dos
 * cenários 57 a 59; nenhuma ação de revisão depende do papel, exceto aprovar (cenário D8).
 */

const PARAMETROS = {
  type: "object",
  properties: {
    id: { type: "string", pattern: "^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$" },
    numero: { type: "string", pattern: "^[1-9][0-9]{0,5}$" },
  },
} as const;
const COM_ALERTA = {
  ...PARAMETROS,
  properties: { ...PARAMETROS.properties, tipo: { type: "string", enum: ["lowconf", "conflict", "old", "critical", "nocontext", "manual"] } },
} as const;
// `pessoa` não é obrigatória no esquema: sem ela, a resposta é "Pessoa não reconhecida" (cenário 41).
const COM_PESSOA = { type: "object", additionalProperties: false, properties: { pessoa: { type: "string" } } } as const;

type Parametros = { id: string; numero: string };
type ComPessoa = { pessoa?: string };

export function registrarRotasDeRevisao(servidor: FastifyInstance, opcoes: { banco: Banco; pessoas: Pessoa[] }): void {
  const { banco, pessoas } = opcoes;
  const alvo = (pedido: FastifyRequest<{ Params: Parametros; Body: ComPessoa }>) => ({
    tarefaId: pedido.params.id,
    numero: Number(pedido.params.numero),
    pessoa: pedido.pessoaDaSessao ?? reconhecerPessoa(pessoas, pedido.body.pessoa),
  });

  servidor.get("/api/pessoas", async (pedido) => ({ pessoas: pedido.pessoaDaSessao === null ? pessoas : [pedido.pessoaDaSessao] }));

  // Usuários da plataforma para o campo "Responsável" da Nova RFP (cenários 62 e 74): com login, os
  // perfis ativos da organização da sessão; sem login, a lista de configuração. Só nome e papel.
  servidor.get("/api/usuarios", async (pedido) => {
    if (pedido.pessoaDaSessao === null) return { usuarios: pessoas.map(({ nome, papel }) => ({ nome, papel })) };
    return { usuarios: await listarUsuarios(banco, organizacaoDo(pedido)) };
  });

  servidor.put<{ Params: Parametros; Body: ComPessoa & { texto: string } }>(
    "/api/tarefas/:id/itens/:numero/texto",
    {
      schema: {
        params: PARAMETROS,
        body: { type: "object", required: ["texto"], additionalProperties: false, properties: { pessoa: { type: "string" }, texto: { type: "string", maxLength: 20_000 } } },
      },
    },
    async (pedido) => ({ item: await editarTexto(banco, { ...alvo(pedido), texto: pedido.body.texto }) }),
  );

  servidor.post<{ Params: Parametros; Body: ComPessoa }>(
    "/api/tarefas/:id/itens/:numero/restaurar",
    { schema: { params: PARAMETROS, body: COM_PESSOA } },
    async (pedido) => ({ item: await restaurarSugestao(banco, alvo(pedido)) }),
  );

  servidor.post<{ Params: Parametros; Body: ComPessoa }>(
    "/api/tarefas/:id/itens/:numero/aprovar",
    { schema: { params: PARAMETROS, body: COM_PESSOA } },
    async (pedido) => {
      exigirAprovador(pedido, "Só o Aprovador pode aprovar respostas.");
      return { item: await aprovarItem(banco, alvo(pedido)) };
    },
  );

  // Fase N (cenário N10): troca da área do item, só por quem pode aprová-lo (PN7).
  servidor.put<{ Params: Parametros; Body: ComPessoa & { area: string } }>(
    "/api/tarefas/:id/itens/:numero/area",
    {
      schema: {
        params: PARAMETROS,
        body: { type: "object", required: ["area"], additionalProperties: false, properties: { pessoa: { type: "string" }, area: { type: "string", maxLength: 60 } } },
      },
    },
    async (pedido) => {
      exigirAprovador(pedido, "Só o Aprovador troca a área de um item.");
      return { item: await trocarArea(banco, { ...alvo(pedido), area: pedido.body.area }) };
    },
  );

  servidor.post<{ Params: Parametros & { tipo: TipoDeAlerta }; Body: ComPessoa }>(
    "/api/tarefas/:id/itens/:numero/alertas/:tipo/reconhecer",
    { schema: { params: COM_ALERTA, body: COM_PESSOA } },
    async (pedido) => ({ item: await reconhecerAlerta(banco, { ...alvo(pedido), tipo: pedido.params.tipo }) }),
  );

  servidor.post<{ Params: Parametros; Body: ComPessoa & { fonte: number } }>(
    "/api/tarefas/:id/itens/:numero/fonte",
    {
      schema: {
        params: PARAMETROS,
        body: { type: "object", required: ["fonte"], additionalProperties: false, properties: { pessoa: { type: "string" }, fonte: { type: "integer", minimum: 1, maximum: 100 } } },
      },
    },
    async (pedido) => ({ item: await escolherFonte(banco, { ...alvo(pedido), fonte: pedido.body.fonte }) }),
  );

  servidor.post<{ Params: Parametros; Body: ComPessoa }>(
    "/api/tarefas/:id/itens/:numero/revisar",
    { schema: { params: PARAMETROS, body: COM_PESSOA } },
    async (pedido) => ({ item: await marcarComoRevisado(banco, alvo(pedido)) }),
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
      avaliacao: await avaliarItem(banco, { ...alvo(pedido), valor: pedido.body.valor, ...(pedido.body.motivo === undefined ? {} : { motivo: pedido.body.motivo }) }),
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
