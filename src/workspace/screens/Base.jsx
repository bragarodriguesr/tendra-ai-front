import React from "react";
import { Badge, Button, IconButton, MonoLabel, Select, Switch, Tooltip } from "../../ds/index.js";
import { Page, card, h1Style, mono } from "../ui.jsx";

const COLS = "minmax(0,2.2fr) 100px 110px 170px minmax(150px,1fr) 120px 110px";
const rowGrid = { display: "grid", minWidth: 1100, gridTemplateColumns: COLS, gap: 16 };
const SORT_OPTIONS = [{ value: "idade", label: "Ordenar por idade" }, { value: "nome", label: "Ordenar por nome" }, { value: "upload", label: "Ordenar por envio" }];

export function Base({ v, ws, state, pad }) {
  return (
    <Page pad={pad}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: 24, flexWrap: "wrap" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <MonoLabel>Base de conhecimento</MonoLabel>
          <h1 style={h1Style}>{state.docs.length} documentos na base</h1>
          <span style={{ color: "var(--n-400)" }}>Prazo de aging em vigor: <b style={{ fontFamily: "'IBM Plex Mono',monospace", fontWeight: 500 }}>120 dias</b> sem atualização.</span>
        </div>
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <div style={{ width: 200 }}><Select options={SORT_OPTIONS} value={state.sort} onChange={(e) => ws.setState({ sort: e.target.value })} size="sm" aria-label="Ordenação" /></div>
          <Button variant="secondary" icon="history" onClick={ws.uploadRfp}>Importar RFP passada</Button>
          <Button icon="upload" onClick={ws.uploadDocs}>Subir documentos</Button>
        </div>
      </div>
      <div style={card(14, { overflowX: "auto", overflowY: "hidden" })}>
        <div style={{ ...rowGrid, padding: "12px 20px", background: "var(--n-050)", borderBottom: "1px solid var(--n-200)", ...mono(11, "var(--n-400)"), letterSpacing: ".1em", textTransform: "uppercase" }}>
          <span>Documento</span><span>Tipo</span><span>Atualizado</span><span>Idade</span><span>Status</span><span>Enviado por</span><span>Ações</span>
        </div>
        {v.docs.map((d) => (
          <div key={d.id} style={{ ...rowGrid, padding: "14px 20px", borderTop: "1px solid var(--n-100)", alignItems: "center" }}>
            <div style={{ minWidth: 0 }}>
              <div style={{ ...mono(13), overflow: "hidden", textOverflow: "ellipsis" }}>{d.name}</div>
              <div style={{ fontSize: 12, color: "var(--n-400)", marginTop: 2 }}>{d.version}</div>
            </div>
            <span>{d.type}</span>
            <span style={mono(12, "inherit")}>{d.upd}</span>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 4 }}>
              <span style={mono(13)}>{d.ageText}</span>
              {d.old ? <Badge tone="danger" icon="clock">Mais de 120 dias</Badge> : null}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}><Badge tone={d.tone} icon={d.icon}>{d.statusText}</Badge></div>
            <span>{d.by}</span>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              {d.canRetry ? (
                <Tooltip content="Tentar novamente" placement="top">
                  <IconButton icon="refresh-cw" label="Tentar novamente" variant="outline" size="sm" onClick={d.retry} />
                </Tooltip>
              ) : null}
              <Tooltip content={d.toggleLabel} placement="top">
                <Switch checked={d.active} onChange={d.toggle} aria-label={d.toggleLabel} />
              </Tooltip>
            </div>
          </div>
        ))}
      </div>
    </Page>
  );
}
