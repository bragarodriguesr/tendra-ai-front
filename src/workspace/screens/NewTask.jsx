import React from "react";
import { Badge, Button, Field, Icon, Input, MonoLabel, Select } from "../../ds/index.js";
import { ClickRow, DISPLAY, Page, card, h1Style, mono } from "../ui.jsx";
import { OWN, TODAY_ISO } from "../data.js";

export function NewTask({ v, ws, pad, isMobile }) {
  const f = v.form;
  const set = (k) => (e) => ws.setState((x) => ({ form: { ...x.form, [k]: e.target.value } }));
  const create = () => {
    const ok = f.file && f.name && f.company && f.due && f.due >= TODAY_ISO && f.owner;
    ws.setState((x) => ({ form: { ...x.form, tried: true, identified: !!ok } }));
    if (!f.file) ws.toast("Nenhum arquivo", "Selecione a lista de perguntas para continuar.", "danger");
  };
  return (
    <Page max={760} pad={pad} gap={28}>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <MonoLabel>Nova RFP/Questionário</MonoLabel>
        <h1 style={h1Style}>Importe a lista de perguntas.</h1>
      </div>
      {f.smallBase ? <div style={card(12, { padding: "12px 16px" })}>Sua base ainda é pequena. Os itens tendem a ficar sem contexto, mas você pode continuar.</div> : null}
      {!f.identified ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <ClickRow className="" onClick={() => ws.setState((x) => ({ form: { ...x.form, file: true } }))} style={{ border: "1px dashed var(--n-350)", borderRadius: 16, background: "var(--n-000)", padding: 28, display: "flex", alignItems: "center", gap: 16 }}>
            <Icon name={f.file ? "file-text" : "upload"} size="xl" />
            <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <span style={{ ...mono(14), fontWeight: 600 }}>{f.file ? "Perguntas_Meridian.xlsx" : "Selecionar planilha ou documento de perguntas"}</span>
              <span style={{ fontSize: 13, color: "var(--n-400)" }}>Planilha, documento, apresentação ou arquivo do Google.</span>
            </div>
          </ClickRow>
          <Field label="Nome" required error={f.errName} htmlFor="nt-name"><Input id="nt-name" value={f.name} onChange={set("name")} invalid={!!f.errName} /></Field>
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "minmax(0,1fr)" : "1fr 1fr", gap: 20 }}>
            <Field label="Empresa" required error={f.errCompany} htmlFor="nt-company"><Input id="nt-company" value={f.company} placeholder="Empresa que enviou o edital" onChange={set("company")} invalid={!!f.errCompany} /></Field>
            <Field label="Tipo" required htmlFor="nt-type"><Select id="nt-type" options={["RFP", "RFI"]} value={f.type} onChange={set("type")} /></Field>
            <Field label="Prazo de submissão" required error={f.errDue} htmlFor="nt-due"><Input id="nt-due" type="date" value={f.due} onChange={set("due")} invalid={!!f.errDue} /></Field>
            <Field label="Responsável" required error={f.errOwner} htmlFor="nt-owner"><Select id="nt-owner" options={OWN} placeholder="Escolha um usuário" value={f.owner} onChange={set("owner")} invalid={!!f.errOwner} /></Field>
          </div>
          <div style={{ display: "flex", gap: 12 }}>
            <Button onClick={create}>Importar perguntas</Button>
            <Button variant="ghost" onClick={() => ws.go("tasks")}>Cancelar</Button>
          </div>
        </div>
      ) : (
        <div style={card(16, { padding: 32, display: "flex", flexDirection: "column", gap: 16 })}>
          <div><Badge tone="approved" icon="check">Processamento concluído</Badge></div>
          <div style={{ fontFamily: DISPLAY, fontWeight: 600, fontSize: 28, letterSpacing: "-.02em", color: "var(--n-900)" }}>Identificamos 12 perguntas.</div>
          <div style={{ color: "var(--n-400)" }}>O texto original de cada item continua visível na revisão.</div>
          <div><Button iconEnd="arrow-right" onClick={() => ws.go("review")}>Abrir revisão</Button></div>
        </div>
      )}
    </Page>
  );
}
