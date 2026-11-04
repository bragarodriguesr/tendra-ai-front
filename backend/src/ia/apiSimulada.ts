import type { ApiDoClaude, MensagemDaIa, ParametrosDaContagem, ParametrosDaGeracao } from "./cliente.ts";

/**
 * API do Claude SIMULADA, para usar o servidor e a tela sem a chave da API (pendência A1).
 * Ligada só com TENDRA_API_SIMULADA=1. As respostas são fictícias: para cada pergunta, cita o
 * bloco da base com mais palavras em comum ou responde SEM_RESPOSTA. Não mede a qualidade da IA;
 * tudo o que passa por aqui precisa ser retestado com a API real depois da A1.
 */

export const AVISO_DA_API_SIMULADA =
  "API do Claude SIMULADA (TENDRA_API_SIMULADA=1): as respostas são fictícias e precisam ser retestadas com a API real depois da A1.";

const PALAVRAS_IGNORADAS = new Set(["qual", "quais", "como", "para", "pela", "pelo", "pelos", "pelas", "sobre", "existe", "possui", "empresa", "pulse", "sobre", "entre", "quando", "onde", "isso", "essa", "esse", "este", "esta", "mais", "menos", "cada", "também", "seus", "suas"]);
const MINIMO_DE_PALAVRAS_EM_COMUM = 2;

function palavras(texto: string): Set<string> {
  const normalizado = texto.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();
  return new Set((normalizado.match(/[\p{L}\p{N}]{4,}/gu) ?? []).filter((palavra) => !PALAVRAS_IGNORADAS.has(palavra)));
}

function mensagem(modelo: string, conteudo: MensagemDaIa["content"]): MensagemDaIa {
  return {
    id: "msg_api_simulada",
    type: "message",
    role: "assistant",
    model: modelo,
    content: conteudo,
    stop_reason: "end_turn",
    stop_sequence: null,
    usage: { input_tokens: 0, output_tokens: 0, cache_creation_input_tokens: 0, cache_read_input_tokens: 0 },
  } as MensagemDaIa;
}

const textoDoBloco = (text: string, citations: unknown[] | null = null) => ({ type: "text", text, citations }) as MensagemDaIa["content"][number];

function textoDoPedido(parametros: ParametrosDaGeracao): string {
  const conteudo = parametros.messages[0]?.content;
  const ultimo = Array.isArray(conteudo) ? conteudo.at(-1) : undefined;
  return typeof conteudo === "string" ? conteudo : ultimo?.type === "text" ? ultimo.text : "";
}

/** Identificação: em linhas com mais de uma célula, as células de texto longo viram perguntas. */
function identificar(texto: string): string {
  const perguntas: { aba: string; linha: number; texto: string }[] = [];
  let aba = "";
  for (const linha of texto.split("\n")) {
    const nomeDaAba = /^<aba nome="(.*)">$/.exec(linha);
    if (nomeDaAba) aba = nomeDaAba[1] ?? "";
    const celulas = /^Linha (\d+): (.*)$/.exec(linha);
    if (!celulas) continue;
    const daLinha = (celulas[2] ?? "").split(" | ");
    if (daLinha.length < 2) continue;
    for (const celula of daLinha) {
      if (celula.trim().length >= 20) perguntas.push({ aba, linha: Number(celulas[1]), texto: celula });
    }
  }
  return JSON.stringify({ perguntas });
}

/** Classificação por área (fase N): por palavras-chave do assunto; sem nenhuma, "Geral". */
const PALAVRAS_DAS_AREAS: [string, RegExp][] = [
  ["Segurança e privacidade", /lgpd|privacidade|dados pessoais|criptograf|seguran[çc]a|incidente|acesso|vazamento|iso 27001/i],
  ["Jurídico", /contrat|cl[aá]usula|multa|indeniza|responsabilidade|foro|garantia|propriedade intelectual/i],
  ["Comercial", /pre[çc]o|desconto|pagamento|licen[çc]a|plano|refer[eê]ncia|cnpj|faturamento/i],
  ["Tecnologia", /sla|disponibilidade|infraestrutura|hospedagem|api|backup|arquitetura|nuvem|suporte|rpo|rto/i],
  ["Produto", /funcionalidade|roadmap|usabilidade|customiza|integra[çc]|relat[oó]rio|aplicativo/i],
];

function classificar(texto: string): string {
  const itens = [...texto.matchAll(/^\[P(\d+)\] (.*)$/gm)].map(([, numero, pergunta]) => ({
    numero: Number(numero),
    area: PALAVRAS_DAS_AREAS.find(([, padrao]) => padrao.test(pergunta ?? ""))?.[0] ?? "Geral",
  }));
  return JSON.stringify({ itens });
}

function gerarRespostas(parametros: ParametrosDaGeracao): MensagemDaIa["content"] {
  const conteudo = parametros.messages[0]?.content;
  const documentos = Array.isArray(conteudo)
    ? conteudo.flatMap((bloco) =>
        bloco.type === "document" && bloco.source.type === "content" && Array.isArray(bloco.source.content)
          ? [bloco.source.content.map((parte) => (parte.type === "text" ? parte.text : ""))]
          : [],
      )
    : [];
  const blocos = documentos.flatMap((textos, documento) => textos.map((texto, bloco) => ({ documento, bloco, texto, palavras: palavras(texto) })));

  const saida: MensagemDaIa["content"] = [];
  for (const [, numero, pergunta] of textoDoPedido(parametros).matchAll(/^\[P(\d+)\] (.*)$/gm)) {
    const daPergunta = palavras(pergunta ?? "");
    let melhor: (typeof blocos)[number] | undefined;
    let pontos = 0;
    for (const candidato of blocos) {
      let comuns = 0;
      for (const palavra of daPergunta) if (candidato.palavras.has(palavra)) comuns++;
      if (comuns > pontos) {
        melhor = candidato;
        pontos = comuns;
      }
    }
    saida.push(textoDoBloco(`[P${numero}]\n`));
    if (melhor === undefined || pontos < MINIMO_DE_PALAVRAS_EM_COMUM) {
      saida.push(textoDoBloco("SEM_RESPOSTA\n\n"));
      continue;
    }
    const resumo = melhor.texto.replace(/\s+/g, " ").slice(0, 220);
    saida.push(
      textoDoBloco(`[Resposta simulada] ${resumo}`, [
        { type: "content_block_location", cited_text: melhor.texto, document_index: melhor.documento, document_title: null, start_block_index: melhor.bloco, end_block_index: melhor.bloco + 1, file_id: null },
      ]),
      textoDoBloco("\n\n"),
    );
  }
  return saida;
}

export function criarApiSimulada(): ApiDoClaude {
  return {
    async gerar(parametros) {
      const texto = textoDoPedido(parametros);
      // "Revisar com IA": a simulada só tira espaços repetidos e põe maiúscula no início de cada parágrafo.
      if (texto.startsWith("<texto>\n")) {
        const revisado = texto.slice("<texto>\n".length, -"\n</texto>".length)
          .split(/\n\s*\n/)
          .map((paragrafo) => paragrafo.replace(/[ \t]+/g, " ").trim().replace(/^\p{Ll}/u, (letra) => letra.toUpperCase()))
          .join("\n\n");
        return mensagem(parametros.model, [textoDoBloco(JSON.stringify({ texto: revisado }))]);
      }
      if (parametros.output_config?.format) {
        // Identificação de perguntas, classificação por área ou conflito: a simulada nunca aponta conflito.
        const saida = texto.startsWith("<planilha>") ? identificar(texto) : texto.startsWith("<perguntas>") ? classificar(texto) : JSON.stringify({ itens: [] });
        return mensagem(parametros.model, [textoDoBloco(saida)]);
      }
      return mensagem(parametros.model, gerarRespostas(parametros));
    },
    async contarTokens(parametros: ParametrosDaContagem) {
      return Math.ceil(JSON.stringify(parametros.messages).length / 4);
    },
  };
}
