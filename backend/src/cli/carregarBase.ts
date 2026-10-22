import { stat } from "node:fs/promises";
import path from "node:path";
import { parseArgs } from "node:util";
import { carregarBase, type ResumoDaCarga } from "../base/carga.ts";
import { carregarConfiguracaoSemChave, ErroDeConfiguracao } from "../config/config.ts";
import { abrirBanco, ErroDeBancoEmUso } from "../persistencia/banco.ts";

/**
 * Comando `npm run carregar-base -- <pasta> [--enviado-por <nome>]`.
 * Carrega os `.md` da pasta no banco local e imprime o resumo (FORMATO_BASE_MD.md, seção 5).
 * É a mesma carga do botão "Subir documentos" da tela Base de conhecimento, para quem prefere
 * carregar uma pasta inteira. Termina com código de saída 1 se algum arquivo for recusado.
 * Não usa a chave da API e não roda com o servidor aberto sobre o mesmo banco.
 */
const USO = "Uso: npm run carregar-base -- <pasta> [--enviado-por <nome>]";

function imprimir(resumo: ResumoDaCarga): void {
  const secoes: [string, string[]][] = [
    ["Carregados", resumo.carregados],
    ["Atualizados", resumo.atualizados],
    ["Sem mudança", resumo.semMudanca],
    ["Recusados", resumo.recusados.map(({ nome, motivo }) => `${nome}: ${motivo}`)],
    ["Avisos", resumo.avisos.map(({ nome, mensagem }) => `${nome}: ${mensagem}`)],
    ["Ignorados", resumo.ignorados.map(({ nome, motivo }) => `${nome}: ${motivo}`)],
    ["Órfãos (no banco, sem arquivo na pasta; nada foi apagado)", resumo.orfaos],
  ];
  for (const [titulo, itens] of secoes) {
    console.log(`${titulo}: ${itens.length}`);
    for (const item of itens) console.log(`  ${item}`);
  }
}

async function executar(): Promise<number> {
  const { values, positionals } = parseArgs({
    allowPositionals: true,
    options: { "enviado-por": { type: "string" } },
  });
  const pastaInformada = positionals[0];
  if (pastaInformada === undefined || positionals.length > 1) {
    console.error(USO);
    return 1;
  }

  const pasta = path.resolve(pastaInformada);
  if (!(await stat(pasta).catch(() => undefined))?.isDirectory()) {
    console.error(`Pasta não encontrada: ${pastaInformada}`);
    return 1;
  }

  const configuracao = carregarConfiguracaoSemChave();
  const banco = await abrirBanco(path.join(configuracao.pastaDados, "banco"));
  try {
    const resumo = await carregarBase({
      pasta,
      banco,
      hoje: new Date().toISOString().slice(0, 10),
      enviadoPor: values["enviado-por"]?.trim() || null,
    });
    console.log(`Carga da base: ${pastaInformada}`);
    imprimir(resumo);
    return resumo.recusados.length > 0 ? 1 : 0;
  } finally {
    await banco.close();
  }
}

try {
  process.exitCode = await executar();
} catch (erro) {
  if (!(erro instanceof ErroDeConfiguracao || erro instanceof ErroDeBancoEmUso)) throw erro;
  console.error(erro.message);
  process.exitCode = 1;
}
