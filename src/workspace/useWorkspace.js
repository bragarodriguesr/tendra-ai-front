import React from "react";
import { seedItems, seedDocs, genItems, nowStr, ITEM_TASKS, GENERATED, TASKS } from "./data.js";

let contactSeq = 0;
export const newContact = () => ({ id: "c" + ++contactSeq, name: "", role: "", phone: "", email: "" });

const initialState = ({ initialScreen, role }) => ({
  view: "site", tAi: 0, hfilter: "todos", alertAt: { id: null, i: 0 },
  screen: initialScreen, role,
  items: seedItems(), itemsTask: "t1", store: {}, sel: "r4", filter: "todos",
  edit: false, showOrig: false, drawer: null, dialog: false, toast: null, reviewPane: "list",
  docs: seedDocs(), sort: "idade", taskId: "t1",
  exported: null, exported4: null, exported8: null, expanded: null,
  form: { name: "Perguntas_Meridian.xlsx", company: "", cnpj: "", type: "RFP", due: "", owner: "", contacts: [newContact()], file: false, identified: false, tried: false },
  fb: {}, saved: 0, tick: 0, taskRetry: false, alertsRead: {},
  vw: typeof window !== "undefined" ? window.innerWidth : 1440, navOpen: false, sideCollapsed: false
});

/**
 * Estado do Workspace e as ações que o alteram.
 * `ws.state` é o estado do render atual; as ações leem sempre o estado mais recente.
 */
export function useWorkspace({ initialScreen = "dashboard", role = "Aprovador" } = {}) {
  const [state, setRaw] = React.useState(() => initialState({ initialScreen, role }));
  const ref = React.useRef(state);
  ref.current = state;
  const generated = React.useRef({});
  const toastTimer = React.useRef(null);

  const ws = React.useMemo(() => {
    const setState = (patch) => setRaw((s) => {
      const next = { ...s, ...(typeof patch === "function" ? patch(s) : patch) };
      ref.current = next;
      return next;
    });
    const api = {
      setState,
      get s() { return ref.current; },
      name() { return ref.current.role === "Aprovador" ? "Marcelo Vieira" : "Kadu Mendes"; },
      readAlert(a) { setState((s) => ({ alertsRead: { ...s.alertsRead, [a.key]: true } })); a.go(); },
      readAllAlerts(keys) { setState((s) => ({ alertsRead: { ...s.alertsRead, ...Object.fromEntries(keys.map((k) => [k, true])) } })); },
      switchRole() { setState((s) => ({ role: s.role === "Aprovador" ? "Revisor" : "Aprovador" })); },
      hasItems: (id) => ITEM_TASKS.includes(id),
      genFor(id) {
        const g = generated.current;
        if (!g[id]) g[id] = id === "t1" ? seedItems() : (GENERATED[id] ? genItems(...GENERATED[id]) : []);
        return g[id];
      },
      itemsOf(id, s = ref.current) { return id === s.itemsTask ? s.items : (s.store[id] || api.genFor(id)); },
      go(screen, extra = {}) {
        const st = ref.current, tid = extra.taskId;
        let sw = {};
        if ((screen === "task" || screen === "review") && tid && tid !== st.itemsTask && api.hasItems(tid)) {
          const next = api.itemsOf(tid), first = next.find((i) => i.st !== "aprovada") || next[0];
          sw = { items: next, store: { ...st.store, [st.itemsTask]: st.items }, itemsTask: tid, sel: first.id, filter: "todos" };
        }
        // No celular a Revisão tem duas etapas: abre na lista, ou direto no item quando ele vem escolhido.
        const reviewPane = screen === "review" && extra.sel ? "item" : "list";
        setState({ screen, navOpen: false, drawer: null, edit: false, showOrig: false, reviewPane, ...sw, ...extra });
      },
      showView(view) { setState({ view }); window.scrollTo(0, 0); },
      toast(title, desc, tone = "success") {
        setState({ toast: { title, desc, tone } });
        clearTimeout(toastTimer.current);
        toastTimer.current = setTimeout(() => setState({ toast: null }), 4000);
      },
      upd(id, fn) { setState((s) => ({ items: s.items.map((i) => (i.id === id ? fn({ ...i }) : i)) })); },
      visible(s = ref.current) {
        return s.items.filter((i) => (s.filter === "todos" ? true : s.filter === "alerta" ? i.alerts.some((a) => !a.ack) : i.st === s.filter));
      },
      step(d) {
        const v = api.visible();
        if (!v.length) return;
        const idx = v.findIndex((i) => i.id === ref.current.sel);
        const n = v[(idx + d + v.length) % v.length];
        setState({ sel: n.id, edit: false, showOrig: false });
      },
      setFilter(v) { setState({ filter: v }); },
      pendingCount: (i) => i.alerts.filter((a) => !a.ack).length,

      addDocs(list) {
        const base = Date.now();
        // cada arquivo em processamento termina um pouco depois do anterior; `fate` simula falha ou suporte
        let k = 0;
        const add = list.map((d, i) => ({ id: "n" + base + i, upd: "29/09/2026", age: 0, by: api.name(), ver: "", ...d, ...(d.st === "processando" ? { ms: 1800 + 700 * k++ } : null) }));
        setState((s) => ({ docs: [...s.docs, ...add] }));
        add.filter((d) => d.st === "processando").forEach((d) =>
          setTimeout(() => setState((s) => ({ docs: s.docs.map((x) => (x.id === d.id ? { ...x, st: x.fate || "pronto", fate: null } : x)) })), d.ms));
      },
      onboardFiles(files) {
        const ok = /\.(docx?|xlsx?|md|pdf|pptx?|txt|csv)$/i;
        api.addDocs(files.map((f) => ({ name: f.name, type: "Documento", origin: "onb", st: ok.test(f.name) ? "processando" : "formato" })));
      },
      onboardSample() {
        api.addDocs([
          { name: "Politica_Seguranca_Informacao_v6.pdf", st: "processando" },
          { name: "Proposta_Tecnica_Fintech_Horizonte_2025.docx", st: "processando" },
          { name: "Matriz_Controles_ISO27001.xlsx", st: "processando" },
          { name: "Contrato_Assinado_Digitalizado_2021.pdf", st: "suporte" },
          { name: "Tabela_Precos.numbers", st: "formato" },
          { name: "FAQ_Produto.md", st: "processando", fate: "erro" }
        ].map((d) => ({ type: "Documento", origin: "onb", ...d })));
      },
      uploadDocs() {
        api.addDocs([
          { name: "Proposta_Helios_2026.pptx", type: "Documento", st: "processando" },
          { name: "Inventario_Ativos.exe", type: "Documento", st: "formato" },
          { name: "Contrato_scan_2023.pdf", type: "Documento", st: "suporte" }
        ]);
      },
      uploadRfp() { api.addDocs([{ name: "RFP_Vetta_2026.xlsx", type: "RFP passada", st: "processando" }]); },
      retryDoc(id) {
        setState((s) => ({ docs: s.docs.map((x) => (x.id === id ? { ...x, st: "processando", fate: null, ms: 1800 } : x)) }));
        setTimeout(() => setState((s) => ({ docs: s.docs.map((x) => (x.id === id ? { ...x, st: "pronto" } : x)) })), 1800);
      },
      toggleDoc(d) {
        setState((s) => ({ docs: s.docs.map((q) => (q.id === d.id ? { ...q, off: !q.off } : q)) }));
        api.toast(d.off ? "Documento ativado" : "Documento inativo",
          d.off ? d.name + " voltou a ser usado nas respostas." : d.name + " não será usado em novas respostas.", "neutral");
      },

      onDraft(text) {
        const by = api.name();
        api.upd(ref.current.sel, (i) => {
          const parts = text.split(/\n\s*\n/);
          i.paras = text.trim() === "" ? [] : parts.map((t, k) => ({ t, s: (i.paras[k] && i.paras[k].s) || [] }));
          if (i.st === "aprovada" || i.st === "revisada") i.st = "em-revisao";
          if (!i.srcs.length) {
            const has = text.trim() !== "";
            const cur = i.alerts.find((a) => a.t === "nocontext" || a.t === "manual");
            if (has && (!cur || cur.t === "nocontext")) { i.alerts = [{ t: "manual" }, ...i.alerts.filter((a) => a.t !== "nocontext")]; i.manualBy = by; }
            if (!has && cur && cur.t === "manual") { i.alerts = [{ t: "nocontext" }, ...i.alerts.filter((a) => a.t !== "manual")]; }
            if (has && i.st === "sem-rascunho") i.st = "em-revisao";
            if (!has) i.st = "sem-rascunho";
          } else if (i.st === "sugerida") i.st = "em-revisao";
          return i;
        });
        setState({ saved: Date.now() });
      },
      ack(id, idx) {
        const by = api.name(), at = nowStr();
        api.upd(id, (i) => { i.alerts = i.alerts.map((a, k) => (k === idx ? { ...a, ack: { by, at } } : a)); return i; });
        api.toast("Alerta reconhecido", `${by}, ${at}`);
      },
      useSource(id, k) {
        const by = api.name(), at = nowStr();
        api.upd(id, (i) => {
          i.srcs = i.srcs.map((s, n) => ({ ...s, chosen: n + 1 === k }));
          i.paras = i.paras.map((p) => ({ ...p, s: [k] }));
          i.alerts = i.alerts.map((a) => (a.t === "conflict" ? { ...a, ack: { by, at } } : a));
          return i;
        });
        api.toast("Fonte escolhida", "O alerta de conflito foi reconhecido.");
      },
      approve() {
        const s = ref.current, id = s.sel, by = api.name(), at = nowStr();
        api.upd(id, (i) => { i.st = "aprovada"; i.by = by; i.at = at; return i; });
        const next = s.items.find((i) => i.id !== id && i.st !== "aprovada");
        api.toast("Item aprovado", `${by} · ${at}`);
        if (next) setState({ sel: next.id, edit: false, showOrig: false });
      },
      revise(id) {
        const by = api.name(), at = nowStr();
        api.upd(id, (i) => { i.st = "revisada"; i.rby = by; i.rat = at; return i; });
        api.toast("Item revisado", "Pronto para aprovação.");
      },
      restore(id) {
        api.upd(id, (i) => { i.paras = i.orig.split(/\n\n/).map((t, k) => ({ t, s: (i.paras[k] && i.paras[k].s) || [] })); return i; });
        api.toast("Sugestão restaurada", "O texto voltou ao rascunho original.", "neutral");
      },
      confirmEdit(id) {
        if (id) api.upd(id, (i) => { i.st = "em-revisao"; return i; });
        setState({ dialog: false, edit: true });
        api.toast("Aprovação removida", "O item voltou para Em revisão.", "neutral");
      },
      demoAll() {
        const by = "Marcelo Vieira", at = nowStr();
        setState((s) => ({ items: s.items.map((i) => ({ ...i, st: "aprovada", by: i.by || by, at: i.at || at, alerts: i.alerts.map((a) => (a.ack ? a : { ...a, ack: { by, at } })) })) }));
        api.toast("Demo", "Todos os itens aprovados e sem alerta pendente.", "neutral");
      },
      retryTask() {
        setState({ taskRetry: true });
        api.toast("Nova tentativa", "O arquivo voltou para a fila de processamento.", "neutral");
      },
      exportTask(key) {
        if (!ref.current[key]) setState({ [key]: { by: api.name(), at: nowStr() } });
        api.toast("Documento exportado", "Planilha .xlsx com respostas aprovadas e fontes.");
      },

      counts(id, s = ref.current) {
        const it = id ? api.itemsOf(id, s) : s.items, c = (st) => it.filter((i) => i.st === st).length;
        const total = it.length, approved = c("aprovada");
        return {
          total, approved, none: c("sem-rascunho"), sug: c("sugerida"), emr: c("em-revisao"), rev: c("revisada"),
          withDraft: total - c("sem-rascunho"), alerts: it.filter((i) => api.pendingCount(i) > 0).length,
          pctApproved: Math.round((approved / total) * 100)
        };
      },
      taskInfo(id, s = ref.current) {
        if (!TASKS[id]) return undefined;
        const x = { ...TASKS[id] };
        if (id === "t5") x.isFailed = !s.taskRetry;
        if (api.hasItems(id)) { const cc = api.counts(id, s); x.items = cc.total; x.approvedN = cc.approved; x.hasItems = true; }
        if (x.approvedN != null) {
          const left = x.items - x.approvedN;
          x.pct = Math.round((x.approvedN / x.items) * 100);
          x.progText = x.approvedN + " de " + x.items + " itens aprovados.";
          x.shortProg = x.approvedN + " de " + x.items + " aprovados";
          x.reviewNote = (x.dueText === "Vencida" ? "Prazo vencido em " + x.due + ". " : "Dentro do prazo. ") + "Faltam " + left + " itens para a exportação ser liberada.";
        }
        return x;
      }
    };
    return api;
  }, []);

  React.useEffect(() => {
    const onKey = (e) => {
      const s = ref.current, t = e.target && e.target.tagName;
      if (e.key === "Escape" && s.drawer) { ws.setState({ drawer: null }); return; }
      if (t === "INPUT" || t === "TEXTAREA" || t === "SELECT" || s.view !== "app" || s.screen !== "review" || s.drawer) return;
      if (e.key === "j" || e.key === "J") ws.step(1);
      if (e.key === "k" || e.key === "K") ws.step(-1);
    };
    const onResize = () => ws.setState({ vw: window.innerWidth });
    const tick = setInterval(() => ws.setState({ tick: Date.now() }), 5000);
    window.addEventListener("keydown", onKey);
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("resize", onResize);
      clearInterval(tick);
      clearTimeout(toastTimer.current);
    };
  }, [ws]);

  return { state, ws };
}
