import React from "react";
import { Badge, Button, Icon, MonoLabel, Tooltip } from "../../ds/index.js";
import { ClickRow, Page, SegmentBar, PageHeader, bigNumber, card, legendDot, mono } from "../ui.jsx";

function Kpi({ icon, label, value, sub }) {
  return (
    <div style={card(14, { padding: 24, display: "flex", flexDirection: "column", gap: 12 })}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, color: "var(--n-500)" }}>
        <Icon name={icon} size="md" />
        <MonoLabel>{label}</MonoLabel>
      </div>
      <span style={bigNumber}>{value}</span>
      <span style={{ fontSize: 13, color: "var(--n-500)", lineHeight: 1.5 }}>{sub}</span>
    </div>
  );
}

/** Colunas de série única (Petróleo, --dv-series-1), ancoradas na linha de base, com valor no topo. */
function MonthBars({ months }) {
  const PLOT = 112;
  return (
    <div>
      <div style={{ display: "flex", alignItems: "flex-end", gap: 12, height: PLOT + 22, borderBottom: "1px solid var(--n-200)" }}>
        {months.map((m, i) => (
          <div key={m.m} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-end", gap: 6, height: "100%" }}>
            <span style={{ ...mono(12), fontVariantNumeric: "tabular-nums" }}>{m.n}</span>
            <Tooltip content={`${m.n} RFPs concluídas em ${m.full}`} placement={i >= months.length - 2 ? "left" : "right"} style={{ width: "100%", maxWidth: 44, display: "block" }}>
              <span tabIndex={0} aria-label={`${m.full}: ${m.n} RFPs concluídas`} className="tdr-dv-bar" style={{ display: "block", height: (m.pct / 100) * PLOT }} />
            </Tooltip>
          </div>
        ))}
      </div>
      <div style={{ display: "flex", gap: 12, paddingTop: 8 }}>
        {months.map((m) => <span key={m.m} style={{ flex: 1, textAlign: "center", ...mono(11, "var(--n-500)") }}>{m.m}</span>)}
      </div>
    </div>
  );
}

export function DueText({ t, style }) {
  return <span style={{ fontSize: 13, color: t.dueColor, fontWeight: t.dueWeight, ...style }}>{t.dueText}</span>;
}

export function Dashboard({ v, ws, pad }) {
  const { dash } = v;
  return (
    <Page pad={pad}>
      <PageHeader eyebrow="Dashboard · últimos 90 dias" title="Visão geral do uso" action={<Button icon="plus" onClick={() => ws.go("new")}>Nova RFP/RFI</Button>} />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))", gap: 20 }}>
        <Kpi icon="layout-grid" label="RFPs e RFIs trabalhadas" value={dash.worked} sub={dash.workedSub} />
        <Kpi icon="circle-alert" label="Itens em aberto" value={dash.open} sub={dash.openSub} />
        <Kpi icon="clock" label="Tempo médio por RFP" value={dash.avg} sub="Da importação à exportação do documento." />
        <Kpi icon="shield-check" label="Itens aprovados" value={dash.approved} sub={dash.approvedSub} />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(340px,1fr))", gap: 20 }}>
        <div style={card(14, { padding: 24, display: "flex", flexDirection: "column", gap: 16 })}>
          <MonoLabel>Tarefas por status</MonoLabel>
          <SegmentBar segments={dash.status} total={dash.total} unit="tarefas" />
          <div role="table" aria-label="Tarefas por status" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {dash.status.map((g) => (
              <div role="row" key={g.label} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14 }}>
                <span aria-hidden="true" style={legendDot(g.color)} />
                <span role="cell" style={{ flex: 1 }}>{g.label}</span>
                <span role="cell" style={{ ...mono(13), fontVariantNumeric: "tabular-nums" }}>{g.n}</span>
                <span role="cell" style={{ ...mono(12, "var(--n-400)"), minWidth: 40, textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{g.pct}%</span>
              </div>
            ))}
          </div>
        </div>
        <div style={card(14, { padding: 24, display: "flex", flexDirection: "column", gap: 16 })}>
          <MonoLabel>RFPs concluídas por mês</MonoLabel>
          <MonthBars months={dash.months} />
        </div>
      </div>
      <div style={card(14, { overflow: "hidden" })}>
        <div style={{ padding: "20px 24px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
          <MonoLabel>Prazos mais próximos</MonoLabel>
          <Button size="sm" variant="ghost" iconEnd="arrow-right" onClick={() => ws.go("tasks")}>Ver todas as tarefas</Button>
        </div>
        {dash.deadlines.map((t) => (
          <ClickRow key={t.id} onClick={t.open} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16, flexWrap: "wrap", padding: "14px 24px", borderTop: "1px solid var(--n-100)" }}>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontWeight: 600, color: "var(--n-900)" }}>{t.title}</div>
              <div style={{ fontSize: 13, color: "var(--n-500)", marginTop: 2 }}>{t.company} · {t.type} · {t.owner}</div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
              <Badge tone={t.tone} icon={t.icon}>{t.status}</Badge>
              <span style={mono(13)}>{t.due}</span>
              <DueText t={t} style={{ minWidth: 90, textAlign: "right" }} />
            </div>
          </ClickRow>
        ))}
      </div>
    </Page>
  );
}
