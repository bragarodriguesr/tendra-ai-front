import React from "react";
import { Badge, Button, EmptyState, FilterMenu, Input, MonoLabel, ProgressBar } from "../../ds/index.js";
import { DISPLAY, Page, PageHeader, card } from "../ui.jsx";

/**
 * Exportação. Fase O: prontas primeiro e encerradas por último (O4), filtro por status e busca por
 * empresa ou título (O5); baixar a tarefa pronta abre o box de conclusão (O6).
 */
export function Export({ v, ws, state, pad, isMobile }) {
  const setBusca = (exportBusca) => ws.setState({ exportBusca });
  return (
    <Page max={860} pad={pad}>
      <PageHeader eyebrow="Exportação" title={v.exportTitle} />
      {v.online ? (
        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 12 }}>
          <Input
            icon="search" placeholder="Buscar por empresa ou título" aria-label="Buscar tarefas"
            value={state.exportBusca} onChange={(e) => setBusca(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Escape") setBusca(""); }}
            style={isMobile ? { flex: "1 1 100%" } : { flex: "0 1 320px", minWidth: 220 }}
          />
          <div style={isMobile ? undefined : { marginLeft: "auto" }}>
            <FilterMenu items={v.exportFilterTabs} value={state.exportFilter} onChange={(exportFilter) => ws.setState({ exportFilter })} align={isMobile ? "start" : "end"} />
          </div>
        </div>
      ) : null}
      {v.exportSemResultado ? <EmptyState icon="search" title="Nenhuma tarefa encontrada." description="Confira as palavras ou limpe a busca." /> : null}
      {v.exportCards.map((x) => (
        <div key={x.id} style={card(16, { padding: 24, display: "flex", flexDirection: "column", gap: 16 })}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16, flexWrap: "wrap" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 4, minWidth: 0 }}>
              <MonoLabel>{x.company}</MonoLabel>
              <span style={{ fontFamily: DISPLAY, fontWeight: 600, fontSize: 20, letterSpacing: "-.01em", color: "var(--n-900)", lineHeight: 1.25 }}>{x.title}</span>
            </div>
            <Badge tone={x.tone} icon={x.icon}>{x.badge}</Badge>
          </div>
          <div style={{ fontSize: 16, color: "var(--n-900)" }}>{x.count}</div>
          <ProgressBar value={x.pct} />
          {x.filled ? null : <div style={{ color: "var(--n-400)", lineHeight: 1.6 }}>O arquivo traz, na ordem original, a pergunta, o ID do item, a resposta aprovada com as edições do revisor e as fontes usadas. Itens de resposta manual mostram “Resposta manual, sem fonte na base”. Formato: planilha (.xlsx).</div>}
          <div style={{ display: "flex", alignItems: "center", gap: "12px 16px", flexWrap: "wrap" }}>
            <Button icon="download" disabled={x.disabled} onClick={x.doExport} aria-label={`Baixar ${x.title}`}>{x.btn}</Button>
            <Button variant="secondary" iconEnd="arrow-right" onClick={x.openTask}>Ver tarefa</Button>
            {x.blocked ? <Button variant="secondary" iconEnd="arrow-right" onClick={x.goReview}>Ir para revisão</Button> : null}
            <span style={{ fontSize: 13, color: "var(--n-900)" }}>{x.reason}</span>
          </div>
          {x.exported ? <div><Badge tone="approved" icon="check-check">Exportada por {x.exported.by} · {x.exported.at}</Badge></div> : null}
          {x.closed ? <div><Badge tone={x.closed.tone} icon={x.closed.icon}>{x.closed.label}</Badge></div> : null}
        </div>
      ))}
    </Page>
  );
}
