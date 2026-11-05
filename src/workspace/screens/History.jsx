import React from "react";
import { Badge, EmptyState, FilterMenu, IconButton, Tooltip } from "../../ds/index.js";
import { Page, PageHeader, card, mono } from "../ui.jsx";

// Uma coluna para cada informação (ajuste de 05/11/2026): registro, status, quem fez, quando e a seta
// que abre a pergunta na Revisão ou a tarefa.
const COLS = "minmax(0,1fr) 170px 180px 150px 48px";
const rowGrid = { display: "grid", minWidth: 760, gridTemplateColumns: COLS, gap: 16, alignItems: "center" };

function Go({ h }) {
  if (!h.go) {
    return (
      <Tooltip content={h.goOff} placement="left">
        <span style={{ display: "inline-flex" }}><IconButton icon="arrow-right" label={h.goLabel} variant="outline" size="sm" disabled /></span>
      </Tooltip>
    );
  }
  return (
    <Tooltip content={h.goTip} placement="left">
      <IconButton icon="arrow-right" label={h.goLabel} variant="outline" size="sm" onClick={h.go} />
    </Tooltip>
  );
}

function Status({ h }) {
  return h.imported ? <Badge tone="neutral" icon="history">Histórico importado</Badge> : <Badge tone={h.kindTone} icon={h.kindIcon}>{h.kindLabel}</Badge>;
}

export function History({ v, ws, state, pad, isMobile }) {
  const n = v.history.length;
  const filtrado = state.hfilter && state.hfilter !== "todos";
  return (
    <Page pad={pad}>
      <PageHeader eyebrow="Histórico de aprovações, revisões e tarefas" title={`${n} ${n === 1 ? "registro" : "registros"}`} />
      <FilterMenu items={v.historyTabs} value={state.hfilter} onChange={(hfilter) => ws.setState({ hfilter })} label="Filtrar registros" />
      {n === 0 ? (
        <div style={card(14, { overflow: "hidden" })}>
          <EmptyState icon="history" title={filtrado ? "Nenhum registro neste filtro." : "Nenhuma ação registrada ainda."}
            description={filtrado ? "Escolha outro filtro para ver os demais registros." : "As revisões e as aprovações dos itens e as ações sobre as tarefas aparecem aqui, com quem fez e quando."} />
        </div>
      ) : isMobile ? (
        <div style={card(14, { overflow: "hidden" })}>
          {v.history.map((h, i) => (
            <div key={h.key} style={{ display: "flex", gap: 12, alignItems: "center", padding: "14px 16px", borderTop: i ? "1px solid var(--n-100)" : 0 }}>
              <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 8 }}>
                <div>
                  <div style={{ fontWeight: 600, color: "var(--n-900)", lineHeight: 1.35 }}>{h.q}</div>
                  <div style={{ fontSize: 13, color: "var(--n-400)", marginTop: 2 }}>{h.task}</div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                  <Status h={h} />
                  <span style={mono(12, "var(--n-500)")}>{h.imported ? "—" : `${h.by} · ${h.at}`}</span>
                </div>
              </div>
              <Go h={h} />
            </div>
          ))}
        </div>
      ) : (
        <div role="table" aria-label="Histórico" style={card(14, { overflowX: "auto", overflowY: "hidden" })}>
          <div role="row" style={{ ...rowGrid, padding: "12px 20px", background: "var(--n-050)", borderBottom: "1px solid var(--n-200)", ...mono(11, "var(--n-500)"), letterSpacing: ".1em", textTransform: "uppercase" }}>
            <span role="columnheader">Registro</span><span role="columnheader">Status</span><span role="columnheader">Usuário</span>
            <span role="columnheader">Data e hora</span><span role="columnheader"><span style={{ position: "absolute", left: -9999 }}>Abrir</span></span>
          </div>
          {v.history.map((h) => (
            <div key={h.key} role="row" style={{ ...rowGrid, padding: "14px 20px", borderTop: "1px solid var(--n-100)" }}>
              <div role="cell" style={{ minWidth: 0 }}>
                <div style={{ fontWeight: 600, color: "var(--n-900)", overflowWrap: "anywhere" }}>{h.q}</div>
                <div style={{ fontSize: 13, color: "var(--n-400)", marginTop: 2 }}>{h.task}</div>
              </div>
              <div role="cell"><Status h={h} /></div>
              <span role="cell" style={{ color: "var(--n-900)", overflowWrap: "anywhere" }}>{h.imported ? "—" : h.by}</span>
              <span role="cell" style={mono(13)}>{h.imported ? "—" : h.at}</span>
              <div role="cell"><Go h={h} /></div>
            </div>
          ))}
        </div>
      )}
    </Page>
  );
}
