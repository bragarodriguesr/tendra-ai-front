import React from "react";
import { Logo, TopBar } from "./ds/index.js";

/** Altura da barra superior, igual no site e no Workspace (padrão do TopBar do design system). */
export const BRAND_BAR_H = 64;

/**
 * Barra superior única do produto, em campo tinta: logo à esquerda, ações à direita.
 * O site e o Workspace usam a mesma barra, então trocar de visão não muda tamanho nem posição.
 */
export function BrandBar({ logoLabel, onLogo, leading, links, children }) {
  return (
    <TopBar
      tone="ink"
      className="tdr-brandbar"
      style={{ position: "sticky", top: 0, zIndex: 60, boxSizing: "border-box", height: BRAND_BAR_H, minHeight: BRAND_BAR_H, padding: "0 var(--brandbar-pad)", gap: "var(--space-4)" }}
      start={
        <>
          {leading}
          <a href="#" aria-label={logoLabel} className="tdr-logo-link" onClick={(e) => { e.preventDefault(); onLogo(); }} style={{ display: "flex", textDecoration: "none" }}>
            <Logo variant="ink" size={28} />
          </a>
          {links}
        </>
      }
      end={<div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>{children}</div>}
    />
  );
}
