import React from "react";
import { Button, Logo } from "../ds/index.js";

export function SiteHeader({ onPage, onWorkspace, tone = "paper" }) {
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
      <div style={{ maxWidth: "var(--page-max)", margin: "0 auto", padding: "var(--space-4) var(--page-pad)" }} className="tdr-site-header-row">
        <a href="#" onClick={(e) => { e.preventDefault(); onPage("home"); }} style={{ display: "flex", textDecoration: "none" }}>
          <Logo variant={inverse ? "ink" : "paper"} size={30} />
        </a>
        <nav className="tdr-site-header-nav" aria-label="Site">
          <Button size="sm" variant="secondary" icon="layout-grid" onClick={onWorkspace}><span><span className="tdr-site-ws-prefix">Produto · </span>Workspace</span></Button>
          <Button size="sm" variant={inverse ? "accent" : "primary"} onClick={() => onPage("precos")}>Preços</Button>
        </nav>
      </div>
    </header>
  );
}
