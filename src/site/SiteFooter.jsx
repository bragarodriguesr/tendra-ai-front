import React from "react";
import { Logo, MonoLabel } from "../ds/index.js";

const COLS = [
  { t: "Produto", items: ["Automação de RFP", "Base de respostas", "Trilha de auditoria", "Integrações"] },
  { t: "Confiança", items: ["Segurança", "SOC 2 Tipo II", "LGPD", "Status"] },
  { t: "Empresa", items: ["Sobre", "Clientes", "Carreiras", "Contato"] }
];

export function SiteFooter() {
  return (
    <footer style={{ background: "var(--surface-inverse)", color: "var(--text-on-inverse-body)" }}>
      <div style={{ maxWidth: "var(--page-max)", margin: "0 auto", padding: "var(--space-16) var(--page-pad) var(--space-8)", display: "grid", gap: "var(--space-12)" }}>
        <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1.4fr) repeat(3, minmax(0, 1fr))", gap: "var(--space-10)" }}>
          <div style={{ display: "grid", gap: "var(--space-4)", alignContent: "start" }}>
            <Logo variant="ink" size={30} />
            <p style={{ margin: 0, fontSize: "var(--text-sm-size)", lineHeight: 1.6, color: "var(--text-on-inverse-meta)", maxWidth: "34ch", textWrap: "pretty" }}>
              O cérebro comercial e técnico da sua operação de licitações e RFPs.
            </p>
          </div>
          {COLS.map((c) => (
            <div key={c.t} style={{ display: "grid", gap: "var(--space-3)", alignContent: "start" }}>
              <MonoLabel tone="inverse">{c.t}</MonoLabel>
              {c.items.map((i) => (
                <a key={i} href="#" style={{ fontSize: "var(--text-sm-size)", color: "var(--text-on-inverse-body)", textDecoration: "none" }}>{i}</a>
              ))}
            </div>
          ))}
        </div>
        <div style={{ borderTop: "1px solid var(--border-inverse)", paddingTop: "var(--space-5)", display: "flex", justifyContent: "space-between", gap: "var(--space-4)", flexWrap: "wrap" }}>
          <MonoLabel tone="inverse">© 2026 Tendra.ai · São Paulo</MonoLabel>
          <MonoLabel tone="inverse">brand@tendra.ai</MonoLabel>
        </div>
      </div>
    </footer>
  );
}
