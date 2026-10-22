/**
 * Camada única de chamadas do front ao backend (PLAN.md, C1). Hoje cobre a tela Base de
 * conhecimento: listar, enviar `.md` e ativar ou desativar documentos. Nenhuma regra de
 * negócio fica aqui: a validação dos arquivos é do backend, que devolve o motivo de cada recusa.
 */

export const LIMITE_DO_ENVIO_EM_BYTES = 10 * 1024 * 1024;
export const MENSAGEM_SEM_SERVIDOR = "Não foi possível falar com o servidor da base. Inicie-o com npm run servidor, na pasta backend.";

export class ErroDaApi extends Error {
  constructor(message, { semServidor = false } = {}) {
    super(message);
    this.name = "ErroDaApi";
    this.semServidor = semServidor;
  }
}

async function pedir(caminho, { method = "GET", corpo } = {}) {
  let resposta;
  try {
    resposta = await fetch("/api" + caminho, {
      method,
      headers: corpo === undefined ? undefined : { "Content-Type": "application/json" },
      body: corpo === undefined ? undefined : JSON.stringify(corpo)
    });
  } catch {
    throw new ErroDaApi(MENSAGEM_SEM_SERVIDOR, { semServidor: true });
  }
  // Sem o servidor, o proxy do Vite responde com erro e o site publicado devolve HTML: nenhum dos dois é JSON.
  const json = (resposta.headers.get("content-type") || "").includes("application/json") ? await resposta.json().catch(() => null) : null;
  if (json === null) throw new ErroDaApi(MENSAGEM_SEM_SERVIDOR, { semServidor: true });
  if (!resposta.ok) throw new ErroDaApi(json.erro || "O servidor recusou o pedido.");
  return json;
}

function emBase64(buffer) {
  const bytes = new Uint8Array(buffer);
  let binario = "";
  for (let i = 0; i < bytes.length; i += 0x8000) binario += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(binario);
}

export const listarDocumentosDaBase = () => pedir("/base/documentos");

/** Envia os arquivos escolhidos no computador. Devolve `{ resumo, documentos }`. */
export async function enviarDocumentosDaBase(files, enviadoPor) {
  const total = files.reduce((soma, f) => soma + f.size, 0);
  if (total > LIMITE_DO_ENVIO_EM_BYTES) throw new ErroDaApi("Envio acima de 10 MB. Envie os arquivos em partes menores.");
  const arquivos = await Promise.all(files.map(async (f) => ({ nome: f.name, conteudoBase64: emBase64(await f.arrayBuffer()) })));
  return pedir("/base/documentos", { method: "POST", corpo: { enviadoPor, arquivos } });
}

export const definirDocumentoAtivo = (id, ativo) => pedir(`/base/documentos/${id}`, { method: "PATCH", corpo: { ativo } });

const DIA = 24 * 60 * 60 * 1000;

/** Converte o documento do backend para o formato da tela (o mesmo de `seedDocs` em data.js). */
export function paraDocumentoDaTela(d, hoje = new Date()) {
  const [ano, mes, dia] = d.atualizadoEm.split("-").map(Number);
  const inicioDeHoje = Date.UTC(hoje.getFullYear(), hoje.getMonth(), hoje.getDate());
  return {
    id: "b" + d.id,
    apiId: d.id,
    name: d.titulo,
    file: d.nome,
    type: d.tipo === "rfp-passada" ? "RFP passada" : "Documento",
    upd: `${String(dia).padStart(2, "0")}/${String(mes).padStart(2, "0")}/${ano}`,
    age: Math.max(0, Math.round((inicioDeHoje - Date.UTC(ano, mes - 1, dia)) / DIA)),
    st: "pronto",
    by: d.enviadoPor || "—",
    ver: d.versao || "",
    off: !d.ativo
  };
}
