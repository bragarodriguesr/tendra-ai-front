import React from "react";
import { Badge, Button, Field, Icon, IconButton, Input, MonoLabel, Select } from "../../ds/index.js";
import { ClickRow, DISPLAY, Page, card, h1Style, mono } from "../ui.jsx";
import { OWN, TODAY_ISO } from "../data.js";
import { newContact } from "../useWorkspace.js";

// máscaras: 00.000.000/0000-00 e (00) 00000-0000
const maskCnpj = (v) => {
  const d = v.replace(/\D/g, "").slice(0, 14);
  return d.replace(/^(\d{2})(\d)/, "$1.$2").replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3").replace(/\.(\d{3})(\d)/, ".$1/$2").replace(/(\d{4})(\d)/, "$1-$2");
};
const maskPhone = (v) => {
  const d = v.replace(/\D/g, "").slice(0, 11);
  if (d.length <= 2) return d.length ? "(" + d : "";
  const rest = d.slice(2), cut = d.length === 11 ? 5 : 4;
  return `(${d.slice(0, 2)}) ${rest.slice(0, cut)}${rest.length > cut ? "-" + rest.slice(cut) : ""}`;
};

function ContactCard({ ct, index, total, tried, isMobile, onChange, onRemove }) {
  const id = (k) => `nt-ct-${ct.id}-${k}`;
  const set = (k, mask) => (e) => onChange({ [k]: mask ? mask(e.target.value) : e.target.value });
  return (
    <div role="group" aria-label={`Contato ${index + 1}`} style={card(14, { padding: isMobile ? 16 : 20, display: "flex", flexDirection: "column", gap: 16 })}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
        <MonoLabel>Contato {index + 1}</MonoLabel>
        {total > 1 ? <IconButton icon="trash-2" size="sm" label={`Remover contato ${index + 1}`} onClick={onRemove} /> : null}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "minmax(0,1fr)" : "1fr 1fr", gap: 16, alignItems: "start" }}>
        <Field label="Nome" htmlFor={id("name")}><Input id={id("name")} value={ct.name} autoComplete="off" onChange={set("name")} /></Field>
        <Field label="Cargo" htmlFor={id("role")}><Input id={id("role")} value={ct.role} placeholder="Ex.: Gerente de compras" onChange={set("role")} /></Field>
        <Field label="Telefone" htmlFor={id("phone")} error={tried ? ct.errPhone : null}>
          <Input id={id("phone")} type="tel" inputMode="tel" value={ct.phone} placeholder="(00) 00000-0000" onChange={set("phone", maskPhone)} invalid={tried && !!ct.errPhone} />
        </Field>
        <Field label="E-mail" htmlFor={id("email")} error={tried ? ct.errEmail : null}>
          <Input id={id("email")} type="email" value={ct.email} placeholder="nome@empresa.com.br" onChange={set("email")} invalid={tried && !!ct.errEmail} />
        </Field>
      </div>
    </div>
  );
}

export function NewTask({ v, ws, pad, isMobile }) {
  const f = v.form;
  const set = (k) => (e) => ws.setState((x) => ({ form: { ...x.form, [k]: e.target.value } }));
  const setContacts = (fn) => ws.setState((x) => ({ form: { ...x.form, contacts: fn(x.form.contacts) } }));
  const create = () => {
    const ok = f.file && f.name && f.company && f.due && f.due >= TODAY_ISO && f.owner && !f.hasErrors;
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
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "minmax(0,1fr)" : "1fr 1fr", gap: 20, alignItems: "start" }}>
            <Field label="Empresa" required error={f.errCompany} htmlFor="nt-company"><Input id="nt-company" value={f.company} placeholder="Empresa que enviou o edital" onChange={set("company")} invalid={!!f.errCompany} /></Field>
            <Field label="CNPJ" error={f.errCnpj} htmlFor="nt-cnpj">
              <Input id="nt-cnpj" mono inputMode="numeric" value={f.cnpj} placeholder="00.000.000/0000-00" onChange={(e) => ws.setState((x) => ({ form: { ...x.form, cnpj: maskCnpj(e.target.value) } }))} invalid={!!f.errCnpj} />
            </Field>
            <Field label="Tipo" required htmlFor="nt-type"><Select id="nt-type" options={["RFP", "RFI"]} value={f.type} onChange={set("type")} /></Field>
            <Field label="Prazo de submissão" required error={f.errDue} htmlFor="nt-due"><Input id="nt-due" type="date" value={f.due} onChange={set("due")} invalid={!!f.errDue} /></Field>
            <Field label="Responsável" required error={f.errOwner} htmlFor="nt-owner"><Select id="nt-owner" options={OWN} placeholder="Escolha um usuário" value={f.owner} onChange={set("owner")} invalid={!!f.errOwner} /></Field>
          </div>
          <section aria-labelledby="nt-contacts-title" style={{ display: "flex", flexDirection: "column", gap: 16, paddingTop: 8 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <h2 id="nt-contacts-title" style={{ margin: 0, fontFamily: DISPLAY, fontWeight: 600, fontSize: 20, color: "var(--n-900)" }}>Contatos da empresa</h2>
              <span style={{ fontSize: 13, color: "var(--n-400)" }}>Quem acompanha esta proposta do lado do cliente. Opcional.</span>
            </div>
            {f.contacts.map((ct, i) => (
              <ContactCard
                key={ct.id} ct={ct} index={i} total={f.contacts.length} tried={f.tried} isMobile={isMobile}
                onChange={(patch) => setContacts((list) => list.map((x) => (x.id === ct.id ? { ...x, ...patch } : x)))}
                onRemove={() => setContacts((list) => list.filter((x) => x.id !== ct.id))}
              />
            ))}
            <div><Button variant="secondary" icon="plus" onClick={() => setContacts((list) => [...list, newContact()])}>Adicionar contato</Button></div>
          </section>
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
