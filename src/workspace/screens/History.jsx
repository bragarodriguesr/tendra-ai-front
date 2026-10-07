import React from "react";
import { Badge, Button, Icon, FilterMenu } from "../../ds/index.js";
import { ClickRow, Page, PageHeader, card, mono } from "../ui.jsx";

export function History({ v, ws, state, pad, isMobile }) {
  const n = v.history.length;
  return (
    <Page pad={pad}>
      <PageHeader eyebrow="Histórico de aprovações e revisões" title={`${n} ${n === 1 ? "registro" : "registros"}`} />
      <FilterMenu items={v.historyTabs} value={state.hfilter} onChange={(hfilter) => ws.setState({ hfilter })} label="Filtrar registros" />
      <div style={card(14, { overflowX: "auto", overflowY: "hidden" })}>
        {v.history.map((h) => (
          <div key={h.key} style={{ borderTop: "1px solid var(--n-100)" }}>
            {isMobile ? (
              <ClickRow onClick={h.toggle} aria-expanded={h.open} style={{ display: "flex", flexDirection: "column", gap: 8, padding: "14px 16px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontWeight: 600, color: "var(--n-900)", lineHeight: 1.35 }}>{h.q}</div>
                    <div style={{ fontSize: 13, color: "var(--n-400)", marginTop: 2 }}>{h.task}</div>
                  </div>
                  <Icon name={h.open ? "chevron-down" : "chevron-right"} size="md" style={{ flex: "none", marginTop: 2 }} />
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                  {h.imported ? <Badge tone="neutral" icon="history">Histórico importado</Badge> : <Badge tone={h.kindTone} icon={h.kindIcon}>{h.kindLabel}</Badge>}
                  <span style={mono(12, "var(--n-500)")}>{h.imported ? h.ageText : `${h.by} · ${h.at}`}</span>
                </div>
              </ClickRow>
            ) : (
            <ClickRow onClick={h.toggle} aria-expanded={h.open} style={{ display: "grid", minWidth: 980, gridTemplateColumns: "minmax(0,2fr) minmax(0,1.6fr) 170px 100px 24px", gap: 16, alignItems: "center", padding: "16px 20px" }}>
              <div>
                <div style={{ fontWeight: 600, color: "var(--n-900)" }}>{h.q}</div>
                <div style={{ fontSize: 13, color: "var(--n-400)", marginTop: 2 }}>{h.task}</div>
              </div>
              <span style={{ color: "var(--n-700)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{h.full}</span>
              <div style={{ display: "flex", flexDirection: "column", gap: 4, alignItems: "flex-start" }}>
                {h.imported ? <Badge tone="neutral" icon="history">Histórico importado</Badge> : (
                  <>
                    <Badge tone={h.kindTone} icon={h.kindIcon}>{h.kindLabel}</Badge>
                    <span style={{ color: "var(--n-900)" }}>{h.by}</span>
                    <span style={mono(12, "var(--n-400)")}>{h.at}</span>
                  </>
                )}
              </div>
              <span style={mono(13)}>{h.ageText}</span>
              <Icon name={h.open ? "chevron-down" : "chevron-right"} size="md" />
            </ClickRow>
            )}
            {h.open ? (
              <div style={{ padding: isMobile ? "0 16px 16px" : "4px 20px 20px", display: "flex", flexDirection: "column", gap: 12, background: "var(--n-050)" }}>
                <div style={{ fontSize: isMobile ? 15 : 16, lineHeight: 1.65, maxWidth: "70ch", paddingTop: 16 }}>{h.full}</div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {h.srcs.map((s) => <Button key={s.label} size="sm" variant="secondary" icon="external-link" onClick={s.open}>{s.label}</Button>)}
                </div>
              </div>
            ) : null}
          </div>
        ))}
      </div>
    </Page>
  );
}
