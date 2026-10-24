import React from "react";
import { seedItems, seedDocs, genItems, nowStr, ITEM_TASKS, GENERATED, TASKS, TASK_IDS } from "./data.js";
import {
  MENSAGEM_FORMATO_DA_RFP, aprovarItemNaApi, avaliarItemNaApi, criarTarefa, editarTextoDoItem, listarAvaliacoes, listarPessoas, restaurarItem, dataHoraDaTela, definirDocumentoAtivo, enderecoDaPlanilha, enviarDocumentosDaBase, hojeIso, listarDocumentosDaBase, listarItensDaTarefa,
  listarTarefas, paraDocumentoDaTela, paraItemDaTela, reconhecerAlertaNaApi, escolherFonteNaApi, revisarItemNaApi, excluirTarefa
, entrar, obterSessao, quandoPerderASessao, sair} from "../api.js";

let contactSeq = 0;
const chaveDosAlertasLidos = (pessoa) => "tendra.alertasLidos." + pessoa;
export const newContact = () => ({ id: "c" + ++contactSeq, name: "", role: "", phone: "", email: "" });
const emptyForm = () => ({ name: "", company: "", cnpj: "", type: "RFP", due: "", owner: "", contacts: [newContact()], file: null, fileError: null, identified: false, tried: false });

const DIA = 24 * 60 * 60 * 1000;
/** Prazo AAAA-MM-DD da tarefa em dd/mm/aaaa e o texto relativo a hoje. */
function prazoDaTela(prazo) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(prazo || "");
  if (!m) return { due: "—", dueText: "sem prazo" };
  const [ano, mes, dia] = hojeIso().split("-").map(Number);
  const dias = Math.round((Date.UTC(+m[1], +m[2] - 1, +m[3]) - Date.UTC(ano, mes - 1, dia)) / DIA);
  return { due: `${m[3]}/${m[2]}/${m[1]}`, dueText: dias < 0 ? "Vencida" : dias === 0 ? "vence hoje" : dias === 1 ? "falta 1 dia" : `faltam ${dias} dias` };
}

const initialState = ({ initialScreen, role }) => ({
  view: "site", tAi: 0, hfilter: "todos", alertAt: { id: null, i: 0 },
  // Cartão de fontes em conflito mostrado e item com o histórico de alertas aberto (todos tratados).
  srcAt: { id: null, i: 0 }, alertsOpen: null,
  screen: initialScreen, role,
  items: seedItems(), itemsTask: "t1", store: {}, sel: "r4", filter: "todos",
  edit: false, showOrig: false, drawer: null, dialog: false, toast: null, reviewPane: "list",
  // Base: lista de exemplo até o servidor responder; depois, os documentos do banco.
  docs: seedDocs(), baseOrigem: "exemplo", enviando: false, envio: null, sort: "idade", taskId: "t1",
  // Último envio de documentos, para o alerta do sino (o quadro do resultado pode ser fechado).
  ultimoEnvio: null,
  // Tarefas: as de exemplo (data.js) até o servidor responder; depois, só as do banco.
  tarefas: [], tarefasOrigem: "exemplo", criando: false, pessoas: [],
  // Tarefa à espera da confirmação de exclusão e exclusão em andamento (cenário 60).
  deleting: null, excluindo: false,
  // Fase D: "compartilhado" quando o backend tem login; a sessão traz nome e papel da pessoa.
  modo: "local", sessao: null,
  exported: null, exported4: null, exported8: null, expanded: null,
  form: emptyForm(),
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
  // Textos editados ainda não gravados, por "tarefa/item": gravados 800 ms depois da última tecla.
  const pendingSaves = React.useRef({});
  const toastTimer = React.useRef(null);
  // Logout em andamento (fase D): o login seguinte espera ele terminar.
  const saindo = React.useRef(Promise.resolve());

  const ws = React.useMemo(() => {
    const setState = (patch) => setRaw((s) => {
      const next = { ...s, ...(typeof patch === "function" ? patch(s) : patch) };
      ref.current = next;
      return next;
    });
    const api = {
      setState,
      get s() { return ref.current; },
      /**
       * Pessoa que age. Com login, a da sessão (o backend ignora a pessoa enviada). Sem login, a
       * primeira de backend/config/pessoas.json com o papel escolhido em "Trocar usuário".
       */
      person(s = ref.current) {
        if (s.sessao) return { id: undefined, nome: s.sessao.nome };
        const p = s.pessoas.find((x) => x.papel === s.role);
        return p || (s.role === "Aprovador" ? { id: "marcelo", nome: "Marcelo Vieira" } : { id: "kadu", nome: "Kadu Mendes" });
      },
      name() { return api.person().nome; },
      /** Descobre o modo do backend e recupera a sessão aberta (fase D, D9). */
      async iniciarSessao() {
        const { modo, pessoa } = await obterSessao();
        setState((s) => ({ modo, sessao: pessoa, role: pessoa ? pessoa.papel : s.role }));
        api.loadAlertsRead();
      },
      /** Login do modo compartilhado. Lança ErroDaApi com a mensagem do backend. */
      async entrar(email, senha) {
        // Um "Sair" ainda em andamento termina antes: a resposta dele apaga o cookie e não pode apagar o da nova sessão.
        await saindo.current;
        const { pessoa } = await entrar(email, senha);
        setState({ sessao: pessoa, role: pessoa.papel, pessoas: [] });
        api.loadAlertsRead();
        api.loadBase();
        api.loadTasks();
      },
      /**
       * Sai: esquece a pessoa na hora, antes da resposta do backend, para que "Entrar" logo em
       * seguida sempre peça e-mail e senha; depois apaga a sessão no backend (quando há login).
       */
      async sair() {
        const tinhaSessao = !!ref.current.sessao;
        // Grava o texto pendente ainda com a sessão aberta.
        const gravando = api.flushSaves();
        setState({ sessao: null, fb: {}, pessoas: [] });
        if (!tinhaSessao) return;
        saindo.current = gravando.then(() => sair()).catch(() => {});
        await saindo.current;
      },
      readAlert(a) { api.markAlertsRead([a.key]); a.go(); },
      readAllAlerts(keys) { api.markAlertsRead(keys); },
      /** Alertas do sino lidos: guardados no navegador, por pessoa, para não voltarem a cada entrada. */
      markAlertsRead(keys) {
        setState((s) => {
          const alertsRead = { ...s.alertsRead, ...Object.fromEntries(keys.map((k) => [k, true])) };
          try { localStorage.setItem(chaveDosAlertasLidos(api.person(s).nome), JSON.stringify(alertsRead)); } catch { /* sem armazenamento: só nesta aba */ }
          return { alertsRead };
        });
      },
      /** Lê os alertas já lidos pela pessoa que entrou (fase D) ou escolhida em "Trocar usuário". */
      loadAlertsRead() {
        // Atualização por função: a pessoa é a do estado já com a sessão ou o papel novos.
        setState((s) => {
          let lidos = {};
          try { lidos = JSON.parse(localStorage.getItem(chaveDosAlertasLidos(api.person(s).nome)) || "{}") || {}; } catch { lidos = {}; }
          return { alertsRead: lidos };
        });
      },
      switchRole() {
        api.flushSaves();
        setState((s) => ({ role: s.role === "Aprovador" ? "Revisor" : "Aprovador" }));
        api.loadAlertsRead();
        // A avaliação mostrada é a da pessoa que age.
        const tid = ref.current.itemsTask;
        if (api.serverTask(tid)) setTimeout(() => api.loadFeedback(tid), 0);
      },
      /** Item da Revisão gravado no banco: as ações vão para as rotas da B5. */
      isServerItem: (s = ref.current) => !!api.serverTask(s.itemsTask, s),
      numberOf: (id) => Number(String(id).slice(1)),
      /**
       * Põe na tela o item devolvido pelo backend, que traz também alertas reconhecidos, fonte escolhida e revisão (cenários 57 a 59).
       * Com `keepText`, o texto da tela fica (a pessoa pode ter continuado digitando depois da gravação).
       */
      applyServerItem(tid, item, { keepText = false } = {}) {
        setState((s) => {
          const merge = (list) => list.map((i) => {
            if (i.id !== item.id) return i;
            return { ...paraItemDaTela(item, i.tot), ...(keepText ? { paras: i.paras } : null) };
          });
          return s.itemsTask === tid ? { items: merge(s.items) } : s.store[tid] ? { store: { ...s.store, [tid]: merge(s.store[tid]) } } : {};
        });
      },
      /** Grava agora o texto pendente de um item (ou de todos). */
      async flushSaves(key) {
        const keys = key ? [key] : Object.keys(pendingSaves.current);
        await Promise.all(keys.map(async (k) => {
          const p = pendingSaves.current[k];
          if (!p) return;
          clearTimeout(p.timer);
          delete pendingSaves.current[k];
          try {
            const { item } = await editarTextoDoItem(p.tid, api.numberOf(p.id), p.pessoa, p.text);
            api.applyServerItem(p.tid, item, { keepText: true });
            setState({ saved: Date.now() });
          } catch (e) {
            api.toast("Texto não gravado", e.message, "danger");
          }
        }));
      },
      /** Tarefa que veio do servidor (o id é o uuid do banco). */
      serverTask: (id, s = ref.current) => s.tarefas.find((t) => t.id === id),
      taskIds: (s = ref.current) => (s.tarefasOrigem === "servidor" ? s.tarefas.map((t) => t.id) : TASK_IDS),
      hasItems(id, s = ref.current) {
        const t = api.serverTask(id, s);
        return t ? t.estado === "pronta" && (id === s.itemsTask || !!s.store[id]) : ITEM_TASKS.includes(id);
      },
      genFor(id) {
        const g = generated.current;
        if (!g[id]) g[id] = id === "t1" ? seedItems() : (GENERATED[id] ? genItems(...GENERATED[id]) : []);
        return g[id];
      },
      itemsOf(id, s = ref.current) { return id === s.itemsTask ? s.items : (s.store[id] || (api.serverTask(id, s) ? [] : api.genFor(id))); },
      /** Troca os itens da Revisão para os da tarefa `tid`, guardando os da tarefa anterior. */
      swapTo(tid, s = ref.current) {
        const next = api.itemsOf(tid, s), first = next.find((i) => i.st !== "aprovada") || next[0];
        const store = s.itemsTask ? { ...s.store, [s.itemsTask]: s.items } : s.store;
        return { items: next, store, itemsTask: tid, sel: first ? first.id : null, filter: "todos" };
      },
      go(screen, extra = {}) {
        api.flushSaves();
        const st = ref.current;
        let tid = extra.taskId;
        // Com o servidor, a Revisão sem tarefa escolhida abre a primeira tarefa pronta.
        if (screen === "review" && !tid && !st.itemsTask) {
          const pronta = st.tarefas.find((t) => t.estado === "pronta");
          if (pronta) { tid = pronta.id; extra = { ...extra, taskId: tid }; }
        }
        let sw = {};
        if ((screen === "task" || screen === "review") && tid && tid !== st.itemsTask) {
          if (api.hasItems(tid)) sw = api.swapTo(tid);
          else if (api.serverTask(tid) && api.serverTask(tid).estado === "pronta") {
            // Itens ainda não lidos: troca quando chegarem, se a pessoa ainda estiver nesta tarefa.
            api.loadItems(tid).then((ok) => {
              if (ok) setState((c) => (c.taskId === tid && c.itemsTask !== tid ? { ...api.swapTo(tid, c), ...(extra.sel ? { sel: extra.sel } : null) } : {}));
            });
          }
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
        api.select(n.id);
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
      /** Lê a base do servidor. Sem servidor, a tela segue com a lista de exemplo. */
      async loadBase() {
        try {
          const { documentos } = await listarDocumentosDaBase();
          setState({ docs: documentos.map((d) => paraDocumentoDaTela(d)), baseOrigem: "servidor" });
        } catch {
          setState({ baseOrigem: "exemplo" });
        }
      },
      /** "Subir documentos": envia os .md escolhidos no computador para a mesma carga do comando carregar-base. */
      async sendDocs(files) {
        if (!files.length || ref.current.enviando) return;
        setState({ enviando: true });
        try {
          const { resumo, documentos } = await enviarDocumentosDaBase(files, api.name());
          setState({ docs: documentos.map((d) => paraDocumentoDaTela(d)), baseOrigem: "servidor", envio: resumo, enviando: false, ultimoEnvio: { resumo, em: dataHoraDaTela(new Date().toISOString()) } });
          const ok = resumo.carregados.length + resumo.atualizados.length + resumo.semMudanca.length;
          const falhas = resumo.recusados.length + resumo.ignorados.length;
          api.toast(falhas ? "Envio concluído com recusas" : "Envio concluído",
            `${ok} de ${files.length} arquivo${files.length > 1 ? "s" : ""} na base.${falhas ? " Veja os motivos na tela." : ""}`,
            falhas ? "warning" : "success");
        } catch (e) {
          setState({ enviando: false, ultimoEnvio: { erro: e.message, em: dataHoraDaTela(new Date().toISOString()) } });
          api.toast("Envio não concluído", e.message, "danger");
        }
      },
      closeSendResult() { setState({ envio: null }); },
      retryDoc(id) {
        setState((s) => ({ docs: s.docs.map((x) => (x.id === id ? { ...x, st: "processando", fate: null, ms: 1800 } : x)) }));
        setTimeout(() => setState((s) => ({ docs: s.docs.map((x) => (x.id === id ? { ...x, st: "pronto" } : x)) })), 1800);
      },
      async toggleDoc(d) {
        if (d.apiId !== undefined) {
          try {
            const { documento } = await definirDocumentoAtivo(d.apiId, d.off);
            const novo = paraDocumentoDaTela(documento);
            setState((s) => ({ docs: s.docs.map((q) => (q.id === novo.id ? novo : q)) }));
          } catch (e) {
            api.toast("Não foi possível alterar o documento", e.message, "danger");
            return;
          }
        } else {
          setState((s) => ({ docs: s.docs.map((q) => (q.id === d.id ? { ...q, off: !q.off } : q)) }));
        }
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
        const s = ref.current;
        if (!api.isServerItem(s)) { setState({ saved: Date.now() }); return; }
        // Texto vazio só é gravado na resposta manual (item sem sugestão): o item volta a "sem rascunho" (cenário 61).
        const key = s.itemsTask + "/" + s.sel, old = pendingSaves.current[key];
        if (old) clearTimeout(old.timer);
        const atual = s.items.find((i) => i.id === s.sel);
        if (text.trim() === "" && atual && atual.orig !== "") { delete pendingSaves.current[key]; return; }
        pendingSaves.current[key] = { tid: s.itemsTask, id: s.sel, pessoa: api.person(s).id, text, timer: setTimeout(() => api.flushSaves(key), 800) };
      },
      /** Escolhe o item na Revisão, gravando antes o texto pendente. */
      select(id) {
        api.flushSaves();
        setState({ sel: id, edit: false, showOrig: false });
      },
      /**
       * Ação de revisão gravada no backend (cenários 57 a 59): grava antes o texto pendente do item
       * e põe na tela o item devolvido. Devolve o item, ou null quando o backend recusou.
       */
      async serverAction(id, chamada, falha) {
        const s = ref.current, tid = s.itemsTask;
        await api.flushSaves(tid + "/" + id);
        try {
          const { item } = await chamada(tid, api.numberOf(id), api.person(s).id);
          api.applyServerItem(tid, item);
          return item;
        } catch (e) {
          api.toast(falha, e.message, "danger");
          return null;
        }
      },
      /**
       * Depois de tratar o alerta `idx`, o cartão passa ao próximo alerta pendente do item; sem
       * nenhum pendente, ele se recolhe e fica só o resumo, que abre o histórico.
       */
      nextAlert(id, idx) {
        // Atualização por função: o item reconhecido pode ainda não estar em `ref.current`.
        setState((s) => {
          const item = s.items.find((i) => i.id === id);
          if (!item) return {};
          const pend = item.alerts.map((a, k) => (a.ack ? -1 : k)).filter((k) => k >= 0);
          const next = pend.find((k) => k > idx) ?? pend[0];
          return next === undefined ? { alertAt: { id: null, i: 0 }, alertsOpen: null } : { alertAt: { id, i: next } };
        });
      },
      async ack(id, idx) {
        if (api.isServerItem()) {
          const alerta = ref.current.items.find((i) => i.id === id).alerts[idx];
          const item = await api.serverAction(id, (tid, n, p) => reconhecerAlertaNaApi(tid, n, p, alerta.t), "Alerta não reconhecido");
          const gravado = item && item.alerts.find((a) => a.t === alerta.t);
          if (gravado) {
            api.nextAlert(id, idx);
            api.toast("Alerta reconhecido", `${gravado.ack.by}, ${dataHoraDaTela(gravado.ack.at)}`);
          }
          return;
        }
        const by = api.name(), at = nowStr();
        api.upd(id, (i) => { i.alerts = i.alerts.map((a, k) => (k === idx ? { ...a, ack: { by, at } } : a)); return i; });
        api.nextAlert(id, idx);
        api.toast("Alerta reconhecido", `${by}, ${at}`);
      },
      async useSource(id, k) {
        // A escolhida vai para a frente da pilha de fontes; o cartão de alertas passa ao próximo pendente.
        const conflito = ref.current.items.find((i) => i.id === id).alerts.findIndex((a) => a.t === "conflict");
        const depois = () => { setState({ srcAt: { id: null, i: 0 } }); api.nextAlert(id, conflito); };
        if (api.isServerItem()) {
          if (await api.serverAction(id, (tid, n, p) => escolherFonteNaApi(tid, n, p, k), "Fonte não escolhida")) {
            depois();
            api.toast("Fonte escolhida", "O alerta de conflito foi reconhecido.");
          }
          return;
        }
        const by = api.name(), at = nowStr();
        api.upd(id, (i) => {
          i.srcs = i.srcs.map((s, n) => ({ ...s, chosen: n + 1 === k }));
          i.paras = i.paras.map((p) => ({ ...p, s: [k] }));
          i.alerts = i.alerts.map((a) => (a.t === "conflict" ? { ...a, ack: { by, at } } : a));
          return i;
        });
        depois();
        api.toast("Fonte escolhida", "O alerta de conflito foi reconhecido.");
      },
      async approve() {
        const s = ref.current, id = s.sel;
        if (api.isServerItem(s)) {
          const tid = s.itemsTask;
          await api.flushSaves(tid + "/" + id);
          let item;
          try {
            ({ item } = await aprovarItemNaApi(tid, api.numberOf(id), api.person(s).id));
            api.applyServerItem(tid, item);
          } catch (e) {
            api.toast("Item não aprovado", e.message, "danger");
            return;
          }
          const c = ref.current, next = c.items.find((i) => i.id !== id && i.st !== "aprovada");
          api.toast("Item aprovado", `${item.by} · ${dataHoraDaTela(item.at)}`);
          if (next && c.sel === id) setState({ sel: next.id, edit: false, showOrig: false });
          return;
        }
        const by = api.name(), at = nowStr();
        api.upd(id, (i) => { i.st = "aprovada"; i.by = by; i.at = at; return i; });
        const next = s.items.find((i) => i.id !== id && i.st !== "aprovada");
        api.toast("Item aprovado", `${by} · ${at}`);
        if (next) setState({ sel: next.id, edit: false, showOrig: false });
      },
      async revise(id) {
        if (api.isServerItem()) {
          if (await api.serverAction(id, revisarItemNaApi, "Item não marcado como revisado")) api.toast("Item revisado", "Pronto para aprovação.");
          return;
        }
        const by = api.name(), at = nowStr();
        api.upd(id, (i) => { i.st = "revisada"; i.rby = by; i.rat = at; return i; });
        api.toast("Item revisado", "Pronto para aprovação.");
      },
      async restore(id) {
        const s = ref.current;
        if (api.isServerItem(s)) {
          const tid = s.itemsTask, key = tid + "/" + id;
          if (pendingSaves.current[key]) { clearTimeout(pendingSaves.current[key].timer); delete pendingSaves.current[key]; }
          try {
            const { item } = await restaurarItem(tid, api.numberOf(id), api.person(s).id);
            api.applyServerItem(tid, item);
          } catch (e) {
            api.toast("Sugestão não restaurada", e.message, "danger");
            return;
          }
          api.toast("Sugestão restaurada", "O texto voltou ao rascunho original.", "neutral");
          return;
        }
        api.upd(id, (i) => { i.paras = i.orig.split(/\n\n/).map((t, k) => ({ t, s: (i.paras[k] && i.paras[k].s) || [] })); return i; });
        api.toast("Sugestão restaurada", "O texto voltou ao rascunho original.", "neutral");
      },
      confirmEdit(id) {
        // Item do banco: a aprovação só sai quando o texto editado é gravado (cenário 42).
        if (id && !api.isServerItem()) api.upd(id, (i) => { i.st = "em-revisao"; return i; });
        setState({ dialog: false, edit: true });
        api.toast("Aprovação removida", "O item voltou para Em revisão.", "neutral");
      },
      demoAll() {
        const by = "Marcelo Vieira", at = nowStr();
        setState((s) => ({ items: s.items.map((i) => ({ ...i, st: "aprovada", by: i.by || by, at: i.at || at, alerts: i.alerts.map((a) => (a.ack ? a : { ...a, ack: { by, at } })) })) }));
        api.toast("Demo", "Todos os itens aprovados e sem alerta pendente.", "neutral");
      },
      /** Lê as tarefas do servidor. Sem servidor (e sem nunca ter falado com ele), seguem as de exemplo. */
      async loadTasks() {
        let tarefas;
        try {
          ({ tarefas } = await listarTarefas());
        } catch {
          if (ref.current.tarefasOrigem !== "servidor") setState({ tarefasOrigem: "exemplo" });
          return;
        }
        const s = ref.current, antes = new Map(s.tarefas.map((t) => [t.id, t.estado]));
        if (!s.pessoas.length) listarPessoas().then(({ pessoas }) => setState({ pessoas })).catch(() => {});
        const nome = (t) => (t.dados && t.dados.nome) || t.arquivo;
        for (const t of tarefas) {
          if (antes.get(t.id) !== "processando") continue;
          if (t.estado === "pronta") api.toast("Tarefa pronta", `${nome(t)}: ${t.total} itens para revisar.`);
          if (t.estado === "falha") api.toast("A tarefa falhou", `${nome(t)}: ${t.motivo || "sem motivo registrado"}`, "danger");
        }
        // Ao conectar, os itens de exemplo saem da Revisão (uma vez só, mesmo com duas leituras ao mesmo tempo).
        setState((x) => ({ tarefas, tarefasOrigem: "servidor", ...(x.tarefasOrigem !== "servidor" ? { items: [], itemsTask: null, store: {}, sel: null } : null) }));
        // Itens das tarefas prontas ainda não lidos: os contadores e o histórico dependem deles.
        const c = ref.current;
        for (const t of tarefas) if (t.estado === "pronta" && t.id !== c.itemsTask && !c.store[t.id]) await api.loadItems(t.id);
        // A tarefa aberta terminou de processar: o detalhe passa a mostrar os itens dela.
        // Atualização por função: fora de um evento, `ref.current` só reflete o setState depois do render.
        setState((d) => (d.screen === "task" && d.taskId !== d.itemsTask && api.hasItems(d.taskId, d) ? api.swapTo(d.taskId, d) : {}));
      },
      /** "Esta resposta ajudou?": positiva grava na hora; negativa grava quando o motivo é escolhido (cenário 46). */
      async rate(value, reason) {
        const s = ref.current, id = s.sel, key = (s.itemsTask || "") + "/" + id;
        setState((x) => ({ fb: { ...x.fb, [key]: { value, reason: reason || null } } }));
        if (!api.isServerItem(s) || (value === "down" && !reason)) return;
        try {
          await avaliarItemNaApi(s.itemsTask, api.numberOf(id), api.person(s).id, value === "up" ? "positiva" : "negativa", reason);
          api.toast("Avaliação registrada", value === "up" ? "Resposta marcada como útil." : `Motivo: ${reason}.`, "neutral");
        } catch (e) {
          api.toast("Avaliação não registrada", e.message, "danger");
        }
      },
      /** Avaliações gravadas da pessoa que age, para mostrar o polegar marcado. */
      async loadFeedback(tid) {
        try {
          const { avaliacoes } = await listarAvaliacoes(tid);
          const nome = api.name();
          const mine = Object.fromEntries(avaliacoes.filter((a) => a.pessoa === nome)
            .map((a) => [tid + "/" + a.item, { value: a.valor === "positiva" ? "up" : "down", reason: a.motivo }]));
          setState((s) => {
            const fb = Object.fromEntries(Object.entries(s.fb).filter(([k]) => !k.startsWith(tid + "/")));
            return { fb: { ...fb, ...mine } };
          });
        } catch {
          // Sem as avaliações, os polegares só aparecem desmarcados.
        }
      },
      /** Lê os itens de uma tarefa pronta e guarda em `store`. Devolve false se não conseguiu. */
      async loadItems(id) {
        try {
          // O total vem da própria lista: a tarefa guardada na tela pode ainda ser a recém-criada, com total 0.
          const { itens } = await listarItensDaTarefa(id);
          const items = itens.map((i) => paraItemDaTela(i, itens.length));
          setState((s) => (s.itemsTask === id ? { items } : { store: { ...s.store, [id]: items } }));
          api.loadFeedback(id);
          return true;
        } catch (e) {
          api.toast("Não foi possível ler os itens", e.message, "danger");
          return false;
        }
      },
      /** Baixa a planilha preenchida com o estado atual da revisão (GET /api/tarefas/:id/planilha, cenário 24). */
      downloadSheet(id) {
        const link = document.createElement("a");
        link.href = enderecoDaPlanilha(id);
        link.download = "";
        document.body.appendChild(link);
        link.click();
        link.remove();
      },
      /** Arquivo escolhido em Nova RFP. Só .xlsx (cenário 4); o nome da tarefa vem do arquivo, se estiver vazio. */
      pickRfp(file) {
        if (!file) return;
        const ok = /\.xlsx$/i.test(file.name);
        setState((s) => ({ form: { ...s.form, file: ok ? file : null, fileError: ok ? null : MENSAGEM_FORMATO_DA_RFP, name: ok && !s.form.name ? file.name.replace(/\.xlsx$/i, "") : s.form.name } }));
      },
      /** Envia a planilha e os campos para POST /api/tarefas e abre a tarefa, que processa em segundo plano. */
      async createTask() {
        const s = ref.current, f = s.form;
        if (s.criando || !f.file) return;
        setState({ criando: true });
        const contatos = f.contacts
          .filter((c) => c.name || c.role || c.phone || c.email)
          .map((c) => ({ nome: c.name, cargo: c.role, telefone: c.phone, email: c.email }));
        const dados = { nome: f.name, empresa: f.company, tipo: f.type, prazo: f.due, responsavel: f.owner, contatos, ...(f.cnpj ? { cnpj: f.cnpj } : null) };
        try {
          const { tarefa } = await criarTarefa(f.file, dados);
          setState((x) => ({ criando: false, form: emptyForm(), tarefas: [tarefa, ...x.tarefas.filter((t) => t.id !== tarefa.id)], tarefasOrigem: "servidor" }));
          api.go("task", { taskId: tarefa.id });
          api.toast("Tarefa criada", "A planilha está em processamento. Você pode sair desta tela.");
        } catch (e) {
          setState((x) => ({ criando: false, form: { ...x.form, fileError: e.message } }));
          api.toast("Tarefa não criada", e.message, "danger");
        }
      },
      /** Pede a confirmação antes de excluir (cenário 60). */
      askDeleteTask(id) { setState({ deleting: id }); },
      /** Exclui a tarefa no backend e a tira de todas as telas; quem estava nela volta para Tarefas. */
      async deleteTask() {
        const s = ref.current, id = s.deleting;
        if (!id || s.excluindo) return;
        const nome = api.taskInfo(id).name;
        setState({ excluindo: true });
        try {
          await excluirTarefa(id);
        } catch (e) {
          setState({ excluindo: false, deleting: null });
          api.toast("Tarefa não excluída", e.message, "danger");
          return;
        }
        setState((x) => {
          const store = { ...x.store };
          delete store[id];
          const aberta = x.itemsTask === id;
          return {
            excluindo: false, deleting: null, store, tarefas: x.tarefas.filter((t) => t.id !== id),
            ...(aberta ? { items: [], itemsTask: null, sel: null } : null),
            ...((x.screen === "task" || x.screen === "review" || x.screen === "export") && (x.taskId === id || aberta) ? { screen: "tasks" } : null)
          };
        });
        api.toast("Tarefa excluída", `${nome} e todos os registros dela foram apagados.`, "neutral");
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
        const t = api.serverTask(id, s);
        if (t) return api.serverTaskInfo(t, s);
        if (!TASKS[id]) return undefined;
        const x = { ...TASKS[id] };
        if (id === "t5") x.isFailed = !s.taskRetry;
        if (api.hasItems(id, s)) { const cc = api.counts(id, s); x.items = cc.total; x.approvedN = cc.approved; x.hasItems = true; }
        if (x.approvedN != null) {
          const left = x.items - x.approvedN;
          x.pct = Math.round((x.approvedN / x.items) * 100);
          x.progText = x.approvedN + " de " + x.items + " itens aprovados.";
          x.shortProg = x.approvedN + " de " + x.items + " aprovados";
          x.reviewNote = (x.dueText === "Vencida" ? "Prazo vencido em " + x.due + ". " : "Dentro do prazo. ") + "Faltam " + left + " itens para a exportação ser liberada.";
        }
        return x;
      },
      /** Resumo de uma tarefa do servidor no mesmo formato de TASKS (data.js). */
      serverTaskInfo(t, s = ref.current) {
        const d = t.dados || {};
        const x = {
          id: t.id, name: d.nome || t.arquivo, company: d.empresa || "Empresa não informada", type: d.tipo || "RFP", items: t.total,
          ...prazoDaTela(d.prazo), dueColor: "#12140F", owner: d.responsavel || "—", isServer: true, file: t.arquivo,
          isProcessing: t.estado === "processando", isFailed: t.estado === "falha", reason: t.motivo, done: t.processadas,
          when: dataHoraDaTela(t.concluidaEm || t.criadaEm)
        };
        if (api.hasItems(t.id, s)) {
          const cc = api.counts(t.id, s);
          Object.assign(x, { items: cc.total, approvedN: cc.approved, hasItems: true, isReady: cc.total > 0 && cc.approved === cc.total && cc.alerts === 0 });
          const left = cc.total - cc.approved;
          x.pct = cc.total ? Math.round((cc.approved / cc.total) * 100) : 0;
          x.progText = cc.approved + " de " + cc.total + " itens aprovados.";
          x.shortProg = cc.approved + " de " + cc.total + " aprovados";
          x.reviewNote = (x.dueText === "Vencida" ? "Prazo vencido em " + x.due + ". " : "") + "Faltam " + left + " itens para aprovar.";
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

  // Lê a base do servidor ao abrir o Workspace e a cada entrada na Base de conhecimento ou em Primeiros passos.
  React.useEffect(() => { ws.loadBase(); }, [ws]);
  React.useEffect(() => {
    ws.iniciarSessao();
    // Sessão que expira ou acaba em outra aba: volta ao login, se a pessoa estava dentro.
    quandoPerderASessao(() => {
      if (!ws.s.sessao) return;
      ws.setState({ sessao: null, view: "login" });
      ws.toast("Sessão encerrada", "Entre novamente para continuar.", "danger");
    });
  }, [ws]);
  React.useEffect(() => { if (state.screen === "base" || state.screen === "onboarding") ws.loadBase(); }, [ws, state.screen]);
  // Tarefas: lê ao abrir e ao entrar nas telas que as mostram; enquanto alguma processa, consulta o estado a cada 2 segundos.
  React.useEffect(() => { if (["dashboard", "tasks", "task", "export", "review"].includes(state.screen)) ws.loadTasks(); }, [ws, state.screen]);
  const processing = state.tarefas.some((t) => t.estado === "processando");
  React.useEffect(() => {
    if (!processing) return undefined;
    const timer = setInterval(() => ws.loadTasks(), 2000);
    return () => clearInterval(timer);
  }, [ws, processing]);

  return { state, ws };
}
