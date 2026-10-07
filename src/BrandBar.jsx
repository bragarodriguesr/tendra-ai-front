import React from "react";
import { AnimatedLogo, Logo, TopBar } from "./ds/index.js";

/** Altura da barra superior, igual no site e no Workspace (padrão do TopBar do design system). */
export const BRAND_BAR_H = 64;

// O SVG do logo animado tem proporção 224×48: 131px de largura dão 28px de altura,
// a mesma do símbolo no logo estático.
const ANIMATED_LOGO_W = 131;

/**
 * Barra superior única do produto, em campo tinta: logo à esquerda, ações à direita.
 * O site e o Workspace usam a mesma barra, então trocar de visão não muda tamanho nem posição.
 */
export function BrandBar({ logoLabel, onLogo, leading, links, animatedLogo = false, children }) {
  return (
    <TopBar
      tone="ink"
      className="tdr-brandbar"
      style={{ position: "sticky", top: 0, zIndex: 60, boxSizing: "border-box", height: BRAND_BAR_H, minHeight: BRAND_BAR_H, padding: "0 var(--brandbar-pad)", gap: "var(--space-4)" }}
      start={
        <>
          {leading}
          <a href="#" aria-label={logoLabel} className="tdr-logo-link" onClick={(e) => { e.preventDefault(); onLogo(); }} style={{ display: "flex", textDecoration: "none" }}>
            {animatedLogo
              // Toca uma vez ao abrir e fica completo: em loop o logo some a cada 6 s.
              ? <AnimatedLogo variant="ink" bare once style={{ width: ANIMATED_LOGO_W }} />
              : <Logo variant="ink" size={28} />}
          </a>
          {links}
        </>
      }
      end={<div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>{children}</div>}
    />
  );
}
