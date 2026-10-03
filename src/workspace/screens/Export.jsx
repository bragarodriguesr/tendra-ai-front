import React from "react";
import { Badge, Button, MonoLabel, ProgressBar } from "../../ds/index.js";
import { DISPLAY, Page, PageHeader, card } from "../ui.jsx";

export function Export({ v, pad }) {
  return (
    <Page max={860} pad={pad}>
      <PageHeader eyebrow="Exportação" title={v.exportTitle} />
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
          <div style={{ color: "var(--n-400)", lineHeight: 1.6 }}>O arquivo traz, na ordem original, a pergunta, o ID do item, a resposta aprovada com as edições do revisor e as fontes usadas. Itens de resposta manual mostram “Resposta manual, sem fonte na base”. Formato: planilha (.xlsx).</div>
          <div style={{ display: "flex", alignItems: "center", gap: "12px 16px", flexWrap: "wrap" }}>
            <Button icon="download" disabled={x.disabled} onClick={x.doExport}>{x.btn}</Button>
            {x.blocked ? <Button variant="secondary" iconEnd="arrow-right" onClick={x.goReview}>Ir para revisão</Button> : null}
            <span style={{ fontSize: 13, color: "var(--n-900)" }}>{x.reason}</span>
          </div>
          {x.exported ? <div><Badge tone="approved" icon="check-check">Exportada por {x.exported.by} · {x.exported.at}</Badge></div> : null}
        </div>
      ))}
    </Page>
  );
}
