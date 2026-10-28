import { randomUUID } from "node:crypto";
import { conferirDono, ErroDeArmazenamento, pastaDaOrganizacao, type Armazenamento } from "./armazenamento.ts";

/** Bucket privado das planilhas (enviadas e preenchidas) no modo compartilhado (etapa D3). */
export const BUCKET_DAS_PLANILHAS = "rfps";

const EXTENSAO_VALIDA = /^[a-z0-9]{1,10}$/;
const TIPOS: Record<string, string> = { xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" };

/**
 * Armazenamento sobre o Supabase Storage (cenário D14): mesmo contrato do disco local, com nome
 * gerado pelo backend (cenário 31), num bucket privado lido só com a chave de serviço.
 */
export function criarArmazenamentoSupabase(opcoes: { supabaseUrl: string; chaveDeServico: string; bucket?: string; fetch?: typeof fetch }): Armazenamento {
  const bucket = opcoes.bucket ?? BUCKET_DAS_PLANILHAS;
  const buscar = opcoes.fetch ?? fetch;
  const base = `${opcoes.supabaseUrl}/storage/v1/object/${bucket}`;
  // Chave nova (sb_secret_...) vai só em `apikey`; a antiga, em JWT, também no Authorization.
  const cabecalhos: Record<string, string> = { apikey: opcoes.chaveDeServico };
  if (opcoes.chaveDeServico.startsWith("eyJ")) cabecalhos.Authorization = `Bearer ${opcoes.chaveDeServico}`;

  async function pedir(caminho: string, init: RequestInit, aceitar: (status: number) => boolean = () => false): Promise<Response> {
    let resposta: Response;
    try {
      resposta = await buscar(`${base}/${caminho}`, { ...init, headers: { ...cabecalhos, ...(init.headers as Record<string, string> | undefined) } });
    } catch {
      throw new ErroDeArmazenamento("Falha de comunicação com o armazenamento de arquivos.");
    }
    if (!resposta.ok && !aceitar(resposta.status)) throw new ErroDeArmazenamento(`O armazenamento de arquivos recusou a operação (${resposta.status}).`);
    return resposta;
  }

  return {
    async salvar(organizacaoId, subpasta, conteudo, extensao) {
      if (!EXTENSAO_VALIDA.test(extensao)) throw new ErroDeArmazenamento(`Extensão de arquivo inválida: ${extensao}`);
      const caminho = `${pastaDaOrganizacao(organizacaoId, subpasta)}/${randomUUID()}.${extensao}`;
      await pedir(caminho, {
        method: "POST",
        headers: { "Content-Type": TIPOS[extensao] ?? "application/octet-stream", "x-upsert": "false" },
        body: Buffer.from(conteudo),
      });
      return caminho;
    },

    async ler(organizacaoId, caminho) {
      conferirDono(organizacaoId, caminho);
      const resposta = await pedir(caminho, { method: "GET" });
      return Buffer.from(await resposta.arrayBuffer());
    },

    async apagar(organizacaoId, caminho) {
      conferirDono(organizacaoId, caminho);
      // Objeto que já não existe: o Storage responde 400 ou 404, e o resultado é o mesmo.
      await pedir(caminho, { method: "DELETE" }, (status) => status === 400 || status === 404);
    },
  };
}
