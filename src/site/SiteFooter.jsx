import React from "react";
import { Logo, MonoLabel } from "../ds/index.js";

export function SiteFooter() {
  return (
    <footer style={{ background: "var(--surface-inverse)", color: "var(--text-on-inverse-body)" }}>
      <div style={{ maxWidth: "var(--page-max)", margin: "0 auto", padding: "var(--space-16) var(--page-pad) var(--space-8)", display: "grid", gap: "var(--space-12)" }}>
        <div style={{ display: "grid", gap: "var(--space-4)", alignContent: "start" }}>
          <Logo variant="ink" size={30} />
          <p style={{ margin: 0, fontSize: "var(--text-sm-size)", lineHeight: 1.6, color: "var(--text-on-inverse-meta)", maxWidth: "34ch", textWrap: "pretty" }}>
            O cérebro comercial e técnico da sua operação de licitações e RFPs.
          </p>
        </div>
        <div style={{ borderTop: "1px solid var(--border-inverse)", paddingTop: "var(--space-5)", display: "flex", justifyContent: "space-between", gap: "var(--space-4)", flexWrap: "wrap" }}>
          <MonoLabel tone="inverse">© 2026 Tendra.ai · São Paulo</MonoLabel>
          <MonoLabel tone="inverse">brand@tendra.ai</MonoLabel>
        </div>
      </div>
    </footer>
  );
}
