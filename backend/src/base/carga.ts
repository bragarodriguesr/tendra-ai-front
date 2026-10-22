import { createHash } from "node:crypto";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { gravarDocumento, listarDocumentos } from "../persistencia/documentos.ts";
import type { Banco } from "../persistencia/banco.ts";
import { dividirEmBlocos } from "./blocos.ts";
import { ErroDeArquivoMd, lerArquivoMd } from "./cabecalho.ts";

/** Um arquivo a carregar: enviado pela tela da Base ou lido de uma pasta pelo comando. */
export interface ArquivoParaCarga {
  /** Nome do arquivo, sem pastas: a identidade do documento na base. */
  nome: string;
  conteudo: Uint8Array;
  /** Caminho relativo à pasta carregada, quando vem do comando. Só aparece nas mensagens. */
  caminho?: string;
}

/** Resultado da carga de um conjunto de arquivos (FORMATO_BASE_MD.md, seção 5). Itens pelo nome do arquivo. */
export interface ResumoDoEnvio {
  carregados: string[];
  atualizados: string[];
  semMudanca: string[];
  recusados: { nome: string; motivo: string }[];
  avisos: { nome: string; mensagem: string }[];
  ignorados: { nome: string; motivo: string }[];
}

/** Resumo do comando carregar-base: o do envio mais os órfãos da pasta. */
export interface ResumoDaCarga extends ResumoDoEnvio {
  /** Documentos do banco sem arquivo de mesmo nome na pasta. Nada é apagado. */
  orfaos: string[];
}

export interface OpcoesDoEnvio {
  banco: Banco;
  arquivos: ArquivoParaCarga[];
  /** Data de hoje (AAAA-MM-DD), usada para recusar `atualizado_em` no futuro. */
  hoje: string;
  /** Quem carregou, para a coluna "Enviado por" da tela da Base. */
  enviadoPor: string | null;
}

export interface OpcoesDaCarga extends Omit<OpcoesDoEnvio, "arquivos"> {
  pasta: string;
}

export const MOTIVO_FORMATO_NAO_ACEITO = "formato não aceito nesta versão";
export const TAMANHO_MAXIMO_DO_NOME = 200;

/** Estimativa de tokens usada até a contagem exata pela API (etapa A5). */
export function estimarTokens(texto: string): number {
  return Math.ceil(texto.length / 4);
}

/** Nome do arquivo sem as pastas, aceitando "/" e "\" como separador. */
export function nomeDoArquivo(nomeRecebido: string): string {
  return (nomeRecebido.split(/[\\/]/).at(-1) ?? "").trim();
}

/**
 * Carrega arquivos `.md` na base (cenários 7, 8, 9 e 39). Cada arquivo é tratado sozinho:
 * um arquivo recusado não impede os demais. Usada pela rota de envio da tela e pelo comando.
 */
export async function carregarArquivos(opcoes: OpcoesDoEnvio): Promise<ResumoDoEnvio> {
  const resumo: ResumoDoEnvio = { carregados: [], atualizados: [], semMudanca: [], recusados: [], avisos: [], ignorados: [] };
  const gravados = new Map((await listarDocumentos(opcoes.banco)).map((documento) => [documento.nome, documento]));

  const arquivos = opcoes.arquivos.map((arquivo) => ({ ...arquivo, nome: nomeDoArquivo(arquivo.nome) }));
  const repetidos = caminhosDosNomesRepetidos(arquivos);

  for (const arquivo of arquivos) {
    const { nome, conteudo } = arquivo;
    if (nome === "" || nome.length > TAMANHO_MAXIMO_DO_NOME) {
      resumo.recusados.push({ nome: nome || "(sem nome)", motivo: `nome de arquivo inválido. Use até ${TAMANHO_MAXIMO_DO_NOME} caracteres.` });
      continue;
    }
    if (!nome.toLowerCase().endsWith(".md")) {
      resumo.ignorados.push({ nome, motivo: MOTIVO_FORMATO_NAO_ACEITO });
      continue;
    }
    const caminhos = repetidos.get(nome);
    if (caminhos !== undefined) {
      const onde = caminhos.length > 0 ? ` (${caminhos.join(", ")})` : "";
      resumo.recusados.push({
        nome,
        motivo: `há mais de um arquivo com este nome nesta carga${onde}. Cada documento da base precisa de um nome único.`,
      });
      continue;
    }

    const hash = createHash("sha256").update(conteudo).digest("hex");
    if (gravados.get(nome)?.hash === hash) {
      resumo.semMudanca.push(nome);
      continue;
    }

    try {
      const lido = lerArquivoMd(conteudo, opcoes.hoje);
      const blocos = dividirEmBlocos(lido.linhas, lido.inicioDoCorpo);
      if (blocos.length === 0) throw new ErroDeArquivoMd("o arquivo não tem conteúdo.");

      const resultado = await gravarDocumento(opcoes.banco, {
        nome,
        cabecalho: lido.cabecalho,
        hash,
        tamanhoBytes: conteudo.byteLength,
        tokensEstimados: estimarTokens(blocos.map((bloco) => bloco.texto).join("\n")),
        enviadoPor: opcoes.enviadoPor,
        blocos,
      });
      (resultado === "novo" ? resumo.carregados : resumo.atualizados).push(nome);
      for (const mensagem of lido.avisos) resumo.avisos.push({ nome, mensagem });
    } catch (erro) {
      if (!(erro instanceof ErroDeArquivoMd)) throw erro;
      resumo.recusados.push({ nome, motivo: erro.message });
    }
  }
  return resumo;
}

/**
 * Carrega os arquivos de uma pasta (e subpastas), como o comando carregar-base.
 * Além do resumo do envio, lista os órfãos: documentos do banco sem arquivo de mesmo nome na pasta.
 */
export async function carregarBase(opcoes: OpcoesDaCarga): Promise<ResumoDaCarga> {
  const caminhos = await listarArquivos(opcoes.pasta);
  const arquivos = await Promise.all(
    caminhos.map(async (caminho) => ({
      nome: path.posix.basename(caminho),
      caminho,
      conteudo: new Uint8Array(await readFile(path.join(opcoes.pasta, caminho))),
    })),
  );
  const nomesAntes = (await listarDocumentos(opcoes.banco)).map((documento) => documento.nome);
  const resumo = await carregarArquivos({ ...opcoes, arquivos });

  const encontrados = new Set(arquivos.map((arquivo) => arquivo.nome));
  const orfaos = nomesAntes.filter((nome) => !encontrados.has(nome)).sort();
  return { ...resumo, orfaos };
}

/** Nomes `.md` que aparecem mais de uma vez, com os caminhos de cada ocorrência (vazio quando não há caminho). */
function caminhosDosNomesRepetidos(arquivos: ArquivoParaCarga[]): Map<string, string[]> {
  const porNome = new Map<string, ArquivoParaCarga[]>();
  for (const arquivo of arquivos) {
    if (!arquivo.nome.toLowerCase().endsWith(".md")) continue;
    porNome.set(arquivo.nome, [...(porNome.get(arquivo.nome) ?? []), arquivo]);
  }
  const repetidos = new Map<string, string[]>();
  for (const [nome, ocorrencias] of porNome) {
    if (ocorrencias.length < 2) continue;
    repetidos.set(nome, ocorrencias.flatMap((ocorrencia) => (ocorrencia.caminho === undefined ? [] : [ocorrencia.caminho])));
  }
  return repetidos;
}

/** Arquivos da pasta e das subpastas, com caminho relativo usando "/". Ignora nomes iniciados por ponto. */
async function listarArquivos(pasta: string): Promise<string[]> {
  const entradas = await readdir(pasta, { recursive: true, withFileTypes: true });
  return entradas
    .filter((entrada) => entrada.isFile())
    .map((entrada) => path.relative(pasta, path.join(entrada.parentPath, entrada.name)).split(path.sep).join("/"))
    .filter((caminho) => !caminho.split("/").some((parte) => parte.startsWith(".")))
    .sort();
}
