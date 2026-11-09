/**
 * Camada única de chamadas do front ao backend (PLAN.md, C1): base de conhecimento, tarefas e
 * revisão. Nenhuma regra de negócio fica aqui: a validação dos arquivos e das ações é do
 * backend, que devolve o motivo de cada recusa. Toda ação da revisão envia a pessoa que age;
 * no modo compartilhado (fase D), o backend a ignora e usa a da sessão de login.
 */

export const LIMITE_DO_ENVIO_EM_BYTES = 10 * 1024 * 1024;
export const LIMITE_DA_PLANILHA_EM_BYTES = 10 * 1024 * 1024;
export const MENSAGEM_SEM_SERVIDOR = "Não foi possível falar com o servidor da base. Inicie-o com npm run servidor, na pasta backend.";
export const MENSAGEM_FORMATO_DA_RFP = "Envie a RFP em formato .xlsx";

export class ErroDaApi extends Error {
  constructor(message, { semServidor = false } = {}) {
    super(message);
    this.name = "ErroDaApi";
    this.semServidor = semServidor;
  }
}

export const MENSAGEM_DADOS_SINTETICOS = "Ambiente de testes: envie só documentos e RFPs sintéticos, nunca dados reais de clientes.";

// Fase D: sessão que acaba (expirou, saiu em outra aba) leva de volta ao login.
let aoPerderASessao = () => {};
export function quandoPerderASessao(funcao) { aoPerderASessao = funcao; }
const ROTAS_DE_LOGIN = new Set(["/auth/login", "/auth/me"]);

async function pedir(caminho, { method = "GET", corpo } = {}) {
  let resposta;
  try {
    resposta = await fetch("/api" + caminho, {
      method,
      cache: "no-store",
      headers: corpo === undefined ? undefined : { "Content-Type": "application/json" },
      body: corpo === undefined ? undefined : JSON.stringify(corpo)
    });
  } catch {
    throw new ErroDaApi(MENSAGEM_SEM_SERVIDOR, { semServidor: true });
  }
  // Sem o servidor, o proxy do Vite responde com erro e o site publicado devolve HTML: nenhum dos dois é JSON.
  const json = (resposta.headers.get("content-type") || "").includes("application/json") ? await resposta.json().catch(() => null) : null;
  if (json === null) throw new ErroDaApi(MENSAGEM_SEM_SERVIDOR, { semServidor: true });
  if (resposta.status === 401 && !ROTAS_DE_LOGIN.has(caminho)) aoPerderASessao();
  if (!resposta.ok) throw new ErroDaApi(json.erro || "O servidor recusou o pedido.");
  return json;
}

/**
 * Modo do backend (fase D, D9): `GET /api/auth/me` só existe no modo compartilhado. 200 traz a
 * pessoa da sessão, com o nome da organização (fase K); 401, sem sessão; sem a rota ou sem o servidor, é o modo local (sem login).
 */
export async function obterSessao() {
  try {
    const resposta = await fetch("/api/auth/me", { cache: "no-store" });
    if (resposta.status === 401) return { modo: "compartilhado", pessoa: null };
    if (!resposta.ok) return { modo: "local", pessoa: null };
    const json = await resposta.json();
    return { modo: "compartilhado", pessoa: { ...json.pessoa, organizacao: json.organizacao?.nome } };
  } catch {
    return { modo: "local", pessoa: null };
  }
}

/**
 * Login do modo compartilhado. Devolve `{ pessoa: { nome, papel, organizacao } }`, com o nome da
 * organização da sessão (fase K); recusa com a mensagem do backend (401, 429, 503).
 */
export const entrar = async (email, senha) => {
  const { pessoa, organizacao } = await pedir("/auth/login", { method: "POST", corpo: { email, senha } });
  return { pessoa: { ...pessoa, organizacao: organizacao?.nome } };
};
export const sair = () => pedir("/auth/logout", { method: "POST" });

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

// Tarefas (B2): a planilha vai em base64 com os campos do formulário; o processamento roda em segundo plano.
export const listarTarefas = () => pedir("/tarefas");
export const obterTarefa = (id) => pedir(`/tarefas/${id}`);
export const listarItensDaTarefa = (id) => pedir(`/tarefas/${id}/itens`);
export const enderecoDaPlanilha = (id) => `/api/tarefas/${id}/planilha`;
/** Exclui a tarefa com todos os registros e arquivos dela (cenário 60). Só o Aprovador, no modo compartilhado. */
export const excluirTarefa = (id) => pedir(`/tarefas/${id}`, { method: "DELETE" });
/** Ações sobre as tarefas da organização para o Histórico (fase O, cenário O19): `{ eventos }`. */
export const listarEventosDeTarefas = () => pedir("/historico/tarefas");

// Painel de Usuários (fase Q): só no modo compartilhado e só para o Aprovador.
/** Pessoas da organização e as áreas válidas para o Aprovador: `{ usuarios, areasDoAprovador }`. */
export const listarUsuariosDaGestao = () => pedir("/gestao/usuarios");
/** Adiciona a pessoa cuja conta já existe no Supabase Auth, como Revisor, área Geral: `{ usuario }`. */
export const adicionarUsuarioNaGestao = (nome, email) => pedir("/gestao/usuarios", { method: "POST", corpo: { nome, email } });
/** Muda papel, áreas ou acesso (`{ papel?, areas?, ativo? }`): `{ usuario }`. */
export const alterarUsuarioNaGestao = (id, mudanca) => pedir(`/gestao/usuarios/${id}`, { method: "PATCH", corpo: mudanca });
/**
 * Fase O: situação da tarefa (cenários O7, O10 e O12). Devolve `{ tarefa }` com a situação nova.
 * `pessoa` é o id da lista de configuração no modo local; com login, o backend usa a sessão.
 */
const mudarSituacao = (acao) => (id, pessoa) => pedir(`/tarefas/${id}/${acao}`, { method: "POST", corpo: pessoa ? { pessoa } : {} });
export const finalizarTarefa = mudarSituacao("finalizar");
export const arquivarTarefa = mudarSituacao("arquivar");
export const reativarTarefa = mudarSituacao("reativar");

/** Cria a tarefa. Recusa na hora o que não for .xlsx ou passar de 10 MB, com as mesmas mensagens do backend. */
export async function criarTarefa(file, dados) {
  if (!/\.xlsx$/i.test(file.name)) throw new ErroDaApi(MENSAGEM_FORMATO_DA_RFP);
  if (file.size > LIMITE_DA_PLANILHA_EM_BYTES) throw new ErroDaApi("A planilha passa do limite de 10 MB");
  const arquivo = { nome: file.name, conteudoBase64: emBase64(await file.arrayBuffer()) };
  return pedir("/tarefas", { method: "POST", corpo: { arquivo, dados } });
}

/** Empresa e contatos informados na Nova RFP (cenário 64): `{ empresa: { nome, cnpj } | null, contatos }`. */
export const obterEmpresaDaTarefa = (id) => pedir(`/tarefas/${id}/empresa`);
/** Usuários da plataforma para o campo "Responsável" (cenário 62): `{ usuarios: [{ nome, papel }] }`. */
export const listarUsuarios = () => pedir("/usuarios");

// Revisão (B5): `pessoa` é o id em backend/config/pessoas.json.
export const listarPessoas = () => pedir("/pessoas");
export const listarAvaliacoes = (id) => pedir(`/tarefas/${id}/avaliacoes`);
export const relatorioDeAceitacao = (id) => pedir(`/tarefas/${id}/aceitacao`);
const doItem = (id, numero, acao) => `/tarefas/${id}/itens/${numero}/${acao}`;
export const editarTextoDoItem = (id, numero, pessoa, texto) => pedir(doItem(id, numero, "texto"), { method: "PUT", corpo: { pessoa, texto } });
export const restaurarItem = (id, numero, pessoa) => pedir(doItem(id, numero, "restaurar"), { method: "POST", corpo: { pessoa } });
export const aprovarItemNaApi = (id, numero, pessoa) => pedir(doItem(id, numero, "aprovar"), { method: "POST", corpo: { pessoa } });
export const avaliarItemNaApi = (id, numero, pessoa, valor, motivo) =>
  pedir(doItem(id, numero, "avaliacao"), { method: "PUT", corpo: motivo ? { pessoa, valor, motivo } : { pessoa, valor } });
// Cenários 57 a 59: o alerta vai pelo tipo; a fonte, pelo número (a partir de 1).
export const reconhecerAlertaNaApi = (id, numero, pessoa, tipo) => pedir(doItem(id, numero, `alertas/${tipo}/reconhecer`), { method: "POST", corpo: { pessoa } });
export const escolherFonteNaApi = (id, numero, pessoa, fonte) => pedir(doItem(id, numero, "fonte"), { method: "POST", corpo: { pessoa, fonte } });
export const revisarItemNaApi = (id, numero, pessoa) => pedir(doItem(id, numero, "revisar"), { method: "POST", corpo: { pessoa } });
/** Troca da área do item (fase N, cenário N10): só quem pode aprová-lo. */
export const trocarAreaNaApi = (id, numero, pessoa, area) => pedir(doItem(id, numero, "area"), { method: "PUT", corpo: { pessoa, area } });
/** "Revisar com IA" (cenário 65): devolve `{ texto }` revisado, sem gravar no item. */
export const revisarTextoComIa = (id, numero, texto) => pedir(doItem(id, numero, "revisar-texto"), { method: "POST", corpo: { texto } });
/** Palavras mínimas para "Revisar com IA", as mesmas do backend. */
export const MINIMO_DE_PALAVRAS_DA_REVISAO = 30;
export const contarPalavras = (texto) => (texto.match(/[\p{L}\p{N}]+(?:[-'’][\p{L}\p{N}]+)*/gu) || []).length;

const DIA = 24 * 60 * 60 * 1000;
const p2 = (n) => String(n).padStart(2, "0");

/** Data e hora do backend (ISO) no formato da tela: dd/mm/aaaa hh:mm, no fuso do navegador. */
export function dataHoraDaTela(iso) {
  const d = new Date(iso);
  return `${p2(d.getDate())}/${p2(d.getMonth() + 1)}/${d.getFullYear()} ${p2(d.getHours())}:${p2(d.getMinutes())}`;
}

/** Hoje no formato AAAA-MM-DD, no fuso do navegador. */
export function hojeIso(hoje = new Date()) {
  return `${hoje.getFullYear()}-${p2(hoje.getMonth() + 1)}-${p2(hoje.getDate())}`;
}

/** Converte o item do backend para o formato da tela (o mesmo de `seedItems` em data.js), com as datas em dd/mm/aaaa hh:mm. */
export function paraItemDaTela(item, total) {
  return {
    ...item,
    tot: total,
    alerts: item.alerts.map((a) => (a.ack ? { ...a, ack: { ...a.ack, at: dataHoraDaTela(a.ack.at) } } : a)),
    // Resposta manual (cenário 61): quem escreveu vem no alerta.
    ...(item.alerts.some((a) => a.t === "manual" && a.by) ? { manualBy: item.alerts.find((a) => a.t === "manual").by } : null),
    // Data da aprovação em ISO, para os indicadores do Dashboard.
    ...(item.at ? { at: dataHoraDaTela(item.at), atIso: item.at } : null),
    ...(item.rat ? { rat: dataHoraDaTela(item.rat), ratIso: item.rat } : null)
  };
}

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
    // Validade do cabeçalho (cenário 80): "Indefinido" sem ela; vencido, o documento fica inativo de vez.
    validity: d.validade ? d.validade.split("-").reverse().join("/") : "Indefinido",
    expired: !!d.vencido,
    off: !d.ativo,
    // Data e hora da carga, para os detalhes do documento (fase O, cenário O3).
    sentAt: d.carregadoEm ? dataHoraDaTela(d.carregadoEm) : null
  };
}
