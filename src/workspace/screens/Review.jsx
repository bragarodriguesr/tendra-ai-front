import React from "react";
import { Badge, Button, EmptyState, Icon, IconButton, MonoLabel, Select, Textarea } from "../../ds/index.js";
import { AlertDeck, ClickRow, DISPLAY, card, mono } from "../ui.jsx";
import { FilterMenu } from "../FilterMenu.jsx";

const FB_REASONS = ["Fonte incorreta", "Texto impreciso", "Informação desatualizada", "Outro"];
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
          <span style={mono(12, "var(--n-400)")}>{v.rows.length} de {v.counts.total}</span>
        </div>
        <div style={{ fontSize: 12, color: "var(--n-500)", lineHeight: 1.4 }}>{v.revTask}</div>
        <FilterMenu tabs={v.filterTabs} value={state.filter} onChange={ws.setFilter} />
      </div>
      <div style={{ flex: 1, overflow: "auto" }}>
        {v.rows.map((r) => (
          <ClickRow key={r.id} className="" onClick={() => { r.open(); if (isMobile) ws.setState({ reviewPane: "item" }); }} aria-current={r.active || undefined} style={{
            display: "flex", flexDirection: "column", gap: 6, padding: "14px 20px", borderTop: "1px solid var(--n-200)", fontSize: 14,
            background: r.active ? "var(--n-000)" : "transparent", boxShadow: r.active ? "inset 2px 0 0 var(--n-900)" : "none"
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={mono(12)}>{r.code}</span>
              {r.hasAlert ? <span style={{ display: "flex", alignItems: "center", gap: 4, color: "var(--danger)", fontSize: 12, fontWeight: 500 }}><Icon name="triangle-alert" size="sm" />{r.alertText}</span> : null}
            </div>
            <div style={{ color: "var(--n-900)", lineHeight: 1.4 }}>{r.q}</div>
            <span style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "var(--n-500)" }}><Icon name={r.icon} size="sm" />{r.st}</span>
          </ClickRow>
        ))}
      </div>
    </div>
  );
}

function ItemAlerts({ cur, ws }) {
  const a = cur.alert;
  const move = (d) => ws.setState({ alertAt: { id: cur.id, i: (cur.alertIndex + d + cur.alerts.length) % cur.alerts.length } });
  return (
    <AlertDeck
      deck={cur} pending={a.pending} icon={a.icon} label={a.label} suffix={a.pending ? <span>· pendente</span> : null}
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
  );
}

function Answer({ v, ws, state, cur }) {
  const startEdit = () => (cur.isApproved ? ws.setState({ dialog: true }) : ws.setState({ edit: true }));
  return (
    <div style={card(16, { padding: 24, display: "flex", flexDirection: "column", gap: 16 })}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        <MonoLabel>Resposta</MonoLabel>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <span style={mono(12, "var(--n-400)")}>{v.savedText}</span>
          {cur.edited ? (
            <>
              <Button size="sm" variant="ghost" onClick={() => ws.setState({ showOrig: !state.showOrig })}>{state.showOrig ? "Ocultar sugestão original" : "Ver sugestão original"}</Button>
              <Button size="sm" variant="ghost" icon="refresh-cw" onClick={() => ws.restore(cur.id)}>Restaurar sugestão</Button>
            </>
          ) : null}
          {state.edit
            ? <Button size="sm" variant="secondary" icon="check" onClick={() => ws.setState({ edit: false })}>Concluir edição</Button>
            : <Button size="sm" variant="secondary" icon="pencil" onClick={startEdit}>Editar resposta</Button>}
        </div>
      </div>
      {state.showOrig ? (
        <div style={{ padding: "12px 16px", background: "var(--n-100)", borderRadius: 8, lineHeight: 1.6, whiteSpace: "pre-line" }}>
          <div style={{ ...mono(11, "var(--n-400)"), letterSpacing: ".1em", textTransform: "uppercase", marginBottom: 6 }}>Sugestão original</div>
          {cur.orig}
        </div>
      ) : null}
      {state.edit ? (
        <Textarea rows={8} value={cur.text} placeholder="Escreva a resposta. Separe parágrafos com uma linha em branco." onChange={(e) => ws.onDraft(e.target.value)} aria-label="Resposta" autoFocus />
      ) : (
        <>
          {cur.noText ? <div style={{ color: "var(--n-400)", lineHeight: 1.6 }}>Nenhum rascunho. Escreva a resposta para poder revisar este item.</div> : null}
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
      {cur.hasManual ? (
        <div style={{ ...mono(12, "var(--n-500)"), display: "flex", alignItems: "center", gap: 6 }}>
          <Icon name="pencil" size="sm" />Resposta manual, sem fonte na base · escrita por {cur.manualBy}
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

function Sources({ cur }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <MonoLabel>Fontes · {cur.srcs.length}</MonoLabel>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(300px,100%),1fr))", gap: 16 }}>
        {cur.srcs.map((s) => (
          <div key={s.k} style={card(14, { display: "flex", flexDirection: "column", gap: 12, padding: 16, borderColor: s.conflict ? "var(--danger)" : "var(--n-200)" })}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ ...mono(11), fontWeight: 500, background: "var(--n-100)", borderRadius: 6, padding: "2px 8px" }}>[{s.k}]</span>
              <span style={{ fontSize: 12, color: "var(--n-400)" }}>{s.type}</span>
            </div>
            <div style={{ ...mono(13), lineHeight: 1.4, wordBreak: "break-word" }}>{s.doc} · {s.loc}</div>
            <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
              <span style={mono(12, "var(--n-700)")}>{s.ageText}</span>
              {s.old ? <Badge tone="danger" icon="clock">Mais de 120 dias</Badge> : null}
              {s.conflict ? <Badge tone="danger" icon="copy">Em conflito</Badge> : null}
              {s.chosen ? <Badge tone="approved" icon="check">Fonte escolhida</Badge> : null}
            </div>
            <div style={{ display: "flex", gap: 8, marginTop: "auto" }}>
              <Button size="sm" variant="secondary" icon="external-link" onClick={s.open}>Abrir no trecho</Button>
              {s.canUse ? <Button size="sm" icon="check" onClick={s.use}>Usar esta fonte</Button> : null}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function Review({ v, ws, state, height, isMobile }) {
  const cur = v.cur;
  const setFb = (val) => ws.setState((x) => ({ fb: { ...x.fb, [cur.id]: val } }));
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
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px 16px", flexWrap: "wrap" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <span style={{ ...mono(13), fontWeight: 500 }}>{cur.code}</span>
                  <Badge tone={cur.tone} icon={cur.icon}>{cur.st}</Badge>
                  {cur.edited ? <Badge tone="neutral" icon="pencil">Editado</Badge> : null}
                </div>
                {isMobile ? (
                  <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                    <IconButton icon="chevron-left" variant="outline" label="Item anterior" onClick={() => ws.step(-1)} />
                    <IconButton icon="chevron-right" variant="outline" label="Próximo item" onClick={() => ws.step(1)} />
                  </div>
                ) : (
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                    <Button size="sm" variant="secondary" icon="chevron-left" onClick={() => ws.step(-1)} title="Item anterior (K)">Item anterior</Button>
                    <Button size="sm" variant="secondary" iconEnd="chevron-right" onClick={() => ws.step(1)} title="Próximo item (J)">Próximo item</Button>
                  </div>
                )}
              </div>
              <h2 style={{ margin: 0, fontFamily: DISPLAY, fontWeight: 600, fontSize: isMobile ? 22 : 26, letterSpacing: "-.02em", lineHeight: 1.25, color: "var(--n-900)", maxWidth: "40ch", textWrap: "pretty" }}>{cur.q}</h2>
              {cur.alerts.length > 0 ? <ItemAlerts cur={cur} ws={ws} /> : null}
              <Answer v={v} ws={ws} state={state} cur={cur} />
              {cur.srcs.length > 0 ? <Sources cur={cur} /> : null}
              <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap", color: "var(--n-700)" }}>
                <span style={{ fontSize: 13 }}>Esta resposta ajudou?</span>
                <button type="button" onClick={() => setFb("up")} aria-label="Positivo" aria-pressed={cur.fbUp} style={fbStyle(cur.fbUp)}><Icon name="thumbs-up" size="md" /></button>
                <button type="button" onClick={() => setFb("down")} aria-label="Negativo" aria-pressed={cur.fbDown} style={fbStyle(cur.fbDown)}><span style={{ display: "flex", transform: "rotate(180deg)" }}><Icon name="thumbs-up" size="md" /></span></button>
                {cur.fbDown ? <div style={{ width: 220 }}><Select options={FB_REASONS} placeholder="Motivo" size="sm" aria-label="Motivo" /></div> : null}
              </div>
            </div>
            <div style={{ borderTop: "1px solid var(--n-200)", background: "var(--n-000)", padding: `${isMobile ? 12 : 16}px ${padX}px`, display: "flex", alignItems: "center", justifyContent: "space-between", gap: isMobile ? 10 : 16, flexWrap: "wrap" }}>
              <div style={{ fontSize: 13, lineHeight: 1.5, color: "var(--n-900)", display: "flex", alignItems: "center", gap: 8, maxWidth: 420 }}>
                {cur.blockText ? <Icon name="info" size="md" /> : null}<span>{cur.blockText}</span>
              </div>
              <div className={isMobile ? "tdr-review-actions" : undefined} style={{ display: "flex", gap: isMobile ? 8 : 12, alignItems: "center", flexWrap: "wrap", ...(isMobile ? { width: "100%" } : null) }}>
                {cur.isApprovedOrRevised ? <span style={{ fontSize: 13, color: "var(--n-400)" }}>{cur.stateHint}</span> : null}
                <Button variant="secondary" icon="check" disabled={cur.noRevise} onClick={() => ws.revise(cur.id)}>Marcar como revisado</Button>
                <Button icon="shield-check" disabled={cur.noApprove} onClick={ws.approve}>Aprovar resposta</Button>
              </div>
            </div>
          </>
        ) : (
          <div style={{ padding: padX }}><EmptyState icon="filter" title="Nenhum item neste filtro." description="Escolha outro estado para continuar a revisão." /></div>
        )}
      </div>
      ) : null}
    </div>
  );
}
