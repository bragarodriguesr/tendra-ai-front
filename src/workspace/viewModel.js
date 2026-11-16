import { formatarTempoSalvamento } from "./tempoSalvamento.js";
import { AL, ST, code, plural, ITEM_TASKS, TODAY_ISO, OWN } from "./data.js";
import { correspondeABusca, termosDaBusca } from "./buscaDePerguntas.js";
import { numeroDoCartao } from "./filtroPeloProgresso.js";
import { correspondeAExportacao, ordenarParaExportacao } from "./cicloDaTarefa.js";
import { ordenarLinhas } from "./ordenacaoDaTabela.js";
import { AREAS_DO_APROVADOR, ordenarUsuarios } from "./usuarios.js";
import { hojeIso, contarPalavras, MINIMO_DE_PALAVRAS_DA_REVISAO } from "../api.js";
import { cnpjSemMascara, cnpjValido } from "./cnpj.js";
import { AREAS_DOS_ITENS, areaDoItem, areasDaSessao, areasPreferidas, motivoDeAreaRestrita, podeAprovarArea } from "./areas.js";

const DANGER = "#A8402E";

// Camadas de "cartões sobrepostos" atrás do alerta visível (até duas bordas).

const MESES = [["Jan", "janeiro"], ["Fev", "fevereiro"], ["Mar", "março"], ["Abr", "abril"], ["Mai", "maio"], ["Jun", "junho"], ["Jul", "julho"], ["Ago", "agosto"], ["Set", "setembro"], ["Out", "outubro"], ["Nov", "novembro"], ["Dez", "dezembro"]];

/**
 * Tarefas do servidor concluídas, as mesmas do status "Pronta": todos os itens aprovados e nenhum
 * alerta pendente. Início no envio da planilha, fim na última aprovação.
 */
function concluidas(s, ws) {
  return s.tarefas.flatMap((t) => {
    if (t.estado !== "pronta" || !ws.hasItems(t.id, s)) return [];
    const itens = ws.itemsOf(t.id, s);
    if (!itens.length || itens.some((i) => i.st !== "aprovada" || !i.atIso || ws.pendingCount(i) > 0)) return [];
    return [{ inicio: Date.parse(t.criadaEm), fim: Math.max(...itens.map((i) => Date.parse(i.atIso))) }];
  });
}

/** Tarefas finalizadas (fase O, PO10), com o fim na finalização: "RFPs concluídas por mês". */
function finalizadas(s) {
  return s.tarefas.filter((t) => t.situacao === "finalizada" && t.situacaoEm).map((t) => ({ inicio: Date.parse(t.criadaEm), fim: Date.parse(t.situacaoEm) }));
}

/** Os 6 últimos meses, terminando no atual, com quantas RFPs foram concluídas em cada um. */
function ultimosMeses(done, hoje = new Date()) {
  return Array.from({ length: 6 }, (_, n) => {
    const d = new Date(hoje.getFullYear(), hoje.getMonth() - 5 + n, 1);
    const [curto, longo] = MESES[d.getMonth()];
    const total = done.filter((x) => { const f = new Date(x.fim); return f.getFullYear() === d.getFullYear() && f.getMonth() === d.getMonth(); }).length;
    return [curto, `${longo} de ${d.getFullYear()}`, total];
  });
}

/** Duração legível: minutos, horas ou dias (com uma casa decimal). */
function duracao(ms) {
  const min = ms / 60000;
  if (min < 60) return `${Math.max(1, Math.round(min))} min`;
  const h = min / 60;
  if (h < 48) return `${h.toLocaleString("pt-BR", { maximumFractionDigits: 1 })} h`;
  return `${(h / 24).toLocaleString("pt-BR", { maximumFractionDigits: 1 })} dias`;
}

/** Dias até o prazo a partir do texto da tela ("vence hoje", "falta 1 dia", "faltam N dias"); null sem prazo ou vencida. */
function diasAtePrazo(texto) {
  if (texto === "vence hoje") return 0;
  if (texto === "falta 1 dia") return 1;
  const m = /^faltam (\d+) dias$/.exec(texto || "");
  return m ? +m[1] : null;
}

// Avisos do sino (processamento concluído, tarefa 100% aprovada, resultado do envio da base) somem 5 dias depois de criados.
const VALIDADE_DOS_AVISOS = 5 * 24 * 60 * 60 * 1000;

/** Hoje em dd/mm/aaaa, para os alertas sem data própria. */
function dataDeHoje(d = new Date()) {
  const p = (n) => String(n).padStart(2, "0");
  return `${p(d.getDate())}/${p(d.getMonth() + 1)}/${d.getFullYear()}`;
}

export function deckLayers(count) {
  const L = Math.min(count - 1, 2);
  return {
    pad: Math.max(L, 0) * 8,
    layers: Array.from({ length: Math.max(L, 0) }, (_, n) => {
      const k = n + 1;
      return {
        position: "absolute", left: 8 * k, right: 8 * k, top: 0, bottom: 8 * (L - k), zIndex: 4 - k,
        background: "var(--n-000)", border: "1px solid var(--n-200)", borderRadius: 12
      };
    })
  };
}

const DOC_STATUS = {
  pronto: ["Pronto", "approved", "check"],
  processando: ["Processando", "neutral", "loader-circle"],
  fila: ["Na fila", "neutral", "clock"],
  erro: ["Erro", "danger", "triangle-alert"],
  suporte: ["Em tratamento pelo suporte", "neutral", "users"],
  formato: ["Formato não aceito", "danger", "triangle-alert"]
};
const FORMATS = ".doc, .docx, .xls, .xlsx, .md, .pdf, .ppt, .pptx, .txt, .csv";
// Documento com a validade atingida (cenário 80): fora da geração e sem reativação.
const DOC_VENCIDO = ["Vencido", "danger", "calendar"];
const ORDEM_DOS_STATUS = ["pronto", "processando", "fila", "suporte", "erro", "formato"];
const ordemDoStatus = (d) => (d.expired ? 8 : d.off ? 7 : Math.max(0, ORDEM_DOS_STATUS.indexOf(d.st)));

// Tarefas por status no Dashboard. Cores de dataviz do design system (tokens/dataviz.css),
// em ordem fixa: a cor acompanha o status, não a posição. A ordem separa as vizinhas
// (ΔE ≥ 15 para daltonismo). Tinta e Sálvia nunca preenchem série; o Limão é a 6ª série.
const STATUS_GROUPS = [
  { label: "Em revisão", of: ["Em revisão"], color: "var(--dv-teal-solid)", ink: "var(--dv-teal-ink)" },
  { label: "Pronta ou exportada", of: ["Pronta", "Exportada"], color: "var(--dv-series-6)", ink: "var(--n-900)" },
  { label: "Falha", of: ["Falha"], color: "var(--dv-plum-solid)", ink: "var(--dv-plum-ink)" },
  { label: "Na fila", of: ["Na fila"], color: "var(--dv-amber-solid)", ink: "var(--dv-amber-ink)" },
  { label: "Processando", of: ["Processando"], color: "var(--dv-slate-solid)", ink: "var(--dv-slate-ink)" },
  { label: "Vencido", of: ["Vencido"], color: "var(--dv-terra-solid)", ink: "var(--dv-terra-ink)" }
];

// "Todos" fica fixo como botão; as opções do menu, em ordem alfabética (SPEC_FASE_M.md, M13).
// Severidade dos alertas do item (revisão de design de 05/11/2026): vermelho para o que bloqueia por
// conteúdo (termo crítico, conflito, sem contexto), âmbar para aviso (baixa confiança, fonte antiga).
const TOM_DO_ALERTA = { critical: "danger", conflict: "danger", nocontext: "danger", lowconf: "warning", old: "warning", manual: "warning" };
const tomDosAlertas = (alertas) => (alertas.some((a) => !a.ack && TOM_DO_ALERTA[a.t] === "danger") ? "danger" : "warning");
// Severidade dos avisos do sino e do painel de tarefas: erro e prazo vencido em vermelho, o que pede
// atenção em âmbar, boa notícia em limão.
const tomDoAviso = (a) => (/^(Falha|Erro|Prazo vencido)/.test(a.label) ? "danger" : /^(Processamento concluído|Tarefa 100%)/.test(a.label) ? "success" : "warning");

// Ações sobre a tarefa no Histórico (fase O, cenários O18 e O19): rótulo, verbo, tom e ícone.
const ACOES_DA_TAREFA = { importacao: ["Importada", "importada"], finalizacao: ["Finalizada", "finalizada"], arquivamento: ["Arquivada", "arquivada"], reativacao: ["Reativada", "reativada"], exclusao: ["Excluída", "excluída"] };
const TOM_DA_ACAO = { importacao: "neutral", finalizacao: "approved", arquivamento: "neutral", reativacao: "neutral", exclusao: "danger" };
const ICONE_DA_ACAO = { importacao: "upload", finalizacao: "check-check", arquivamento: "archive", reativacao: "rotate-ccw", exclusao: "trash-2" };
const p2 = (n) => String(n).padStart(2, "0");
const dataHoraDaTelaLocal = (iso) => { const d = new Date(iso); return `${p2(d.getDate())}/${p2(d.getMonth() + 1)}/${d.getFullYear()} ${p2(d.getHours())}:${p2(d.getMinutes())}`; };

// "Minha área" (fase N, cenário N9) só aparece para o Aprovador com área que não seja C-Level.
const FILTERS = [["todos", "Todos"], ["alerta", "Alerta pendente"], ["aprovada", "Aprovada"], ["em-revisao", "Em revisão"], ["minha-area", "Minha área"], ["revisada", "Revisada"], ["sem-rascunho", "Sem rascunho"], ["sugerida", "Sugerida"]];

/** Deriva tudo o que as telas mostram a partir do estado. */
export function buildView(s, ws) {
  const isA = s.role === "Aprovador";
  // Com login (fase D, cenário D9), o Aprovador baixa a planilha preenchida de qualquer tarefa; o Revisor,
  // só da tarefa "Pronta" (revisto em 26/10/2026). Sem login, todos.
  const podeExportar = !s.sessao || isA;
  const podeBaixar = (t) => podeExportar || !!(t && t.isReady);
  // Excluir tarefa (cenário 60): com login, só o Aprovador. Arquivar e reativar também (fase O, PO4).
  const podeExcluir = podeExportar;
  const podeArquivar = podeExcluir;
  // Com o servidor, tarefas, exportação, histórico e alertas vêm do banco; sem ele, dos exemplos de data.js.
  const online = s.tarefasOrigem === "servidor";
  const taskIds = ws.taskIds(s);
  const c = ws.counts(null, s);
  const openItem = (id, tid) => () => ws.go("review", { taskId: tid || s.itemsTask, sel: id, filter: "todos" });

  // navegação
  // Contador de "Revisão": itens ainda a trabalhar (sem rascunho, sugeridos e em revisão), fora os já
  // revisados e aprovados (26/10/2026), somando todas as tarefas com itens, como o Dashboard; antes era
  // só a tarefa aberta e mostrava 0 até abrir uma (revisão de design de 05/11/2026).
  // Fase O (PO10): só as tarefas em andamento.
  const emAndamento = (id) => !(ws.taskInfo(id, s) || {}).isClosed;
  const tarefasComItens = (online ? taskIds.filter((id) => ws.hasItems(id, s)) : [...new Set([...ITEM_TASKS, s.itemsTask].filter(Boolean))]).filter(emAndamento);
  const andamentoIds = taskIds.filter(emAndamento);
  const finalizadasIds = taskIds.filter((id) => (ws.taskInfo(id, s) || {}).isFinal);
  const arquivadasIds = taskIds.filter((id) => (ws.taskInfo(id, s) || {}).isArchived);
  const pend = tarefasComItens.reduce((n, id) => n + ws.itemsOf(id, s).filter((i) => i.st !== "revisada" && i.st !== "aprovada").length, 0);
  const go = (sc) => (e) => { e && e.preventDefault && e.preventDefault(); ws.go(sc); };
  // Sem contadores no menu (ajuste de 06/11/2026): os números ficam nas próprias telas.
  const navGroups = [
    { label: "Início", items: [
      // Base vazia: Primeiros passos fica em destaque, com o gradiente limão em movimento do "Revisar com IA".
      { value: "onboarding", label: "Primeiros passos", icon: "play", onClick: go("onboarding"), ...(ws.baseVazia(s) ? { className: "tdr-nav-destaque" } : null) },
      { value: "dashboard", label: "Dashboard", icon: "layout-dashboard", onClick: go("dashboard") }
    ] },
    { label: "Trabalho", items: [
      // Fase O (PO8): Tarefas com Em andamento, Finalizadas e Arquivadas; o item pai abre Em andamento.
      { value: "tarefas", label: "Tarefas", icon: "layout-grid", onClick: go("tasks"), expanded: s.tarefasAbertas !== false, onToggle: (e) => { e.preventDefault(); ws.toggleTasksMenu(); }, items: [
        { value: "tasks", label: "Em andamento", onClick: go("tasks") },
        { value: "finalizadas", label: "Finalizadas", onClick: go("finalizadas") },
        { value: "arquivadas", label: "Arquivadas", onClick: go("arquivadas") }
      ] },
      { value: "review", label: "Revisão", icon: "eye", onClick: go("review") },
      { value: "export", label: "Exportação", icon: "download", onClick: (e) => { e.preventDefault(); ws.go("export", online ? {} : { taskId: "t1" }); } },
      { value: "history", label: "Histórico", icon: "history", onClick: go("history") }
    ] },
    { label: "Base", items: [
      { value: "base", label: "Base de conhecimento", icon: "database", onClick: go("base") }
    ] },
    // Fase Q (Q1): só para o Aprovador, abaixo da Base de conhecimento.
    ...(isA ? [{ label: "Gestão de acessos", items: [
      { value: "usuarios", label: "Usuários", icon: "users", onClick: go("usuarios") }
    ] }] : [])
  ];
  // Nos detalhes da tarefa, o menu marca a lista da situação dela.
  const navValue = s.screen === "task" ? (((t) => (t && t.isFinal ? "finalizadas" : t && t.isArchived ? "arquivadas" : "tasks"))(ws.taskInfo(s.taskId, s))) : s.screen;

  // documentos
  const docsSorted = [...s.docs];
  if (s.sort === "idade") docsSorted.sort((a, b) => b.age - a.age);
  else if (s.sort === "nome") docsSorted.sort((a, b) => a.name.localeCompare(b.name));
  // Por status: ativos primeiro, depois em processamento, com problema, inativos e, por último, vencidos.
  else if (s.sort === "status") docsSorted.sort((a, b) => ordemDoStatus(a) - ordemDoStatus(b) || a.name.localeCompare(b.name));
  else docsSorted.reverse();
  const docs = docsSorted.map((d) => {
    const x = d.expired ? DOC_VENCIDO : d.off ? ["Inativo", "neutral", "minus"] : DOC_STATUS[d.st];
    return {
      ...d, active: !d.off, validity: d.validity || "Indefinido",
      // Vencido não volta a ser ativo pela chave: só uma versão do arquivo com nova validade.
      toggleDisabled: !!d.expired,
      toggleLabel: d.expired ? "Documento vencido: envie uma versão com nova validade" : d.off ? "Ativar documento" : "Desativar documento", toggle: () => ws.toggleDoc(d),
      statusText: x[0], tone: x[1], icon: x[2], ageText: d.age === 0 ? "hoje" : d.age + " dias", old: d.age > 120,
      version: d.ver ? "Versão " + d.ver : "Sem versão", canRetry: d.st === "erro" && !d.off, retry: () => ws.retryDoc(d.id),
      openDetails: () => ws.openDocDetails(d.id),
      // Fase U (cenário U17): etiquetas das áreas; "Classificando…" enquanto a IA não termina.
      areaTags: d.classifying ? [] : d.areas || [], areasText: d.classifying ? "Classificando…" : d.areas && d.areas.length ? d.areas.join(", ") : "—",
      note: d.st === "formato" ? `Formato não aceito. Formatos aceitos: ${FORMATS}.`
        : d.st === "suporte" ? "Este arquivo precisa de tratamento pelo suporte. Avisaremos aqui quando estiver pronto."
        : d.st === "erro" ? "Falha ao processar. Tente novamente."
        : d.st === "processando" ? "Processando…" : "Última atualização " + d.upd
    };
  });
  const readyDocs = s.docs.filter((d) => d.st === "pronto" && !d.off).length;
  // arquivos enviados pela tela Primeiros passos, mais recentes primeiro
  const sent = new Map(s.docs.map((d, i) => [d.id, i]));
  const onbList = docs.filter((d) => d.origin === "onb").sort((a, b) => sent.get(b.id) - sent.get(a.id));
  const onbSent = onbList.filter((d) => d.st !== "formato");
  // Com o servidor, Primeiros passos mostra os mesmos documentos da Base (C4).
  const onb = s.baseOrigem === "servidor"
    ? { online: true, list: docs, sent: docs.length, ready: readyDocs, done: docs.length }
    : {
      list: onbList, sent: onbSent.length,
      ready: onbSent.filter((d) => d.st === "pronto" && !d.off).length,
      done: onbSent.filter((d) => ["pronto", "erro", "suporte"].includes(d.st)).length
    };

  // Passos de Primeiros passos: 1 com algum documento ativo na base; 2 com alguma tarefa criada; 3 com
  // algum item revisado ou aprovado. Cada passo só abre depois do anterior. Sem o servidor, só o passo 1.
  const tarefasDoServidor = s.tarefasOrigem === "servidor" ? s.tarefas : [];
  const passosFeitos = [
    onb.ready > 0,
    onb.online === true && tarefasDoServidor.length > 0,
    onb.online === true && tarefasDoServidor.some((t) => ws.itemsOf(t.id, s).some((i) => i.st === "revisada" || i.st === "aprovada"))
  ];
  const passoAtual = passosFeitos[0] ? passosFeitos[1] ? passosFeitos[2] ? 4 : 3 : 2 : 1;
  onb.steps = passosFeitos.map((feito, i) => ({ n: i + 1, done: feito && i + 1 < passoAtual, open: i + 1 <= passoAtual }));
  onb.current = passoAtual;
  onb.shown = Math.min(s.onbStep && s.onbStep <= passoAtual ? s.onbStep : passoAtual, 3);
  onb.allDone = passoAtual === 4;

  // tarefas
  const tasks = taskIds.map((id) => {
    const t = ws.taskInfo(id, s);
    const status = t.isFinal ? ["Finalizada", "approved", "check-check"]
      : t.isArchived ? ["Arquivada", "neutral", "archive"]
      : t.isServer
      ? (t.isFailed ? ["Falha", "danger", "triangle-alert"]
        : t.isProcessing ? ["Processando", "neutral", "loader-circle"]
        : t.isReady ? ["Pronta", "approved", "check-check"]
        : t.dueText === "Vencida" ? ["Vencido", "danger", "clock"]
        : ["Em revisão", "neutral", "eye"])
      : id === "t1" ? (s.exported ? ["Exportada", "approved", "check-check"] : ["Em revisão", "neutral", "eye"])
      : t.dueText === "Vencida" ? ["Vencido", "danger", "clock"]
      : t.isReady ? ((id === "t4" ? s.exported4 : s.exported8) ? ["Exportada", "approved", "check-check"] : ["Pronta", "approved", "check-check"])
      : t.isInReview ? ["Em revisão", "neutral", "eye"]
      : t.isProcessing ? ["Processando", "neutral", "loader-circle"]
      : t.isFailed ? ["Falha", "danger", "triangle-alert"]
      : ["Na fila", "neutral", "clock"];
    const dm = /faltam? (\d+)/.exec(t.dueText || "");
    const urgent = t.dueText === "Vencida" || t.dueText === "vence hoje" || (dm && +dm[1] < 5);
    const serverProgress = t.isProcessing ? (t.items ? `${t.done} de ${t.items} processadas` : "Lendo a planilha") : t.isFailed ? "Falhou" : "Carregando itens";
    return {
      ...t, dueColor: urgent ? DANGER : t.dueColor, dueWeight: urgent ? 600 : 400, title: t.name.split(" — ")[0],
      pct: t.hasItems || t.isReady ? t.pct : t.isProcessing ? (t.isServer ? (t.items ? Math.round((t.done / t.items) * 100) : 0) : 23) : 0,
      compText: t.hasItems || t.isReady ? t.shortProg : t.isServer ? serverProgress : t.isProcessing ? "42 de 180 processadas" : t.isFailed ? "0 de 0" : "Reprocessando",
      status: status[0], tone: status[1], icon: status[2], open: () => ws.go("task", { taskId: id }),
      // Só tarefas do banco, e não durante o processamento, que ainda grava itens e arquivos.
      // A finalizada não é excluída (fase O, PO5).
      canDelete: !!t.isServer && !t.isProcessing && !t.isFinal && podeExcluir, del: () => ws.askDeleteTask(id),
      // Arquivar (fase O, O10): só em Em andamento, desabilitado durante o processamento, com o motivo.
      canArchive: !!t.isServer && !t.isClosed && podeArquivar, archiveDisabled: !!t.isProcessing, archive: () => ws.askArchiveTask(id),
      archiveLabel: t.isProcessing ? "A tarefa está em processamento: arquive depois que ela terminar" : "Arquivar tarefa",
      closedText: t.isClosed ? `${t.isFinal ? "Finalizada" : "Arquivada"} por ${t.closedBy} · ${t.closedAt}` : null
    };
  });
  // Listas de Tarefas por situação (fase O, O8), na ordem de envio (mais recente primeiro).
  const tasksAndamento = tasks.filter((t) => !t.isClosed);
  const TASK_LISTS = {
    tasks: { kind: "andamento", items: tasksAndamento, title: (n) => `${n} RFPs e RFIs em andamento`, eyebrow: "Tarefas · em andamento",
      empty: ["Nenhuma tarefa em andamento.", "Crie uma Nova RFP ou reative uma arquivada."] },
    finalizadas: { kind: "finalizadas", items: tasks.filter((t) => t.isFinal), title: (n) => `${n} RFPs e RFIs finalizadas`, eyebrow: "Tarefas · finalizadas",
      empty: ["Nenhuma tarefa finalizada.", "A tarefa 100% aprovada é finalizada na Exportação, depois de baixar a planilha."] },
    arquivadas: { kind: "arquivadas", items: tasks.filter((t) => t.isArchived), title: (n) => `${n} RFPs e RFIs arquivadas`, eyebrow: "Tarefas · arquivadas",
      empty: ["Nenhuma tarefa arquivada.", "Arquive em Em andamento as RFPs que a empresa não vai concluir."] }
  };
  const taskList = ((l) => ({ ...l, title: l.title(l.items.length) }))(TASK_LISTS[s.screen] || TASK_LISTS.tasks);

  // dashboard
  const dateKey = (x) => { const [d, m, y] = x.split("/"); return +(y + m + d); };
  const comItens = online ? taskIds.filter((id) => ws.hasItems(id, s)) : ITEM_TASKS;
  // Itens aprovados somam todas as tarefas (histórico); itens em aberto, só as em andamento (PO10).
  const itcTodas = comItens.map((id) => ws.counts(id, s));
  const itc = comItens.filter(emAndamento).map((id) => ws.counts(id, s));
  // Sem o servidor, os números somam o histórico fictício do protótipo.
  const sample = online ? { open: 0, done: 0, approved: 0 } : { open: 138, done: 18, approved: 1284 };
  const openItems = itc.reduce((a, q) => a + q.total - q.approved, 0) + sample.open;
  const statusGroups = STATUS_GROUPS
    .map((g) => ({ ...g, n: tasksAndamento.filter((t) => g.of.includes(t.status)).length }))
    .filter((g) => g.n > 0)
    .map((g) => ({ ...g, pct: Math.round((g.n / tasksAndamento.length) * 100), width: (g.n / tasksAndamento.length) * 100 + "%" }));
  // Com o servidor: RFP concluída é a tarefa pronta com todos os itens aprovados; ela termina na
  // última aprovação. Tempo médio e concluídas por mês saem dessas datas (sem exemplos fictícios).
  const done = online ? concluidas(s, ws) : [];
  const manuaisAprovadas = online
    ? taskIds.filter((id) => ws.hasItems(id, s)).reduce((a, id) => a + ws.itemsOf(id, s).filter((i) => i.st === "aprovada" && i.alerts.some((x) => x.t === "manual")).length, 0)
    : 0;
  const months = online ? ultimosMeses(finalizadas(s)) : [["Abr", "abril", 2], ["Mai", "maio", 3], ["Jun", "junho", 3], ["Jul", "julho", 4], ["Ago", "agosto", 3], ["Set", "setembro", 3]];
  const monthMax = Math.max(1, ...months.map((m) => m[2]));
  const dash = {
    eyebrow: online ? "Dashboard · todas as tarefas" : "Dashboard · últimos 90 dias",
    worked: String(tasks.length + sample.done),
    workedSub: online
      ? ((a, f, q) => `${a} em andamento · ${f} ${f === 1 ? "finalizada" : "finalizadas"} · ${q} ${q === 1 ? "arquivada" : "arquivadas"}`)(tasksAndamento.length, finalizadasIds.length, arquivadasIds.length)
      : tasks.length + " em andamento · " + sample.done + " concluídas",
    open: String(openItems), openSub: ((n) => `Em ${n} ${n === 1 ? "tarefa ativa" : "tarefas ativas"}, entre revisão e processamento.`)(tasksAndamento.filter((t) => !t.isReady).length),
    avg: online ? (done.length ? duracao(done.reduce((a, d) => a + d.fim - d.inicio, 0) / done.length) : "—") : "2,4 dias",
    avgSub: online
      ? (done.length ? `Do envio da planilha à aprovação do último item, em ${done.length} ${done.length === 1 ? "RFP concluída" : "RFPs concluídas"}.` : "Nenhuma RFP concluída ainda: conta do envio da planilha à aprovação do último item.")
      : "Da importação à exportação do documento.",
    approved: (sample.approved + itcTodas.reduce((a, q) => a + q.approved, 0)).toLocaleString("pt-BR"),
    approvedSub: online && manuaisAprovadas
      ? `${manuaisAprovadas} ${manuaisAprovadas === 1 ? "resposta manual" : "respostas manuais"}, sem fonte na base; as demais com fonte rastreável até o documento de origem.`
      : "Todas com fonte rastreável até o documento de origem.",
    status: statusGroups, total: tasksAndamento.length,
    months: months.map(([m, full, n]) => ({ m, full, n, pct: (n / monthMax) * 100 })),
    deadlines: tasksAndamento.filter((t) => { const m = /faltam? (\d+)/.exec(t.dueText || ""); return t.dueText === "vence hoje" || (m && +m[1] < 15); }).sort((a, b) => dateKey(a.due) - dateKey(b.due))
  };

  // detalhe da tarefa
  const task0 = ws.taskInfo(s.taskId, s) || ws.taskInfo(taskIds[0], s) || ws.taskInfo("t1", s);
  const tkr = tasks.find((x) => x.id === task0.id) || {};
  const task = {
    ...task0, sTxt: tkr.status, sTone: tkr.tone, sIcon: tkr.icon, hasItems: !!task0.hasItems, isReady: !!task0.isReady, podeBaixar: podeBaixar(task0),
    // Fase O: reativar a arquivada (O12), só o Aprovador; faixa de só leitura da encerrada (O11).
    // Pronta (100% aprovada, sem alerta) ou finalizada: sem o cartão de exportação e com a barra só em 100%.
    completa: !!task0.hasItems && (!!task0.isReady || !!task0.isFinal),
    canReactivate: !!task0.isArchived && podeArquivar, reactivate: () => ws.reactivateTask(task0.id), reactivateLabel: `Reativar ${ws.kindOf(task0.id)}`,
    closedNote: task0.isClosed ? `${ws.kindOf(task0.id)} ${task0.isFinal ? "finalizada" : "arquivada"} por ${task0.closedBy} em ${task0.closedAt}: só leitura.` : null
  };
  // Revisão de tarefa encerrada (PO11): tudo visível, nenhuma ação que mude o item.
  const revInfo = ws.taskInfo(s.itemsTask, s) || {};
  const readOnly = !!revInfo.isClosed;
  const readOnlyNote = readOnly ? `${ws.kindOf(s.itemsTask)} ${revInfo.isFinal ? "finalizada" : "arquivada"} por ${revInfo.closedBy} em ${revInfo.closedAt}: só leitura.` : null;
  // Estados dos itens, em ordem alfabética, a mesma do filtro (SPEC_FASE_M.md, M13). Cores de dataviz
  // (tokens/dataviz.css): Em revisão em Petróleo como no Dashboard, Aprovada em Limão; as demais
  // escolhidas para separar as vizinhas.
  // `value` é o filtro por estado que o segmento e a legenda aplicam (SPEC_FASE_M.md, M1 e M2).
  const segs = [
    { n: c.approved, label: "aprovada", value: "aprovada", color: "var(--dv-series-6)" },
    { n: c.emr, label: "em revisão", value: "em-revisao", color: "var(--dv-teal-solid)" },
    { n: c.rev, label: "revisada", value: "revisada", color: "var(--dv-terra-solid)" },
    { n: c.none, label: "sem rascunho", value: "sem-rascunho", color: "var(--dv-plum-solid)" },
    { n: c.sug, label: "sugerida", value: "sugerida", color: "var(--dv-amber-solid)" }
  ].map((g) => ({ ...g, width: (c.total ? (g.n / c.total) * 100 : 0) + "%" }));
  // Número do cartão: os aprovados por padrão, ou o estado filtrado, sobre todos os itens (M7).
  const destaqueDoCartao = numeroDoCartao(s.filter, Object.fromEntries(segs.map((g) => [g.value, g.n])));

  // filtros e lista
  const preferidas = areasPreferidas(s);
  const cnt = (k) => (k === "todos" ? s.items.length : k === "alerta" ? c.alerts
    : k === "minha-area" ? s.items.filter((i) => preferidas.includes(areaDoItem(i))).length
      : s.items.filter((i) => i.st === k).length);
  const filterTabs = FILTERS.filter(([value]) => value !== "minha-area" || preferidas).map(([value, label]) => ({ value, label, count: cnt(value) }));
  const vis = ws.visible(s);
  const rows = vis.map((i) => {
    const st = ST[i.st], p = ws.pendingCount(i);
    return {
      id: i.id, code: code(i), q: i.q.length > 68 ? i.q.slice(0, 66) + "…" : i.q, st: st.l, icon: st.i, tone: st.tone, area: areaDoItem(i),
      hasAlert: p > 0, alertText: p + " " + plural(p, "alerta", "alertas"), alertTone: tomDosAlertas(i.alerts), active: i.id === s.sel,
      // Dados da ordenação dos detalhes (SPEC_FASE_P.md, P5): o número é o mesmo do código; a pergunta, o texto completo.
      ordem: { numero: parseInt(i.id.slice(1)), pergunta: i.q, area: areaDoItem(i), estado: i.st },
      // A linha vem da tabela já filtrada: abre a Revisão com o mesmo filtro (SPEC_FASE_M.md, M6).
      open: () => ws.select(i.id), openFromTask: () => ws.go("review", { taskId: s.itemsTask, sel: i.id })
    };
  });
  // Linhas com a busca (SPEC_FASE_L.md), na Revisão e nos detalhes da tarefa: só as linhas
  // mudam; o item aberto, a navegação e os números do filtro seguem o filtro por estado (cenários B9 e B14).
  const termos = termosDaBusca(s.busca);
  const rowsDaBusca = termos.length === 0 ? rows : rows.filter((r, n) => correspondeABusca({ pergunta: vis[n].q, codigo: r.code }, termos));
  // Só a tabela dos detalhes usa a ordenação escolhida no cabeçalho; a Revisão segue `rows` (SPEC_FASE_P.md, P7).
  const linhasDosDetalhes = ordenarLinhas(rowsDaBusca, s.ordenacaoDetalhes);

  // item atual na revisão
  const it = vis.find((i) => i.id === s.sel) || null;
  let cur = null;
  if (it) {
    const st = ST[it.st], p = ws.pendingCount(it);
    const maxAge = it.srcs.filter((x) => x.age > 120).reduce((m, x) => Math.max(m, x.age), 0);
    const hasConflict = it.alerts.some((a) => a.t === "conflict" && !a.ack);
    // "Sem contexto" e resposta manual não entram no cartão de alertas: o item sem fonte mostra o cartão
    // "Sem contexto" no lugar das fontes, antes e depois de a pessoa escrever a resposta.
    const semContexto = it.alerts.find((a) => a.t === "nocontext");
    const manual = it.alerts.find((a) => a.t === "manual");
    const noSource = semContexto ? { label: AL.nocontext.l, icon: AL.nocontext.i, pending: !semContexto.ack, text: AL.nocontext.x }
      : manual && !it.srcs.length ? { label: AL.nocontext.l, icon: AL.nocontext.i, pending: false, text: "Informação não localizada na base. A resposta foi escrita manualmente." }
      : null;
    const alerts = it.alerts.flatMap((a, idx) => {
      if (a.t === "nocontext" || a.t === "manual") return [];
      const d = AL[a.t], pending = !a.ack;
      return [{
        label: d.l, icon: a.ack ? "check" : d.i, pending, isAck: !!a.ack, tone: TOM_DO_ALERTA[a.t] || "danger",
        text: a.t === "old" ? `Fonte sem atualização há ${maxAge} dias, acima do prazo de 120 dias.` : d.x,
        ackText: a.ack ? `Reconhecido por ${a.ack.by}, ${a.ack.at}` : "",
        showAck: pending && a.t !== "conflict" && !readOnly, showNone: pending && a.t === "conflict" && !readOnly,
        ack: () => ws.ack(it.id, idx), none: () => { ws.ack(it.id, idx); ws.setState({ edit: true }); }
      }];
    });
    // Sem escolha da pessoa, o cartão mostra o primeiro alerta pendente; com todos tratados, fica recolhido (histórico).
    const firstPending = alerts.findIndex((a) => a.pending);
    const ai = s.alertAt.id === it.id ? Math.min(s.alertAt.i, Math.max(alerts.length - 1, 0)) : Math.max(firstPending, 0);
    const allResolved = alerts.length > 0 && firstPending === -1;
    const hasAnswer = it.paras.length > 0 && it.paras.some((x) => x.t.trim());
    let blockText = "", noRevise = false, noApprove = false;
    const alertWord = p > 1 ? `${p} alertas` : "1 alerta";
    if (it.st === "aprovada") { noApprove = true; noRevise = true; }
    // A mensagem fala só do que o papel pode fazer: o Revisor não aprova (revisão de design de 05/11/2026).
    else if (!hasAnswer) { blockText = isA ? "Escreva a resposta antes de revisar ou aprovar." : "Escreva a resposta antes de marcar como revisado."; noRevise = true; noApprove = true; }
    else if (p > 0) { blockText = isA ? `Falta tratar ${alertWord} antes de revisar ou aprovar.` : `Falta tratar ${alertWord} antes de marcar como revisado.`; noRevise = true; noApprove = true; }
    // O Revisor não aprova: o botão nem aparece para ele (26/10/2026).
    if (!isA) noApprove = true;
    // Fase N (cenário N6): pergunta de outra área, com o motivo.
    const daMinhaArea = podeAprovarArea(s, it);
    // O motivo da área vem na frente: tratar os alertas não basta para quem não aprova esta área.
    if (isA && !daMinhaArea) { noApprove = true; if (it.st !== "aprovada") blockText = motivoDeAreaRestrita(it); }
    if (it.st === "revisada") noRevise = true;
    if (readOnly) { noRevise = true; noApprove = true; blockText = ""; }
    const openSrc = (k) => () => ws.setState({ drawer: { id: it.id, k } });
    const decided = it.srcs.some((x) => x.conflict && x.chosen);
    const srcs = it.srcs.map((x, n) => {
      const k = n + 1;
      return {
        ...x, k, ageText: x.age + " dias", old: x.age > 120, conflict: !!x.conflict && hasConflict, chosen: !!x.chosen, canUse: !!x.conflict && hasConflict && !readOnly, use: () => ws.useSource(it.id, k), open: openSrc(k),
        // Depois da escolha, a fonte em conflito que não foi escolhida fica só como histórico.
        discarded: !!x.conflict && decided && !x.chosen
      };
    });
    // Fontes em conflito em cartões sobrepostos, a escolhida sempre na frente; as demais fontes seguem na grade.
    const conflictSrcs = srcs.filter((x) => it.srcs[x.k - 1].conflict).sort((a, b) => Number(b.chosen) - Number(a.chosen));
    const si = s.srcAt.id === it.id ? Math.min(s.srcAt.i, Math.max(conflictSrcs.length - 1, 0)) : 0;
    const srcDeck = conflictSrcs.length > 1
      ? { ...deckLayers(conflictSrcs.length), cur: conflictSrcs[si], index: si, count: conflictSrcs.length, pos: `${si + 1} de ${conflictSrcs.length}`, pending: hasConflict }
      : null;
    const paras = it.paras.map((pp) => ({ t: pp.t, marks: pp.s.filter((k) => it.srcs[k - 1]).map((k) => ({ k, aria: "Abrir fonte " + k, open: openSrc(k) })) }));
    const text = it.paras.map((x) => x.t).join("\n\n");
    const fb = s.fb[(s.itemsTask || "") + "/" + it.id] || {};
    cur = {
      ...it, ...deckLayers(alerts.length), alerts, alert: alerts[ai] || {}, alertIndex: ai, alertPos: `${ai + 1} de ${alerts.length}`, hasMany: alerts.length > 1,
      allResolved, alertsOpen: !allResolved || s.alertsOpen === it.id,
      srcDeck, otherSrcs: srcDeck ? srcs.filter((x) => !it.srcs[x.k - 1].conflict) : srcs, noSource,
      // "Esta resposta ajudou?" avalia a sugestão da IA: item sem rascunho não tem o que avaliar.
      canRate: it.orig !== "" && !readOnly,
      // "Revisar com IA" no editor da resposta manual (cenário 65): habilita a partir de 30 palavras.
      aiReview: it.orig === "" ? ((n) => ({
        words: n, min: MINIMO_DE_PALAVRAS_DA_REVISAO, ready: n >= MINIMO_DE_PALAVRAS_DA_REVISAO && !s.revisandoIa, loading: s.revisandoIa,
        canUndo: !!s.antesDaIa && s.antesDaIa.id === it.id
      }))(contarPalavras(text)) : null,
      code: code(it), st: st.l, icon: st.i, tone: st.tone, srcs, paras, noText: !hasAnswer,
      edited: it.orig !== "" && text !== it.orig, text,
      hasManual: it.alerts.some((a) => a.t === "manual"), manualBy: it.manualBy || (it.alerts.find((a) => a.t === "manual") || {}).by, isApproved: it.st === "aprovada",
      blockText, noRevise, noApprove, fbUp: fb.value === "up", fbDown: fb.value === "down", fbReason: fb.reason || "",
      // Item sem rascunho também tem editor: a resposta escrita fica marcada como manual (cenário 61).
      canEdit: !readOnly, readOnly, canRestore: !readOnly,
      isApprovedOrRevised: it.st === "revisada" || it.st === "aprovada", canApprove: isA && !readOnly,
      // Área da pergunta (fase N): todos veem; só quem pode aprovar troca, enquanto não aprovado (N10).
      area: areaDoItem(it), areaOptions: AREAS_DOS_ITENS,
      canChangeArea: isA && daMinhaArea && it.st !== "aprovada" && !readOnly,
      // Fase S (S3 e S4): lista de áreas aberta neste item e troca em andamento.
      areaAberta: isA && daMinhaArea && it.st !== "aprovada" && !readOnly && s.areaAberta === (s.itemsTask || "") + "/" + it.id,
      trocandoArea: !!s.trocandoArea,
      stateHint: it.st === "aprovada" ? "Editar remove a aprovação." : "Pronta para aprovação."
    };
  }
  // Indicador do item aberto: cada resposta tem o seu horário de salvamento.
  const savedText = formatarTempoSalvamento(it ? (s.savedAt || {})[(s.itemsTask || "") + "/" + it.id] : 0);

  // visualizador de fonte
  let drawer = null;
  if (s.drawer) {
    const di = s.items.find((i) => i.id === s.drawer.id), x = di && di.srcs[s.drawer.k - 1];
    if (x) drawer = { k: s.drawer.k, doc: x.doc, loc: x.loc, type: x.type.toUpperCase(), ageText: x.age + " dias", ex: x.ex, missing: !!x.missing };
  }

  // exportação
  const t1Items = ws.itemsOf("t1", s);
  const t1Pending = t1Items.filter((i) => i.st !== "aprovada" || ws.pendingCount(i) > 0);
  const mkCard = (id, company, title, total, approved, exp, onExp) => {
    const blocked = approved < total;
    return {
      id, company, title, count: approved + " de " + total + " itens aprovados", pct: Math.round((approved / total) * 100), blocked,
      badge: blocked ? "Bloqueada" : exp ? "Exportada" : "Pronta", tone: blocked ? "neutral" : "approved", icon: blocked ? "lock" : exp ? "check-check" : "circle-check",
      // Revisor e Aprovador exportam a tarefa pronta (26/10/2026).
      // "Baixar" em todos os casos (ajuste de 06/11/2026).
      disabled: blocked, btn: "Baixar", openTask: () => ws.go("task", { taskId: id }),
      reason: blocked ? total - approved + " de " + total + " itens ainda não foram aprovados. Exportação bloqueada até 100% aprovado."
        : "Todos os itens estão aprovados e sem alerta pendente.",
      exported: exp, doExport: onExp, goReview: openItem(t1Pending[0] ? t1Pending[0].id : "r1", "t1")
    };
  };
  // Com o servidor: uma linha por tarefa com itens; a planilha é gerada no download (cenário 24).
  // Fase O (O4): prontas primeiro, depois as demais em andamento, e por último as finalizadas e as
  // arquivadas; dentro de cada bloco, a ordem de envio (mais recente primeiro).
  const serverCards = ordenarParaExportacao(tasks.filter((t) => t.isServer && t.hasItems)).map((t) => {
    const items = ws.itemsOf(t.id, s), pending = items.find((i) => i.st !== "aprovada") || items[0];
    const pode = podeBaixar(t) || (t.isClosed && podeExportar);
    return {
      id: t.id, company: t.company, title: t.title, count: t.shortProg, pct: t.pct, blocked: false, filled: true,
      badge: t.status, tone: t.tone, icon: t.icon, isReady: !!t.isReady, isClosed: !!t.isClosed,
      // "Baixar" em todos os casos, com "Ver tarefa" ao lado (ajuste de 06/11/2026).
      disabled: !pode, btn: "Baixar", doExport: () => ws.askDownload(t.id), openTask: () => ws.go("task", { taskId: t.id }),
      reason: t.isClosed
        ? (pode ? `${t.isFinal ? "Finalizada" : "Arquivada"}: a planilha traz o estado da revisão no ${t.isFinal ? "fim" : "arquivamento"}, só para leitura.` : "O Revisor baixa a planilha quando a tarefa estiver pronta: todos os itens aprovados e nenhum alerta pendente.")
        : pode
        ? "Traz o estado atual da revisão: o texto de cada item (sugestão, edição ou resposta manual), as fontes citadas e a situação (aprovada, revisada, em revisão)."
        : "O Revisor baixa a planilha quando a tarefa estiver pronta: todos os itens aprovados e nenhum alerta pendente.",
      closed: t.isClosed ? { label: t.closedText, tone: t.isFinal ? "approved" : "neutral", icon: t.isFinal ? "check-check" : "archive" } : null,
      goReview: () => ws.go("review", { taskId: t.id, sel: pending ? pending.id : undefined, filter: "todos" })
    };
  });
  const allExportCards = online ? serverCards : [
    mkCard("t1", "Banco Meridian", "Questionário de segurança", t1Items.length, t1Items.length - t1Pending.length, s.exported, () => ws.exportTask("exported")),
    mkCard("t8", "Atlas Saúde", "Questionário de segurança", 32, 32, s.exported8, () => ws.exportTask("exported8")),
    mkCard("t4", "Helios Logística", "Questionário LGPD", 24, 24, s.exported4, () => ws.exportTask("exported4"))
  ];
  // Filtro por status e busca por empresa ou título (O5), com as regras da busca da fase L.
  const EXPORT_STATUS = ["Pronta", "Em revisão", "Vencido", "Finalizada", "Arquivada"];
  const exportFilterTabs = [["todos", "Todos"], ...EXPORT_STATUS.map((x) => [x, x])].map(([value, label]) => ({
    value, label, count: value === "todos" ? allExportCards.length : allExportCards.filter((x) => x.badge === value).length
  }));
  const termosDaExportacao = termosDaBusca(s.exportBusca || "");
  const exportCards = allExportCards.filter((x) => (s.exportFilter === "todos" || x.badge === s.exportFilter)
    && correspondeAExportacao(x, termosDaExportacao));
  const exportarEmAndamento = allExportCards.filter((x) => !x.isClosed);
  const exportTitle = online
    // "Pronta" só quando 100% aprovada; as demais também baixam, com o estado atual. Só as em andamento (O4).
    ? ((n, prontas) => `${n} ${plural(n, "tarefa", "tarefas")} para baixar · ${prontas} ${plural(prontas, "pronta", "prontas")}`)(exportarEmAndamento.length, exportarEmAndamento.filter((x) => x.badge === "Pronta").length)
    : `${allExportCards.filter((x) => !x.blocked).length} de ${allExportCards.length} tarefas prontas para exportar`;
  const exportSemResultado = allExportCards.length > 0 && exportCards.length === 0;

  // histórico
  const MERIDIAN = "Questionário de segurança — Banco Meridian";
  const liveSrcs = (i) => i.srcs.map((x, n) => ({ label: `${x.doc} · ${x.loc}`, open: () => ws.setState({ drawer: { id: i.id, k: n + 1 } }) }));
  // A seta de cada registro abre o que ele descreve: a pergunta na Revisão ou a tarefa (ajuste de 05/11/2026).
  const abrirItem = (taskId, sel) => () => ws.go("review", { taskId, sel, filter: "todos" });
  const live = t1Items.filter((i) => i.st === "aprovada").map((i) => ({ key: i.id, kind: "aprovacao", q: i.q, task: MERIDIAN, full: i.paras.map((p) => p.t).join(" "), by: i.by, at: i.at, age: 0, srcs: liveSrcs(i), go: abrirItem("t1", i.id) }));
  const liveRev = t1Items.filter((i) => i.st === "revisada").map((i) => ({ key: i.id + "-rev", kind: "revisao", q: i.q, task: MERIDIAN, full: i.paras.map((p) => p.t).join(" "), by: i.rby, at: i.rat, age: 0, srcs: liveSrcs(i), go: abrirItem("t1", i.id) }));
  const past = [
    { key: "h1", kind: "aprovacao", q: "Onde ficam armazenados os backups?", task: "RFP Aurora Seguros — 2025", full: "Backups ficam em região distinta da produção, criptografados com AES-256 e retidos por 35 dias.", by: "Marcelo Vieira", at: "14/03/2026 10:12", age: 199, srcs: [{ label: "Politica_Backup_DR.pdf · p. 7" }] },
    { key: "h2", kind: "aprovacao", q: "A plataforma possui certificação ISO 27001?", task: "RFI Helix Saúde — 2026", full: "Sim. A certificação ISO/IEC 27001 está vigente, com escopo que cobre desenvolvimento e operação da plataforma.", by: "Marcelo Vieira", at: "02/07/2026 16:48", age: 89, srcs: [{ label: "Certificado_ISO27001.pdf · p. 1" }] },
    { key: "h3", kind: "aprovacao", q: "Como é feita a segregação de dados entre clientes?", task: "RFP Aurora Seguros — 2025", full: "Cada cliente tem isolamento lógico por tenant, com chaves de criptografia distintas por tenant.", imported: true, age: 420, srcs: [{ label: "RFP_Aurora_2025.xlsx · linha 33" }] },
    { key: "h4", kind: "revisao", q: "Quais são os controles de acesso privilegiado?", task: "RFI Helix Saúde — 2026", full: "Acesso privilegiado exige MFA, aprovação just-in-time e sessão gravada, com revisão trimestral dos acessos.", by: "Kadu Mendes", at: "01/07/2026 09:30", age: 90, srcs: [{ label: "Politica_Acesso.docx · § 4" }] },
    { key: "h5", kind: "revisao", q: "Como é feito o descarte seguro de dados?", task: "RFP Aurora Seguros — 2025", full: "Mídias são sanitizadas conforme NIST 800-88 e o descarte é registrado em certificado de destruição.", by: "Paula Rocha", at: "12/03/2026 15:05", age: 201, srcs: [{ label: "Politica_Retencao.pdf · p. 3" }] }
  ];
  // Com o servidor: aprovações e revisões dos itens das tarefas já lidas.
  const serverHist = tasks.filter((t) => t.isServer && t.hasItems).flatMap((t) => ws.itemsOf(t.id, s).flatMap((i) => {
    const base = { q: i.q, task: t.name, full: i.paras.map((p) => p.t).join(" "), age: 0, srcs: i.srcs.map((x) => ({ label: `${x.doc} · ${x.loc}` })), go: abrirItem(t.id, i.id) };
    return [
      ...(i.st === "aprovada" ? [{ ...base, key: t.id + i.id, kind: "aprovacao", by: i.by, at: i.at, ms: Date.parse(i.atIso) || 0 }] : []),
      ...(i.st === "revisada" ? [{ ...base, key: t.id + i.id + "-rev", kind: "revisao", by: i.rby, at: i.rat, ms: Date.parse(i.ratIso) || 0 }] : [])
    ];
  }));
  // Ações sobre as tarefas (fase O, cenários O18 e O19): importar, finalizar, arquivar, reativar e excluir.
  const taskHist = (s.taskEvents || []).map((e, n) => {
    const [label, verbo] = ACOES_DA_TAREFA[e.acao] || ["Tarefa", "alterada"];
    const quem = e.pessoa === "Sem identificação" ? "sem identificação de quem fez" : `por ${e.pessoa}`;
    return {
      key: `tarefa-${e.tarefaId}-${e.acao}-${e.em}-${n}`, kind: "tarefa", action: e.acao, kindLabel: label,
      q: e.tarefa, task: e.empresa || "Empresa não informada", full: `${e.tarefa} ${verbo} ${quem}.`,
      by: e.pessoa, at: dataHoraDaTelaLocal(e.em), ms: Date.parse(e.em), age: Math.max(0, Math.floor((Date.now() - Date.parse(e.em)) / 86400000)), srcs: [],
      // A tarefa excluída não tem para onde levar: a seta fica desabilitada, com o motivo.
      go: s.tarefas.some((t) => t.id === e.tarefaId) ? () => ws.go("task", { taskId: e.tarefaId }) : null,
      goOff: "A tarefa foi excluída."
    };
  });
  // Mais recentes primeiro, misturando itens e tarefas.
  const allHist = online ? [...serverHist, ...taskHist].sort((a, b) => b.ms - a.ms) : [...live, ...liveRev, ...past];
  const kindOf = (k) => (k === "aprovacoes" ? "aprovacao" : k === "tarefas" ? "tarefa" : "revisao");
  const histCount = (k) => (k === "todos" ? allHist.length : allHist.filter((x) => x.kind === kindOf(k)).length);
  const historyTabs = [["todos", "Todos"], ["aprovacoes", "Aprovações"], ["revisoes", "Revisões"], ...(online ? [["tarefas", "Tarefas"]] : [])].map(([value, label]) => ({ value, label, count: histCount(value) }));
  const history = (s.hfilter === "todos" ? allHist : allHist.filter((x) => x.kind === kindOf(s.hfilter))).map((h) => ({
    ...h,
    kindLabel: h.kind === "tarefa" ? h.kindLabel : h.kind === "revisao" ? "Revisada" : "Aprovada",
    kindTone: h.kind === "tarefa" ? (TOM_DA_ACAO[h.action] || "neutral") : h.kind === "revisao" ? "neutral" : "approved",
    kindIcon: h.kind === "tarefa" ? (ICONE_DA_ACAO[h.action] || "layout-grid") : h.kind === "revisao" ? "check" : "shield-check",
    imported: !!h.imported,
    goLabel: h.kind === "tarefa" ? `Abrir a tarefa ${h.q}` : `Abrir a pergunta ${h.q}`, goTip: h.kind === "tarefa" ? "Abrir tarefa" : "Abrir pergunta",
    go: h.go || null, goOff: h.go ? null : h.goOff || "Registro importado: a tarefa de origem não está na Tendra.ai."
  }));

  // Alertas do sino: tarefas e base de conhecimento (nunca os alertas de itens da Revisão).
  const left = (id) => { const q = ws.counts(id, s); return q.total - q.approved; };
  const taskAlerts = [];
  if (online) {
    const hoje = dataDeHoje();
    const abrir = (t) => () => ws.go("task", { taskId: t.id });
    // Fase O (O15): nenhum alerta de tarefa encerrada.
    for (const t of tasksAndamento) {
      const dias = diasAtePrazo(t.dueText);
      const quem = t.company !== "Empresa não informada" ? t.company : t.title;
      if (t.isFailed) taskAlerts.push({ key: "falha-" + t.id, kind: "tarefa", at: t.when, icon: "triangle-alert", label: "Falha no processamento", name: quem, text: "não pôde ser processada: " + (t.reason || "sem motivo registrado").replace(/\.$/, "") + ".", action: "Conferir tarefa", go: abrir(t) });
      else if (t.isReady) taskAlerts.push({ key: "aprovada-" + t.id, kind: "tarefa", at: t.when, criadoEm: Math.max(...ws.itemsOf(t.id, s).map((i) => Date.parse(i.atIso) || 0)), icon: "check-check", label: "Tarefa 100% aprovada", name: quem, text: `tem os ${t.items} itens aprovados: a planilha preenchida está pronta para baixar.`, action: "Abrir tarefa", go: abrir(t) });
      else if (t.dueText === "Vencida") taskAlerts.push({ key: "vencida-" + t.id, kind: "tarefa", at: t.due, icon: "clock", label: "Prazo vencido", name: quem, text: t.hasItems ? `está vencida, com ${left(t.id)} itens sem aprovação.` : "está vencida.", action: "Abrir tarefa", go: abrir(t) });
      else if (dias !== null && dias <= 5) taskAlerts.push({ key: "prazo-" + t.id + (dias === 0 ? "-hoje" : ""), kind: "tarefa", at: t.due, icon: "clock", label: "Prazo próximo", name: quem, text: (dias === 0 ? "vence hoje" : dias === 1 ? "vence amanhã" : `vence em ${dias} dias`) + (t.hasItems ? `, com ${left(t.id)} itens sem aprovação.` : "."), action: "Abrir tarefa", go: abrir(t) });
      if (!t.isFailed && !t.isReady && !t.isProcessing && t.hasItems) taskAlerts.push({ key: "pronta-" + t.id, kind: "tarefa", at: t.when, criadoEm: t.whenMs, icon: "sparkles", label: "Processamento concluído", name: quem, text: `foi processada: ${t.items} itens para revisar.`, action: "Revisar itens", go: () => ws.go("review", { taskId: t.id }) });
    }
    const envio = s.ultimoEnvio;
    if (envio && envio.erro) taskAlerts.push({ key: "envio-erro-" + envio.em, kind: "base", at: envio.em, criadoEm: envio.emMs, icon: "triangle-alert", label: "Erro no envio da base", name: "Base de conhecimento", text: "o envio não foi concluído: " + envio.erro.replace(/\.$/, "") + ".", action: "Abrir a base", go: () => ws.go("base") });
    else if (envio && envio.resumo) {
      const recusas = envio.resumo.recusados.length + envio.resumo.ignorados.length;
      if (recusas) taskAlerts.push({ key: "envio-recusas-" + envio.em, kind: "base", at: envio.em, criadoEm: envio.emMs, icon: "triangle-alert", label: "Arquivos recusados na base", name: "Base de conhecimento", text: `${recusas} ${recusas === 1 ? "arquivo foi recusado" : "arquivos foram recusados"} no último envio: ` + [...envio.resumo.recusados, ...envio.resumo.ignorados].map((x) => x.nome).join(", ") + ".", action: "Abrir a base", go: () => ws.go("base") });
    }
    const antigos = s.docs.filter((d) => !d.off && d.age > 120).length;
    if (s.baseOrigem === "servidor" && antigos) taskAlerts.push({ key: "base-antigos-" + antigos, kind: "base", at: hoje, icon: "clock", label: "Base desatualizada", name: "Base de conhecimento", text: `${antigos} ${antigos === 1 ? "documento ativo está" : "documentos ativos estão"} há mais de 120 dias sem atualização.`, action: "Abrir a base", go: () => ws.go("base") });
  } else {
  taskAlerts.push(s.taskRetry
    ? { key: "orbis-retry", at: "29/09/2026 10:05", icon: "clock", label: "Reprocessamento", name: "Orbis Energia", text: "voltou para a fila de processamento.", action: "Conferir processamento", go: () => ws.go("task", { taskId: "t5" }) }
    : { key: "orbis-falha", at: "29/09/2026 09:40", icon: "triangle-alert", label: "Falha no carregamento", name: "Orbis Energia", text: "não pôde ser carregada. O arquivo está com 0% de conclusão.", action: "Conferir arquivo", go: () => ws.go("task", { taskId: "t5" }) });
  taskAlerts.push({ key: "cordel-vencido", at: "29/09/2026 08:00", icon: "clock", label: "Prazo vencido", name: "Cordel Seguros", text: "está vencida, com " + left("t3") + " itens sem aprovação.", action: "Abrir tarefa", go: () => ws.go("task", { taskId: "t3" }) });
  if (!s.exported) taskAlerts.push({ key: "meridian-prazo", at: "28/09/2026 17:30", icon: "clock", label: "Prazo próximo", name: "Banco Meridian", text: "vence em 4 dias com " + left("t1") + " itens sem aprovação.", action: "Revisar itens", go: () => ws.go("review", { taskId: "t1", sel: "r4", filter: "todos" }) });
  }
  // Fora da lista: avisos com mais de 5 dias (para todos), os tratados pelo botão de ação e os fechados no "X" até o próximo login.
  const agora = Date.now();
  const bellAlerts = taskAlerts.filter((a) => !(a.criadoEm && agora - a.criadoEm > VALIDADE_DOS_AVISOS) && !s.alertsDone[a.key] && !s.alertsHidden[a.key]);
  // os mesmos alertas no sino da barra superior, com o estado de leitura
  bellAlerts.forEach((a) => { a.read = !!s.alertsRead[a.key]; a.hide = () => ws.hideAlert(a.key); a.tone = tomDoAviso(a); });
  const alertsUnread = bellAlerts.filter((a) => !a.read).length;

  // formulário de nova RFP
  const f = s.form, tried = f.tried, today = online ? hojeIso() : TODAY_ISO;
  const dueErr = tried && (!f.due ? ((f.dueBr || "").length === 10 ? "Data inválida. Use dd/mm/aaaa." : "Informe o prazo de submissão.") : f.due < today ? "O prazo não pode estar no passado." : null);
  // CNPJ numérico ou alfanumérico (IN RFB nº 2.229/2024).
  const cnpjDigits = cnpjSemMascara(f.cnpj);
  const errCnpj = !f.cnpj ? null : cnpjDigits.length < 14 ? "CNPJ incompleto." : !cnpjValido(cnpjDigits) ? "CNPJ inválido." : null;
  const contacts = f.contacts.map((ct) => ({
    ...ct,
    errEmail: ct.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(ct.email) ? "E-mail inválido." : null,
    errPhone: ct.phone && ct.phone.replace(/\D/g, "").length < 10 ? "Telefone incompleto." : null
  }));
  const form = {
    ...f,
    contacts,
    // CNPJ e contatos são opcionais; o que for preenchido precisa estar válido
    errCnpj: (tried || cnpjDigits.length === 14) && errCnpj ? errCnpj : null,
    hasErrors: !!errCnpj || contacts.some((ct) => ct.errEmail || ct.errPhone),
    errName: tried && !f.name ? "Informe o nome da tarefa." : null,
    errCompany: tried && !f.company ? "Informe a empresa." : null,
    errDue: dueErr || null,
    errOwner: tried && !f.owner ? "Escolha um responsável." : null,
    smallBase: readyDocs < 3, today,
    // Responsável: com o servidor, os usuários da plataforma (cenário 62); sem ele, os de exemplo.
    owners: online && s.usuarios.length ? s.usuarios.map((u) => u.nome) : OWN,
    errFile: f.fileError || (tried && !f.file ? "Selecione a planilha de perguntas (.xlsx)." : null)
  };

  // Painel de Usuários (fase Q): linhas na ordenação escolhida; a própria linha não muda papel nem acesso (Q8).
  // No modo compartilhado, a lista, a própria linha (pelo id do perfil, DF3) e as áreas vêm do backend; no
  // local, os dados de exemplo, com a própria linha pelo nome da pessoa escolhida em "Trocar usuário".
  const noServidor = ws.painelNoServidor(s);
  const usuariosDoPainel = ws.usuariosDoPainel(s);
  const eu = ws.name();
  const painel = {
    noServidor, exemplo: !noServidor,
    carregando: noServidor && s.painelCarregando && !s.painelDoServidor, erro: noServidor ? s.painelErro : null,
    ativos: usuariosDoPainel.filter((u) => u.ativo).length,
    ordem: s.painelOrdem, adicionando: s.painelAdicionando,
    areasDoAprovador: noServidor && s.painelAreasValidas ? s.painelAreasValidas : AREAS_DO_APROVADOR,
    linhas: ordenarUsuarios(usuariosDoPainel, s.painelOrdem).map((u) => ({
      ...u, propria: noServidor ? !!u.propria : u.nome === eu, areasAbertas: s.painelAreasAbertas === u.id,
      ocupado: s.painelOcupado === u.id, areasNaTela: u.areas.length ? u.areas : ["Geral"]
    })),
    confirmacao: s.painelConfirmacao ? { ...s.painelConfirmacao, usuario: usuariosDoPainel.find((u) => u.id === s.painelConfirmacao.id) } : null
  };

  return {
    painel,
    isA, online, podeExportar, userName: ws.name(), navGroups, navValue,
    // Áreas do Aprovador da sessão, no menu do usuário (fase N, cenário N1).
    userAreas: areasDaSessao(s) || [],
    // Nova RFP/RFI só com algum documento carregado na base.
    canCreate: !ws.baseVazia(s),
    deletingTask: s.deleting ? tasks.find((t) => t.id === s.deleting) || null : null,
    downloadTask: s.confirmDownload ? tasks.find((t) => t.id === s.confirmDownload) || null : null,
    detalhes: s.detalhes ? { ...s.detalhes, task: tasks.find((t) => t.id === s.detalhes.id) || ws.taskInfo(s.detalhes.id, s) || {} } : null,
    // Fase O: box de conclusão (O6) e confirmação de arquivar (O10).
    finishingTask: s.finishing ? ((t) => t && { ...t, kind: ws.kindOf(t.id) })(tasks.find((t) => t.id === s.finishing)) || null : null,
    archivingTask: s.archiving ? tasks.find((t) => t.id === s.archiving) || null : null,
    taskList, readOnlyNote, exportFilterTabs, exportSemResultado,
    docDetails: s.docDetails ? docs.find((d) => d.id === s.docDetails) || null : null,
    docs, readyDocs, onb, tasks, taskAlerts: bellAlerts, alertsUnread, dash, task, counts: c, segs, destaqueDoCartao, filterTabs, rows,
    rowsDaBusca, linhasDosDetalhes, buscaSemResultado: termos.length > 0 && rowsDaBusca.length === 0,
    revTask: (ws.taskInfo(s.itemsTask, s) || {}).name, cur, savedText, drawer, exportCards, exportTitle, history, historyTabs, form
  };
}

