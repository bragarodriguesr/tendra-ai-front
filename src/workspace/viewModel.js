import { AL, ST, code, plural, TASK_IDS, ITEM_TASKS, TODAY_ISO } from "./data.js";

const DANGER = "#A8402E";

// Camadas de "cartões sobrepostos" atrás do alerta visível (até duas bordas).
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

const STATUS_COLORS = {
  "Em revisão": "var(--n-700)", Processando: "var(--brand-sage)", Pronta: "var(--brand-lime)", Exportada: "var(--n-900)",
  Vencido: "var(--danger)", Falha: "var(--n-500)", "Na fila": "var(--n-350)"
};

const FILTERS = [["todos", "Todos"], ["sem-rascunho", "Sem rascunho"], ["sugerida", "Sugerida"], ["em-revisao", "Em revisão"], ["revisada", "Revisada"], ["aprovada", "Aprovada"], ["alerta", "Alerta pendente"]];

/** Deriva tudo o que as telas mostram a partir do estado. */
export function buildView(s, ws) {
  const isA = s.role === "Aprovador";
  const c = ws.counts(null, s);
  const openItem = (id, tid) => () => ws.go("review", { taskId: tid || s.itemsTask, sel: id, filter: "todos" });

  // navegação
  const pend = s.items.filter((i) => ws.pendingCount(i) > 0).length;
  const go = (sc) => (e) => { e && e.preventDefault && e.preventDefault(); ws.go(sc); };
  const navGroups = [
    { label: "Início", items: [{ value: "dashboard", label: "Dashboard", icon: "layout-dashboard", onClick: go("dashboard") }] },
    { label: "Trabalho", items: [
      { value: "tasks", label: "Tarefas", icon: "layout-grid", count: TASK_IDS.length, onClick: go("tasks") },
      { value: "review", label: "Revisão", icon: "eye", count: pend, onClick: go("review") },
      { value: "export", label: "Exportação", icon: "download", onClick: (e) => { e.preventDefault(); ws.go("export", { taskId: "t1" }); } },
      { value: "history", label: "Histórico", icon: "history", onClick: go("history") }
    ] },
    { label: "Base", items: [
      { value: "base", label: "Base de conhecimento", icon: "database", count: s.docs.length, onClick: go("base") },
      { value: "onboarding", label: "Primeiros passos", icon: "play", onClick: go("onboarding") }
    ] }
  ];
  const navValue = s.screen === "task" ? "tasks" : s.screen;

  // documentos
  const docsSorted = [...s.docs];
  if (s.sort === "idade") docsSorted.sort((a, b) => b.age - a.age);
  else if (s.sort === "nome") docsSorted.sort((a, b) => a.name.localeCompare(b.name));
  else docsSorted.reverse();
  const docs = docsSorted.map((d) => {
    const x = d.off ? ["Inativo", "neutral", "minus"] : DOC_STATUS[d.st];
    return {
      ...d, active: !d.off, toggleLabel: d.off ? "Ativar documento" : "Desativar documento", toggle: () => ws.toggleDoc(d),
      statusText: x[0], tone: x[1], icon: x[2], ageText: d.age === 0 ? "hoje" : d.age + " dias", old: d.age > 120,
      version: d.ver ? "Versão " + d.ver : "Sem versão", canRetry: d.st === "erro" && !d.off, retry: () => ws.retryDoc(d.id),
      note: d.st === "formato" ? `Formato não aceito. Formatos aceitos: ${FORMATS}.`
        : d.st === "suporte" ? "Este arquivo precisa de tratamento pelo suporte. Avisaremos aqui quando estiver pronto."
        : d.st === "erro" ? "Falha ao processar. Tente novamente."
        : d.st === "processando" ? "Processando…" : "Última atualização " + d.upd
    };
  });
  const readyDocs = s.docs.filter((d) => d.st === "pronto" && !d.off).length;

  // tarefas
  const tasks = TASK_IDS.map((id) => {
    const t = ws.taskInfo(id, s);
    const status = id === "t1" ? (s.exported ? ["Exportada", "approved", "check-check"] : ["Em revisão", "neutral", "eye"])
      : t.dueText === "Vencida" ? ["Vencido", "danger", "clock"]
      : t.isReady ? ((id === "t4" ? s.exported4 : s.exported8) ? ["Exportada", "approved", "check-check"] : ["Pronta", "approved", "check-check"])
      : t.isInReview ? ["Em revisão", "neutral", "eye"]
      : t.isProcessing ? ["Processando", "neutral", "loader-circle"]
      : t.isFailed ? ["Falha", "danger", "triangle-alert"]
      : ["Na fila", "neutral", "clock"];
    const dm = /faltam (\d+)/.exec(t.dueText || "");
    const urgent = t.dueText === "Vencida" || (dm && +dm[1] < 5);
    return {
      ...t, dueColor: urgent ? DANGER : t.dueColor, dueWeight: urgent ? 600 : 400, title: t.name.split(" — ")[0],
      pct: t.hasItems || t.isReady ? t.pct : t.isProcessing ? 23 : 0,
      compText: t.hasItems || t.isReady ? t.shortProg : t.isProcessing ? "42 de 180 processadas" : t.isFailed ? "0 de 0" : "Reprocessando",
      status: status[0], tone: status[1], icon: status[2], open: () => ws.go("task", { taskId: id })
    };
  });

  // dashboard
  const dateKey = (x) => { const [d, m, y] = x.split("/"); return +(y + m + d); };
  const itc = ITEM_TASKS.map((id) => ws.counts(id, s));
  const openItems = itc.reduce((a, q) => a + q.total - q.approved, 0) + 138;
  const stCount = {};
  tasks.forEach((t) => { stCount[t.status] = (stCount[t.status] || 0) + 1; });
  const dash = {
    worked: String(tasks.length + 18), workedSub: tasks.length + " em andamento · 18 concluídas",
    open: String(openItems), openSub: "Em " + tasks.filter((t) => !t.isReady).length + " tarefas ativas, entre revisão e processamento.",
    avg: "2,4 dias",
    approved: (1284 + itc.reduce((a, q) => a + q.approved, 0)).toLocaleString("pt-BR"),
    approvedSub: "Todas com fonte rastreável até o documento de origem.",
    status: Object.keys(stCount).map((k) => ({ label: k, n: stCount[k], width: (stCount[k] / tasks.length) * 100 + "%", color: STATUS_COLORS[k] })),
    months: [["Abr", 2], ["Mai", 3], ["Jun", 3], ["Jul", 4], ["Ago", 3], ["Set", 3]].map(([m, n]) => ({ m, n, height: n * 22 })),
    deadlines: tasks.filter((t) => { const m = /faltam (\d+)/.exec(t.dueText || ""); return m && +m[1] < 15; }).sort((a, b) => dateKey(a.due) - dateKey(b.due))
  };

  // detalhe da tarefa
  const task0 = ws.taskInfo(s.taskId, s) || ws.taskInfo("t1", s);
  const tkr = tasks.find((x) => x.id === task0.id) || {};
  const task = { ...task0, sTxt: tkr.status, sTone: tkr.tone, sIcon: tkr.icon, hasItems: !!task0.hasItems, isReady: !!task0.isReady };
  const segs = [
    { n: c.none, label: "sem rascunho", color: "var(--n-350)" },
    { n: c.sug, label: "sugerida", color: "var(--brand-sage)" },
    { n: c.emr, label: "em revisão", color: "var(--n-700)" },
    { n: c.rev, label: "revisada", color: "var(--n-500)" },
    { n: c.approved, label: "aprovada", color: "var(--n-900)" }
  ].map((g) => ({ ...g, width: (g.n / c.total) * 100 + "%" }));

  // filtros e lista
  const cnt = (k) => (k === "todos" ? s.items.length : k === "alerta" ? c.alerts : s.items.filter((i) => i.st === k).length);
  const filterTabs = FILTERS.map(([value, label]) => ({ value, label, count: cnt(value) }));
  const filterOptions = FILTERS.map(([value, label]) => ({ value, label }));
  const vis = ws.visible(s);
  const rows = vis.map((i) => {
    const st = ST[i.st], p = ws.pendingCount(i);
    return {
      id: i.id, code: code(i), q: i.q.length > 68 ? i.q.slice(0, 66) + "…" : i.q, st: st.l, icon: st.i, tone: st.tone,
      hasAlert: p > 0, alertText: p + " " + plural(p, "alerta", "alertas"), active: i.id === s.sel,
      open: () => ws.setState({ sel: i.id, edit: false, showOrig: false }), openFromTask: openItem(i.id)
    };
  });

  // item atual na revisão
  const it = vis.find((i) => i.id === s.sel) || null;
  let cur = null;
  if (it) {
    const st = ST[it.st], p = ws.pendingCount(it);
    const maxAge = it.srcs.filter((x) => x.age > 120).reduce((m, x) => Math.max(m, x.age), 0);
    const hasConflict = it.alerts.some((a) => a.t === "conflict" && !a.ack);
    const alerts = it.alerts.map((a, idx) => {
      const d = AL[a.t], pending = !a.ack;
      return {
        label: d.l, icon: a.ack ? "check" : d.i, pending, isAck: !!a.ack,
        text: a.t === "old" ? `Fonte sem atualização há ${maxAge} dias, acima do prazo de 120 dias.` : a.t === "nocontext" && !pending ? "" : d.x,
        ackText: a.ack ? `Reconhecido por ${a.ack.by}, ${a.ack.at}` : "",
        showAck: pending && a.t !== "conflict" && a.t !== "nocontext", showNone: pending && a.t === "conflict",
        ack: () => ws.ack(it.id, idx), none: () => { ws.ack(it.id, idx); ws.setState({ edit: true }); }
      };
    });
    const ai = s.alertAt.id === it.id ? Math.min(s.alertAt.i, Math.max(alerts.length - 1, 0)) : 0;
    const hasAnswer = it.paras.length > 0 && it.paras.some((x) => x.t.trim());
    let blockText = "", noRevise = false, noApprove = false;
    const alertWord = p > 1 ? `${p} alertas` : "1 alerta";
    if (it.st === "aprovada") { noApprove = true; noRevise = true; }
    else if (!hasAnswer) { blockText = "Escreva a resposta antes de revisar ou aprovar."; noRevise = true; noApprove = true; }
    else if (p > 0) { blockText = `Falta tratar ${alertWord} antes de aprovar.`; noRevise = true; noApprove = true; }
    if (!isA && it.st !== "aprovada") { noApprove = true; blockText = blockText ? blockText + " Somente Aprovadores aprovam." : "Somente Aprovadores aprovam."; }
    if (it.st === "revisada") noRevise = true;
    const openSrc = (k) => () => ws.setState({ drawer: { id: it.id, k } });
    const srcs = it.srcs.map((x, n) => {
      const k = n + 1;
      return { ...x, k, ageText: x.age + " dias", old: x.age > 120, conflict: !!x.conflict && hasConflict, chosen: !!x.chosen, canUse: !!x.conflict && hasConflict, use: () => ws.useSource(it.id, k), open: openSrc(k) };
    });
    const paras = it.paras.map((pp) => ({ t: pp.t, marks: pp.s.filter((k) => it.srcs[k - 1]).map((k) => ({ k, aria: "Abrir fonte " + k, open: openSrc(k) })) }));
    const text = it.paras.map((x) => x.t).join("\n\n");
    cur = {
      ...it, ...deckLayers(alerts.length), alerts, alert: alerts[ai] || {}, alertIndex: ai, alertPos: `${ai + 1} de ${alerts.length}`, hasMany: alerts.length > 1,
      code: code(it), st: st.l, icon: st.i, tone: st.tone, srcs, paras, noText: !hasAnswer,
      edited: it.orig !== "" && text !== it.orig, text,
      hasManual: it.alerts.some((a) => a.t === "manual"), isApproved: it.st === "aprovada",
      blockText, noRevise, noApprove, fbUp: s.fb[it.id] === "up", fbDown: s.fb[it.id] === "down",
      isApprovedOrRevised: it.st === "revisada" || it.st === "aprovada",
      stateHint: it.st === "aprovada" ? "Editar remove a aprovação." : "Pronta para aprovação."
    };
  }
  const secs = s.saved ? Math.max(0, Math.round(((s.tick || Date.now()) - s.saved) / 1000)) : 0;
  const savedText = s.saved ? `Salvo há ${secs <= 1 ? "1 segundo" : secs + " segundos"}` : "Salvamento automático";

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
      disabled: blocked || !isA, btn: exp ? "Baixar novamente" : "Exportar documento",
      reason: blocked ? total - approved + " de " + total + " itens ainda não foram aprovados. Exportação bloqueada até 100% aprovado."
        : !isA ? "Somente Aprovadores exportam." : "Todos os itens estão aprovados e sem alerta pendente.",
      exported: exp, doExport: onExp, goReview: openItem(t1Pending[0] ? t1Pending[0].id : "r1", "t1")
    };
  };
  const exportCards = [
    mkCard("t1", "Banco Meridian", "Questionário de segurança", t1Items.length, t1Items.length - t1Pending.length, s.exported, () => ws.exportTask("exported")),
    mkCard("t8", "Atlas Saúde", "Questionário de segurança", 32, 32, s.exported8, () => ws.exportTask("exported8")),
    mkCard("t4", "Helios Logística", "Questionário LGPD", 24, 24, s.exported4, () => ws.exportTask("exported4"))
  ];
  const exportTitle = `${exportCards.filter((x) => !x.blocked).length} de ${exportCards.length} tarefas prontas para exportar`;

  // histórico
  const MERIDIAN = "Questionário de segurança — Banco Meridian";
  const liveSrcs = (i) => i.srcs.map((x, n) => ({ label: `${x.doc} · ${x.loc}`, open: () => ws.setState({ drawer: { id: i.id, k: n + 1 } }) }));
  const live = t1Items.filter((i) => i.st === "aprovada").map((i) => ({ key: i.id, kind: "aprovacao", q: i.q, task: MERIDIAN, full: i.paras.map((p) => p.t).join(" "), by: i.by, at: i.at, age: 0, srcs: liveSrcs(i) }));
  const liveRev = t1Items.filter((i) => i.st === "revisada").map((i) => ({ key: i.id + "-rev", kind: "revisao", q: i.q, task: MERIDIAN, full: i.paras.map((p) => p.t).join(" "), by: i.rby, at: i.rat, age: 0, srcs: liveSrcs(i) }));
  const past = [
    { key: "h1", kind: "aprovacao", q: "Onde ficam armazenados os backups?", task: "RFP Aurora Seguros — 2025", full: "Backups ficam em região distinta da produção, criptografados com AES-256 e retidos por 35 dias.", by: "Marcelo Vieira", at: "14/03/2026 10:12", age: 199, srcs: [{ label: "Politica_Backup_DR.pdf · p. 7" }] },
    { key: "h2", kind: "aprovacao", q: "A plataforma possui certificação ISO 27001?", task: "RFI Helix Saúde — 2026", full: "Sim. A certificação ISO/IEC 27001 está vigente, com escopo que cobre desenvolvimento e operação da plataforma.", by: "Marcelo Vieira", at: "02/07/2026 16:48", age: 89, srcs: [{ label: "Certificado_ISO27001.pdf · p. 1" }] },
    { key: "h3", kind: "aprovacao", q: "Como é feita a segregação de dados entre clientes?", task: "RFP Aurora Seguros — 2025", full: "Cada cliente tem isolamento lógico por tenant, com chaves de criptografia distintas por tenant.", imported: true, age: 420, srcs: [{ label: "RFP_Aurora_2025.xlsx · linha 33" }] },
    { key: "h4", kind: "revisao", q: "Quais são os controles de acesso privilegiado?", task: "RFI Helix Saúde — 2026", full: "Acesso privilegiado exige MFA, aprovação just-in-time e sessão gravada, com revisão trimestral dos acessos.", by: "Kadu Mendes", at: "01/07/2026 09:30", age: 90, srcs: [{ label: "Politica_Acesso.docx · § 4" }] },
    { key: "h5", kind: "revisao", q: "Como é feito o descarte seguro de dados?", task: "RFP Aurora Seguros — 2025", full: "Mídias são sanitizadas conforme NIST 800-88 e o descarte é registrado em certificado de destruição.", by: "Paula Rocha", at: "12/03/2026 15:05", age: 201, srcs: [{ label: "Politica_Retencao.pdf · p. 3" }] }
  ];
  const allHist = [...live, ...liveRev, ...past];
  const kindOf = (k) => (k === "aprovacoes" ? "aprovacao" : "revisao");
  const histCount = (k) => (k === "todos" ? allHist.length : allHist.filter((x) => x.kind === kindOf(k)).length);
  const historyTabs = [["todos", "Todos"], ["aprovacoes", "Aprovações"], ["revisoes", "Revisões"]].map(([value, label]) => ({ value, label, count: histCount(value) }));
  const history = (s.hfilter === "todos" ? allHist : allHist.filter((x) => x.kind === kindOf(s.hfilter))).map((h) => ({
    ...h, kindLabel: h.kind === "revisao" ? "Revisada" : "Aprovada", kindTone: h.kind === "revisao" ? "neutral" : "approved", kindIcon: h.kind === "revisao" ? "check" : "shield-check",
    imported: !!h.imported, ageText: h.age === 0 ? "hoje" : h.age + " dias", open: s.expanded === h.key,
    toggle: () => ws.setState((x) => ({ expanded: x.expanded === h.key ? null : h.key })),
    srcs: h.srcs.map((x) => ({ label: x.label, open: x.open || (() => ws.toast("Fonte de histórico", "Abra a tarefa de origem para ver o trecho.", "neutral")) }))
  }));

  // alertas da tela de Tarefas
  const left = (id) => { const q = ws.counts(id, s); return q.total - q.approved; };
  const taskAlerts = [];
  taskAlerts.push(s.taskRetry
    ? { icon: "clock", label: "Reprocessamento", name: "Orbis Energia", text: "voltou para a fila de processamento.", action: "Conferir processamento", go: () => ws.go("task", { taskId: "t5" }) }
    : { icon: "triangle-alert", label: "Falha no carregamento", name: "Orbis Energia", text: "não pôde ser carregada. O arquivo está com 0% de conclusão.", action: "Conferir arquivo", go: () => ws.go("task", { taskId: "t5" }) });
  taskAlerts.push({ icon: "clock", label: "Prazo vencido", name: "Cordel Seguros", text: "está vencida, com " + left("t3") + " itens sem aprovação.", action: "Abrir tarefa", go: () => ws.go("task", { taskId: "t3" }) });
  if (!s.exported) taskAlerts.push({ icon: "clock", label: "Prazo próximo", name: "Banco Meridian", text: "vence em 4 dias com " + left("t1") + " itens sem aprovação.", action: "Revisar itens", go: () => ws.go("review", { taskId: "t1", sel: "r4", filter: "todos" }) });
  const tAi = Math.min(s.tAi, Math.max(taskAlerts.length - 1, 0));
  const tDeck = { ...deckLayers(taskAlerts.length), a: taskAlerts[tAi], pos: `${tAi + 1} de ${taskAlerts.length}`, hasMany: taskAlerts.length > 1, index: tAi, count: taskAlerts.length };

  // formulário de nova RFP
  const f = s.form, tried = f.tried;
  const dueErr = tried && (!f.due ? "Informe o prazo de submissão." : f.due < TODAY_ISO ? "O prazo não pode estar no passado." : null);
  const form = {
    ...f,
    errName: tried && !f.name ? "Informe o nome da tarefa." : null,
    errCompany: tried && !f.company ? "Informe a empresa." : null,
    errDue: dueErr || null,
    errOwner: tried && !f.owner ? "Escolha um responsável." : null,
    smallBase: readyDocs < 3
  };

  return {
    isA, userName: ws.name(), navGroups, navValue,
    docs, readyDocs, tasks, taskAlerts, tDeck, dash, task, counts: c, segs, filterTabs, filterOptions, rows,
    revTask: (ws.taskInfo(s.itemsTask, s) || {}).name, cur, savedText, drawer, exportCards, exportTitle, history, historyTabs, form
  };
}

