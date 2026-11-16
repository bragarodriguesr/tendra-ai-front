import type { EntradaDoRegistro } from "../ia/cliente.ts";
import type { MetricasDaTarefa } from "../observabilidade/metricas.ts";
import { refDoItem, type ExecucaoAvaliada, type RelatorioDeAvaliacao } from "./avaliar.ts";
import type { GabaritoDaRfp } from "./gabarito.ts";

/**
 * Comparação da seleção por área (fase U, cenário U16): a mesma RFP processada com a seleção ligada
 * e desligada. Compara tokens de entrada e tempo da geração, relevância, fidelidade, perguntas por
 * contexto e "Sem rascunho" indevido, e mede a cobertura da seleção: das perguntas com resposta no
 * gabarito, quantas tiveram os documentos esperados no contexto da primeira geração, antes da
 * segunda tentativa. Metas da spec: tokens −40%, tempo −25%, cobertura ≥ 95%, zero "Sem rascunho"
 * indevido, relevância ≥ 80% e fidelidade ≥ 90%.
 */
export const META_DE_TOKENS = 0.4;
export const META_DE_TEMPO = 0.25;
export const META_DE_COBERTURA = 0.95;

export interface ExecucaoDaSelecao extends ExecucaoAvaliada {
  metricas: MetricasDaTarefa | null;
  registro: EntradaDoRegistro[];
  contextos?: string[];
}

export interface ComparacaoDaSelecao {
  tokens: { ligada: number; desligada: number; reducao: number | null };
  tempoDaGeracaoMs: { ligada: number; desligada: number; reducao: number | null };
  perguntasPorContexto: Record<string, number>;
  /** Perguntas com resposta no gabarito: com algum documento esperado no contexto, e com todos. */
  cobertura: { perguntas: number; comAlgum: number; comTodos: number; fora: string[] };
  semRascunhoIndevido: string[];
  criterios: { criterio: string; ligada: string; desligada: string }[];
  reprovacoes: string[];
}

const tokensDaGeracao = (registro: EntradaDoRegistro[]) =>
  registro.filter((entrada) => entrada.etapa === "geracao").reduce((soma, entrada) => soma + (entrada.tokens === null ? 0 : entrada.tokens.entrada + entrada.tokens.lidosDoCache + entrada.tokens.gravadosNoCache), 0);
const reducao = (ligada: number, desligada: number) => (desligada > 0 ? 1 - ligada / desligada : null);

export function compararSelecao(entrada: {
  ligada: ExecucaoDaSelecao;
  desligada: ExecucaoDaSelecao;
  gabarito: GabaritoDaRfp;
  relatorios: { ligada: RelatorioDeAvaliacao; desligada: RelatorioDeAvaliacao };
}): ComparacaoDaSelecao {
  const { ligada, desligada, gabarito } = entrada;
  const tokens = { ligada: tokensDaGeracao(ligada.registro), desligada: tokensDaGeracao(desligada.registro) };
  const tempo = { ligada: ligada.metricas?.duracaoPorEtapa.geracao ?? 0, desligada: desligada.metricas?.duracaoPorEtapa.geracao ?? 0 };

  // A primeira requisição de geração com a pergunta é a do grupo dela; a segunda tentativa vem depois.
  const primeiraGeracao = new Map<number, string[]>();
  for (const requisicao of ligada.registro) {
    if (requisicao.etapa !== "geracao") continue;
    for (const numero of requisicao.perguntas) if (!primeiraGeracao.has(numero)) primeiraGeracao.set(numero, requisicao.documentos);
  }
  const cobertura = { perguntas: 0, comAlgum: 0, comTodos: 0, fora: [] as string[] };
  const semRascunhoIndevido: string[] = [];
  for (const item of ligada.itens) {
    const ref = refDoItem(item, ligada, gabarito);
    const pergunta = gabarito.perguntas.find((candidata) => candidata.ref === ref);
    if (pergunta === undefined || !pergunta.temResposta) continue;
    if (item.st === "sem-rascunho") semRascunhoIndevido.push(pergunta.ref);
    if (pergunta.documentosEsperados.length === 0) continue;
    const documentos = primeiraGeracao.get(Number(item.id.slice(1))) ?? [];
    cobertura.perguntas++;
    const presentes = pergunta.documentosEsperados.filter((nome) => documentos.includes(nome)).length;
    if (presentes > 0) cobertura.comAlgum++;
    else cobertura.fora.push(pergunta.ref);
    if (presentes === pergunta.documentosEsperados.length) cobertura.comTodos++;
  }

  const perguntasPorContexto: Record<string, number> = {};
  for (const contexto of ligada.contextos ?? []) perguntasPorContexto[contexto] = (perguntasPorContexto[contexto] ?? 0) + 1;

  const valor = (relatorio: RelatorioDeAvaliacao, nome: string) => relatorio.criterios.find((criterio) => criterio.criterio === nome);
  const nomes = ["Relevância da recuperação", "Fidelidade do conteúdo", "Comportamento com contexto insuficiente", "Comportamento com fontes conflitantes", "Validade das fontes"];
  const criterios = nomes.map((criterio) => ({ criterio, ligada: valor(entrada.relatorios.ligada, criterio)?.valor ?? "—", desligada: valor(entrada.relatorios.desligada, criterio)?.valor ?? "—" }));

  const reprovacoes: string[] = [];
  const reducaoDeTokens = reducao(tokens.ligada, tokens.desligada);
  const reducaoDeTempo = reducao(tempo.ligada, tempo.desligada);
  if (reducaoDeTokens === null || reducaoDeTokens < META_DE_TOKENS) reprovacoes.push("redução de tokens abaixo de 40%");
  if (reducaoDeTempo === null || reducaoDeTempo < META_DE_TEMPO) reprovacoes.push("redução do tempo da geração abaixo de 25%");
  if (cobertura.perguntas > 0 && cobertura.comAlgum / cobertura.perguntas < META_DE_COBERTURA) reprovacoes.push("cobertura da seleção abaixo de 95%");
  if (semRascunhoIndevido.length > 0) reprovacoes.push(`perguntas com resposta em "Sem rascunho": ${semRascunhoIndevido.join(", ")}`);
  for (const nome of ["Relevância da recuperação", "Fidelidade do conteúdo"]) if (valor(entrada.relatorios.ligada, nome)?.situacao === "reprovado") reprovacoes.push(`${nome.toLowerCase()} reprovada`);

  return {
    tokens: { ...tokens, reducao: reducaoDeTokens },
    tempoDaGeracaoMs: { ...tempo, reducao: reducaoDeTempo },
    perguntasPorContexto,
    cobertura,
    semRascunhoIndevido,
    criterios,
    reprovacoes,
  };
}

const porcento = (valor: number | null) => (valor === null ? "—" : `${(valor * 100).toLocaleString("pt-BR", { maximumFractionDigits: 1 })}%`);

export function comparacaoEmMarkdown(comparacao: ComparacaoDaSelecao, rfp: string): string {
  const { tokens, tempoDaGeracaoMs: tempo, cobertura } = comparacao;
  return [
    `# Avaliação da seleção por área (cenário U16): ${rfp}`,
    "",
    `**${comparacao.reprovacoes.length === 0 ? "Aprovada" : "Reprovada"}**${comparacao.reprovacoes.length === 0 ? "" : `: ${comparacao.reprovacoes.join("; ")}`}.`,
    "",
    "| Medida | Seleção ligada | Seleção desligada | Diferença |",
    "|---|---|---|---|",
    `| Tokens de entrada da geração | ${tokens.ligada.toLocaleString("pt-BR")} | ${tokens.desligada.toLocaleString("pt-BR")} | −${porcento(tokens.reducao)} (meta −40%) |`,
    `| Tempo da geração | ${Math.round(tempo.ligada / 1000)} s | ${Math.round(tempo.desligada / 1000)} s | −${porcento(tempo.reducao)} (meta −25%) |`,
    ...comparacao.criterios.map((linha) => `| ${linha.criterio} | ${linha.ligada} | ${linha.desligada} | |`),
    "",
    `- Cobertura da seleção (algum documento esperado no contexto da área, antes da segunda tentativa): ${porcento(cobertura.perguntas ? cobertura.comAlgum / cobertura.perguntas : null)} (${cobertura.comAlgum} de ${cobertura.perguntas}); com todos os esperados: ${cobertura.comTodos}. Fora: ${cobertura.fora.join(", ") || "nenhuma"}.`,
    `- Perguntas por contexto, com a seleção ligada: ${Object.entries(comparacao.perguntasPorContexto).map(([contexto, total]) => `${contexto} ${total}`).join(", ") || "—"}.`,
    `- Perguntas com resposta no gabarito em "Sem rascunho": ${comparacao.semRascunhoIndevido.join(", ") || "nenhuma"}.`,
    "",
  ].join("\n");
}
