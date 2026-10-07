import React from "react";
import { Badge, Button, Card, Icon, Input, Select } from "../ds/index.js";

const BULLETS = [
  "Rascunho de cada requisito com a fonte citada",
  "Fila de revisão com aprovação por especialista",
  "Base de respostas com controle de validade",
  "Conexão com os documentos que vocês já usam"
];
const label = { fontSize: 14, fontWeight: 500, color: "var(--text-on-inverse)" };

/** Contato: pedido de demonstração. O envio é simulado (o front ainda não tem API). */
export function ContactPage({ onPage }) {
  const [sent, setSent] = React.useState(false);
  return (
    <section style={{ background: "var(--surface-inverse)" }}>
      <div className="tdr-site-contact">
        <div style={{ display: "grid", gap: 32 }}>
          <div style={{ justifySelf: "start", paddingBottom: 8, borderBottom: "2px solid var(--brand-lime)", fontSize: 17, fontWeight: 600, color: "var(--text-on-inverse)" }}>Contato</div>
          <h1 className="tdr-site-contact-title">Veja a Tendra.ai respondendo uma RFP real</h1>
          <p style={{ margin: 0, fontSize: "var(--text-lead-size)", lineHeight: 1.6, color: "var(--ink-200)", maxWidth: "52ch", textWrap: "pretty" }}>
            30 minutos com uma RFP real e os seus próprios documentos. Na sessão, você acompanha:
          </p>
          <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "grid", gap: 14 }}>
            {BULLETS.map((b) => (
              <li key={b} style={{ display: "flex", gap: 12, alignItems: "center", fontSize: 17, color: "var(--n-075)" }}>
                <span style={{ color: "var(--brand-lime)", display: "flex" }}><Icon name="check" size={18} /></span>{b}
              </li>
            ))}
          </ul>
        </div>
        <div className="tdr-site-contact-form">
          {sent ? (
            <Card tone="ink-panel" radius="3xl" padding="lg">
              <div style={{ display: "grid", gap: 16 }} role="status">
                <div><Badge tone="approved-inverse" icon="check">Pedido recebido</Badge></div>
                <div style={{ fontSize: 17, lineHeight: 1.6, color: "var(--n-075)", textWrap: "pretty" }}>
                  Um especialista entra em contato em até 1 dia útil para marcar a sessão. Leve uma RFP real: a demo roda com os seus documentos.
                </div>
                <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                  <Button variant="accent" onClick={() => onPage("home")}>Voltar ao site</Button>
                </div>
              </div>
            </Card>
          ) : (
            <form onSubmit={(e) => { e.preventDefault(); setSent(true); }} style={{ display: "grid", gap: 24 }}>
              <div className="tdr-site-contact-row">
                <label htmlFor="ct-nome" style={{ display: "grid", gap: 8 }}><span style={label}>Nome</span><Input id="ct-nome" name="nome" required autoComplete="name" placeholder="Matheus Lima" /></label>
                <label htmlFor="ct-mail" style={{ display: "grid", gap: 8 }}><span style={label}>E-mail corporativo</span><Input id="ct-mail" name="email" type="email" required autoComplete="email" placeholder="matheus@empresa.com.br" /></label>
              </div>
              <label htmlFor="ct-tipo" style={{ display: "grid", gap: 8 }}><span style={label}>Que tipo de proposta vocês respondem?</span><Select id="ct-tipo" name="tipo" options={["Privado e público", "Só RFP privado", "Só licitação pública"]} /></label>
              <label htmlFor="ct-vol" style={{ display: "grid", gap: 8 }}><span style={label}>Volume por trimestre</span><Select id="ct-vol" name="volume" options={["Até 10 propostas", "10 a 40 propostas", "Mais de 40 propostas"]} /></label>
              <div style={{ display: "flex" }}><Button type="submit" size="lg" variant="accent" icon="calendar">Enviar pedido</Button></div>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}
