import React from "react";
import { Badge, Button, MonoLabel } from "../../ds/index.js";
import { DISPLAY, Page, card, mono } from "../ui.jsx";

export function Onboarding({ v, ws, state, pad }) {
  return (
    <Page max={960} pad={pad} gap={32}>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <MonoLabel>Primeiros passos · 1 de 2</MonoLabel>
        <h1 style={{ margin: 0, fontFamily: DISPLAY, fontWeight: 600, fontSize: 40, letterSpacing: "-.03em", lineHeight: 1.1, color: "var(--n-900)", maxWidth: "18ch" }}>Suba os documentos que a Tendra.ai vai consultar.</h1>
        <p style={{ margin: 0, maxWidth: "62ch", lineHeight: 1.6 }}>Propostas anteriores, whitepapers, políticas e RFPs respondidas. Mais documentos melhoram os rascunhos; cada resposta gerada aponta para o trecho de origem.</p>
      </div>
      <div style={{ border: "1px dashed var(--n-350)", borderRadius: 16, background: "var(--n-000)", padding: 40, display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 16 }}>
        <div style={{ fontFamily: DISPLAY, fontWeight: 600, fontSize: 20, color: "var(--n-900)" }}>Arraste arquivos ou selecione do computador</div>
        <div style={{ ...mono(12, "var(--n-400)"), lineHeight: 1.6 }}>.doc · .docx · .xls · .xlsx · .md · .pdf · .ppt · .pptx · .txt · .csv · arquivos do Google (baixados como Office)</div>
        <Button icon="upload" onClick={ws.uploadDocs}>Subir documentos</Button>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
          <span style={{ fontFamily: DISPLAY, fontWeight: 600, fontSize: 18, color: "var(--n-900)" }}>{v.readyDocs} de {state.docs.length} documentos processados</span>
          <span style={mono(12, "var(--n-400)")}>Sem mínimo definido</span>
        </div>
        <div style={card(14, { overflowX: "auto", overflowY: "hidden" })}>
          {v.docs.map((d) => (
            <div key={d.id} style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) auto", gap: 16, alignItems: "center", padding: "12px 20px", borderTop: "1px solid var(--n-100)" }}>
              <div style={{ minWidth: 0 }}>
                <div style={{ ...mono(13), overflow: "hidden", textOverflow: "ellipsis" }}>{d.name}</div>
                <div style={{ fontSize: 13, color: "var(--n-400)", marginTop: 2 }}>{d.note}</div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                {d.canRetry ? <Button size="sm" variant="secondary" icon="refresh-cw" onClick={d.retry}>Tentar novamente</Button> : null}
                <Badge tone={d.tone} icon={d.icon}>{d.statusText}</Badge>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
        <Button iconEnd="arrow-right" onClick={() => ws.go("new")} disabled={v.readyDocs === 0}>Criar primeira RFP</Button>
        <Button variant="ghost" onClick={() => ws.go("tasks")}>Fazer depois</Button>
      </div>
    </Page>
  );
}
