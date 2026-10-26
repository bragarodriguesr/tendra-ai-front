import React from "react";
import { Badge, Button, Icon, IconButton, ProgressBar, Tooltip } from "../../ds/index.js";
import { AlertDeck, ClickRow, Page, PageHeader, card, mono } from "../ui.jsx";

const COLS = "minmax(0,2.2fr) 64px minmax(0,1.7fr) 150px 130px 130px 56px";
const rowGrid = { display: "grid", minWidth: 1010, gridTemplateColumns: COLS, gap: 16 };

/** Excluir tarefa (cenário 60): o clique não abre a tarefa; a exclusão pede confirmação. */
function DeleteTask({ t }) {
  if (!t.canDelete) return null;
  const label = `Excluir ${t.title}`;
  return (
    <Tooltip content="Excluir tarefa" placement="top">
      <IconButton icon="trash-2" label={label} variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); t.del(); }} />
    </Tooltip>
  );
}

/** Alertas recolhidos: um resumo, no mesmo formato dos alertas tratados da Revisão, que abre o cartão. */
function TaskAlertsCollapsed({ n, ws }) {
  return (
    <button
      type="button" onClick={() => ws.collapseTaskAlerts(false)} aria-expanded="false"
      style={{ alignSelf: "flex-start", display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", borderRadius: 999, border: "1px solid var(--n-200)", background: "var(--n-000)", color: "#4B5046", cursor: "pointer", font: "inherit", fontSize: 13 }}
    >
      <Icon name="bell" size="sm" />
      <span>{n > 1 ? `${n} alertas recolhidos` : "1 alerta recolhido"}</span>
      <span style={mono(12, "var(--n-500)")}>· mostrar</span>
      <Icon name="chevron-down" size="sm" />
    </button>
  );
}

export function TaskAlerts({ v, ws }) {
  const { tDeck } = v;
  if (tDeck.collapsed) return <TaskAlertsCollapsed n={tDeck.count} ws={ws} />;
  const a = tDeck.a;
  const move = (d) => ws.setState({ tAi: (tDeck.index + d + tDeck.count) % tDeck.count });
  return (
    <AlertDeck
      region="Alertas" deck={tDeck} icon={a.icon} label={a.label}
      pos={tDeck.hasMany ? tDeck.pos : null} onPrev={() => move(-1)} onNext={() => move(1)}
    >
      <div style={{ color: "var(--n-900)", lineHeight: 1.5 }}><b>{a.name}</b> {a.text}</div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
        <Button size="sm" variant="secondary" iconEnd="arrow-right" onClick={() => ws.readAlert(a)}>{a.action}</Button>
        <Button size="sm" variant="ghost" icon="minus" onClick={() => ws.collapseTaskAlerts(true)} aria-expanded="true">Recolher</Button>
      </div>
    </AlertDeck>
  );
}

export function Tasks({ v, ws, pad, isMobile }) {
  return (
    <Page pad={pad}>
      <PageHeader eyebrow="Painel de tarefas" title={`${v.tasks.length} RFPs e RFIs em andamento`} action={<Button icon="plus" onClick={() => ws.go("new")}>Nova RFP/RFI</Button>} />
      {v.tDeck.count > 0 ? <TaskAlerts v={v} ws={ws} /> : null}
      {!isMobile ? (
        <div role="table" aria-label="Tarefas" style={card(14, { overflowX: "auto", overflowY: "hidden" })}>
          <div role="row" style={{ ...rowGrid, padding: "12px 20px", background: "var(--n-050)", borderBottom: "1px solid var(--n-200)", ...mono(11, "var(--n-500)"), letterSpacing: ".1em", textTransform: "uppercase" }}>
            <span role="columnheader">Tarefa</span><span role="columnheader">Itens</span><span role="columnheader">Progresso</span>
            <span role="columnheader">Prazo</span><span role="columnheader">Responsável</span><span role="columnheader">Status</span>
            <span role="columnheader"><span style={{ position: "absolute", left: -9999 }}>Ações</span></span>
          </div>
          {v.tasks.map((t) => (
            <ClickRow key={t.id} role="row" aria-label={`Abrir ${t.title}`} onClick={t.open} style={{ ...rowGrid, padding: "16px 20px", borderTop: "1px solid var(--n-100)", alignItems: "center", background: "var(--n-000)" }}>
              <div role="cell" style={{ minWidth: 0 }}>
                <div style={{ fontWeight: 600, color: "var(--n-900)" }}>{t.title}</div>
                <div style={{ fontSize: 13, color: "var(--n-500)", marginTop: 2 }}>{t.company} · {t.type}</div>
              </div>
              <span role="cell" style={mono(13)}>{t.items}</span>
              <div role="cell" style={{ display: "flex", flexDirection: "column", gap: 6, alignItems: "flex-start" }}>
                <div style={{ width: "100%" }}><ProgressBar value={t.pct} fillClassName={t.isProcessing ? "tdr-progress-ai" : undefined} /></div>
                <span style={{ fontSize: 12, color: "#4B5046" }}>{t.compText}</span>
              </div>
              <div role="cell" style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                <span style={mono(13)}>{t.due}</span>
                <span style={{ fontSize: 12, color: t.dueColor, fontWeight: t.dueWeight }}>{t.dueText}</span>
              </div>
              <span role="cell">{t.owner}</span>
              <div role="cell"><Badge tone={t.tone} icon={t.icon}>{t.status}</Badge></div>
              <div role="cell"><DeleteTask t={t} /></div>
            </ClickRow>
          ))}
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {v.tasks.map((t) => (
            <ClickRow key={t.id} className="" onClick={t.open} style={card(14, { padding: 16, display: "flex", flexDirection: "column", gap: 12 })}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontWeight: 600, color: "var(--n-900)", lineHeight: 1.3 }}>{t.title}</div>
                  <div style={{ fontSize: 13, color: "var(--n-500)", marginTop: 2 }}>{t.company} · {t.type}</div>
                </div>
                <Badge tone={t.tone} icon={t.icon}>{t.status}</Badge>
              </div>
              <ProgressBar value={t.pct} fillClassName={t.isProcessing ? "tdr-progress-ai" : undefined} />
              <span style={{ fontSize: 13, color: "#4B5046" }}>{t.compText}</span>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 12, fontSize: 13 }}>
                <span><span style={mono(undefined)}>{t.due}</span> · <span style={{ color: t.dueColor, fontWeight: t.dueWeight }}>{t.dueText}</span></span>
                <span>{t.owner}</span>
              </div>
              {t.canDelete ? <div style={{ display: "flex", justifyContent: "flex-end" }}><DeleteTask t={t} /></div> : null}
            </ClickRow>
          ))}
        </div>
      )}
    </Page>
  );
}
