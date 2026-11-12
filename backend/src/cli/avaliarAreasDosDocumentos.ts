import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { parseArgs } from "node:util";
import { dividirEmBlocos } from "../base/blocos.ts";
import { lerArquivoMd } from "../base/cabecalho.ts";
import { classificarDocumento } from "../base/classificarDocumento.ts";
import { avaliarClassificacaoDeDocumentos, relatorioDaClassificacaoEmMarkdown, type DocumentoRotulado } from "../avaliacao/areasDosDocumentos.ts";
import { carregarConfiguracao, ErroDeConfiguracao, MODELO_DE_CLASSIFICACAO_DE_DOCUMENTO_PADRAO } from "../config/config.ts";
import { ClienteDaIa, criarApiDoClaude, type EntradaDoRegistro } from "../ia/cliente.ts";
import { AREA_GERAL } from "../regras/areas.ts";

/**
 * Comando `npm run avaliar-areas-documentos -- <pasta-da-base> <areas-esperadas.json> [--saida <relatorio.md>]`
 * (fase U, cenário U7): classifica cada documento rotulado com a mesma chamada da carga, sem banco,
 * e compara com as áreas esperadas. As RFPs passadas ficam "Geral" sem chamar a IA (PU2). Grava o
 * relatório em Markdown e o JSON ao lado. Chama a API real: exige ANTHROPIC_API_KEY e tem custo.
 * Termina com código 1 quando a concordância fica abaixo do limite.
 */
const USO = "Uso: npm run avaliar-areas-documentos -- <pasta-da-base> <areas-esperadas.json> [--saida <relatorio.md>]";

async function executar(): Promise<number> {
  const { values, positionals } = parseArgs({ allowPositionals: true, options: { saida: { type: "string" } } });
  const [pasta, arquivoDeAreas] = positionals;
  if (pasta === undefined || arquivoDeAreas === undefined || positionals.length > 2) {
    console.error(USO);
    return 1;
  }
  const configuracao = carregarConfiguracao();
  const modelo = configuracao.ia.modeloDeClassificacaoDeDocumento ?? MODELO_DE_CLASSIFICACAO_DE_DOCUMENTO_PADRAO;
  const registro: EntradaDoRegistro[] = [];
  const cliente = new ClienteDaIa(criarApiDoClaude(configuracao.chaveApi), (entrada) => registro.push(entrada));
  const rotulos = (JSON.parse(await readFile(arquivoDeAreas, "utf8")) as { documentos: { documento: string; tipo: string; areas_esperadas: string[] }[] }).documentos;
  const hoje = new Date().toISOString().slice(0, 10);

  const documentos: DocumentoRotulado[] = [];
  for (const [posicao, rotulo] of rotulos.entries()) {
    const lido = lerArquivoMd(new Uint8Array(await readFile(path.join(pasta, rotulo.documento))), hoje);
    const nome = path.basename(rotulo.documento);
    let atribuidas: string[] | null;
    if (lido.cabecalho.tipo === "rfp-passada") {
      atribuidas = [AREA_GERAL];
    } else {
      const blocos = dividirEmBlocos(lido.linhas, lido.inicioDoCorpo);
      const resultado = await classificarDocumento({ cliente, modelo, documento: { nome, titulo: lido.cabecalho.titulo, tipo: lido.cabecalho.tipo, blocos } });
      atribuidas = resultado.falhou ? null : resultado.areas;
    }
    documentos.push({ documento: rotulo.documento, esperadas: rotulo.areas_esperadas, atribuidas });
    console.log(`${posicao + 1}/${rotulos.length} ${rotulo.documento}: ${atribuidas === null ? "(falha)" : atribuidas.join(", ")}`);
  }

  const relatorio = avaliarClassificacaoDeDocumentos(documentos);
  const saida = values.saida ?? path.resolve("../dados/avaliacao-areas-documentos.md");
  const tokens = registro.reduce((soma, entrada) => ({ entrada: soma.entrada + (entrada.tokens?.entrada ?? 0), saida: soma.saida + (entrada.tokens?.saida ?? 0) }), { entrada: 0, saida: 0 });
  await writeFile(saida, relatorioDaClassificacaoEmMarkdown(relatorio, modelo) + `\nTokens: ${tokens.entrada} de entrada e ${tokens.saida} de saída, em ${registro.length} requisições.\n`);
  await writeFile(saida.replace(/\.md$/, "") + ".json", JSON.stringify({ modelo, tokens, ...relatorio }, null, 2));
  console.log(`\nConcordância: ${(relatorio.concordancia * 100).toFixed(1)}% (${relatorio.concordantes} de ${relatorio.total}). Relatório em ${saida}`);
  return relatorio.aprovado ? 0 : 1;
}

try {
  process.exitCode = await executar();
} catch (erro) {
  if (!(erro instanceof ErroDeConfiguracao)) throw erro;
  console.error(erro.message);
  process.exitCode = 1;
}
