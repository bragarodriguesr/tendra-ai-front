import React from "react";
import { Badge, Button, EmptyState, Icon, IconButton, Input, MonoLabel, Select, Textarea, FilterMenu, Tooltip } from "../../ds/index.js";
import { AlertDeck, ClickRow, DISPLAY, card, mono } from "../ui.jsx";
import { SendResult } from "./Base.jsx";
import { ReadOnlyNote } from "./TaskDetail.jsx";

/** Uma área na lista do cabeçalho do item, no estilo das opções do `FilterMenu` (fase S, S3). */
function OpcaoDeArea({ area, atual, desabilitada, onEscolher, onTeclado }) {
  const [destaque, setDestaque] = React.useState(false);
  return (
    <button
      type="button" role="option" aria-selected={atual} aria-disabled={desabilitada || undefined} tabIndex={atual ? 0 : -1}
      data-area={area} onClick={() => { if (!desabilitada) onEscolher(area); }} onKeyDown={onTeclado}
      onMouseEnter={() => setDestaque(true)} onMouseLeave={() => setDestaque(false)} onFocus={() => setDestaque(true)} onBlur={() => setDestaque(false)}
      style={{
        display: "flex", alignItems: "center", gap: "var(--space-2)", width: "100%", minHeight: 36, padding: "6px 10px",
        border: 0, borderRadius: "var(--radius-sm)", background: destaque ? "var(--n-075)" : "transparent",
        fontFamily: "var(--font-sans)", fontSize: "var(--text-ui-size)", fontWeight: atual ? "var(--weight-semibold)" : "var(--weight-regular)",
        color: "var(--text-strong)", textAlign: "left", cursor: desabilitada ? "progress" : "pointer", opacity: desabilitada && !atual ? 0.6 : 1,
        transition: "background var(--duration-fast) var(--ease-out)"
      }}
    >
      <span style={{ width: 16, display: "inline-flex" }}>{atual ? <Icon name="check" size={14} /> : null}</span>
      <span style={{ flex: 1 }}>{area}</span>
    </button>
  );
}

/**
 * Área da pergunta no cabeçalho do item (fase S, S1 a S6): o mesmo nome para todos; quem pode trocar a
 * área (PN7) ganha o botão "Alterar área", com o lápis, que abre a lista por cima do nome, como no Painel
 * de Usuários. Fecha com um clique fora ou com Esc, e o foco volta ao botão.
 */
function AreaDoItem({ cur, ws }) {
  const raiz = React.useRef(null), lista = React.useRef(null);
  const [deslocamento, setDeslocamento] = React.useState(0);
  const [porCima, setPorCima] = React.useState(false);
  // O botão some e volta ao trocar de item ou de permissão: o fundo preto não pode ficar preso.
  React.useEffect(() => { setPorCima(false); }, [cur.id, cur.canChangeArea]);
  const lapis =() => raiz.current && raiz.current.querySelector("[data-lapis] button");
  const fechar = () => { ws.fecharAreaDoItem(); const b = lapis(); if (b) b.focus(); };

  React.useEffect(() => {
    if (!cur.areaAberta) return undefined;
    const fora = (e) => { if (raiz.current && !raiz.current.contains(e.target)) fechar(); };
    document.addEventListener("mousedown", fora);
    return () => document.removeEventListener("mousedown", fora);
  }, [cur.areaAberta]); // eslint-disable-line react-hooks/exhaustive-deps

  // Ao abrir: foco na área atual e, no celular, a lista empurrada para dentro da tela (S6).
  React.useLayoutEffect(() => {
    if (!cur.areaAberta || !lista.current) { setDeslocamento(0); return; }
    const caixa = lista.current.getBoundingClientRect(), sobra = window.innerWidth - 16 - caixa.right;
    if (sobra < 0) setDeslocamento((d) => d + sobra);
    const atual = lista.current.querySelector('[aria-selected="true"]');
    if (atual) atual.focus();
  }, [cur.areaAberta]);

  // Setas percorrem as áreas, Home e End vão às pontas, Esc fecha (S5). Enter e Espaço escolhem pelo clique do botão.
  const teclado = (e) => {
    const opcoes = [...lista.current.querySelectorAll('[role="option"]')], i = opcoes.indexOf(document.activeElement);
    const ir = (n) => { e.preventDefault(); opcoes[(n + opcoes.length) % opcoes.length].focus(); };
    if (e.key === "ArrowDown") ir(i + 1);
    else if (e.key === "ArrowUp") ir(i - 1);
    else if (e.key === "Home") ir(0);
    else if (e.key === "End") ir(opcoes.length - 1);
    else if (e.key === "Escape") { e.preventDefault(); e.stopPropagation(); fechar(); }
    else if (e.key === "Tab") fechar();
  };
  const escolher = async (area) => {
    await ws.changeArea(cur.id, area);
    const b = lapis();
    if (b) b.focus();
  };

  return (
    <div ref={raiz} style={{ position: "relative", display: "inline-flex", alignItems: "center", gap: 4 }}>
      <span aria-label={`Área: ${cur.area}`} style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13, color: "var(--n-700)" }}><Icon name="building-2" size="sm" />{cur.area}</span>
      {cur.canChangeArea ? (
        <span data-lapis style={{ display: "inline-flex", marginLeft: 8 }}>
          {/* Botão "Alterar área" (proposta A de 08/11/2026): contorno cinza como os botões secundários da
              tela ("Editar resposta") e fundo preto ao passar o mouse. O texto dispensa a dica. */}
          <Button
            variant="secondary" size="sm" icon="pencil" onClick={() => ws.abrirAreaDoItem(cur.id)}
            onMouseEnter={() => setPorCima(true)} onMouseLeave={() => setPorCima(false)}
            style={porCima ? { background: "var(--action-primary-bg)", borderColor: "var(--action-primary-bg)", color: "var(--action-primary-fg)" } : undefined}
            aria-haspopup="listbox" aria-expanded={!!cur.areaAberta}
          >
            Alterar área
          </Button>
        </span>
      ) : null}
      {cur.areaAberta ? (
        <div
          ref={lista} role="listbox" aria-label="Área da pergunta" aria-busy={cur.trocandoArea || undefined}
          style={{
            position: "absolute", top: 0, left: deslocamento, zIndex: 70, width: "min(260px, calc(100vw - 32px))", boxSizing: "border-box", padding: 6,
            display: "grid", background: "var(--surface-card)", border: "1px solid var(--border-default)",
            borderRadius: "var(--radius-lg)", boxShadow: "var(--shadow-popover)", animation: "tdr-rise var(--duration-fast) var(--ease-out)"
          }}
        >
          {cur.areaOptions.map((a) => (
            <OpcaoDeArea key={a} area={a} atual={a === cur.area} desabilitada={cur.trocandoArea} onEscolher={escolher} onTeclado={teclado} />
          ))}
        </div>
      ) : null}
    </div>
  );
}

const FB_REASONS =["Fonte incorreta", "Texto impreciso", "Informação desatualizada", "Outro"];
const fbStyle = (on) => ({
  display: "flex", alignItems: "center", justifyContent: "center", width: 40, height: 40, borderRadius: 9, cursor: "pointer",
  ...(on ? { background: "var(--n-900)", color: "var(--n-050)", border: "1px solid var(--n-900)" } : { background: "var(--n-000)", color: "var(--n-900)", border: "1px solid var(--n-350)" })
});

function ItemList({ v, ws, state, isMobile }) {
  return (
    <div style={{ borderRight: isMobile ? 0 : "1px solid var(--n-200)", display: "flex", flexDirection: "column", minHeight: 0, background: "var(--n-050)" }}>
      <div style={{ padding: "20px 20px 12px", display: "flex", flexDirection: "column", gap: 12 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontFamily: DISPLAY, fontWeight: 600, fontSize: 18, color: "var(--n-900)" }}>Itens</span>
          <span style={mono(12, "var(--n-400)")}>{v.rowsDaBusca.length} de {v.counts.total}</span>
        </div>
        <div style={{ fontSize: 12, color: "var(--n-500)", lineHeight: 1.4 }}>{v.revTask}</div>
        <Input
          icon="search" placeholder="Buscar por palavras ou código" aria-label="Buscar perguntas"
          value={state.busca} onChange={(e) => ws.setBusca(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Escape") ws.setBusca(""); }}
        />
        <FilterMenu items={v.filterTabs} value={state.filter} onChange={ws.setFilter} />
      </div>
      <div style={{ flex: 1, overflow: "auto" }}>
        {v.buscaSemResultado ? (
          <div style={{ padding: "0 20px" }}><EmptyState icon="search" title="Nenhuma pergunta encontrada." description="Confira as palavras ou limpe a busca." /></div>
        ) : null}
        {v.rowsDaBusca.map((r) => (
          <ClickRow key={r.id} className="" onClick={() => { r.open(); if (isMobile) ws.setState({ reviewPane: "item" }); }} aria-current={r.active || undefined} style={{
            display: "flex", flexDirection: "column", gap: 6, padding: "14px 20px", borderTop: "1px solid var(--n-200)", fontSize: 14,
            background: r.active ? "var(--n-000)" : "transparent", boxShadow: r.active ? "inset 2px 0 0 var(--n-900)" : "none"
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={mono(12)}>{r.code}</span>
              {r.hasAlert ? <span style={{ display: "flex", alignItems: "center", gap: 4, color: r.alertTone === "warning" ? "var(--warning)" : "var(--danger)", fontSize: 12, fontWeight: 500 }}><Icon name="triangle-alert" size="sm" />{r.alertText}</span> : null}
            </div>
            <div style={{ color: "var(--n-900)", lineHeight: 1.4 }}>{r.q}</div>
            <span style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "var(--n-500)", flexWrap: "wrap" }}>
              <Icon name={r.icon} size="sm" />{r.st}
              {/* Área da pergunta (fase N, cenário N8). */}
              <span aria-hidden="true">·</span><Icon name="building-2" size="sm" /><span>{r.area}</span>
            </span>
          </ClickRow>
        ))}
      </div>
    </div>
  );
}

/** Todos os alertas tratados: o cartão recolhe num resumo, que abre o histórico. */
function AlertsResolved({ cur, ws }) {
  const n = cur.alerts.length;
  return (
    <button
      type="button" onClick={() => ws.setState({ alertsOpen: cur.id })} aria-expanded="false"
      style={{ alignSelf: "flex-start", display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", borderRadius: 999, border: "1px solid var(--n-200)", background: "var(--n-000)", color: "#4B5046", cursor: "pointer", font: "inherit", fontSize: 13 }}
    >
      <Icon name="check-check" size="sm" />
      <span>{n > 1 ? `Todos os ${n} alertas tratados` : "Alerta tratado"}</span>
      <span style={mono(12, "var(--n-500)")}>· ver histórico</span>
      <Icon name="chevron-down" size="sm" />
    </button>
  );
}

function ItemAlerts({ cur, ws }) {
  if (!cur.alertsOpen) return <AlertsResolved cur={cur} ws={ws} />;
  const a = cur.alert;
  const move = (d) => ws.setState({ alertAt: { id: cur.id, i: (cur.alertIndex + d + cur.alerts.length) % cur.alerts.length } });
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
    {cur.allResolved ? (
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
        <span style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "#4B5046" }}><Icon name="check-check" size="sm" />Histórico de alertas · todos tratados</span>
        <Button size="sm" variant="ghost" icon="minus" onClick={() => ws.setState({ alertsOpen: null })} aria-expanded="true">Recolher</Button>
      </div>
    ) : null}
    <AlertDeck
      deck={cur} pending={a.pending} tone={a.tone} icon={a.icon} label={a.label} suffix={a.pending ? <span>· pendente</span> : null}
      pos={cur.hasMany ? cur.alertPos : null} onPrev={() => move(-1)} onNext={() => move(1)}
    >
      {a.text ? <div style={{ color: "var(--n-900)", lineHeight: 1.5 }}>{a.text}</div> : null}
      {a.showAck ? <div><Button size="sm" variant="secondary" icon="check" onClick={a.ack}>Reconhecer alerta</Button></div> : null}
      {a.showNone ? (
        <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          <Button size="sm" variant="secondary" icon="pencil" onClick={a.none}>Nenhuma, vou escrever</Button>
          <span style={{ fontSize: 13, color: "var(--n-400)" }}>Ou use “Usar esta fonte” no painel abaixo.</span>
        </div>
      ) : null}
      {a.isAck ? <span style={mono(12, "var(--n-500)")}>{a.ackText}</span> : null}
    </AlertDeck>
    </div>
  );
}

/**
 * Editor da resposta manual com "Revisar com IA" no canto inferior direito (cenário 65): desabilitado
 * até 30 palavras; habilitado, com o gradiente animado em limão.
 */
function ManualEditor({ cur, ws }) {
  const r = cur.aiReview;
  return (
    <div style={{ position: "relative" }}>
      <Textarea rows={8} value={cur.text} placeholder="Escreva a resposta. Separe parágrafos com uma linha em branco." onChange={(e) => ws.onDraft(e.target.value)} aria-label="Resposta" autoFocus readOnly={r.loading} style={{ paddingBottom: 56, display: "block" }} />
      <div style={{ position: "absolute", right: 10, bottom: 10, display: "flex", alignItems: "center", gap: 10 }}>
        {r.canUndo && !r.loading ? <Button size="sm" variant="ghost" icon="refresh-cw" onClick={ws.undoAiReview}>Desfazer revisão</Button> : null}
        {!r.ready && !r.loading ? <span style={mono(11, "var(--n-400)")}>{r.words} de {r.min} palavras</span> : null}
        <button
          type="button" className={"tdr-ai-btn" + (r.loading ? " is-loading" : "")} disabled={!r.ready} aria-busy={r.loading || undefined}
          title={r.ready ? "Revisa gramática, norma escrita, coerência e clareza, sem acrescentar informação." : r.loading ? "Revisando…" : `Escreva ao menos ${r.min} palavras para revisar com IA.`}
          onClick={ws.reviseWithAi}
        >
          <Icon name={r.loading ? "loader-circle" : "sparkles"} size="sm" />{r.loading ? "Revisando…" : "Revisar com IA"}
        </button>
      </div>
    </div>
  );
}

/**
 * Fontes de cada parágrafo enquanto a resposta é editada: o texto puro do editor não mostra os
 * marcadores, e cada parágrafo mantém as fontes da sua posição (revisão de design de 05/11/2026).
 */
function EditorSources({ paras }) {
  if (!paras.some((p) => p.marks.length)) return null;
  return (
    <div role="group" aria-label="Fontes por parágrafo" style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "6px 16px", fontSize: 13, color: "var(--n-500)" }}>
      <span style={mono(11, "var(--n-400)", { letterSpacing: ".1em", textTransform: "uppercase" })}>Fontes por parágrafo</span>
      {paras.map((p, n) => (
        <span key={n} style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
          <span>Parágrafo {n + 1}</span>
          {p.marks.length ? p.marks.map((m) => (
            <button key={m.k} type="button" className="tdr-src-mark" onClick={m.open} aria-label={`${m.aria} (parágrafo ${n + 1})`}>{m.k}</button>
          )) : <span style={{ color: "var(--n-400)" }}>sem fonte</span>}
        </span>
      ))}
    </div>
  );
}

function Answer({ v, ws, state, cur }) {
  const startEdit = () => (cur.isApproved ? ws.setState({ dialog: true }) : ws.setState({ edit: true }));
  const editAction = !cur.canEdit ? null : state.edit
    ? <Button size="sm" variant="secondary" icon="check" onClick={() => { ws.flushSaves(); ws.setState({ edit: false }); }}>Concluir edição</Button>
    : <Button size="sm" variant="secondary" icon="pencil" onClick={startEdit}>Editar resposta</Button>;
  return (
    <div style={card(16, { padding: 24, display: "flex", flexDirection: "column", gap: 16 })}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        <MonoLabel>{cur.noSource ? "Resposta sem fonte" : "Resposta"}</MonoLabel>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          {cur.readOnly ? null : <span style={mono(12, "var(--n-400)")}>{v.savedText}</span>}
          {cur.edited ? (
            <>
              {/* Só ícones; a descrição aparece ao passar o cursor (ou no foco). */}
              <Tooltip content={state.showOrig ? "Ocultar sugestão original" : "Ver sugestão original"} placement="bottom">
                <IconButton size="sm" variant="ghost" icon="eye" label={state.showOrig ? "Ocultar sugestão original" : "Ver sugestão original"} aria-pressed={state.showOrig} onClick={() => ws.setState({ showOrig: !state.showOrig })} />
              </Tooltip>
              {cur.canRestore ? (
                <Tooltip content="Restaurar sugestão" placement="bottom">
                  <IconButton size="sm" variant="ghost" icon="refresh-cw" label="Restaurar sugestão" onClick={() => ws.restore(cur.id)} />
                </Tooltip>
              ) : null}
            </>
          ) : null}
          {cur.noSource ? null : editAction}
        </div>
      </div>
      {state.showOrig ? (
        <div style={{ padding: "12px 16px", background: "var(--n-100)", borderRadius: 8, lineHeight: 1.6, whiteSpace: "pre-line" }}>
          <div style={{ ...mono(11, "var(--n-400)"), letterSpacing: ".1em", textTransform: "uppercase", marginBottom: 6 }}>Sugestão original</div>
          {cur.orig}
        </div>
      ) : null}
      {state.edit ? (
        cur.aiReview ? <ManualEditor cur={cur} ws={ws} /> : (
          <>
            <Textarea rows={8} value={cur.text} placeholder="Escreva a resposta. Separe parágrafos com uma linha em branco." onChange={(e) => ws.onDraft(e.target.value)} aria-label="Resposta" autoFocus />
            <EditorSources paras={cur.paras} />
          </>
        )
      ) : (
        <>
          {cur.noText ? <div style={{ color: "var(--n-400)", lineHeight: 1.6 }}>Não encontramos informação na base para esta pergunta. Adicione conhecimento ou escreva a resposta manualmente.</div> : null}
          {cur.paras.map((p, n) => (
            <div key={n} style={{ display: "flex", gap: 12, alignItems: "flex-start", fontSize: 16, lineHeight: 1.65, color: "var(--n-700)" }}>
              <span style={{ flex: 1 }}>{p.t}</span>
              <span style={{ display: "flex", gap: 4, flexShrink: 0, paddingTop: 2 }}>
                {p.marks.map((m) => (
                  <button key={m.k} type="button" className="tdr-src-mark" onClick={m.open} aria-label={m.aria}>{m.k}</button>
                ))}
              </span>
            </div>
          ))}
        </>
      )}
      {cur.noSource && !cur.readOnly ? <AddKnowledge key={cur.id} ws={ws} state={state} editAction={editAction} /> : null}
      {cur.hasManual ? (
        <div style={{ ...mono(12, "var(--n-500)"), display: "flex", alignItems: "center", gap: 6 }}>
          <Icon name="file-text" size="sm" />Resposta manual, sem fonte na base · escrita por {cur.manualBy}
        </div>
      ) : null}
      {cur.isApproved ? (
        <div style={{ display: "flex", alignItems: "center", gap: 8, paddingTop: 12, borderTop: "1px solid var(--n-100)" }}>
          <Badge tone="approved" icon="shield-check">Aprovado por {cur.by} · {cur.at}</Badge>
        </div>
      ) : null}
    </div>
  );
}

/** Cartão de uma fonte. A não escolhida num conflito já decidido fica cinza, só como histórico. */
function SourceCard({ s, style }) {
  const off = s.discarded;
  return (
    <div aria-disabled={off || undefined} style={card(14, {
      display: "flex", flexDirection: "column", gap: 12, padding: 16,
      borderColor: s.conflict ? "var(--danger)" : "var(--n-200)",
      ...(off ? { background: "var(--n-100)", color: "var(--n-400)" } : null), ...style
    })}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ ...mono(11, off ? "var(--n-400)" : undefined), fontWeight: 500, background: off ? "var(--n-200)" : "var(--n-100)", borderRadius: 6, padding: "2px 8px" }}>[{s.k}]</span>
        <span style={{ fontSize: 12, color: "var(--n-400)" }}>{s.type}</span>
      </div>
      <div style={{ ...mono(13, off ? "var(--n-400)" : undefined), lineHeight: 1.4, wordBreak: "break-word" }}>{s.doc} · {s.loc}</div>
      <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
        <span style={mono(12, off ? "var(--n-400)" : "var(--n-700)")}>{s.ageText}</span>
        {s.old && !off ? <Badge tone="warning" icon="clock">Mais de 120 dias</Badge> : null}
        {s.conflict ? <Badge tone="danger" icon="copy">Em conflito</Badge> : null}
        {s.chosen ? <Badge tone="approved" icon="check">Fonte escolhida</Badge> : null}
        {off ? <Badge tone="neutral" icon="minus">Não escolhida</Badge> : null}
      </div>
      <div style={{ display: "flex", gap: 8, marginTop: "auto" }}>
        <Button size="sm" variant="secondary" icon="external-link" onClick={s.open}>Abrir no trecho</Button>
        {s.canUse ? <Button size="sm" icon="check" onClick={s.use}>Usar esta fonte</Button> : null}
      </div>
    </div>
  );
}

/** Fontes em conflito como cartões sobrepostos: a escolhida fica na frente; setas passam pelas demais. */
function ConflictSources({ cur, ws }) {
  const d = cur.srcDeck;
  const move = (n) => ws.setState({ srcAt: { id: cur.id, i: (d.index + n + d.count) % d.count } });
  return (
    <div role="region" aria-label="Fontes em conflito" style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
        <span style={{ fontSize: 13, color: d.pending ? "#A8402E" : "#4B5046", display: "flex", alignItems: "center", gap: 6 }}>
          <Icon name="copy" size="sm" />{d.pending ? "Fontes em conflito: escolha qual vale" : "Fontes em conflito · decidido"}
        </span>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <IconButton icon="chevron-left" label="Fonte anterior" onClick={() => move(-1)} />
          <span style={{ ...mono(12, "var(--n-700)"), whiteSpace: "nowrap" }}>Fonte {d.pos}</span>
          <IconButton icon="chevron-right" label="Próxima fonte" onClick={() => move(1)} />
        </div>
      </div>
      <div style={{ position: "relative", paddingBottom: d.pad }}>
        {d.layers.map((ly, i) => <div key={i} style={ly} />)}
        <SourceCard s={d.cur} style={{ position: "relative", zIndex: 5 }} />
      </div>
    </div>
  );
}

/** Envio de conhecimento sem sair da resposta em edição. */
function AddKnowledge({ ws, state, editAction }) {
  const picker = React.useRef(null);
  const [upload, setUpload] = React.useState(null);
  const [sending, setSending] = React.useState(false);
  const send = async (e) => {
    const files = Array.from(e.target.files || []);
    e.target.value = "";
    if (!files.length || state.enviando) return;
    setUpload(null);
    setSending(true);
    const result = await ws.sendDocs(files);
    setSending(false);
    setUpload(result);
  };
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <input ref={picker} type="file" accept=".md,text/markdown" multiple hidden onChange={send} aria-label="Documentos para a base de conhecimento" />
      <div role="group" aria-label="Ações da resposta sem fonte" style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
        {editAction}
        <Button size="sm" variant="secondary" icon="upload" loading={sending} disabled={state.enviando && !sending} onClick={() => picker.current.click()}>Adicionar conhecimento</Button>
      </div>
      {upload?.erro ? <div role="alert" style={{ color: "var(--danger)", lineHeight: 1.5 }}>{upload.erro}</div> : null}
      {upload?.resumo ? <SendResult result={upload.resumo} onClose={() => setUpload(null)} /> : null}
    </div>
  );
}

const SOURCE_GRID = { display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(300px,100%),1fr))", gap: 16 };

function Sources({ cur, ws }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <MonoLabel>Fontes · {cur.srcs.length || "Nenhuma fonte localizada"}</MonoLabel>
      {cur.srcDeck ? <ConflictSources cur={cur} ws={ws} /> : null}
      {cur.otherSrcs.length ? (
        <div style={SOURCE_GRID}>
          {cur.otherSrcs.map((s) => <SourceCard key={s.k} s={s} />)}
        </div>
      ) : null}
    </div>
  );
}

export function Review({ v, ws, state, height, isMobile }) {
  const cur = v.cur;

  // Celular: duas etapas (lista → item). Desktop: lista e item lado a lado.
  const showList = !isMobile || state.reviewPane !== "item";
  const showItem = !isMobile || state.reviewPane === "item";
  const padX = isMobile ? 16 : 40;
  return (
    <div style={{ display: "grid", gridTemplateColumns: isMobile ? "minmax(0,1fr)" : "minmax(260px,320px) minmax(0,1fr)", height }}>
      {showList ? <ItemList v={v} ws={ws} state={state} isMobile={isMobile} /> : null}
      {showItem ? (
      <div style={{ display: "flex", flexDirection: "column", minHeight: 0, background: "var(--n-050)" }}>
        {isMobile ? (
          <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 8px 8px 4px", borderBottom: "1px solid var(--n-200)", background: "var(--n-000)" }}>
            <Button size="sm" variant="ghost" icon="chevron-left" onClick={() => ws.setState({ reviewPane: "list", edit: false })}>Itens</Button>
            <span style={{ ...mono(12, "var(--n-500)"), flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{v.revTask}</span>
          </div>
        ) : null}
        {cur ? (
          <>
            <div style={{ flex: 1, overflow: "auto", padding: isMobile ? "20px 16px" : "28px 40px", display: "flex", flexDirection: "column", gap: isMobile ? 20 : 24 }}>
              {v.readOnlyNote ? <ReadOnlyNote text={v.readOnlyNote} archived={/arquivada/.test(v.readOnlyNote)} /> : null}
              {/* As setas ficam sempre à direita, na mesma posição: as etiquetas quebram linha à esquerda. */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16 }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px 12px", flexWrap: "wrap", flex: 1, minWidth: 0 }}>
                  <span style={{ ...mono(13), fontWeight: 500 }}>{cur.code}</span>
                  <Badge tone={cur.tone} icon={cur.icon}>{cur.st}</Badge>
                  {/* Fase S (S7 a S9): o lápis fica só para a ação de trocar a área; as etiquetas usam outros ícones. */}
                  {cur.edited ? <Badge tone="neutral" icon="history">Editado</Badge> : null}
                  {cur.hasManual ? <Badge tone="accent" icon="file-text">Resposta manual</Badge> : null}
                  {/* Área da pergunta (fase N, N10; fase S): o mesmo nome para todos e o lápis para quem pode trocá-la. */}
                  <AreaDoItem cur={cur} ws={ws} />
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 4, flex: "none" }}>
                  <Tooltip content="Item anterior (K)" placement="bottom">
                    <IconButton icon="chevron-left" variant="outline" label="Item anterior" onClick={() => ws.step(-1)} />
                  </Tooltip>
                  <Tooltip content="Próximo item (J)" placement="bottom">
                    <IconButton icon="chevron-right" variant="outline" label="Próximo item" onClick={() => ws.step(1)} />
                  </Tooltip>
                </div>
              </div>
              <h2 style={{ margin: 0, fontFamily: DISPLAY, fontWeight: 600, fontSize: isMobile ? 22 : 26, letterSpacing: "-.02em", lineHeight: 1.25, color: "var(--n-900)", maxWidth: "40ch", textWrap: "pretty" }}>{cur.q}</h2>
              {cur.alerts.length > 0 ? <ItemAlerts cur={cur} ws={ws} /> : null}
              <Answer v={v} ws={ws} state={state} cur={cur} />
              {cur.srcs.length > 0 ? <Sources cur={cur} ws={ws} /> : null}
              {cur.canRate ? <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap", color: "var(--n-700)" }}>
                <span style={{ fontSize: 13 }}>Esta resposta ajudou?</span>
                <button type="button" onClick={() => ws.rate("up")} aria-label="Positivo" aria-pressed={cur.fbUp} style={fbStyle(cur.fbUp)}><Icon name="thumbs-up" size="md" /></button>
                <button type="button" onClick={() => ws.rate("down")} aria-label="Negativo" aria-pressed={cur.fbDown} style={fbStyle(cur.fbDown)}><span style={{ display: "flex", transform: "rotate(180deg)" }}><Icon name="thumbs-up" size="md" /></span></button>
                {cur.fbDown ? <div style={{ width: 220 }}><Select options={FB_REASONS} placeholder="Motivo" size="sm" aria-label="Motivo" value={cur.fbReason} onChange={(e) => ws.rate("down", e.target.value)} /></div> : null}
              </div> : null}
            </div>
            {cur.readOnly ? null : <div style={{ borderTop: "1px solid var(--n-200)", background: "var(--n-000)", padding: `${isMobile ? 12 : 16}px ${padX}px`, display: "flex", alignItems: "center", justifyContent: "space-between", gap: isMobile ? 10 : 16, flexWrap: "wrap" }}>
              <div style={{ fontSize: 13, lineHeight: 1.5, color: "var(--n-900)", display: "flex", alignItems: "center", gap: 8, maxWidth: 420 }}>
                {cur.blockText ? <Icon name="info" size="md" /> : null}<span>{cur.blockText}</span>
              </div>
              <div className={isMobile ? "tdr-review-actions" : undefined} style={{ display: "flex", gap: isMobile ? 8 : 12, alignItems: "center", flexWrap: "wrap", ...(isMobile ? { width: "100%" } : null) }}>
                {cur.isApprovedOrRevised ? <span style={{ fontSize: 13, color: "var(--n-400)" }}>{cur.stateHint}</span> : null}
                <Button variant="secondary" icon="check" disabled={cur.noRevise} onClick={() => ws.revise(cur.id)}>Marcar como revisado</Button>
                {cur.canApprove ? <Button icon="shield-check" disabled={cur.noApprove} onClick={ws.approve}>Aprovar resposta</Button> : null}
              </div>
            </div>}
          </>
        ) : (
          <div style={{ padding: padX }}><EmptyState icon="filter" title="Nenhum item neste filtro." description="Escolha outro estado para continuar a revisão." /></div>
        )}
      </div>
      ) : null}
    </div>
  );
}
