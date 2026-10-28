import { mkdir, readFile, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { parseArgs } from "node:util";
import { carregarCabecalhos } from "../config/cabecalhos.ts";
import { carregarConfiguracao, ErroDeConfiguracao } from "../config/config.ts";
import { ErroDePlanilha, identificarPerguntas, lerPlanilha, validarArquivoDePlanilha } from "../documentos/planilha.ts";
import { gerarRespostas } from "../geracao/gerarRespostas.ts";
import { criarIdentificadorComIA } from "../geracao/identificarComIA.ts";
import { ClienteDaIa, criarApiDoClaude, ErroDaIa, type ApiDoClaude, type EntradaDoRegistro, type MensagemDaIa } from "../ia/cliente.ts";
import { ORGANIZACAO_INICIAL } from "../persistencia/organizacoes.ts";
import { abrirBancoConfigurado, ErroDeBancoEmUso } from "../persistencia/banco.ts";
import { buscarFontes, ErroDeTeto, type DocumentoDoContexto } from "../recuperacao/buscarFontes.ts";

/**
 * Comando `npm run gerar-amostra -- <planilha.xlsx> [--limite 5]`: verificação real da etapa A5.
 * Gera respostas para as primeiras perguntas da planilha com a base ativa do banco e imprime cada
 * resposta com as citações (documento · seção · linha). Grava as respostas brutas da API e o registro
 * em dados/amostras/, para conferir as citações e os marcadores e para virar arquivo de teste.
 * Chama a API real: exige ANTHROPIC_API_KEY e tem custo.
 */
const USO = "Uso: npm run gerar-amostra -- <planilha.xlsx> [--limite 5]";
const LIMITE_PADRAO = 5;

async function executar(): Promise<number> {
  const { values, positionals } = parseArgs({ allowPositionals: true, options: { limite: { type: "string" } } });
  const arquivo = positionals[0];
  const limite = Number(values.limite ?? LIMITE_PADRAO);
  if (arquivo === undefined || positionals.length > 1 || !Number.isInteger(limite) || limite < 1) {
    console.error(USO);
    return 1;
  }
  if (!(await stat(arquivo).catch(() => undefined))?.isFile()) {
    console.error(`Arquivo não encontrado: ${arquivo}`);
    return 1;
  }

  const configuracao = carregarConfiguracao();
  const brutas: MensagemDaIa[] = [];
  const real = criarApiDoClaude(configuracao.chaveApi);
  const api: ApiDoClaude = {
    gerar: async (parametros) => {
      const mensagem = await real.gerar(parametros);
      brutas.push(mensagem);
      return mensagem;
    },
    contarTokens: (parametros) => real.contarTokens(parametros),
  };
  const registro: EntradaDoRegistro[] = [];
  const cliente = new ClienteDaIa(api, (entrada) => registro.push(entrada));

  const conteudo = new Uint8Array(await readFile(arquivo));
  validarArquivoDePlanilha(path.basename(arquivo), conteudo);
  const banco = await abrirBancoConfigurado(configuracao);
  try {
    const identificacao = await identificarPerguntas(await lerPlanilha(conteudo), {
      nomes: await carregarCabecalhos(),
      identificadorComIA: criarIdentificadorComIA(cliente, configuracao.ia.modeloDeIdentificacao),
    });
    const perguntas = identificacao.perguntas.slice(0, limite).map((pergunta, posicao) => ({ numero: posicao + 1, texto: pergunta.texto }));
    console.log(`${identificacao.perguntas.length} perguntas identificadas (${identificacao.origem}); gerando para ${perguntas.length}.`);

    const fontes = await buscarFontes({ banco, organizacaoId: ORGANIZACAO_INICIAL, cliente, modelo: configuracao.ia.modelo, hoje: new Date().toISOString().slice(0, 10) });
    if (fontes.tipo === "vazia") {
      console.log("Base sem documento ativo: todas as perguntas ficam sem rascunho, sem chamar a geração.");
      return 0;
    }
    console.log(`Base: ${fontes.contexto.documentos.length} documentos, ${fontes.contexto.tokens} tokens.`);

    const resultado = await gerarRespostas({ cliente, contexto: fontes.contexto, perguntas, ia: configuracao.ia });
    const porNome = new Map(fontes.contexto.documentos.map((documento) => [documento.nome, documento]));
    for (const resposta of resultado.respostas) {
      console.log(`\n[P${resposta.numero}] ${perguntas[resposta.numero - 1]?.texto ?? ""}`);
      console.log(`  Situação: ${resposta.situacao}${resposta.citacoesDescartadas ? ` (${resposta.citacoesDescartadas} citações descartadas)` : ""}`);
      for (const trecho of resposta.trechos) {
        console.log(`  > ${trecho.texto.trim()}`);
        for (const citacao of trecho.citacoes) console.log(`    fonte: ${localizar(porNome.get(citacao.documento), citacao.documento, citacao.blocoInicial)}`);
      }
    }

    const pasta = path.join(configuracao.pastaDados, "amostras", new Date().toISOString().replace(/[:.]/g, "-"));
    await mkdir(pasta, { recursive: true });
    await writeFile(path.join(pasta, "respostas-da-api.json"), JSON.stringify(brutas, null, 2));
    await writeFile(path.join(pasta, "registro.jsonl"), registro.map((entrada) => JSON.stringify(entrada)).join("\n") + "\n");
    console.log(`\nModelo ${resultado.modelo}, instruções ${resultado.versaoDasInstrucoes}, lote de ${resultado.tamanhoDoLote}.`);
    console.log(`Respostas brutas e registro gravados em ${pasta}`);
    return 0;
  } finally {
    await banco.close();
  }
}

/** `arquivo · seção · linha N` do bloco citado. A conferência literal do trecho é da etapa A6. */
function localizar(documento: DocumentoDoContexto | undefined, nome: string, bloco: number): string {
  const encontrado = documento?.blocos[bloco];
  return encontrado === undefined ? `${nome} · bloco ${bloco} (não encontrado)` : `${nome} · ${encontrado.secao} · linha ${encontrado.linhaInicial}`;
}

try {
  process.exitCode = await executar();
} catch (erro) {
  const conhecidos = [ErroDeConfiguracao, ErroDeBancoEmUso, ErroDaIa, ErroDeTeto, ErroDePlanilha];
  if (!conhecidos.some((classe) => erro instanceof classe)) throw erro;
  console.error((erro as Error).message);
  process.exitCode = 1;
}
