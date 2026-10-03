import React from "react";
import { Logo } from "../components/core/Logo.jsx";
import { Button } from "../components/core/Button.jsx";

const LINKS = ["Produto", "Preços"];

export function SiteHeader({ page, onPage, tone = "paper" }) {
  const inverse = tone === "ink";
  return (
    <header
      style={{
        position: "sticky",
        top: 0,
        zIndex: 20,
        background: inverse ? "var(--surface-inverse)" : "var(--surface-card)",
        borderBottom: inverse ? "1px solid var(--border-inverse)" : "1px solid var(--border-default)"
      }}
    >
      <div style={{ maxWidth: "var(--page-max)", margin: "0 auto", padding: "var(--space-4) var(--page-pad)", display: "flex", alignItems: "center", gap: "var(--space-8)" }}>
        <a href="#" onClick={(e) => { e.preventDefault(); onPage("home"); }} style={{ display: "flex", textDecoration: "none" }}>
          <Logo variant={inverse ? "ink" : "paper"} size={30} />
        </a>
        <nav style={{ display: "flex", alignItems: "center", gap: "var(--space-6)", marginLeft: "auto" }}>
          {LINKS.map((l) => {
            const key = l === "Segurança" ? "seguranca" : l === "Preços" ? "precos" : "home";
            const on = page === key && key !== "home";
            return (
              <a
                key={l}
                href="#"
                onClick={(e) => { e.preventDefault(); onPage(key); }}
                style={{
                  fontSize: "var(--text-ui-size)",
                  fontWeight: on ? "var(--weight-semibold)" : "var(--weight-regular)",
                  color: inverse ? "var(--text-on-inverse-body)" : on ? "var(--text-strong)" : "var(--text-body)",
                  textDecoration: "none"
                }}
              >
                {l}
              </a>
            );
          })}
          <Button size="sm" variant={inverse ? "accent" : "primary"}>Falar com vendas</Button>
        </nav>
      </div>
    </header>
  );
}
