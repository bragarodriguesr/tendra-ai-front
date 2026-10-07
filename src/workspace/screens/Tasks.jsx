import React from "react";
import { Badge, Button, ProgressBar } from "../../ds/index.js";
import { AlertDeck, ClickRow, Page, PageHeader, card, mono } from "../ui.jsx";

const COLS = "minmax(0,2.2fr) 64px minmax(0,1.7fr) 150px 130px 130px";
const rowGrid = { display: "grid", minWidth: 940, gridTemplateColumns: COLS, gap: 16 };

export function TaskAlerts({ v, ws }) {
  const { tDeck } = v;
  const a = tDeck.a;
  const move = (d) => ws.setState({ tAi: (tDeck.index + d + tDeck.count) % tDeck.count });
  return (
    <AlertDeck
      region="Alertas" deck={tDeck} icon={a.icon} label={a.label}
      pos={tDeck.hasMany ? tDeck.pos : null} onPrev={() => move(-1)} onNext={() => move(1)}
    >
      <div style={{ color: "var(--n-900)", lineHeight: 1.5 }}><b>{a.name}</b> {a.text}</div>
      <div><Button size="sm" variant="secondary" iconEnd="arrow-right" onClick={a.go}>{a.action}</Button></div>
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
          </div>
          {v.tasks.map((t) => (
            <ClickRow key={t.id} role="row" aria-label={`Abrir ${t.title}`} onClick={t.open} style={{ ...rowGrid, padding: "16px 20px", borderTop: "1px solid var(--n-100)", alignItems: "center", background: "var(--n-000)" }}>
              <div role="cell" style={{ minWidth: 0 }}>
                <div style={{ fontWeight: 600, color: "var(--n-900)" }}>{t.title}</div>
                <div style={{ fontSize: 13, color: "var(--n-500)", marginTop: 2 }}>{t.company} · {t.type}</div>
              </div>
              <span role="cell" style={mono(13)}>{t.items}</span>
              <div role="cell" style={{ display: "flex", flexDirection: "column", gap: 6, alignItems: "flex-start" }}>
                <div style={{ width: "100%" }}><ProgressBar value={t.pct} /></div>
                <span style={{ fontSize: 12, color: "#4B5046" }}>{t.compText}</span>
              </div>
              <div role="cell" style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                <span style={mono(13)}>{t.due}</span>
                <span style={{ fontSize: 12, color: t.dueColor, fontWeight: t.dueWeight }}>{t.dueText}</span>
              </div>
              <span role="cell">{t.owner}</span>
              <div role="cell"><Badge tone={t.tone} icon={t.icon}>{t.status}</Badge></div>
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
              <ProgressBar value={t.pct} />
              <span style={{ fontSize: 13, color: "#4B5046" }}>{t.compText}</span>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 12, fontSize: 13 }}>
                <span><span style={mono(undefined)}>{t.due}</span> · <span style={{ color: t.dueColor, fontWeight: t.dueWeight }}>{t.dueText}</span></span>
                <span>{t.owner}</span>
              </div>
            </ClickRow>
          ))}
        </div>
      )}
    </Page>
  );
}
